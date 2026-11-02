/**
 * 自营工作台共享工具：自营订单集合（订阅）与统计
 * 数据边界：path === 'self' 的销售单（与管理后台共用同一 orderFlowStore，双端实时联动）
 */
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import type { ExternalOrder } from '../../types';

/** 自营执行中状态集合（path=self 时 completed 也属于自营链终态） */
export const SELF_STATUSES = ['self_pending', 'self_accepted', 'self_shipped', 'self_delivered'];

/** 是否自营订单（分发转自营后的全链路） */
export const isSelfOrder = (o: ExternalOrder): boolean =>
  o.path === 'self' || SELF_STATUSES.includes(o.processStatus);

/** 自营订单集合（响应式） */
export function useSelfOrders(): ExternalOrder[] {
  return useOrderFlowStore((s) => s.orders.filter(isSelfOrder));
}

/** 某跟单人名下自营订单数（响应式；缺省统计全部自营） */
export function useMyFollowCount(follower?: string): number {
  return useOrderFlowStore((s) => s.orders.filter((o) => isSelfOrder(o) && (!follower || o.follower === follower)).length);
}
