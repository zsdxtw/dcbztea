/**
 * 销售单母子家族与状态推导（状态体系：销售单订单状态 + 履约单状态分开）
 * 销售单管理（母单一行聚合）与销售单详情页共用口径。
 *
 * 履约单状态（四块）：
 * - 分发状态（5 态）：待分发 / 自营待接单 / 转派比单中 / 转派待接单 / 分发已完成
 * - 履约状态（5 态）：待接单 / 已接单 / 运输中 / 已妥投 / 已确收
 * - 结算状态（收款·开票二维组合）：未收款/已收款 × 未开票/已开票，如「未收款·已开票」
 * - 订单进度（5 态）：分发中 / 履约中 / 结算中 / 已办结 / 已取消
 *
 * 销售单状态：
 * - 订单状态（4 态）：未处理（尚未送分发，未生成履约单）/ 处理中 / 已办结（全部履约单办结）/ 已取消（全部取消）
 * - 进度聚合：分发进度 / 履约进度 / 结算进度（按履约单维度，x/y 分母为有效履约单数）
 */
import type { ExternalOrder } from '../types';
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

/* ── 单笔履约单状态（分发 / 履约 / 结算 / 订单进度） ── */

/** 分发状态 5 态（已取消归入订单进度，不再在分发状态中展示） */
export type DistributeState = '待分发' | '自营待接单' | '转派比单中' | '转派待接单' | '分发已完成';

const DISTRIBUTE_MAP: Record<string, DistributeState> = {
  pending: '待分发',
  self_pending: '自营待接单',
  comparing: '转派比单中',
  distribute_pending: '转派待接单',
  processed: '分发已完成',
};

/** 单笔分发状态（5 态；未生成履约单 / 已取消显示 —） */
export function distributeStateOf(o: ExternalOrder): DistributeState | '—' {
  return DISTRIBUTE_MAP[o.processStatus] ?? '—';
}

/** 履约状态 5 态（已取消归入订单进度，不再在履约状态中展示） */
export type FulfillState = '待接单' | '已接单' | '运输中' | '已妥投' | '已确收';

const STAGE_MAP: Record<string, FulfillState> = {
  pending_accept: '待接单',
  accepted: '已接单',
  shipping: '运输中',
  transit: '已妥投',
  confirmed: '已确收',
};

/**
 * 单笔履约状态（5 态：待接单 / 已接单 / 运输中 / 已妥投 / 已确收）
 * 未进入履约主体（未分发 / 待分发 / 比单中）→ —；已取消 → —（由订单进度承载）。
 */
export function fulfillStateOf(o: ExternalOrder): FulfillState | '—' {
  if (o.processStatus === 'cancelled') return '—';
  if (o.processStatus === 'unprocessed' || o.processStatus === 'pending' || o.processStatus === 'comparing') return '—';
  return STAGE_MAP[stageOfOrder(o)] ?? '待接单';
}

/**
 * 内部：结算落库状态（未结算 / 部分结算 / 已结算）
 * 分母 = 已妥投/已确收包裹（未发货包裹不进分母）；无已妥投包裹时回退订单级 settled 标记。
 */
function settlementStateOf(o: ExternalOrder, pos?: { packages: PkgLike[] }[]): '未结算' | '部分结算' | '已结算' {
  const eligible = packagesOf(o, pos).filter((p) => p.status === 'delivered' || p.status === 'confirmed');
  if (eligible.length === 0) return (o.settled ?? o.settleOnTime !== undefined) ? '已结算' : '未结算';
  const settled = eligible.filter((p) => p.settled).length;
  if (settled === 0) return '未结算';
  return settled === eligible.length ? '已结算' : '部分结算';
}

/** 单笔收款状态（二元）：结算落库完成 → 已收款 */
export function receiveStateOf(o: ExternalOrder, pos?: { packages: PkgLike[] }[]): '未收款' | '已收款' {
  return settlementStateOf(o, pos) === '已结算' ? '已收款' : '未收款';
}

/** 单笔开票状态（二元）：已登记部分开票 / 全额开票 → 已开票 */
export function invoiceStateOf(o: ExternalOrder): '未开票' | '已开票' {
  return o.invoiceStatus === 'invoiced' || o.invoiceStatus === 'partial' ? '已开票' : '未开票';
}

/** 单笔结算状态（收款 + 开票两个维度组合展示，如「未收款·已开票」） */
export function settleStateOf(o: ExternalOrder, pos?: { packages: PkgLike[] }[]): string {
  return `${receiveStateOf(o, pos)}·${invoiceStateOf(o)}`;
}

/** 订单进度（履约单维度）：分发中 / 履约中 / 结算中 / 已办结 / 已取消 */
export type OrderProgress = '分发中' | '履约中' | '结算中' | '已办结' | '已取消';

/**
 * 单笔订单进度：
 * - 已取消：订单取消（分发/履约状态不再展示已取消）
 * - 已办结：收款 + 开票均完成；或已收款后手工办结
 * - 结算中：已确收并发起了对账结算
 * - 分发中：分发状态处于待分发 / 转派比单中 / 自营待接单 / 转派待接单
 * - 履约中：其余已进入履约的订单
 */
export function orderProgressOf(o: ExternalOrder, pos?: { packages: PkgLike[] }[]): OrderProgress {
  if (o.processStatus === 'cancelled' || o.fulfillment?.stage === 'cancelled') return '已取消';
  const received = receiveStateOf(o, pos) === '已收款';
  const invoiced = invoiceStateOf(o) === '已开票';
  if (o.closed || (received && invoiced)) return '已办结';
  if (o.settlementStarted) return '结算中';
  if (['unprocessed', 'pending', 'comparing', 'self_pending', 'distribute_pending'].includes(o.processStatus)) return '分发中';
  return '履约中';
}

export interface FamilyStates {
  /** 订单状态（销售单维度）：未处理（尚未送分发） / 处理中 / 已办结 / 已取消 */
  orderStatus: '未处理' | '处理中' | '已办结' | '已取消';
  /** 分发进度聚合：未分发 / 分发中 / 分发完成（全部取消时为已取消） */
  distribute: '未分发' | '分发中' | '分发完成' | '已取消';
  /** 履约进度聚合：未履约 / 履约中 / 履约完成（全部取消时为已取消） */
  fulfill: '未履约' | '履约中' | '履约完成' | '已取消';
  /** 结算进度聚合：未结算 / 结算中 / 结算完成 */
  settle: '未结算' | '结算中' | '结算完成';
  /** 履约单总数（含已取消） */
  total: number;
  /** 有效履约单数（剔除已取消） */
  active: number;
  /** 分发已完成履约单数 */
  distributed: number;
  /** 已确收履约单数 */
  fulfilled: number;
  /** 已收款履约单数 */
  settled: number;
  /** 已办结履约单数 */
  closed: number;
}

/** 履约单是否已全部确收（履约完成判定） */
const isFulfilled = (o: ExternalOrder): boolean =>
  o.processStatus !== 'cancelled' && fulfillStateOf(o) === '已确收';

/**
 * 母销售单四维进度聚合（按履约单维度：未拆分 = 默认履约单01；拆分后 = 全部子履约单，母单不参与聚合）
 * 进度值 x/y：x = 已完成履约单数，y = 有效履约单数（剔除已取消）。
 * 未进入 → 未…；部分进入或部分完成 → …中；全部完成 → …完成；全部取消 → 已取消（分发 / 履约）。
 * 销售单订单状态：全部履约单已办结 → 已办结；全部已取消 → 已取消；其余 → 处理中。
 */
export function familyStatesOf(family: OrderFamily): FamilyStates {
  const units = fulfillmentUnitsOf(family);
  const list = units.map((u) => u.underlying);
  const total = list.length;
  const active = list.filter((o) => o.processStatus !== 'cancelled');
  const cancelledAll = total > 0 && active.length === 0;

  /* 尚未生成履约单（未送分发）：订单状态＝未处理，进度显示未…；已取消销售单除外 */
  if (total === 0) {
    const cancelled = family.mother.processStatus === 'cancelled';
    return {
      orderStatus: cancelled ? '已取消' : '未处理',
      distribute: cancelled ? '已取消' : '未分发',
      fulfill: cancelled ? '已取消' : '未履约',
      settle: '未结算',
      total: 0,
      active: 0,
      distributed: 0,
      fulfilled: 0,
      settled: 0,
      closed: 0,
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
  const FULFILL_DOING: string[] = ['已接单', '运输中', '已妥投'];
  const fulfill: FamilyStates['fulfill'] = cancelledAll
    ? '已取消'
    : fulfilled === active.length
      ? '履约完成'
      : fulfilled > 0 || active.some((o) => FULFILL_DOING.includes(fulfillStateOf(o)))
        ? '履约中'
        : '未履约';

  /* 结算（收款）：已收款履约单数 / 有效履约单数 */
  const receivedList = active.map((o) => receiveStateOf(o));
  const settled = receivedList.filter((s) => s === '已收款').length;
  const settle: FamilyStates['settle'] = settled === active.length
    ? '结算完成'
    : settled > 0
      ? '结算中'
      : '未结算';

  /* 订单进度：已办结履约单数 / 有效履约单数 */
  const closed = active.filter((o) => orderProgressOf(o) === '已办结').length;
  const orderStatus: FamilyStates['orderStatus'] = cancelledAll
    ? '已取消'
    : closed === active.length
      ? '已办结'
      : '处理中';

  return { orderStatus, distribute, fulfill, settle, total, active: active.length, distributed, fulfilled, settled, closed };
}

/** 状态色板（列表/详情统一，按显示文案取色） */
export const FAMILY_STATE_COLORS = {
  /* 销售单订单状态 */
  '未处理': { bg: '#FFF3E0', color: '#B26A00' },
  '处理中': { bg: '#E3F2FD', color: '#0F64B5' },
  '已办结': { bg: '#E8F5E9', color: '#01795D' },
  '已取消': { bg: '#FFEBEE', color: '#C62828' },
  /* 分发聚合 */
  '未分发': { bg: '#F5F5F5', color: '#9E9E9E' },
  '分发中': { bg: '#FBF3E2', color: '#9A7A1C' },
  '分发完成': { bg: '#E8F5E9', color: '#01795D' },
  /* 分发状态 5 态 */
  '待分发': { bg: '#FFF3E0', color: '#E65100' },
  '自营待接单': { bg: '#E3F2FD', color: '#0F64B5' },
  '转派比单中': { bg: '#F3E5F5', color: '#7B1FA2' },
  '转派待接单': { bg: '#E0F2F1', color: '#00695C' },
  '分发已完成': { bg: '#E8F5E9', color: '#01795D' },
  /* 履约（聚合 + 履约单 5 态） */
  '未履约': { bg: '#F5F5F5', color: '#9E9E9E' },
  '履约中': { bg: '#E3F2FD', color: '#0F64B5' },
  '履约完成': { bg: '#E8F5E9', color: '#2E7D32' },
  '待接单': { bg: '#FFF4E5', color: '#B26A00' },
  '已接单': { bg: '#E8F1FB', color: '#0F64B5' },
  '运输中': { bg: '#EEF0FB', color: '#4A4FA0' },
  '已妥投': { bg: '#E0F2F1', color: '#00695C' },
  '已确收': { bg: '#E8F5E9', color: '#2E7D32' },
  /* 结算（收款 / 开票 / 组合） */
  '未结算': { bg: '#F5F5F5', color: '#9E9E9E' },
  '结算中': { bg: '#FBF3E2', color: '#9A7A1C' },
  '结算完成': { bg: '#E8F5E9', color: '#01795D' },
  '未收款': { bg: '#F5F5F5', color: '#9E9E9E' },
  '已收款': { bg: '#E8F5E9', color: '#01795D' },
  '未开票': { bg: '#F5F5F5', color: '#9E9E9E' },
  '已开票': { bg: '#E8F5E9', color: '#01795D' },
  '未收款·未开票': { bg: '#F5F5F5', color: '#9E9E9E' },
  '未收款·已开票': { bg: '#FFF3E0', color: '#B26A00' },
  '已收款·未开票': { bg: '#E0F7FA', color: '#00838F' },
  '已收款·已开票': { bg: '#E8F5E9', color: '#01795D' },
} as const;
