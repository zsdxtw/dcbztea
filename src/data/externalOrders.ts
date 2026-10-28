/**
 * 订单分发（销售订单入口）Mock 数据源
 * 来源渠道：手工录入（manual）/ 平台直连推送（push）
 * 基础种子覆盖全部状态 + 程序化生成的 48 条随机状态演示订单（buildDemoOrders）
 */
import type { ExternalOrder, ExternalOrderItem, ExternalPlatform } from '../types';

const minutesLater = (m: number) => Date.now() + m * 60 * 1000;

const baseSeeds: ExternalOrder[] = [
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

  /* ── 自营待接单（等管理后台在销售订单-分发订单接单） ── */
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
      { time: '2026-10-24', action: '选择自营路径', detail: '背对背采购 · 等待管理后台接单（销售订单 → 分发订单）' },
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

  /* ── 报备-匹配待确认（录入即命中云茶商品报备，待人工确认后分发） ── */
  {
    id: 'eo12', code: 'WB20261025007', platform: 'pdd', externalOrderNo: 'PDD-3355660-2',
    customerName: '无锡梅园茶舍', customerType: '直营客户', customerRegion: '江苏无锡',
    items: [{ productId: 'p7', productName: '武夷岩茶·水金龟', spec: '50g/罐', quantity: 16, price: 420 }],
    totalAmount: 6720,
    receiver: '梅园茶舍采购部', receiverPhone: '0510-8230****', receiverAddress: '江苏无锡市滨湖区梁溪路88号',
    remark: '拼多多百亿补贴订单',
    entryTime: '2026-10-25', operator: '运营小周', sourceChannel: 'push',
    processStatus: 'report_match_pending',
    reportMatches: [{ reportCode: 'BB20260910003', reportType: 'product', partnerId: '11', partnerName: '杭州云茶供应链管理有限公司' }],
    path: 'distribute',
    partnerId: '11', partnerName: '杭州云茶供应链管理有限公司',
    history: [
      { time: '2026-10-25', action: '直连推送订单', detail: '拼多多 API 自动同步' },
      { time: '2026-10-25', action: '命中报备，待确认匹配', detail: '命中商品报备 BB20260910003（水金龟 · 江苏区域）→ 杭州云茶供应链管理有限公司 · 待人工确认后分发' },
    ],
  },

  /* ── 转派待接单（报备转派：命中云茶商品报备自动转出） ── */
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

  /* ── 转派待接单（指定转派 → 云茶，等合作商终端接单） ── */
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
      { time: '2026-10-24', action: '指定转派', detail: '指定杭州云茶供应链管理有限公司（积分 61）→ 等待合作商接单' },
    ],
  },

  /* ── 已处理（报备转派 + 合作商已接单 + 发货中） ── */
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

  /* ── 已完成（比单转派已结算） ── */
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

/* ═══════════════════════════════════════════════════════════════
 * 演示数据生成器：48 条随机状态订单（确定性索引驱动，覆盖状态机全貌）
 * 含拆单家族（母/子订单、抢单未成/比单未成标签）、按商品抢单/比单中间态
 * ═══════════════════════════════════════════════════════════════ */

/** 客户池：名称 / 类型 / 省 / 市(简称) / 市(全称) / 区 / 街道 */
const DEMO_CUSTOMERS: { name: string; type: string; prov: string; cityShort: string; city: string; dist: string; street: string }[] = [
  { name: '姑苏茗铺', type: '渠道客户', prov: '江苏', cityShort: '苏州', city: '苏州市', dist: '姑苏区', street: '人民路1024号' },
  { name: '金陵茶礼中心', type: '直营客户', prov: '江苏', cityShort: '南京', city: '南京市', dist: '玄武区', street: '中山东路88号' },
  { name: '湖畔茶叙', type: '个人客户', prov: '浙江', cityShort: '杭州', city: '杭州市', dist: '西湖区', street: '文三路500号' },
  { name: '甬上茶庄', type: '直营客户', prov: '浙江', cityShort: '宁波', city: '宁波市', dist: '海曙区', street: '和义大道66号' },
  { name: '鹭岛茶事', type: '渠道客户', prov: '福建', cityShort: '厦门', city: '厦门市', dist: '思明区', street: '厦禾路218号' },
  { name: '蓉城茶集', type: '直营客户', prov: '四川', cityShort: '成都', city: '成都市', dist: '锦江区', street: '春熙路8号' },
  { name: '羊城茶行', type: '渠道客户', prov: '广东', cityShort: '广州', city: '广州市', dist: '天河区', street: '体育西路120号' },
  { name: '星城茶座', type: '个人客户', prov: '湖南', cityShort: '长沙', city: '长沙市', dist: '芙蓉区', street: '五一大道199号' },
  { name: '庐阳茶苑', type: '直营客户', prov: '安徽', cityShort: '合肥', city: '合肥市', dist: '蜀山区', street: '长江西路299号' },
  { name: '春城茶铺', type: '渠道客户', prov: '云南', cityShort: '昆明', city: '昆明市', dist: '五华区', street: '东风西路77号' },
  { name: '泉城茗茶', type: '直营客户', prov: '山东', cityShort: '济南', city: '济南市', dist: '历下区', street: '泺源大街56号' },
  { name: '洪都茶舍', type: '个人客户', prov: '江西', cityShort: '南昌', city: '南昌市', dist: '东湖区', street: '八一大道35号' },
];

/** 商品池（productId 联动价格档案） */
const DEMO_PRODUCTS: { productId: string; name: string; spec: string; price: number }[] = [
  { productId: 'p1', name: '西湖龙井·明前特级', spec: '50g/罐', price: 452 },
  { productId: 'p2', name: '碧螺春·一级', spec: '100g/袋', price: 328 },
  { productId: 'p5', name: '金骏眉·特级', spec: '50g/罐', price: 1024 },
  { productId: 'p7', name: '武夷岩茶·水金龟', spec: '50g/罐', price: 420 },
  { productId: 'p8', name: '白毫银针·特级', spec: '50g/罐', price: 768 },
  { productId: 'p12', name: '寿眉·2019年陈', spec: '350g/饼', price: 158 },
  { productId: 'p13', name: '凤凰单丛·蜜兰香', spec: '100g/袋', price: 296 },
  { productId: 'p14', name: '铁观音·清香一级', spec: '250g/罐', price: 208 },
];

/** 冷泡茶（命中 BB20260901006 全国商品报备）与水金龟江苏报备（BB20260910003） */
const DEMO_REPORT_PRODUCTS = {
  national: { productId: 'p20', name: '冷泡茶便携装', spec: '3g/袋', price: 9 },
  jsRock: { productId: 'p7', name: '武夷岩茶·水金龟', spec: '50g/罐', price: 420 },
};

/** 合作商池（id 联动合作商档案） */
const DEMO_PARTNERS: { id: string; name: string }[] = [
  { id: '11', name: '杭州云茶供应链管理有限公司' },
  { id: '3', name: '八马茶业股份有限公司' },
  { id: '4', name: '云南大益茶业集团有限公司' },
  { id: '5', name: '福建品品香茶业有限公司' },
  { id: '2', name: '福建正山堂茶业有限责任公司' },
  { id: '8', name: '四川省峨眉山竹叶青茶业有限公司' },
];

const DEMO_OPERATORS = ['运营小周', '运营老陈', '运营小林', '系统直连'];
const DEMO_FOLLOWERS = ['陈建国', '周敏', '林晓峰', '顾晓岚'];

/** 简单确定性伪随机 */
const lcg = (seed: number) => (n: number) => {
  let s = seed + n * 2654435761;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
};

/** 生成一条演示订单骨架 */
function buildOne(seq: number, statusPlan: {
  items: ExternalOrderItem[];
  processStatus: ExternalOrder['processStatus'];
  history: { time: string; action: string; detail?: string }[];
  extra?: Partial<ExternalOrder>;
}): ExternalOrder {
  const rnd = lcg(seq)(7);
  const cust = DEMO_CUSTOMERS[seq % DEMO_CUSTOMERS.length];
  const platforms: ExternalPlatform[] = ['tmall', 'jd', 'douyin', 'pdd', 'other'];
  const platform = platforms[Math.floor(rnd() * platforms.length)];
  const channel = rnd() > 0.5 ? 'push' : 'manual';
  const day = 11 + (seq % 15);
  const date = `2026-10-${String(day).padStart(2, '0')}`;
  const items = statusPlan.items;
  return {
    id: `demo_${seq}`,
    code: `WB202610${String(day).padStart(2, '0')}9${String(seq).padStart(2, '0')}`,
    platform,
    externalOrderNo: `${platform === 'tmall' ? 'TM' : platform === 'jd' ? 'JD' : platform === 'douyin' ? 'DY' : platform === 'pdd' ? 'PDD' : 'WX'}-DEMO-${1000 + seq}`,
    customerName: cust.name,
    customerType: cust.type,
    customerRegion: `${cust.prov}${cust.cityShort}`,
    items,
    totalAmount: items.reduce((s, it) => s + it.price * it.quantity, 0),
    receiver: `${cust.name}收货部`,
    receiverPhone: '1' + String(300000000 + seq * 1379173).slice(0, 3) + '****' + String(1000 + seq * 37).slice(0, 4),
    receiverAddress: `${cust.prov}${cust.city}${cust.dist}${cust.street}`,
    remark: '演示数据',
    entryTime: date,
    operator: channel === 'push' ? '系统直连' : DEMO_OPERATORS[seq % 3],
    sourceChannel: channel,
    processStatus: statusPlan.processStatus,
    history: [
      { time: date, action: channel === 'push' ? '直连推送订单' : '手工录入订单', detail: '演示数据' },
      ...statusPlan.history,
    ],
    ...statusPlan.extra,
  };
}

/** 随机取 1~3 种商品 */
function pickItems(seq: number, forceFirst?: ExternalOrderItem): ExternalOrderItem[] {
  const rnd = lcg(seq)(13);
  const count = 1 + Math.floor(rnd() * 3);
  const pool = [...DEMO_PRODUCTS];
  const items: ExternalOrderItem[] = [];
  if (forceFirst) items.push(forceFirst);
  while (items.length < count) {
    const p = pool[Math.floor(rnd() * pool.length)];
    if (items.some((it) => it.productName === p.name)) continue;
    items.push({ productId: p.productId, productName: p.name, spec: p.spec, quantity: 4 + Math.floor(rnd() * 40), price: p.price });
  }
  return items;
}

/** 48 条演示订单 */
function buildDemoOrders(): ExternalOrder[] {
  const orders: ExternalOrder[] = [];
  let seq = 1;
  const next = () => seq++;
  const D = (s: number) => `2026-10-${String(11 + (s % 15)).padStart(2, '0')}`;

  /* ── 分发-待处理 ×8（含手动拆单家族 B：母 + 子1 + 子2） ── */
  for (let i = 0; i < 8; i++) {
    const s = next();
    const isFamilyB = i < 3;
    orders.push(buildOne(s, {
      items: isFamilyB && i === 0 ? pickItems(s) : pickItems(s),
      processStatus: 'pending',
      history: isFamilyB && i > 0
        ? [{ time: D(s), action: '拆单生成子订单', detail: `从母订单拆出（演示拆单家族）` }]
        : [],
      extra: isFamilyB && i > 0 ? { parentCode: undefined } : undefined,
    }));
  }
  // 家族 B：前三笔组成母子（第一笔为母，后两笔挂 parentCode）
  const famBMother = orders[orders.length - 8];
  orders[orders.length - 7].parentCode = famBMother.code;
  orders[orders.length - 7].code = `${famBMother.code}-1`;
  orders[orders.length - 6].parentCode = famBMother.code;
  orders[orders.length - 6].code = `${famBMother.code}-2`;

  /* ── 报备-匹配待确认 ×4（命中两条已审批报备） ── */
  for (let i = 0; i < 4; i++) {
    const s = next();
    const useJs = i % 2 === 0;
    const cust = DEMO_CUSTOMERS[(s * 3) % DEMO_CUSTOMERS.length];
    const prod = useJs ? DEMO_REPORT_PRODUCTS.jsRock : DEMO_REPORT_PRODUCTS.national;
    const reportCode = useJs ? 'BB20260910003' : 'BB20260901006';
    const order = buildOne(s, {
      items: [{ productId: prod.productId, productName: prod.name, spec: prod.spec, quantity: 10 + i * 6, price: prod.price }],
      processStatus: 'report_match_pending',
      history: [{ time: D(s), action: '命中报备，待确认匹配', detail: `命中商品报备 ${reportCode} → 杭州云茶供应链管理有限公司 · 待人工确认后分发` }],
    });
    order.customerName = useJs ? cust.name : order.customerName;
    order.customerRegion = useJs ? `江苏${['苏州', '南京', '无锡', '常州'][i]}` : order.customerRegion;
    if (useJs) {
      const c = DEMO_CUSTOMERS[(i * 3) % 4];
      order.receiverAddress = `江苏${['苏州市', '南京市', '无锡市', '常州市'][i]}${c.dist}${c.street}`;
    }
    order.reportMatches = [{ reportCode, reportType: 'product', partnerId: '11', partnerName: '杭州云茶供应链管理有限公司' }];
    order.path = 'distribute';
    order.partnerId = '11';
    order.partnerName = '杭州云茶供应链管理有限公司';
    orders.push(order);
  }

  /* ── 自营待接单 ×4 ── */
  for (let i = 0; i < 4; i++) {
    const s = next();
    orders.push(buildOne(s, {
      items: pickItems(s),
      processStatus: 'self_pending',
      history: [{ time: D(s), action: '选择自营路径', detail: '背对背采购 · 等待管理后台接单（销售订单 → 分发订单）' }],
      extra: { path: 'self' },
    }));
  }

  /* ── 抢单中 ×4（其中 2 笔已有按商品部分抢记录） ── */
  for (let i = 0; i < 4; i++) {
    const s = next();
    const items = pickItems(s);
    const partial = i < 2;
    const grabber = DEMO_PARTNERS[(i + 1) % DEMO_PARTNERS.length];
    orders.push(buildOne(s, {
      items,
      processStatus: 'grabbing',
      history: [
        { time: D(s), action: '发布抢单', detail: `已推送合作商抢单大厅 · 30 分钟内先到先得${i === 3 ? ' · 限 江苏 地区合作商' : ''}` },
        ...(partial ? [{ time: D(s), action: '合作商按商品抢单', detail: `${grabber.name} 抢到 ${items[0].productName}` }] : []),
      ],
      extra: {
        path: 'distribute', distributeMode: 'grab',
        grabDeadline: minutesLater(8 + i * 6),
        grabRecords: partial ? [{ supplierId: grabber.id, supplierName: grabber.name, grabTime: '09:20', ts: Date.now() - 600000, items: [items[0].productName] }] : [],
        ...(i === 3 ? { grabRegion: { province: '江苏' } } : {}),
      },
    }));
  }

  /* ── 比单中 ×4（公开报名，含按商品子集报名） ── */
  for (let i = 0; i < 4; i++) {
    const s = next();
    const items = pickItems(s);
    const q1 = DEMO_PARTNERS[i % DEMO_PARTNERS.length];
    const q2 = DEMO_PARTNERS[(i + 2) % DEMO_PARTNERS.length];
    const q3 = DEMO_PARTNERS[(i + 4) % DEMO_PARTNERS.length];
    const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    orders.push(buildOne(s, {
      items,
      processStatus: 'comparing',
      history: [{ time: D(s), action: '发起比单', detail: `公开报名 · 底价为订单金额 88 折（¥${Math.round(total * 0.88).toLocaleString()}） · 按商品积分排名定标` }],
      extra: {
        path: 'distribute', distributeMode: 'compare',
        compare: {
          deadline: minutesLater(15 + i * 8),
          floorRule: { type: 'discount', value: 88 },
          floorNote: `报名报价不得低于订单金额的 88 折（¥${Math.round(total * 0.88).toLocaleString()}）`,
          quotes: [
            { supplierId: q1.id, supplierName: q1.name, amount: Math.round(total * 0.9), quoteTime: '10:05', items: items.map((it) => it.productName) },
            { supplierId: q2.id, supplierName: q2.name, amount: Math.round(total * 0.86), quoteTime: '10:12', items: [items[0].productName] },
            ...(items.length > 1 ? [{ supplierId: q3.id, supplierName: q3.name, amount: Math.round(total * 0.4), quoteTime: '10:20', items: [items[items.length - 1].productName] }] : []),
          ],
          scored: false,
        },
      },
    }));
  }

  /* ── 转派待接单 ×8（来源循环；含比单分拆家族 C：-1 积分中单子单 + -2 比单未成） ── */
  const sources = ['report', 'assign', 'grab', 'compare'] as const;
  for (let i = 0; i < 8; i++) {
    const s = next();
    const p = DEMO_PARTNERS[i % DEMO_PARTNERS.length];
    const src = sources[i % 4];
    orders.push(buildOne(s, {
      items: pickItems(s),
      processStatus: 'distribute_pending',
      history: [{ time: D(s), action: { report: '报备匹配确认转出', assign: '指定转派', grab: '抢单转派（按商品）', compare: '比单定标（按商品·积分优先）' }[src], detail: `→ ${p.name} · 等待合作商接单` }],
      extra: {
        path: 'distribute', distributeMode: 'assign',
        partnerId: p.id, partnerName: p.name,
        transferSource: src, transferTime: D(s),
        ...(src === 'report' ? { reportMatches: [{ reportCode: 'BB20260901006', reportType: 'product', partnerId: p.id, partnerName: p.name }] } : {}),
      },
    }));
  }
  // 比单分拆家族 C：最后两笔改为同母家族（无母单，-1 积分中单 + -2 比单未成退回）
  const famC = orders[orders.length - 2];
  const famC2 = orders[orders.length - 1];
  const motherCodeC = famC.code.replace(/9\d$/, '80');
  famC.parentCode = motherCodeC; famC.code = `${motherCodeC}-1`;
  famC.transferSource = 'compare';
  famC.history.push({ time: D(20), action: '比单定标（按商品·积分优先）', detail: `按商品积分排名第一中单 → ${famC.partnerName} · 等待合作商接单` });
  famC2.parentCode = motherCodeC; famC2.code = `${motherCodeC}-2`;
  famC2.processStatus = 'pending';
  famC2.path = undefined; famC2.distributeMode = undefined;
  famC2.partnerId = undefined; famC2.partnerName = undefined;
  famC2.transferSource = undefined; famC2.transferTime = undefined;
  famC2.sourceTag = 'compare_failed';
  famC2.history = [{ time: D(20), action: '拆单生成子订单', detail: '比单定标分拆' }, { time: D(20), action: '比单未成退回', detail: '无报名商品形成子订单，重新进入分发-待处理' }];

  // 抢单未成孤儿子单（挂于不存在的母编号，演示「抢单未成」标签）：取分发-待处理组第 5 笔改造
  const orphan = orders[7];
  const orphanMother = orphan.code.replace(/9\d$/, '60');
  orphan.parentCode = orphanMother;
  orphan.code = `${orphanMother}-1`;
  orphan.sourceTag = 'grab_failed';
  orphan.history = [{ time: D(9), action: '拆单生成子订单', detail: '抢单分拆定案' }, { time: D(9), action: '抢单未成退回', detail: '未被抢购商品形成子订单，重新进入分发-待处理' }];

  /* ── 分发-已完成（处理中）×10：自营链 4 + 合作商履约 6 ── */
  for (let i = 0; i < 4; i++) {
    const s = next();
    const sup = DEMO_PARTNERS[(i + 3) % DEMO_PARTNERS.length];
    const items = pickItems(s);
    const purchaseAmount = Math.round(items.reduce((sum, it) => sum + it.price * it.quantity, 0) * 0.55);
    const stage = i % 4; // 0 采购中 / 1 已入库 / 2 已出库 / 3 已出库
    orders.push(buildOne(s, {
      items,
      processStatus: 'processed',
      history: [
        { time: D(s), action: '选择自营路径', detail: '背对背采购' },
        { time: D(s), action: '管理后台接单（自营）', detail: `跟单人 ${DEMO_FOLLOWERS[i]} · 采购单 WB-CG-9${String(s).padStart(2, '0')} · ${sup.name} · ¥${purchaseAmount.toLocaleString()}` },
        ...(stage >= 1 ? [{ time: D(s), action: '到货入库', detail: '采购到货验收入库' }] : []),
        ...(stage >= 2 ? [{ time: D(s), action: '出库发货', detail: '销售出库 · 安排发运' }] : []),
      ],
      extra: {
        path: 'self', follower: DEMO_FOLLOWERS[i],
        selfChain: {
          purchaseOrderCode: `WB-CG-9${String(s).padStart(2, '0')}`,
          supplierId: sup.id, supplierName: sup.name, purchaseAmount, purchaseDate: D(s),
          ...(stage >= 1 ? { inboundCode: `WB-RK-9${String(s).padStart(2, '0')}`, inboundDate: D(s) } : {}),
          ...(stage >= 2 ? { outboundCode: `WB-CK-9${String(s).padStart(2, '0')}`, outboundDate: D(s) } : {}),
        },
      },
    }));
  }
  const psList = ['accepted', 'accepted', 'shipping', 'shipping', 'delivered', 'delivered'] as const;
  const psLabel: Record<string, string> = { accepted: '合作商接单', shipping: '合作商发货', delivered: '客户签收' };
  for (let i = 0; i < 6; i++) {
    const s = next();
    const p = DEMO_PARTNERS[(i + 5) % DEMO_PARTNERS.length];
    const src = sources[i % 4];
    const ps = psList[i];
    orders.push(buildOne(s, {
      items: pickItems(s),
      processStatus: 'processed',
      history: [
        { time: D(s), action: { report: '报备匹配确认转出', assign: '指定转派', grab: '抢单转派（按商品）', compare: '比单定标（按商品·积分优先）' }[src], detail: `→ ${p.name}` },
        { time: D(s), action: psLabel[ps], detail: ps === 'accepted' ? '合作商终端接单 → 分发-已完成' : undefined },
      ],
      extra: {
        path: 'distribute', distributeMode: 'assign',
        partnerId: p.id, partnerName: p.name,
        transferSource: src, transferTime: D(s),
        partnerStatus: ps,
      },
    }));
  }

  /* ── 已完成（已结算）×6 ── */
  for (let i = 0; i < 6; i++) {
    const s = next();
    const p = DEMO_PARTNERS[(i + 2) % DEMO_PARTNERS.length];
    const src = sources[i % 4];
    const onTime = i % 3 !== 0;
    orders.push(buildOne(s, {
      items: pickItems(s),
      processStatus: 'completed',
      history: [
        { time: D(s), action: { report: '报备匹配确认转出', assign: '指定转派', grab: '抢单转派（按商品）', compare: '比单定标（按商品·积分优先）' }[src], detail: `→ ${p.name}` },
        { time: D(s), action: '结算完成', detail: onTime ? '按时履约 · 积分 +5' : '超时发货 · 积分 -5' },
      ],
      extra: {
        path: 'distribute', distributeMode: 'assign',
        partnerId: p.id, partnerName: p.name,
        transferSource: src, transferTime: D(s),
        partnerStatus: 'settled', settleOnTime: onTime,
      },
    }));
  }

  return orders;
}

export const externalOrderSeeds: ExternalOrder[] = [...baseSeeds, ...buildDemoOrders()];

export const EXTERNAL_PLATFORM_LABELS: Record<ExternalPlatform, string> = {
  tmall: '天猫',
  jd: '京东',
  douyin: '抖音',
  pdd: '拼多多',
  other: '其他平台',
};

export const EXTERNAL_CHANNEL_LABELS: Record<string, string> = {
  manual: '手工录入',
  push: '直连推送',
};

export const EXTERNAL_STATUS_LABELS: Record<string, string> = {
  pending: '分发-待处理',
  report_match_pending: '报备-匹配待确认',
  self_pending: '自营待接单',
  grabbing: '抢单中',
  comparing: '比单中',
  distribute_pending: '转派待接单',
  processed: '分发-已完成',
  completed: '已完成',
};

/** 来源附加标签（拆单后未成交商品子订单） */
export const SOURCE_TAG_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  grab_failed: { label: '抢单未成', bg: '#FBEDEF', color: '#C13A54' },
  compare_failed: { label: '比单未成', bg: '#FBF3E2', color: '#9A7A1C' },
};

export const EXTERNAL_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FFF3E0', color: '#E65100' },
  report_match_pending: { bg: '#E0F7FA', color: '#00838F' },
  self_pending: { bg: '#E3F2FD', color: '#0F64B5' },
  grabbing: { bg: '#FFF8E1', color: '#B26A00' },
  comparing: { bg: '#F3E5F5', color: '#7B1FA2' },
  distribute_pending: { bg: '#E0F2F1', color: '#00695C' },
  processed: { bg: '#E8F5E9', color: '#01795D' },
  completed: { bg: '#ECEFF1', color: '#455A64' },
};

/** 分发路径标签（转派待接单/已处理展示） */
export const TRANSFER_SOURCE_LABELS: Record<string, string> = {
  report: '转派-报备',
  grab: '转派-抢单',
  assign: '转派-指定',
  compare: '转派-比单',
};

/** 计算比单底价金额（元） */
export function compareFloorAmount(totalAmount: number, rule: { type: 'discount' | 'price'; value: number }): number {
  return rule.type === 'discount' ? Math.round(totalAmount * rule.value) / 100 : rule.value;
}
