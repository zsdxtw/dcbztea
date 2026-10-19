/** 仓库设置共享数据源
 * - 独立仓库：自有的纯仓库，本模块维护，可在仓库设置中增删改查
 * - 门店仓库：由「销售 > 门店管理」中的门店数据派生（联动门店地址），在仓库设置中只读展示
 * - 合作仓库：由合作商管理中的仓库数据派生（联动），在仓库设置中只读展示
 */
import type { Warehouse } from '../types';
import { supplierItems } from './suppliers';
import { storeItems } from './stores';

/** 独立仓库初始数据（自有的纯仓库） */
export const independentWarehouses: Warehouse[] = [
  { id: 'wh-ind-01', name: '杭州总仓', code: 'WH-HZ-01', province: '浙江', city: '杭州市', district: '西湖区', address: '龙井路88号', manager: '李仓管', phone: '0571-8766****', category: 'independent', enabled: true, isDefault: true },
  { id: 'wh-ind-02', name: '武夷仓区', code: 'WH-WY-01', province: '福建', city: '南平市', district: '武夷山市', address: '星村镇茶博路12号', manager: '张仓管', phone: '0599-512****', category: 'independent', enabled: true, isDefault: false },
  { id: 'wh-ind-03', name: '苏州分仓', code: 'WH-SZ-01', province: '江苏', city: '苏州市', district: '吴中区', address: '洞庭山路56号', manager: '王仓管', phone: '0512-662****', category: 'independent', enabled: true, isDefault: false },
  { id: 'wh-ind-04', name: '福鼎分仓', code: 'WH-FD-01', province: '福建', city: '宁德市', district: '福鼎市', address: '点头镇茶青市场旁', manager: '陈仓管', phone: '0593-787****', category: 'independent', enabled: true, isDefault: false },
  { id: 'wh-ind-05', name: '云南总仓', code: 'WH-YN-01', province: '云南', city: '西双版纳州', district: '勐海县', address: '勐海镇茶厂路33号', manager: '刘仓管', phone: '0691-512****', category: 'independent', enabled: true, isDefault: false },
  { id: 'wh-ind-06', name: '安溪分仓', code: 'WH-AX-01', province: '福建', city: '泉州市', district: '安溪县', address: '感德镇茶叶市场7号', manager: '赵仓管', phone: '0595-232****', category: 'independent', enabled: false, isDefault: false },
];

/** 自有仓库（仅独立仓库，门店仓库由门店数据派生） */
export const ownWarehouses: Warehouse[] = [...independentWarehouses];

/** 从门店数据派生门店仓库列表（联动「销售 > 门店管理」） */
export function getStoreWarehouses(): Warehouse[] {
  return storeItems.map((s, idx) => ({
    id: `wh-store-${s.id}`,
    name: `${s.name}仓`,
    code: `WH-ST-${String(idx + 1).padStart(2, '0')}`,
    address: `${s.province}${s.city}${s.district}${s.address}`,
    manager: s.manager,
    phone: s.phone,
    category: 'store' as const,
    enabled: s.status === 'active',
    isDefault: false,
    supplierId: s.id,
    supplierName: s.name,
  }));
}

/** 从供应商数据派生合作仓库列表（联合作商管理） */
export function getPartnerWarehouses(): Warehouse[] {
  return supplierItems.flatMap(s =>
    s.warehouses.map((w, idx) => ({
      id: `wh-pt-${s.id}-${w.id}`,
      name: w.name,
      code: `WH-PT-${s.id.padStart(3, '0')}-${String(idx + 1).padStart(2, '0')}`,
      address: w.address,
      manager: w.contactPerson,
      phone: w.contactPhone,
      category: 'partner' as const,
      enabled: s.status === 'active',
      isDefault: w.isDefault,
      supplierId: s.id,
      supplierName: s.name,
    })),
  );
}

/** 仓库归属类型标签 */
export const WAREHOUSE_CATEGORY_LABELS: Record<Warehouse['category'], string> = {
  independent: '独立仓库',
  store: '门店仓库',
  partner: '合作仓库',
};

/** 仓库归属类型颜色 */
export const WAREHOUSE_CATEGORY_COLORS: Record<Warehouse['category'], string> = {
  independent: 'var(--color-module-current-base)',
  store: '#01795D',
  partner: '#0DAFC6',
};
