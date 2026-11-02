/**
 * 自营订单阶段推导（管理后台「销售单自营」与「自营工作台」共用口径）
 */
import type { ExternalOrder } from '../../types';

export type SelfStage = 'pending' | 'accepted' | 'shipping' | 'delivered' | 'done';

export const STAGE_META: Record<SelfStage, { label: string; bg: string; color: string }> = {
  pending: { label: '自营待接单', bg: '#E3F2FD', color: '#0F64B5' },
  accepted: { label: '已接单', bg: '#E8EAF6', color: '#3949AB' },
  shipping: { label: '已发货运输中', bg: '#E1F5FE', color: '#0277BD' },
  delivered: { label: '妥投', bg: '#E0F2F1', color: '#00695C' },
  done: { label: '确认收货', bg: '#ECEFF1', color: '#455A64' },
};

/**
 * 自营阶段（含关联采购单包裹：任一物流单号即运输中）
 * pos 为该单关联采购单集合
 */
export function selfStageOf(o: ExternalOrder, pos: { packages: { status: string }[] }[]): SelfStage {
  switch (o.processStatus) {
    case 'self_pending': return 'pending';
    case 'self_accepted': {
      const hasPackage = (o.selfShipments?.length ?? 0) > 0 || pos.some((d) => d.packages.some((x) => x.status !== 'void'));
      return hasPackage ? 'shipping' : 'accepted';
    }
    case 'self_shipped': return 'shipping';
    case 'self_delivered': return 'delivered';
    default: return 'done';
  }
}

/** 已接单子状态：采购在途 / 到货待发（入库制采购到货） */
export function acceptedSub(o: ExternalOrder, pos: { status: string; deliveryMode: string }[]): string {
  const wh = pos.filter((d) => d.deliveryMode === 'warehouse');
  if (wh.some((d) => ['received', 'partial_shipped', 'fully_shipped', 'delivered'].includes(d.status))) return '到货待出库';
  if (pos.length > 0) return '采购在途';
  return '待采购&发货';
}

/** 自营订单的包裹总数与妥投数（自营分仓包裹 + 关联采购单直发包裹） */
export function packageStatsOf(o: ExternalOrder, pos: { packages: { status: string }[] }[]): { total: number; delivered: number } {
  const own = o.selfShipments ?? [];
  const po = pos.flatMap((d) => d.packages.filter((x) => x.status !== 'void'));
  const all = [...own, ...po];
  return { total: all.length, delivered: all.filter((x) => x.status === 'delivered').length };
}
