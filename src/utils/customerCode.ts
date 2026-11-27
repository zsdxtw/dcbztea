/**
 * 客户编号生成工具
 *
 * 编号规则（4位数字，各类型单独从 0001 开始）：
 * - 直营客户：KHZY-0001
 * - 渠道客户：KHQD-0001
 * - 平台客户：KHPT-0001
 */

import type { CustomerType } from '../types';

/** 客户类型前缀映射 */
const TYPE_PREFIX: Record<CustomerType, string> = {
  direct: 'KHZY',
  channel: 'KHQD',
  personal: 'KHGR',
  platform: 'KHPT',
};

/**
 * 生成客户编号
 * @param type 客户类型
 * @param shortName 客户简称（保留参数兼容，新规则不使用）
 * @param sequence 该类型下的顺序号（1-based）
 */
export function generateCustomerCode(type: CustomerType, shortName: string, sequence: number): string {
  const prefix = TYPE_PREFIX[type];
  const seq = String(sequence).padStart(4, '0');
  return `${prefix}-${seq}`;
}
