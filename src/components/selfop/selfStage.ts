/**
 * 自营订单阶段推导（自营工作台统一口径）
 * 阶段由履约状态（fulfillment.stage）驱动：待接单 → 已接单 → 运输中 → 妥投 → 已确收；
 * 行内档位名对齐合作商工作台（待接单/已接单/运输中/妥投/已确收）；TAB 将运输中+妥投合并为「已发货」桶。
 */
import type { ExternalOrder } from '../../types';

export type SelfStage = 'pending' | 'accepted' | 'shipping' | 'transit' | 'confirmed' | 'cancelled';

export const STAGE_META: Record<SelfStage, { label: string; bg: string; color: string }> = {
  pending: { label: '待接单', bg: '#E3F2FD', color: '#0F64B5' },
  accepted: { label: '已接单', bg: '#E8EAF6', color: '#3949AB' },
  shipping: { label: '运输中', bg: '#EEF0FB', color: '#4A4FA0' },
  transit: { label: '妥投', bg: '#E0F2F1', color: '#00695C' },
  confirmed: { label: '已确收', bg: '#E8F5E9', color: '#2E7D32' },
  cancelled: { label: '已取消', bg: '#FFEBEE', color: '#C62828' },
};

/**
 * 自营阶段（含关联采购单包裹：任一物流单号即运输中；全部妥投即妥投档）
 * pos 为该单关联采购单集合
 */
export function selfStageOf(o: ExternalOrder, pos: { packages: { status: string }[] }[]): SelfStage {
  if (o.processStatus === 'cancelled') return 'cancelled';
  if (o.processStatus === 'self_pending') return 'pending';
  /* 已接单及后续：按包裹推导档位（无包裹=已接单；部分发货=运输中；全部妥投=妥投；全部确收=已确收） */
  const own = o.selfShipments ?? [];
  const po = pos.flatMap((d) => d.packages.filter((x) => x.status !== 'void'));
  const all = [...own, ...po];
  if (all.length > 0) {
    if (all.some((x) => x.status === 'confirmed')) return 'confirmed';
    if (all.some((x) => x.status === 'delivered')) return 'transit';
    if (all.some((x) => x.status === 'shipped')) return 'shipping';
  }
  const stage = o.fulfillment?.stage;
  if (stage === 'confirmed') return 'confirmed';
  if (stage === 'transit') return 'transit';
  if (stage === 'shipping') return 'shipping';
  return 'accepted';
}

/** 已接单子状态：采购在途 / 到货待发（入库制采购到货） */
export function acceptedSub(o: ExternalOrder, pos: { status: string; deliveryMode: string }[]): string {
  const wh = pos.filter((d) => d.deliveryMode === 'warehouse');
  if (wh.some((d) => ['received', 'partial_shipped', 'fully_shipped', 'delivered'].includes(d.status))) return '到货待出库';
  if (pos.length > 0) return '采购在途';
  return '待采购&发货';
}

/** 自营订单的包裹总数与妥投数（自营分仓包裹 + 关联采购单直发包裹） */
export function packageStatsOf(o: ExternalOrder, pos: { packages: { status: string }[] }[]): { total: number; delivered: number; confirmed: number } {
  const own = o.selfShipments ?? [];
  const po = pos.flatMap((d) => d.packages.filter((x) => x.status !== 'void'));
  const all = [...own, ...po];
  return {
    total: all.length,
    delivered: all.filter((x) => x.status === 'delivered').length,
    confirmed: all.filter((x) => x.status === 'confirmed').length,
  };
}
