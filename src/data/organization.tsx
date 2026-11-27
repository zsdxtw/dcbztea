/**
 * 组织架构 & 员工管理 数据源
 */
import type { OrgNode, Employee } from '../types';

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
