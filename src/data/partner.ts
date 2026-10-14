/**
 * 合作商终端（合作商后台）Mock 数据源
 * 包含：合作商自身信息（字段与供应商管理一致）、分发的订单、报备记录、合作客户、结算单、子账号
 */
import type {
  PartnerOrder,
  PartnerReport,
  PartnerCustomer,
  PartnerSettlement,
  PartnerAccount,
} from '../types';

/* ── 合作商自身信息（字段与采购 > 供应商管理的供应商档案一致） ── */
export const partnerProfile = {
  name: '杭州云茶供应链管理有限公司',
  unifiedCreditCode: '91330106MA2P8KQ3X7',
  legalRepresentative: '陈建国',
  establishmentDate: '2016-09-20',
  registeredCapital: '1000万元',
  companyType: '有限责任公司',
  registeredProvince: '浙江',
  registeredCity: '杭州市',
  registeredDistrict: '滨江区',
  registeredAddress: '滨盛路1870号创新大厦18层',
  businessScope: '茶叶及茶制品供应链服务；仓储配送服务；供应链管理咨询',
  contactPerson: '陈建国',
  contactPosition: '总经理',
  contactProvince: '浙江',
  contactCity: '杭州市',
  contactDistrict: '滨江区',
  contactAddress: '滨盛路1870号创新大厦18层',
  contactPhone: '0571-8899****',
  contactEmail: 'chenjg@yuntea.com',
  warehouses: [
    { id: 'pw1', name: '云茶滨江中心仓', province: '浙江', city: '杭州市', district: '滨江区', address: '滨盛路1870号B2层', contactPerson: '周仓管', contactPhone: '0571-8898****', isDefault: true },
    { id: 'pw2', name: '云茶宁波分仓', province: '浙江', city: '宁波市', district: '鄞州区', address: '首南街道泰康中路456号', contactPerson: '吴仓管', contactPhone: '0574-5512****', isDefault: false },
  ],
  taxType: 'general' as const,
  invoiceInfo: {
    title: '杭州云茶供应链管理有限公司',
    taxNo: '91330106MA2P8KQ3X7',
    taxRate: 13,
    address: '浙江省杭州市滨江区滨盛路1870号创新大厦18层',
    phone: '0571-8899****',
    bankName: '招商银行杭州滨江支行',
    bankAccount: '5719****2233',
  },
  bankAccount: {
    accountName: '杭州云茶供应链管理有限公司',
    accountNo: '5719****8866',
    bankName: '招商银行杭州滨江支行',
    bankNo: '308331000013',
    remark: '结算款按月汇总支付，发票随款开具',
  },
  settlementMethod: 'monthly' as const,
  cooperationDate: '2025-03-01',
  introduction: '淡茶半盏授权合作商，负责华东区域订单履约、本地客户营销与售后。供应商模式 + 服务商模式双模式运营。',
  qualificationFiles: ['营业执照.pdf', '食品经营许可证.pdf', '仓储服务资质.pdf'],
  channelSource: 'terminal' as const,
  qualificationStatus: 'qualified' as const,
};

/* ── 分发的订单（来源于淡茶半盏后台） ── */
export const partnerOrders: PartnerOrder[] = [
  {
    id: 'po1', code: 'HHSO20260912001', customerName: '华茗堂茶庄', customerType: '直营客户',
    items: [
      { productName: '西湖龙井·明前特级', spec: '50g/罐', quantity: 20, price: 452 },
      { productName: '碧螺春·一级', spec: '100g/袋', quantity: 15, price: 328 },
    ],
    totalAmount: 13940, deliveryMode: 'direct', coopMode: 'supplier',
    status: 'pending', orderDate: '2026-09-12', expectedShipDate: '2026-09-15',
    receiver: '林掌柜', receiverPhone: '138****6677', receiverAddress: '江苏南京市秦淮区夫子庙街道贡院街12号',
    remark: '客户周年庆活动，请优先安排发货',
  },
  {
    id: 'po2', code: 'HHSO20260911002', customerName: '清心茶坊', customerType: '直营客户',
    items: [
      { productName: '正山小种·特级', spec: '100g/罐', quantity: 30, price: 384 },
    ],
    totalAmount: 11520, deliveryMode: 'warehouse', coopMode: 'supplier',
    status: 'accepted', orderDate: '2026-09-11', expectedShipDate: '2026-09-14',
    receiver: '清心茶坊收发部', receiverPhone: '139****2210', receiverAddress: '浙江宁波市鄞州区中山东路2001号',
  },
  {
    id: 'po3', code: 'HHSO20260910003', customerName: '浦发银行', customerType: '平台客户',
    items: [
      { productName: '金骏眉·特级', spec: '50g/罐', quantity: 12, price: 1024 },
      { productName: '白毫银针·特级', spec: '50g/罐', quantity: 8, price: 768 },
    ],
    totalAmount: 18432, deliveryMode: 'direct', coopMode: 'service',
    status: 'shipping', orderDate: '2026-09-10', expectedShipDate: '2026-09-12',
    receiver: '浦发银行采购中心', receiverPhone: '021-5888****', receiverAddress: '上海市浦东新区浦东南路500号',
    remark: '走京东慧采平台，需提供随货同行单',
  },
  {
    id: 'po4', code: 'HHSO20260908004', customerName: '天福茗茶', customerType: '渠道客户',
    items: [
      { productName: '铁观音·清香一级', spec: '250g/罐', quantity: 40, price: 208 },
    ],
    totalAmount: 8320, deliveryMode: 'warehouse', coopMode: 'service',
    status: 'delivered', orderDate: '2026-09-08', expectedShipDate: '2026-09-10',
    receiver: '天福物流部', receiverPhone: '0592-566****', receiverAddress: '福建厦门市思明区莲前西路209号',
  },
  {
    id: 'po5', code: 'HHSO20260905005', customerName: '交通银行', customerType: '平台客户',
    items: [
      { productName: '滇红·金芽特级', spec: '100g/罐', quantity: 25, price: 224 },
      { productName: '祁门红茶·特级', spec: '100g/罐', quantity: 18, price: 368 },
    ],
    totalAmount: 12224, deliveryMode: 'direct', coopMode: 'supplier',
    status: 'settled', orderDate: '2026-09-05', expectedShipDate: '2026-09-08',
    receiver: '交通银行总务处', receiverPhone: '021-3138****', receiverAddress: '上海市浦东新区银城中路188号',
  },
  {
    id: 'po6', code: 'HHSO20260901006', customerName: '茗香阁直播', customerType: '带货客户',
    items: [
      { productName: '凤凰单丛·蜜兰香', spec: '100g/袋', quantity: 50, price: 374 },
    ],
    totalAmount: 18700, deliveryMode: 'direct', coopMode: 'service',
    status: 'settled', orderDate: '2026-09-01', expectedShipDate: '2026-09-03',
    receiver: '茗香阁仓储', receiverPhone: '137****0912', receiverAddress: '广东广州市白云区黄石东路288号',
  },
  {
    id: 'po7', code: 'HHSO20260828007', customerName: '八马茶业', customerType: '渠道客户',
    items: [
      { productName: '大红袍·特级', spec: '150g/盒', quantity: 22, price: 494 },
    ],
    totalAmount: 10868, deliveryMode: 'warehouse', coopMode: 'supplier',
    status: 'rejected', orderDate: '2026-08-28', expectedShipDate: '2026-08-30',
    receiver: '八马供应链', receiverPhone: '0595-266****', receiverAddress: '福建泉州市安溪县凤城镇工业路1号',
    remark: '库存不足驳回，已与平台沟通改期',
  },
  {
    id: 'po8', code: 'HHSO20260825008', customerName: '品茗轩', customerType: '直营客户',
    items: [
      { productName: '太平猴魁·特级', spec: '100g/盒', quantity: 16, price: 530 },
    ],
    totalAmount: 8480, deliveryMode: 'direct', coopMode: 'supplier',
    status: 'settled', orderDate: '2026-08-25', expectedShipDate: '2026-08-27',
    receiver: '品茗轩前厅', receiverPhone: '136****3345', receiverAddress: '安徽合肥市蜀山区长江西路888号',
  },
];

/* ── 报备记录（合作商主动报备订单 / 商品 / 客户） ── */
export const partnerReports: PartnerReport[] = [
  {
    id: 'pr1', code: 'BB20260912001', type: 'order', title: '华茗堂茶庄中秋团购订单报备',
    summary: '客户中秋福利采购西湖龙井·明前特级 60 罐、碧螺春·一级 40 袋，预计 9 月 20 日前下单',
    amount: 43840, status: 'pending', submitTime: '2026-09-12 10:30',
  },
  {
    id: 'pr2', code: 'BB20260911002', type: 'customer', title: '南京翠竹茶行报备',
    summary: '渠道客户，主营雨花茶与绿茶批发，月采购额约 3 万元，已实地拜访并建立联系',
    status: 'approved', submitTime: '2026-09-11 16:20', reviewNote: '同意合作，按渠道客户价格体系执行',
  },
  {
    id: 'pr3', code: 'BB20260910003', type: 'product', title: '武夷岩茶·水金龟新商品报备',
    summary: '武夷山产区水金龟岩茶，轻火慢焙，建议供货价 420 元/50g，市场对标价 688 元',
    status: 'approved', submitTime: '2026-09-10 09:15', reviewNote: '商品资质齐全，纳入秋季选品',
  },
  {
    id: 'pr4', code: 'BB20260908004', type: 'order', title: '浦发银行年度慰问品订单报备',
    summary: '浦发银行上海分行 Q4 慰问品采购意向，以金骏眉 + 白毫银针礼盒为主，预计金额 12 万元',
    amount: 120000, status: 'pending', submitTime: '2026-09-08 14:00',
  },
  {
    id: 'pr5', code: 'BB20260905005', type: 'customer', title: '苏州吴门茶事报备',
    summary: '个人工作室客户，主打苏州本地茶客社群，月流水 1.5 万左右，申请个人客户价格',
    status: 'rejected', submitTime: '2026-09-05 11:40', reviewNote: '与现有渠道客户重合，建议并入天福茗茶渠道',
  },
  {
    id: 'pr6', code: 'BB20260901006', type: 'product', title: '冷泡茶便携装报备',
    summary: '针对夏季冷泡场景的便携三角袋泡装，茉莉花茶与白茶两个口味，建议零售价 8 元/袋',
    status: 'approved', submitTime: '2026-09-01 17:30', reviewNote: '试产 2000 袋投放市场',
  },
];

/* ── 合作客户（含可下单商品） ── */
export const partnerCustomers: PartnerCustomer[] = [
  {
    id: 'pc1', name: '华茗堂茶庄', type: '直营客户', region: '江苏南京',
    contactPerson: '林掌柜', contactPhone: '138****6677',
    products: [
      { productId: 'p1', productName: '西湖龙井·明前特级', spec: '50g/罐', supplyPrice: 452, marketPrice: 580 },
      { productId: 'p2', productName: '碧螺春·一级', spec: '100g/袋', supplyPrice: 328, marketPrice: 420 },
      { productId: 'p3', productName: '黄山毛峰·特级', spec: '50g/罐', supplyPrice: 359, marketPrice: 460 },
    ],
    cooperationDate: '2025-04-15', status: 'cooperating', totalOrders: 28, totalAmount: 326800,
  },
  {
    id: 'pc2', name: '清心茶坊', type: '直营客户', region: '浙江宁波',
    contactPerson: '王坊主', contactPhone: '139****2210',
    products: [
      { productId: 'p4', productName: '正山小种·特级', spec: '100g/罐', supplyPrice: 384, marketPrice: 480 },
      { productId: 'p5', productName: '金骏眉·特级', spec: '50g/罐', supplyPrice: 1024, marketPrice: 1280 },
    ],
    cooperationDate: '2025-06-01', status: 'cooperating', totalOrders: 16, totalAmount: 158400,
  },
  {
    id: 'pc3', name: '浦发银行', type: '平台客户', region: '上海浦东',
    contactPerson: '浦发采购中心', contactPhone: '021-5888****',
    products: [
      { productId: 'p6', productName: '金骏眉·特级', spec: '50g/罐', supplyPrice: 1024, marketPrice: 1280 },
      { productId: 'p7', productName: '白毫银针·特级', spec: '50g/罐', supplyPrice: 768, marketPrice: 960 },
      { productId: 'p8', productName: '滇红·金芽特级', spec: '100g/罐', supplyPrice: 224, marketPrice: 320 },
    ],
    cooperationDate: '2025-05-20', status: 'cooperating', totalOrders: 12, totalAmount: 268000,
  },
  {
    id: 'pc4', name: '天福茗茶', type: '渠道客户', region: '福建厦门',
    contactPerson: '天福采购部', contactPhone: '0592-566****',
    products: [
      { productId: 'p9', productName: '铁观音·清香一级', spec: '250g/罐', supplyPrice: 208, marketPrice: 320 },
      { productId: 'p10', productName: '大红袍·特级', spec: '150g/盒', supplyPrice: 494, marketPrice: 720 },
    ],
    cooperationDate: '2025-07-10', status: 'cooperating', totalOrders: 9, totalAmount: 96200,
  },
  {
    id: 'pc5', name: '茗香阁直播', type: '带货客户', region: '广东广州',
    contactPerson: '阁主', contactPhone: '137****0912',
    products: [
      { productId: 'p11', productName: '凤凰单丛·蜜兰香', spec: '100g/袋', supplyPrice: 374, marketPrice: 560 },
      { productId: 'p12', productName: '寿眉·2019年陈', spec: '350g/饼', supplyPrice: 158, marketPrice: 220 },
    ],
    cooperationDate: '2026-01-08', status: 'paused', totalOrders: 5, totalAmount: 74300,
  },
];

/* ── 结算单（合作商发货订单的结算） ── */
export const partnerSettlements: PartnerSettlement[] = [
  {
    id: 'ps1', code: 'JS2026090001', period: '2026-09', orderCount: 3,
    orderAmount: 43896, deduction: 2194.8, settleAmount: 41701.2,
    method: '对公转账', status: 'unsettled', createTime: '2026-09-12',
    orders: ['HHSO20260912001', 'HHSO20260911002', 'HHSO20260910003'],
  },
  {
    id: 'ps2', code: 'JS2026080002', period: '2026-08', orderCount: 2,
    orderAmount: 32168, deduction: 1608.4, settleAmount: 30559.6,
    method: '对公转账', status: 'pending', createTime: '2026-09-02',
    orders: ['HHSO20260828007', 'HHSO20260825008'],
  },
  {
    id: 'ps3', code: 'JS2026070003', period: '2026-07', orderCount: 2,
    orderAmount: 30924, deduction: 1546.2, settleAmount: 29377.8,
    method: '对公转账', status: 'settled', createTime: '2026-08-02', settleTime: '2026-08-09',
    orders: ['HHSO20260718009', 'HHSO20260710010'],
  },
];

/* ── 子账号 ── */
export const partnerAccounts: PartnerAccount[] = [
  { id: 'pa1', username: 'admin', name: '陈建国', role: 'admin', phone: '139****0001', status: 'active', createTime: '2025-03-01', lastLogin: '2026-09-12 09:00' },
  { id: 'pa2', username: 'sales01', name: '李慧敏', role: 'business', phone: '139****0002', status: 'active', createTime: '2025-06-15', lastLogin: '2026-09-11 18:30' },
  { id: 'pa3', username: 'wh01', name: '周仓管', role: 'warehouse', phone: '139****0003', status: 'disabled', createTime: '2025-08-01' },
];

/* ── 标签配置 ── */
export const PARTNER_DELIVERY_LABELS: Record<string, string> = { direct: '直送订单', warehouse: '入库订单' };
export const PARTNER_COOP_LABELS: Record<string, string> = { supplier: '供应商模式', service: '服务商模式' };
export const PARTNER_ORDER_STATUS_LABELS: Record<string, string> = {
  pending: '待接单', accepted: '已接单', shipping: '发货中', delivered: '已签收', settled: '已结算', rejected: '已驳回',
};
export const PARTNER_ORDER_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FFF3E0', color: '#E65100' },
  accepted: { bg: '#E3F2FD', color: '#0F64B5' },
  shipping: { bg: '#E8EAF6', color: '#3949AB' },
  delivered: { bg: '#E8F5E9', color: '#01795D' },
  settled: { bg: '#F3E5F5', color: '#7B1FA2' },
  rejected: { bg: '#FFEBEE', color: '#C62828' },
};
export const PARTNER_REPORT_TYPE_LABELS: Record<string, string> = { order: '订单报备', product: '商品报备', customer: '客户报备' };
export const PARTNER_REPORT_STATUS_LABELS: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已驳回' };
export const PARTNER_ACCOUNT_ROLE_LABELS: Record<string, string> = { admin: '管理员', business: '业务员', warehouse: '仓管员' };
