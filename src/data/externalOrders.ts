/**
 * 订单处理（销售订单入口）Mock 数据源
 * 来源渠道：手工录入（manual）/ 平台直连推送（push）
 * 种子覆盖全部状态：待处理 / 自营待接单 / 抢单中 / 比单中（报名制）/ 分发待接单 / 已处理 / 已完成
 */
import type { ExternalOrder, ExternalPlatform } from '../types';

const minutesLater = (m: number) => Date.now() + m * 60 * 1000;

export const externalOrderSeeds: ExternalOrder[] = [
  /* ── 待处理（手工录入） ── */
  {
    id: 'eo1', code: 'WB20261025001', platform: 'tmall', externalOrderNo: 'TM-88213907-1',
    customerName: '清心茶坊', customerType: '直营客户', customerRegion: '浙江宁波',
    items: [{ productId: 'p5', productName: '金骏眉·特级', spec: '50g/罐', quantity: 12, price: 1024 }],
    totalAmount: 12288,
    receiver: '清心茶坊收发部', receiverPhone: '139****2210', receiverAddress: '浙江宁波市鄞州区中山东路2001号',
    remark: '双十一预售尾款订单',
    entryTime: '2026-10-25', operator: '运营小周', sourceChannel: 'manual',
    processStatus: 'pending',
    history: [{ time: '2026-10-25', action: '手工录入订单', detail: '天猫平台' }],
  },

  /* ── 待处理（平台直连推送） ── */
  {
    id: 'eo8', code: 'WB20261025002', platform: 'douyin', externalOrderNo: 'DY-99012218',
    customerName: '茶颜悦色文创店', customerType: '渠道客户', customerRegion: '湖南长沙',
    items: [
      { productId: 'p2', productName: '碧螺春·一级', spec: '100g/袋', quantity: 25, price: 328 },
      { productId: 'p12', productName: '寿眉·2019年陈', spec: '350g/饼', quantity: 30, price: 158 },
    ],
    totalAmount: 12840,
    receiver: '文创店仓储部', receiverPhone: '0731-8866****', receiverAddress: '湖南长沙市天心区太平老街58号',
    remark: '抖音商城直连推送，自动建单',
    entryTime: '2026-10-25', operator: '系统直连', sourceChannel: 'push',
    processStatus: 'pending',
    history: [{ time: '2026-10-25', action: '直连推送订单', detail: '抖音商城 API 自动同步' }],
  },

  /* ── 自营待接单（等管理后台在销售订单-流转订单接单） ── */
  {
    id: 'eo9', code: 'WB20261024004', platform: 'tmall', externalOrderNo: 'TM-88012554-3',
    customerName: '浦发银行', customerType: '平台客户', customerRegion: '上海浦东',
    items: [{ productId: 'p8', productName: '白毫银针·特级', spec: '50g/罐', quantity: 15, price: 768 }],
    totalAmount: 11520,
    receiver: '浦发银行采购中心', receiverPhone: '021-5888****', receiverAddress: '上海市浦东新区浦东南路500号',
    remark: '走京东慧采平台，需提供随货同行单',
    entryTime: '2026-10-24', operator: '运营老陈', sourceChannel: 'manual',
    processStatus: 'self_pending',
    path: 'self',
    history: [
      { time: '2026-10-24', action: '手工录入订单', detail: '天猫平台' },
      { time: '2026-10-24', action: '选择自营路径', detail: '背对背采购 · 等待管理后台接单（销售订单 → 流转订单）' },
    ],
  },

  /* ── 抢单中（演示：发布后 25 分钟内可抢） ── */
  {
    id: 'eo5', code: 'WB20261025005', platform: 'pdd', externalOrderNo: 'PDD-2093184-1',
    customerName: '茗香阁直播', customerType: '带货客户', customerRegion: '广东广州',
    items: [{ productId: 'p11', productName: '凤凰单丛·蜜兰香', spec: '100g/袋', quantity: 50, price: 374 }],
    totalAmount: 18700,
    receiver: '茗香阁仓储', receiverPhone: '137****0912', receiverAddress: '广东广州市白云区黄石东路288号',
    remark: '直播间爆单，今晚 8 点前须发出',
    entryTime: '2026-10-25', operator: '运营小周', sourceChannel: 'manual',
    processStatus: 'grabbing',
    path: 'distribute', distributeMode: 'grab',
    grabDeadline: minutesLater(25),
    grabRecords: [],
    history: [
      { time: '2026-10-25', action: '手工录入订单', detail: '拼多多平台' },
      { time: '2026-10-25', action: '发布抢单', detail: '已推送合作商抢单大厅 · 时间优先' },
    ],
  },

  /* ── 比单中（公开报名制：底价 88 折，已有 2 家报名） ── */
  {
    id: 'eo6', code: 'WB20261025006', platform: 'jd', externalOrderNo: 'JD-20603995',
    customerName: '天福茗茶', customerType: '渠道客户', customerRegion: '福建厦门',
    items: [
      { productId: 'p9', productName: '铁观音·清香一级', spec: '250g/罐', quantity: 40, price: 208 },
      { productId: 'p10', productName: '大红袍·特级', spec: '150g/盒', quantity: 22, price: 494 },
    ],
    totalAmount: 19148,
    receiver: '天福物流部', receiverPhone: '0571-566****', receiverAddress: '福建厦门市思明区莲前西路209号',
    entryTime: '2026-10-25', operator: '运营老陈', sourceChannel: 'manual',
    processStatus: 'comparing',
    path: 'distribute', distributeMode: 'compare',
    compare: {
      deadline: minutesLater(40),
      floorRule: { type: 'discount', value: 88 },
      floorNote: '报名报价不得低于订单金额的 88 折（¥16,850）',
      quotes: [
        { supplierId: '3', supplierName: '八马茶业股份有限公司', amount: 17400, quoteTime: '2026-10-25 10:12' },
        { supplierId: '8', supplierName: '四川省茶业集团股份有限公司', amount: 17800, quoteTime: '2026-10-25 10:40' },
      ],
      scored: false,
    },
    history: [
      { time: '2026-10-25', action: '手工录入订单', detail: '京东平台' },
      { time: '2026-10-25', action: '发起比单', detail: '公开报名 · 底价为订单金额 88 折 · 报价 50% + 积分 50% 评分' },
    ],
  },

  /* ── 分发待接单（报备分发：命中云茶商品报备自动转出） ── */
  {
    id: 'eo2', code: 'WB20261024003', platform: 'jd', externalOrderNo: 'JD-20581773',
    customerName: '苏州吴门茶事', customerType: '个人客户', customerRegion: '江苏苏州',
    items: [{ productId: 'p7', productName: '武夷岩茶·水金龟', spec: '50g/罐', quantity: 20, price: 420 }],
    totalAmount: 8400,
    receiver: '吴门茶事主理人', receiverPhone: '137****8899', receiverAddress: '江苏苏州市姑苏区平江路历史街区46号',
    entryTime: '2026-10-24', operator: '运营小周', sourceChannel: 'manual',
    processStatus: 'distribute_pending',
    reportMatches: [{ reportCode: 'BB20260910003', reportType: 'product', partnerId: '11', partnerName: '杭州云茶供应链管理有限公司' }],
    path: 'distribute', distributeMode: 'assign',
    partnerId: '11', partnerName: '杭州云茶供应链管理有限公司',
    transferSource: 'report', transferTime: '2026-10-24',
    history: [
      { time: '2026-10-24', action: '手工录入订单', detail: '京东平台' },
      { time: '2026-10-24', action: '报备命中自动转出', detail: '命中商品报备 BB20260910003（水金龟 · 江苏区域）→ 杭州云茶供应链管理有限公司 · 等待合作商接单' },
    ],
  },

  /* ── 分发待接单（指定分发 → 云茶，等合作商终端接单） ── */
  {
    id: 'eo10', code: 'WB20261024007', platform: 'other', externalOrderNo: 'WX-20261024-66',
    customerName: '华茗堂茶庄', customerType: '直营客户', customerRegion: '江苏南京',
    items: [{ productId: 'p1', productName: '西湖龙井·明前特级', spec: '50g/罐', quantity: 18, price: 452 }],
    totalAmount: 8136,
    receiver: '林掌柜', receiverPhone: '138****6677', receiverAddress: '江苏南京市秦淮区夫子庙街道贡院街12号',
    entryTime: '2026-10-24', operator: '运营老陈', sourceChannel: 'manual',
    processStatus: 'distribute_pending',
    path: 'distribute', distributeMode: 'assign',
    partnerId: '11', partnerName: '杭州云茶供应链管理有限公司',
    transferSource: 'assign', transferTime: '2026-10-24',
    history: [
      { time: '2026-10-24', action: '手工录入订单', detail: '微信小店' },
      { time: '2026-10-24', action: '指定分发', detail: '指定杭州云茶供应链管理有限公司（积分 61）→ 等待合作商接单' },
    ],
  },

  /* ── 已处理（报备分发 + 合作商已接单 + 发货中） ── */
  {
    id: 'eo3', code: 'WB20261021008', platform: 'douyin', externalOrderNo: 'DY-7361902',
    customerName: '南京翠竹茶行', customerType: '渠道客户', customerRegion: '江苏南京',
    items: [{ productId: 'p6', productName: '雨花茶·特级', spec: '100g/罐', quantity: 30, price: 268 }],
    totalAmount: 8040,
    receiver: '翠竹茶行采购部', receiverPhone: '025-8463****', receiverAddress: '江苏南京市玄武区中山东路198号',
    entryTime: '2026-10-21', operator: '运营老陈', sourceChannel: 'push',
    processStatus: 'processed',
    reportMatches: [{ reportCode: 'BB20261013004', reportType: 'customer', partnerId: '11', partnerName: '杭州云茶供应链管理有限公司' }],
    path: 'distribute',
    partnerId: '11', partnerName: '杭州云茶供应链管理有限公司',
    transferSource: 'report', transferTime: '2026-10-21',
    partnerStatus: 'shipping',
    history: [
      { time: '2026-10-21', action: '直连推送订单', detail: '抖音平台 API 同步' },
      { time: '2026-10-21', action: '报备命中自动转出', detail: '命中客户报备 BB20261013004（南京翠竹茶行）→ 云茶供应链 · 等待合作商接单' },
      { time: '2026-10-22', action: '合作商接单', detail: '云茶供应链已接单备货 → 已处理' },
      { time: '2026-10-23', action: '合作商发货', detail: '顺丰速运 · 已发出' },
    ],
  },

  /* ── 已处理（自营：管理后台已接单，采购中） ── */
  {
    id: 'eo11', code: 'WB20261022009', platform: 'jd', externalOrderNo: 'JD-20775210',
    customerName: '交通银行', customerType: '平台客户', customerRegion: '上海黄浦',
    items: [{ productId: 'p3', productName: '竹叶青·品味级', spec: '50g/罐', quantity: 40, price: 356 }],
    totalAmount: 14240,
    receiver: '交行采购中心', receiverPhone: '021-3138****', receiverAddress: '上海市黄浦区中山南路99号',
    entryTime: '2026-10-22', operator: '系统直连', sourceChannel: 'push',
    processStatus: 'processed',
    path: 'self', follower: '周雨桐',
    selfChain: {
      purchaseOrderCode: 'WB-CG-002', supplierId: '8', supplierName: '四川省茶业集团股份有限公司',
      purchaseAmount: 7832, purchaseDate: '2026-10-23',
    },
    history: [
      { time: '2026-10-22', action: '直连推送订单', detail: '京东平台 API 同步' },
      { time: '2026-10-22', action: '选择自营路径', detail: '背对背采购 · 等待管理后台接单' },
      { time: '2026-10-23', action: '管理后台接单（自营）', detail: '跟单人 周雨桐 · 采购单 WB-CG-002 · 四川省茶业集团 ¥7,832 → 已处理' },
    ],
  },

  /* ── 已完成（自营全链路） ── */
  {
    id: 'eo4', code: 'WB20261018010', platform: 'tmall', externalOrderNo: 'TM-87390115-2',
    customerName: '浦发银行', customerType: '平台客户', customerRegion: '上海浦东',
    items: [{ productId: 'p8', productName: '白毫银针·特级', spec: '50g/罐', quantity: 10, price: 768 }],
    totalAmount: 7680,
    receiver: '浦发银行采购中心', receiverPhone: '021-5888****', receiverAddress: '上海市浦东新区浦东南路500号',
    remark: '走京东慧采平台，需提供随货同行单',
    entryTime: '2026-10-18', operator: '运营老陈', sourceChannel: 'manual',
    processStatus: 'completed',
    path: 'self', follower: '陈默',
    selfChain: {
      purchaseOrderCode: 'WB-CG-001', supplierId: '3', supplierName: '八马茶业股份有限公司',
      purchaseAmount: 4300, purchaseDate: '2026-10-19',
      inboundCode: 'WB-RK-001', inboundDate: '2026-10-21',
      outboundCode: 'WB-CK-001', outboundDate: '2026-10-22',
    },
    history: [
      { time: '2026-10-18', action: '手工录入订单', detail: '天猫平台' },
      { time: '2026-10-18', action: '选择自营路径', detail: '背对背采购 · 等待管理后台接单' },
      { time: '2026-10-19', action: '管理后台接单（自营）', detail: '跟单人 陈默 · 采购单 WB-CG-001 · 八马茶业 ¥4,300 → 已处理' },
      { time: '2026-10-21', action: '到货入库', detail: 'WB-RK-001 · 杭州总仓' },
      { time: '2026-10-22', action: '出库发货', detail: 'WB-CK-001 · 京东物流' },
      { time: '2026-10-23', action: '自营订单完成', detail: '客户已签收' },
    ],
  },

  /* ── 已完成（比单分发已结算） ── */
  {
    id: 'eo7', code: 'WB20261012011', platform: 'other', externalOrderNo: 'WX-20261012-88',
    customerName: '华茗堂茶庄', customerType: '直营客户', customerRegion: '江苏南京',
    items: [{ productId: 'p1', productName: '西湖龙井·明前特级', spec: '50g/罐', quantity: 20, price: 452 }],
    totalAmount: 9040,
    receiver: '林掌柜', receiverPhone: '138****6677', receiverAddress: '江苏南京市秦淮区夫子庙街道贡院街12号',
    entryTime: '2026-10-12', operator: '运营老陈', sourceChannel: 'manual',
    processStatus: 'completed',
    path: 'distribute', distributeMode: 'compare',
    partnerId: '3', partnerName: '八马茶业股份有限公司',
    transferSource: 'compare', transferTime: '2026-10-13',
    partnerStatus: 'settled', settleOnTime: true,
    history: [
      { time: '2026-10-12', action: '手工录入订单', detail: '微信小店' },
      { time: '2026-10-12', action: '发起比单', detail: '公开报名 · 底价为订单金额 85 折 · 3 家报名' },
      { time: '2026-10-13', action: '比单定标', detail: '八马茶业 综合得分 92.5 中单 · 等待合作商接单' },
      { time: '2026-10-13', action: '合作商接单', detail: '→ 已处理' },
      { time: '2026-10-13', action: '合作商发货' },
      { time: '2026-10-15', action: '客户签收' },
      { time: '2026-10-16', action: '结算完成', detail: '按时履约 · 积分 +5' },
    ],
  },
];

/* ── 标签与配色 ── */

export const EXTERNAL_PLATFORM_LABELS: Record<ExternalPlatform, string> = {
  tmall: '天猫',
  jd: '京东',
  douyin: '抖音',
  pdd: '拼多多',
  other: '其他平台',
};

export const EXTERNAL_CHANNEL_LABELS: Record<string, string> = {
  manual: '手工',
  push: '直连',
};

export const EXTERNAL_STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  self_pending: '自营待接单',
  grabbing: '抢单中',
  comparing: '比单中',
  distribute_pending: '分发待接单',
  processed: '已处理',
  completed: '已完成',
};

export const EXTERNAL_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FFF3E0', color: '#E65100' },
  self_pending: { bg: '#E3F2FD', color: '#0F64B5' },
  grabbing: { bg: '#FFF8E1', color: '#B26A00' },
  comparing: { bg: '#F3E5F5', color: '#7B1FA2' },
  distribute_pending: { bg: '#E0F2F1', color: '#00695C' },
  processed: { bg: '#E8F5E9', color: '#01795D' },
  completed: { bg: '#ECEFF1', color: '#455A64' },
};

/** 分发路径标签（分发待接单/已处理展示） */
export const TRANSFER_SOURCE_LABELS: Record<string, string> = {
  report: '报备分发',
  assign: '指定分发',
  grab: '抢单分发',
  compare: '比单分发',
};

/** 计算比单底价金额（元） */
export function compareFloorAmount(totalAmount: number, rule: { type: 'discount' | 'price'; value: number }): number {
  return rule.type === 'discount' ? Math.round(totalAmount * rule.value) / 100 : rule.value;
}
