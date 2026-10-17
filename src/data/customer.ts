/**
 * 客户终端（直营客户下单终端）Mock 数据源
 * 包含：客户可购商品目录（上架茶叶）、下单账号、客户终端订单、标签映射
 */
import type { CustomerAccount, CustomerOrder } from '../types';
import { teaProducts } from './teaProducts';

/* ── 客户可购商品目录（上架在售茶叶） ── */
export interface CustomerCatalogProduct {
  id: string;
  name: string;
  brand: string;
  /** 茶类（如"绿茶"） */
  teaCategory: string;
  /** 细分类目（如"西湖龙井"） */
  category: string;
  spec: string;
  /** 客户价（销售价） */
  salesPrice: number;
  /** 市场价 */
  marketPrice: number;
  stock: number;
  origin: string;
  grade: string;
  shelfLife: number;
  features: string;
}

export const customerCatalog: CustomerCatalogProduct[] = teaProducts
  .filter((p) => p.shelfStatus === 'on')
  .map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    teaCategory: p.category.split('-')[0],
    category: p.category.split('-')[1] ?? p.category,
    spec: p.spec,
    salesPrice: p.salesPrice,
    marketPrice: p.marketPrice,
    stock: p.stock,
    origin: p.origin,
    grade: p.grade,
    shelfLife: p.shelfLife,
    features: p.features,
  }));

/** 商品目录筛选项 */
export const CATALOG_TEA_CATEGORIES = [...new Set(customerCatalog.map((p) => p.teaCategory))];
export const CATALOG_BRANDS = [...new Set(customerCatalog.map((p) => p.brand))];

/* ── 下单账号（管理台开通，客户终端登录使用；关联直营客户） ── */
export const customerAccounts: CustomerAccount[] = [
  {
    id: 'ca1', username: 'hmt001', password: '123456',
    name: '张明华', customerName: '华茗堂茶庄', customerCode: 'KHZY-00001',
    phone: '010-8234****', status: 'active', createTime: '2026-08-01',
    lastLogin: '2026-10-16 09:30', remark: '主联系人账号，月结客户',
  },
  {
    id: 'ca2', username: 'qxf001', password: '123456',
    name: '李雅芳', customerName: '清心茶坊', customerCode: 'KHZY-00002',
    phone: '0571-8612****', status: 'active', createTime: '2026-09-05',
    lastLogin: '2026-10-15 16:42', remark: 'S 级客户，高端茶品需求大',
  },
];

/* ── 客户终端订单（客户自助下单） ── */
export const customerOrders: CustomerOrder[] = [
  {
    id: 'co1', code: 'KHD20261012001', customerName: '华茗堂茶庄',
    items: [
      { productId: '1', productName: '西湖龙井·明前特级', spec: '50g/罐', quantity: 30, price: 452 },
      { productId: '2', productName: '碧螺春·一级', spec: '100g/袋', quantity: 20, price: 328 },
    ],
    totalAmount: 20120, status: 'pending', orderDate: '2026-10-12',
    receiver: '张明华', receiverPhone: '010-8234****', receiverAddress: '北京市西城区马连道16号',
    remark: '月底门店补货，请安排发顺丰',
  },
  {
    id: 'co2', code: 'KHD20260928002', customerName: '华茗堂茶庄',
    items: [{ productId: '4', productName: '黄山毛峰·特级', spec: '50g/罐', quantity: 24, price: 359 }],
    totalAmount: 8616, status: 'shipping', orderDate: '2026-09-28',
    receiver: '张明华', receiverPhone: '010-8234****', receiverAddress: '北京市西城区马连道16号',
  },
  {
    id: 'co3', code: 'KHD20260915003', customerName: '华茗堂茶庄',
    items: [
      { productId: '1', productName: '西湖龙井·明前特级', spec: '50g/罐', quantity: 40, price: 452 },
      { productId: '6', productName: '正山小种·特级', spec: '100g/罐', quantity: 30, price: 384 },
    ],
    totalAmount: 29600, status: 'delivered', orderDate: '2026-09-15',
    receiver: '李经理', receiverPhone: '010-8234****', receiverAddress: '北京市西城区马连道16号',
    remark: '中秋备货',
  },
  {
    id: 'co4', code: 'KHD20260902004', customerName: '华茗堂茶庄',
    items: [{ productId: '2', productName: '碧螺春·一级', spec: '100g/袋', quantity: 50, price: 328 }],
    totalAmount: 16400, status: 'completed', orderDate: '2026-09-02',
    receiver: '张明华', receiverPhone: '010-8234****', receiverAddress: '北京市西城区马连道16号',
    sellerNote: '已按合同价发货，随货附检测报告',
  },
  {
    id: 'co5', code: 'KHD20261011005', customerName: '清心茶坊',
    items: [{ productId: '7', productName: '金骏眉·特级', spec: '50g/罐', quantity: 16, price: 1024 }],
    totalAmount: 16384, status: 'confirmed', orderDate: '2026-10-11',
    receiver: '李雅芳', receiverPhone: '0571-8612****', receiverAddress: '杭州市西湖区龙井路88号',
    remark: '老客回购，优先安排',
  },
  {
    id: 'co6', code: 'KHD20260926006', customerName: '清心茶坊',
    items: [
      { productId: '13', productName: '白毫银针·特级', spec: '50g/罐', quantity: 12, price: 768 },
      { productId: '9', productName: '祁门红茶·特级', spec: '100g/罐', quantity: 20, price: 368 },
    ],
    totalAmount: 16576, status: 'completed', orderDate: '2026-09-26',
    receiver: '李雅芳', receiverPhone: '0571-8612****', receiverAddress: '杭州市西湖区龙井路88号',
  },
  {
    id: 'co7', code: 'KHD20260908007', customerName: '清心茶坊',
    items: [{ productId: '8', productName: '滇红·金芽特级', spec: '100g/罐', quantity: 30, price: 224 }],
    totalAmount: 6720, status: 'cancelled', orderDate: '2026-09-08',
    receiver: '李雅芳', receiverPhone: '0571-8612****', receiverAddress: '杭州市西湖区龙井路88号',
    remark: '临时资金安排，先取消',
    sellerNote: '已取消，未发货不产生费用',
  },
];

/* ── 标签配置 ── */
export const CUSTOMER_ORDER_STATUS_LABELS: Record<string, string> = {
  pending: '待确认', confirmed: '已确认', shipping: '配送中',
  delivered: '已送达', completed: '已完成', cancelled: '已取消',
};
export const CUSTOMER_ACCOUNT_STATUS_LABELS: Record<string, string> = { active: '正常', disabled: '已停用' };
