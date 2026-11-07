import { create } from 'zustand';
import type { TeaProduct, PurchasePriceRule } from '../types';
import { teaProducts } from '../data/teaProducts';
import { purchasePriceRules, salesQuotationRules, calcPlatformNetPrice, type SalesQuotationRule } from '../data/prices';
import { customerItems } from '../data/customers';

/**
 * 客户销售报价（销售报（调）价维护，按「商品 + 客户」维度）
 * 取值优先级：单品价格 > 品牌整体折扣（市场价×折扣%）> 未配置。
 * 经平台客户：每个所经平台分别设「经平台销售报价」（默认=客户有效报价×(1−平台扣点)）与平台 SKU。
 */

/** 经平台报价（price 缺省 = 按客户有效报价 ×(1−扣点) 自动折算） */
export interface CustomerPlatformQuote {
  platformId: string;
  /** 平台销售报价（手动设置；缺省=自动折算） */
  price?: number;
  /** 平台 SKU */
  sku: string;
}
/** 单个商品的客户报价（price 缺省 = 按品牌整体折扣计算） */
export interface CustomerProductQuote {
  productId: string;
  /** 单品报价（覆盖单独折扣与品牌折扣；缺省=按单独折扣/品牌折扣） */
  price?: number;
  /** 单品单独折扣（百分比，覆盖品牌整体折扣；与单品报价互斥） */
  discount?: number;
  /** 是否报品（报给该客户可下单；缺省=是；否=合作商终端客户菜单不展示该商品） */
  reported?: boolean;
  /** 经平台客户的各平台报价与 SKU（仅经平台客户有内容） */
  platformQuotes: CustomerPlatformQuote[];
}
/** 单个客户的报价配置 */
export interface CustomerQuoteConfig {
  /** 品牌整体折扣（百分比，如 90 = 市场价的 90%） */
  brandDiscounts: Record<string, number>;
  products: Record<string, CustomerProductQuote>;
}
/** customerId / platformId → 报价配置 */
export type CustomerQuoteMap = Record<string, CustomerQuoteConfig>;

/** 客户报价配置（缺省空配置） */
export function getQuoteConfig(map: CustomerQuoteMap, customerId: string): CustomerQuoteConfig {
  return map[customerId] ?? { brandDiscounts: {}, products: {} };
}

/** 有效销售报价：单品价格 > 品牌折扣（市场价×折扣%）> 未配置 */
export function effectiveCustomerQuote(
  map: CustomerQuoteMap, customerId: string, productId: string, products: { id: string; brand: string; marketPrice: number }[],
): number | undefined {
  const cfg = map[customerId];
  const q = cfg?.products[productId];
  const p = products.find((x) => x.id === productId);
  if (!p) return undefined;
  if (q?.price !== undefined) return q.price;
  if (q?.discount !== undefined) return Math.round(p.marketPrice * q.discount) / 100;
  const discount = cfg?.brandDiscounts[p.brand];
  if (discount !== undefined) return Math.round(p.marketPrice * discount) / 100;
  return undefined;
}

/** 有效经平台报价：平台手设价 > 客户有效报价 ×(1−扣点)；客户未配置该商品则无报价 */
export function effectivePlatformQuote(
  map: CustomerQuoteMap, customerId: string, productId: string, platformId: string,
  products: { id: string; brand: string; marketPrice: number }[], commissionRate: string,
): number | undefined {
  // 经平台报价为单独设置的价格（不经公司自动计算）；未设置则无报价
  const pq = map[customerId]?.products[productId]?.platformQuotes.find((x) => x.platformId === platformId);
  return pq?.price;
}

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
  /** 客户商品报价配置（客户 → 商品 → 报价/平台报价） */
  customerQuotes: CustomerQuoteMap;

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

  /** 客户报价：为该客户配置商品（生成平台报价骨架，报价默认按品牌折扣） */
  addCustomerQuoteProduct: (customerId: string, productId: string) => void;
  /** 客户报价：移除已配置商品 */
  removeCustomerQuoteProduct: (customerId: string, productId: string) => void;
  /** 客户报价：设置单品价格（undefined=清除单品价，回到品牌折扣） */
  setCustomerProductPrice: (customerId: string, productId: string, price: number | undefined) => void;
  /** 客户报价：单品单独折扣/单独报价（patch null=清除单品覆盖，回退品牌折扣；与平台报价子表并存） */
  setCustomerProductOverride: (customerId: string, productId: string, patch: { price?: number; discount?: number } | null) => void;
  /** 客户报价：设置单品是否报品（是=合作商终端客户菜单可见可下单） */
  setCustomerProductReported: (customerId: string, productId: string, reported: boolean) => void;
  /** 客户报价：设置品牌整体折扣（null=删除该品牌折扣） */
  setBrandDiscount: (customerId: string, brand: string, discount: number | null) => void;
  /** 客户报价：设置平台报价（price undefined=恢复自动折算）与平台 SKU */
  setCustomerPlatformQuote: (customerId: string, productId: string, platformId: string, patch: { price?: number; sku?: string }) => void;
}

/** 初始客户报价种子（不经平台 / 经平台 / 品牌折扣三类示例） */
function seedCustomerQuotes(): CustomerQuoteMap {
  const byId = new Map(customerItems.map((c) => [c.id, c]));
  const platformSkeleton = (customerId: string): CustomerPlatformQuote[] => {
    const c = byId.get(customerId);
    return (c?.platformIds ?? []).map((pid) => ({ platformId: pid, sku: '' }));
  };
  return {
    // 华茗堂茶庄：不经平台，单品价格示例
    c1: { brandDiscounts: {}, products: {
      '1': { productId: '1', price: 428, platformQuotes: [] },
      '2': { productId: '2', price: 298, platformQuotes: [] },
    } },
    // 浦发银行：经京东慧采（扣8%），品牌折扣 + 单品覆盖示例
    c6: { brandDiscounts: { 西湖牌: 90 }, products: {
      '1': { productId: '1', price: 436, platformQuotes: platformSkeleton('c6') },
    } },
    // 交通银行：经史泰博（扣6%）+得力（扣5%），双平台示例
    c7: { brandDiscounts: {}, products: {
      '7': { productId: '7', price: 988, platformQuotes: platformSkeleton('c7') },
    } },
  };
}

export const usePriceStore = create<PriceStore>((set) => ({
  products: teaProducts,
  purchaseRules: purchasePriceRules,
  salesQuotations: salesQuotationRules,
  customerQuotes: seedCustomerQuotes(),

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

  addCustomerQuoteProduct: (customerId, productId) => set((s) => {
    const cfg = getQuoteConfig(s.customerQuotes, customerId);
    if (cfg.products[productId]) return s;
    const c = customerItems.find((x) => x.id === customerId);
    const platforms = c?.platformIds ?? [];
    return {
      customerQuotes: {
        ...s.customerQuotes,
        [customerId]: {
          ...cfg,
          products: { ...cfg.products, [productId]: { productId, platformQuotes: platforms.map((pid) => ({ platformId: pid, sku: '' })) } },
        },
      },
    };
  }),

  removeCustomerQuoteProduct: (customerId, productId) => set((s) => {
    const cfg = s.customerQuotes[customerId];
    if (!cfg?.products[productId]) return s;
    const products = { ...cfg.products };
    delete products[productId];
    return { customerQuotes: { ...s.customerQuotes, [customerId]: { ...cfg, products } } };
  }),

  setCustomerProductPrice: (customerId, productId, price) => set((s) => {
    const cfg = getQuoteConfig(s.customerQuotes, customerId);
    const cur = cfg.products[productId];
    if (!cur) return s;
    return {
      customerQuotes: {
        ...s.customerQuotes,
        [customerId]: { ...cfg, products: { ...cfg.products, [productId]: { ...cur, price } } },
      },
    };
  }),

  /** 单品单独折扣/单独报价（参照合作商终端报价：与品牌折扣分层，patch null=清除单品覆盖） */
  setCustomerProductOverride: (customerId, productId, patch) => set((s) => {
    const cfg = getQuoteConfig(s.customerQuotes, customerId);
    const products = { ...cfg.products };
    if (patch === null) {
      if (products[productId]) {
        const cleared = { ...products[productId], price: undefined, discount: undefined };
        if (cleared.platformQuotes.length > 0) {
          products[productId] = cleared;
        } else {
          delete products[productId];
        }
      }
    } else {
      const base = products[productId] ?? { productId, platformQuotes: [] };
      products[productId] = {
        ...base,
        price: patch.price !== undefined ? patch.price : undefined,
        discount: patch.discount !== undefined ? patch.discount : undefined,
      };
    }
    return { customerQuotes: { ...s.customerQuotes, [customerId]: { ...cfg, products } } };
  }),

  /** 设置单品是否报品（无条目则创建仅含报品标记的条目） */
  setCustomerProductReported: (customerId, productId, reported) => set((s) => {
    const cfg = getQuoteConfig(s.customerQuotes, customerId);
    const cur = cfg.products[productId];
    const products = { ...cfg.products };
    if (cur) {
      products[productId] = { ...cur, reported };
    } else {
      products[productId] = { productId, platformQuotes: [], reported };
    }
    return { customerQuotes: { ...s.customerQuotes, [customerId]: { ...cfg, products } } };
  }),

  setBrandDiscount: (customerId, brand, discount) => set((s) => {
    const cfg = getQuoteConfig(s.customerQuotes, customerId);
    const brandDiscounts = { ...cfg.brandDiscounts };
    if (discount === null) delete brandDiscounts[brand];
    else brandDiscounts[brand] = discount;
    return { customerQuotes: { ...s.customerQuotes, [customerId]: { ...cfg, brandDiscounts } } };
  }),

  setCustomerPlatformQuote: (customerId, productId, platformId, patch) => set((s) => {
    const cfg = getQuoteConfig(s.customerQuotes, customerId);
    const cur = cfg.products[productId];
    if (!cur) return s;
    return {
      customerQuotes: {
        ...s.customerQuotes,
        [customerId]: {
          ...cfg,
          products: {
            ...cfg.products,
            [productId]: {
              ...cur,
              platformQuotes: cur.platformQuotes.map((pq) => (pq.platformId === platformId ? { ...pq, ...patch } : pq)),
            },
          },
        },
      },
    };
  }),
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
