/**
 * 销售履约状态与时间线（管理后台 / 合作商工作台 / 自营工作台共用口径）
 *
 * 状态链：待接单 → 已接单 → 已发货 → 已签收/妥投 → 确认收货
 * 时间点：来单时间（分发到自营/合作商）、接单时间、发货时间、妥投时间、确收时间
 */
import type { ExternalOrder, FulfillmentStage } from '../types';

export const FULFILLMENT_STAGES: { key: FulfillmentStage; label: string }[] = [
  { key: 'pending_accept', label: '待接单' },
  { key: 'accepted', label: '已接单' },
  { key: 'shipped', label: '已发货' },
  { key: 'delivered', label: '已签收/妥投' },
  { key: 'confirmed', label: '确认收货' },
];

export const FULFILLMENT_STAGE_LABELS: Record<FulfillmentStage, string> = {
  pending_accept: '待接单',
  accepted: '已接单',
  shipped: '已发货',
  delivered: '已签收/妥投',
  confirmed: '确认收货',
};

export const FULFILLMENT_STAGE_COLORS: Record<FulfillmentStage, { bg: string; color: string }> = {
  pending_accept: { bg: '#FFF4E5', color: '#B26A00' },
  accepted: { bg: '#E8F1FB', color: '#0F64B5' },
  shipped: { bg: '#EEF0FB', color: '#4A4FA0' },
  delivered: { bg: '#E6F5F0', color: '#01795D' },
  confirmed: { bg: '#E8F5E9', color: '#2E7D32' },
};

/** 履约状态推导：优先取 fulfillment.stage，旧数据按 processStatus / partnerStatus 兜底 */
export function stageOfOrder(o: ExternalOrder): FulfillmentStage {
  if (o.fulfillment?.stage) return o.fulfillment.stage;
  if (o.processStatus === 'completed' || o.partnerStatus === 'settled') return 'confirmed';
  if (o.processStatus === 'self_delivered' || o.partnerStatus === 'delivered') return 'delivered';
  if (o.processStatus === 'self_shipped' || o.partnerStatus === 'shipping' || o.partnerStatus === 'transit') return 'shipped';
  if (o.processStatus === 'self_accepted' || o.partnerStatus === 'accepted') return 'accepted';
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

/** 已到达的履约阶段序号（0-4），用于进度点 */
export const stageIndexOf = (s: FulfillmentStage): number =>
  FULFILLMENT_STAGES.findIndex((x) => x.key === s);
