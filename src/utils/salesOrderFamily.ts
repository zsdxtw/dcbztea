/**
 * 销售单母子家族与三状态（分发 / 发货 / 结算）推导
 * 销售单管理（母单一行聚合）与销售单详情页共用口径。
 */
import type { ExternalOrder } from '../types';
import { EXTERNAL_STATUS_LABELS } from '../data/externalOrders';

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
 * 履约单单元：订单进入管理后台即默认生成履约单01（编号 = 母销售单号 + LY01，虚拟挂在母单上，
 * 生成时间 = 订单录入时间）；拆单后履约单 = 真实子履约单（LY01/LY02…，生成时间 = 拆单时间）。
 * 分发、发货、物流等操作仍作用于 underlying（底层订单），展示层统一以履约单为维度。
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
  return [{
    underlying: family.mother,
    seq: 1,
    code: family.mother.code + 'LY01',
    virtual: true,
    createdAt: family.mother.entryTime,
    amount: family.mother.totalAmount,
  }];
}

/* ── 单笔订单三状态 ── */

/** 单笔分发状态（沿用订单状态机文案，completed 归并为已分发完成） */
export function distributeStateOf(o: ExternalOrder): string {
  if (o.processStatus === 'completed') return '已分发·已完成';
  return EXTERNAL_STATUS_LABELS[o.processStatus] ?? o.processStatus;
}

/**
 * 单笔发货状态：合作商路径看履约状态；自营路径看发货包裹 / 关联采购单包裹（有物流即已发货）
 * pos 为该子单关联采购单集合（缺省时仅按订单自身包裹判断）
 */
export function shipStateOf(o: ExternalOrder, pos?: { packages: { status: string }[] }[]): '待发货' | '已发货' {
  if (o.partnerStatus && ['shipping', 'delivered', 'settled'].includes(o.partnerStatus)) return '已发货';
  if (o.processStatus === 'completed' || o.processStatus === 'self_delivered' || o.processStatus === 'self_shipped') return '已发货';
  if (o.path === 'self') {
    if ((o.selfShipments?.length ?? 0) > 0) return '已发货';
    if (pos?.some((d) => d.packages.some((x) => x.status !== 'void'))) return '已发货';
  }
  return '待发货';
}

/** 单笔结算状态：分发路径结算完成（settled）或自营路径确认签收（completed）即已结算 */
export function settleStateOf(o: ExternalOrder): '未结算' | '已结算' {
  if (o.partnerStatus === 'settled' || o.processStatus === 'completed') return '已结算';
  return '未结算';
}

/** 聚合口径：全部满足 → 满足；部分满足 → 部分；否则未 */
type TriState = '全部' | '部分' | '未';
const aggregate = (flags: boolean[]): TriState =>
  flags.every(Boolean) ? '全部' : flags.some(Boolean) ? '部分' : '未';

export interface FamilyStates {
  /** 待分发（全部待处理）/ 分发中（存在中间态）/ 已分发（全部已接单及以上） */
  distribute: '待分发' | '分发中' | '已分发';
  /** 未发货 / 部分发货 / 全部发货 */
  ship: '未发货' | '部分发货' | '全部发货';
  /** 未结算 / 部分结算 / 已结算 */
  settle: '未结算' | '部分结算' | '已结算';
  /** 履约单总数 */
  total: number;
  /** 已分发（接单及以上）履约单数 */
  distributed: number;
  /** 已发货履约单数 */
  shipped: number;
  /** 已结算履约单数 */
  settled: number;
}

/**
 * 家族三状态聚合（按履约单维度：未拆分 = 默认履约单01；拆分后 = 全部子履约单，母单不参与聚合）
 * 销售Single行显示聚合药丸 + 数值（如 部分发货 1/3）。
 */
export function familyStatesOf(family: OrderFamily): FamilyStates {
  const units = fulfillmentUnitsOf(family);
  const list = units.map((u) => u.underlying);
  const accepted = ['processed', 'completed', 'self_accepted', 'self_shipped', 'self_delivered'];
  const distributed = list.filter((o) => accepted.includes(o.processStatus)).length;
  const shipped = list.filter((o) => shipStateOf(o) === '已发货').length;
  const settled = list.filter((o) => settleStateOf(o) === '已结算').length;
  const total = list.length;
  const distribute: FamilyStates['distribute'] = list.every((o) => o.processStatus === 'pending')
    ? '待分发'
    : distributed === total
      ? '已分发'
      : '分发中';
  const shipMap: Record<TriState, FamilyStates['ship']> = { '全部': '全部发货', '部分': '部分发货', '未': '未发货' };
  const settleMap: Record<TriState, FamilyStates['settle']> = { '全部': '已结算', '部分': '部分结算', '未': '未结算' };
  return {
    distribute,
    ship: shipMap[aggregate(list.map((o) => shipStateOf(o) === '已发货'))],
    settle: settleMap[aggregate(list.map((o) => settleStateOf(o) === '已结算'))],
    total,
    distributed,
    shipped,
    settled,
  };
}

/** 三状态色板（列表/详情统一） */
export const FAMILY_STATE_COLORS = {
  '待分发': { bg: '#FFF3E0', color: '#E65100' },
  '分发中': { bg: '#FBF3E2', color: '#9A7A1C' },
  '已分发': { bg: '#E8F5E9', color: '#01795D' },
  '未发货': { bg: '#F5F5F5', color: '#9E9E9E' },
  '部分发货': { bg: '#FFF3E0', color: '#E65100' },
  '全部发货': { bg: '#E8F5E9', color: '#01795D' },
  '未结算': { bg: '#F5F5F5', color: '#9E9E9E' },
  '部分结算': { bg: '#E0F2F1', color: '#00695C' },
  '已结算': { bg: '#E8F5E9', color: '#01795D' },
  '已分发·已完成': { bg: '#ECEFF1', color: '#455A64' },
} as const;
