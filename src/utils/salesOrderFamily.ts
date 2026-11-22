/**
 * 销售单母子家族与四维状态（分发 / 履约 / 结算 / 开票）推导
 * 销售单管理（母单一行聚合）与销售单详情页共用口径。
 *
 * 口径：
 * - 分发状态 = processStatus（7 态：待分发/报备-匹配待确认/自营待接单/分发比单中/转派待接单/分发已完成/已取消），
 *   履约状态进入已接单及后续时自动置为「分发已完成」；
 * - 履约状态 = fulfillment.stage（6 态：待接单/已接单/运输中/妥投/已确收/已取消），履约单维度按发货单包裹
 *   细分「部分已发货 / 部分已确收」等档位；
 * - 结算状态按发货单（包裹）粒度标记（settled），履约单维度 = 未结算/部分结算/已结算；
 * - 开票状态 = invoiceStatus（未开票/部分开票/已开票）；
 * - 已取消贯穿：订单取消后分发状态与履约状态均显示已取消。
 */
import type { ExternalOrder, SalesInvoiceStatus } from '../types';
import { EXTERNAL_STATUS_LABELS } from '../data/externalOrders';
import { stageOfOrder } from './fulfillment';

/** 母子家族：母销售单（parentCode 为空）+ 其全部子履约单（parentCode 指向母销售单编号） */
export interface OrderFamily {
  /** 母销售单编号（= 根编号） */
  rootCode: string;
  /** 母销售单（parentCode 为空；极端情况下家族无母单时退化为首个子单） */
  mother: ExternalOrder;
  /** 子履约单（按编号升序：LY01、LY02…） */
  children: ExternalOrder[];
  /** 家族全部单（母销售单 + 子履约单） */
  all: ExternalOrder[];
}

/** 按母单聚合全部销售单（无子单的独立单自成一组），按录入时间倒序 */
export function buildFamilies(orders: ExternalOrder[]): OrderFamily[] {
  const map = new Map<string, ExternalOrder[]>();
  for (const o of orders) {
    const root = o.parentCode ?? o.code;
    map.set(root, [...(map.get(root) ?? []), o]);
  }
  return [...map.entries()].map(([rootCode, list]) => {
    const mother = list.find((x) => !x.parentCode) ?? list[0];
    const children = list.filter((x) => x.parentCode).sort((a, b) => a.code.localeCompare(b.code));
    return { rootCode, mother, children, all: [mother, ...children] };
  }).sort((a, b) => b.mother.entryTime.localeCompare(a.mother.entryTime));
}

/* ── 履约单单元（默认履约单01 + 拆单后真实子履约单） ── */

/**
 * 履约单单元：已送分发的订单按子履约单展示；未拆分的母销售单本身即默认履约单01（虚拟）。
 * 尚未送分发（dispatchState=unprocessed）的销售单没有履约单，返回空数组。
 */
export interface FulfillmentUnit {
  /** 底层订单（分发 / 发货等操作对象） */
  underlying: ExternalOrder;
  /** 序号（1 起） */
  seq: number;
  /** 履约单号：未拆分 = 母销售单号 + LY01；拆分后 = 子履约单号 */
  code: string;
  /** 是否默认履约单（未拆分，虚拟挂在母销售单上） */
  virtual: boolean;
  /** 生成时间 */
  createdAt: string;
  /** 履约单金额 */
  amount: number;
}

/** 推导某销售单（家族）的履约单列表 */
export function fulfillmentUnitsOf(family: OrderFamily): FulfillmentUnit[] {
  if (family.children.length > 0) {
    return family.children.map((c, i) => ({
      underlying: c,
      seq: i + 1,
      code: c.code,
      virtual: false,
      createdAt: c.history?.[0]?.time ?? c.entryTime,
      amount: c.totalAmount,
    }));
  }
  if (family.mother.dispatchState === 'unprocessed') return [];
  return [{
    underlying: family.mother,
    seq: 1,
    code: family.mother.code + 'LY01',
    virtual: true,
    createdAt: family.mother.entryTime,
    amount: family.mother.totalAmount,
  }];
}

/** 履约单底层订单的全部发货单包裹（自营包裹 + 关联采购单包裹，排除作废） */
export type PkgLike = { status: string; settled?: boolean };
export function packagesOf(o: ExternalOrder, pos?: { packages: PkgLike[] }[]): PkgLike[] {
  return [
    ...(o.selfShipments ?? []),
    ...(pos ?? []).flatMap((d) => d.packages.filter((x) => x.status !== 'void')),
  ];
}

/* ── 单笔订单四维状态 ── */

/** 单笔分发状态（7 态文案；已取消贯穿） */
export function distributeStateOf(o: ExternalOrder): string {
  return EXTERNAL_STATUS_LABELS[o.processStatus] ?? o.processStatus;
}

/**
 * 单笔履约状态（履约单维度显示档位，考虑多发货单）：
 * 未履约 → 已接单 → 部分已发货 → 运输中 → 部分妥投 → 妥投 → 部分已确收 → 全部已确收（已取消贯穿）
 * 已分发但未接单（自营待接单 / 转派待接单）仍为未履约；履约主体接单后才进入已接单。
 * pos 为该子单关联采购单集合（缺省时仅按订单自身包裹判断）
 */
export function fulfillStateOf(o: ExternalOrder, pos?: { packages: PkgLike[] }[]): string {
  if (o.processStatus === 'cancelled') return '已取消';
  const d = o.processStatus;
  /* 未进入履约主体：未分发 / 待分发 / 比单中 / 已分发待接单 → 履约状态均为未履约 */
  if (d === 'unprocessed' || d === 'pending' || d === 'comparing' || d === 'self_pending' || d === 'distribute_pending') return '未履约';
  /* 分发已完成（父单已接单）：按发货单包裹推导档位 */
  const pkgs = packagesOf(o, pos);
  if (pkgs.length === 0) {
    const stage = stageOfOrder(o);
    if (stage === 'confirmed') return '全部已确收';
    if (stage === 'transit') return '妥投';
    if (stage === 'shipping') return '运输中';
    return '已接单';
  }
  const confirmed = pkgs.filter((p) => p.status === 'confirmed').length;
  const delivered = pkgs.filter((p) => p.status === 'delivered').length;
  const shipped = pkgs.filter((p) => p.status === 'shipped').length;
  if (confirmed === pkgs.length) return '全部已确收';
  if (confirmed > 0) return '部分已确收';
  if (delivered === pkgs.length) return '妥投';
  if (delivered > 0) return '部分妥投';
  if (shipped === pkgs.length) return '运输中';
  return '部分已发货';
}

/**
 * 单笔结算状态（按发货单粒度）：未结算 / 部分结算 / 已结算
 * 有发货单时按包裹 settled 标记推导；无发货单时按订单级结算标记（settleOnTime 已写入即已结算）。
 */
export function settleStateOf(o: ExternalOrder, pos?: { packages: PkgLike[] }[]): '未结算' | '部分结算' | '已结算' {
  /* P6 结算分母 = 已妥投/已确收包裹：未发货包裹不进分母，补发不影响已结算状态；
     无已妥投包裹时回退订单级 settled 标记（settleOrder 全部结算/订单级结算后置位） */
  const eligible = packagesOf(o, pos).filter((p) => p.status === 'delivered' || p.status === 'confirmed');
  if (eligible.length === 0) return (o.settled ?? o.settleOnTime !== undefined) ? '已结算' : '未结算';
  const settled = eligible.filter((p) => p.settled).length;
  if (settled === 0) return '未结算';
  return settled === eligible.length ? '已结算' : '部分结算';
}

/** 单笔开票状态：未开票 / 部分开票 / 已开票 */
export function invoiceStateOf(o: ExternalOrder): '未开票' | '部分开票' | '已开票' {
  const v: SalesInvoiceStatus | undefined = o.invoiceStatus;
  if (v === 'invoiced') return '已开票';
  if (v === 'partial') return '部分开票';
  return '未开票';
}

/** 聚合口径：全部满足 → 满足；部分满足 → 部分；否则未 */
type TriState = '全部' | '部分' | '未';
const aggregate = (flags: boolean[]): TriState =>
  flags.every(Boolean) ? '全部' : flags.some(Boolean) ? '部分' : '未';

export interface FamilyStates {
  /** 分发进度聚合：未分发 / 分发中 / 分发完成（全部取消时为已取消） */
  distribute: '未分发' | '分发中' | '分发完成' | '已取消';
  /** 履约进度聚合：未履约 / 履约中 / 履约完成（全部取消时为已取消） */
  fulfill: '未履约' | '履约中' | '履约完成' | '已取消';
  /** 结算进度聚合：未结算 / 结算中 / 结算完成 */
  settle: '未结算' | '结算中' | '结算完成';
  /** 开票进度聚合：未开票 / 开票中 / 开票完成 */
  invoice: '未开票' | '开票中' | '开票完成';
  /** 履约单总数（含已取消） */
  total: number;
  /** 有效履约单数（剔除已取消） */
  active: number;
  /** 分发已完成履约单数 */
  distributed: number;
  /** 全部已确收履约单数 */
  fulfilled: number;
  /** 已结算履约单数 */
  settled: number;
  /** 已开票履约单数 */
  invoiced: number;
}

/** 履约单是否已全部确收（履约完成判定） */
const isFulfilled = (o: ExternalOrder, pos?: { packages: PkgLike[] }[]): boolean =>
  o.processStatus !== 'cancelled' && fulfillStateOf(o, pos) === '全部已确收';

/**
 * 母销售单四维进度聚合（按履约单维度：未拆分 = 默认履约单01；拆分后 = 全部子履约单，母单不参与聚合）
 * 进度值 x/y：x = 已完成履约单数，y = 有效履约单数（剔除已取消）。
 * 未进入 → 未…；部分进入或部分完成 → …中；全部完成 → …完成；全部取消 → 已取消（分发 / 履约）。
 */
export function familyStatesOf(family: OrderFamily): FamilyStates {
  const units = fulfillmentUnitsOf(family);
  const list = units.map((u) => u.underlying);
  const total = list.length;
  const active = list.filter((o) => o.processStatus !== 'cancelled');
  const cancelledAll = active.length === 0;

  /* 尚未生成履约单：分发/履约显示未…，已取消销售单显示已取消 */
  if (total === 0) {
    const cancelled = family.mother.processStatus === 'cancelled';
    return {
      distribute: cancelled ? '已取消' : '未分发',
      fulfill: cancelled ? '已取消' : '未履约',
      settle: '未结算',
      invoice: '未开票',
      total: 0,
      active: 0,
      distributed: 0,
      fulfilled: 0,
      settled: 0,
      invoiced: 0,
    };
  }

  /* 分发：已完成（processed）履约单数 / 有效履约单数 */
  const distributed = active.filter((o) => o.processStatus === 'processed').length;
  const distribute: FamilyStates['distribute'] = cancelledAll
    ? '已取消'
    : distributed === active.length
      ? '分发完成'
      : distributed > 0 || active.some((o) => ['pending', 'comparing', 'self_pending', 'distribute_pending'].includes(o.processStatus))
        ? '分发中'
        : '未分发';

  /* 履约：全部已确收履约单数 / 有效履约单数 */
  const fulfilled = active.filter((o) => isFulfilled(o)).length;
  const FULFILL_DOING = ['已接单', '部分已发货', '运输中', '部分妥投', '妥投', '部分已确收'];
  const fulfill: FamilyStates['fulfill'] = cancelledAll
    ? '已取消'
    : fulfilled === active.length
      ? '履约完成'
      : fulfilled > 0 || active.some((o) => FULFILL_DOING.includes(fulfillStateOf(o)))
        ? '履约中'
        : '未履约';

  /* 结算：已结算履约单数 / 有效履约单数 */
  const settledList = active.map((o) => settleStateOf(o));
  const settled = settledList.filter((s) => s === '已结算').length;
  const settle: FamilyStates['settle'] = settled === active.length
    ? '结算完成'
    : settled > 0 || settledList.some((s) => s === '部分结算')
      ? '结算中'
      : '未结算';

  /* 开票：已开票履约单数 / 有效履约单数 */
  const invoiceList = active.map((o) => invoiceStateOf(o));
  const invoiced = invoiceList.filter((s) => s === '已开票').length;
  const invoice: FamilyStates['invoice'] = invoiced === active.length
    ? '开票完成'
    : invoiced > 0 || invoiceList.some((s) => s === '部分开票')
      ? '开票中'
      : '未开票';

  return { distribute, fulfill, settle, invoice, total, active: active.length, distributed, fulfilled, settled, invoiced };
}

/** 四维状态色板（列表/详情统一，按显示文案取色） */
export const FAMILY_STATE_COLORS = {
  /* 分发聚合 */
  '未分发': { bg: '#F5F5F5', color: '#9E9E9E' },
  '分发中': { bg: '#FBF3E2', color: '#9A7A1C' },
  '分发完成': { bg: '#E8F5E9', color: '#01795D' },
  '已取消': { bg: '#FFEBEE', color: '#C62828' },
  /* 履约（聚合 + 履约单档位） */
  '未履约': { bg: '#F5F5F5', color: '#9E9E9E' },
  '履约中': { bg: '#E3F2FD', color: '#0F64B5' },
  '履约完成': { bg: '#E8F5E9', color: '#2E7D32' },
  '待接单': { bg: '#FFF4E5', color: '#B26A00' },
  '已接单': { bg: '#E8F1FB', color: '#0F64B5' },
  '部分已发货': { bg: '#FFF4E5', color: '#B26A00' },
  '运输中': { bg: '#EEF0FB', color: '#4A4FA0' },
  '部分妥投': { bg: '#E6F5F0', color: '#01795D' },
  '妥投': { bg: '#E0F2F1', color: '#00695C' },
  '部分已确收': { bg: '#E0F2F1', color: '#00695C' },
  '全部已确收': { bg: '#E8F5E9', color: '#2E7D32' },
  /* 结算 */
  '未结算': { bg: '#F5F5F5', color: '#9E9E9E' },
  '结算中': { bg: '#FBF3E2', color: '#9A7A1C' },
  '结算完成': { bg: '#E8F5E9', color: '#01795D' },
  '部分结算': { bg: '#E0F2F1', color: '#00695C' },
  '已结算': { bg: '#E8F5E9', color: '#01795D' },
  /* 开票 */
  '未开票': { bg: '#F5F5F5', color: '#9E9E9E' },
  '开票中': { bg: '#FBF3E2', color: '#9A7A1C' },
  '开票完成': { bg: '#E8F5E9', color: '#01795D' },
  '部分开票': { bg: '#E0F7FA', color: '#00838F' },
  '已开票': { bg: '#E8F5E9', color: '#01795D' },
} as const;
