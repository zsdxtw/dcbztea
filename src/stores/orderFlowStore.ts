/**
 * 外部平台订单流转 Store（管理端 ↔ 合作商终端共享）
 *
 * 状态机：
 * pending 待处理 ─ 报备匹配 → report_matched（人工确认 / 自动转设置）→ transferred
 *              ├ 自营背对背：self_purchasing → self_inbound → self_outbound → completed
 *              └ 分发：assign 指定 → transferred ｜ grab 抢单（时间优先）→ transferred
 *                      ｜ compare 比单（报价+积分+履约评分）→ transferred
 * transferred →（合作商履约链 accepted/shipping/delivered）→ settled → completed（结算写积分）
 */
import { create } from 'zustand';
import type {
  ExternalOrder, ExternalOrderItem, ExternalPlatform, FlowSettings, PartnerOrder,
  PartnerOrderStatus, PlatformOrder, ReportMatchInfo, TransferSource,
} from '../types';
import { externalOrderSeeds } from '../data/externalOrders';
import { matchesReport, useReportStore } from './reportStore';
import { useSupplierStore } from './supplierStore';
import { usePriceStore } from './priceStore';
import { useScoreStore, getScoreSummary } from './scoreStore';

const now = () => new Date().toISOString().slice(0, 10);
const nowTs = () => Date.now();

/** 生成外部订单编号：WB + 日期 + 3 位序号（同日递增） */
const genOrderCode = (orders: ExternalOrder[]): string => {
  const dateKey = now().replace(/-/g, '');
  const seq = orders.filter((o) => o.code.includes(dateKey)).length + 1;
  return `WB${dateKey}${String(seq).padStart(3, '0')}`;
};

/** 外部订单 → 平台订单结构（复用报备匹配逻辑） */
const toPlatformOrder = (o: ExternalOrder): PlatformOrder => ({
  id: o.id,
  code: o.code,
  customerName: o.customerName,
  customerType: o.customerType,
  customerRegion: o.customerRegion,
  items: o.items.map((it) => ({ productName: it.productName, spec: it.spec, quantity: it.quantity, price: it.price })),
  totalAmount: o.totalAmount,
  deliveryMode: 'direct',
  coopMode: 'supplier',
  orderDate: o.entryTime,
  expectedShipDate: o.entryTime,
  receiver: o.receiver,
  receiverPhone: o.receiverPhone,
  receiverAddress: o.receiverAddress,
  remark: o.remark,
});

/** 录入后立即匹配审批通过的报备（复用 reportStore.matchesReport） */
export function matchExternalOrder(order: ExternalOrder): ReportMatchInfo[] {
  const reports = useReportStore.getState().reports.filter((r) => r.status === 'approved');
  const suppliers = useSupplierStore.getState().suppliers;
  return reports
    .filter((r) => matchesReport(toPlatformOrder(order), r))
    .map((r) => ({
      reportCode: r.code,
      reportType: r.type,
      partnerId: suppliers.find((s) => s.name === r.partnerName)?.id,
      partnerName: r.partnerName,
    }));
}

export interface AddExternalInput {
  platform: ExternalPlatform;
  externalOrderNo: string;
  customerName: string;
  customerType: string;
  customerRegion: string;
  items: ExternalOrderItem[];
  receiver: string;
  receiverPhone: string;
  receiverAddress: string;
  remark?: string;
  operator?: string;
}

interface OrderFlowState {
  orders: ExternalOrder[];
  settings: FlowSettings;

  /* ── 录入与报备匹配 ── */
  addExternalOrder: (input: AddExternalInput) => ExternalOrder;
  confirmReportTransfer: (id: string) => { ok: boolean; msg: string };
  ignoreReportMatch: (id: string) => void;

  /* ── 自营背对背 ── */
  chooseSelf: (id: string, supplierId: string, supplierName: string) => void;
  selfInbound: (id: string) => void;
  selfOutbound: (id: string) => void;
  selfComplete: (id: string) => void;

  /* ── 分发：指定 / 抢单 / 比单 ── */
  assignPartner: (id: string, supplierId: string, supplierName: string) => void;
  publishGrab: (id: string) => void;
  tryGrab: (id: string, supplierId: string, supplierName: string) => { ok: boolean; msg: string };
  startCompare: (id: string, candidates: { supplierId: string; supplierName: string }[]) => { ok: boolean; msg: string };
  submitQuote: (id: string, supplierId: string, supplierName: string, amount: number) => { ok: boolean; msg: string };
  finalizeCompare: (id: string, force?: boolean) => { ok: boolean; msg: string };
  expireGrabs: () => void;

  /* ── 履约与结算 ── */
  advancePartner: (id: string, status: PartnerOrderStatus, opts?: { onTime?: boolean }) => void;

  /* ── 设置 ── */
  updateSettings: (patch: Partial<FlowSettings>) => void;
}

export const useOrderFlowStore = create<OrderFlowState>((set, get) => {
  /** 内部：更新单笔订单并追加轨迹 */
  const patchOrder = (id: string, patch: Partial<ExternalOrder>, history?: { action: string; detail?: string }) => {
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === id
          ? { ...o, ...patch, history: history ? [...o.history, { time: now(), ...history }] : o.history }
          : o,
      ),
    }));
  };

  /** 内部：转出合作商（报备/指定/抢单/比单共用） */
  const transfer = (id: string, supplierId: string, supplierName: string, source: TransferSource, detail: string) => {
    patchOrder(id, {
      processStatus: 'transferred',
      path: 'distribute',
      partnerId: supplierId,
      partnerName: supplierName,
      transferSource: source,
      transferTime: now(),
      partnerStatus: 'pending',
    }, { action: source === 'report' ? '确认转出' : source === 'assign' ? '指定分发' : source === 'grab' ? '抢单中单' : '比单中单', detail: `${detail} → ${supplierName}` });
  };

  return {
    orders: externalOrderSeeds,
    settings: {
      autoTransfer: false,
      grabMinutes: 30,
      compareMinutes: 30,
      compareWeights: { quote: 4, score: 4, ontime: 2 },
    },

    /* ── 录入与报备匹配 ── */
    addExternalOrder: (input) => {
      const orders = get().orders;
      const order: ExternalOrder = {
        id: `eo_${nowTs()}`,
        code: genOrderCode(orders),
        ...input,
        operator: input.operator || '运营人员',
        totalAmount: input.items.reduce((s, it) => s + it.price * it.quantity, 0),
        entryTime: now(),
        processStatus: 'pending',
        history: [{ time: now(), action: '录入外部订单', detail: '手工录入' }],
      };
      // 录入即检：匹配审批通过的报备
      const matches = matchExternalOrder(order);
      if (matches.length > 0) {
        order.reportMatches = matches;
        order.processStatus = 'report_matched';
        order.history.push({ time: now(), action: '报备匹配', detail: `命中 ${matches.map((m) => m.reportCode).join('、')}` });
        // 自动转单开关（系统设置可开）：命中即自动转出首家
        if (get().settings.autoTransfer && matches[0]?.partnerId) {
          order.processStatus = 'transferred';
          order.path = 'distribute';
          order.partnerId = matches[0].partnerId;
          order.partnerName = matches[0].partnerName;
          order.transferSource = 'report';
          order.transferTime = now();
          order.partnerStatus = 'pending';
          order.history.push({ time: now(), action: '自动转单', detail: `系统自动转出 → ${matches[0].partnerName}` });
        }
      }
      set({ orders: [order, ...orders] });
      return order;
    },

    confirmReportTransfer: (id) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order || order.processStatus !== 'report_matched') return { ok: false, msg: '订单不在报备命中状态' };
      const match = order.reportMatches?.find((m) => m.partnerId);
      if (!match?.partnerId) return { ok: false, msg: '命中报备未关联合作商档案，请改用指定分发' };
      transfer(id, match.partnerId, match.partnerName, 'report', `按报备 ${match.reportCode} 转出`);
      return { ok: true, msg: `已转出至 ${match.partnerName}` };
    },

    ignoreReportMatch: (id) => {
      patchOrder(id, { reportIgnored: true, processStatus: 'pending' }, { action: '忽略报备命中', detail: '运营选择自选路径继续处理' });
    },

    /* ── 自营背对背（以销定采） ── */
    chooseSelf: (id, supplierId, supplierName) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return;
      const rules = usePriceStore.getState().purchaseRules;
      // 按采购价规则取采购价，无规则时按销售价 55% 估算（mock）
      const purchaseAmount = order.items.reduce((s, it) => {
        const rule = rules.find((r) => r.productId === it.productId && r.status === 'active');
        return s + it.quantity * (rule?.purchasePrice ?? Math.round(it.price * 0.55));
      }, 0);
      const seq = get().orders.filter((o) => o.selfChain).length + 1;
      patchOrder(id, {
        path: 'self',
        processStatus: 'self_purchasing',
        selfChain: {
          purchaseOrderCode: `WB-CG-${String(seq).padStart(3, '0')}`,
          supplierId,
          supplierName,
          purchaseAmount,
          purchaseDate: now(),
        },
      }, { action: '选择自营路径', detail: `背对背采购 · ${supplierName} · ¥${purchaseAmount.toLocaleString()}` });
    },

    selfInbound: (id) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order?.selfChain) return;
      patchOrder(id, {
        processStatus: 'self_inbound',
        selfChain: { ...order.selfChain, inboundCode: order.selfChain.purchaseOrderCode.replace('CG', 'RK'), inboundDate: now() },
      }, { action: '到货入库', detail: '采购到货验收入库' });
    },

    selfOutbound: (id) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order?.selfChain) return;
      patchOrder(id, {
        processStatus: 'self_outbound',
        selfChain: { ...order.selfChain, outboundCode: order.selfChain.purchaseOrderCode.replace('CG', 'CK'), outboundDate: now() },
      }, { action: '出库发货', detail: '销售出库 · 安排发运' });
    },

    selfComplete: (id) => {
      patchOrder(id, { processStatus: 'completed' }, { action: '自营订单完成', detail: '客户已签收' });
    },

    /* ── 分发：指定 ── */
    assignPartner: (id, supplierId, supplierName) => {
      transfer(id, supplierId, supplierName, 'assign', '运营指定分发');
    },

    /* ── 分发：抢单（时间优先） ── */
    publishGrab: (id) => {
      const minutes = get().settings.grabMinutes;
      patchOrder(id, {
        path: 'distribute',
        distributeMode: 'grab',
        processStatus: 'grabbing',
        grabDeadline: nowTs() + minutes * 60 * 1000,
        grabRecords: [],
      }, { action: '发布抢单', detail: `已推送合作商抢单大厅 · ${minutes} 分钟内先到先得` });
    },

    tryGrab: (id, supplierId, supplierName) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order || order.processStatus !== 'grabbing') return { ok: false, msg: '该订单抢单已结束' };
      if (order.grabDeadline && nowTs() > order.grabDeadline) {
        patchOrder(id, { processStatus: 'pending', distributeMode: undefined }, { action: '抢单超时', detail: '无人抢购，退回待处理' });
        return { ok: false, msg: '抢单已超时结束' };
      }
      if ((order.grabRecords?.length ?? 0) > 0) {
        return { ok: false, msg: `手慢了，已被 ${order.grabRecords![0].supplierName} 抢先` };
      }
      patchOrder(id, {
        grabRecords: [{ supplierId, supplierName, grabTime: new Date().toISOString().slice(0, 16).replace('T', ' '), ts: nowTs() }],
      });
      transfer(id, supplierId, supplierName, 'grab', `抢单成功（时间优先）`);
      return { ok: true, msg: '抢单成功！订单已转入您的名下' };
    },

    /* ── 分发：比单（报价 + 积分 + 履约 综合评分） ── */
    startCompare: (id, candidates) => {
      if (candidates.length < 2) return { ok: false, msg: '比单至少邀请 2 家合作商' };
      const minutes = get().settings.compareMinutes;
      patchOrder(id, {
        path: 'distribute',
        distributeMode: 'compare',
        processStatus: 'comparing',
        compare: {
          candidates,
          deadline: nowTs() + minutes * 60 * 1000,
          quotes: [],
          scored: false,
        },
      }, { action: '发起比单', detail: `邀请 ${candidates.length} 家合作商报价（报价/积分/履约权重见流转设置）` });
      return { ok: true, msg: '比单已发起，等待合作商报价' };
    },

    submitQuote: (id, supplierId, supplierName, amount) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order?.compare || order.processStatus !== 'comparing') return { ok: false, msg: '比单已结束' };
      if (!order.compare.candidates.some((c) => c.supplierId === supplierId)) return { ok: false, msg: '您不在该比单候选名单中' };
      if (order.compare.quotes.some((q) => q.supplierId === supplierId)) return { ok: false, msg: '您已提交过报价' };
      if (nowTs() > order.compare.deadline) return { ok: false, msg: '报价已截止' };
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === id && o.compare
            ? { ...o, compare: { ...o.compare, quotes: [...o.compare.quotes, { supplierId, supplierName, amount, quoteTime: new Date().toISOString().slice(0, 16).replace('T', ' ') }] } }
            : o,
        ),
      }));
      return { ok: true, msg: '报价已提交' };
    },

    finalizeCompare: (id, force = false) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order?.compare || order.processStatus !== 'comparing') return { ok: false, msg: '订单不在比单报价中' };
      const cmp = order.compare;
      if (cmp.scored) return { ok: false, msg: '该比单已定标' };
      if (cmp.quotes.length === 0) return { ok: false, msg: '暂无合作商报价，无法评分' };
      if (!force && nowTs() < cmp.deadline) return { ok: false, msg: '报价未截止（可强制定标）' };

      const { quote: wq, score: ws, ontime: wo } = get().settings.compareWeights;
      const entries = useScoreStore.getState().entries;
      const summaries = cmp.candidates.map((c) => getScoreSummary(entries, c.supplierId, c.supplierName));
      const maxTotal = Math.max(...summaries.map((s) => s.total), 1);
      const minQuote = Math.min(...cmp.quotes.map((q) => q.amount));

      const scores: Record<string, { quoteScore: number; scoreScore: number; ontimeScore: number; total: number }> = {};
      for (const q of cmp.quotes) {
        const summary = summaries.find((s) => s.supplierId === q.supplierId);
        const quoteScore = Math.round((minQuote / q.amount) * 100);
        const scoreScore = Math.round(((summary?.total ?? 60) / maxTotal) * 100);
        const ontimeScore = summary?.ontimeRate ?? 88;
        const total = Math.round(((quoteScore * wq + scoreScore * ws + ontimeScore * wo) / (wq + ws + wo)) * 10) / 10;
        scores[q.supplierId] = { quoteScore, scoreScore, ontimeScore, total };
      }
      const winner = [...cmp.quotes].sort((a, b) => scores[b.supplierId].total - scores[a.supplierId].total)[0];

      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === id
            ? {
                ...o,
                compare: { ...cmp, scored: true, scores, winnerId: winner.supplierId },
                processStatus: 'transferred',
                path: 'distribute',
                partnerId: winner.supplierId,
                partnerName: winner.supplierName,
                transferSource: 'compare',
                transferTime: now(),
                partnerStatus: 'pending',
                history: [...o.history, { time: now(), action: '比单定标', detail: `${winner.supplierName} 综合得分 ${scores[winner.supplierId].total} 中单` }],
              }
            : o,
        ),
      }));
      return { ok: true, msg: `${winner.supplierName} 中单（综合得分 ${scores[winner.supplierId].total}）` };
    },

    expireGrabs: () => {
      const expired = get().orders.filter((o) => o.processStatus === 'grabbing' && o.grabDeadline && nowTs() > o.grabDeadline);
      if (expired.length === 0) return;
      set((s) => ({
        orders: s.orders.map((o) =>
          expired.some((e) => e.id === o.id)
            ? { ...o, processStatus: 'pending', distributeMode: undefined, history: [...o.history, { time: now(), action: '抢单超时', detail: '无人抢购，退回待处理' }] }
            : o,
        ),
      }));
    },

    /* ── 履约与结算（结算写积分台账） ── */
    advancePartner: (id, status, opts) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return;
      const actionLabels: Partial<Record<PartnerOrderStatus, string>> = {
        accepted: '合作商接单',
        shipping: '合作商发货',
        delivered: '客户签收',
        settled: '结算完成',
      };
      if (status === 'settled') {
        const onTime = opts?.onTime ?? true;
        patchOrder(id, { partnerStatus: 'settled', processStatus: 'completed', settleOnTime: onTime }, { action: '结算完成', detail: onTime ? '按时履约 · 积分 +5' : '超时发货 · 积分 -5' });
        if (order.partnerId && order.partnerName) {
          useScoreStore.getState().addEntry({
            supplierId: order.partnerId,
            supplierName: order.partnerName,
            dimension: 'fulfillment',
            delta: onTime ? 5 : -5,
            reason: onTime ? `订单按时履约结算（${order.code}）` : `订单超时发货（${order.code}）`,
            refCode: order.code,
            operator: '管理员',
          });
        }
        return;
      }
      patchOrder(id, { partnerStatus: status }, { action: actionLabels[status] ?? '履约推进' });
    },

    /* ── 设置 ── */
    updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
  };
});

/* ── 合作商终端视图：外部订单流转生成的合作商订单 ── */

const TRANSFER_KIND_MAP: Record<string, 'order-self' | 'product' | 'customer' | 'assign' | 'grab' | 'compare'> = {
  report: 'order-self',
  assign: 'assign',
  grab: 'grab',
  compare: 'compare',
};

/** 某合作商名下的外部流转订单（映射为合作商订单结构，合作商终端展示） */
export function getPartnerFlowOrders(supplierId: string): PartnerOrder[] {
  return useOrderFlowStore
    .getState()
    .orders.filter((o) => o.partnerId === supplierId && (o.processStatus === 'transferred' || o.processStatus === 'completed'))
    .map((o) => ({
      id: `ext_${o.id}`,
      code: o.code,
      customerName: o.customerName,
      customerType: o.customerType,
      items: o.items.map((it) => ({ productName: it.productName, spec: it.spec, quantity: it.quantity, price: it.price })),
      totalAmount: o.totalAmount,
      deliveryMode: 'direct' as const,
      coopMode: 'supplier' as const,
      status: o.partnerStatus ?? ('pending' as const),
      orderDate: o.entryTime,
      expectedShipDate: o.entryTime,
      receiver: o.receiver,
      receiverPhone: o.receiverPhone,
      receiverAddress: o.receiverAddress,
      remark: o.remark,
      sourceReport: o.transferSource === 'report' ? o.reportMatches?.[0]?.reportCode : undefined,
      transferKind: o.transferSource ? TRANSFER_KIND_MAP[o.transferSource] : undefined,
    }));
}

/** 采购价参考（自营选供应商时展示） */
export function getSelfPurchaseEstimate(items: ExternalOrderItem[]): { supplierId: string; supplierName: string; amount: number }[] {
  const { suppliers } = useSupplierStore.getState();
  const rules = usePriceStore.getState().purchaseRules;
  return suppliers
    .filter((s) => s.status === 'active')
    .map((s) => ({
      supplierId: s.id,
      supplierName: s.name,
      amount: items.reduce((sum, it) => {
        const rule = rules.find((r) => r.productId === it.productId && r.supplierId === s.id && r.status === 'active');
        return sum + it.quantity * (rule?.purchasePrice ?? Math.round(it.price * 0.55));
      }, 0),
    }))
    .sort((a, b) => a.amount - b.amount);
}
