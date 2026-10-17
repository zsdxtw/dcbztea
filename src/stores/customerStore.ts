import { create } from 'zustand';
import type { CartItem, CustomerAccount, CustomerOrder, CustomerOrderStatus } from '../types';
import { customerAccounts, customerOrders } from '../data/customer';

/* ── 共享客户终端 Store（管理台开通账号/推进订单 ↔ 客户终端登录/下单，同一运行时互通） ── */

interface CustomerState {
  /** 下单账号（管理台开通） */
  accounts: CustomerAccount[];
  /** 客户终端订单 */
  orders: CustomerOrder[];
  /** 购物车（客户终端会话内共享） */
  cart: CartItem[];

  /* ── 登录 / 账号 ── */
  /** 校验登录：返回账号（成功）或 null（失败） */
  login: (username: string, password: string) => CustomerAccount | null;
  changePassword: (username: string, oldPassword: string, newPassword: string) => boolean;

  /* ── 管理台账号管理 ── */
  /** 管理台开通下单账号 */
  openAccount: (account: CustomerAccount) => void;
  /** 管理台启用/停用账号 */
  setAccountStatus: (id: string, status: 'active' | 'disabled') => void;
  /** 管理台重置密码 */
  resetPassword: (id: string, newPassword: string) => void;

  /* ── 购物车 ── */
  addToCart: (item: CartItem) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  /** 再来一单：将历史订单商品重新加入购物车 */
  reorder: (order: CustomerOrder) => void;

  /* ── 订单 ── */
  /** 客户终端提交订单 */
  placeOrder: (input: {
    customerName: string;
    receiver: string;
    receiverPhone: string;
    receiverAddress: string;
    remark?: string;
  }) => CustomerOrder;
  /** 客户取消待确认订单 */
  cancelOrder: (id: string) => void;
  /** 客户确认收货（已送达 → 已完成） */
  confirmReceipt: (id: string) => void;
  /** 管理台推进订单状态 */
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

export const useCustomerStore = create<CustomerState>((set, get) => ({
  accounts: customerAccounts,
  orders: customerOrders,
  cart: [],

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

  /* ── 管理台账号管理 ── */
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
