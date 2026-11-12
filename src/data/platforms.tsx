import type { PlatformItem } from '../types';
import { generateCustomerCode } from '../utils/customerCode';
import { generatePlatformCode } from '../utils/pinyin';

export { generatePlatformCode };

/** 平台数据源 */
export const platformItems: PlatformItem[] = [
  {
    id: 'p1', name: '京东慧采', shortName: '京东慧采', code: '',
    contactPerson: '王经理', contactPosition: '采购总监', contactPhone: '400-606-****', contactAddress: '亦庄经济开发区京东总部',
    province: '北京', city: '北京市', district: '大兴区',
    cooperationDate: '2022-05-10', developerId: 'emp-7', developerType: 'employee', developerName: '李娜',
    deposit: 50000, depositDueDate: '2025-09-10',
    terminal: { enabled: true, username: 'jdhc001', password: '123456', status: 'active', openTime: '2026-09-01' },
    bankAccounts: [
      { accountName: '北京京东世纪贸易有限公司', accountNo: '1100 **** ****', bankName: '中国工商银行北京亦庄支行', bankNo: '102100000XXX' },
    ],
    invoiceInfos: [
      { invoiceEntity: '北京京东世纪贸易有限公司', taxNo: '91110302MA***1234', taxRate: '6%' },
    ],
    status: 'active', remark: '京东企业采购平台',
  },
  {
    id: 'p2', name: '史泰博商贸', shortName: '史泰博', code: '',
    contactPerson: '李主管', contactPosition: '商务经理', contactPhone: '400-820-****', contactAddress: '史泰博大厦',
    province: '上海', city: '上海市', district: '长宁区',
    cooperationDate: '2022-11-20', developerId: 'emp-16', developerType: 'employee', developerName: '陈志远',
    deposit: 30000, depositDueDate: '2025-08-20',
    bankAccounts: [
      { accountName: '史泰博（上海）有限公司', accountNo: '3100 **** ****', bankName: '中国银行上海市长宁支行', bankNo: '10429000XXX' },
    ],
    invoiceInfos: [
      { invoiceEntity: '史泰博（上海）有限公司', taxNo: '91310105MA***5678', taxRate: '6%' },
    ],
    status: 'active', remark: '企业级办公与福利采购',
  },
  {
    id: 'p3', name: '得力集团B2B', shortName: '得力', code: '',
    contactPerson: '陈经理', contactPosition: '渠道总监', contactPhone: '400-185-****', contactAddress: '得力工业园',
    province: '浙江', city: '宁波市', district: '宁海县',
    cooperationDate: '2023-03-15', developerId: 'emp-17', developerType: 'employee', developerName: '刘晓东',
    deposit: 20000, depositDueDate: '2025-07-30',
    bankAccounts: [
      { accountName: '得力集团有限公司', accountNo: '3902 **** ****', bankName: '中国建设银行宁海支行', bankNo: '10533220XXX' },
    ],
    invoiceInfos: [
      { invoiceEntity: '得力集团有限公司', taxNo: '91330226MA***9012', taxRate: '13%' },
    ],
    status: 'active',
  },
  {
    id: 'p4', name: '苏宁企业购', shortName: '苏宁', code: '',
    contactPerson: '周主管', contactPosition: '采购经理', contactPhone: '400-836-****', contactAddress: '苏宁总部',
    province: '江苏', city: '南京市', district: '玄武区',
    cooperationDate: '2023-08-01', developerId: 'emp-6', developerType: 'employee', developerName: '周丽华',
    bankAccounts: [
      { accountName: '苏宁易购集团股份有限公司', accountNo: '4301 **** ****', bankName: '中国农业银行南京玄武支行', bankNo: '10330100XXX' },
    ],
    invoiceInfos: [
      { invoiceEntity: '苏宁易购集团股份有限公司', taxNo: '91320100MA***3456', taxRate: '6%' },
    ],
    status: 'active',
  },
  {
    id: 'p5', name: '欧菲斯办公', shortName: '欧菲斯', code: '',
    contactPerson: '吴经理', contactPosition: '大客户经理', contactPhone: '400-090-****', contactAddress: '欧菲斯大厦',
    province: '重庆', city: '重庆市', district: '渝北区',
    cooperationDate: '2024-01-10', developerId: 'emp-7', developerType: 'employee', developerName: '李娜',
    bankAccounts: [
      { accountName: '欧菲斯办公伙伴控股有限公司', accountNo: '5001 **** ****', bankName: '中国工商银行重庆渝北支行', bankNo: '10265000XXX' },
    ],
    invoiceInfos: [
      { invoiceEntity: '欧菲斯办公伙伴控股有限公司', taxNo: '91500112MA***7890', taxRate: '6%' },
    ],
    status: 'active',
  },
];

/**
 * 为平台生成编号（4位，平台类型从0001起）
 */
platformItems.forEach((p, idx) => {
  p.code = generateCustomerCode('platform', p.shortName, idx + 1);
});
