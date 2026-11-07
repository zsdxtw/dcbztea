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
  /** 子履约单（按编号升序：FO01、FO02…） */
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
}

/** 家族（母单含子单）三状态聚合 */
export function familyStatesOf(family: OrderFamily): FamilyStates {
  const list = family.all;
  const accepted = ['processed', 'completed', 'self_accepted', 'self_shipped', 'self_delivered'];
  const distribute: FamilyStates['distribute'] = list.every((o) => o.processStatus === 'pending')
    ? '待分发'
    : list.every((o) => accepted.includes(o.processStatus))
      ? '已分发'
      : '分发中';
  const shipMap: Record<TriState, FamilyStates['ship']> = { '全部': '全部发货', '部分': '部分发货', '未': '未发货' };
  const settleMap: Record<TriState, FamilyStates['settle']> = { '全部': '已结算', '部分': '部分结算', '未': '未结算' };
  return {
    distribute,
    ship: shipMap[aggregate(list.map((o) => shipStateOf(o) === '已发货'))],
    settle: settleMap[aggregate(list.map((o) => settleStateOf(o) === '已结算'))],
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
