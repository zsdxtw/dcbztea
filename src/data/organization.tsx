/**
 * 组织架构 & 员工管理 数据源
 */
import type { OrgNode, Employee, EmployeePerformance, SalesScenario, PersonRoleType } from '../types';
import { customerItems } from './customers';
import { platformItems } from './platforms';
import { teaProfessionals } from './teaProfessionals';

/* ── 组织架构：公司 → 部门 → 团队 ── */

export const orgNodes: OrgNode[] = [
  // 公司层
  { id: 'org-0', type: 'company', name: '淡茶半盏茶业有限公司', parentId: null, leader: '陈总', sort: 0, status: 'active' },

  // 部门层（初始化四大部门）
  { id: 'dept-1', type: 'department', name: '运营与产品部', parentId: 'org-0', leader: '林雨桐', sort: 1, status: 'active', remark: '负责产品运营与供应链管理' },
  { id: 'dept-2', type: 'department', name: '市场部', parentId: 'org-0', leader: '陈思远', sort: 2, status: 'active', remark: '负责市场推广与品牌建设' },
  { id: 'dept-3', type: 'department', name: '门店管理部', parentId: 'org-0', leader: '张雅琴', sort: 3, status: 'active', remark: '负责线下门店运营管理' },
  { id: 'dept-4', type: 'department', name: '直播与经纪部', parentId: 'org-0', leader: '吴晓燕', sort: 4, status: 'active', remark: '负责直播带货与茶人经纪' },

  // 团队层
  { id: 'team-1', type: 'team', name: '产品策划组', parentId: 'dept-1', leader: '刘明辉', sort: 1, status: 'active' },
  { id: 'team-2', type: 'team', name: '供应链组', parentId: 'dept-1', leader: '孙浩然', sort: 2, status: 'active' },
  { id: 'team-3', type: 'team', name: '品牌推广组', parentId: 'dept-2', leader: '赵雪梅', sort: 1, status: 'active' },
  { id: 'team-4', type: 'team', name: '客户拓展组', parentId: 'dept-2', leader: '周丽华', sort: 2, status: 'active' },
  { id: 'team-5', type: 'team', name: '华东门店组', parentId: 'dept-3', leader: '黄志强', sort: 1, status: 'active' },
  { id: 'team-6', type: 'team', name: '华南门店组', parentId: 'dept-3', leader: '王建国', sort: 2, status: 'active' },
  { id: 'team-7', type: 'team', name: '直播运营组', parentId: 'dept-4', leader: '吴晓燕', sort: 1, status: 'active' },
  { id: 'team-8', type: 'team', name: '茶人经纪组', parentId: 'dept-4', leader: '林雨桐', sort: 2, status: 'active' },
];

/* ── 员工数据 ── */

export const employees: Employee[] = [
  {
    id: 'emp-1', empNo: 'DC001', name: '林雨桐', gender: 'female', phone: '138****5678', email: 'linyt@danchaban.com',
    departmentId: 'dept-1', teamId: 'team-1', position: '产品总监', joinDate: '2022-03-15', status: 'active', remark: '运营与产品部负责人',
    idCardNo: '330106199003152345', idCardImages: [], idCardAddress: '浙江省杭州市西湖区文三路 88 号 2 幢 301 室',
    ethnicity: '汉族', nativePlace: '浙江杭州', birthDate: '1990-03-15',
    hobbies: '茶道、书法、瑜伽', height: 165, weight: 52, localAddress: '杭州市西湖区文一西路 176 号',
    education: '本科', degree: '管理学学士',
    educationRecords: [
      { stage: 'high_school', school: '杭州第二中学', college: '', major: '' },
      { stage: 'university', school: '浙江大学', college: '管理学院', major: '工商管理' },
    ],
    settlement: { accountNo: '6228480123456789012', accountName: '林雨桐', bankName: '中国农业银行杭州西湖支行', bankNo: '103331000123' },
    contracts: [],
    emergencyContactName: '林父', emergencyContactPhone: '139****0001',
  },
  {
    id: 'emp-2', empNo: 'DC002', name: '刘明辉', gender: 'male', phone: '135****3456', email: 'liumh@danchaban.com',
    departmentId: 'dept-1', teamId: 'team-1', position: '产品经理', joinDate: '2022-06-01', status: 'active',
    idCardNo: '330106198811200617', idCardImages: [], idCardAddress: '浙江省杭州市拱墅区莫干山路 200 号',
    ethnicity: '汉族', nativePlace: '浙江温州', birthDate: '1988-11-20',
    hobbies: '篮球、摄影', height: 178, weight: 72, localAddress: '杭州市拱墅区莫干山路 200 号',
    education: '本科', degree: '工学学士',
    educationRecords: [
      { stage: 'high_school', school: '温州中学', college: '', major: '' },
      { stage: 'university', school: '浙江工业大学', college: '计算机学院', major: '软件工程' },
    ],
    settlement: { accountNo: '6228480123456789023', accountName: '刘明辉', bankName: '中国工商银行杭州分行', bankNo: '102331000234' },
    contracts: [],
    emergencyContactName: '刘母', emergencyContactPhone: '137****0002',
  },
  {
    id: 'emp-3', empNo: 'DC003', name: '孙浩然', gender: 'male', phone: '131****2345', email: 'sunhr@danchaban.com',
    departmentId: 'dept-1', teamId: 'team-2', position: '供应链主管', joinDate: '2022-04-20', status: 'active',
    idCardNo: '330106199205108914', idCardImages: [], idCardAddress: '浙江省宁波市鄞州区钟公庙街道 18 号',
    ethnicity: '汉族', nativePlace: '浙江宁波', birthDate: '1992-05-10',
    hobbies: '登山、骑行', height: 175, weight: 68, localAddress: '宁波市鄞州区钟公庙路 18 号',
    education: '本科', degree: '管理学学士',
    educationRecords: [
      { stage: 'high_school', school: '宁波效实中学', college: '', major: '' },
      { stage: 'university', school: '宁波大学', college: '商学院', major: '物流管理' },
    ],
    settlement: { accountNo: '6228480123456789034', accountName: '孙浩然', bankName: '中国建设银行宁波分行', bankNo: '105333000345' },
    contracts: [],
    emergencyContactName: '孙父', emergencyContactPhone: '136****0003',
  },
  {
    id: 'emp-4', empNo: 'DC004', name: '陈思远', gender: 'male', phone: '139****1234', email: 'chensy@danchaban.com',
    departmentId: 'dept-2', teamId: 'team-3', position: '市场总监', joinDate: '2022-02-10', status: 'active', remark: '市场部负责人',
    idCardNo: '330106198607251234', idCardImages: [], idCardAddress: '上海市浦东新区张江路 100 号',
    ethnicity: '汉族', nativePlace: '上海', birthDate: '1986-07-25',
    hobbies: '高尔夫、阅读', height: 180, weight: 78, localAddress: '上海市浦东新区张江路 100 号',
    education: '硕士', degree: '工商管理硕士',
    educationRecords: [
      { stage: 'high_school', school: '上海中学', college: '', major: '' },
      { stage: 'university', school: '复旦大学', college: '经济学院', major: '市场营销' },
    ],
    settlement: { accountNo: '6228480123456789045', accountName: '陈思远', bankName: '招商银行上海分行', bankNo: '308290000456' },
    contracts: [],
    emergencyContactName: '陈母', emergencyContactPhone: '135****0004',
  },
  { id: 'emp-5', empNo: 'DC005', name: '赵雪梅', gender: 'female', phone: '133****7890', email: 'zhaoxm@danchaban.com', departmentId: 'dept-2', teamId: 'team-3', position: '品牌经理', joinDate: '2022-07-15', status: 'active' },
  { id: 'emp-6', empNo: 'DC006', name: '周丽华', gender: 'female', phone: '158****6789', email: 'zhoulh@danchaban.com', departmentId: 'dept-2', teamId: 'team-4', position: '客户经理', joinDate: '2022-08-01', status: 'active', remark: '负责华东区客户' },
  { id: 'emp-7', empNo: 'DC007', name: '李娜', gender: 'female', phone: '139****5678', email: 'lina@danchaban.com', departmentId: 'dept-2', teamId: 'team-4', position: '客户经理', joinDate: '2023-01-10', status: 'active', remark: '负责华南区客户' },
  { id: 'emp-8', empNo: 'DC008', name: '王强', gender: 'male', phone: '137****9012', email: 'wangqiang@danchaban.com', departmentId: 'dept-2', teamId: 'team-4', position: '跟单员', joinDate: '2023-03-20', status: 'active' },
  { id: 'emp-9', empNo: 'DC009', name: '张伟', gender: 'male', phone: '138****1234', email: 'zhangwei@danchaban.com', departmentId: 'dept-2', teamId: 'team-4', position: '跟单员', joinDate: '2023-05-15', status: 'active' },
  { id: 'emp-10', empNo: 'DC010', name: '张雅琴', gender: 'female', phone: '136****9012', email: 'zhangyq@danchaban.com', departmentId: 'dept-3', teamId: 'team-5', position: '门店总监', joinDate: '2022-03-01', status: 'active', remark: '门店管理部负责人' },
  { id: 'emp-11', empNo: 'DC011', name: '黄志强', gender: 'male', phone: '159****0123', email: 'huangzq@danchaban.com', departmentId: 'dept-3', teamId: 'team-5', position: '区域经理', joinDate: '2022-09-10', status: 'active', remark: '华东门店组负责人' },
  { id: 'emp-12', empNo: 'DC012', name: '王建国', gender: 'male', phone: '137****5678', email: 'wangjg@danchaban.com', departmentId: 'dept-3', teamId: 'team-6', position: '区域经理', joinDate: '2022-10-15', status: 'active', remark: '华南门店组负责人' },
  { id: 'emp-13', empNo: 'DC013', name: '赵敏', gender: 'female', phone: '136****3456', email: 'zhaomin@danchaban.com', departmentId: 'dept-3', teamId: 'team-6', position: '店长', joinDate: '2023-02-20', status: 'active' },
  { id: 'emp-14', empNo: 'DC014', name: '吴晓燕', gender: 'female', phone: '186****4567', email: 'wuxy@danchaban.com', departmentId: 'dept-4', teamId: 'team-7', position: '直播总监', joinDate: '2022-05-01', status: 'active', remark: '直播与经纪部负责人' },
  { id: 'emp-15', empNo: 'DC015', name: '陈刚', gender: 'male', phone: '135****7890', email: 'chengang@danchaban.com', departmentId: 'dept-4', teamId: 'team-7', position: '直播运营', joinDate: '2023-04-10', status: 'probation' },
  { id: 'emp-16', empNo: 'DC016', name: '陈志远', gender: 'male', phone: '020-8356****', email: 'chenzy@danchaban.com', departmentId: 'dept-2', teamId: 'team-4', position: '客户经理', joinDate: '2022-11-05', status: 'active', remark: '负责广州区域客户' },
  { id: 'emp-17', empNo: 'DC017', name: '刘晓东', gender: 'male', phone: '0871-6543****', email: 'liuxd@danchaban.com', departmentId: 'dept-2', teamId: 'team-4', position: '客户经理', joinDate: '2023-06-18', status: 'active', remark: '负责昆明区域客户' },
];

/* ── 已完成回款的订单数据（用于绩效统计） ── */
/* 每条记录代表一笔已回款的销售订单 */
export interface CompletedOrderForPerformance {
  orderId: string;
  orderCode: string;
  customerId: string;
  customerName: string;
  customerType: string;
  amount: number;
  actualSalesPrice: number;
  actualPurchasePrice: number;
  /** 跟单人 ID（可能为空） */
  followerId?: string;
  /** 跟单人类型 */
  followerType?: PersonRoleType;
  /** 跟单人姓名（可能为空） */
  followerName?: string;
  /** 拓客人 ID（原主办人，可能为空，从客户档案取） */
  developerId?: string;
  /** 拓客人类型 */
  developerType?: PersonRoleType;
  /** 销售场景（1-6） */
  scenario: SalesScenario;
  /** 平台扣点（仅场景2有值，如0.1表示10%） */
  platformDeductionRate?: number;
  /** 回款日期 */
  paymentDate: string;
  /** 经平台销售给直营客户时，记录直营客户 ID（仅 scenario=2 时有值） */
  directCustomerId?: string;
}

export function getOrderProfit(order: CompletedOrderForPerformance): number {
  if (order.scenario === 2) {
    // 情况2：利润 = (销售实价 × (1 - 平台扣点) - 采购实价) × 87%
    const rate = order.platformDeductionRate ?? 0;
    return (order.actualSalesPrice * (1 - rate) - order.actualPurchasePrice) * 0.87;
  }
  // 其他情况：利润 = (销售实价 - 采购实价) × 87%
  return (order.actualSalesPrice - order.actualPurchasePrice) * 0.87;
}

export const completedOrders: CompletedOrderForPerformance[] = [
  { orderId: 'SO-2025-0242', orderCode: 'SO-2025-0242', customerId: 'c1', customerName: '华茗堂茶庄', customerType: 'direct', amount: 34800, actualSalesPrice: 34800, actualPurchasePrice: 21576, followerId: 'emp-8', followerType: 'employee', followerName: '王强', scenario: 1, paymentDate: '2025-07-15' },
  { orderId: 'SO-2025-0241', orderCode: 'SO-2025-0241', customerId: 'c2', customerName: '清心茶坊', customerType: 'direct', amount: 36000, actualSalesPrice: 36000, actualPurchasePrice: 23400, followerId: 'emp-9', followerType: 'employee', followerName: '张伟', scenario: 1, paymentDate: '2025-07-14' },
  { orderId: 'SO-2025-0240', orderCode: 'SO-2025-0240', customerId: 'c3', customerName: '品茗轩', customerType: 'direct', amount: 44800, actualSalesPrice: 44800, actualPurchasePrice: 26880, followerId: 'emp-8', followerType: 'employee', followerName: '王强', scenario: 1, paymentDate: '2025-07-13' },
  { orderId: 'SO-2025-0239', orderCode: 'SO-2025-0239', customerId: 'c4', customerName: '翠竹茶行', customerType: 'direct', amount: 18000, actualSalesPrice: 18000, actualPurchasePrice: 11700, followerId: undefined, followerName: undefined, scenario: 1, paymentDate: '2025-07-12' },
  { orderId: 'SO-2025-0238', orderCode: 'SO-2025-0238', customerId: 'c5', customerName: '云顶茶舍', customerType: 'direct', amount: 17600, actualSalesPrice: 17600, actualPurchasePrice: 11440, followerId: 'emp-9', followerType: 'employee', followerName: '张伟', scenario: 1, paymentDate: '2025-07-11' },
  { orderId: 'SO-2025-0237', orderCode: 'SO-2025-0237', customerId: 'c6', customerName: '浦发银行', customerType: 'direct', amount: 42500, actualSalesPrice: 42500, actualPurchasePrice: 26350, followerId: undefined, followerName: undefined, scenario: 1, paymentDate: '2025-07-10' },
  { orderId: 'SO-2025-0236', orderCode: 'SO-2025-0236', customerId: 'c7', customerName: '交通银行', customerType: 'direct', amount: 36800, actualSalesPrice: 36800, actualPurchasePrice: 22908, followerId: 'emp-8', followerType: 'employee', followerName: '王强', scenario: 1, paymentDate: '2025-07-09' },
  { orderId: 'SO-2025-0235', orderCode: 'SO-2025-0235', customerId: 'c8', customerName: '中信证券', customerType: 'direct', amount: 53600, actualSalesPrice: 53600, actualPurchasePrice: 33768, followerId: 'emp-9', followerType: 'employee', followerName: '张伟', scenario: 1, paymentDate: '2025-07-08' },
  { orderId: 'SO-2025-0234', orderCode: 'SO-2025-0234', customerId: 'c9', customerName: '中国平安', customerType: 'direct', amount: 28500, actualSalesPrice: 28500, actualPurchasePrice: 17670, followerId: undefined, followerName: undefined, scenario: 1, paymentDate: '2025-07-07' },
  { orderId: 'SO-2025-0233', orderCode: 'SO-2025-0233', customerId: 'c10', customerName: '招商银行', customerType: 'direct', amount: 19600, actualSalesPrice: 19600, actualPurchasePrice: 12152, followerId: 'emp-8', followerType: 'employee', followerName: '王强', scenario: 1, paymentDate: '2025-07-06' },
  { orderId: 'SO-2025-0232', orderCode: 'SO-2025-0232', customerId: 'c11', customerName: '天福茗茶', customerType: 'channel', amount: 82600, actualSalesPrice: 82600, actualPurchasePrice: 49560, followerId: 'emp-9', followerType: 'employee', followerName: '张伟', scenario: 3, paymentDate: '2025-07-05' },
  { orderId: 'SO-2025-0231', orderCode: 'SO-2025-0231', customerId: 'c12', customerName: '八马茶业', customerType: 'channel', amount: 64500, actualSalesPrice: 64500, actualPurchasePrice: 40020, followerId: undefined, followerName: undefined, scenario: 3, paymentDate: '2025-07-04' },
  { orderId: 'SO-2025-0230', orderCode: 'SO-2025-0230', customerId: 'c13', customerName: '大益茶体验馆', customerType: 'channel', amount: 49800, actualSalesPrice: 49800, actualPurchasePrice: 30876, followerId: 'emp-8', followerType: 'employee', followerName: '王强', scenario: 3, paymentDate: '2025-07-03' },
  { orderId: 'SO-2025-0229', orderCode: 'SO-2025-0229', customerId: 'c14', customerName: '茶里王国', customerType: 'channel', amount: 31200, actualSalesPrice: 31200, actualPurchasePrice: 19344, followerId: 'emp-9', followerType: 'employee', followerName: '张伟', scenario: 3, paymentDate: '2025-07-02' },
  { orderId: 'SO-2025-0228', orderCode: 'SO-2025-0228', customerId: 'c1', customerName: '华茗堂茶庄', customerType: 'direct', amount: 28600, actualSalesPrice: 28600, actualPurchasePrice: 17732, followerId: undefined, followerName: undefined, scenario: 1, paymentDate: '2025-07-01' },
  { orderId: 'SO-2025-0227', orderCode: 'SO-2025-0227', customerId: 'c2', customerName: '清心茶坊', customerType: 'direct', amount: 45200, actualSalesPrice: 45200, actualPurchasePrice: 28024, followerId: 'emp-8', followerType: 'employee', followerName: '王强', scenario: 1, paymentDate: '2025-06-30' },
  { orderId: 'SO-2025-0226', orderCode: 'SO-2025-0226', customerId: 'c4', customerName: '翠竹茶行', customerType: 'direct', amount: 19800, actualSalesPrice: 19800, actualPurchasePrice: 12276, followerId: 'emp-9', followerType: 'employee', followerName: '张伟', scenario: 1, paymentDate: '2025-06-29' },
  { orderId: 'SO-2025-0225', orderCode: 'SO-2025-0225', customerId: 'c6', customerName: '浦发银行', customerType: 'direct', amount: 38500, actualSalesPrice: 38500, actualPurchasePrice: 23870, followerId: 'emp-8', followerType: 'employee', followerName: '王强', scenario: 1, paymentDate: '2025-06-28' },
  { orderId: 'SO-2025-0224', orderCode: 'SO-2025-0224', customerId: 'c8', customerName: '中信证券', customerType: 'direct', amount: 52600, actualSalesPrice: 52600, actualPurchasePrice: 32612, followerId: undefined, followerName: undefined, scenario: 1, paymentDate: '2025-06-27' },
  { orderId: 'SO-2025-0223', orderCode: 'SO-2025-0223', customerId: 'c11', customerName: '天福茗茶', customerType: 'channel', amount: 72800, actualSalesPrice: 72800, actualPurchasePrice: 43680, followerId: 'emp-9', followerType: 'employee', followerName: '张伟', scenario: 3, paymentDate: '2025-06-26' },
  // 平台客户直营订单（直接销售给平台客户）
  { orderId: 'SO-2025-0222', orderCode: 'SO-2025-0222', customerId: 'p1', customerName: '京东慧采', customerType: 'platform', amount: 62800, actualSalesPrice: 62800, actualPurchasePrice: 38936, followerId: 'emp-8', followerType: 'employee', followerName: '王强', scenario: 5, paymentDate: '2025-06-25' },
  { orderId: 'SO-2025-0221', orderCode: 'SO-2025-0221', customerId: 'p2', customerName: '史泰博', customerType: 'platform', amount: 45600, actualSalesPrice: 45600, actualPurchasePrice: 28272, followerId: undefined, followerName: undefined, scenario: 5, paymentDate: '2025-06-24' },
  // 经平台销售给直营客户的订单（绩效记在直营客户的主办人名下）
  { orderId: 'SO-2025-0220', orderCode: 'SO-2025-0220', customerId: 'p1', customerName: '京东慧采', customerType: 'platform', amount: 35200, actualSalesPrice: 35200, actualPurchasePrice: 21824, followerId: 'emp-9', followerType: 'employee', followerName: '张伟', directCustomerId: 'c6', scenario: 2, platformDeductionRate: 0.1, paymentDate: '2025-06-23' },
  { orderId: 'SO-2025-0219', orderCode: 'SO-2025-0219', customerId: 'p2', customerName: '史泰博', customerType: 'platform', amount: 28800, actualSalesPrice: 28800, actualPurchasePrice: 17856, followerId: 'emp-8', followerType: 'employee', followerName: '王强', directCustomerId: 'c7', scenario: 2, platformDeductionRate: 0.1, paymentDate: '2025-06-22' },
];

/* ── 绩效统计工具函数 ── */

function getHostId(order: CompletedOrderForPerformance): { id?: string; type?: PersonRoleType } {
  if (order.developerId) {
    return { id: order.developerId, type: order.developerType ?? 'employee' };
  }
  // 如果订单没有直接指定拓客人，则从客户档案查找
  if (order.customerType === 'platform') {
    if (order.directCustomerId) {
      const directCustomer = customerItems.find((c) => c.id === order.directCustomerId);
      return { id: directCustomer?.developerId, type: directCustomer?.developerType ?? 'employee' };
    }
    const platform = platformItems.find((p) => p.id === order.customerId);
    return { id: platform?.developerId, type: platform?.developerType ?? 'employee' };
  }
  const customer = customerItems.find((c) => c.id === order.customerId);
  return { id: customer?.developerId, type: customer?.developerType ?? 'employee' };
}

/**
 * 计算员工绩效（绩效金额 + 绩效利润）
 *
 * 【绩效金额规则】
 * - 场景2（淡茶→平台→直营）:
 *   - 主办人(无跟单人): 订单金额 × (1-平台扣点) × 90%
 *   - 主办人(有跟单人): 订单金额 × (1-平台扣点) × 50%
 *   - 跟单人: 订单金额 × (1-平台扣点) × 40%
 * - 其他5种场景:
 *   - 主办人(无跟单人): 订单金额 × 90%
 *   - 主办人(有跟单人): 订单金额 × 50%
 *   - 跟单人: 订单金额 × 40%
 *
 * 【绩效利润规则】基于 getOrderProfit（已含87%），按上述比例分配。
 */
export function calculateEmployeePerformance(): EmployeePerformance[] {
  const resultMap = new Map<string, EmployeePerformance>();

  // 初始化所有员工
  employees.forEach((emp) => {
    const dept = orgNodes.find((n) => n.id === emp.departmentId);
    resultMap.set(emp.id, {
      employeeId: emp.id,
      employeeName: emp.name,
      departmentName: dept?.name ?? '-',
      position: emp.position,
      followerAmount: 0,
      hostAmount: 0,
      totalAmount: 0,
      followerProfit: 0,
      hostProfit: 0,
      totalProfit: 0,
      orderCount: 0,
    });
  });

  // 遍历已完成回款的订单
  completedOrders.forEach((order) => {
    const followerId = order.followerId;
    const host = getHostId(order);
    const profit = getOrderProfit(order); // 订单利润（已含87%）

    // 计算绩效金额基数：场景2需扣除平台扣点
    const rate = order.platformDeductionRate ?? 0;
    const baseAmount = order.scenario === 2 ? order.amount * (1 - rate) : order.amount;

    const hasFollower = !!followerId;

    // ── 跟单人绩效（仅员工）──
    if (hasFollower && order.followerType === 'employee') {
      const perf = resultMap.get(followerId!);
      if (perf) {
        perf.followerAmount += baseAmount * 0.4;
        perf.followerProfit += profit * 0.4;
        perf.orderCount += 1;
      }
    }

    // ── 主办人绩效（仅员工）──
    if (host.id && host.type === 'employee') {
      const perf = resultMap.get(host.id);
      if (perf) {
        if (hasFollower) {
          perf.hostAmount += baseAmount * 0.5;
          perf.hostProfit += profit * 0.5;
        } else {
          perf.hostAmount += baseAmount * 0.9;
          perf.hostProfit += profit * 0.9;
        }
        perf.orderCount += 1;
      }
    }
  });

  // 计算总额，过滤掉无绩效的员工
  const results = Array.from(resultMap.values());
  results.forEach((p) => {
    p.followerAmount = Math.round(p.followerAmount);
    p.hostAmount = Math.round(p.hostAmount);
    p.totalAmount = p.followerAmount + p.hostAmount;
    p.followerProfit = Math.round(p.followerProfit);
    p.hostProfit = Math.round(p.hostProfit);
    p.totalProfit = p.followerProfit + p.hostProfit;
  });

  // 只展示有绩效的员工
  const filtered = results.filter((p) => p.totalAmount > 0);

  // 按绩效金额总额降序
  filtered.sort((a, b) => b.totalAmount - a.totalAmount);
  return filtered;
}

/* ── 辅助查询函数 ── */

/** 获取组织树结构 */
export function getOrgTree() {
  const company = orgNodes.find((n) => n.type === 'company');
  if (!company) return null;

  const departments = orgNodes
    .filter((n) => n.type === 'department' && n.parentId === company.id)
    .sort((a, b) => a.sort - b.sort);

  departments.forEach((dept) => {
    (dept as any)._teams = orgNodes
      .filter((n) => n.type === 'team' && n.parentId === dept.id)
      .sort((a, b) => a.sort - b.sort);
  });

  return { company, departments };
}

/** 获取节点下的员工 */
export function getEmployeesByNode(nodeId: string): Employee[] {
  return employees.filter(
    (e) => e.departmentId === nodeId || e.teamId === nodeId
  );
}

/** 根据 ID 获取节点名称 */
export function getOrgNodeName(id: string): string {
  return orgNodes.find((n) => n.id === id)?.name ?? '-';
}

/** 根据 ID 获取员工姓名 */
export function getEmployeeName(id: string): string {
  return employees.find((e) => e.id === id)?.name ?? '-';
}

/** 员工状态标签 */
export const EMP_STATUS_LABELS: Record<string, string> = {
  active: '在职',
  inactive: '离职',
  probation: '试用期',
};

/* ── 统一人员选择（员工 + 茶人） ── */

/** 统一人员选项 */
export interface PersonOption {
  id: string;
  name: string;
  type: PersonRoleType;
  typeLabel: string;
  phone: string;
}

const PERSON_TYPE_LABELS: Record<PersonRoleType, string> = {
  employee: '员工',
  tea_professional: '茶人',
};

/**
 * 获取所有可选人员（员工 + 茶人）
 * 用于拓客人、维护人、跟单人的下拉选择
 */
export function getAllPersonOptions(): PersonOption[] {
  const options: PersonOption[] = [];

  employees.forEach((e) => {
    if (e.status === 'active') {
      options.push({
        id: e.id,
        name: e.name,
        type: 'employee',
        typeLabel: '员工',
        phone: e.phone,
      });
    }
  });

  teaProfessionals.forEach((t) => {
    if (t.status === 'active') {
      options.push({
        id: t.id,
        name: t.name,
        type: 'tea_professional',
        typeLabel: '茶人',
        phone: t.phone,
      });
    }
  });

  return options;
}

/**
 * 根据人员ID和类型获取人员姓名
 */
export function getPersonName(personId?: string, personType?: PersonRoleType): string {
  if (!personId) return '—';
  if (personType === 'employee') {
    return employees.find((e) => e.id === personId)?.name ?? '—';
  }
  if (personType === 'tea_professional') {
    return teaProfessionals.find((t) => t.id === personId)?.name ?? '—';
  }
  return '—';
}

export { PERSON_TYPE_LABELS };
