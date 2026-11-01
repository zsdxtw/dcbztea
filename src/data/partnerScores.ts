/**
 * 合作商积分体系 Mock 数据源
 * - scoreBases：期初分与履约率（月度快照，比单评分的履约维度数据源）
 * - scoreEntries：积分台账流水（拜访 / 报备 / 履约 / 处罚四维加减分）
 */
import type { PartnerScoreBase, PartnerScoreEntry } from '../types';

/** 期初分与履约率（键=供应商 ID） */
export const scoreBases: Record<string, PartnerScoreBase> = {
  '3': { base: 70, ontimeRate: 95 },
  '5': { base: 60, ontimeRate: 88 },
  '8': { base: 66, ontimeRate: 92 },
  '10': { base: 58, ontimeRate: 85 },
  '11': { base: 62, ontimeRate: 90 },
};

/** 积分台账种子（近两月流水） */
export const scoreEntries: PartnerScoreEntry[] = [
  /* ── 八马茶业（3）── */
  { id: 'se_3_1', supplierId: '3', supplierName: '八马茶业股份有限公司', dimension: 'visit', delta: 6, reason: '客户拜访 3 次（华茗堂茶庄 / 清心茶坊 / 天福茗茶）', time: '2026-10-09', operator: 'admin' },
  { id: 'se_3_2', supplierId: '3', supplierName: '八马茶业股份有限公司', dimension: 'report', delta: 5, reason: '商品报备审批通过（铁观音 · 福建区域）', time: '2026-10-06', refCode: 'BB20261006002', operator: '管理员' },
  { id: 'se_3_3', supplierId: '3', supplierName: '八马茶业股份有限公司', dimension: 'fulfillment', delta: 5, reason: '订单按时发货并完成结算', time: '2026-09-28', refCode: 'HHSO20260905005', operator: '管理员' },
  { id: 'se_3_4', supplierId: '3', supplierName: '八马茶业股份有限公司', dimension: 'fulfillment', delta: 3, reason: '订单按时发货', time: '2026-09-20', refCode: 'HHSO20260912001', operator: '管理员' },
  { id: 'se_3_5', supplierId: '3', supplierName: '八马茶业股份有限公司', dimension: 'penalty', delta: -10, reason: '客户投诉包装破损（已赔付）', time: '2026-09-15', operator: '管理员' },

  /* ── 竹叶青（8）── */
  { id: 'se_8_1', supplierId: '8', supplierName: '四川省茶业集团股份有限公司', dimension: 'visit', delta: 10, reason: '客户拜访 5 次（四川区域茶行巡访）', time: '2026-10-11', operator: 'zyq001' },
  { id: 'se_8_2', supplierId: '8', supplierName: '四川省茶业集团股份有限公司', dimension: 'report', delta: 10, reason: '客户报备审批通过并完成首单履约', time: '2026-10-02', refCode: 'BB20260920003', operator: '管理员' },
  { id: 'se_8_3', supplierId: '8', supplierName: '四川省茶业集团股份有限公司', dimension: 'fulfillment', delta: 5, reason: '订单按时发货并完成结算', time: '2026-09-26', refCode: 'HHSO20260908004', operator: '管理员' },
  { id: 'se_8_4', supplierId: '8', supplierName: '四川省茶业集团股份有限公司', dimension: 'fulfillment', delta: 5, reason: '订单按时发货并完成结算', time: '2026-09-12', refCode: 'HHSO20260901006', operator: '管理员' },

  /* ── 云茶供应链（11）── */
  { id: 'se_11_1', supplierId: '11', supplierName: '杭州云茶供应链管理有限公司', dimension: 'visit', delta: 4, reason: '客户拜访 2 次（苏州吴门茶事 / 南京翠竹茶行）', time: '2026-10-12', operator: 'admin' },
  { id: 'se_11_2', supplierId: '11', supplierName: '杭州云茶供应链管理有限公司', dimension: 'report', delta: 5, reason: '商品报备审批通过（武夷岩茶 · 水金龟 · 江苏区域）', time: '2026-09-11', refCode: 'BB20260910003', operator: '管理员' },
  { id: 'se_11_3', supplierId: '11', supplierName: '杭州云茶供应链管理有限公司', dimension: 'report', delta: 5, reason: '商品报备审批通过（冷泡茶便携装 · 全国）', time: '2026-09-02', refCode: 'BB20260901006', operator: '管理员' },
  { id: 'se_11_4', supplierId: '11', supplierName: '杭州云茶供应链管理有限公司', dimension: 'fulfillment', delta: -5, reason: '订单超时发货', time: '2026-09-18', refCode: 'HHSO20260910003', operator: '管理员' },
  { id: 'se_11_5', supplierId: '11', supplierName: '杭州云茶供应链管理有限公司', dimension: 'penalty', delta: -10, reason: '客户投诉迟发未提前报备', time: '2026-09-19', operator: '管理员' },

  /* ── 中茶（5）── */
  { id: 'se_5_1', supplierId: '5', supplierName: '中国茶叶股份有限公司', dimension: 'visit', delta: 4, reason: '客户拜访 2 次', time: '2026-10-08', operator: 'admin' },
  { id: 'se_5_2', supplierId: '5', supplierName: '中国茶叶股份有限公司', dimension: 'fulfillment', delta: 5, reason: '订单按时发货并完成结算', time: '2026-09-22', refCode: 'HHSO20260911002', operator: '管理员' },
];

/** 积分维度中文标签 */
export const SCORE_DIMENSION_LABELS: Record<string, string> = {
  visit: '客户拜访',
  report: '报备情况',
  fulfillment: '履约情况',
  penalty: '处罚情况',
};

/** 积分规则说明（页面展示用） */
export const SCORE_RULES: { dimension: string; add: string; sub: string; hook: string }[] = [
  { dimension: '客户拜访', add: '拜访 +2 / 次（终端提交，管理台确认）', sub: '—', hook: '合作商终端 · 抢单大厅-拜访记录' },
  { dimension: '报备情况', add: '报备审批通过 +5；转单并完成 +10', sub: '虚假报备 −10', hook: '报备审批（销售 · 报备管理）' },
  { dimension: '履约情况', add: '按时发货 +3；结算完成 +5', sub: '超时发货 −5', hook: '外部订单履约推进 / 合作商订单结算' },
  { dimension: '处罚情况', add: '—', sub: '客户投诉 −10；严重违约 −20', hook: '合作商积分页 · 手动登记' },
];
