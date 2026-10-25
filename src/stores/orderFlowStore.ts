/**
 * 订单处理（销售订单入口）流转 Store（管理端 ↔ 合作商终端共享）
 *
 * 状态机：
 * pending 待处理（手工录入 / 直连推送）─ 命中报备直接自动转出 → distribute_pending
 *   ├ 自营：self_pending 自营待接单（管理后台在销售订单-流转订单接单，填跟单人）→ processed → completed
 *   └ 分发：指定 → distribute_pending；抢单 grabbing（时间优先）；比单 comparing（公开报名制，底价限制）
 *            抢单/比单结束（或管理台直接选定）→ distribute_pending
 * distribute_pending 分发待接单（合作商终端接单）→ processed（accepted/shipping/delivered）→ settled → completed
 * 待接单（自营/分发）订单可「重新流转」回待处理；已接单订单重新流转需二次确认（页面弹窗提醒）
 */
import { create } from 'zustand';
import type {
  CompareFloorRule, ExternalOrder, ExternalOrderItem, ExternalPlatform, FlowSettings, PartnerOrder,
  PartnerOrderStatus, PlatformOrder, ReportMatchInfo, TransferSource,
} from '../types';
import { externalOrderSeeds } from '../data/externalOrders';
import { matchesReport, useReportStore } from './reportStore';
import { useSupplierStore } from './supplierStore';
import { usePriceStore } from './priceStore';
import { useScoreStore, getScoreSummary } from './scoreStore';

const now = () => new Date().toISOString().slice(0, 10);
const nowTs = () => Date.now();
const nowMin = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

/** 生成订单编号：WB + 日期 + 3 位序号（同日递增） */
const genOrderCode = (orders: ExternalOrder[]): string => {
  const dateKey = now().replace(/-/g, '');
  const seq = orders.filter((o) => o.code.includes(dateKey)).length + 1;
  return `WB${dateKey}${String(seq).padStart(3, '0')}`;
};

/** 订单 → 平台订单结构（复用报备匹配逻辑） */
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

/** 匹配审批通过的报备（复用 reportStore.matchesReport） */
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

/** 比单底价金额 */
const floorAmount = (totalAmount: number, rule: CompareFloorRule) =>
  rule.type === 'discount' ? Math.round(totalAmount * rule.value) / 100 : rule.value;

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
  sourceChannel?: 'manual' | 'push';
}

interface OrderFlowState {
  orders: ExternalOrder[];
  settings: FlowSettings;

  /* ── 录入 / 删除 / 修改 ── */
  addExternalOrder: (input: AddExternalInput) => ExternalOrder;
  /** 删除订单（仅手工录入的待处理订单） */
  deleteOrder: (id: string) => { ok: boolean; msg: string };
  /** 修改订单信息（待处理/待接单/抢单中/比单中可改） */
  updateOrder: (id: string, patch: Partial<Pick<ExternalOrder, 'externalOrderNo' | 'customerName' | 'customerType' | 'customerRegion' | 'receiver' | 'receiverPhone' | 'receiverAddress' | 'remark' | 'items'>>) => { ok: boolean; msg: string };

  /* ── 路径选择与流转 ── */
  chooseSelfPath: (id: string) => void;
  assignPartner: (id: string, supplierId: string, supplierName: string) => void;
  /** 重新流转：退回待处理重新选择路径 */
  resetToPending: (id: string, note?: string) => void;

  /* ── 自营执行 ── */
  acceptSelfOrder: (id: string, input: { supplierId: string; supplierName: string; follower?: string }) => { ok: boolean; msg: string };
  selfInbound: (id: string) => void;
  selfOutbound: (id: string) => void;
  selfComplete: (id: string) => void;

  /* ── 抢单 ── */
  publishGrab: (id: string) => void;
  tryGrab: (id: string, supplierId: string, supplierName: string) => { ok: boolean; msg: string };
  /** 延长抢单时间（分钟） */
  extendGrab: (id: string, minutes: number) => void;
  expireGrabs: () => void;

  /* ── 比单（公开报名制） ── */
  startCompare: (id: string, floorRule: CompareFloorRule) => { ok: boolean; msg: string };
  /** 合作商报名（报价不得低于底价） */
  signUpCompare: (id: string, supplierId: string, supplierName: string, amount: number) => { ok: boolean; msg: string };
  /** 延长报名截止时间（分钟） */
  extendCompare: (id: string, minutes: number) => void;
  /** 评分定标（截止后按报价+积分排名） */
  finalizeCompare: (id: string, force?: boolean) => { ok: boolean; msg: string };
  /** 直接选定合作商（填理由，转为指定分发） */
  awardCompare: (id: string, supplierId: string, reason: string) => { ok: boolean; msg: string };

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

  /** 内部：转出合作商（报备/指定/抢单/比单共用）→ 分发待接单 */
  const transfer = (id: string, supplierId: string, supplierName: string, source: TransferSource, detail: string) => {
    patchOrder(id, {
      processStatus: 'distribute_pending',
      path: 'distribute',
      partnerId: supplierId,
      partnerName: supplierName,
      transferSource: source,
      transferTime: now(),
      partnerStatus: undefined,
    }, { action: source === 'report' ? '报备命中自动转出' : source === 'assign' ? '指定分发' : source === 'grab' ? '抢单分发' : '比单分发', detail: `${detail} → ${supplierName} · 等待合作商接单` });
  };

  return {
    orders: externalOrderSeeds,
    settings: {
      grabMinutes: 30,
      compareMinutes: 30,
      compareWeights: { quote: 5, score: 5 },
    },

    /* ── 录入 / 删除 / 修改 ── */
    addExternalOrder: (input) => {
      const orders = get().orders;
      const order: ExternalOrder = {
        id: `eo_${nowTs()}`,
        code: genOrderCode(orders),
        ...input,
        sourceChannel: input.sourceChannel ?? 'manual',
        operator: input.operator || '运营人员',
        totalAmount: input.items.reduce((s, it) => s + it.price * it.quantity, 0),
        entryTime: now(),
        processStatus: 'pending',
        history: [{ time: now(), action: input.sourceChannel === 'push' ? '直连推送订单' : '手工录入订单', detail: input.sourceChannel === 'push' ? '平台 API 自动同步' : '手工录入' }],
      };
      // 录入即检：命中审批通过的报备 → 直接自动转出（报备分发）
      const matches = matchExternalOrder(order);
      const match = matches.find((m) => m.partnerId);
      if (match?.partnerId) {
        order.reportMatches = matches;
        order.processStatus = 'distribute_pending';
        order.path = 'distribute';
        order.distributeMode = 'assign';
        order.partnerId = match.partnerId;
        order.partnerName = match.partnerName;
        order.transferSource = 'report';
        order.transferTime = now();
        order.history.push({ time: now(), action: '报备命中自动转出', detail: `命中 ${matches.map((m) => m.reportCode).join('、')} → ${match.partnerName} · 等待合作商接单` });
      }
      set({ orders: [order, ...orders] });
      return order;
    },

    deleteOrder: (id) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: '订单不存在' };
      if (order.sourceChannel !== 'manual') return { ok: false, msg: '直连推送订单不支持删除' };
      if (order.processStatus !== 'pending') return { ok: false, msg: '仅待处理订单可删除' };
      set((s) => ({ orders: s.orders.filter((o) => o.id !== id) }));
      return { ok: true, msg: '订单已删除' };
    },

    updateOrder: (id, patch) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: '订单不存在' };
      if (['processed', 'completed'].includes(order.processStatus)) return { ok: false, msg: '已接单订单不可修改' };
      const nextItems = patch.items ?? order.items;
      patchOrder(id, {
        ...patch,
        items: nextItems,
        totalAmount: nextItems.reduce((s, it) => s + it.price * it.quantity, 0),
      }, { action: '修改订单信息', detail: '管理后台修改订单内容' });
      return { ok: true, msg: '订单已修改' };
    },

    /* ── 路径选择与流转 ── */
    chooseSelfPath: (id) => {
      patchOrder(id, {
        path: 'self',
        processStatus: 'self_pending',
      }, { action: '选择自营路径', detail: '背对背采购 · 等待管理后台接单（销售订单 → 流转订单）' });
    },

    assignPartner: (id, supplierId, supplierName) => {
      transfer(id, supplierId, supplierName, 'assign', '运营指定分发');
    },

    resetToPending: (id, note) => {
      patchOrder(id, {
        processStatus: 'pending',
        path: undefined,
        distributeMode: undefined,
        partnerId: undefined,
        partnerName: undefined,
        transferSource: undefined,
        transferTime: undefined,
        partnerStatus: undefined,
        settleOnTime: undefined,
        follower: undefined,
        selfChain: undefined,
        grabDeadline: undefined,
        grabRecords: undefined,
        compare: undefined,
        // 报备匹配信息一并清除：重新流转后不再按报备自动分发，由运营手动选择路径
        reportMatches: undefined,
      }, { action: '重新流转', detail: note || '订单进入待处理状态重新选择路径（已清除报备匹配，不再自动按报备分发）' });
    },

    /* ── 自营执行 ── */
    acceptSelfOrder: (id, input) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: '订单不存在' };
      if (order.processStatus !== 'self_pending') return { ok: false, msg: '订单不在自营待接单状态' };
      const rules = usePriceStore.getState().purchaseRules;
      const purchaseAmount = order.items.reduce((s, it) => {
        const rule = rules.find((r) => r.productId === it.productId && r.status === 'active');
        return s + it.quantity * (rule?.purchasePrice ?? Math.round(it.price * 0.55));
      }, 0);
      const seq = get().orders.filter((o) => o.selfChain).length + 1;
      const cgCode = `WB-CG-${String(seq).padStart(3, '0')}`;
      patchOrder(id, {
        processStatus: 'processed',
        follower: input.follower,
        selfChain: {
          purchaseOrderCode: cgCode,
          supplierId: input.supplierId,
          supplierName: input.supplierName,
          purchaseAmount,
          purchaseDate: now(),
        },
      }, { action: '管理后台接单（自营）', detail: `跟单人 ${input.follower || '—'} · 采购单 ${cgCode} · ${input.supplierName} · ¥${purchaseAmount.toLocaleString()} → 已处理` });
      return { ok: true, msg: '已接单，进入自营执行流程' };
    },

    selfInbound: (id) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order?.selfChain) return;
      patchOrder(id, {
        selfChain: { ...order.selfChain, inboundCode: order.selfChain.purchaseOrderCode.replace('CG', 'RK'), inboundDate: now() },
      }, { action: '到货入库', detail: '采购到货验收入库' });
    },

    selfOutbound: (id) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order?.selfChain) return;
      patchOrder(id, {
        selfChain: { ...order.selfChain, outboundCode: order.selfChain.purchaseOrderCode.replace('CG', 'CK'), outboundDate: now() },
      }, { action: '出库发货', detail: '销售出库 · 安排发运' });
    },

    selfComplete: (id) => {
      patchOrder(id, { processStatus: 'completed' }, { action: '自营订单完成', detail: '客户已签收' });
    },

    /* ── 抢单 ── */
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
        grabRecords: [{ supplierId, supplierName, grabTime: nowMin(), ts: nowTs() }],
      });
      transfer(id, supplierId, supplierName, 'grab', '抢单成功（时间优先）');
      return { ok: true, msg: '抢单成功！订单已转入您的名下' };
    },

    extendGrab: (id, minutes) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order?.grabDeadline) return;
      patchOrder(id, {
        grabDeadline: Math.max(order.grabDeadline, nowTs()) + minutes * 60 * 1000,
      }, { action: '延长抢单时间', detail: `管理后台延长 ${minutes} 分钟` });
    },

    expireGrabs: () => {
      const expired = get().orders.filter((o) => o.processStatus === 'grabbing' && o.grabDeadline && nowTs() > o.grabDeadline);
      if (expired.length === 0) return;
      set((s) => ({
        orders: s.orders.map((o) =>
          expired.some((e) => e.id === o.id)
            ? { ...o, processStatus: 'pending' as const, distributeMode: undefined, history: [...o.history, { time: now(), action: '抢单超时', detail: '无人抢购，退回待处理' }] }
            : o,
        ),
      }));
    },

    /* ── 比单（公开报名制） ── */
    startCompare: (id, floorRule) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: '订单不存在' };
      const minutes = get().settings.compareMinutes;
      const floor = floorAmount(order.totalAmount, floorRule);
      const floorNote = floorRule.type === 'discount'
        ? `报名报价不得低于订单金额的 ${floorRule.value} 折（¥${floor.toLocaleString()}）`
        : `报名报价不得低于 ¥${floor.toLocaleString()}`;
      patchOrder(id, {
        path: 'distribute',
        distributeMode: 'compare',
        processStatus: 'comparing',
        compare: {
          deadline: nowTs() + minutes * 60 * 1000,
          floorRule,
          floorNote,
          quotes: [],
          scored: false,
        },
      }, { action: '发起比单', detail: `公开报名 · ${floorNote} · 评分 = 报价 ${get().settings.compareWeights.quote}0% + 积分 ${get().settings.compareWeights.score}0%` });
      return { ok: true, msg: '比单已发起，等待合作商报名' };
    },

    signUpCompare: (id, supplierId, supplierName, amount) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order?.compare || order.processStatus !== 'comparing') return { ok: false, msg: '比单已结束' };
      if (order.compare.quotes.some((q) => q.supplierId === supplierId)) return { ok: false, msg: '您已报名过' };
      if (nowTs() > order.compare.deadline) return { ok: false, msg: '报名已截止' };
      const floor = floorAmount(order.totalAmount, order.compare.floorRule);
      if (amount < floor) return { ok: false, msg: `报价不得低于底价 ¥${floor.toLocaleString()}` };
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === id && o.compare
            ? { ...o, compare: { ...o.compare, quotes: [...o.compare.quotes, { supplierId, supplierName, amount, quoteTime: nowMin() }] } }
            : o,
        ),
      }));
      return { ok: true, msg: '报名成功' };
    },

    extendCompare: (id, minutes) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order?.compare) return;
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === id && o.compare
            ? {
                ...o,
                compare: { ...o.compare, deadline: Math.max(o.compare.deadline, nowTs()) + minutes * 60 * 1000 },
                history: [...o.history, { time: now(), action: '延长报名截止', detail: `管理后台延长 ${minutes} 分钟` }],
              }
            : o,
        ),
      }));
    },

    finalizeCompare: (id, force = false) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order?.compare || order.processStatus !== 'comparing') return { ok: false, msg: '订单不在比单报名中' };
      const cmp = order.compare;
      if (cmp.scored) return { ok: false, msg: '该比单已定标' };
      if (cmp.quotes.length === 0) return { ok: false, msg: '暂无合作商报名，无法评分' };
      if (!force && nowTs() < cmp.deadline) return { ok: false, msg: '报名未截止（可强制定标）' };

      const { quote: wq, score: ws } = get().settings.compareWeights;
      const entries = useScoreStore.getState().entries;
      const summaries = cmp.quotes.map((q) => getScoreSummary(entries, q.supplierId, q.supplierName));
      const maxTotal = Math.max(...summaries.map((s) => s.total), 1);
      const minQuote = Math.min(...cmp.quotes.map((q) => q.amount));

      const scores: Record<string, { quoteScore: number; scoreScore: number; total: number }> = {};
      for (const q of cmp.quotes) {
        const summary = summaries.find((s) => s.supplierId === q.supplierId);
        const quoteScore = Math.round((minQuote / q.amount) * 100);
        const scoreScore = Math.round(((summary?.total ?? 60) / maxTotal) * 100);
        const total = Math.round(((quoteScore * wq + scoreScore * ws) / (wq + ws)) * 10) / 10;
        scores[q.supplierId] = { quoteScore, scoreScore, total };
      }
      const winner = [...cmp.quotes].sort((a, b) => scores[b.supplierId].total - scores[a.supplierId].total)[0];

      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === id
            ? {
                ...o,
                compare: { ...cmp, scored: true, scores, winnerId: winner.supplierId },
                processStatus: 'distribute_pending',
                path: 'distribute',
                partnerId: winner.supplierId,
                partnerName: winner.supplierName,
                transferSource: 'compare',
                transferTime: now(),
                partnerStatus: undefined,
                history: [...o.history, { time: now(), action: '比单定标', detail: `${winner.supplierName} 综合得分 ${scores[winner.supplierId].total} 中单 · 等待合作商接单` }],
              }
            : o,
        ),
      }));
      return { ok: true, msg: `${winner.supplierName} 中单（综合得分 ${scores[winner.supplierId].total}）` };
    },

    awardCompare: (id, supplierId, reason) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order?.compare || order.processStatus !== 'comparing') return { ok: false, msg: '订单不在比单报名中' };
      const target = order.compare.quotes.find((q) => q.supplierId === supplierId);
      if (!target) return { ok: false, msg: '该合作商尚未报名' };
      transfer(id, supplierId, target.supplierName, 'assign', `比单直接选定（${reason.trim() || '管理后台综合判断'}）`);
      return { ok: true, msg: `已选定 ${target.supplierName}，转为指定分发` };
    },

    /* ── 履约与结算（合作商接单 → 已处理；结算写积分台账） ── */
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
      patchOrder(id, {
        partnerStatus: status,
        ...(status === 'accepted' ? { processStatus: 'processed' as const } : {}),
      }, { action: actionLabels[status] ?? '履约推进', detail: status === 'accepted' ? '合作商终端接单 → 已处理' : undefined });
    },

    /* ── 设置 ── */
    updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
  };
});

/* ── 合作商终端视图 ── */

const TRANSFER_KIND_MAP: Record<string, 'order-self' | 'product' | 'customer' | 'assign' | 'grab' | 'compare'> = {
  report: 'order-self',
  assign: 'assign',
  grab: 'grab',
  compare: 'compare',
};

/** 某合作商名下的订单处理流转订单（映射为合作商订单结构，合作商终端展示/接单） */
export function getPartnerFlowOrders(supplierId: string): PartnerOrder[] {
  return useOrderFlowStore
    .getState()
    .orders.filter((o) => o.partnerId === supplierId && ['distribute_pending', 'processed', 'completed'].includes(o.processStatus))
    .map((o) => ({
      id: `ext_${o.id}`,
      code: o.code,
      customerName: o.customerName,
      customerType: o.customerType,
      items: o.items.map((it) => ({ productName: it.productName, spec: it.spec, quantity: it.quantity, price: it.price })),
      totalAmount: o.totalAmount,
      deliveryMode: 'direct' as const,
      coopMode: 'supplier' as const,
      status: o.processStatus === 'distribute_pending' ? ('pending' as const) : (o.partnerStatus ?? ('pending' as const)),
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

/** 合作商系统报价（比单报名默认带出：按品牌折扣计算整单报价） */
export function getPartnerSystemQuote(supplierId: string, items: ExternalOrderItem[]): number {
  const { quoteSettings } = useSupplierStore.getState();
  const products = usePriceStore.getState().products;
  const setting = quoteSettings[supplierId];
  return items.reduce((sum, it) => {
    const brand = products.find((p) => p.id === it.productId)?.brand ?? products.find((p) => p.name === it.productName)?.brand;
    const discount = brand ? setting?.brandDiscounts?.[brand] : undefined;
    return sum + Math.round(it.price * it.quantity * ((discount ?? 100) / 100));
  }, 0);
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
