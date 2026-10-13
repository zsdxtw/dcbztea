import { create } from 'zustand';
import type { TeaProduct, PurchasePriceRule } from '../types';
import { teaProducts } from '../data/teaProducts';
import { purchasePriceRules, salesQuotationRules, calcPlatformNetPrice, type SalesQuotationRule } from '../data/prices';

/**
 * 价格体系共享数据源
 * 基准价（市场价/天猫价/京东价/销售价）→ 商品档案（商品管理维护）
 * 采购价（商品+供应商）→ 采购报（调）价维护
 * 销售报价（商品+客户）→ 销售报（调）价维护
 * 价格管理页调价后通过本 store 联动更新以上数据来源
 */
interface PriceStore {
  /** 商品档案（含基准价） */
  products: TeaProduct[];
  /** 采购价规则（商品+供应商） */
  purchaseRules: PurchasePriceRule[];
  /** 销售报价规则（商品+客户） */
  salesQuotations: SalesQuotationRule[];

  /** 新增商品（商品管理新增时调用） */
  addProduct: (p: TeaProduct) => void;
  /** 批量删除商品 */
  deleteProducts: (ids: string[]) => void;
  /** 更新商品档案字段 */
  updateProduct: (id: string, patch: Partial<TeaProduct>) => void;
  /** 调整商品基准价（价格管理联动商品管理；同步冗余字段） */
  updateProductPrices: (id: string, patch: { marketPrice?: number; tmallPrice?: number; jdPrice?: number; salesPrice?: number }) => void;
  /** 调整采购价（价格管理联动采购报（调）价） */
  updatePurchaseRulePrice: (ruleId: string, price: number) => void;
  /** 调整销售报价（价格管理联动销售报（调）价） */
  updateSalesQuotationPrice: (ruleId: string, price: number) => void;
}

export const usePriceStore = create<PriceStore>((set) => ({
  products: teaProducts,
  purchaseRules: purchasePriceRules,
  salesQuotations: salesQuotationRules,

  addProduct: (p) => set((s) => ({ products: [...s.products, p] })),

  deleteProducts: (ids) => set((s) => ({ products: s.products.filter((p) => !ids.includes(p.id)) })),

  updateProduct: (id, patch) => set((s) => ({
    products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  })),

  updateProductPrices: (id, patch) => set((s) => {
    const products = s.products.map((p) => (p.id === id ? { ...p, ...patch } : p));
    const target = products.find((p) => p.id === id);
    let purchaseRules = s.purchaseRules;
    let salesQuotations = s.salesQuotations;
    if (patch.marketPrice !== undefined && target) {
      // 联动冗余字段：采购价规则 / 销售报价中的市场价
      purchaseRules = purchaseRules.map((r) => (r.productId === id
        ? { ...r, marketPrice: patch.marketPrice!, discountRate: patch.marketPrice! > 0 ? Math.round((r.purchasePrice / patch.marketPrice!) * 100) : 0 }
        : r));
      salesQuotations = salesQuotations.map((r) => (r.productId === id
        ? { ...r, marketPrice: patch.marketPrice! }
        : r));
    }
    if (patch.salesPrice !== undefined && target) {
      // 联动冗余字段：销售报价中的标准销售价
      salesQuotations = salesQuotations.map((r) => (r.productId === id ? { ...r, salesPrice: patch.salesPrice! } : r));
    }
    return { products, purchaseRules, salesQuotations };
  }),

  updatePurchaseRulePrice: (ruleId, price) => set((s) => ({
    purchaseRules: s.purchaseRules.map((r) => {
      if (r.id !== ruleId) return r;
      const lastAdjustDate = new Date().toISOString().slice(0, 10);
      return {
        ...r,
        purchasePrice: price,
        discountRate: r.marketPrice > 0 ? Math.round((price / r.marketPrice) * 100) : 0,
        lastAdjustDate,
        lastAdjustNote: '价格管理调价',
      };
    }),
  })),

  updateSalesQuotationPrice: (ruleId, price) => set((s) => ({
    salesQuotations: s.salesQuotations.map((r) => {
      if (r.id !== ruleId) return r;
      const updated: SalesQuotationRule = { ...r, quotedPrice: price };
      // 经平台直营客户：联动重算平台实得价
      if (r.quotationType === 'direct_with_platform' && r.platformCommissionRate) {
        updated.platformNetPrice = calcPlatformNetPrice(price, r.platformCommissionRate);
      }
      return updated;
    }),
  })),
}));

/* ── 区间工具 ── */

/** 商品采购价区间（多供应商） */
export function getPurchaseRange(rules: PurchasePriceRule[], productId: string): { min: number; max: number; count: number } {
  const prices = rules.filter((r) => r.productId === productId && r.status === 'active').map((r) => r.purchasePrice);
  if (prices.length === 0) return { min: 0, max: 0, count: 0 };
  return { min: Math.min(...prices), max: Math.max(...prices), count: prices.length };
}

/** 商品销售报价区间（多客户） */
export function getSalesQuotationRange(rules: SalesQuotationRule[], productId: string): { min: number; max: number; count: number } {
  const prices = rules.filter((r) => r.productId === productId && r.status === 'active').map((r) => r.quotedPrice);
  if (prices.length === 0) return { min: 0, max: 0, count: 0 };
  return { min: Math.min(...prices), max: Math.max(...prices), count: prices.length };
}
