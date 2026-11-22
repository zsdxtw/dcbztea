/** 模块标识 */
export enum ModuleKey {
  DASHBOARD = 'dashboard',
  PURCHASE = 'purchase',
  PARTNER = 'partner',
  SALES = 'sales',
  PRODUCT = 'product',
  FINANCE = 'finance',
  STATISTICS = 'statistics',
  SETTINGS = 'settings',
  PERSONNEL = 'personnel',
}

/** 六大茶类 */
export enum TeaCategory {
  GREEN = 'green',
  WHITE = 'white',
  YELLOW = 'yellow',
  OOLONG = 'oolong',
  RED = 'red',
  DARK = 'dark',
  FLOWER = 'flower',
}

/** 订单状态 */
export enum OrderStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SHIPPING = 'shipping',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/** 库存状态 */
export enum StockStatus {
  SUFFICIENT = 'sufficient',
  LOW = 'low',
  INSUFFICIENT = 'insufficient',
}

/** 侧边栏菜单项 */
export interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

/** 模块配置 */
export interface ModuleConfig {
  key: ModuleKey;
  label: string;
  menus: MenuItem[];
}

/** 趋势数据 */
export interface TrendData {
  direction: 'up' | 'down';
  value: string;
  label?: string;
}

/** 统计卡片数据 */
export interface StatCardData {
  label: string;
  value: string;
  unit?: string;
  trend?: TrendData;
  icon: React.ReactNode;
}

/** 订单项 */
export interface OrderItem {
  id: string;
  code: string;
  partner: string;
  product: string;
  teaCategory: TeaCategory;
  quantity: string;
  amount: string;
  status: OrderStatus;
}

/** 商品项 */
export interface ProductItem {
  id: string;
  name: string;
  spec: string;
  teaCategory: TeaCategory;
  price: number;
  unit: string;
}

/** 库存项 */
export interface StockItem {
  id: string;
  productName: string;
  teaCategory: TeaCategory;
  warehouse: string;
  quantity: string;
  status: StockStatus;
}

/** 预警项 */
export interface AlertItemData {
  name: string;
  stock: string;
  level: 'danger' | 'warning';
}

/** 待办项 */
export interface TodoItemData {
  text: string;
  time: string;
  done: boolean;
}

/** 按钮变体 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'default' | 'sm';

/** 状态标签变体 */
export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

/** 通知类型 */
export enum NotificationType {
  SYSTEM = 'system',
  ORDER = 'order',
  QUALITY = 'quality',
  INVENTORY = 'inventory',
}

/** 质检结果 */
export enum QualityResult {
  PENDING = 'pending',
  QUALIFIED = 'qualified',
  UNQUALIFIED = 'unqualified',
}

/** 报价状态 */
export enum QuotationStatus {
  PENDING_REPLY = 'pending_reply',
  QUOTED = 'quoted',
  EXPIRED = 'expired',
  CONVERTED = 'converted',
}

/** 通知项 */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  time: string;
  read: boolean;
}

/** 质检项 */
export interface QualityItem {
  id: string;
  batchCode: string;
  productName: string;
  teaCategory: TeaCategory;
  grade: string;
  moisture: number;
  ash: number;
  pesticideResidue: number;
  sensory: string;
  result: QualityResult;
}

/** 报价项 */
export interface QuotationItem {
  id: string;
  quotationCode: string;
  customer: string;
  teaCategory: TeaCategory;
  grade: string;
  unitPrice: number;
  quantity: number;
  amount: number;
  validUntil: string;
  status: QuotationStatus;
}

/** 溯源步骤 */
export interface TraceStep {
  stage: string;
  location: string;
  date: string;
  operator: string;
}

/** 溯源项 */
export interface TraceabilityItem {
  id: string;
  batchCode: string;
  productName: string;
  teaCategory: TeaCategory;
  grade: string;
  source: string;
  inboundDate: string;
  status: StockStatus;
  traceSteps: TraceStep[];
}

/** 品级项 */
export interface GradeItem {
  id: string;
  name: string;
  applicableCategories: TeaCategory[];
  pricingFactor: number;
  sensoryStandard: string;
  productCount: number;
  active: boolean;
}

/** 茶类详情 */
export interface TeaCategoryDetail {
  category: TeaCategory;
  introduction: string;
  process: string;
  storage: string;
  flavor: string;
  representativeTeas: string[];
  productCount: number;
}

/** 退货状态 */
export enum ReturnStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

/** 退货项 */
export interface ReturnItem {
  id: string;
  code: string;
  originalOrder: string;
  partner: string;
  product: string;
  quantity: string;
  amount: string;
  reason: string;
  status: ReturnStatus;
}

/** 预警类型 */
export enum AlertType {
  STOCK_LOW = 'stock_low',
  SHELF_LIFE = 'shelf_life',
  SLOW_MOVING = 'slow_moving',
  STOCK_HIGH = 'stock_high',
  ENVIRONMENT = 'environment',
  PRICE = 'price',
  SUPPLY = 'supply',
}

/** 预警规则项 */
export interface AlertRuleItem {
  id: string;
  name: string;
  type: AlertType;
  condition: string;
  productCount: number;
  enabled: boolean;
  triggered: boolean;
}

/** 收款/付款状态 */
export enum PaymentStatus {
  PAID = 'paid',
  PENDING = 'pending',
  OVERDUE = 'overdue',
  RECEIVED = 'received',
}

/** 发票状态 */
export enum InvoiceStatus {
  ISSUED = 'issued',
  RECEIVED = 'received',
  PENDING = 'pending',
  VOID = 'void',
}

/** 发票类型 */
export enum InvoiceType {
  OUTPUT = 'output',
  INPUT = 'input',
}

/** 库位状态 */
export enum LocationStatus {
  OCCUPIED = 'occupied',
  EMPTY = 'empty',
  MAINTENANCE = 'maintenance',
}

/** 用户状态 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/** 备份状态 */
export enum BackupStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

/** 品牌等级 */
export enum BrandLevel {
  S = 'S',
  A = 'A',
  B = 'B',
  C = 'C',
}

/** 品牌状态 */
export enum BrandStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/** 品牌项 */
export interface BrandItem {
  id: string;
  code: string;
  name: string;
  logo: string;
  owner: string;
  introduction: string;
  requirements: string;
  policy: string;
  series: string[];
  trademarkCert: string[];
  jdStoreUrl: string;
  tmallStoreUrl: string;
  contactPerson: string;
  contactPhone: string;
  /** 省份 */
  province?: string;
  /** 城市 */
  city?: string;
  /** 区县 */
  district?: string;
  address: string;
  mainCategories: string[];
  /** 品牌所属一级分类（商品 > 分类管理）：tea=茶叶 / teaware=茶具 / tea-peripheral=茶周边 / other=其他 */
  categoryType?: 'tea' | 'teaware' | 'tea-peripheral' | 'other';
  productCount: number;
  supplierCount: number;
  website: string;
  cooperationDate: string;
}

/** 茶叶商品 */
export interface TeaProduct {
  id: string;
  code: string;
  name: string;
  category: string;
  categories: string[];
  brand: string;
  series: string;
  packageUnit: string;
  barcode69: string;
  model: string;
  spec: string;
  /** 每份规格 */
  perUnitSpec: {
    netWeight: number;       // 净重
    netWeightUnit: string;   // 净重单位
    grossWeight: number;     // 毛重
    grossWeightUnit: string; // 毛重单位
    length: number;          // 长
    width: number;           // 宽
    height: number;          // 高
    dimensionUnit: string;   // 尺寸单位
  };
  /** 每箱规格（箱规） */
  perBoxSpec: {
    quantity: number;        // 每箱数量
    netWeight: number;       // 净重 = 每份净重 × 数量
    netWeightUnit: string;   // 净重单位
    grossWeight: number;     // 毛重 = 每份毛重 × 数量
    grossWeightUnit: string; // 毛重单位
    length: number;          // 长
    width: number;           // 宽
    height: number;          // 高
    dimensionUnit: string;   // 尺寸单位
  };
  weight: number;
  volume: { length: number; width: number; height: number };
  quantityPerUnit: number;
  grade: string;
  origin: string;
  shelfLife: number;
  taxRate: number;
  packageList: string;
  marketPrice: number;
  tmallPrice: number;
  tmallUrl: string;
  jdPrice: number;
  jdUrl: string;
  /** 销售价：当前系统内各商品标准的对外销售价 */
  salesPrice: number;
  shelfStatus: 'on' | 'off';
  purchaseStatus: 'available' | 'stopped';
  productionStatus: 'producing' | 'stopped';
  mainImages: string[];
  detailImages: string[];
  displayImageIndex: number;
  stockAlert: number;
  stock: number;
  reservedStock: number;
  totalSales: number;
  features: string;
  includesTeaware: boolean;
  remark: string;
}

/** 茶人类型 */
export type TeaProfessionalType = 'tea_artist' | 'tea_evaluator' | 'tea_maker' | 'tea_sommelier';

/** 茶人证书 */
export interface TeaCertificate {
  name: string;
  level: string;
  issuer: string;
  issueDate: string;
  certNo: string;
}

/** 茶人获奖记录 */
export interface TeaAward {
  name: string;
  level: string;
  awardDate: string;
  organization: string;
}

/** 茶人服务报价 */
export interface TeaServiceQuote {
  serviceType: string;
  duration: string;
  price: number;
  unit: string;
  remark: string;
}

/** 茶人 */
export interface TeaProfessional {
  id: string;
  name: string;
  type: TeaProfessionalType[];
  gender: 'male' | 'female';
  photo: string;
  region: string;
  /** 省份 */
  province?: string;
  /** 城市 */
  city?: string;
  /** 区县 */
  district?: string;
  height: number;
  weight: number;
  birthDate: string;
  phone: string;
  email: string;
  idCard: string;
  address: string;
  certificates: TeaCertificate[];
  specialties: string[];
  awards: TeaAward[];
  serviceQuotes: TeaServiceQuote[];
  introduction: string;
  status: 'active' | 'inactive';
  /** 结算信息（户名、卡号、开户银行、开户行号） */
  settlement?: EmployeeSettlement;
}

/**
 * 合作商类型
 * - brand：品牌商，品牌拥有方，平台直接合作（与供应商/服务商互斥）
 * - supplier：供应商，差价模式，平台直接按价格采购、背对背销售
 * - service：服务商，扣点模式，在售价基础上收取服务费，差价由服务商获得
 */
export type SupplierType = 'brand' | 'supplier' | 'service';

/** 供应商评价等级 */
export type SupplierGrade = 'S' | 'A' | 'B' | 'C' | 'D';

/** 税务类型 */
export type TaxType = 'small' | 'general';

/** 结算方式 */
export type SettlementMethod = 'period' | 'prepaid' | 'invoice' | 'monthly' | 'quarterly';

/** 快递费结算方式 */
export type ShippingSettlement = 'free' | 'not_free_fixed' | 'not_free_ratio' | 'not_free_bear';

/** 仓库信息 */
export interface SupplierWarehouse {
  id: string;
  name: string;
  province?: string;
  city?: string;
  district?: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  isDefault: boolean;
}

/** 品牌授权资质文件（按品牌维度维护：键=品牌名称） */
export type BrandAuthFiles = Record<string, string[]>;

/** 供应商门店 */
export interface SupplierStore {
  id: string;
  /** 门店名称 */
  name: string;
  /** 省份 */
  province?: string;
  /** 城市 */
  city?: string;
  /** 区县 */
  district?: string;
  /** 详细地址 */
  address: string;
  /** 门店面积（㎡） */
  area: number;
  /** 负责人 */
  manager?: string;
  /** 联系电话 */
  phone?: string;
  /** 主营品牌 */
  mainBrands: string[];
  /** 门店照片（最多 5 张） */
  photos?: string[];
  /** 营业状态 */
  status: 'active' | 'inactive';
}

/** 终端账号（管理员 / 操作员） */
export interface SupplierTerminalAccount {
  id: string;
  /** admin=管理员（每个终端唯一，不可删除）/ operator=操作员 */
  role: 'admin' | 'operator';
  /** 登录账号 */
  username: string;
  /** 登录密码 */
  password: string;
  /** 姓名 */
  name: string;
  /** 手机号码 */
  phone: string;
  /** 账号状态 */
  status: 'active' | 'inactive';
  /** 创建时间 */
  createTime?: string;
  /** 最近登录 */
  lastLogin?: string;
}

/** 供应商终端账号 */
export interface SupplierTerminal {
  /** 是否开通终端 */
  enabled: boolean;
  /** 终端登录账号（= 管理员账号名，登录匹配用） */
  username: string;
  /** 初始密码 */
  password?: string;
  /** 账号状态 */
  status: 'active' | 'inactive';
  /** 开通时间 */
  openTime?: string;
  /** 最近登录 */
  lastLogin?: string;
  /** 备注 */
  remark?: string;
  /** 终端账号列表（管理员 + 操作员）；未初始化时由 username/password 派生管理员账号 */
  accounts?: SupplierTerminalAccount[];
}

/** 仓库归属类型：独立仓库（自有的纯仓库）/ 门店仓库（自有的在茶叶门店的仓库）/ 合作仓库（供应商的合作仓库） */
export type WarehouseCategory = 'independent' | 'store' | 'partner';

/** 仓库信息（仓库设置模块统一结构） */
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  /** 省份 */
  province?: string;
  /** 城市 */
  city?: string;
  /** 区县 */
  district?: string;
  manager: string;
  phone: string;
  category: WarehouseCategory;
  enabled: boolean;
  isDefault: boolean;
  /** 合作仓库关联的供应商 ID（独立/门店仓库为空） */
  supplierId?: string;
  /** 合作仓库关联的供应商名称（独立/门店仓库为空） */
  supplierName?: string;
}

/** 开票信息 */
export interface InvoiceInfo {
  title: string;
  taxNo: string;
  taxRate: number;
  address?: string;
  phone?: string;
  bankName?: string;
  bankAccount?: string;
}

/** 结算银行账号 */
export interface BankAccount {
  accountName: string;
  accountNo: string;
  bankName: string;
  bankNo: string;
  remark?: string;
}

/** 客户类型 */
export type CustomerType = 'direct' | 'channel' | 'personal' | 'platform' | 'guest';

/** 客户采购端（客户采买平台）终端：开通后客户可登录采购端按报品报（调）价选品下单 */
export interface CustomerTerminal {
  /** 是否开通 */
  enabled: boolean;
  /** 管理员登录账号 */
  username: string;
  /** 登录密码（演示环境明文） */
  password?: string;
  /** 账号状态 */
  status: 'active' | 'inactive';
  /** 开通时间 */
  openTime?: string;
  /** 最近登录 */
  lastLogin?: string;
  /** 备注 */
  remark?: string;
}

/** 客户分组 */
export type CustomerGroup = 'enterprise' | 'personal';

/** 下单人（直营客户下的联系人） */
export interface OrderContact {
  /** 下单人 ID */
  id: string;
  /** 姓名 */
  name: string;
  /** 部门 */
  department?: string;
  /** 手机号码 */
  phone?: string;
  /** 地址 */
  address?: string;
  /** 备注 */
  remark?: string;
  /** 是否由订单自动创建（销售订单收件人不在下单人内时自动添加） */
  autoCreated?: boolean;
}

/** 平台结算账户 */
export interface PlatformBankAccount {
  accountName: string;
  accountNo: string;
  bankName: string;
  bankNo: string;
}

/** 平台发票信息 */
export interface PlatformInvoiceInfo {
  invoiceEntity: string;
  taxNo: string;
  taxRate: string;
}

/** 客户结算账户（与平台结算账户结构一致） */
export type CustomerBankAccount = PlatformBankAccount;

/** 客户发票信息（与平台发票信息结构一致） */
export type CustomerInvoiceInfo = PlatformInvoiceInfo;

/** 人员角色类型：员工 / 茶人 */
export type PersonRoleType = 'employee' | 'tea_professional';

/** 分润比例设置 */
export interface ProfitShareConfig {
  /** 拓客人分润比例（0-100） */
  developerRatio: number;
  /** 维护人分润比例（0-100） */
  maintainerRatio: number;
  /** 跟单人分润比例（0-100） */
  followerRatio: number;
}

/** 直营客户分子机构 */
export interface CustomerSubOrganization {
  id: string;
  /** 机构名称 */
  name: string;
  /** 联系人 */
  contactPerson: string;
  /** 联系方式 */
  contactPhone: string;
  /** 省份 */
  province?: string;
  /** 城市 */
  city?: string;
  /** 区县 */
  district?: string;
  /** 详细地址 */
  address: string;
  /** 拓客人 ID */
  developerId?: string;
  /** 拓客人类型 */
  developerType?: PersonRoleType;
  /** 拓客人姓名（冗余，便于展示） */
  developerName?: string;
  /** 维护人 ID */
  maintainerId?: string;
  /** 维护人类型 */
  maintainerType?: PersonRoleType;
  /** 维护人姓名（冗余，便于展示） */
  maintainerName?: string;
  /** 备注 */
  remark?: string;
}

/** 平台 */
export interface PlatformItem {
  id: string;
  name: string;
  shortName: string;
  /** 平台编号（规则：KHPT-0001） */
  code: string;
  contactPerson: string;
  contactPosition: string;
  contactPhone: string;
  contactAddress: string;
  /** 省份 */
  province?: string;
  /** 城市 */
  city?: string;
  /** 区县 */
  district?: string;
  cooperationDate: string;
  /** 支付保证金（单位：元，平台客户交纳的保证金，联动记入财务-其他应收款-暂付款项） */
  deposit?: number;
  /** 保证金应收日期 */
  depositDueDate?: string;
  /** 拓客人 ID（原主办人，负责该平台客户的拓展与维护，可为员工/茶人） */
  developerId?: string;
  /** 拓客人类型 */
  developerType?: PersonRoleType;
  /** 拓客人姓名（冗余，便于展示） */
  developerName?: string;
  bankAccounts: PlatformBankAccount[];
  invoiceInfos: PlatformInvoiceInfo[];
  status: 'active' | 'inactive';
  /** 客户采买平台终端（开通后可登录采买平台选品下单） */
  terminal?: CustomerTerminal;
  remark?: string;
}

/** 客户 */
/** 客户入池配置（管理台维护，合作商终端「客户池」读取） */
export interface CustomerPoolConfig {
  /** 入池状态：true=入池（合作商按地区可见） */
  enabled: boolean;
  /** 全国（勾选后全部地区可见，优先于省市县） */
  nationwide: boolean;
  /** 全省范围（省份名） */
  provinces: string[];
  /** 全市范围（'省/市' 路径） */
  cities: string[];
  /** 区县范围（'省/市/县' 路径） */
  districts: string[];
  /** 合作规则（合作商与该客户合作的规则说明，展示于合作商终端客户池） */
  coopRule?: {
    /** 基础要求（品质、包装、售后等要求） */
    requirements?: string;
    /** 订单流程（订货方式、确认流程等） */
    orderProcess?: string;
    /** 发货要求（发货时限、物流方式等） */
    shipping?: string;
    /** 结算规则（账期、开票、对账等） */
    settlement?: string;
    /** 推品规则（推品清单、推介支持等） */
    promotion?: string;
    /** 注意事项（禁止事项、风险提示等补充说明） */
    precautions?: string;
  };
  /** 淡茶扣点（百分比，平台对该客户的扣点比例；展示于合作商终端客户池卡片） */
  dachaRate?: number;
}

/* ════════════════════════════════════════
 * 客户推介（合作商向平台推介客户参加茶培训 / 茶活动）
 * ════════════════════════════════════════ */

/** 推介业务类型：茶培训 / 茶活动 / 入驻淡茶（推介新合作商注册入驻） */
export type ReferralBizType = 'training' | 'activity' | 'join';

/** 茶培训项目子类 */
export type ReferralTrainingKind = '审评师初级' | '审评师中级' | '审评师高级' | '茶艺师' | '兴趣爱好班';

/** 推介单状态：待确认 → 跟进中 → 客户确认 → 推介成功 / 推介失败 */
export type ReferralStatus = 'pending' | 'contacting' | 'confirmed' | 'succeeded' | 'failed';

/** 推介奖励规则（管理后台按推介业务设置，展示于合作商发起推介弹窗） */
export interface ReferralRewardRule {
  /** 积分奖励（推介成功自动入账） */
  score: number;
  /** 分润类型：fixed 固定金额 / percent 成交金额百分比（二选一） */
  profitType: 'fixed' | 'percent';
  /** 分润值：fixed 时为元，percent 时为百分比数值（如 5 表示成交金额的 5%） */
  profitValue: number;
  /** 其他奖励说明（如新商扶持资源、礼品等） */
  otherReward: string;
}

/** 平台跟进记录 */
export interface ReferralFollowUp {
  time: string;
  operator: string;
  note: string;
}

/** 客户推介单（合作商发起，平台跟进，成功后结算收益并落实客户福利） */
export interface CustomerReferral {
  id: string;
  /** 推介编号（TJ-0001 顺序生成） */
  code: string;
  /** 推介合作商 */
  supplierId: string;
  supplierName: string;
  /** 业务类型：training 茶培训 / activity 茶活动 / join 入驻淡茶 */
  bizType: ReferralBizType;
  /** 培训项目子类（bizType=training 时有值） */
  trainingKind?: ReferralTrainingKind;
  /** 推介项目名称（培训自动拼接，活动手填，入驻自动生成） */
  title: string;
  /** 被推介客户名称（客户池选择或手填） */
  customerName: string;
  /** 客户联系方式 */
  customerPhone: string;
  /** 被推介客户联系人（bizType=join 时填写） */
  contactPerson?: string;
  /** 是否允许平台直接电话联系客户 */
  allowDirectCall: boolean;
  /** 推介成功收益（合作商所得，元） */
  rewardAmount: number;
  /** 客户福利（客户通过推介获得的权益说明） */
  customerBenefit: string;
  remark?: string;
  status: ReferralStatus;
  submitTime: string;
  /** 推介成功时间 */
  successTime?: string;
  /** 平台跟进记录（时间线） */
  followUps: ReferralFollowUp[];
}

/** 入池范围匹配：入池开 + (全国 或 选中省/市/县 命中任一范围) 才对合作商展示 */
export function matchPoolScope(
  cfg: CustomerPoolConfig | undefined,
  prov?: string,
  city?: string,
  district?: string,
): boolean {
  if (!cfg?.enabled) return false;
  if (cfg.nationwide) return true;
  if (prov && cfg.provinces.includes(prov)) return true;
  if (prov && city && cfg.cities.includes(`${prov}/${city}`)) return true;
  if (prov && city && district && cfg.districts.includes(`${prov}/${city}/${district}`)) return true;
  return false;
}

export interface CustomerItem {
  id: string;
  name: string;
  /** 客户简称 */
  shortName?: string;
  /** 客户编号（直营KHZY/渠道KHQD-XXXXX） */
  customerCode?: string;
  type: CustomerType;
  /** 是否经平台（仅 type='direct' 时有效）：true=经平台，false=无平台 */
  viaPlatform?: boolean;
  region: string;
  /** 省份 */
  province?: string;
  /** 城市 */
  city?: string;
  /** 区县 */
  district?: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail?: string;
  contactAddress?: string;
  level: string;
  orders: number;
  totalAmount: number;
  /** 直营客户关联的平台ID列表；渠道客户为空 */
  platformIds: string[];
  /** 平台扣点映射（仅"带平台方"的直营客户设置，键为平台ID，值为扣点如"8%"；扣点跟随平台，同一客户不同平台可有不同扣点） */
  platformCommissionRates?: Record<string, string>;
  /** 拓客人 ID（原主办人，负责客户拓展，可为员工/茶人） */
  developerId?: string;
  /** 拓客人类型 */
  developerType?: PersonRoleType;
  /** 拓客人姓名（冗余，便于展示） */
  developerName?: string;
  /** 维护人 ID（负责客户维护，可为员工/茶人） */
  maintainerId?: string;
  /** 维护人类型 */
  maintainerType?: PersonRoleType;
  /** 维护人姓名（冗余，便于展示） */
  maintainerName?: string;
  /** 跟单人 ID（负责订单跟进，可为员工/茶人） */
  followerId?: string;
  /** 跟单人类型 */
  followerType?: PersonRoleType;
  /** 跟单人姓名（冗余，便于展示） */
  followerName?: string;
  /** 分润比例配置 */
  profitShare?: ProfitShareConfig;
  cooperationDate: string;
  status: 'active' | 'inactive';
  settlementMethod?: string;
  taxNo?: string;
  /** 客户来源 */
  source?: string;
  /** 结算账户列表 */
  bankAccounts?: CustomerBankAccount[];
  /** 发票信息列表 */
  invoiceInfos?: CustomerInvoiceInfo[];
  /** 备注 */
  remark?: string;
  /** 下单人列表（仅 type='direct' 时有效） */
  orderContacts?: OrderContact[];
  /** 分子机构列表（仅 type='direct' 时有效） */
  subOrganizations?: CustomerSubOrganization[];
  /** 客户采购端终端（开通后客户可登录采购端选品下单） */
  terminal?: CustomerTerminal;
}

/** 门店（线下茶叶店） */
export interface StoreItem {
  id: string;
  /** 门店编号（MD-XXXX） */
  code: string;
  /** 门店名称 */
  name: string;
  /** 省份 */
  province: string;
  /** 城市 */
  city: string;
  /** 区县 */
  district: string;
  /** 详细地址 */
  address: string;
  /** 店长/负责人 */
  manager: string;
  /** 联系电话 */
  phone: string;
  /** 营业时间 */
  businessHours: string;
  /** 开业日期 */
  openingDate: string;
  /** 门店面积（㎡） */
  area: number;
  /** 营业状态 */
  status: 'active' | 'inactive';
  /** 备注 */
  remark?: string;
}

/** 供应商 */
export type SupplierChannelSource = 'manual' | 'terminal';

export interface SupplierItem {
  id: string;
  /** 合作商编号（HZS-001 顺序号，档案创建时生成） */
  code?: string;
  /** 合作商类型（可多选：品牌商与供应商/服务商互斥，供应商与服务商可同时选择） */
  types: SupplierType[];
  name: string;
  /** 合作商简称（3-4 字，用于生成管理员登录账号） */
  shortName?: string;
  unifiedCreditCode: string;
  cooperationAgreements: string[];
  brandAuthAgreements: string[];
  businessLicense: string;
  /** 资质文件（最多 5 个：营业执照、生产许可、食品经营许可等） */
  qualificationFiles: string[];
  /** 渠道来源：manual=手动创建 / terminal=终端注册 */
  channelSource: SupplierChannelSource;
  /** 注册地址-省份 */
  registeredProvince?: string;
  /** 注册地址-城市 */
  registeredCity?: string;
  /** 注册地址-区县 */
  registeredDistrict?: string;
  registeredAddress: string;
  legalRepresentative: string;
  establishmentDate: string;
  registeredCapital: string;
  companyType: string;
  businessScope: string;
  contactPerson: string;
  contactPosition: string;
  /** 联系地址-省份 */
  contactProvince?: string;
  /** 联系地址-城市 */
  contactCity?: string;
  /** 联系地址-区县 */
  contactDistrict?: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  /** 短信通知手机号（接收订单/审批等通知短信，最多 2 个） */
  smsNotifyPhones?: string[];
  warehouses: SupplierWarehouse[];
  /** 主营品牌（品牌名称，来源于商品-品牌管理，支持多选） */
  mainBrands?: string[];
  /** 品牌授权资质文件（键=品牌名称；选择主营品牌后需上传对应品牌的授权资质） */
  brandAuthFiles?: BrandAuthFiles;
  /** 供应商门店 */
  stores: SupplierStore[];
  /** 供应商终端账号 */
  terminal: SupplierTerminal;
  taxType: TaxType;
  invoiceInfo: InvoiceInfo;
  cooperationDate: string;
  grade: SupplierGrade;
  mainCategories: string[];
  introduction: string;
  settlementMethod: SettlementMethod;
  bankAccount: BankAccount;
  shippingSettlement: ShippingSettlement;
  shippingFee?: number;
  shippingRemark?: string;
  supportDropship: boolean;
  qualificationStatus: 'qualified' | 'pending' | 'expired';
  paymentTerms: string;
  deliveryCycle: string;
  minOrderAmount: number;
  returnPolicy: string;
  qualityGuarantee: string;
  remark: string;
  status: 'active' | 'inactive';
}

/** 供应商注册/信息修改审批单（合作商终端 → 管理端注册审批） */
export interface SupplierApproval {
  id: string;
  /** 审批编号 */
  code: string;
  /** 类型：register=注册申请 / modify=信息修改申请 */
  type: 'register' | 'modify';
  /** 申请人（合作商终端账号名 / 注册时填写的登录账号） */
  applicant: string;
  /** 申请说明 */
  applyNote?: string;
  /** 合作商完整档案（注册=草稿档案；修改=修改后的档案） */
  payload: SupplierItem;
  /** 关联供应商 ID（modify 时必填） */
  supplierId?: string;
  status: 'pending' | 'approved' | 'rejected';
  submitTime: string;
  reviewTime?: string;
  reviewer?: string;
  reviewNote?: string;
}

/* ─────────────────────────── 新品提醒 / 合作商报价 ─────────────────────────── */

/* ─────────────────────────── 合作商退货管理 ─────────────────────────── */

/** 退货单状态：pending=待受理 / accepted=已受理(待客户寄回) / rejected=已拒绝 / shipped=客户已寄回(待收货) / received=已收货(待处理) / completed=已完成(退款/换货) */
export type PartnerReturnStatus = 'pending' | 'accepted' | 'rejected' | 'shipped' | 'received' | 'completed';

/** 处理方案：refund=退款 / exchange=换货 */
export type PartnerReturnSolution = 'refund' | 'exchange';

/** 客户退货单（合作商终端处理） */
export interface PartnerReturn {
  id: string;
  /** 退货编号（TH+日期+3位序号） */
  code: string;
  /** 处理合作商 */
  supplierId: string;
  supplierName: string;
  /** 关联销售单号 */
  sourceOrderCode: string;
  /** 客户名称 */
  customerName: string;
  /** 退货商品（数量为退货数量） */
  items: { productName: string; spec: string; price: number; quantity: number }[];
  /** 退货原因 */
  reason: string;
  /** 处理方案：退款 / 换货 */
  solution: PartnerReturnSolution;
  /** 退款金额（换货时为商品金额） */
  refundAmount: number;
  /** 状态 */
  status: PartnerReturnStatus;
  /** 客户申请/登记时间 */
  applyTime: string;
  /** 受理时间 */
  acceptTime?: string;
  /** 完成时间 */
  finishTime?: string;
  /** 处理轨迹 */
  history: { time: string; action: string; detail?: string }[];
}

/* ─────────────────────────── 合作商通知公告 ─────────────────────────── */

/** 公告级别：normal=普通 / important=重要 */
export type NoticeLevel = 'normal' | 'important';
/** 公告状态：draft=草稿 / published=已发布 / withdrawn=已撤回 */
export type NoticeStatus = 'draft' | 'published' | 'withdrawn';

/** 合作商通知公告（管理后台发布，合作商工作台展示） */
export interface PartnerNotice {
  id: string;
  /** 公告编号（TZGG-0001 顺序号） */
  code: string;
  /** 公告标题 */
  title: string;
  /** 公告正文（多行文本） */
  content: string;
  /** 级别：普通 / 重要 */
  level: NoticeLevel;
  /** 是否置顶（仅已发布可置顶，工作台置顶优先展示） */
  pinned: boolean;
  /** 状态：草稿 / 已发布 / 已撤回 */
  status: NoticeStatus;
  /** 发布时间（首次发布时固化） */
  publishTime?: string;
  /** 发布人（管理后台操作员） */
  publisher: string;
  /** 创建时间 */
  createTime: string;
}

/** 新品提醒处理状态：pending=待处理 / listed=已上架 / dismissed=已忽略 */
export type NewArrivalStatus = 'pending' | 'listed' | 'dismissed';

/** 新品提醒：合作商提报品牌商已上市、平台未上架的商品 */
export interface NewArrivalReminder {
  id: string;
  /** 提醒编号（XPTX-0001） */
  code: string;
  /** 提报合作商（供应商）ID */
  supplierId: string;
  /** 提报合作商名称 */
  supplierName: string;
  /** 品牌（来源于商品-品牌管理） */
  brand: string;
  /** 商品名称（品牌商已上市商品） */
  productName: string;
  /** 商品电商平台链接 */
  productUrl: string;
  /** 提报人（合作商终端账号名） */
  submitter: string;
  /** 提报时间 */
  submitTime: string;
  status: NewArrivalStatus;
  /** 处理备注（上架/忽略说明） */
  handleNote?: string;
  /** 处理时间 */
  handleTime?: string;
}

/** 合作商单品报价覆盖方式 */
export interface PartnerQuoteOverride {
  /** discount=单独折扣（百分比）/ price=单独价格（元） */
  type: 'discount' | 'price';
  /** type=discount 时为折扣百分比（如 85 表示市场价的 85%）；type=price 时为报价（元） */
  value: number;
}

/** 合作商报价设置（按合作商维度：品牌整体折扣 + 单品覆盖 + 是否供货） */
export interface PartnerQuoteSetting {
  /** 合作商（供应商）ID */
  supplierId: string;
  /** 品牌整体报价折扣（百分比，基于市场价；键=品牌名称） */
  brandDiscounts: Record<string, number>;
  /** 单品报价覆盖（键=商品 ID；优先于品牌整体折扣） */
  productOverrides: Record<string, PartnerQuoteOverride>;
  /** 是否供货（键=商品 ID；true=该合作商向淡茶半盏供应该商品；缺省=不供货） */
  supplyProducts?: Record<string, boolean>;
  /** 最近更新时间 */
  updateTime?: string;
}

/* ─────────────────────────── 价格体系类型 ─────────────────────────── */

/** 采购价规则：按「商品 + 供应商」维度维护 */
export interface PurchasePriceRule {
  id: string;
  /** 商品 ID */
  productId: string;
  productName: string;
  brand: string;
  category: string;
  /** 供应商 ID */
  supplierId: string;
  supplierName: string;
  /** 市场价（冗余，便于展示对比） */
  marketPrice: number;
  /** 采购价：与供应商商定的进货价格 */
  purchasePrice: number;
  /** 采购折扣率（百分比，如 55 表示 55%） */
  discountRate: number;
  /** 生效日期 */
  validFrom: string;
  /** 失效日期 */
  validTo: string;
  /** 状态 */
  status: 'active' | 'inactive';
  /** 最近调价记录 */
  lastAdjustDate?: string;
  lastAdjustNote?: string;
}

/** VIP 销售价规则：按「商品 + 客户」维度维护 */
export interface VipPriceRule {
  id: string;
  /** 商品 ID */
  productId: string;
  productName: string;
  brand: string;
  category: string;
  /** 客户 ID */
  customerId: string;
  customerName: string;
  /** 客户类型 */
  customerType: string;
  /** 市场价（冗余） */
  marketPrice: number;
  /** 标准销售价（冗余） */
  salesPrice: number;
  /** VIP 销售价 */
  vipPrice: number;
  /** VIP 折扣率（百分比，如 85 表示 85%） */
  discountRate: number;
  /** 生效日期 */
  validFrom: string;
  /** 失效日期 */
  validTo: string;
  /** 状态 */
  status: 'active' | 'inactive';
  /** 备注 */
  remark?: string;
}

/** 采购订单明细项（含采购实价） */
export interface PurchaseOrderItem {
  productId: string;
  name: string;
  spec: string;
  quantity: string;
  /** 市场价（参考） */
  marketPrice: number;
  /** 采购价（系统带出的默认价） */
  purchasePrice: number;
  /** 采购实价：本订单实际成交价格（可调整） */
  actualPurchasePrice: number;
  /** 金额 = 数量 × 采购实价 */
  amount: string;
}

/** 销售订单明细项（含销售实价） */
export interface SalesOrderItem {
  productId: string;
  name: string;
  teaCategory: TeaCategory;
  quantity: string;
  /** 市场价（参考） */
  marketPrice: number;
  /** 默认销售价（VIP价或销售价，系统带出） */
  defaultPrice: number;
  /** 销售实价：本订单实际成交价格（可调整） */
  actualSalesPrice: number;
  /** 价格来源：vip / sales / market */
  priceSource: 'vip' | 'sales' | 'market';
  /** 金额 = 数量 × 销售实价 */
  amount: string;
}

/* ════════════════════════════════════════
 * 组织架构 & 员工管理
 * ════════════════════════════════════════ */

/** 组织节点类型：公司 / 部门 / 团队 */
export type OrgNodeType = 'company' | 'department' | 'team';

/** 组织架构节点 */
export interface OrgNode {
  id: string;
  /** 节点类型 */
  type: OrgNodeType;
  /** 名称 */
  name: string;
  /** 父节点 ID（公司层为空） */
  parentId: string | null;
  /** 负责人姓名 */
  leader?: string;
  /** 排序号 */
  sort: number;
  /** 状态 */
  status: 'active' | 'inactive';
  /** 备注 */
  remark?: string;
}

/** 员工状态 */
export type EmployeeStatus = 'active' | 'inactive' | 'probation';

/** 学习经历阶段 */
export type EducationStage = 'high_school' | 'college' | 'university';

/** 学习经历条目 */
export interface EducationRecord {
  /** 阶段：高中 / 大专 / 大学 */
  stage: EducationStage;
  /** 学校 */
  school: string;
  /** 学院 */
  college: string;
  /** 专业 */
  major: string;
}

/** 员工结算信息 */
export interface EmployeeSettlement {
  /** 卡号 */
  accountNo: string;
  /** 户名 */
  accountName: string;
  /** 开户银行 */
  bankName: string;
  /** 开户行号 */
  bankNo: string;
}

/** 合同文件 */
export interface ContractFile {
  /** 文件名 */
  name: string;
  /** 文件 URL（ObjectURL 或外链） */
  url: string;
  /** 上传时间 */
  uploadedAt: string;
}

/** 员工 */
export interface Employee {
  id: string;
  /** 工号 */
  empNo: string;
  /** 姓名 */
  name: string;
  /** 性别 */
  gender: 'male' | 'female';
  /** 手机号 */
  phone: string;
  /** 邮箱 */
  email?: string;
  /** 部门 ID */
  departmentId: string;
  /** 团队 ID（可选） */
  teamId?: string;
  /** 职位 */
  position: string;
  /** 入职日期 */
  joinDate: string;
  /** 状态 */
  status: EmployeeStatus;
  /** 备注 */
  remark?: string;

  /* ── 身份证信息 ── */
  /** 身份证号 */
  idCardNo?: string;
  /** 身份证图片（正面/反面，ObjectURL 或外链） */
  idCardImages?: string[];
  /** 身份证住址 */
  idCardAddress?: string;
  /** 民族 */
  ethnicity?: string;
  /** 籍贯 */
  nativePlace?: string;
  /** 出生日期 */
  birthDate?: string;

  /* ── 个人信息 ── */
  /** 兴趣爱好 */
  hobbies?: string;
  /** 身高（cm） */
  height?: number;
  /** 体重（kg） */
  weight?: number;
  /** 本地住址 */
  localAddress?: string;

  /* ── 学历信息 ── */
  /** 学历 */
  education?: string;
  /** 学位 */
  degree?: string;
  /** 学习经历（高中/大专/大学可多选） */
  educationRecords?: EducationRecord[];

  /* ── 结算信息 ── */
  /** 结算信息 */
  settlement?: EmployeeSettlement;

  /* ── 合同文件 ── */
  /** 合同文件列表（PDF，最多5个） */
  contracts?: ContractFile[];

  /* ── 紧急联系人 ── */
  /** 紧急联系人姓名 */
  emergencyContactName?: string;
  /** 紧急联系人电话 */
  emergencyContactPhone?: string;
}

/** 订单销售场景（6种情况） */
export type SalesScenario = 1 | 2 | 3 | 4 | 5 | 6;

/** 员工绩效统计（绩效金额 + 绩效利润） */
export interface EmployeePerformance {
  employeeId: string;
  employeeName: string;
  departmentName: string;
  position: string;
  /** 绩效金额 - 作为跟单人的销售金额 */
  followerAmount: number;
  /** 绩效金额 - 作为主办人的销售金额 */
  hostAmount: number;
  /** 绩效金额总额 */
  totalAmount: number;
  /** 绩效利润 - 作为跟单人的利润金额 */
  followerProfit: number;
  /** 绩效利润 - 作为主办人的利润金额 */
  hostProfit: number;
  /** 绩效利润总额 */
  totalProfit: number;
  /** 关联订单数 */
  orderCount: number;
}

/* ─────────────────────────── 合作商终端（合作商后台） ─────────────────────────── */

/** 合作商订单配送方式：direct=直送订单 / warehouse=入库订单 */
export type PartnerDeliveryMode = 'direct' | 'warehouse';

/** 合作商合作模式：supplier=供应商模式 / service=服务商模式 */
export type PartnerCoopMode = 'supplier' | 'service';

/** 合作商订单状态 */
export type PartnerOrderStatus = 'pending' | 'accepted' | 'shipping' | 'transit' | 'confirmed' | 'rejected' | 'cancelled';

/** 销售单开票状态（销售单/履约单维度：未开票 / 部分开票 / 已开票；与财务发票枚举 InvoiceStatus 区分） */
export type SalesInvoiceStatus = 'uninvoiced' | 'partial' | 'invoiced';

/** 合作商订单 */
export interface PartnerOrder {
  id: string;
  /** 订单编号 */
  code: string;
  /** 销售路径:direct=直接销售 / via_platform=经平台销售 */
  salesPath?: 'direct' | 'via_platform';
  /** 经平台销售时的中间平台简称 */
  platformCustomerName?: string;
  customerName: string;
  customerType: string;
  /** 收件地区（省+市，如"江苏南京"） */
  customerRegion?: string;
  items: { productName: string; spec: string; quantity: number; price: number }[];
  /** 订单总金额 */
  totalAmount: number;
  /** 配送方式：直送 / 入库 */
  deliveryMode: PartnerDeliveryMode;
  /** 合作模式：供应商模式 / 服务商模式 */
  coopMode: PartnerCoopMode;
  status: PartnerOrderStatus;
  /** 结算状态派生标记（底层履约单发货单全部已结算时为 true；终端「已结算」TAB 过滤用） */
  settled?: boolean;
  orderDate: string;
  expectedShipDate: string;
  receiver: string;
  receiverPhone: string;
  receiverAddress: string;
  remark?: string;
  /** 报备转入来源（报备编号），由平台报备规则自动转入的订单才有 */
  sourceReport?: string;
  /** 报备转入类型：order-self=自营订单报备 / order-opportunity=商机订单报备（平台履约）/ product=商品报备 / customer=客户报备 / assign=指定分发 / compare=比单中单 */
  transferKind?: 'order-self' | 'order-opportunity' | 'product' | 'region' | 'assign' | 'compare';
  /** 比单订单：我是否已报名（待接单展示「待接单-比单中」） */
  compareSigned?: boolean;
  /** 比单报名截止时间戳（毫秒，仅进行中比单） */
  compareDeadline?: number;
  /** 比单底价说明 */
  compareFloorNote?: string;
  /** 比单当前报名家数 */
  compareQuoteCount?: number;
  /** 比单我的报价（已报名时） */
  compareMyQuote?: number;
}

/** 合作商报备类型：order=订单报备 / product=商品报备 / customer=客户报备 */
export type PartnerReportType = 'order' | 'product' | 'region';

/**
 * 订单报备货源：self=有货源（合作商自己供货，订单转合作商履约）/
 * no_supply=无货源（淡茶半盏自营或转派供货商：可指定、可比单，订单回平台分发）
 */
export type PartnerOrderReportKind = 'self' | 'no_supply';

/** 合作商报备状态 */
export type PartnerReportStatus = 'pending' | 'approved' | 'rejected';

/** 合作商报备记录 */
export interface PartnerReport {
  id: string;
  code: string;
  type: PartnerReportType;
  title: string;
  summary: string;
  /** 预计金额（订单报备） */
  amount?: number;
  status: PartnerReportStatus;
  submitTime: string;
  reviewNote?: string;
  /** 发起报备的合作商名称 */
  partnerName: string;
  /** 审批时间（管理台审批后） */
  reviewTime?: string;
  /** 报备客户（三类报备均先选客户；"全部客户" 表示不限） */
  customerName?: string;
  /** 订单报备货源：self=有货源 / no_supply=无货源 */
  orderKind?: PartnerOrderReportKind;
  /** 订单报备：预计下单日期 */
  expectOrderDate?: string;
  /** 订单报备：下单\收件人 */
  contactName?: string;
  /** 订单报备：下单\收件电话（匹配订单收件电话） */
  contactPhone?: string;
  /** 报备商品（多选）：订单报备非必输（辅助匹配）；商品报备必选（限合作商经营品牌） */
  productNames?: string[];
  /** 订单报备：内部 SKU（非必输） */
  sku?: string;
  /** 订单报备：内部下单编号（非必输） */
  internalOrderNo?: string;
  /**
   * 报备地区（路径数组）：'全国' | '省' | '省/市' | '省/市/县'；
   * 订单报备为单地区（数组仅一条），商品/地区报备支持复选多条
   */
  regions?: string[];
  /** 有效日期（含当日；超过该日期的报备失效，不再参与匹配） */
  validUntil?: string;
}

/** 平台待分发订单（管理台创建，可被报备规则匹配后自动转入合作商名下） */
export interface PlatformOrder {
  id: string;
  code: string;
  customerName: string;
  customerType: string;
  /** 客户所在区域（如"江苏南京"） */
  customerRegion: string;
  items: { productName: string; spec: string; quantity: number; price: number }[];
  totalAmount: number;
  deliveryMode: PartnerDeliveryMode;
  coopMode: PartnerCoopMode;
  orderDate: string;
  expectedShipDate: string;
  receiver: string;
  receiverPhone: string;
  receiverAddress: string;
  remark?: string;
}

/** 合作商合作客户 */
export interface PartnerCustomer {
  id: string;
  name: string;
  type: string;
  region: string;
  contactPerson: string;
  contactPhone: string;
  /** 可下单商品（合作商据此营销） */
  products: { productId: string; productName: string; spec: string; supplyPrice: number; marketPrice: number }[];
  cooperationDate: string;
  status: 'cooperating' | 'paused';
  totalOrders: number;
  totalAmount: number;
}

/** 合作商结算单（发货订单结算） */
export interface PartnerSettlement {
  id: string;
  code: string;
  /** 结算周期 */
  period: string;
  orderCount: number;
  orderAmount: number;
  /** 扣除费用（平台服务费/佣金） */
  deduction: number;
  /** 应结金额 */
  settleAmount: number;
  method: string;
  status: 'unsettled' | 'pending' | 'settled';
  createTime: string;
  settleTime?: string;
  /** 关联订单编号 */
  orders: string[];
}

/** 合作商后台子账号 */
export interface PartnerAccount {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'business' | 'warehouse';
  phone: string;
  status: 'active' | 'disabled';
  createTime: string;
  lastLogin?: string;
}

/* ═══════════════════════════════════════════════════════════════
 * 客户终端（直营客户下单终端）
 * ═══════════════════════════════════════════════════════════════ */

/** 客户终端订单状态 */
export type CustomerOrderStatus =
  | 'pending'    // 待确认（客户刚下单）
  | 'confirmed'  // 已确认（管理台已确认）
  | 'shipping'   // 配送中
  | 'delivered'  // 已送达（待客户确认收货）
  | 'completed'  // 已完成（客户已确认收货）
  | 'cancelled'; // 已取消

/** 客户终端下单账号（管理台开通，客户终端登录使用，关联直营客户） */
export interface CustomerAccount {
  id: string;
  /** 登录账号 */
  username: string;
  /** 登录密码（演示环境明文存储） */
  password: string;
  /** 账号名称 */
  name: string;
  /** 关联直营客户名称 */
  customerName: string;
  /** 关联客户编号 */
  customerCode: string;
  /** 联系手机 */
  phone: string;
  status: 'active' | 'disabled';
  /** 开通时间 */
  createTime: string;
  /** 最近登录 */
  lastLogin?: string;
  /** 开通备注 */
  remark?: string;
}

/** 客户终端订单商品明细 */
export interface CustomerOrderItem {
  productId: string;
  productName: string;
  spec: string;
  quantity: number;
  /** 成交单价（下单时的销售价） */
  price: number;
}

/** 客户终端订单（客户在终端自助下单产生） */
export interface CustomerOrder {
  id: string;
  /** 订单编号（KHD + 日期 + 3 位序号） */
  code: string;
  /** 下单客户名称 */
  customerName: string;
  items: CustomerOrderItem[];
  /** 订单总金额 */
  totalAmount: number;
  status: CustomerOrderStatus;
  /** 下单日期 */
  orderDate: string;
  receiver: string;
  receiverPhone: string;
  receiverAddress: string;
  /** 买家备注 */
  remark?: string;
  /** 卖家回复（管理台确认/驳回时的说明） */
  sellerNote?: string;
}

/** 购物车条目（客户终端，会话内共享） */
export interface CartItem {
  productId: string;
  productName: string;
  spec: string;
  price: number;
  quantity: number;
}

/* ════════════════════════════════════════
 * 外部平台订单分流（订单流转中心）
 * ════════════════════════════════════════ */

/** 外部订单来源平台 */
export type ExternalPlatform = 'tmall' | 'jd' | 'douyin' | 'pdd' | 'other';

/** 分发方式：指定 / 比单（综合评分） */
export type DistributeMode = 'assign' | 'compare';

/**
 * 分发状态（状态机 · 只表达分发过程，不含物流/结算）
 * unprocessed 未分发（销售单已录入/推送，尚未送分发，未生成履约单）
 * pending 待分发（已送分发，手工录入/直连推送生成的履约单，流转弹窗选路径）
 *   ├ 自营：self_pending 自营待接单（可退回 pending，来源标注自营退回）
 *   ├ 比单：comparing 分发比单中 → 定标后 distribute_pending
 *   └ 分发：指定 / 报备（人工匹配后直接转出）→ distribute_pending 转派待接单
 * 报备匹配为纯人工动作：管理员手动选择报备记录确认后直接转出报备合作商，无中间待确认状态。
 * 履约状态进入已接单及后续 → 本状态自动置 processed 分发已完成；cancelled 已取消贯穿（分发/履约状态均变为已取消）。
 */
export type ExternalProcessStatus =
  | 'unprocessed'
  | 'pending'
  | 'self_pending'
  | 'comparing'
  | 'distribute_pending'
  | 'processed'
  | 'cancelled';

/** 外部订单来源渠道：手工录入 / 平台直连推送 */
export type ExternalChannel = 'manual' | 'push';

/**
 * 履约状态（分发进入具体履约主体[自营/合作商]后的状态，自营与合作商统一口径）
 * 待接单 → 已接单 → 运输中 / 妥投（已发货档，依物流信息）→ 已确收（客户确认收货，管理后台手工/联机操作）
 * cancelled 已取消贯穿：订单取消后履约状态同步变为已取消。
 */
export type FulfillmentStage =
  | 'pending_accept'
  | 'accepted'
  | 'shipping'
  | 'transit'
  | 'confirmed'
  | 'cancelled';

/** 销售履约时间线（销售履约单五节点时间） */
export interface FulfillmentTimeline {
  /** 当前履约状态 */
  stage: FulfillmentStage;
  /** 来单时间（分发到自营 / 合作商的时间） */
  arriveTime?: string;
  /** 接单时间 */
  acceptTime?: string;
  /** 发货时间 */
  shipTime?: string;
  /** 妥投时间 */
  deliverTime?: string;
  /** 确收时间 */
  confirmTime?: string;
}

/** 转出来源：报备命中 / 指定 / 比单 */
export type TransferSource = 'report' | DistributeMode;

/** 报备命中信息（录入时自动匹配审批通过的报备） */
export interface ReportMatchInfo {
  reportCode: string;
  reportType: PartnerReportType;
  partnerId?: string;
  partnerName: string;
}

/** 外部订单商品行 */
export interface ExternalOrderItem {
  productId: string;
  productName: string;
  spec: string;
  quantity: number;
  price: number;
}

/** 自营发货包裹商品行 */
export interface SelfShipmentItem {
  productId: string;
  productName: string;
  qty: number;
}

/**
 * 自营发货包裹（采购&发货 / 到货出库生成）
 * 一个仓库一次发运一个包裹、一个快递单号；状态由系统跟踪物流推进（shipped 运输中 → delivered 妥投 → confirmed 已确收）。
 */
export interface SelfShipment {
  id: string;
  packageNo: string;
  /** 发货仓库（分仓发货；到货出库时为入库仓） */
  warehouseId: string;
  warehouseName: string;
  logisticsCompany: string;
  trackingNo: string;
  items: SelfShipmentItem[];
  status: 'shipped' | 'delivered' | 'confirmed';
  shippedAt: string;
  deliveredAt?: string;
  confirmedAt?: string;
  /** 结算标记（按发货单结算） */
  settled?: boolean;
}

/** 自营以销定采信息（采购&发货时固化；seedDocs 由此派生采购单） */
export interface SelfPurchase {
  supplierId: string;
  supplierName: string;
  /** direct 直发客户（供应商直发）/ warehouse 入库制（到货入库后再出库） */
  mode: 'direct' | 'warehouse';
  purchaseDate: string;
}

/** 比单报名（合作商在规定时间内报名，报价默认带出系统报价） */
export interface CompareQuote {
  supplierId: string;
  supplierName: string;
  amount: number;
  quoteTime: string;
  /** 按商品报名：本次报价覆盖的商品名称（缺省视为整单） */
  items?: string[];
}

/** 比单评分明细（报价分 + 积分分） */
export interface CompareScoreBreakdown {
  quoteScore: number;
  scoreScore: number;
  total: number;
}

/** 比单底价规则：折扣（订单金额的百分比）/ 具体价格（元），报名报价不得低于底价 */
export interface CompareFloorRule {
  type: 'discount' | 'price';
  /** type=discount 时为折扣百分比（如 85 = 订单金额 85 折）；type=price 时为整单最低价（元） */
  value: number;
}

/**
 * 比单会话（公开报名制：全部合作商可在期限内报名，报价带出系统报价可调但不低于底价，
 * 截止后按「报价 + 积分」评分排名定标，也支持管理台直接选定合作商）
 */
export interface CompareSession {
  deadline: number;
  /** 底价规则（发起时设定） */
  floorRule: CompareFloorRule;
  /** 底价说明（弹窗/列表展示） */
  floorNote: string;
  quotes: CompareQuote[];
  scored: boolean;
  scores?: Record<string, CompareScoreBreakdown>;
  winnerId?: string;
  /** 定标结果：商品名称 → 中单合作商名称（按商品维度按积分排序定标） */
  itemAwards?: Record<string, string>;
  /** 报名合作商地区范围（可选，限定省市县内合作商可见可报名） */
  region?: RegionScope;
  /** 参与比单的合作商类型（仅服务商 / 供应商，不含品牌商；缺省=两者） */
  partnerTypes?: SupplierType[];
  /** 参与比单的合作模式（差价 / 扣点；缺省=不限） */
  coopMode?: PartnerCoopMode;
}

/** 地区范围（省/市/县三级，均可选；用于比单限定合作商地区） */
export interface RegionScope {
  province?: string;
  city?: string;
  district?: string;
}

/** 判断合作商是否落在地区范围内（注册地优先，联系地兜底；未设置范围或合作商缺失则全部通过） */
export function partnerInRegion(
  supplier: { registeredProvince?: string; registeredCity?: string; registeredDistrict?: string; contactProvince?: string; contactCity?: string; contactDistrict?: string } | undefined,
  scope?: RegionScope,
): boolean {
  if (!scope || (!scope.province && !scope.city && !scope.district)) return true;
  if (!supplier) return false;
  return (
    (!scope.province || supplier.registeredProvince === scope.province || supplier.contactProvince === scope.province) &&
    (!scope.city || supplier.registeredCity === scope.city || supplier.contactCity === scope.city) &&
    (!scope.district || supplier.registeredDistrict === scope.district || supplier.contactDistrict === scope.district)
  );
}

/** 外部订单（运营手工录入，分流处理） */
export interface ExternalOrder {
  id: string;
  /** 订单编号（WB + 日期 + 3 位序号） */
  code: string;
  /** 销售路径:direct=直接销售(路径1-4:直营/渠道/平台/个人客户) / via_platform=经平台销售(路径5:淡茶→平台客户→直营客户) */
  salesPath?: 'direct' | 'via_platform';
  /** 来源平台(经平台销售时必选;直接销售一般为空,直连推送订单为其所属平台渠道) */
  platform?: ExternalPlatform;
  /** 客户下单时间(客户在平台/渠道侧下单的时间) */
  customerOrderTime?: string;
  /** 客户侧订单号(客户在自己下单渠道的订单号,非必输) */
  customerOrderNo?: string;
  /** 平台客户(经平台销售时的采购买方,即路径5的中间平台) */
  platformCustomerId?: string;
  platformCustomerName?: string;
  /** 平台母销售单号 */
  externalOrderNo?: string;
  customerName: string;
  customerType: string;
  customerRegion: string;
  items: ExternalOrderItem[];
  totalAmount: number;
  receiver: string;
  receiverPhone: string;
  receiverAddress: string;
  remark?: string;
  entryTime: string;
  operator: string;
  /** 来源渠道：manual=手工录入 / push=平台直连推送 */
  sourceChannel: ExternalChannel;
  processStatus: ExternalProcessStatus;
  /**
   * 处理阶段（销售单维度）：
   * unprocessed = 尚未送分发，未生成履约单（销售单处理页）；
   * dispatched = 已送去分发，已生成履约单（母销售单保留）；
   * 旧数据无此字段，按「未拆分的母销售单即履约单」兼容。
   */
  dispatchState?: 'unprocessed' | 'dispatched';
  /** 本单与合作商的合作模式（订单维度选择，非合作商档案属性；差价模式 / 扣点模式） */
  coopMode?: PartnerCoopMode;
  /** 来源附加标签：比单未成（分拆后未成交商品形成的子订单）/ 自营退回 / 待接单取回（按原分发来源） */
  sourceTag?:
    | 'compare_failed'
    | 'self_returned'
    | 'self_takeback'
    | 'assign_takeback'
    | 'report_takeback'
    | 'compare_takeback';
  /** 母销售单编号（拆单生成的子订单指向母销售单；详情页按母子 Tab 展示） */
  parentCode?: string;
  /** 报备命中列表（命中即自动转出，列表用于展示「报备分发」来源） */
  reportMatches?: ReportMatchInfo[];
  path?: 'self' | 'distribute';
  distributeMode?: DistributeMode;
  partnerId?: string;
  partnerName?: string;
  transferSource?: TransferSource;
  transferTime?: string;
  /** 转出后履约状态（合作商订单链） */
  partnerStatus?: PartnerOrderStatus;
  /** 结算是否按时（超时扣积分；纯质量标记，不承担"是否已结算"语义） */
  settleOnTime?: boolean;
  /** 订单级结算标记（P6：全部已妥投发货单结算 / 无发货单订单级结算后置位） */
  settled?: boolean;
  /** 开票状态：未开票（缺省）/ 部分开票 / 已开票（前置条件：已确收） */
  invoiceStatus?: SalesInvoiceStatus;
  /** 自营以销定采信息（采购&发货时固化，缺口的采购去向） */
  selfPo?: SelfPurchase;
  /** 自营发货包裹（分仓发货 / 到货出库生成，按物流单号跟踪妥投） */
  selfShipments?: SelfShipment[];
  /** 销售履约时间线（分发后建立，记录五节点时间：来单/接单/发货/妥投/确收） */
  fulfillment?: FulfillmentTimeline;
  compare?: CompareSession;
  /** 处理轨迹 */
  history: { time: string; action: string; detail?: string }[];
}

/** 订单流转设置 */
export interface FlowSettings {
  /** 比单报名时长（分钟） */
  compareMinutes: number;
  /** 比单评分权重（报价 / 积分） */
  compareWeights: { quote: number; score: number };
}

/* ════════════════════════════════════════
 * 合作商积分体系
 * ════════════════════════════════════════ */

/** 积分维度：基础(派生) / 经营(派生+台账) / 报备(派生+台账) / 推介(派生) / 营销(台账申报) / 处罚(台账) */
export type ScoreDimension = 'basic' | 'operation' | 'report' | 'referral' | 'marketing' | 'penalty';

/** 积分台账流水 */
export interface PartnerScoreEntry {
  id: string;
  supplierId: string;
  supplierName: string;
  dimension: ScoreDimension;
  /** 加分为正、扣分为负 */
  delta: number;
  reason: string;
  time: string;
  /** 关联订单 / 报备 / 推介编号 */
  refCode?: string;
  operator?: string;
}

/** 积分档位（期初分 + 履约率，比单评分用） */
export interface PartnerScoreBase {
  /** 期初分（历史累计快照） */
  base: number;
  /** 履约率（0-100，按期发货占比） */
  ontimeRate: number;
}

/** 积分汇总（六维明细 + 总分） */
export interface PartnerScoreSummary {
  supplierId: string;
  supplierName: string;
  /** 基础积分（注册/门店/主营品牌/报价商品，派生） */
  basic: number;
  /** 经营积分（结算单量 + 结算金额，派生） */
  operation: number;
  /** 报备积分（订单报备/转单接单/报备经营金额，派生） */
  report: number;
  /** 推介积分（茶培训 +0.1 / 茶活动 +0.5，派生） */
  referral: number;
  /** 申报积分（合作商主动申报评估给分，台账） */
  marketing: number;
  /** 处罚扣分（人工台账 + 发货延迟自动扣分，负值） */
  penalty: number;
  total: number;
  ontimeRate: number;
  /** 其中：发货延迟自动扣分（接单后第 4 天起每延迟 1 天扣 0.1，含于 penalty） */
  lateShipDeduction?: number;
}

/** 积分申报类型：客户拜访 / 活动组织 / 其他（入驻推介积分由「业务推介」入驻淡茶推介成功自动计入，不在申报类型中） */
export type MarketingClaimType = 'visit' | 'event' | 'other';

/** 积分申报（合作商主动发起，如客户线下拜访等活动，平台评估给分） */
export interface MarketingClaim {
  id: string;
  /** 申报编号（SB-0001 顺序生成） */
  code: string;
  supplierId: string;
  supplierName: string;
  /** 申报类型 */
  claimType: MarketingClaimType;
  /** 事项标题（如 客户线下拜访） */
  title: string;
  /** 事项描述 */
  description: string;
  /** 凭证图片（data URL，最多 5 张，非必输） */
  images?: string[];
  status: 'pending' | 'approved' | 'rejected';
  /** 评估给分（通过时） */
  score?: number;
  submitTime: string;
  reviewTime?: string;
  reviewer?: string;
  reviewNote?: string;
}

/* ═══════════════════════════════════════════════════════════
 * 采购订单实体（三单分离：SO 子单 → PO → 包裹）
 * 转派子单 1:1 自动生成直送 PO（Drop-Shipping，合作商直发客户）；
 * 自营子单经供应方案生成 0..N 张入库制 PO。
 * 包裹为物流信息唯一挂载点，三键关联 PO + 子单 + 母单。
 * ═══════════════════════════════════════════════════════════ */

/** PO 来源：转派自动 / 自营自动 / 手工 */
export type PurchaseDocSource = 'distribute' | 'self' | 'manual';

/** 配送方式：direct=直送客户（免入库）/ warehouse=入库制（到货入库再出库） */
export type PurchaseDeliveryMode = 'direct' | 'warehouse';

/** PO 状态：待确认（合作商接单）→ 已确认 → 部分发货 → 全部发货 → 已签收 → 已结算 */
export type PurchaseDocStatus = 'pending' | 'confirmed' | 'partial_shipped' | 'fully_shipped' | 'received' | 'delivered' | 'settled';

/** PO 商品行（行级已发数量支持同一商品分 N 批发货） */
export interface PurchaseDocItem {
  productId: string;
  productName: string;
  spec: string;
  quantity: number;
  /** 累计已发数量（发货登记累加，包裹作废回退） */
  shippedQty: number;
  /** 采购口径单价 */
  price: number;
}

/** 包裹 / 发货单（每次发货登记生成一条；物流信息唯一挂载点） */
export interface ShipmentPackage {
  id: string;
  packageNo: string;
  logisticsCompany: string;
  trackingNo: string;
  shippedAt: string;
  /** 本包裹发货商品与数量 */
  items: { productId: string; productName: string; qty: number }[];
  /** shipped=运输中 / delivered=妥投 / confirmed=已确收 / void=已作废（回退已发数量） */
  status: 'shipped' | 'delivered' | 'confirmed' | 'void';
  /** 结算标记（按发货单结算：部分发货单已结算 → 履约单部分结算） */
  settled?: boolean;
  operator?: string;
}

/** 自营子单供应方案行（ATP 净需求：库存直发 or 采购，行级多源供应商） */
export interface SupplyPlanLine {
  productId: string;
  productName: string;
  spec: string;
  orderQty: number;
  /** 可用库存（现存量） */
  stockQty: number;
  /** 净需求 = 订单数量 − 库存直发数量 */
  netQty: number;
  /** 库存直发数量（0 ~ min(orderQty, stockQty)） */
  stockUseQty: number;
  /** 采购数量 = orderQty − stockUseQty */
  purchaseQty: number;
  supplierId?: string;
  supplierName?: string;
}

/** 采购订单 */
export interface PurchaseDoc {
  id: string;
  code: string;
  source: PurchaseDocSource;
  deliveryMode: PurchaseDeliveryMode;
  /** 关联子销售订单 */
  childOrderId: string;
  childOrderCode: string;
  /** 关联母销售订单 */
  motherCode: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseDocItem[];
  /** 采购口径金额 */
  amount: number;
  status: PurchaseDocStatus;
  createTime: string;
  packages: ShipmentPackage[];
  remark?: string;
}

export const PURCHASE_DOC_STATUS_LABELS: Record<PurchaseDocStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  partial_shipped: '部分发货',
  fully_shipped: '全部发货',
  received: '已入库',
  delivered: '已签收',
  settled: '已结算',
};

export const PURCHASE_DOC_STATUS_TONES: Record<PurchaseDocStatus, { bg: string; color: string }> = {
  pending: { bg: '#FBF3E2', color: '#9A7A1C' },
  confirmed: { bg: '#EDF3FB', color: '#1D64B0' },
  partial_shipped: { bg: '#F3EFFA', color: '#7A5BA6' },
  fully_shipped: { bg: '#E0F2F1', color: '#00695C' },
  received: { bg: '#E8EAF6', color: '#3949AB' },
  delivered: { bg: '#E9F4EF', color: '#01795D' },
  settled: { bg: '#F0F2F0', color: '#67716B' },
};
