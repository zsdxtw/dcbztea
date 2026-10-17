import type { ReactNode } from 'react';
import { PageHead, Pill } from '../partner/PartnerUI';
import type { PillTone } from '../partner/PartnerUI';

/** 客户终端共享 UI：复用合作商终端设计组件（页头 / 药丸标签） */
export { PageHead, Pill };
export type { PillTone };

/* ── 客户终端订单状态 → 色调映射 ── */
export const CUST_ORDER_STATUS_TONE: Record<string, PillTone> = {
  pending: 'amber', confirmed: 'blue', shipping: 'purple',
  delivered: 'green', completed: 'gray', cancelled: 'red',
};

/** 客户终端登录态 */
export interface CustomerAuth {
  username: string;
  /** 账号名称（如联系人姓名） */
  name: string;
  /** 关联直营客户名称 */
  customerName: string;
  /** 账号 ID（store 内定位用） */
  accountId: string;
}

export function getCustomerAuth(): CustomerAuth | null {
  try {
    const raw = localStorage.getItem('customerAuth');
    return raw ? (JSON.parse(raw) as CustomerAuth) : null;
  } catch {
    return null;
  }
}

export function setCustomerAuth(auth: CustomerAuth) {
  localStorage.setItem('customerAuth', JSON.stringify(auth));
}

export function clearCustomerAuth() {
  localStorage.removeItem('customerAuth');
}
