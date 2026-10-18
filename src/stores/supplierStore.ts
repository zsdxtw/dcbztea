/**
 * 供应商共享数据与注册审批流（管理端 ↔ 合作商终端共享）
 * - 管理端：注册审批（通过后创建/更新供应商）、供应商列表、新品提醒处理
 * - 合作商终端：注册提交、信息修改申请、报价设置、新品提醒提报
 */
import { create } from 'zustand';
import type {
  SupplierItem, SupplierApproval, SupplierTerminal, SupplierTerminalAccount,
  NewArrivalReminder, PartnerQuoteSetting,
} from '../types';
import { supplierItems } from '../data/suppliers';

const now = () => new Date().toISOString().slice(0, 10);

/** 生成审批编号 */
const genCode = (n: number) => `SP-${String(n).padStart(3, '0')}`;

/** 生成新品提醒编号 */
const genReminderCode = (n: number) => `XPTX-${String(n).padStart(4, '0')}`;

/** 读取终端账号列表；未初始化 accounts 时由 username/password 派生管理员账号（旧数据兼容） */
export const getTerminalAccounts = (t: SupplierTerminal): SupplierTerminalAccount[] => {
  if (t.accounts?.length) return t.accounts;
  return [{
    id: `ta_admin_${t.username}`,
    role: 'admin',
    username: t.username,
    password: t.password ?? '',
    name: '管理员',
    phone: '',
    status: t.status,
    createTime: t.openTime,
  }];
};

/** 演示种子审批单：1 条待审批注册、1 条已通过注册（历史） */
const seedApprovals: SupplierApproval[] = [
  {
    id: 'sa_seed_1',
    code: 'SP-001',
    type: 'register',
    applicant: 'chayu01',
    applyNote: '福建武夷山岩茶厂商，希望接入平台承接华东订单',
    payload: {
      id: 'sa_reg_1',
      type: 'brand',
      name: '武夷山茶语岩茶业有限公司',
      unifiedCreditCode: '91350783MA9TEA0001',
      cooperationAgreements: [],
      brandAuthAgreements: [],
      businessLicense: '营业执照.pdf',
      qualificationFiles: ['营业执照.pdf', '食品生产许可证.pdf'],
      channelSource: 'terminal',
      registeredProvince: '福建',
      registeredCity: '南平市',
      registeredDistrict: '武夷山市',
      registeredAddress: '星村镇黄柏村工业路9号',
      legalRepresentative: '吴志远',
      establishmentDate: '2015-04-12',
      registeredCapital: '800万元',
      companyType: '有限责任公司',
      businessScope: '岩茶种植、生产、加工、销售',
      contactPerson: '吴志远',
      contactPosition: '销售总监',
      contactAddress: '星村镇黄柏村工业路9号',
      contactPhone: '0599-520****',
      contactEmail: 'wzy@chayutea.com',
      warehouses: [],
      stores: [],
      terminal: { enabled: true, username: 'chayu01', password: '123456', status: 'active' },
      taxType: 'general',
      invoiceInfo: { title: '武夷山茶语岩茶业有限公司', taxNo: '91350783MA9TEA0001', taxRate: 13, address: '', phone: '', bankName: '', bankAccount: '' },
      cooperationDate: now(),
      grade: 'B',
      mainCategories: ['青茶'],
      introduction: '武夷岩茶核心产区厂商，主营大红袍、肉桂、水仙',
      settlementMethod: 'monthly',
      bankAccount: { accountName: '武夷山茶语岩茶业有限公司', accountNo: '', bankName: '', bankNo: '', remark: '' },
      shippingSettlement: 'not_free_fixed',
      supportDropship: false,
      qualificationStatus: 'pending',
      paymentTerms: '月结30天',
      deliveryCycle: '5-7个工作日',
      minOrderAmount: 2000,
      returnPolicy: '质量问题7天内可退换',
      qualityGuarantee: '',
      remark: '合作商终端注册',
      status: 'active',
    },
    status: 'pending',
    submitTime: '2026-10-15',
  },
  {
    id: 'sa_seed_2',
    code: 'SP-002',
    type: 'register',
    applicant: 'zyq001',
    applyNote: '四川峨眉高山绿茶品牌方',
    payload: {} as SupplierItem,
    supplierId: '8',
    status: 'approved',
    submitTime: '2025-09-01',
    reviewTime: '2025-09-03',
    reviewer: '管理员',
    reviewNote: '资质齐全，同意入驻',
  },
];

/** 演示种子新品提醒：1 条待处理（云茶供应链）、1 条已上架（八马） */
const seedReminders: NewArrivalReminder[] = [
  {
    id: 'nar_seed_1',
    code: 'XPTX-0001',
    supplierId: '11',
    supplierName: '杭州云茶供应链管理有限公司',
    brand: '武夷星',
    productName: '武夷星大红袍·岩韵典藏',
    productUrl: 'https://wuyixing.tmall.com/item/yanyun.htm',
    submitter: 'admin',
    submitTime: '2026-10-14',
    status: 'pending',
  },
  {
    id: 'nar_seed_2',
    code: 'XPTX-0002',
    supplierId: '3',
    supplierName: '八马茶业股份有限公司',
    brand: '八马',
    productName: '八马铁观音·耿茨联名款',
    productUrl: 'https://bama.jd.com/item/gengci.htm',
    submitter: 'bama01',
    submitTime: '2026-09-28',
    status: 'listed',
    handleNote: '已上架至商品管理-茶叶',
    handleTime: '2026-10-02',
  },
];

/** 演示种子报价设置：3（八马）、8（竹叶青）、11（云茶供应链，多品牌） */
const seedQuoteSettings: Record<string, PartnerQuoteSetting> = {
  '3': {
    supplierId: '3',
    brandDiscounts: { 八马: 86 },
    productOverrides: {},
    updateTime: '2026-10-08',
  },
  '8': {
    supplierId: '8',
    brandDiscounts: { 竹叶青: 90 },
    productOverrides: {},
    updateTime: '2026-09-20',
  },
  '11': {
    supplierId: '11',
    brandDiscounts: { 西湖牌: 82, 正山堂: 85, 八马: 88, 大益: 90, 品品香: 84 },
    productOverrides: {
      '1': { type: 'price', value: 448 },
    },
    updateTime: '2026-10-12',
  },
};

interface SupplierStoreState {
  /** 供应商列表 */
  suppliers: SupplierItem[];
  /** 注册/修改审批单 */
  approvals: SupplierApproval[];
  /** 新品提醒（合作商提报 → 管理端「商品 > 新品提醒」处理） */
  arrivalReminders: NewArrivalReminder[];
  /** 合作商报价设置（键=合作商/供应商 ID） */
  quoteSettings: Record<string, PartnerQuoteSetting>;
  /** 提交注册申请（合作商终端注册页） */
  submitRegistration: (draft: SupplierItem, applicant: string, note?: string) => SupplierApproval;
  /** 提交信息修改申请（合作商终端信息维护） */
  submitModification: (next: SupplierItem, applicant: string, note?: string) => SupplierApproval;
  /** 管理端审批 */
  reviewApproval: (id: string, action: 'approved' | 'rejected', reviewer: string, note?: string) => void;
  /** 直增供应商（管理端审批通过时内部调用） */
  addSupplier: (s: SupplierItem) => void;
  /** 直改供应商（管理端列表编辑保存 / 审批通过时内部调用） */
  updateSupplier: (s: SupplierItem) => void;
  /** 更新终端账号列表（管理端终端 Tab / 合作商终端账号管理共用）：管理员账号名/密码自动同步 terminal.username/password */
  updateTerminalAccounts: (supplierId: string, accounts: SupplierTerminalAccount[]) => void;
  /** 提报新品提醒（合作商终端报价菜单） */
  submitArrivalReminder: (input: { supplierId: string; supplierName: string; brand: string; productName: string; productUrl: string; submitter: string }) => NewArrivalReminder;
  /** 处理新品提醒（管理端：标记已上架 / 忽略） */
  handleArrivalReminder: (id: string, status: 'listed' | 'dismissed', note?: string) => void;
  /** 更新合作商报价设置（品牌整体折扣 + 单品覆盖） */
  updateQuoteSetting: (supplierId: string, setting: PartnerQuoteSetting) => void;
}

export const useSupplierStore = create<SupplierStoreState>((set, get) => ({
  suppliers: supplierItems,
  approvals: seedApprovals,
  arrivalReminders: seedReminders,
  quoteSettings: seedQuoteSettings,

  submitRegistration: (draft, applicant, note) => {
    const { approvals } = get();
    const approval: SupplierApproval = {
      id: `sa_${Date.now()}`,
      code: genCode(approvals.length + 1),
      type: 'register',
      applicant,
      applyNote: note,
      payload: draft,
      status: 'pending',
      submitTime: now(),
    };
    set({ approvals: [approval, ...approvals] });
    return approval;
  },

  submitModification: (next, applicant, note) => {
    const { approvals } = get();
    const approval: SupplierApproval = {
      id: `sa_${Date.now()}`,
      code: genCode(approvals.length + 1),
      type: 'modify',
      applicant,
      applyNote: note,
      payload: next,
      supplierId: next.id,
      status: 'pending',
      submitTime: now(),
    };
    set({ approvals: [approval, ...approvals] });
    return approval;
  },

  reviewApproval: (id, action, reviewer, note) => {
    const { approvals, suppliers } = get();
    const target = approvals.find(a => a.id === id);
    if (!target) return;
    let nextSuppliers = suppliers;
    if (action === 'approved') {
      if (target.type === 'register') {
        // 注册通过 → 新供应商入库（渠道来源：终端注册）
        nextSuppliers = [...suppliers, target.payload];
      } else if (target.supplierId) {
        // 修改通过 → 更新对应供应商档案
        nextSuppliers = suppliers.map(s => s.id === target.supplierId ? target.payload : s);
      }
    }
    set({
      suppliers: nextSuppliers,
      approvals: approvals.map(a => a.id === id ? {
        ...a,
        status: action,
        reviewTime: now(),
        reviewer,
        reviewNote: note,
      } : a),
    });
  },

  addSupplier: (s) => set({ suppliers: [...get().suppliers, s] }),

  updateSupplier: (s) => set({ suppliers: get().suppliers.map(x => x.id === s.id ? s : x) }),

  updateTerminalAccounts: (supplierId, accounts) => set({
    suppliers: get().suppliers.map(s => {
      if (s.id !== supplierId) return s;
      const admin = accounts.find(a => a.role === 'admin');
      return {
        ...s,
        terminal: {
          ...s.terminal,
          accounts,
          username: admin?.username ?? s.terminal.username,
          password: admin?.password ?? s.terminal.password,
          status: admin?.status ?? s.terminal.status,
        },
      };
    }),
  }),

  submitArrivalReminder: (input) => {
    const { arrivalReminders } = get();
    const reminder: NewArrivalReminder = {
      id: `nar_${Date.now()}`,
      code: genReminderCode(arrivalReminders.length + 1),
      ...input,
      submitTime: now(),
      status: 'pending',
    };
    set({ arrivalReminders: [reminder, ...arrivalReminders] });
    return reminder;
  },

  handleArrivalReminder: (id, status, note) => set({
    arrivalReminders: get().arrivalReminders.map(r => r.id === id ? {
      ...r,
      status,
      handleNote: note,
      handleTime: now(),
    } : r),
  }),

  updateQuoteSetting: (supplierId, setting) => set({
    quoteSettings: { ...get().quoteSettings, [supplierId]: { ...setting, supplierId, updateTime: now() } },
  }),
}));
