import type { CustomerItem, OrderContact, CustomerGroup } from '../types';
import { generateCustomerCode } from '../utils/customerCode';

/* ── 直营客户（无平台） ── */
const directNoPlatform: CustomerItem[] = [
  { id: 'c1', name: '华茗堂茶庄', shortName: '华茗堂', type: 'direct', viaPlatform: false, region: '北京', province: '北京', city: '北京市', district: '西城区', contactPerson: '张明华', contactPhone: '010-8234****', contactEmail: 'zmh@huamingtang.com', contactAddress: '马连道16号', level: 'A级', orders: 32, totalAmount: 386000, platformIds: [], developerId: 'emp-6', developerType: 'employee', developerName: '周丽华', maintainerId: 'emp-7', maintainerType: 'employee', maintainerName: '李娜', followerId: 'emp-8', followerType: 'employee', followerName: '王强', profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 }, cooperationDate: '2023-02-15', status: 'active', settlementMethod: '月结', taxNo: '91110102MA***1234', dachaRate: 15, source: '展会拓客', remark: '长期合作，月均采购稳定',
    bankAccounts: [{ accountName: '北京华茗堂茶业有限公司', accountNo: '1100 **** **** 8821', bankName: '中国工商银行北京西城支行', bankNo: '102100000XXX' }],
    invoiceInfos: [{ invoiceEntity: '北京华茗堂茶业有限公司', taxNo: '91110102MA***1234', taxRate: '6%' }],
    orderContacts: [
      { id: 'oc-c1-1', name: '张明华', department: '采购部', phone: '010-8234****', address: '北京市西城区马连道16号', remark: '主联系人' },
      { id: 'oc-c1-2', name: '李经理', department: '采购部', phone: '010-8234****', address: '北京市西城区马连道16号', remark: '备用联系人' },
    ],
    subOrganizations: [
      { id: 'sub-c1-1', name: '华茗堂·朝阳分店', contactPerson: '王经理', contactPhone: '010-6543****', province: '北京', city: '北京市', district: '朝阳区', address: '建国路88号SOHO现代城', developerId: 'emp-6', developerType: 'employee', developerName: '周丽华', maintainerId: 'emp-8', maintainerType: 'employee', maintainerName: '王强', remark: 'CBD核心区门店' },
      { id: 'sub-c1-2', name: '华茗堂·海淀分店', contactPerson: '刘店长', contactPhone: '010-8234****', province: '北京', city: '北京市', district: '海淀区', address: '中关村大街1号', developerId: 'emp-7', developerType: 'employee', developerName: '李娜', maintainerId: 'emp-9', maintainerType: 'employee', maintainerName: '张伟', remark: '高校周边门店' },
    ],
    terminal: { enabled: true, username: 'hmt001', password: '123456', status: 'active', openTime: '2026-08-01' },
  },
  { id: 'c2', name: '清心茶坊', shortName: '清心茶坊', type: 'direct', viaPlatform: false, region: '杭州', province: '浙江', city: '杭州市', district: '西湖区', contactPerson: '李雅芳', contactPhone: '0571-8612****', level: 'S级', orders: 45, totalAmount: 512400, platformIds: [], developerId: 'emp-6', developerType: 'employee', developerName: '周丽华', maintainerId: 'emp-7', maintainerType: 'employee', maintainerName: '李娜', profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 }, cooperationDate: '2022-08-10', status: 'active', settlementMethod: '月结', source: '老客户转介', remark: '核心客户，高端茶品需求大',
    bankAccounts: [{ accountName: '杭州清心茶坊有限公司', accountNo: '1202 **** **** 5567', bankName: '中国建设银行杭州西湖支行', bankNo: '10533100XXX' }],
    invoiceInfos: [{ invoiceEntity: '杭州清心茶坊有限公司', taxNo: '91330106MA***5678', taxRate: '6%' }],
    orderContacts: [
      { id: 'oc-c2-1', name: '李雅芳', department: '采购部', phone: '0571-8612****', address: '杭州市西湖区龙井路88号', remark: '主联系人' },
    ],
  },
  { id: 'c3', name: '品茗轩', shortName: '品茗轩', type: 'direct', viaPlatform: false, region: '广州', province: '广东', city: '广州市', district: '天河区', contactPerson: '陈志远', contactPhone: '020-8356****', level: 'B级', orders: 19, totalAmount: 168600, platformIds: [], developerId: 'emp-16', developerType: 'employee', developerName: '陈志远', maintainerId: 'emp-17', maintainerType: 'employee', maintainerName: '刘晓东', profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 }, cooperationDate: '2024-01-20', status: 'active', settlementMethod: '预付', dachaRate: 12, source: '线上咨询',
    bankAccounts: [{ accountName: '广州品茗轩茶业有限公司', accountNo: '3602 **** **** 3398', bankName: '中国农业银行广州天河支行', bankNo: '10358400XXX' }],
    invoiceInfos: [{ invoiceEntity: '广州品茗轩茶业有限公司', taxNo: '91440106MA***9012', taxRate: '6%' }],
    orderContacts: [
      { id: 'oc-c3-1', name: '陈志远', department: '采购部', phone: '020-8356****', address: '广州市天河区珠江新城', remark: '主联系人' },
    ],
  },
  { id: 'c4', name: '翠竹茶行', shortName: '翠竹茶行', type: 'direct', viaPlatform: false, region: '成都', province: '四川', city: '成都市', district: '武侯区', contactPerson: '王建国', contactPhone: '028-8523****', level: 'A级', orders: 24, totalAmount: 198200, platformIds: [], developerId: 'emp-7', developerType: 'employee', developerName: '李娜', maintainerId: 'emp-6', maintainerType: 'employee', maintainerName: '周丽华', profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 }, cooperationDate: '2023-06-05', status: 'active', settlementMethod: '月结', source: '主动开发',
    bankAccounts: [{ accountName: '成都翠竹茶行有限公司', accountNo: '4402 **** **** 7712', bankName: '中国银行成都武侯支行', bankNo: '10465100XXX' }],
    invoiceInfos: [{ invoiceEntity: '成都翠竹茶行有限公司', taxNo: '91510107MA***3456', taxRate: '6%' }],
    orderContacts: [
      { id: 'oc-c4-1', name: '王建国', department: '采购部', phone: '028-8523****', address: '成都市武侯区茶店子', remark: '主联系人' },
    ],
  },
  { id: 'c5', name: '云顶茶舍', shortName: '云顶茶舍', type: 'direct', viaPlatform: false, region: '昆明', province: '云南', city: '昆明市', district: '五华区', contactPerson: '刘晓东', contactPhone: '0871-6543****', level: 'B级', orders: 12, totalAmount: 89600, platformIds: [], developerId: 'emp-17', developerType: 'employee', developerName: '刘晓东', maintainerId: 'emp-16', maintainerType: 'employee', maintainerName: '陈志远', profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 }, cooperationDate: '2024-03-18', status: 'active', settlementMethod: '预付', source: '线上咨询',
    bankAccounts: [{ accountName: '昆明云顶茶舍有限公司', accountNo: '2502 **** **** 6634', bankName: '中国工商银行昆明五华支行', bankNo: '10273100XXX' }],
    invoiceInfos: [{ invoiceEntity: '昆明云顶茶舍有限公司', taxNo: '91530102MA***7890', taxRate: '6%' }],
    orderContacts: [
      { id: 'oc-c5-1', name: '刘晓东', department: '采购部', phone: '0871-6543****', address: '昆明市五华区翠湖路', remark: '主联系人' },
    ],
  },
];

/* ── 直营客户（经平台） ── */
const directViaPlatform: CustomerItem[] = [
  { id: 'c6', name: '浦发银行', shortName: '浦发银行', type: 'direct', viaPlatform: true, region: '上海', province: '上海', city: '上海市', district: '浦东新区', contactPerson: '赵经理', contactPhone: '021-6123****', level: 'S级', orders: 18, totalAmount: 425000, platformIds: ['p1'], platformCommissionRates: { p1: '8%' }, developerId: 'emp-6', developerType: 'employee', developerName: '周丽华', maintainerId: 'emp-7', maintainerType: 'employee', maintainerName: '李娜', profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 }, cooperationDate: '2023-04-22', status: 'active', settlementMethod: '月结', dachaRate: 10, source: '平台引流', remark: '企业福利采购，年节大宗订单',
    bankAccounts: [{ accountName: '上海浦东发展银行股份有限公司', accountNo: '1002 **** **** 1234', bankName: '中国工商银行上海浦东支行', bankNo: '10229000XXX' }],
    invoiceInfos: [{ invoiceEntity: '上海浦东发展银行股份有限公司', taxNo: '91310115MA***0001', taxRate: '6%' }],
    orderContacts: [
      { id: 'oc-c6-1', name: '赵经理', department: '行政部', phone: '021-6123****', address: '上海市浦东新区陆家嘴', remark: '主联系人' },
      { id: 'oc-c6-2', name: '孙助理', department: '行政部', phone: '021-6123****', address: '上海市浦东新区陆家嘴', remark: '备用联系人' },
    ],
  },
  { id: 'c7', name: '交通银行', shortName: '交通银行', type: 'direct', viaPlatform: true, region: '上海', province: '上海', city: '上海市', district: '黄浦区', contactPerson: '孙主管', contactPhone: '021-5876****', level: 'A级', orders: 15, totalAmount: 368000, platformIds: ['p2', 'p3'], platformCommissionRates: { p2: '6%', p3: '5%' }, developerId: 'emp-7', developerType: 'employee', developerName: '李娜', maintainerId: 'emp-6', maintainerType: 'employee', maintainerName: '周丽华', profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 }, cooperationDate: '2023-09-10', status: 'active', settlementMethod: '月结', source: '平台引流',
    bankAccounts: [{ accountName: '交通银行股份有限公司', accountNo: '1002 **** **** 5678', bankName: '中国银行上海黄浦支行', bankNo: '10429000XXX' }],
    invoiceInfos: [{ invoiceEntity: '交通银行股份有限公司', taxNo: '91310101MA***0002', taxRate: '6%' }],
    orderContacts: [
      { id: 'oc-c7-1', name: '孙主管', department: '采购部', phone: '021-5876****', address: '上海市黄浦区外滩', remark: '主联系人' },
    ],
  },
  { id: 'c8', name: '中信证券', shortName: '中信证券', type: 'direct', viaPlatform: true, region: '深圳', province: '广东', city: '深圳市', district: '福田区', contactPerson: '周总监', contactPhone: '0755-8234****', level: 'S级', orders: 22, totalAmount: 536000, platformIds: ['p1', 'p2'], platformCommissionRates: { p1: '7%', p2: '6%' }, developerId: 'emp-6', developerType: 'employee', developerName: '周丽华', maintainerId: 'emp-7', maintainerType: 'employee', maintainerName: '李娜', profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 }, cooperationDate: '2022-12-01', status: 'active', settlementMethod: '月结', source: '老客户转介', remark: 'VIP客户礼品定制',
    bankAccounts: [{ accountName: '中信证券股份有限公司', accountNo: '4402 **** **** 9012', bankName: '中国建设银行深圳福田支行', bankNo: '10558400XXX' }],
    invoiceInfos: [{ invoiceEntity: '中信证券股份有限公司', taxNo: '91440304MA***0003', taxRate: '6%' }],
    orderContacts: [
      { id: 'oc-c8-1', name: '周总监', department: '采购部', phone: '0755-8234****', address: '深圳市福田区深南大道', remark: '主联系人' },
      { id: 'oc-c8-2', name: '吴经理', department: '行政部', phone: '0755-8234****', address: '深圳市福田区深南大道', remark: '礼品采购' },
    ],
  },
  { id: 'c9', name: '中国平安', shortName: '中国平安', type: 'direct', viaPlatform: true, region: '深圳', province: '广东', city: '深圳市', district: '南山区', contactPerson: '吴经理', contactPhone: '0755-2233****', level: 'A级', orders: 10, totalAmount: 285000, platformIds: ['p4'], platformCommissionRates: { p4: '7%' }, developerId: 'emp-7', developerType: 'employee', developerName: '李娜', maintainerId: 'emp-6', maintainerType: 'employee', maintainerName: '周丽华', profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 }, cooperationDate: '2024-02-28', status: 'active', settlementMethod: '月结', source: '展会拓客',
    bankAccounts: [{ accountName: '中国平安保险（集团）股份有限公司', accountNo: '4402 **** **** 3456', bankName: '中国农业银行深圳南山支行', bankNo: '10358400XXX' }],
    invoiceInfos: [{ invoiceEntity: '中国平安保险（集团）股份有限公司', taxNo: '91440305MA***0004', taxRate: '6%' }],
    orderContacts: [
      { id: 'oc-c9-1', name: '吴经理', department: '采购部', phone: '0755-2233****', address: '深圳市南山区科技园', remark: '主联系人' },
    ],
  },
  { id: 'c10', name: '招商银行', shortName: '招商银行', type: 'direct', viaPlatform: true, region: '深圳', province: '广东', city: '深圳市', district: '福田区', contactPerson: '钱主管', contactPhone: '0755-8866****', level: 'B级', orders: 8, totalAmount: 196000, platformIds: ['p2'], platformCommissionRates: { p2: '6%' }, developerId: 'emp-16', developerType: 'employee', developerName: '陈志远', maintainerId: 'emp-17', maintainerType: 'employee', maintainerName: '刘晓东', profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 }, cooperationDate: '2024-05-15', status: 'active', settlementMethod: '月结', source: '主动开发',
    bankAccounts: [{ accountName: '招商银行股份有限公司', accountNo: '4402 **** **** 7890', bankName: '中国银行深圳福田支行', bankNo: '10458400XXX' }],
    invoiceInfos: [{ invoiceEntity: '招商银行股份有限公司', taxNo: '91440304MA***0005', taxRate: '6%' }],
    orderContacts: [
      { id: 'oc-c10-1', name: '钱主管', department: '行政部', phone: '0755-8866****', address: '深圳市福田区深南中路', remark: '主联系人' },
    ],
  },
];

/* ── 渠道客户 ── */
const channelCustomers: CustomerItem[] = [
  { id: 'c11', name: '天福茗茶', shortName: '天福茗茶', type: 'channel', region: '福州', province: '福建', city: '福州市', district: '鼓楼区', contactPerson: '林经理', contactPhone: '0591-8765****', level: 'S级', orders: 56, totalAmount: 826000, platformIds: [], developerId: 'emp-6', developerType: 'employee', developerName: '周丽华', maintainerId: 'emp-7', maintainerType: 'employee', maintainerName: '李娜', profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 }, cooperationDate: '2022-03-10', status: 'active', settlementMethod: '月结', source: '主动开发', remark: '华东区核心渠道商',
    bankAccounts: [{ accountName: '福建天福茗茶有限公司', accountNo: '3502 **** **** 1122', bankName: '中国建设银行福州鼓楼支行', bankNo: '10539100XXX' }],
    invoiceInfos: [{ invoiceEntity: '福建天福茗茶有限公司', taxNo: '91350102MA***0006', taxRate: '6%' }],
  },
  { id: 'c12', name: '八马茶业', shortName: '八马茶业', type: 'channel', region: '厦门', province: '福建', city: '厦门市', district: '思明区', contactPerson: '王总', contactPhone: '0592-5432****', level: 'A级', orders: 42, totalAmount: 645000, platformIds: [], developerId: 'emp-7', developerType: 'employee', developerName: '李娜', maintainerId: 'emp-6', maintainerType: 'employee', maintainerName: '周丽华', profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 }, cooperationDate: '2023-01-18', status: 'active', settlementMethod: '月结', source: '展会拓客',
    bankAccounts: [{ accountName: '八马茶业股份有限公司', accountNo: '3502 **** **** 3344', bankName: '中国工商银行厦门思明支行', bankNo: '10239300XXX' }],
    invoiceInfos: [{ invoiceEntity: '八马茶业股份有限公司', taxNo: '91350203MA***0007', taxRate: '6%' }],
  },
  { id: 'c13', name: '大益茶体验馆', shortName: '大益茶', type: 'channel', region: '广州', province: '广东', city: '广州市', district: '越秀区', contactPerson: '陈经理', contactPhone: '020-3876****', level: 'A级', orders: 35, totalAmount: 498000, platformIds: [], developerId: 'emp-16', developerType: 'employee', developerName: '陈志远', maintainerId: 'emp-17', maintainerType: 'employee', maintainerName: '刘晓东', profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 }, cooperationDate: '2023-05-22', status: 'active', settlementMethod: '月结', source: '老客户转介',
    bankAccounts: [{ accountName: '广东大益茶业有限公司', accountNo: '3602 **** **** 5566', bankName: '中国农业银行广州越秀支行', bankNo: '10358400XXX' }],
    invoiceInfos: [{ invoiceEntity: '广东大益茶业有限公司', taxNo: '91440104MA***0008', taxRate: '6%' }],
  },
  { id: 'c14', name: '茶里王国', shortName: '茶里王国', type: 'channel', region: '长沙', province: '湖南', city: '长沙市', district: '岳麓区', contactPerson: '杨总', contactPhone: '0731-8567****', level: 'B级', orders: 28, totalAmount: 312000, platformIds: [], developerId: 'emp-17', developerType: 'employee', developerName: '刘晓东', maintainerId: 'emp-16', maintainerType: 'employee', maintainerName: '陈志远', profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 }, cooperationDate: '2023-11-05', status: 'active', settlementMethod: '月结', source: '线上咨询',
    bankAccounts: [{ accountName: '湖南茶里王国茶业有限公司', accountNo: '4302 **** **** 7788', bankName: '中国银行长沙岳麓支行', bankNo: '10455100XXX' }],
    invoiceInfos: [{ invoiceEntity: '湖南茶里王国茶业有限公司', taxNo: '91430104MA***0009', taxRate: '6%' }],
  },
  { id: 'c15', name: '正山堂旗舰店', shortName: '正山堂', type: 'channel', region: '武夷山', province: '福建', city: '南平市', district: '武夷山市', contactPerson: '江经理', contactPhone: '0599-5123****', level: 'B级', orders: 20, totalAmount: 268000, platformIds: [], developerId: 'emp-6', developerType: 'employee', developerName: '周丽华', maintainerId: 'emp-7', maintainerType: 'employee', maintainerName: '李娜', profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 }, cooperationDate: '2024-01-08', status: 'inactive', settlementMethod: '月结', source: '主动开发',
    bankAccounts: [{ accountName: '福建正山堂茶业有限责任公司', accountNo: '3502 **** **** 9900', bankName: '中国建设银行武夷山支行', bankNo: '10539100XXX' }],
    invoiceInfos: [{ invoiceEntity: '福建正山堂茶业有限责任公司', taxNo: '91350782MA***0010', taxRate: '6%' }],
  },
];

/* ── 平台客户 ── */
const platformCustomers: CustomerItem[] = [
  { id: 'c16', name: '京东慧采', shortName: '京东慧采', type: 'platform', region: '北京', province: '北京', city: '北京市', district: '大兴区', contactPerson: '张经理', contactPhone: '010-8833****', level: 'S级', orders: 48, totalAmount: 985000, platformIds: [], developerId: 'emp-6', developerType: 'employee', developerName: '周丽华', maintainerId: 'emp-7', maintainerType: 'employee', maintainerName: '李娜', profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 }, cooperationDate: '2022-01-15', status: 'active', settlementMethod: '月结', source: '平台入驻', remark: '京东企业购平台',
    bankAccounts: [{ accountName: '北京京东世纪贸易有限公司', accountNo: '1100 **** **** 0001', bankName: '中国工商银行北京大兴支行', bankNo: '102100000XXX' }],
    invoiceInfos: [{ invoiceEntity: '北京京东世纪贸易有限公司', taxNo: '91110000MA***0001', taxRate: '6%' }],
  },
  { id: 'c17', name: '史泰博', shortName: '史泰博', type: 'platform', region: '上海', province: '上海', city: '上海市', district: '浦东新区', contactPerson: '李主管', contactPhone: '021-5888****', level: 'A级', orders: 32, totalAmount: 628000, platformIds: [], developerId: 'emp-7', developerType: 'employee', developerName: '李娜', maintainerId: 'emp-6', maintainerType: 'employee', maintainerName: '周丽华', profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 }, cooperationDate: '2022-06-20', status: 'active', settlementMethod: '月结', source: '平台入驻', remark: '办公用品集采平台',
    bankAccounts: [{ accountName: '史泰博(上海)有限公司', accountNo: '1002 **** **** 0002', bankName: '中国银行上海浦东支行', bankNo: '10429000XXX' }],
    invoiceInfos: [{ invoiceEntity: '史泰博(上海)有限公司', taxNo: '91310000MA***0002', taxRate: '6%' }],
  },
  { id: 'c18', name: '易积通', shortName: '易积通', type: 'platform', region: '深圳', province: '广东', city: '深圳市', district: '南山区', contactPerson: '王经理', contactPhone: '0755-2666****', level: 'B级', orders: 18, totalAmount: 296000, platformIds: [], developerId: 'emp-16', developerType: 'employee', developerName: '陈志远', maintainerId: 'emp-17', maintainerType: 'employee', maintainerName: '刘晓东', profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 }, cooperationDate: '2023-03-10', status: 'active', settlementMethod: '月结', source: '平台入驻', remark: '政企采购平台',
    bankAccounts: [{ accountName: '深圳市易积通科技有限公司', accountNo: '4402 **** **** 0003', bankName: '中国建设银行深圳南山支行', bankNo: '10558400XXX' }],
    invoiceInfos: [{ invoiceEntity: '深圳市易积通科技有限公司', taxNo: '91440300MA***0003', taxRate: '6%' }],
  },
];

/* ── 个人客户 ── */
const personalCustomers: CustomerItem[] = [
  { id: 'c19', name: '张伟', shortName: '张伟', type: 'personal', region: '北京', province: '北京', city: '北京市', district: '朝阳区', contactPerson: '张伟', contactPhone: '138****1234', contactEmail: 'zhangwei@email.com', contactAddress: '建国路88号', level: 'B级', orders: 5, totalAmount: 18600, platformIds: [], cooperationDate: '2024-06-10', status: 'active', source: '线上咨询', remark: '个人茶友，偏好绿茶' },
  { id: 'c20', name: '李娜', shortName: '李娜', type: 'personal', region: '上海', province: '上海', city: '上海市', district: '徐汇区', contactPerson: '李娜', contactPhone: '139****5678', contactEmail: 'lina@email.com', contactAddress: '漕溪北路120号', level: 'A级', orders: 12, totalAmount: 45200, platformIds: [], cooperationDate: '2023-10-15', status: 'active', source: '老客户转介', remark: '高端个人客户，常购白茶' },
  { id: 'c21', name: '王强', shortName: '王强', type: 'personal', region: '广州', province: '广东', city: '广州市', district: '海珠区', contactPerson: '王强', contactPhone: '137****9012', contactAddress: '新港中路200号', level: 'C级', orders: 3, totalAmount: 8800, platformIds: [], cooperationDate: '2024-09-01', status: 'active', source: '线上咨询' },
  { id: 'c22', name: '赵敏', shortName: '赵敏', type: 'personal', region: '成都', province: '四川', city: '成都市', district: '锦江区', contactPerson: '赵敏', contactPhone: '136****3456', contactEmail: 'zhaomin@email.com', contactAddress: '春熙路50号', level: 'B级', orders: 8, totalAmount: 23400, platformIds: [], cooperationDate: '2024-02-20', status: 'active', source: '展会拓客', remark: '红茶爱好者' },
  { id: 'c23', name: '陈刚', shortName: '陈刚', type: 'personal', region: '杭州', province: '浙江', city: '杭州市', district: '滨江区', contactPerson: '陈刚', contactPhone: '135****7890', contactAddress: '江南大道100号', level: 'A级', orders: 15, totalAmount: 56800, platformIds: [], cooperationDate: '2023-07-08', status: 'inactive', source: '主动开发', remark: '已暂停采购' },
];

/** 为各类型客户按类型内顺序生成编号（4位，各类型从0001起） */
function assignCodes(items: CustomerItem[]) {
  const counters: Record<string, number> = {};
  items.forEach(c => {
    counters[c.type] = (counters[c.type] ?? 0) + 1;
    c.customerCode = generateCustomerCode(c.type, c.shortName || c.name, counters[c.type]);
  });
}


/** 额外演示客户（30 条）：[名称, 简称, 类型, 经平台, 省, 市, 区县, 联系人, 电话, 等级, 订单数, 累计金额, 来源, 状态, 合作日期, 备注] */
const DEMO_EXTRA_ROWS: [string, string, CustomerItem['type'], boolean, string, string, string, string, string, string, number, number, string, 'active' | 'inactive', string, string][] = [
  ['茅庐茶事', '茅庐茶事', 'direct', false, '北京', '北京市', '海淀区', '李慕白', '138****2001', 'A级', 22, 268000, '展会拓客', 'active', '2023-04-12', '海淀茶文化圈核心客户'],
  ['武夷春茶行', '武夷春', 'direct', false, '福建', '南平市', '武夷山市', '江远', '139****2002', 'S级', 38, 512000, '产地直采', 'active', '2022-09-18', '岩茶产地一手货源'],
  ['滇红贸易', '滇红贸易', 'direct', false, '云南', '临沧市', '凤庆县', '邓红茶', '137****2003', 'A级', 26, 324000, '产地直采', 'active', '2023-02-06', '滇红原料直供'],
  ['白茶轩', '白茶轩', 'direct', false, '福建', '宁德市', '福鼎市', '林白', '136****2004', 'B级', 18, 196000, '老客户转介', 'active', '2024-03-15', '福鼎白茶专营'],
  ['黑茶人家', '黑茶人家', 'direct', false, '湖南', '益阳市', '安化县', '贺黑金', '135****2005', 'B级', 15, 158000, '线上咨询', 'active', '2024-05-20', '安化黑茶推广商'],
  ['青瓷茶具商行', '青瓷茶具', 'direct', false, '浙江', '丽水市', '龙泉市', '周青瓷', '134****2006', 'B级', 12, 132000, '展会拓客', 'active', '2024-08-11', '青瓷茶具配套'],
  ['普洱庄园', '普洱庄园', 'direct', false, '云南', '西双版纳傣族自治州', '勐海县', '岩温普洱', '133****2007', 'A级', 24, 286000, '产地直采', 'active', '2023-06-30', '勐海古树茶庄园'],
  ['黄山毛峰商行', '黄山毛峰', 'direct', false, '安徽', '黄山市', '黄山区', '谢毛峰', '132****2008', 'B级', 16, 148000, '老客户转介', 'active', '2024-01-25', '黄山毛峰核心产区'],
  ['铁观音批发', '铁观音批发', 'direct', false, '福建', '泉州市', '安溪县', '王观音', '131****2009', 'A级', 30, 356000, '主动开发', 'active', '2023-03-08', '安溪铁观音批发'],
  ['岩韵茶庄', '岩韵茶庄', 'direct', false, '福建', '南平市', '武夷山市', '范岩韵', '130****2010', 'B级', 14, 126000, '线上咨询', 'inactive', '2024-06-01', '武夷岩茶零售'],
  ['国网采购中心', '国网采购', 'direct', true, '江苏', '南京市', '建邺区', '赵经理', '130****2011', 'A级', 19, 356000, '平台引流', 'active', '2023-10-11', '京东慧采月度采购'],
  ['中石化易派', '中石化易派', 'direct', true, '北京', '北京市', '昌平区', '孙主管', '131****2012', 'A级', 16, 298000, '平台引流', 'active', '2023-11-20', '易派客平台采购'],
  ['电网物资', '电网物资', 'direct', true, '广东', '广州市', '天河区', '周总监', '132****2013', 'B级', 11, 216000, '平台引流', 'active', '2024-02-14', '南方电网供应商'],
  ['航天采购', '航天采购', 'direct', true, '上海', '上海市', '闵行区', '吴主管', '133****2014', 'B级', 9, 168000, '平台引流', 'active', '2024-04-01', '航天系统福利采购'],
  ['银联商务', '银联商务', 'direct', true, '上海', '上海市', '浦东新区', '郑经理', '134****2015', 'B级', 8, 152000, '平台引流', 'active', '2024-05-09', '银联商务福利平台'],
  ['茶香四溢批发', '茶香四溢', 'channel', false, '山东', '济南市', '历下区', '冯经理', '135****2016', 'A级', 33, 452000, '主动开发', 'active', '2023-01-15', '山东茶叶批发大户'],
  ['江南茶仓', '江南茶仓', 'channel', false, '浙江', '嘉兴市', '南湖区', '沈仓管', '136****2017', 'B级', 21, 268000, '老客户转介', 'active', '2023-07-22', '嘉兴茶叶仓储分销'],
  ['川茶集散', '川茶集散', 'channel', false, '四川', '成都市', '金牛区', '杜集散', '137****2018', 'B级', 19, 236000, '展会拓客', 'active', '2023-09-05', '西南茶叶集散渠道'],
  ['茶缘商行', '茶缘商行', 'channel', false, '河南', '郑州市', '金水区', '宋茶缘', '138****2019', 'B级', 17, 204000, '线上咨询', 'active', '2024-01-30', '郑州茶叶分销商'],
  ['东北茶行', '东北茶行', 'channel', false, '辽宁', '沈阳市', '和平区', '高茶行', '139****2020', 'C级', 12, 142000, '主动开发', 'active', '2024-03-18', '东北茶叶渠道'],
  ['中原茶贸', '中原茶贸', 'channel', false, '湖北', '武汉市', '江汉区', '何茶贸', '130****2021', 'B级', 15, 186000, '展会拓客', 'active', '2024-02-06', '武汉中原茶贸'],
  ['闽南茶都', '闽南茶都', 'channel', false, '福建', '泉州市', '丰泽区', '林茶都', '131****2022', 'A级', 27, 368000, '老客户转介', 'active', '2022-12-08', '闽南茶叶集散地'],
  ['王茶友', '王茶友', 'personal', false, '北京', '北京市', '东城区', '王茶友', '132****2023', 'B级', 6, 21600, '线上咨询', 'active', '2024-07-12', '老舍茶馆常客'],
  ['陈小姐', '陈小姐', 'personal', false, '广东', '深圳市', '南山区', '陈小姐', '133****2024', 'A级', 14, 58200, '老客户转介', 'active', '2023-08-25', '高端个人客户'],
  ['刘先生', '刘先生', 'personal', false, '江苏', '南京市', '鼓楼区', '刘先生', '134****2025', 'B级', 9, 32400, '线上咨询', 'active', '2024-02-18', '南京茶友会成员'],
  ['赵女士', '赵女士', 'personal', false, '浙江', '杭州市', '余杭区', '赵女士', '135****2026', 'A级', 16, 64800, '老客户转介', 'active', '2023-05-30', '径山茶爱好者'],
  ['孙老师', '孙老师', 'personal', false, '山东', '青岛市', '市南区', '孙老师', '136****2027', 'C级', 4, 12600, '线上咨询', 'active', '2024-09-01', '青岛个人茶友'],
  ['周工', '周工', 'personal', false, '四川', '成都市', '青羊区', '周工', '137****2028', 'B级', 8, 28600, '展会拓客', 'active', '2024-04-22', '成都茶文化爱好者'],
  ['吴经理', '吴经理', 'personal', false, '福建', '福州市', '台江区', '吴经理', '138****2029', 'B级', 10, 35800, '主动开发', 'active', '2024-03-12', '福州个人采购'],
  ['郑女士', '郑女士', 'personal', false, '湖北', '武汉市', '武昌区', '郑女士', '139****2030', 'C级', 5, 15800, '线上咨询', 'inactive', '2024-06-20', '武汉个人茶友'],
];

const demoExtraCustomers: CustomerItem[] = DEMO_EXTRA_ROWS.map((row, i) => {
  const [name, shortName, type, viaPlatform, province, city, district, contactPerson, contactPhone, level, orders, totalAmount, source, status, cooperationDate, remark] = row;
  return {
    id: `c${24 + i}`,
    name, shortName, type, viaPlatform,
    region: province + city.replace(/市$/, ''),
    province, city, district,
    contactPerson, contactPhone,
    level, orders, totalAmount,
    platformIds: viaPlatform ? ['p1'] : [],
    platformCommissionRates: viaPlatform ? { p1: '6%' } : undefined,
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate, status,
    settlementMethod: '月结',
    source, remark,
  } as CustomerItem;
});

/** 所有客户（按建档顺序） */
const allCustomers: CustomerItem[] = [
  ...directNoPlatform,
  ...directViaPlatform,
  ...channelCustomers,
  ...platformCustomers,
  ...personalCustomers,
  ...demoExtraCustomers,
];

assignCodes(allCustomers);

export const customerItems: CustomerItem[] = allCustomers;

/** 平台扣点%（客户档案现值：按客户名 + 平台 ID 查 platformCommissionRates，如 "8%" → 8；未配置为 0） */
export function customerPlatformRate(customerName: string, platformId?: string): number {
  if (!platformId) return 0;
  const raw = customerItems.find((c) => c.name === customerName)?.platformCommissionRates?.[platformId];
  const n = raw ? parseFloat(raw) : NaN;
  return Number.isFinite(n) ? n : 0;
}

/** 订单平台扣点%（订单价格快照规则：platformRateSnapshot 下单快照优先；缺省回退客户档案现值——旧数据兜底；非经平台订单为 0） */
export function orderPlatformRate(o: {
  salesPath?: string;
  platformCustomerId?: string;
  customerName?: string;
  platformRateSnapshot?: number;
}): number {
  if (o.salesPath !== 'via_platform') return 0;
  if (o.platformRateSnapshot !== undefined) return o.platformRateSnapshot;
  return customerPlatformRate(o.customerName ?? '', o.platformCustomerId);
}

export const CUSTOMER_TYPE_LABELS: Record<CustomerItem['type'], string> = {
  direct: '直营客户',
  channel: '渠道客户',
  personal: '个人客户',
  platform: '平台客户',
  guest: '游客客户',
};

export const CUSTOMER_TYPE_DESC: Record<CustomerItem['type'], string> = {
  direct: '企业客户，包括直接销售和经平台销售的客户',
  channel: '企业客户，非终端客户，采购后二次销售的客户',
  personal: '个人客户，不区分采购后是个人消费还是二次销售',
  platform: '京东慧采、史泰博、易积通等集采平台客户',
  guest: '未知客户具体情况的自来客户',
};

/** 客户分组映射 */
export const CUSTOMER_GROUP_MAP: Record<CustomerItem['type'], CustomerGroup> = {
  direct: 'enterprise',
  channel: 'enterprise',
  platform: 'enterprise',
  personal: 'personal',
  guest: 'personal',
};

/** 客户分组标签 */
export const CUSTOMER_GROUP_LABELS: Record<CustomerGroup, string> = {
  enterprise: '企业客户',
  personal: '个人客户',
};

/** 生成下单人 ID */
export function generateOrderContactId(customerId: string, sequence: number): string {
  return `oc-${customerId}-${sequence}`;
}

/** 将个人客户转换为直营客户 */
export function convertPersonalToDirect(personalCustomer: CustomerItem): CustomerItem {
  const directCount = customerItems.filter(c => c.type === 'direct').length;
  return {
    ...personalCustomer,
    type: 'direct',
    viaPlatform: false,
    customerCode: generateCustomerCode('direct', personalCustomer.shortName || personalCustomer.name, directCount + 1),
    orderContacts: [
      {
        id: generateOrderContactId(personalCustomer.id, 1),
        name: personalCustomer.contactPerson,
        phone: personalCustomer.contactPhone,
        address: personalCustomer.contactAddress,
        remark: '由个人客户转换生成',
      },
    ],
  };
}

export const LEVEL_COLORS: Record<string, { bg: string; color: string }> = {
  'S级': { bg: '#FEF2F4', color: '#CB405D' },
  'A级': { bg: '#EBF3FC', color: '#0F64B5' },
  'B级': { bg: '#EBF3FC', color: '#0F64B5' },
  'C级': { bg: 'var(--color-neutral-100)', color: 'var(--color-neutral-500)' },
};
