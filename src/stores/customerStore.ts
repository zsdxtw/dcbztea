import { create } from 'zustand';
import type { CartItem, CustomerAccount, CustomerItem, CustomerOrder, CustomerOrderStatus, CustomerPoolConfig, PlatformItem } from '../types';
import { customerAccounts, customerOrders } from '../data/customer';
import { customerItems } from '../data/customers';
import { platformItems } from '../data/platforms';
import { generateCustomerCode } from '../utils/customerCode';

/* ── 共享客户域 Store（客户档案 / 平台档案 / 入合作池 / 下单账号 ↔ 客户终端，同一运行时互通） ── */

/** 客户域操作记录 */
export interface CustomerOpRecord {
  id: string;
  customerCode: string;
  time: string;
  action: string;
  detail?: string;
  operator: string;
}

interface CustomerState {
  /** 客户档案（全系统唯一数据源；种子 = data/customers.customerItems） */
  customers: CustomerItem[];
  /** 平台档案（客户列表「平台客户」页签与经平台销售下拉的唯一数据源） */
  platforms: PlatformItem[];
  /** 客户域操作记录 */
  opRecords: CustomerOpRecord[];
  /** 下单账号（管理台开通） */
  accounts: CustomerAccount[];
  /** 客户终端订单 */
  orders: CustomerOrder[];
  /** 购物车（客户终端会话内共享） */
  cart: CartItem[];

  /* ── 客户档案 CRUD ── */
  /** 原样写入客户集合（函数或数组），供页面级批量调整 */
  setCustomers: (value: CustomerItem[] | ((prev: CustomerItem[]) => CustomerItem[])) => void;
  /** 新增客户（编号按「该类型现有最大序号 + 1」生成并查重；重名返回 ok=false） */
  addCustomer: (input: Omit<CustomerItem, 'customerCode'> & { customerCode?: string }) => { ok: boolean; msg: string; customer?: CustomerItem };
  /** 更新客户档案（按 id 合并 patch） */
  updateCustomer: (id: string, patch: Partial<CustomerItem>) => void;
  /** 批量删除客户（级联：清理入合作池配置、停用其下单账号） */
  removeCustomers: (ids: string[]) => void;
  /** 个人客户转直营（重新生成直营编号） */
  convertPersonalToDirect: (id: string) => { ok: boolean; msg: string };

  /* ── 平台档案 CRUD ── */
  setPlatforms: (value: PlatformItem[] | ((prev: PlatformItem[]) => PlatformItem[])) => void;
  /** 新增平台档案 */
  addPlatform: (input: PlatformItem) => void;
  /** 更新平台档案 */
  updatePlatform: (id: string, patch: Partial<PlatformItem>) => void;
  /** 批量删除平台（级联：清理全部客户档案的 platformIds / platformCommissionRates 引用） */
  removePlatforms: (ids: string[]) => void;

  /* ── 操作记录 ── */
  addOpRecord: (customerCode: string, action: string, detail?: string) => void;

  /* ── 入合作池（管理台「客户列表-入合作池管理」维护 ↔ 合作商终端「客户池」展示，同一运行时互通） ── */
  /** 入合作池配置（键=客户 ID） */
  poolConfigs: Record<string, CustomerPoolConfig>;
  /** 管理台设置某客户入合作池配置（即时生效） */
  setPoolConfig: (customerId: string, cfg: CustomerPoolConfig) => void;

  /* ── 登录 / 账号 ── */
  login: (username: string, password: string) => CustomerAccount | null;
  changePassword: (username: string, oldPassword: string, newPassword: string) => boolean;
  openAccount: (account: CustomerAccount) => void;
  setAccountStatus: (id: string, status: 'active' | 'disabled') => void;
  resetPassword: (id: string, newPassword: string) => void;

  /* ── 购物车 ── */
  addToCart: (item: CartItem) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  reorder: (order: CustomerOrder) => void;

  /* ── 订单 ── */
  placeOrder: (input: {
    customerName: string;
    receiver: string;
    receiverPhone: string;
    receiverAddress: string;
    remark?: string;
  }) => CustomerOrder;
  cancelOrder: (id: string) => void;
  confirmReceipt: (id: string) => void;
  reviewOrder: (id: string, status: CustomerOrderStatus, note?: string) => void;
}

const today = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const nowTime = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${today()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

/** 生成订单编号：KHD + 日期 + 3 位序号（同日递增） */
const genOrderCode = (orders: CustomerOrder[]): string => {
  const dateKey = today().replace(/-/g, '');
  const seq = orders.filter((o) => o.code.includes(dateKey)).length + 1;
  return `KHD${dateKey}${String(seq).padStart(3, '0')}`;
};

/** 客户编号序号：取该类型现有编号的最大序号 + 1（避免删除后复用旧编号） */
const nextCustomerSeq = (customers: CustomerItem[], type: CustomerItem['type']): number => {
  const prefix = { direct: 'KHZY', channel: 'KHQD', personal: 'KHGR', platform: 'KHPT' }[type];
  const max = customers.reduce((m, c) => {
    if (c.type !== type || !c.customerCode) return m;
    const n = Number(c.customerCode.slice(prefix.length + 1));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return max + 1;
};

/** 入合作池演示种子（13 家直营客户）：覆盖 全国/全省/全市/区县 多种范围形态 */
const seedPoolConfigs: Record<string, CustomerPoolConfig> = {
  c1: {
    enabled: true, nationwide: false, provinces: ['北京'], cities: [], districts: [],
    coopRuleText: [
      '1.基础要求：客户为连锁茶庄，要求供货商品提供当季检测报告；礼盒类需带品牌礼袋；拒收破损包装，破损包退换。',
      '2.订单流程：每周三前汇总需求向平台下单，订单经客户采购部邮件确认后生效；紧急补货可电话下单后补单。',
      '3.发货要求：现货商品 48 小时内发货；期货与定制商品按约定交期发货，发货前同步物流单号至客户采购部。',
      '4.结算规则：月结 30 天，次月 10 日前对账开票（增值税专用发票），月底前付款；超期按合同约定计滞纳金。',
      '5.推品规则：按平台每月更新的推品清单优先向客户推介；推品首单可申请额外 3% 支持价，需提前报备。',
      '6.注意事项：发货前请与客户仓库预约收货时段；节假日期间订单顺延处理，重大促销节点（如中秋/春节）需提前 15 天备货。',
    ].join('\n'),
  },
  c6: { enabled: true, nationwide: true, provinces: [], cities: [], districts: [] },
  c3: { enabled: true, nationwide: false, provinces: [], cities: ['广东/广州市'], districts: [] },
  c25: { enabled: true, nationwide: false, provinces: [], cities: ['福建/南平市'], districts: ['福建/南平市/武夷山市'] },
  c26: { enabled: true, nationwide: false, provinces: ['云南'], cities: [], districts: [] },
  c29: { enabled: true, nationwide: false, provinces: [], cities: [], districts: ['云南/西双版纳傣族自治州/勐海县'] },
  c31: { enabled: true, nationwide: false, provinces: [], cities: ['安徽/黄山市'], districts: [] },
  c35: { enabled: true, nationwide: false, provinces: [], cities: [], districts: ['北京/北京市/昌平区'] },
  c36: { enabled: true, nationwide: false, provinces: [], cities: ['广东/广州市'], districts: ['广东/广州市/天河区'] },
  c37: { enabled: true, nationwide: false, provinces: ['上海'], cities: [], districts: [] },
  c24: { enabled: true, nationwide: false, provinces: [], cities: [], districts: ['北京/北京市/海淀区'] },
  c27: { enabled: true, nationwide: false, provinces: ['福建'], cities: ['福建/宁德市'], districts: ['福建/宁德市/福鼎市'] },
  c34: { enabled: true, nationwide: false, provinces: [], cities: ['江苏/南京市'], districts: [] },
};

/** 操作记录演示种子 */
const seedOpRecords: CustomerOpRecord[] = [
  { id: 'op1', customerCode: 'KHZY-0001', time: '2026-10-20 14:30', action: '开通客户采购端', detail: '管理员账号 hmt001 开通，商品与报价由报品报（调）价统一控制', operator: '管理员' },
  { id: 'op2', customerCode: 'KHZY-0006', time: '2026-10-18 10:15', action: '新增经平台销售', detail: '关联平台：京东慧采（扣点 8%）', operator: '管理员' },
];

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: customerItems,
  platforms: platformItems,
  opRecords: seedOpRecords,
  accounts: customerAccounts,
  orders: customerOrders,
  poolConfigs: seedPoolConfigs,
  cart: [],

  /* ── 客户档案 CRUD ── */
  setCustomers: (value) => set((s) => ({ customers: typeof value === 'function' ? value(s.customers) : value })),

  addCustomer: (input) => {
    const customers = get().customers;
    if (customers.some((c) => c.name === input.name)) return { ok: false, msg: `客户名称「${input.name}」已存在，不可重复创建` };
    const seq = nextCustomerSeq(customers, input.type);
    const customerCode = generateCustomerCode(input.type, input.shortName || input.name, seq);
    const customer: CustomerItem = { ...input, customerCode };
    set((s) => ({
      customers: [customer, ...s.customers],
      opRecords: [{ id: `op_${Date.now()}`, customerCode, time: nowTime(), action: '新增客户', detail: `${input.name}（${customerCode}）`, operator: '管理员' }, ...s.opRecords],
    }));
    return { ok: true, msg: `客户 ${input.name} 创建成功（${customerCode}）`, customer };
  },

  updateCustomer: (id, patch) => set((s) => ({
    customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  })),

  removeCustomers: (ids) => set((s) => {
    const removed = s.customers.filter((c) => ids.includes(c.id));
    const removedCodes = new Set(removed.map((c) => c.customerCode));
    const poolConfigs = { ...s.poolConfigs };
    ids.forEach((id) => delete poolConfigs[id]);
    return {
      customers: s.customers.filter((c) => !ids.includes(c.id)),
      poolConfigs,
      accounts: s.accounts.map((a) => (a.customerCode && removedCodes.has(a.customerCode) ? { ...a, status: 'disabled' as const } : a)),
    };
  }),

  convertPersonalToDirect: (id) => {
    const customers = get().customers;
    const target = customers.find((c) => c.id === id);
    if (!target || target.type !== 'personal') return { ok: false, msg: '仅个人客户可转直营' };
    const seq = nextCustomerSeq(customers, 'direct');
    const customerCode = generateCustomerCode('direct', target.shortName || target.name, seq);
    set((s) => ({
      customers: s.customers.map((c) => (c.id === id ? {
        ...c, type: 'direct' as const, viaPlatform: false, customerCode,
        orderContacts: [{ id: `oc-${c.id}-1`, name: c.contactPerson, phone: c.contactPhone, address: c.contactAddress, remark: '由个人客户转换生成' }],
      } : c)),
      opRecords: [{ id: `op_${Date.now()}`, customerCode, time: nowTime(), action: '转直营', detail: `${target.name} 由个人客户转为直营客户（${customerCode}）`, operator: '管理员' }, ...s.opRecords],
    }));
    return { ok: true, msg: `${target.name} 已转为直营客户（${customerCode}）` };
  },

  /* ── 平台档案 CRUD ── */
  setPlatforms: (value) => set((s) => ({ platforms: typeof value === 'function' ? value(s.platforms) : value })),

  addPlatform: (input) => set((s) => ({ platforms: [input, ...s.platforms] })),

  updatePlatform: (id, patch) => set((s) => ({
    platforms: s.platforms.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  })),

  removePlatforms: (ids) => set((s) => ({
    platforms: s.platforms.filter((p) => !ids.includes(p.id)),
    customers: s.customers.map((c) => {
      if (!c.platformIds?.some((pid) => ids.includes(pid))) return c;
      const rates = { ...(c.platformCommissionRates ?? {}) };
      ids.forEach((pid) => delete rates[pid]);
      return { ...c, platformIds: c.platformIds.filter((pid) => !ids.includes(pid)), platformCommissionRates: Object.keys(rates).length ? rates : undefined };
    }),
  })),

  /* ── 操作记录 ── */
  addOpRecord: (customerCode, action, detail) => set((s) => ({
    opRecords: [{ id: `op_${Date.now()}`, customerCode, time: nowTime(), action, detail, operator: '管理员' }, ...s.opRecords],
  })),

  /* ── 入合作池 ── */
  setPoolConfig: (customerId, cfg) => set({
    poolConfigs: { ...get().poolConfigs, [customerId]: cfg },
  }),

  /* ── 登录 / 账号 ── */
  login: (username, password) => {
    const account = get().accounts.find((a) => a.username === username.trim());
    if (!account || account.password !== password || account.status !== 'active') return null;
    set((s) => ({
      accounts: s.accounts.map((a) => (a.id === account.id ? { ...a, lastLogin: nowTime() } : a)),
    }));
    return account;
  },

  changePassword: (username, oldPassword, newPassword) => {
    const account = get().accounts.find((a) => a.username === username);
    if (!account || account.password !== oldPassword) return false;
    set((s) => ({
      accounts: s.accounts.map((a) =>
        a.username === username ? { ...a, password: newPassword } : a,
      ),
    }));
    return true;
  },

  openAccount: (account) =>
    set((s) => ({ accounts: [...s.accounts, account] })),

  setAccountStatus: (id, status) =>
    set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, status } : a)) })),

  resetPassword: (id, newPassword) =>
    set((s) => ({
      accounts: s.accounts.map((a) => (a.id === id ? { ...a, password: newPassword } : a)),
    })),

  /* ── 购物车 ── */
  addToCart: (item) =>
    set((s) => {
      const existing = s.cart.find((c) => c.productId === item.productId);
      return {
        cart: existing
          ? s.cart.map((c) =>
              c.productId === item.productId ? { ...c, quantity: c.quantity + item.quantity } : c,
            )
          : [...s.cart, item],
      };
    }),

  updateCartQuantity: (productId, quantity) =>
    set((s) => ({
      cart: quantity <= 0
        ? s.cart.filter((c) => c.productId !== productId)
        : s.cart.map((c) => (c.productId === productId ? { ...c, quantity } : c)),
    })),

  removeFromCart: (productId) =>
    set((s) => ({ cart: s.cart.filter((c) => c.productId !== productId) })),

  clearCart: () => set({ cart: [] }),

  reorder: (order) => {
    for (const it of order.items) {
      get().addToCart({
        productId: it.productId,
        productName: it.productName,
        spec: it.spec,
        price: it.price,
        quantity: it.quantity,
      });
    }
  },

  /* ── 订单 ── */
  placeOrder: ({ customerName, receiver, receiverPhone, receiverAddress, remark }) => {
    const { cart, orders } = get();
    const totalAmount = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
    const order: CustomerOrder = {
      id: `co_new_${Date.now()}`,
      code: genOrderCode(orders),
      customerName,
      items: cart.map((c) => ({
        productId: c.productId,
        productName: c.productName,
        spec: c.spec,
        quantity: c.quantity,
        price: c.price,
      })),
      totalAmount,
      status: 'pending',
      orderDate: today(),
      receiver,
      receiverPhone,
      receiverAddress,
      remark,
    };
    set({ orders: [order, ...orders], cart: [] });
    return order;
  },

  cancelOrder: (id) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === id && o.status === 'pending' ? { ...o, status: 'cancelled' as const } : o,
      ),
    })),

  confirmReceipt: (id) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === id && o.status === 'delivered' ? { ...o, status: 'completed' as const } : o,
      ),
    })),

  reviewOrder: (id, status, note) =>
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? { ...o, status, sellerNote: note ?? o.sellerNote } : o)),
    })),
}));

/* ── 客户扣点 / 平台扣点辅助（从 data/customers 迁入，读 store 最新值） ── */

/** 平台扣点%（客户档案现值：按客户名 + 平台 ID 查 platformCommissionRates，如 "8%" → 8；未配置为 0） */
export function customerPlatformRate(customerName: string, platformId?: string): number {
  if (!platformId) return 0;
  const raw = useCustomerStore.getState().customers.find((c) => c.name === customerName)?.platformCommissionRates?.[platformId];
  const n = raw ? parseFloat(raw) : NaN;
  return Number.isFinite(n) ? n : 0;
}

/** 订单平台扣点%（订单价格快照规则：platformRateSnapshot 下单快照优先；缺省回退客户档案现值——按编号优先、名称兜底；非经平台订单为 0） */
export function orderPlatformRate(o: {
  salesPath?: string;
  platformCustomerId?: string;
  customerCode?: string;
  customerName?: string;
  platformRateSnapshot?: number;
}): number {
  if (o.salesPath !== 'via_platform') return 0;
  if (o.platformRateSnapshot !== undefined) return o.platformRateSnapshot;
  const cust = customerByRef(o.customerCode, o.customerName);
  const raw = cust?.platformCommissionRates?.[o.platformCustomerId ?? ''];
  const n = raw ? parseFloat(raw) : NaN;
  return Number.isFinite(n) ? n : 0;
}

/** 按客户编号优先、名称兜底匹配客户档案（销售单自 2026-11-28 起携带 customerCode） */
export function customerByRef(customerCode?: string, customerName?: string): CustomerItem | undefined {
  const customers = useCustomerStore.getState().customers;
  if (customerCode) {
    const byCode = customers.find((c) => c.customerCode === customerCode);
    if (byCode) return byCode;
  }
  return customers.find((c) => c.name === customerName);
}

/** 客户扣点%（按编号优先匹配档案 customerRate；未设置为 0。扣点模式采购价 = 销售实价 ×（1 − 客户扣点 − 平台扣点）） */
export function customerRateOf(customerCode?: string, customerName?: string): number {
  const rate = customerByRef(customerCode, customerName)?.customerRate;
  return typeof rate === 'number' && Number.isFinite(rate) ? rate : 0;
}
