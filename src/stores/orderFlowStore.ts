/**
 * 订单分发（销售订单入口）Store（管理端 ↔ 合作商终端共享）
 *
 * 状态机：
 * pending 分发-待处理（手工录入 / 直连推送，订单分发弹窗选路径；支持按商品+数量拆单，子订单编号=母编号-1/-2…）
 *   ├ 命中审批通过的报备（保存即自动匹配）→ report_match_pending 报备-匹配待确认
 *   │    └ 人工「确认匹配」→ distribute_pending（报备转派；一笔订单可匹配多条报备，一条报备可服务多笔订单）
 *   ├ 自营：self_pending 自营待接单（管理后台在销售订单-分发订单接单，填跟单人）→ processed → completed
 *   └ 分发：指定 / 报备匹配（人工选报备，可多选）→ distribute_pending
 *       比单 comparing（按商品报名、底价限制、可限地区）：截止后按商品维度积分排名定标；
 *            同一合作商多商品合并生成一个子订单，未报名商品合并子订单退回分发-待处理+「比单未成」标签
 * distribute_pending 转派待接单（合作商终端接单）→ processed 分发-已完成（accepted/shipping/delivered）→ settled → completed
 * 拆单家族：子订单 parentCode 指向母销售单编号，列表独立展示，详情按「母销售单/子订单N」Tab 切换
 */
import { create } from 'zustand';
import type {
  CompareFloorRule, ExternalOrder, ExternalOrderItem, ExternalPlatform, FlowSettings, PartnerOrder,
  PartnerOrderStatus, PartnerReport, PlatformOrder, RegionScope, ReportMatchInfo, TransferSource,
} from '../types';
import { partnerInRegion } from '../types';
import { externalOrderSeeds } from '../data/externalOrders';
import { matchesReport, useReportStore } from './reportStore';
import { useSupplierStore } from './supplierStore';
import { usePriceStore } from './priceStore';
import { useScoreStore, getScoreSummary } from './scoreStore';
import { usePurchaseStore } from './purchaseStore';

const now = () => new Date().toISOString().slice(0, 10);
const nowTs = () => Date.now();
const nowMin = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

/** 生成母销售单编号：DXS + 年月日 + 4 位序号（0001 起，同日递增） */
const genOrderCode = (orders: ExternalOrder[]): string => {
  const dateKey = now().replace(/-/g, '');
  const seq = orders.filter((o) => !o.parentCode && o.code.includes(dateKey)).length + 1;
  return `DXS${dateKey}${String(seq).padStart(4, '0')}`;
};

/** 生成履约单编号：母销售单编号 + FO + 2 位序号（01 起，挂在母销售单下的履约单数递增） */
const genFulfillmentCode = (soCode: string, orders: ExternalOrder[]): string => {
  const seq = orders.filter((o) => o.parentCode === soCode).length + 1;
  return `${soCode}LY${String(seq).padStart(2, '0')}`;
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

/** 报备记录是否命中该订单（订单分发弹窗·报备匹配列表标记「匹配」用） */
export function reportMatchesOrder(order: ExternalOrder, report: PartnerReport): boolean {
  return matchesReport(toPlatformOrder(order), report);
}

/** 比单底价金额 */
const floorAmount = (totalAmount: number, rule: CompareFloorRule) =>
  rule.type === 'discount' ? Math.round(totalAmount * rule.value) / 100 : rule.value;

export interface AddExternalInput {
  /** 销售路径:direct=直接销售(路径1-4) / via_platform=经平台销售(路径5:淡茶→平台客户→直营客户) */
  salesPath: 'direct' | 'via_platform';
  /** 来源平台(经平台销售必选;直连推送为其所属平台渠道;直接销售可空) */
  platform?: ExternalPlatform;
  /** 平台订单号(经平台销售时=平台给淡茶半盏的采购单号) */
  externalOrderNo?: string;
  /** 平台客户(经平台销售的采购买方) */
  platformCustomerId?: string;
  platformCustomerName?: string;
  /** 客户下单时间(客户在平台/渠道侧下单的时间) */
  customerOrderTime?: string;
  /** 客户侧订单号(客户在自己下单渠道的订单号,非必输) */
  customerOrderNo?: string;
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
  /** 修改订单信息（待处理/待接单/比单中可改） */
  updateOrder: (id: string, patch: Partial<Pick<ExternalOrder, 'externalOrderNo' | 'customerName' | 'customerType' | 'customerRegion' | 'receiver' | 'receiverPhone' | 'receiverAddress' | 'remark' | 'items'>>) => { ok: boolean; msg: string };

  /* ── 路径选择与分发 ── */
  chooseSelfPath: (id: string) => void;
  assignPartner: (id: string, supplierId: string, supplierName: string) => void;
  /** 报备-匹配待确认：人工确认命中报备，分发给报备合作商 */
  confirmReportMatch: (id: string) => { ok: boolean; msg: string };
  /** 待处理订单人工匹配报备（订单分发弹窗·报备匹配），转出报备合作商 */
  matchReportManual: (id: string, reportCodes: string[]) => { ok: boolean; msg: string };
  /** 分发-待处理订单按商品+数量拆单：拆出履约单（母销售单编号+FO01/02…），母子在列表独立展示 */
  splitOrder: (id: string, parts: { productName: string; quantity: number }[]) => { ok: boolean; msg: string };
  /** 快速拆单：brand=按品牌分组（同品牌一单）、product=按商品逐个拆单；首个分组保留母销售单，其余生成履约单 */
  quickSplit: (id: string, mode: 'brand' | 'product') => { ok: boolean; msg: string };
  /** 重新分发：退回待处理重新选择路径 */
  resetToPending: (id: string, note?: string) => void;

  /* ── 自营执行（销售单自营菜单：接单 → 拆单 / 采购&发货 → 运输 → 妥投 → 确认收货） ── */
  /** 接单（详情页）：填跟单人，进入已接单 */
  acceptSelfOrder: (id: string, input: { follower?: string }) => { ok: boolean; msg: string };
  /** 退回（详情页）：退回销售单分发重新待处理，来源标注「自营退回」 */
  returnToDistribute: (id: string) => { ok: boolean; msg: string };
  /** 采购&发货（详情页）：分仓直发包裹（每仓一快递单号）+ 缺口以销定采（直发/入库制），有物流单号即进入已发货运输中 */
  shipSelfOrder: (id: string, input: {
    shipments: { warehouseId: string; warehouseName: string; logisticsCompany: string; trackingNo: string; items: { productId: string; productName: string; qty: number }[] }[];
    purchase?: { supplierId: string; supplierName: string; mode: 'direct' | 'warehouse'; items: { productId: string; quantity: number }[] };
  }) => { ok: boolean; msg: string };
  /** 到货出库（入库制采购到货后）：按剩余数量生成出库包裹（填物流单号）→ 已发货运输中 */
  outboundSelf: (id: string, input: { logisticsCompany: string; trackingNo: string }) => { ok: boolean; msg: string };
  /** 物流妥投推进（系统跟踪物流模拟）：标记自营包裹妥投，全部妥投（含关联采购单包裹）→ 妥投 */
  deliverSelfShipment: (id: string, shipmentId?: string) => { ok: boolean; msg: string };
  /** 客户确认收货（人工/联机）：妥投 → 完成并结算关联采购单 */
  confirmSelfReceipt: (id: string) => { ok: boolean; msg: string };

  /* ── 比单（公开报名制） ── */
  startCompare: (id: string, floorRule: CompareFloorRule, region?: RegionScope) => { ok: boolean; msg: string };
  /** 合作商报名（报价不得低于底价） */
  signUpCompare: (id: string, supplierId: string, supplierName: string, amount: number, itemNames?: string[]) => { ok: boolean; msg: string };
  /** 延长报名截止时间（分钟） */
  extendCompare: (id: string, minutes: number) => void;
  /** 评分定标（截止后按报价+积分排名） */
  finalizeCompare: (id: string, force?: boolean) => { ok: boolean; msg: string };
  /** 直接选定合作商（填理由，转为指定转派） */
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

  /** 内部：转出合作商（报备/指定/比单共用）→ 转派待接单 */
  const transfer = (id: string, supplierId: string, supplierName: string, source: TransferSource, detail: string) => {
    patchOrder(id, {
      processStatus: 'distribute_pending',
      path: 'distribute',
      partnerId: supplierId,
      partnerName: supplierName,
      transferSource: source,
      transferTime: now(),
      partnerStatus: undefined,
    }, { action: source === 'report' ? '报备命中自动转出' : source === 'assign' ? '指定转派' : '比单转派', detail: `${detail} → ${supplierName} · 等待合作商接单` });
    // 三单联动：转派定案自动生成直送采购单（比单按中单价口径）
    const after = get().orders.find((o) => o.id === id);
    if (after) {
      const winQuote = after.compare?.quotes.find((q) => q.supplierId === supplierId);
      usePurchaseStore.getState().createFromChild({
        child: after,
        source: 'distribute',
        deliveryMode: 'direct',
        priceOf: source === 'compare' && winQuote ? (it) => {
          // 比单中单价按子单行金额占比分摊到行
          const totalAmt = Math.max(1, after.items.reduce((s, i) => s + i.price * i.quantity, 0));
          return Math.round((winQuote.amount * (it.price * it.quantity)) / totalAmt / Math.max(1, it.quantity));
        } : undefined,
      });
    }
  };

  /** 内部：由母销售单构造子订单（比单按商品分拆定案共用；seq 为子序号） */
  const makeSplitChild = (
    mother: ExternalOrder, rootCode: string, seq: number, items: ExternalOrderItem[],
    extra: Partial<ExternalOrder>, lastAction: string, lastDetail: string,
  ): ExternalOrder => ({
    ...mother,
    id: `eo_${nowTs()}_${seq}_${Math.floor(Math.random() * 1000)}`,
    code: `${rootCode}FO${String(seq).padStart(2, '0')}`,
    parentCode: rootCode,
    items,
    totalAmount: items.reduce((s, it) => s + it.price * it.quantity, 0),
    reportMatches: undefined,
    sourceTag: undefined,
    compare: undefined,
    partnerId: undefined, partnerName: undefined, transferSource: undefined, transferTime: undefined,
    partnerStatus: undefined, settleOnTime: undefined, follower: undefined,
    selfPo: undefined, selfShipments: undefined,
    processStatus: 'pending', path: undefined, distributeMode: undefined,
    ...extra,
    history: [...mother.history, { time: now(), action: lastAction, detail: lastDetail }],
  });

  return {
    orders: externalOrderSeeds,
    settings: {
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
        history: [{
          time: now(),
          action: input.sourceChannel === 'push' ? '直连推送订单' : '手工录入订单',
          detail: (input.sourceChannel === 'push' ? '平台 API 自动同步' : '手工录入')
            + (input.salesPath === 'via_platform'
              ? ` · 经平台销售（${input.platformCustomerName ?? '—'}）`
              : ' · 直接销售')
            + (input.customerOrderNo ? ` · 客户侧单号 ${input.customerOrderNo}` : ''),
        }],
      };
      // 保存即匹配：命中审批通过的报备 → 进入报备-匹配待确认（人工确认后分发）
      const matches = matchExternalOrder(order);
      const match = matches.find((m) => m.partnerId);
      if (match?.partnerId) {
        order.reportMatches = matches;
        order.processStatus = 'report_match_pending';
        order.path = 'distribute';
        order.partnerId = match.partnerId;
        order.partnerName = match.partnerName;
        order.history.push({ time: now(), action: '命中报备，待确认匹配', detail: `命中 ${matches.map((m) => m.reportCode).join('、')} → ${match.partnerName} · 待人工确认后分发` });
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

    /* ── 路径选择与分发 ── */
    chooseSelfPath: (id) => {
      patchOrder(id, {
        path: 'self',
        processStatus: 'self_pending',
      }, { action: '选择自营路径', detail: '背对背采购 · 等待管理后台接单（销售订单 → 分发订单）' });
    },

    assignPartner: (id, supplierId, supplierName) => {
      transfer(id, supplierId, supplierName, 'assign', '运营指定转派');
    },

    confirmReportMatch: (id) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: '订单不存在' };
      if (order.processStatus !== 'report_match_pending') return { ok: false, msg: '订单不在报备-匹配待确认状态' };
      const match = order.reportMatches?.find((m) => m.partnerId && m.partnerName);
      if (!match?.partnerId || !match.partnerName) return { ok: false, msg: '未找到可分发的报备匹配合作商' };
      transfer(id, match.partnerId, match.partnerName, 'report', `确认报备匹配 ${match.reportCode}`);
      return { ok: true, msg: `已确认匹配并转出 ${match.partnerName}，等待合作商接单` };
    },

    matchReportManual: (id, reportCodes) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: '订单不存在' };
      if (order.processStatus !== 'pending') return { ok: false, msg: '仅分发-待处理订单可匹配报备' };
      const codes = [...new Set(reportCodes)].filter(Boolean);
      if (codes.length === 0) return { ok: false, msg: '请至少选择一条报备记录' };
      const reports = useReportStore.getState().reports.filter((r) => codes.includes(r.code) && r.status === 'approved');
      if (reports.length === 0) return { ok: false, msg: '报备记录不存在或未通过审批' };
      const suppliers = useSupplierStore.getState().suppliers;
      const matches = reports.map((r) => ({
        reportCode: r.code,
        reportType: r.type,
        partnerId: suppliers.find((s) => s.name === r.partnerName)?.id,
        partnerName: r.partnerName,
      })).filter((m) => m.partnerId);
      if (matches.length === 0) return { ok: false, msg: '报备合作商不在合作商档案中' };
      // 一笔订单可对应多条报备：全部记录为匹配信息，转出给首家报备合作商
      patchOrder(id, { reportMatches: matches });
      transfer(id, matches[0].partnerId!, matches[0].partnerName, 'report', `人工匹配报备 ${matches.map((m) => m.reportCode).join('、')}`);
      return { ok: true, msg: `已匹配 ${matches.length} 条报备并转出 ${matches[0].partnerName}，等待合作商接单` };
    },

    splitOrder: (id, parts) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: '订单不存在' };
      const isAcceptedSelf = order.path === 'self' && order.processStatus === 'self_accepted';
      if (order.processStatus !== 'pending' && !isAcceptedSelf) return { ok: false, msg: '仅分发-待处理或已接单（自营）订单可拆单' };
      const valid = parts.filter((p) => p.quantity > 0);
      if (valid.length === 0) return { ok: false, msg: '请填写要拆出的商品数量' };
      for (const p of valid) {
        const it = order.items.find((x) => x.productName === p.productName);
        if (!it) return { ok: false, msg: `商品 ${p.productName} 不在订单内` };
        if (p.quantity > it.quantity) return { ok: false, msg: `商品 ${p.productName} 拆出数量超出订单数量` };
      }
      const remainItems = order.items
        .map((it) => ({ ...it, quantity: it.quantity - (valid.find((p) => p.productName === it.productName)?.quantity ?? 0) }))
        .filter((it) => it.quantity > 0);
      if (remainItems.length === 0) return { ok: false, msg: '不能拆出全部商品（需保留剩余部分生成履约单）' };
      const rootCode = order.parentCode ?? order.code;
      const childStatus = isAcceptedSelf ? 'self_accepted' as const : 'pending' as const;
      const childPath = isAcceptedSelf ? 'self' as const : order.path;
      const mkFo = (items: ExternalOrderItem[], note: string): ExternalOrder => {
        const seq = get().orders.filter((o) => o.parentCode === rootCode).length + 1;
        const code = genFulfillmentCode(rootCode, get().orders);
        return {
          ...order,
          id: `eo_${nowTs()}_${seq}_${Math.floor(Math.random() * 1000)}`,
          code,
          parentCode: rootCode,
          items,
          totalAmount: items.reduce((s, it) => s + it.price * it.quantity, 0),
          processStatus: childStatus,
          path: childPath,
          reportMatches: undefined,
          sourceTag: undefined,
          history: [{ time: now(), action: '拆单生成履约单', detail: `从 ${order.code} 拆出${note} · ${items.map((i) => `${i.productName}×${i.quantity}`).join('、')}${isAcceptedSelf ? ' · 继承自营已接单' : ''}` }],
        };
      };
      // 拆出部分与剩余部分各生成一张子履约单（母销售单一直存在、状态不变）
      const splitFo = mkFo(valid.map((p) => ({ ...order.items.find((x) => x.productName === p.productName)!, quantity: p.quantity })), '');
      const remainFo = mkFo(remainItems, '（剩余部分）');
      set((s) => ({
        orders: [
          splitFo,
          remainFo,
          ...s.orders.map((o) => (o.id === id
            ? { ...o, history: [...o.history, { time: now(), action: '拆单', detail: `拆出子履约单 ${splitFo.code}，剩余部分生成子履约单 ${remainFo.code}，均挂本母销售单下` }] }
            : o)),
        ],
      }));
      return { ok: true, msg: `已拆出子履约单 ${splitFo.code}，剩余部分生成 ${remainFo.code}` };
    },

    quickSplit: (id, mode) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: '订单不存在' };
      const isAcceptedSelf = order.path === 'self' && order.processStatus === 'self_accepted';
      if (order.processStatus !== 'pending' && !isAcceptedSelf) return { ok: false, msg: '仅分发-待处理或已接单（自营）订单可拆单' };
      if (order.items.length < 2) return { ok: false, msg: '订单仅 1 种商品，无需拆单' };
      const products = usePriceStore.getState().products;
      const groups: { key: string; items: { productName: string; quantity: number }[] }[] = [];
      for (const it of order.items) {
        const key = mode === 'brand'
          ? (products.find((p) => p.id === it.productId)?.brand ?? products.find((p) => p.name === it.productName)?.brand ?? '其他')
          : it.productName;
        const cur = groups.find((g) => g.key === key);
        if (cur) cur.items.push({ productName: it.productName, quantity: it.quantity });
        else groups.push({ key, items: [{ productName: it.productName, quantity: it.quantity }] });
      }
      const modeLabel = mode === 'brand' ? '品牌' : '商品';
      if (groups.length < 2) return { ok: false, msg: `按${modeLabel}仅一个分组（${groups[0].key}），无需拆单` };
      // 每个分组各生成一张子履约单（同品牌聚在一单 / 每商品一单），母销售单一直存在
      const childStatus = isAcceptedSelf ? 'self_accepted' as const : 'pending' as const;
      const childPath = isAcceptedSelf ? 'self' as const : order.path;
      const fos: ExternalOrder[] = [];
      for (const g of groups) {
        const seq = get().orders.filter((o) => o.parentCode === (order.parentCode ?? order.code)).length + fos.length + 1;
        const code = genFulfillmentCode(order.parentCode ?? order.code, [...get().orders, ...fos]);
        fos.push({
          ...order,
          id: `eo_${nowTs()}_${seq}_${Math.floor(Math.random() * 1000)}`,
          code,
          parentCode: order.parentCode ?? order.code,
          items: g.items.map((p) => ({ ...order.items.find((x) => x.productName === p.productName)!, quantity: p.quantity })),
          totalAmount: g.items.reduce((s, p) => s + (order.items.find((x) => x.productName === p.productName)!.price * p.quantity), 0),
          processStatus: childStatus,
          path: childPath,
          reportMatches: undefined,
          sourceTag: undefined,
          history: [{ time: now(), action: `快速拆单（按${modeLabel}）`, detail: `分组「${g.key}」→ ${g.items.map((i) => `${i.productName}×${i.quantity}`).join('、')}${isAcceptedSelf ? ' · 继承自营已接单' : ''}` }],
        });
      }
      set((s) => ({
        orders: [
          ...fos,
          ...s.orders.map((o) => (o.id === id
            ? { ...o, history: [...o.history, { time: now(), action: `快速拆单（按${modeLabel}）`, detail: `${groups.length} 个分组各生成子履约单 ${fos.map((f) => f.code).join('、')}，均挂本母销售单下` }] }
            : o)),
        ],
      }));
      return { ok: true, msg: `已按${modeLabel}拆为 ${fos.length} 张子履约单（${fos.map((f) => f.code).join('、')}）` };
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
        selfPo: undefined,
        selfShipments: undefined,
        compare: undefined,
        // 报备匹配信息一并清除：重新分发后不再按报备自动分发，由运营手动选择路径
        reportMatches: undefined,
      }, { action: '重新分发', detail: note || '订单进入待处理状态重新选择路径（已清除报备匹配，不再自动按报备转派）' });
    },

    /* ── 自营执行（销售单自营菜单） ── */
    acceptSelfOrder: (id, input) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: '订单不存在' };
      if (order.processStatus !== 'self_pending') return { ok: false, msg: '订单不在自营待接单状态' };
      patchOrder(id, {
        processStatus: 'self_accepted',
        path: 'self',
        follower: input.follower,
      }, { action: '接单（自营）', detail: `跟单人 ${input.follower || '—'} → 已接单（可拆单 / 采购&发货）` });
      return { ok: true, msg: '已接单，可进行拆单或采购&发货' };
    },

    returnToDistribute: (id) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: '订单不存在' };
      if (order.processStatus !== 'self_pending') return { ok: false, msg: '仅自营待接单订单可退回' };
      patchOrder(id, {
        processStatus: 'pending',
        path: undefined,
        sourceTag: 'self_returned',
        follower: undefined,
      }, { action: '自营退回', detail: '退回销售单分发 · 重新进入分发-待处理（来源标注：自营退回）' });
      return { ok: true, msg: '已退回销售单分发（分发-待处理），来源已标注「自营退回」' };
    },

    shipSelfOrder: (id, input) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: '订单不存在' };
      if (order.processStatus !== 'self_accepted') return { ok: false, msg: '仅已接单（自营）订单可采购&发货' };
      const shipments = input.shipments.filter((x) => x.items.some((i) => i.qty > 0));
      for (const sh of shipments) {
        if (!sh.logisticsCompany.trim() || !sh.trackingNo.trim()) return { ok: false, msg: `仓库 ${sh.warehouseName} 的快递公司/单号未填写` };
        for (const line of sh.items.filter((i) => i.qty > 0)) {
          const it = order.items.find((x) => x.productId === line.productId);
          if (!it) return { ok: false, msg: `商品 ${line.productName} 不在订单内` };
        }
      }
      // 分仓发货数量不得超出订单数量
      const alloc = new Map<string, number>();
      for (const sh of shipments) for (const line of sh.items.filter((i) => i.qty > 0)) {
        alloc.set(line.productId, (alloc.get(line.productId) ?? 0) + line.qty);
      }
      for (const it of order.items) {
        if ((alloc.get(it.productId) ?? 0) > it.quantity) return { ok: false, msg: `${it.productName} 分仓发货数量超出订单数量` };
      }
      // 以销定采：数量不得低于缺口（可多采，多出部分入库备货）
      const purchase = input.purchase;
      if (purchase && purchase.items.some((x) => x.quantity > 0) && !purchase.supplierId) {
        return { ok: false, msg: '以销定采请选择供应商' };
      }
      if (purchase) {
        for (const line of purchase.items.filter((x) => x.quantity > 0)) {
          const it = order.items.find((x) => x.productId === line.productId);
          if (!it) return { ok: false, msg: `采购商品 ${line.productId} 不在订单内` };
          const gap = it.quantity - (alloc.get(it.productId) ?? 0);
          if (line.quantity < gap) return { ok: false, msg: `${it.productName} 采购数量不得低于缺口 ${gap}` };
        }
      }
      const seqBase = (order.selfShipments?.length ?? 0) + 1;
      const selfShipments = [
        ...(order.selfShipments ?? []),
        ...shipments.map((sh, i) => ({
          id: `ss_${nowTs()}_${i}`,
          packageNo: `PKG-${order.code}-${String(seqBase + i).padStart(2, '0')}`,
          warehouseId: sh.warehouseId,
          warehouseName: sh.warehouseName,
          logisticsCompany: sh.logisticsCompany.trim(),
          trackingNo: sh.trackingNo.trim(),
          items: sh.items.filter((x) => x.qty > 0).map((x) => ({ productId: x.productId, productName: x.productName, qty: x.qty })),
          status: 'shipped' as const,
          shippedAt: nowMin(),
        })),
      ];
      // 以销定采生成采购单（直发客户 / 入库制）
      let poNote = '';
      if (purchase) {
        const lines = purchase.items.filter((x) => x.quantity > 0);
        if (lines.length > 0) {
          const po = usePurchaseStore.getState().createFromChild({
            child: order,
            source: 'self',
            deliveryMode: purchase.mode,
            itemSubset: lines,
            supplierId: purchase.supplierId,
            supplierName: purchase.supplierName,
            priceOf: (it) => {
              const rules = usePriceStore.getState().purchaseRules;
              const rule = rules.find((r) => r.productId === it.productId && r.supplierId === purchase.supplierId && r.status === 'active');
              return rule?.purchasePrice ?? Math.round(it.price * 0.55);
            },
          });
          const excess = lines.reduce((s2, l) => {
            const it = order.items.find((x) => x.productId === l.productId)!;
            return s2 + Math.max(0, l.quantity - (it.quantity - (alloc.get(it.productId) ?? 0)));
          }, 0);
          poNote = ` · 以销定采 ${po.code}（${purchase.supplierName} · ${purchase.mode === 'direct' ? '直发客户' : '入库制'}）`
            + (excess > 0 ? `，超出缺口 ${excess} 件入库备货` : '');
        }
      }
      const shipNote = shipments.map((sh) => `${sh.warehouseName} ${sh.logisticsCompany.trim()} ${sh.trackingNo.trim()}`).join(' + ');
      patchOrder(id, {
        selfShipments,
        selfPo: purchase && purchase.items.some((x) => x.quantity > 0)
          ? { supplierId: purchase.supplierId, supplierName: purchase.supplierName, mode: purchase.mode, purchaseDate: now() }
          : order.selfPo,
        processStatus: shipments.length > 0 ? 'self_shipped' : order.processStatus,
      }, {
        action: shipments.length > 0 ? '采购&发货（分仓直发）' : '以销定采下单',
        detail: (shipments.length > 0 ? `${shipNote} → 已发货运输中` : '缺口全部以销定采，等待采购到货/直发') + poNote,
      });
      return {
        ok: true,
        msg: shipments.length > 0
          ? `已发货（${shipments.length} 个包裹）${poNote || '，订单进入已发货运输中'}`
          : poNote ? `已生成采购单${poNote}，采购在途（订单保持已接单）` : '未填写任何发货或采购内容',
      };
    },

    outboundSelf: (id, input) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: '订单不存在' };
      if (order.processStatus !== 'self_accepted') return { ok: false, msg: '仅已接单（自营）订单可出库发货' };
      if (!input.logisticsCompany.trim() || !input.trackingNo.trim()) return { ok: false, msg: '请填写物流公司与单号' };
      // 剩余未发数量（订单数量 − 已有包裹数量）
      const shippedMap = new Map<string, number>();
      for (const sh of order.selfShipments ?? []) for (const it of sh.items) shippedMap.set(it.productId, (shippedMap.get(it.productId) ?? 0) + it.qty);
      const remainItems = order.items
        .map((it) => ({ productId: it.productId, productName: it.productName, qty: it.quantity - (shippedMap.get(it.productId) ?? 0) }))
        .filter((x) => x.qty > 0);
      if (remainItems.length === 0) return { ok: false, msg: '订单商品已全部发出' };
      const seq = (order.selfShipments?.length ?? 0) + 1;
      patchOrder(id, {
        processStatus: 'self_shipped',
        selfShipments: [
          ...(order.selfShipments ?? []),
          {
            id: `ss_${nowTs()}`,
            packageNo: `PKG-${order.code}-${String(seq).padStart(2, '0')}`,
            warehouseId: 'wh-ind-01',
            warehouseName: '杭州总仓',
            logisticsCompany: input.logisticsCompany.trim(),
            trackingNo: input.trackingNo.trim(),
            items: remainItems,
            status: 'shipped' as const,
            shippedAt: nowMin(),
          },
        ],
      }, { action: '到货出库发货', detail: `杭州总仓出库 ${remainItems.map((x) => `${x.productName}×${x.qty}`).join('、')} · ${input.logisticsCompany.trim()} ${input.trackingNo.trim()} → 已发货运输中` });
      return { ok: true, msg: '已出库发货，进入已发货运输中' };
    },

    deliverSelfShipment: (id, shipmentId) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: '订单不存在' };
      if (!['self_shipped', 'self_accepted', 'self_delivered'].includes(order.processStatus)) return { ok: false, msg: '订单不在运输跟踪阶段' };
      let shipments = order.selfShipments ?? [];
      let note = '';
      if (shipmentId) {
        const target = shipments.find((x) => x.id === shipmentId);
        if (!target) return { ok: false, msg: '包裹不存在' };
        if (target.status !== 'delivered') note = `包裹 ${target.packageNo}（${target.trackingNo}）物流妥投`;
        shipments = shipments.map((x) => (x.id === shipmentId ? { ...x, status: 'delivered' as const, deliveredAt: nowMin() } : x));
      } else if (shipments.length > 0) {
        note = `${shipments.filter((x) => x.status !== 'delivered').length} 个自营包裹物流全部妥投`;
        shipments = shipments.map((x) => (x.status === 'delivered' ? x : { ...x, status: 'delivered' as const, deliveredAt: nowMin() }));
      }
      // 关联采购单（直发）包裹同步妥投
      let poNote = '';
      const pos = usePurchaseStore.getState().listByChildOrder(id);
      const activePkgs = pos.flatMap((d) => d.packages.filter((x) => x.status !== 'void'));
      if (activePkgs.some((x) => x.status === 'shipped')) {
        pos.forEach((d) => usePurchaseStore.getState().deliverAllByChild(d.childOrderCode));
        poNote = ` · 关联采购单包裹同步妥投 ${activePkgs.filter((x) => x.status === 'shipped').length} 个`;
      }
      const allOwnDelivered = shipments.every((x) => x.status === 'delivered');
      const poAllDelivered = pos.flatMap((d) => d.packages.filter((x) => x.status !== 'void')).every((x) => x.status === 'delivered');
      const hasAnyPackage = shipments.length > 0 || activePkgs.length > 0;
      const done = hasAnyPackage && allOwnDelivered && poAllDelivered;
      patchOrder(id, {
        selfShipments: shipments.length > 0 ? shipments : order.selfShipments,
        processStatus: done ? 'self_delivered' : order.processStatus,
      }, { action: done ? '物流妥投' : '物流跟踪', detail: (note || '关联采购单包裹妥投') + poNote + (done ? ' → 订单妥投，待客户确认收货' : '') });
      return { ok: true, msg: done ? '全部包裹已妥投，订单进入「妥投」待确认收货' : '已推进物流妥投' };
    },

    confirmSelfReceipt: (id) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: '订单不存在' };
      if (order.processStatus !== 'self_delivered') return { ok: false, msg: '订单不在妥投状态' };
      patchOrder(id, { processStatus: 'completed' }, { action: '客户确认收货', detail: '妥投订单人工/联机确认收货 · 订单完成' });
      for (const d of usePurchaseStore.getState().listByChildOrder(id)) {
        usePurchaseStore.getState().settleByChild(d.childOrderCode);
      }
      return { ok: true, msg: '已确认收货，订单完成（关联采购单已结算）' };
    },

    /* ── 比单（公开报名制） ── */
    startCompare: (id, floorRule, region) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: '订单不存在' };
      const minutes = get().settings.compareMinutes;
      const floor = floorAmount(order.totalAmount, floorRule);
      const floorNote = floorRule.type === 'discount'
        ? `报名报价不得低于订单金额的 ${floorRule.value} 折（¥${floor.toLocaleString()}）`
        : `报名报价不得低于 ¥${floor.toLocaleString()}`;
      const hasScope = region && (region.province || region.city || region.district);
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
          region: hasScope ? region : undefined,
        },
      }, { action: '发起比单', detail: `公开报名 · ${floorNote} · 评分 = 报价 ${get().settings.compareWeights.quote}0% + 积分 ${get().settings.compareWeights.score}0%${hasScope ? ` · 限 ${[region!.province, region!.city, region!.district].filter(Boolean).join(' ')} 地区合作商` : ''}` });
      return { ok: true, msg: '比单已发起，等待合作商报名' };
    },

    signUpCompare: (id, supplierId, supplierName, amount, itemNames) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order?.compare || order.processStatus !== 'comparing') return { ok: false, msg: '比单已结束' };
      if (order.compare.quotes.some((q) => q.supplierId === supplierId)) return { ok: false, msg: '您已报名过' };
      if (nowTs() > order.compare.deadline) return { ok: false, msg: '报名已截止' };
      const names = [...new Set(itemNames ?? order.items.map((i) => i.productName))].filter((n) => order.items.some((i) => i.productName === n));
      if (names.length === 0) return { ok: false, msg: '请选择要报名的商品' };
      // 底价按所选商品金额占比折算
      const selBase = order.items.filter((i) => names.includes(i.productName)).reduce((s, i) => s + i.price * i.quantity, 0);
      const floor = Math.round(floorAmount(order.totalAmount, order.compare.floorRule) * (selBase / order.totalAmount));
      if (amount < floor) return { ok: false, msg: `所选商品报价不得低于折算底价 ¥${floor.toLocaleString()}` };
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === id && o.compare
            ? { ...o, compare: { ...o.compare, quotes: [...o.compare.quotes, { supplierId, supplierName, amount, quoteTime: nowMin(), items: names }] } }
            : o,
        ),
      }));
      return { ok: true, msg: `报名成功（${names.join('、')}）` };
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

      // 评分明细（展示用：报价分 + 积分分）
      const scores: Record<string, { quoteScore: number; scoreScore: number; total: number }> = {};
      for (const q of cmp.quotes) {
        const summary = summaries.find((s) => s.supplierId === q.supplierId);
        const quoteScore = Math.round((minQuote / q.amount) * 100);
        const scoreScore = Math.round(((summary?.total ?? 60) / maxTotal) * 100);
        const total = Math.round(((quoteScore * wq + scoreScore * ws) / (wq + ws)) * 10) / 10;
        scores[q.supplierId] = { quoteScore, scoreScore, total };
      }

      // 按商品维度定标：各商品在报名该商品的合作商中按积分总分排第 1 者中单
      const itemAwards: Record<string, string> = {};
      const byPartner = new Map<string, { supplierId: string; supplierName: string; items: ExternalOrderItem[] }>();
      const awarded = new Set<string>();
      for (const item of order.items) {
        const candidates = cmp.quotes
          .filter((q) => (q.items ?? order.items.map((i) => i.productName)).includes(item.productName))
          .map((q) => ({ q, score: summaries.find((s) => s.supplierId === q.supplierId)?.total ?? 60 }))
          .sort((a, b) => b.score - a.score);
        if (candidates.length === 0) continue;
        const winner = candidates[0].q;
        itemAwards[item.productName] = winner.supplierName;
        awarded.add(item.productName);
        const grp = byPartner.get(winner.supplierId) ?? { supplierId: winner.supplierId, supplierName: winner.supplierName, items: [] };
        grp.items.push(item);
        byPartner.set(winner.supplierId, grp);
      }

      // 按中单合作商分拆子订单；未报名商品合并子订单退回分发-待处理（比单未成）
      const rootCode = order.parentCode ?? order.code;
      let seq = get().orders.filter((o) => o.parentCode === rootCode).length;
      const children: ExternalOrder[] = [];
      for (const grp of byPartner.values()) {
        seq += 1;
        children.push(makeSplitChild(order, rootCode, seq, grp.items, {
          processStatus: 'distribute_pending', path: 'distribute', distributeMode: 'compare',
          partnerId: grp.supplierId, partnerName: grp.supplierName,
          transferSource: 'compare', transferTime: now(),
          compare: { ...cmp, scored: true, scores, itemAwards },
        }, '比单定标（按商品·积分优先）', `${grp.items.map((i) => i.productName).join('、')} → ${grp.supplierName}（积分排名第一）· 等待合作商接单`));
      }
      const remain = order.items.filter((i) => !awarded.has(i.productName));
      if (remain.length > 0) {
        seq += 1;
        children.push(makeSplitChild(order, rootCode, seq, remain, {
          processStatus: 'pending', sourceTag: 'compare_failed',
        }, '比单未成退回', `无报名商品（${remain.map((i) => i.productName).join('、')}）形成子订单，重新进入分发-待处理`));
      }
      if (order.parentCode) {
        set((s) => ({ orders: [...children, ...s.orders.filter((o) => o.id !== id)] }));
      } else {
        set((s) => ({
          orders: [
            ...children,
            ...s.orders.map((o) => (o.id === id
              ? { ...o, processStatus: 'pending' as const, history: [...o.history, { time: now(), action: '整单分拆定案完成', detail: `已生成 ${children.length} 张子履约单，均挂本母销售单下` }] }
              : o)),
          ],
        }));
      }
      const winnerNames = [...new Set(Object.values(itemAwards))];
      return { ok: true, msg: winnerNames.length ? `定标完成：${winnerNames.join('、')} 中单（按商品积分排名）` : '定标完成：无商品有报名' };
    },

    awardCompare: (id, supplierId, reason) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order?.compare || order.processStatus !== 'comparing') return { ok: false, msg: '订单不在比单报名中' };
      const target = order.compare.quotes.find((q) => q.supplierId === supplierId);
      if (!target) return { ok: false, msg: '该合作商尚未报名' };
      transfer(id, supplierId, target.supplierName, 'assign', `比单直接选定（${reason.trim() || '管理后台综合判断'}）`);
      return { ok: true, msg: `已选定 ${target.supplierName}，转为指定转派` };
    },

    /* ── 履约与结算（合作商接单 → 已处理；结算写积分台账） ── */
    advancePartner: (id, status, opts) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return;
      const actionLabels: Partial<Record<PartnerOrderStatus, string>> = {
        accepted: '合作商接单',
        shipping: '合作商发货',
        transit: '物流妥投',
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
        usePurchaseStore.getState().settleByChild(order.code);
        return;
      }
      patchOrder(id, {
        partnerStatus: status,
        ...(status === 'accepted' ? { processStatus: 'processed' as const } : {}),
      }, { action: actionLabels[status] ?? '履约推进', detail: status === 'accepted' ? '合作商终端接单 → 已处理' : undefined });
      // PO 状态联动：接单→已确认；签收→全部包裹签收；结算→已结算
      const po = usePurchaseStore.getState();
      if (status === 'accepted') po.confirmByChild(order.code);
      if (status === 'delivered') po.deliverAllByChild(order.code);
    },

    /* ── 设置 ── */
    updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
  };
});

/* ── 合作商终端视图 ── */

const TRANSFER_KIND_MAP: Record<string, 'order-self' | 'product' | 'customer' | 'assign' | 'compare'> = {
  report: 'order-self',
  assign: 'assign',
  compare: 'compare',
};

/** 某合作商名下的订单分发订单（映射为合作商订单结构，合作商终端展示/接单/报名） */
export function getPartnerFlowOrders(supplierId: string): PartnerOrder[] {
  const state = useOrderFlowStore.getState();
  const supplier = useSupplierStore.getState().suppliers.find((x) => x.id === supplierId);
  const base = (o: ExternalOrder, over: Partial<PartnerOrder> = {}): PartnerOrder => ({
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
    ...over,
  });
  const mine = state.orders.filter((o) => o.partnerId === supplierId && ['distribute_pending', 'processed', 'completed'].includes(o.processStatus));
  const mapped = mine.map((o) => {
    // 比单中单的订单（转派待接单、未接单时）直接进入「已接单」；已推进的状态以 partnerStatus 为准
    if (o.transferSource === 'compare' && o.processStatus === 'distribute_pending' && !o.partnerStatus) {
      return base(o, { status: 'accepted' as const });
    }
    return base(o);
  });
  // 进行中的比单（公开报名，地区范围内）：截止后自动从待接单抽走
  const now = Date.now();
  const openCompares = state.orders
    .filter((o) => o.processStatus === 'comparing' && o.compare && o.compare.deadline > now)
    .filter((o) => partnerInRegion(supplier, o.compare?.region))
    .map((o) => {
      const myQuote = o.compare!.quotes.find((q) => q.supplierId === supplierId);
      return base(o, {
        status: 'pending' as const,
        transferKind: 'compare' as const,
        compareSigned: !!myQuote,
        compareDeadline: o.compare!.deadline,
        compareFloorNote: o.compare!.floorNote,
        compareQuoteCount: o.compare!.quotes.length,
        compareMyQuote: myQuote?.amount,
      });
    });
  return [...openCompares, ...mapped];
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
