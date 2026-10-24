/**
 * 外部平台订单分流 Mock 数据源
 * 种子覆盖全部状态：待处理 / 报备命中 / 自营链 / 抢单中 / 比单中 / 已转出 / 已完成
 */
import type { ExternalOrder, ExternalPlatform } from '../types';

const minutesLater = (m: number) => Date.now() + m * 60 * 1000;

export const externalOrderSeeds: ExternalOrder[] = [
  /* ── 待处理（未命中报备，等待选择路径） ── */
  {
    id: 'eo1', code: 'WB20261023001', platform: 'tmall', externalOrderNo: 'TM-88213907-1',
    customerName: '清心茶坊', customerType: '直营客户', customerRegion: '浙江宁波',
    items: [{ productId: 'p5', productName: '金骏眉·特级', spec: '50g/罐', quantity: 12, price: 1024 }],
    totalAmount: 12288,
    receiver: '清心茶坊收发部', receiverPhone: '139****2210', receiverAddress: '浙江宁波市鄞州区中山东路2001号',
    remark: '双十一预售尾款订单',
    entryTime: '2026-10-23', operator: '运营小周',
    processStatus: 'pending',
    history: [{ time: '2026-10-23', action: '录入外部订单', detail: '天猫平台 · 手工录入' }],
  },

  /* ── 报备命中待确认（命中云茶商品报备：水金龟 · 江苏） ── */
  {
    id: 'eo2', code: 'WB20261022002', platform: 'jd', externalOrderNo: 'JD-20581773',
    customerName: '苏州吴门茶事', customerType: '个人客户', customerRegion: '江苏苏州',
    items: [{ productId: 'p7', productName: '武夷岩茶·水金龟', spec: '50g/罐', quantity: 20, price: 420 }],
    totalAmount: 8400,
    receiver: '吴门茶事主理人', receiverPhone: '137****8899', receiverAddress: '江苏苏州市姑苏区平江路历史街区46号',
    entryTime: '2026-10-22', operator: '运营小周',
    processStatus: 'report_matched',
    reportMatches: [{ reportCode: 'BB20260910003', reportType: 'product', partnerId: '11', partnerName: '杭州云茶供应链管理有限公司' }],
    history: [
      { time: '2026-10-22', action: '录入外部订单', detail: '京东平台 · 手工录入' },
      { time: '2026-10-22', action: '报备匹配', detail: '命中商品报备 BB20260910003（水金龟 · 江苏区域），待人工确认转出' },
    ],
  },

  /* ── 已转合作商（报备转出，履约中） ── */
  {
    id: 'eo3', code: 'WB20261018003', platform: 'douyin', externalOrderNo: 'DY-7361902',
    customerName: '南京翠竹茶行', customerType: '渠道客户', customerRegion: '江苏南京',
    items: [{ productId: 'p6', productName: '雨花茶·特级', spec: '100g/罐', quantity: 30, price: 268 }],
    totalAmount: 8040,
    receiver: '翠竹茶行采购部', receiverPhone: '025-8463****', receiverAddress: '江苏南京市玄武区中山东路198号',
    entryTime: '2026-10-18', operator: '运营老陈',
    processStatus: 'transferred',
    reportMatches: [{ reportCode: 'BB20261013004', reportType: 'customer', partnerId: '11', partnerName: '杭州云茶供应链管理有限公司' }],
    path: 'distribute',
    partnerId: '11', partnerName: '杭州云茶供应链管理有限公司',
    transferSource: 'report', transferTime: '2026-10-18',
    partnerStatus: 'shipping',
    history: [
      { time: '2026-10-18', action: '录入外部订单', detail: '抖音平台 · 手工录入' },
      { time: '2026-10-18', action: '报备匹配', detail: '命中客户报备 BB20261013004（南京翠竹茶行）' },
      { time: '2026-10-18', action: '确认转出', detail: '转出至杭州云茶供应链管理有限公司' },
      { time: '2026-10-19', action: '合作商接单', detail: '云茶供应链已接单备货' },
      { time: '2026-10-21', action: '合作商发货', detail: '顺丰速运 · 已发出' },
    ],
  },

  /* ── 自营背对背已完成 ── */
  {
    id: 'eo4', code: 'WB20261015004', platform: 'tmall', externalOrderNo: 'TM-87390115-2',
    customerName: '浦发银行', customerType: '平台客户', customerRegion: '上海浦东',
    items: [{ productId: 'p8', productName: '白毫银针·特级', spec: '50g/罐', quantity: 10, price: 768 }],
    totalAmount: 7680,
    receiver: '浦发银行采购中心', receiverPhone: '021-5888****', receiverAddress: '上海市浦东新区浦东南路500号',
    remark: '走京东慧采平台，需提供随货同行单',
    entryTime: '2026-10-15', operator: '运营老陈',
    processStatus: 'completed',
    path: 'self',
    selfChain: {
      purchaseOrderCode: 'WB-CG-004', supplierId: '3', supplierName: '八马茶业股份有限公司',
      purchaseAmount: 4300, purchaseDate: '2026-10-16',
      inboundCode: 'WB-RK-004', inboundDate: '2026-10-18',
      outboundCode: 'WB-CK-004', outboundDate: '2026-10-19',
    },
    history: [
      { time: '2026-10-15', action: '录入外部订单', detail: '天猫平台 · 手工录入' },
      { time: '2026-10-15', action: '选择自营路径', detail: '背对背采购 · 以销定采' },
      { time: '2026-10-16', action: '生成采购订单', detail: 'WB-CG-004 · 八马茶业 · ¥4,300' },
      { time: '2026-10-18', action: '到货入库', detail: 'WB-RK-004 · 杭州总仓' },
      { time: '2026-10-19', action: '出库发货', detail: 'WB-CK-004 · 京东物流' },
      { time: '2026-10-20', action: '自营订单完成', detail: '客户已签收' },
    ],
  },

  /* ── 抢单中（演示：发布后 25 分钟内可抢） ── */
  {
    id: 'eo5', code: 'WB20261024005', platform: 'pdd', externalOrderNo: 'PDD-2093184-1',
    customerName: '茗香阁直播', customerType: '带货客户', customerRegion: '广东广州',
    items: [{ productId: 'p11', productName: '凤凰单丛·蜜兰香', spec: '100g/袋', quantity: 50, price: 374 }],
    totalAmount: 18700,
    receiver: '茗香阁仓储', receiverPhone: '137****0912', receiverAddress: '广东广州市白云区黄石东路288号',
    remark: '直播间爆单，今晚 8 点前须发出',
    entryTime: '2026-10-24', operator: '运营小周',
    processStatus: 'grabbing',
    path: 'distribute', distributeMode: 'grab',
    grabDeadline: minutesLater(25),
    grabRecords: [],
    history: [
      { time: '2026-10-24', action: '录入外部订单', detail: '拼多多平台 · 手工录入' },
      { time: '2026-10-24', action: '发布抢单', detail: '已推送合作商抢单大厅 · 时间优先' },
    ],
  },

  /* ── 比单报价中（候选：八马 / 竹叶青 / 云茶） ── */
  {
    id: 'eo6', code: 'WB20261024006', platform: 'jd', externalOrderNo: 'JD-20603995',
    customerName: '天福茗茶', customerType: '渠道客户', customerRegion: '福建厦门',
    items: [
      { productId: 'p9', productName: '铁观音·清香一级', spec: '250g/罐', quantity: 40, price: 208 },
      { productId: 'p10', productName: '大红袍·特级', spec: '150g/盒', quantity: 22, price: 494 },
    ],
    totalAmount: 19148,
    receiver: '天福物流部', receiverPhone: '0592-566****', receiverAddress: '福建厦门市思明区莲前西路209号',
    entryTime: '2026-10-24', operator: '运营老陈',
    processStatus: 'comparing',
    path: 'distribute', distributeMode: 'compare',
    compare: {
      candidates: [
        { supplierId: '3', supplierName: '八马茶业股份有限公司' },
        { supplierId: '8', supplierName: '四川省茶业集团股份有限公司' },
        { supplierId: '11', supplierName: '杭州云茶供应链管理有限公司' },
      ],
      deadline: minutesLater(40),
      quotes: [
        { supplierId: '3', supplierName: '八马茶业股份有限公司', amount: 9800, quoteTime: '2026-10-24 10:12' },
        { supplierId: '8', supplierName: '四川省茶业集团股份有限公司', amount: 10200, quoteTime: '2026-10-24 10:40' },
      ],
      scored: false,
    },
    history: [
      { time: '2026-10-24', action: '录入外部订单', detail: '京东平台 · 手工录入' },
      { time: '2026-10-24', action: '发起比单', detail: '邀请 3 家合作商报价（报价 40% + 积分 40% + 履约 20%）' },
    ],
  },

  /* ── 指定分发已结算 ── */
  {
    id: 'eo7', code: 'WB20261010007', platform: 'other', externalOrderNo: 'WX-20261010-88',
    customerName: '华茗堂茶庄', customerType: '直营客户', customerRegion: '江苏南京',
    items: [{ productId: 'p1', productName: '西湖龙井·明前特级', spec: '50g/罐', quantity: 20, price: 452 }],
    totalAmount: 9040,
    receiver: '林掌柜', receiverPhone: '138****6677', receiverAddress: '江苏南京市秦淮区夫子庙街道贡院街12号',
    entryTime: '2026-10-10', operator: '运营老陈',
    processStatus: 'completed',
    path: 'distribute', distributeMode: 'assign',
    partnerId: '3', partnerName: '八马茶业股份有限公司',
    transferSource: 'assign', transferTime: '2026-10-10',
    partnerStatus: 'settled', settleOnTime: true,
    history: [
      { time: '2026-10-10', action: '录入外部订单', detail: '微信小店 · 手工录入' },
      { time: '2026-10-10', action: '指定分发', detail: '指定八马茶业股份有限公司（积分 78 · 履约率 95%）' },
      { time: '2026-10-10', action: '合作商接单' },
      { time: '2026-10-11', action: '合作商发货' },
      { time: '2026-10-13', action: '客户签收' },
      { time: '2026-10-14', action: '结算完成', detail: '按时履约 · 积分 +5' },
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

export const EXTERNAL_STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  report_matched: '报备命中',
  self_purchasing: '自营·采购中',
  self_inbound: '自营·已入库',
  self_outbound: '自营·已发货',
  grabbing: '抢单中',
  comparing: '比单报价中',
  transferred: '已转合作商',
  completed: '已完成',
};

export const EXTERNAL_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FFF3E0', color: '#E65100' },
  report_matched: { bg: '#FCE7EB', color: '#CB405D' },
  self_purchasing: { bg: '#E3F2FD', color: '#0F64B5' },
  self_inbound: { bg: '#E8EAF6', color: '#3949AB' },
  self_outbound: { bg: '#E0F2F1', color: '#00695C' },
  grabbing: { bg: '#FFF8E1', color: '#B26A00' },
  comparing: { bg: '#F3E5F5', color: '#7B1FA2' },
  transferred: { bg: '#E8F5E9', color: '#01795D' },
  completed: { bg: '#ECEFF1', color: '#455A64' },
};

export const TRANSFER_SOURCE_LABELS: Record<string, string> = {
  report: '报备转出',
  assign: '指定分发',
  grab: '抢单中单',
  compare: '比单中单',
};
