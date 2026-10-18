/**
 * 价格体系数据源
 * 包含：采购价规则（商品+供应商）、VIP销售价规则（商品+客户）
 * 基准价（市场价/京东价/天猫价/销售价）存储于商品档案 teaProducts.tsx
 * 订单实价（采购实价/销售实价）存储于订单明细，见 PurchaseOrders.tsx / SalesOrders.tsx
 */
import type { PurchasePriceRule, VipPriceRule } from '../types';
import { teaProducts } from './teaProducts';

/* ── 供应商列表（与 ProductPrice.tsx 保持一致；type 用于区分品牌方/合作商报价） ── */
export const PRICE_SUPPLIERS = [
  { id: 's1', name: '西湖龙井合作社', type: 'brand' as const },
  { id: 's2', name: '武夷山茶业', type: 'partner' as const },
  { id: 's3', name: '安溪铁观音集团', type: 'partner' as const },
  { id: 's4', name: '福鼎白茶厂', type: 'partner' as const },
  { id: 's5', name: '云南普洱茶业', type: 'partner' as const },
  { id: 's6', name: '正山堂茶业', type: 'brand' as const },
  { id: 's7', name: '八马茶业供应链', type: 'partner' as const },
  { id: 's8', name: '大益集团', type: 'brand' as const },
];

/* ── 客户列表（与 ProductPrice.tsx 保持一致） ── */
export const PRICE_CUSTOMERS = [
  { id: 'c1', name: '华茗堂茶庄', type: '直营' },
  { id: 'c2', name: '清心茶坊', type: '直营' },
  { id: 'c3', name: '浦发银行', type: '间营' },
  { id: 'c4', name: '交通银行', type: '间营' },
  { id: 'c5', name: '天福茗茶（渠道）', type: '渠道' },
  { id: 'c6', name: '八马茶业（渠道）', type: '渠道' },
  { id: 'c7', name: '茶道达人小李', type: '带货' },
  { id: 'c8', name: '茗香阁直播', type: '带货' },
];

/* ── 采购价规则数据 ── */
function generatePurchasePriceRules(): PurchasePriceRule[] {
  const rules: PurchasePriceRule[] = [];
  let idx = 0;
  // 每个商品关联 2-3 个供应商
  teaProducts.forEach(p => {
    const supplierCount = 2 + (idx % 2);
    const usedSuppliers = PRICE_SUPPLIERS.slice(idx % PRICE_SUPPLIERS.length, (idx % PRICE_SUPPLIERS.length) + supplierCount);
    usedSuppliers.forEach(s => {
      // 采购折扣率 45%-65%
      const discount = 0.45 + ((idx * 7) % 20) / 100;
      const purchasePrice = Math.round(p.marketPrice * discount);
      rules.push({
        id: `ppr_${++idx}`,
        productId: p.id,
        productName: p.name,
        brand: p.brand,
        category: p.category.split('-')[0],
        supplierId: s.id,
        supplierName: s.name,
        marketPrice: p.marketPrice,
        purchasePrice,
        discountRate: Math.round(discount * 100),
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        status: 'active',
        lastAdjustDate: '2026-06-01',
        lastAdjustNote: '年度调价',
      });
    });
  });
  return rules;
}

export const purchasePriceRules: PurchasePriceRule[] = generatePurchasePriceRules();

/* ── VIP 销售价规则数据 ── */
function generateVipPriceRules(): VipPriceRule[] {
  const rules: VipPriceRule[] = [];
  let idx = 0;
  // 前 15 个商品，每个关联 3-4 个客户
  teaProducts.slice(0, 15).forEach(p => {
    const customerCount = 3 + (idx % 2);
    const usedCustomers = PRICE_CUSTOMERS.slice(idx % PRICE_CUSTOMERS.length, (idx % PRICE_CUSTOMERS.length) + customerCount);
    usedCustomers.forEach(c => {
      // VIP 折扣率：直营 85-95%、间营 80-90%、渠道 70-80%、带货 75-85%
      const baseRate = c.type === '直营' ? 0.85 : c.type === '间营' ? 0.80 : c.type === '渠道' ? 0.70 : 0.75;
      const discount = baseRate + ((idx * 3) % 10) / 100;
      const vipPrice = Math.round(p.marketPrice * discount);
      rules.push({
        id: `vip_${++idx}`,
        productId: p.id,
        productName: p.name,
        brand: p.brand,
        category: p.category.split('-')[0],
        customerId: c.id,
        customerName: c.name,
        customerType: c.type,
        marketPrice: p.marketPrice,
        salesPrice: p.salesPrice,
        vipPrice,
        discountRate: Math.round(discount * 100),
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        status: 'active',
        remark: `${c.type}客户专属价`,
      });
    });
  });
  return rules;
}

export const vipPriceRules: VipPriceRule[] = generateVipPriceRules();

/* ── 工具函数 ── */

/** 根据商品ID和供应商ID获取采购价 */
export function getPurchasePrice(productId: string, supplierId: string): PurchasePriceRule | undefined {
  return purchasePriceRules.find(r => r.productId === productId && r.supplierId === supplierId && r.status === 'active');
}

/** 根据商品ID和客户ID获取VIP销售价 */
export function getVipPrice(productId: string, customerId: string): VipPriceRule | undefined {
  return vipPriceRules.find(r => r.productId === productId && r.customerId === customerId && r.status === 'active');
}

/**
 * 销售下单取价：VIP价 > 销售价 > 市场价
 * 返回 { price, source }
 */
export function getSalesDefaultPrice(productId: string, customerId: string): { price: number; source: 'vip' | 'sales' | 'market' } {
  const vip = getVipPrice(productId, customerId);
  if (vip) return { price: vip.vipPrice, source: 'vip' };

  const product = teaProducts.find(p => p.id === productId);
  if (product) {
    if (product.salesPrice) return { price: product.salesPrice, source: 'sales' };
    return { price: product.marketPrice, source: 'market' };
  }
  return { price: 0, source: 'market' };
}

/**
 * 采购下单取价：采购价 > 市场价 × 采购折扣率
 * 返回 { price, source }
 */
export function getPurchaseDefaultPrice(productId: string, supplierId: string): { price: number; source: 'purchase' | 'market' } {
  const rule = getPurchasePrice(productId, supplierId);
  if (rule) return { price: rule.purchasePrice, source: 'purchase' };

  const product = teaProducts.find(p => p.id === productId);
  if (product) return { price: Math.round(product.marketPrice * 0.55), source: 'market' };
  return { price: 0, source: 'market' };
}

/* ── 中位数统计（合作商终端报价菜单展示，数据来源于管理后台） ── */

const average = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null);

/**
 * 中位数报价：去除品牌方报价外，其余合作商（合作方）报价的平均数
 * 数据源：采购价规则（商品 + 供应商）
 */
export function getMedianQuote(productId: string): number | null {
  const quotes = purchasePriceRules.filter(r => r.productId === productId && r.status === 'active');
  if (quotes.length === 0) return null;
  const partnerQuotes = quotes.filter(q => PRICE_SUPPLIERS.find(s => s.id === q.supplierId)?.type !== 'brand');
  const pool = partnerQuotes.length > 0 ? partnerQuotes : quotes;
  return average(pool.map(q => q.purchasePrice));
}

/**
 * 中位数售价：所有客户售价的平均数
 * 数据源：商品标准销售价 + 各客户 VIP 销售价（管理后台价格规则）
 */
export function getMedianSalesPrice(productId: string): number | null {
  const product = teaProducts.find(p => p.id === productId);
  if (!product) return null;
  const vipPrices = vipPriceRules.filter(r => r.productId === productId && r.status === 'active').map(r => r.vipPrice);
  const pool = [product.salesPrice, ...vipPrices].filter(v => v > 0);
  return average(pool);
}

/* ════════════════════════════════════════════════════════════
 * 销售报价规则（SalesQuotationRule）
 * 按客户类型分区管理：
 *   1. 直营不经平台：商品 + 客户 → 唯一报价
 *   2. 直营经平台：商品 + 客户 → 报价，平台实得价 = 报价 × (1-扣点)
 *   3. 渠道客户：商品 + 客户 → 唯一报价
 *   4. 个人客户：商品 + 等级 → 最低销售价
 * ════════════════════════════════════════════════════════════ */

/** 销售报价类型 */
export type QuotationType = 'direct_no_platform' | 'direct_with_platform' | 'channel' | 'personal_by_level';

/** 销售报价规则 */
export interface SalesQuotationRule {
  id: string;
  productId: string;
  productName: string;
  brand: string;
  category: string;
  marketPrice: number;
  salesPrice: number;
  /** 报价类型 */
  quotationType: QuotationType;
  /** 客户 ID（直营/渠道） */
  customerId?: string;
  customerName?: string;
  /** 平台 ID（经平台直营客户） */
  platformId?: string;
  platformName?: string;
  /** 平台扣点（如 '8%'） */
  platformCommissionRate?: string;
  /** 报价金额 */
  quotedPrice: number;
  /** 平台实得价（经平台直营客户自动计算：报价 × (1-扣点)） */
  platformNetPrice?: number;
  /** 个人客户等级（仅个人客户报价） */
  personalLevel?: string;
  validFrom: string;
  validTo: string;
  status: 'active' | 'inactive';
  remark?: string;
}

/** 个人客户等级列表 */
export const PERSONAL_LEVELS = ['S级', 'A级', 'B级', 'C级'];

/** 生成销售报价规则数据 */
function generateSalesQuotationRules(): SalesQuotationRule[] {
  const rules: SalesQuotationRule[] = [];
  let idx = 0;
  // 取前 8 个商品生成报价数据
  const products = teaProducts.slice(0, 8);

  // 直营不经平台客户（c1-c5）
  const directNoPlatformCustomers = [
    { id: 'c1', name: '华茗堂茶庄' },
    { id: 'c2', name: '清心茶坊' },
    { id: 'c3', name: '品茗轩' },
    { id: 'c4', name: '翠竹茶行' },
    { id: 'c5', name: '云顶茶舍' },
  ];
  // 直营经平台客户（c6-c10）及其平台关联
  const directWithPlatformCustomers = [
    { id: 'c6', name: '浦发银行', platformId: 'p1', platformName: '京东慧采', commission: '8%' },
    { id: 'c7', name: '交通银行', platformId: 'p2', platformName: '史泰博', commission: '6%' },
    { id: 'c8', name: '中信证券', platformId: 'p1', platformName: '京东慧采', commission: '7%' },
    { id: 'c9', name: '中国平安', platformId: 'p4', platformName: '苏宁', commission: '7%' },
    { id: 'c10', name: '招商银行', platformId: 'p2', platformName: '史泰博', commission: '6%' },
  ];
  // 渠道客户（c11-c15）
  const channelCustomers = [
    { id: 'c11', name: '天福茗茶' },
    { id: 'c12', name: '八马茶业' },
    { id: 'c13', name: '大益茶体验馆' },
    { id: 'c14', name: '茶里王国' },
    { id: 'c15', name: '正山堂旗舰店' },
  ];

  // 1. 直营不经平台报价：折扣率 88-95%
  directNoPlatformCustomers.forEach(c => {
    products.forEach((p, pi) => {
      const discount = 0.88 + ((idx * 2) % 8) / 100;
      const quotedPrice = Math.round(p.marketPrice * discount);
      rules.push({
        id: `sq_${++idx}`,
        productId: p.id, productName: p.name, brand: p.brand,
        category: p.category.split('-')[0],
        marketPrice: p.marketPrice, salesPrice: p.salesPrice,
        quotationType: 'direct_no_platform',
        customerId: c.id, customerName: c.name,
        quotedPrice,
        validFrom: '2026-01-01', validTo: '2026-12-31',
        status: 'active',
        remark: `${c.name}专属报价`,
      });
    });
  });

  // 2. 直营经平台报价：折扣率 85-92%，平台实得价 = 报价 × (1-扣点)
  directWithPlatformCustomers.forEach(c => {
    products.forEach((p, pi) => {
      const discount = 0.85 + ((idx * 3) % 8) / 100;
      const quotedPrice = Math.round(p.marketPrice * discount);
      const commissionNum = parseFloat(c.commission) / 100;
      const platformNetPrice = Math.round(quotedPrice * (1 - commissionNum));
      rules.push({
        id: `sq_${++idx}`,
        productId: p.id, productName: p.name, brand: p.brand,
        category: p.category.split('-')[0],
        marketPrice: p.marketPrice, salesPrice: p.salesPrice,
        quotationType: 'direct_with_platform',
        customerId: c.id, customerName: c.name,
        platformId: c.platformId, platformName: c.platformName,
        platformCommissionRate: c.commission,
        quotedPrice, platformNetPrice,
        validFrom: '2026-01-01', validTo: '2026-12-31',
        status: 'active',
        remark: `${c.name}经${c.platformName}报价`,
      });
    });
  });

  // 3. 渠道客户报价：折扣率 75-85%
  channelCustomers.forEach(c => {
    products.forEach((p, pi) => {
      const discount = 0.75 + ((idx * 5) % 11) / 100;
      const quotedPrice = Math.round(p.marketPrice * discount);
      rules.push({
        id: `sq_${++idx}`,
        productId: p.id, productName: p.name, brand: p.brand,
        category: p.category.split('-')[0],
        marketPrice: p.marketPrice, salesPrice: p.salesPrice,
        quotationType: 'channel',
        customerId: c.id, customerName: c.name,
        quotedPrice,
        validFrom: '2026-01-01', validTo: '2026-12-31',
        status: 'active',
        remark: `${c.name}渠道报价`,
      });
    });
  });

  // 4. 个人客户按等级报价：折扣率 S级82% / A级78% / B级72% / C级65%
  const levelDiscounts: Record<string, number> = { 'S级': 0.82, 'A级': 0.78, 'B级': 0.72, 'C级': 0.65 };
  PERSONAL_LEVELS.forEach(level => {
    products.forEach((p, pi) => {
      const baseDiscount = levelDiscounts[level];
      const discount = baseDiscount + ((idx * 2) % 5) / 100;
      const quotedPrice = Math.round(p.marketPrice * discount);
      rules.push({
        id: `sq_${++idx}`,
        productId: p.id, productName: p.name, brand: p.brand,
        category: p.category.split('-')[0],
        marketPrice: p.marketPrice, salesPrice: p.salesPrice,
        quotationType: 'personal_by_level',
        personalLevel: level,
        quotedPrice,
        validFrom: '2026-01-01', validTo: '2026-12-31',
        status: 'active',
        remark: `${level}个人客户最低销售价`,
      });
    });
  });

  return rules;
}

export const salesQuotationRules: SalesQuotationRule[] = generateSalesQuotationRules();

/** 根据商品ID和客户ID获取直营/渠道客户报价 */
export function getSalesQuotation(productId: string, customerId: string): SalesQuotationRule | undefined {
  return salesQuotationRules.find(r => r.productId === productId && r.customerId === customerId && r.status === 'active');
}

/** 根据商品ID和个人客户等级获取最低销售价 */
export function getPersonalMinPrice(productId: string, level: string): number {
  const rule = salesQuotationRules.find(r => r.productId === productId && r.personalLevel === level && r.status === 'active');
  return rule?.quotedPrice ?? 0;
}

/** 计算平台实得价 */
export function calcPlatformNetPrice(quotedPrice: number, commissionRate: string): number {
  const commissionNum = parseFloat(commissionRate) / 100;
  return Math.round(quotedPrice * (1 - commissionNum));
}
