/**
 * 履约状态与时间线（管理后台 / 合作商工作台 / 自营工作台共用口径）
 *
 * 状态链：待接单 → 已接单 → 运输中 / 妥投（已发货档，依物流信息）→ 已确收（客户确认收货，管理后台手工/联机操作）
 * 时间点：来单时间（分发到自营/合作商）、接单时间、发货时间、妥投时间、确收时间
 */
import type { ExternalOrder, FulfillmentStage } from '../types';

export const FULFILLMENT_STAGES: { key: FulfillmentStage; label: string }[] = [
  { key: 'pending_accept', label: '待接单' },
  { key: 'accepted', label: '已接单' },
  { key: 'shipping', label: '运输中' },
  { key: 'transit', label: '妥投' },
  { key: 'confirmed', label: '已确收' },
  { key: 'cancelled', label: '已取消' },
];

export const FULFILLMENT_STAGE_LABELS: Record<FulfillmentStage, string> = {
  pending_accept: '待接单',
  accepted: '已接单',
  shipping: '运输中',
  transit: '妥投',
  confirmed: '已确收',
  cancelled: '已取消',
};

export const FULFILLMENT_STAGE_COLORS: Record<FulfillmentStage, { bg: string; color: string }> = {
  pending_accept: { bg: '#FFF4E5', color: '#B26A00' },
  accepted: { bg: '#E8F1FB', color: '#0F64B5' },
  shipping: { bg: '#EEF0FB', color: '#4A4FA0' },
  transit: { bg: '#E6F5F0', color: '#01795D' },
  confirmed: { bg: '#E8F5E9', color: '#2E7D32' },
  cancelled: { bg: '#FFEBEE', color: '#C62828' },
};

/** 履约状态推导：优先 fulfillment.stage；无时间线时按 partnerStatus / 分发状态兜底 */
export function stageOfOrder(o: ExternalOrder): FulfillmentStage {
  if (o.fulfillment?.stage) return o.fulfillment.stage;
  if (o.processStatus === 'cancelled') return 'cancelled';
  if (o.partnerStatus) {
    return o.partnerStatus === 'pending' || o.partnerStatus === 'rejected' ? 'pending_accept' : o.partnerStatus;
  }
  return 'pending_accept';
}

/** 履约五节点时间（缺失显示 —） */
export function fulfillmentTimes(o: ExternalOrder): { label: string; value: string }[] {
  const t = o.fulfillment;
  return [
    { label: '来单时间', value: t?.arriveTime ?? '—' },
    { label: '接单时间', value: t?.acceptTime ?? '—' },
    { label: '发货时间', value: t?.shipTime ?? '—' },
    { label: '妥投时间', value: t?.deliverTime ?? '—' },
    { label: '确收时间', value: t?.confirmTime ?? '—' },
  ];
}

/** 已到达的履约阶段序号（0-5），用于进度点 */
export const stageIndexOf = (s: FulfillmentStage): number =>
  FULFILLMENT_STAGES.findIndex((x) => x.key === s);
