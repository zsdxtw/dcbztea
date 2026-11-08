import { useEffect, useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { platformItems } from '../../data/platforms';
import { customerItems } from '../../data/customers';
import { calcPlatformNetPrice, purchasePriceRules, PRICE_SUPPLIERS } from '../../data/prices';
import { usePriceStore, getQuoteConfig, effectiveCustomerQuote, effectivePlatformQuote, getCustomerStock } from '../../stores/priceStore';
import type { TeaProduct, PurchasePriceRule } from '../../types';

/* ── 工具函数 ── */
const formatMoney = (n: number) => `¥${n.toLocaleString('en-US')}`;
const rateOf = (price: number, market: number) => market > 0 ? Math.round((price / market) * 100) : 0;

/** 进货价信息：品牌商价（brand 类型规则中最低）与供应商价区间（partner 类型） */
function purchaseInfoOf(productId: string, rules: PurchasePriceRule[]) {
  const active = rules.filter((r) => r.productId === productId && r.status === 'active');
  const typeOf = (sid: string) => PRICE_SUPPLIERS.find((s) => s.id === sid)?.type;
  const brandRules = active.filter((r) => typeOf(r.supplierId) === 'brand');
  const partnerRules = active.filter((r) => typeOf(r.supplierId) === 'partner');
  const brand = brandRules.length
    ? brandRules.reduce((min, r) => (r.purchasePrice < min.purchasePrice ? r : min))
    : null;
  const sorted = [...partnerRules].sort((a, b) => a.purchasePrice - b.purchasePrice);
  const lo = sorted[0] ?? null;
  const hi = sorted[sorted.length - 1] ?? null;
  return { brand, lo, hi };
}

const PRIMARY = '#0F64B5';
const PRIMARY_LIGHT = '#EBF3FC';

/** 商品状态标签（来源于商品管理该商品的上下架/采购/生产状态） */
const SHELF_LABELS: Record<string, string> = { on: '已上架', off: '已下架' };
const PURCHASE_LABELS: Record<string, string> = { available: '可采购', stopped: '已停采' };
const PRODUCTION_LABELS: Record<string, string> = { producing: '生产中', stopped: '已停产' };
const productStatusText = (p: TeaProduct) =>
  `${SHELF_LABELS[p.shelfStatus] ?? p.shelfStatus}\\${PURCHASE_LABELS[p.purchaseStatus] ?? p.purchaseStatus}\\${PRODUCTION_LABELS[p.productionStatus] ?? p.productionStatus}`;

/** 商品首图（正方形缩略，加载失败回退占位块） */
function ProductThumb({ p }: { p: TeaProduct }) {
  const [failed, setFailed] = useState(false);
  const src = p.mainImages?.[0];
  if (!src || failed) {
    return (
      <div style={{ width: 70, height: 70, borderRadius: 'var(--radius-sm)', background: 'var(--color-neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title={p.name}>
        <svg viewBox="0 0 20 20" fill="none" style={{ width: 18, height: 18, color: 'var(--color-neutral-300)' }}>
          <path d="M10 3C6.8 6.5 5 9.2 5 11.4a5 5 0 0010 0C15 9.2 13.2 6.5 10 3z" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={p.name}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ width: 70, height: 70, maxWidth: 'none', borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0, display: 'block' }}
    />
  );
}

/** 报价 Tab 类型：直营（含经平台）→ 渠道 → 平台（淡茶直销平台客户）；个人客户不提前报价，无此 Tab */
type QuotationTab = 'direct' | 'channel' | 'platform';

const TAB_CONFIG: { key: QuotationTab; label: string; desc: string }[] = [
  { key: 'direct', label: '直营客户报价', desc: '为每个直营客户单独配置商品并报价（单品价格 > 品牌整体折扣）；经平台客户还需对所经各平台单独设置「经平台报价」与平台 SKU（不经自动计算）' },
  { key: 'channel', label: '渠道客户报价', desc: '为每个渠道客户单独配置商品并报价（渠道客户无经平台报价）' },
  { key: 'platform', label: '平台客户报价', desc: '淡茶半盏直接销售给平台客户（京东慧采 / 史泰博等）时的报价配置' },
];

/** 配置器客户选项（统一直营/渠道/平台三类客户形态） */
interface QuoteCustomerOption {
  id: string;
  name: string;
  /** 等级 / 类型副标 */
  sub: string;
  /** 经平台列表（含扣点）；仅直营客户可能有 */
  platforms: { id: string; name: string; rate: string }[];
}

interface QuoteConfiguratorProps {
  customers: QuoteCustomerOption[];
  /** 是否支持经平台报价子表（仅直营客户） */
  allowPlatformQuotes: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
}

/**
 * 客户报价配置器（参照合作商终端报价·报价管理）：
 * 左侧品牌栏列出全部品牌（点击选中）→ 右侧顶部设置该品牌统一折扣价 → 商品列表可对单个商品设置单独折扣或单独报价。
 * 报价方式：单独报价 > 单独折扣 > 品牌统一折扣 > 市场价。
 */
function QuoteConfigurator({ customers, allowPlatformQuotes, selectedId, onSelect }: QuoteConfiguratorProps) {
  const products = usePriceStore((s) => s.products);
  const customerQuotes = usePriceStore((s) => s.customerQuotes);
  const setCustomerProductOverride = usePriceStore((s) => s.setCustomerProductOverride);
  const setCustomerProductReported = usePriceStore((s) => s.setCustomerProductReported);
  const setCustomerPlatformQuote = usePriceStore((s) => s.setCustomerPlatformQuote);
  const setBrandDiscount = usePriceStore((s) => s.setBrandDiscount);
  const adjustCustomerStock = usePriceStore((s) => s.adjustCustomerStock);
  const customerStock = usePriceStore((s) => s.customerStock);
  const purchaseRules = usePriceStore((s) => s.purchaseRules);

  const customer = customers.find((c) => c.id === selectedId) ?? customers[0];
  const cfg = customer ? getQuoteConfig(customerQuotes, customer.id) : { brandDiscounts: {}, products: {} };

  /** 左侧品牌栏:全部品牌(含未配置的品牌) */
  const brands = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => map.set(p.brand, (map.get(p.brand) ?? 0) + 1));
    return [...map.entries()].map(([name, count]) => ({ name, count }));
  }, [products]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [discountDraft, setDiscountDraft] = useState('');
  const [keyword, setKeyword] = useState('');
  /** 是否报品筛选（全部 / 已报 / 未报） */
  const [reportedFilter, setReportedFilter] = useState<'all' | 'yes' | 'no'>('all');
  /** 三个商品状态筛选（与商品管理-茶叶一致：上下架/采购/生产） */
  const [shelfFilter, setShelfFilter] = useState('');
  const [purchaseFilter, setPurchaseFilter] = useState('');
  const [productionFilter, setProductionFilter] = useState('');
  /** 报价方式筛选 */
  const [modeFilter, setModeFilter] = useState<'all' | 'price' | 'discount' | 'brand' | 'market'>('all');
  /** 列表分页：每页条数（10/20/50）与当前页 */
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  /** 单品报价设置弹窗(参照合作商终端:跟随品牌 / 单独折扣 / 单独报价) */
  const [overrideDialog, setOverrideDialog] = useState<{ product: typeof products[0]; mode: 'none' | 'discount' | 'price'; value: string } | null>(null);

  /** 设置库存弹窗（该客户×该商品的独立库存，不联动商品全局库存） */
  const [stockDialog, setStockDialog] = useState<{ product: TeaProduct; mode: 'add' | 'sub'; qty: string; err: string } | null>(null);

  /** 右侧商品列表:选中品牌后仅展示该品牌,支持名称搜索与是否报品/状态/报价方式筛选 */
  const listProducts = useMemo(() => {
    const kw = keyword.trim();
    return products.filter((p) => {
      if (selectedBrand && p.brand !== selectedBrand) return false;
      if (kw && !p.name.includes(kw)) return false;
      if (shelfFilter && p.shelfStatus !== shelfFilter) return false;
      if (purchaseFilter && p.purchaseStatus !== purchaseFilter) return false;
      if (productionFilter && p.productionStatus !== productionFilter) return false;
      const pq = cfg.products[p.id];
      const reported = p.shelfStatus === 'on' && (pq ? pq.reported !== false : true);
      if (reportedFilter === 'yes' && !reported) return false;
      if (reportedFilter === 'no' && reported) return false;
      if (modeFilter !== 'all') {
        if (modeFilter === 'price' && pq?.price === undefined) return false;
        if (modeFilter === 'discount' && pq?.discount === undefined) return false;
        if (modeFilter === 'brand' && cfg.brandDiscounts[p.brand] === undefined) return false;
        if (modeFilter === 'market' && (pq?.price !== undefined || pq?.discount !== undefined || cfg.brandDiscounts[p.brand] !== undefined)) return false;
      }
      return true;
    });
  }, [products, selectedBrand, keyword, reportedFilter, cfg, shelfFilter, purchaseFilter, productionFilter, modeFilter]);

  /** 分页计算：筛选/搜索/页大小变化回第 1 页，越界自动收敛 */
  const totalPages = Math.max(1, Math.ceil(listProducts.length / pageSize));
  const pagedProducts = listProducts.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [keyword, reportedFilter, shelfFilter, purchaseFilter, productionFilter, modeFilter, selectedBrand, pageSize]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  /** 页码按钮（当前页模块主色） */
  const pageBtn = (n: number) => (
    <button
      key={n}
      onClick={() => setPage(n)}
      style={{
        minWidth: 28, height: 28, padding: '0 6px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
        border: `1px solid ${page === n ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
        background: page === n ? 'var(--color-module-current-base)' : 'var(--color-neutral-0)',
        color: page === n ? 'var(--color-neutral-0)' : 'var(--color-neutral-600)',
        fontSize: 'var(--text-sm)', fontWeight: 500, fontFamily: 'var(--font-family-mono)',
      }}
    >
      {n}
    </button>
  );

  if (!customer) return null;

  /** 有效报价(单独报价 > 单独折扣 > 品牌折扣 > 未配置) */
  const quoteOf = (productId: string) => effectiveCustomerQuote(customerQuotes, customer.id, productId, products);
  const saveBrandDiscount = () => {
    const v = Number(discountDraft);
    if (!discountDraft || Number.isNaN(v) || v <= 0 || v > 100) { window.alert('请输入 1-100 之间的折扣百分比（如 85 表示市场价的 85%）'); return; }
    setBrandDiscount(customer.id, selectedBrand, v);
    setDiscountDraft('');
  };
  const saveOverride = () => {
    if (!overrideDialog) return;
    const mode = overrideDialog.mode;
    const value = overrideDialog.value;
    const product = overrideDialog.product;
    if (mode === 'none') {
      setCustomerProductOverride(customer.id, product.id, null);
      setOverrideDialog(null);
      return;
    }
    const v = Number(value);
    if (!value || Number.isNaN(v) || v <= 0) { window.alert(mode === 'discount' ? '请输入有效的折扣百分比（如 85）' : '请输入有效的报价（元）'); return; }
    if (mode === 'discount' && v > 100) { window.alert('折扣百分比不能超过 100'); return; }
    setCustomerProductOverride(customer.id, product.id, mode === 'discount' ? { discount: v } : { price: v });
    setOverrideDialog(null);
  };

  /** 报价方式标签 */
  const modeTag = (p: typeof products[0]) => {
    const q = cfg.products[p.id];
    if (q?.price !== undefined) return { text: '单独报价', on: true };
    if (q?.discount !== undefined) return { text: `单独折扣 ${q.discount}%`, on: true };
    const bd = cfg.brandDiscounts[p.brand];
    if (bd !== undefined) return { text: `品牌折扣 ${bd}%`, on: true };
    return { text: '市场价', on: false };
  };

  const label = (text: string, required?: boolean) => (
    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>
      {text}{required && <span style={{ color: '#CB405D', marginLeft: 2 }}>*</span>}
    </label>
  );

  return (
    <div>
      {/* 客户下拉选择 */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>选择客户：</label>
        <select className="filter-select" value={customer.id} onChange={(e) => {
          // 重新选择客户：列表筛选项全部重置
          onSelect(e.target.value);
          setSelectedBrand('');
          setDiscountDraft('');
          setKeyword('');
          setReportedFilter('all');
          setShelfFilter('');
          setPurchaseFilter('');
          setProductionFilter('');
          setModeFilter('all');
        }} style={{ width: 240 }}>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--color-neutral-100)', color: 'var(--color-neutral-500)' }}>{customer.sub}</span>
        {allowPlatformQuotes && customer.platforms.map((p) => (
          <span key={p.id} style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: '#FFF3E0', color: '#E65100', fontWeight: 'var(--font-medium)' }}>
            经平台：{p.name}（扣 {p.rate}）
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
        {/* 左侧品牌栏:列出所有品牌 */}
        <div style={{ width: 216, flexShrink: 0, border: '1px solid var(--color-neutral-100)', borderRadius: 'var(--radius-md)', background: 'var(--color-neutral-0)' }}>
          <div style={{ padding: '10px 12px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', borderBottom: '1px solid var(--color-neutral-100)' }}>全部品牌</div>
          <div style={{ maxHeight: 520, overflowY: 'auto', padding: 4 }}>
            <button
              onClick={() => { setSelectedBrand(''); setDiscountDraft(''); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                border: selectedBrand === '' ? `1px solid ${PRIMARY}` : '1px solid transparent',
                background: selectedBrand === '' ? PRIMARY_LIGHT : 'transparent',
                color: selectedBrand === '' ? PRIMARY : 'var(--color-neutral-600)',
                fontWeight: selectedBrand === '' ? 'var(--font-medium)' : 500, fontSize: 'var(--text-sm)',
              }}
            >
              全部品牌
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{products.length}</span>
            </button>
            {brands.map((b) => {
              const active = selectedBrand === b.name;
              const discount = cfg.brandDiscounts[b.name];
              return (
                <button
                  key={b.name}
                  onClick={() => { setSelectedBrand(b.name); setDiscountDraft(discount != null ? String(discount) : ''); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, width: '100%',
                    padding: '9px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: active ? `1px solid ${PRIMARY}` : '1px solid transparent',
                    background: active ? PRIMARY_LIGHT : 'transparent',
                    color: active ? PRIMARY : 'var(--color-neutral-600)',
                    fontWeight: active ? 'var(--font-medium)' : 500, fontSize: 'var(--text-sm)',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    {discount != null && <span style={{ fontSize: 11, fontWeight: 600, color: PRIMARY, background: PRIMARY_LIGHT, borderRadius: 999, padding: '1px 7px' }}>{discount}%</span>}
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{b.count}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右侧:品牌统一折扣设置 + 商品列表 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selectedBrand && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '12px 16px', borderRadius: 'var(--radius-md)', background: PRIMARY_LIGHT, marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)' }}>{selectedBrand} · 统一折扣价</span>
              <input
                className="filter-input" type="number" min={1} max={100} placeholder="如 85"
                style={{ width: 110, height: 32, fontSize: 13 }} value={discountDraft}
                onChange={(e) => setDiscountDraft(e.target.value)}
              />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>%（基于市场价，对该品牌下未单独设置的商品生效）</span>
              <Button size="sm" onClick={saveBrandDiscount}>保存折扣</Button>
              {cfg.brandDiscounts[selectedBrand] != null && (
                <Button size="sm" variant="ghost" onClick={() => { setBrandDiscount(customer.id, selectedBrand, null); setDiscountDraft(''); }}>清除折扣</Button>
              )}
            </div>
          )}

          <div style={{ border: '1px solid var(--color-neutral-100)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--color-neutral-100)', background: 'var(--color-neutral-50)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)', flexShrink: 0 }}>
                {selectedBrand || '全部品牌'}的商品
                <span style={{ fontWeight: 500, color: 'var(--color-neutral-400)', marginLeft: 8 }}>共 {listProducts.length} 个</span>
              </span>
              <input className="filter-input" placeholder="搜索商品名称" style={{ width: 180, height: 30, fontSize: 13 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', fontWeight: 'var(--font-medium)', flexShrink: 0 }}>是否报品：</span>
              <select
                className="filter-select" style={{ height: 30, fontSize: 13 }} value={reportedFilter}
                onChange={(e) => setReportedFilter(e.target.value as 'all' | 'yes' | 'no')}
                title="按是否报品筛选"
              >
                <option value="all">全部</option>
                <option value="yes">已报</option>
                <option value="no">未报</option>
              </select>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', fontWeight: 'var(--font-medium)', flexShrink: 0, marginLeft: 4 }}>状态：</span>
              <select className="filter-select" style={{ height: 30, fontSize: 13 }} value={shelfFilter} onChange={(e) => setShelfFilter(e.target.value)} title="按上下架状态筛选">
                <option value="">上下架状态</option>
                <option value="on">上架</option>
                <option value="off">下架</option>
              </select>
              <select className="filter-select" style={{ height: 30, fontSize: 13 }} value={purchaseFilter} onChange={(e) => setPurchaseFilter(e.target.value)} title="按采购状态筛选">
                <option value="">采购状态</option>
                <option value="available">可采</option>
                <option value="stopped">停采</option>
              </select>
              <select className="filter-select" style={{ height: 30, fontSize: 13 }} value={productionFilter} onChange={(e) => setProductionFilter(e.target.value)} title="按生产状态筛选">
                <option value="">生产状态</option>
                <option value="producing">在产</option>
                <option value="stopped">停产</option>
              </select>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', fontWeight: 'var(--font-medium)', flexShrink: 0, marginLeft: 4 }}>报价方式：</span>
              <select
                className="filter-select" style={{ height: 30, fontSize: 13 }} value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value as 'all' | 'price' | 'discount' | 'brand' | 'market')}
                title="按报价方式筛选"
              >
                <option value="all">全部</option>
                <option value="price">单独报价</option>
                <option value="discount">单独折扣</option>
                <option value="brand">品牌折扣</option>
                <option value="market">市场价</option>
              </select>
            </div>
            <table className="detail-inline-table" style={{ border: 'none' }}>
              <thead>
                <tr>
                  <th style={{ width: 44 }}>序号</th><th style={{ width: 82 }}>图片</th><th>商品名称</th><th>品牌 / 规格</th><th>状态</th><th>市场价</th><th>进货价</th><th>销售报价</th>
                  <th>折扣率</th>
                  <th>报价方式</th>
                  <th>可售</th>
                  <th style={{ width: 110, textAlign: 'center' }}>是否报品</th>
                  <th style={{ width: 120 }}>操作（设置）</th>
                </tr>
              </thead>
              <tbody>
                {pagedProducts.map((p, idx) => {
                  const effective = quoteOf(p.id);
                  const mode = modeTag(p);
                  const q = cfg.products[p.id];
                  const platforms = allowPlatformQuotes ? customer.platforms : [];
                  const stockInfo = getCustomerStock(customerStock, customer.id, p.id);
                  const pinfo = purchaseInfoOf(p.id, purchaseRules);
                  const setPlats = platforms
                    .map((plat) => ({ plat, pq: (q?.platformQuotes ?? []).find((x) => x.platformId === plat.id) }))
                    .filter((x) => x.pq && x.pq.price !== undefined);
                  return (
                    <tr key={p.id}>
                      <td className="mono" style={{ color: 'var(--color-neutral-500)' }}>{(page - 1) * pageSize + idx + 1}</td>
                      <td><ProductThumb p={p} /></td>
                      <td>
                        <div className="cell-emph" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{p.spec}</div>
                      </td>
                      <td style={{ fontSize: 'var(--text-sm)' }}>{p.brand}</td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)', whiteSpace: 'nowrap' }}>{productStatusText(p)}</td>
                      <td className="mono">{formatMoney(p.marketPrice)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {pinfo.brand ? (
                          <div className="mono" style={{ fontSize: 'var(--text-sm)' }}>
                            <span style={{ color: 'var(--color-neutral-500)' }}>品牌商：</span>{formatMoney(pinfo.brand.purchasePrice)}<span style={{ color: 'var(--color-neutral-400)' }}>（{pinfo.brand.discountRate}%）</span>
                          </div>
                        ) : pinfo.lo ? null : <span style={{ color: 'var(--color-neutral-300)' }}>—</span>}
                        {pinfo.lo && pinfo.hi && (
                          <div className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                            <span>供应商：</span>
                            {formatMoney(pinfo.lo.purchasePrice)}（{pinfo.lo.discountRate}%）
                            {pinfo.hi.id !== pinfo.lo.id && <>~{formatMoney(pinfo.hi.purchasePrice)}（{pinfo.hi.discountRate}%）</>}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="mono" style={{ fontWeight: mode.on ? 'var(--font-semibold)' : 400, color: mode.on ? PRIMARY : 'var(--color-neutral-400)' }}>
                          {effective !== undefined ? formatMoney(effective) : '—'}
                        </div>
                        {allowPlatformQuotes && platforms.length > 0 && (setPlats.length === 0
                          ? <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-300)' }}>经平台：未设置</div>
                          : (
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                              {setPlats.map((x, i) => (
                                <span key={x.plat.id}>
                                  {i > 0 && <span style={{ color: 'var(--color-neutral-300)', margin: '0 4px' }}>\</span>}
                                  {x.plat.name}：<span className="mono" style={{ color: 'var(--color-neutral-700)' }}>{formatMoney(x.pq!.price!)}</span>
                                </span>
                              ))}
                            </div>
                          ))}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="mono" style={{ fontSize: 'var(--text-sm)', fontWeight: mode.on ? 'var(--font-semibold)' : 400, color: mode.on ? PRIMARY : 'var(--color-neutral-400)' }}>
                          {effective !== undefined ? `${rateOf(effective, p.marketPrice)}%` : '—'}
                        </div>
                        {allowPlatformQuotes && platforms.length > 0 && setPlats.length > 0 && (
                          <div className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                            {setPlats.map((x, i) => (
                              <span key={x.plat.id}>
                                {i > 0 && <span style={{ color: 'var(--color-neutral-300)', margin: '0 4px' }}>\</span>}
                                {rateOf(x.pq!.price!, p.marketPrice)}%
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 9px', borderRadius: 999, fontSize: 'var(--text-xs)', fontWeight: 500, whiteSpace: 'nowrap',
                          background: mode.on ? PRIMARY_LIGHT : 'var(--color-neutral-100)', color: mode.on ? PRIMARY : 'var(--color-neutral-400)',
                        }}>
                          {mode.text}
                        </span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontWeight: 'var(--font-semibold)', color: stockInfo.stock <= 10 ? '#E65100' : 'var(--color-neutral-700)' }}>{stockInfo.stock}</span>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>预占 {stockInfo.reserved} · 已售 {stockInfo.sold}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {(() => {
                          const shelfOn = p.shelfStatus === 'on';
                          const reported = shelfOn && (q ? q.reported !== false : true);
                          return (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <button
                                type="button" role="switch" aria-checked={reported} disabled={!shelfOn}
                                title={shelfOn ? (reported ? '报品：是（点击改为否）' : '报品：否（点击改为是）') : '商品已下架，是否报品强制为否'}
                                onClick={() => setCustomerProductReported(customer.id, p.id, !reported)}
                                style={{
                                  position: 'relative', width: 38, height: 20, borderRadius: 999, border: 'none', cursor: shelfOn ? 'pointer' : 'not-allowed',
                                  background: reported ? PRIMARY : 'var(--color-neutral-300)', transition: 'background .15s', padding: 0,
                                  opacity: shelfOn ? 1 : 0.55,
                                }}
                              >
                                <span style={{
                                  position: 'absolute', top: 2, left: reported ? 20 : 2, width: 16, height: 16, borderRadius: '50%',
                                  background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left .15s',
                                }} />
                              </button>
                              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: reported ? PRIMARY : 'var(--color-neutral-400)' }}>{reported ? '是' : '否'}</span>
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', color: PRIMARY, padding: '2px 4px', fontWeight: 500 }}
                            onClick={() => {
                              const ov = cfg.products[p.id];
                              setOverrideDialog({
                                product: p,
                                mode: ov?.price !== undefined ? 'price' : ov?.discount !== undefined ? 'discount' : 'none',
                                value: ov?.price !== undefined ? String(ov.price) : ov?.discount !== undefined ? String(ov.discount) : '',
                              });
                            }}
                          >
                            报价
                          </button>
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', color: PRIMARY, padding: '2px 4px', fontWeight: 500 }}
                            onClick={() => setStockDialog({ product: p, mode: 'add', qty: '', err: '' })}
                          >
                            可售量
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {listProducts.length === 0 && (
                  <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--color-neutral-400)', padding: 'var(--space-4)' }}>暂无商品</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 分页（总数超过每页条数时展示；每页 10/20/50 可调） */}
          {listProducts.length > pageSize && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginRight: 'auto' }}>
                共 {listProducts.length} 条 · 第 {page} / {totalPages} 页
              </span>
              <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => pageBtn(n))}
              <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
              <select
                className="filter-select"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10}>10 条/页</option>
                <option value={20}>20 条/页</option>
                <option value={50}>50 条/页</option>
              </select>
            </div>
          )}

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 10, lineHeight: 1.7 }}>
            报价方式优先级：单独报价 &gt; 单独折扣 &gt; 品牌统一折扣 &gt; 市场价。左侧选中品牌后可设置该品牌统一折扣价；单个商品可「设置报价」覆盖为单独折扣或单独报价。
          </div>
        </div>
      </div>

      {/* 单品报价设置弹窗(参照合作商终端:跟随品牌 / 单独折扣 / 单独报价) */}
      {overrideDialog && (
        <div className="category-dialog-overlay" onClick={() => setOverrideDialog(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: allowPlatformQuotes && customer.platforms.length > 0 ? 640 : 440, maxWidth: '94vw' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 4 }}>设置单品报价</h3>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)', lineHeight: 1.8 }}>
              {overrideDialog.product.name} · {overrideDialog.product.brand} · 市场价 {formatMoney(overrideDialog.product.marketPrice)}{cfg.brandDiscounts[overrideDialog.product.brand] !== undefined ? ` · 品牌折扣 ${cfg.brandDiscounts[overrideDialog.product.brand]}%` : ''}
              <br />
              {(() => {
                const pi = purchaseInfoOf(overrideDialog.product.id, purchaseRules);
                const parts: string[] = [];
                if (pi.brand) parts.push(`进货价：品牌商 ${formatMoney(pi.brand.purchasePrice)}（${pi.brand.discountRate}%）`);
                if (pi.lo && pi.hi) parts.push(`供应商 ${formatMoney(pi.lo.purchasePrice)}（${pi.lo.discountRate}%）${pi.hi.id !== pi.lo.id ? `~${formatMoney(pi.hi.purchasePrice)}（${pi.hi.discountRate}%）` : ''}`);
                if (parts.length === 0) parts.push('进货价：未设置采购价规则');
                return parts.join(' · ');
              })()}
              {' · '}京东价 {overrideDialog.product.jdPrice ? formatMoney(overrideDialog.product.jdPrice) : '—'} · 天猫价 {overrideDialog.product.tmallPrice ? formatMoney(overrideDialog.product.tmallPrice) : '—'}
            </div>
            {([
              ['none', '跟随品牌折扣', '清除单品设置，按品牌统一折扣计算'],
              ['discount', '单独折扣', '报价 = 该商品市场价 × 折扣%'],
              ['price', '单独报价', '直接指定该商品报价（元）'],
            ] as const).map(([m, name, desc]) => (
              <label key={m} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius-md)', border: `1px solid ${overrideDialog.mode === m ? PRIMARY : 'var(--color-neutral-200)'}`, background: overrideDialog.mode === m ? PRIMARY_LIGHT : 'transparent', cursor: 'pointer', marginBottom: 8 }}>
                <input type="radio" name="ov-mode" checked={overrideDialog.mode === m} onChange={() => setOverrideDialog({ ...overrideDialog, mode: m, value: '' })} style={{ marginTop: 3 }} />
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{name}</span>
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 2 }}>{desc}</span>
                </span>
                {m !== 'none' && overrideDialog.mode === m && (
                  <input
                    className="filter-input mono" type="text" inputMode={m === 'discount' ? 'numeric' : 'decimal'}
                    placeholder={m === 'discount' ? '如 85' : '如 368'}
                    style={{ width: 110, height: 30, fontSize: 'var(--text-sm)', flexShrink: 0 }}
                    value={overrideDialog.value}
                    onChange={(e) => {
                      const filtered = m === 'discount' ? e.target.value.replace(/[^\d]/g, '') : e.target.value.replace(/[^\d.]/g, '');
                      setOverrideDialog(d => d ? { ...d, value: filtered } : d);
                    }}
                  />
                )}
              </label>
            ))}

            {/* 经平台销售:各平台单独报价与供货 SKU(单独设置,不经公司计算) */}
            {allowPlatformQuotes && customer.platforms.length > 0 && (
              <div style={{ borderTop: '1px solid var(--color-neutral-100)', paddingTop: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 6 }}>经平台销售报价与供货 SKU</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginBottom: 8, lineHeight: 1.6 }}>
                  各平台单独设置价格（不经公司自动计算），并设置通过该平台给该客户供货的 SKU。
                </div>
                <table className="detail-inline-table">
                  <thead><tr><th>平台（扣点）</th><th style={{ width: 130 }}>平台销售报价</th><th style={{ width: 170 }}>供货 SKU</th></tr></thead>
                  <tbody>
                    {customer.platforms.map((plat) => {
                      const pq = (cfg.products[overrideDialog.product.id]?.platformQuotes ?? []).find((x) => x.platformId === plat.id);
                      return (
                        <tr key={plat.id}>
                          <td style={{ fontSize: 'var(--text-sm)' }}>{plat.name} <span style={{ color: '#E65100', fontSize: 'var(--text-xs)' }}>（扣 {plat.rate}）</span></td>
                          <td>
                            <input
                              className="filter-input mono" type="text" inputMode="decimal" placeholder="未设置"
                              value={pq?.price ?? ''}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/[^\d.]/g, '');
                                setCustomerPlatformQuote(customer.id, overrideDialog.product.id, plat.id, { price: digits === '' ? undefined : Number(digits) || 0 });
                              }}
                              style={{ width: '100%', height: 28 }}
                            />
                          </td>
                          <td>
                            <input
                              className="filter-input mono" placeholder="平台 SKU 编码"
                              value={pq?.sku ?? ''}
                              onChange={(e) => setCustomerPlatformQuote(customer.id, overrideDialog.product.id, plat.id, { sku: e.target.value })}
                              style={{ width: '100%', height: 28 }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" onClick={() => setOverrideDialog(null)}>取消</Button>
              <Button onClick={saveOverride}>保存</Button>
            </div>
          </div>
        </div>
      )}

      {/* 设置可售量弹窗（该客户×该商品的独立可售量，不联动商品全局库存） */}
      {stockDialog && (
        <div className="category-dialog-overlay" onClick={() => setStockDialog(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: '94vw' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 4 }}>设置可售量</h3>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
              {stockDialog.product.name} · {customer.name}<br />
              当前可售量 <strong className="mono" style={{ color: PRIMARY }}>{getCustomerStock(customerStock, customer.id, stockDialog.product.id).stock}</strong>
              　（该客户的独立可售量，不联动商品全局库存）
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                <input type="radio" name="stock-mode" checked={stockDialog.mode === 'add'} onChange={() => setStockDialog(f => f ? { ...f, mode: 'add', err: '' } : f)} /> 增加可售量
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                <input type="radio" name="stock-mode" checked={stockDialog.mode === 'sub'} onChange={() => setStockDialog(f => f ? { ...f, mode: 'sub', err: '' } : f)} /> 减少可售量
              </label>
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label className="drawer-label">数量</label>
              <input
                className="filter-input mono" type="number" min={1} style={{ width: '100%' }}
                placeholder="请输入调整数量"
                value={stockDialog.qty}
                onChange={(e) => setStockDialog(f => f ? { ...f, qty: e.target.value, err: '' } : f)}
              />
            </div>
            {stockDialog.err && (
              <div style={{ padding: '8px 12px', background: '#FFEBEE', color: '#C62828', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{stockDialog.err}</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" onClick={() => setStockDialog(null)}>取消</Button>
              <Button onClick={() => {
                const qty = Number(stockDialog.qty);
                if (!Number.isInteger(qty) || qty <= 0) {
                  setStockDialog(f => f ? { ...f, err: '请输入大于 0 的整数数量' } : f);
                  return;
                }
                const delta = stockDialog.mode === 'add' ? qty : -qty;
                const cur = getCustomerStock(customerStock, customer.id, stockDialog.product.id).stock;
                if (stockDialog.mode === 'sub' && cur - delta < 0) {
                  setStockDialog(f => f ? { ...f, err: `减少后可售量不能低于 0（当前可售量 ${cur}，最多可减少 ${cur}）` } : f);
                  return;
                }
                const res = adjustCustomerStock(customer.id, stockDialog.product.id, delta);
                if (!res.ok) { setStockDialog(f => f ? { ...f, err: res.msg } : f); return; }
                setStockDialog(null);
              }}>保存</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 页面：报品报（调）价（客户销售报价配置） */
export default function SalesPricing() {
  const [activeTab, setActiveTab] = useState<QuotationTab>('direct');
  const [selDirect, setSelDirect] = useState('c1');
  const [selChannel, setSelChannel] = useState('');
  const [selPlatform, setSelPlatform] = useState('p1');
  const customerQuotes = usePriceStore((s) => s.customerQuotes);

  /** 直营客户（含经平台标记与扣点） */
  const directCustomers: QuoteCustomerOption[] = useMemo(() => customerItems.filter((c) => c.type === 'direct').map((c) => ({
    id: c.id, name: c.name, sub: `${c.level} · 直营客户`,
    platforms: (c.platformIds ?? []).map((pid) => ({
      id: pid,
      name: platformItems.find((p) => p.id === pid)?.shortName ?? pid,
      rate: c.platformCommissionRates?.[pid] ?? '0%',
    })),
  })), []);
  /** 渠道客户 */
  const channelCustomers: QuoteCustomerOption[] = useMemo(() => customerItems.filter((c) => c.type === 'channel').map((c) => ({
    id: c.id, name: c.name, sub: `${c.level} · 渠道客户`, platforms: [],
  })), []);
  /** 平台客户（淡茶直接销售给平台客户） */
  const platformCustomers: QuoteCustomerOption[] = useMemo(() => platformItems.map((p) => ({
    id: p.id, name: p.name, sub: '平台客户', platforms: [],
  })), []);

  const channelSel = channelCustomers.find((c) => c.id === selChannel)?.id ?? channelCustomers[0]?.id ?? '';
  const configuredCount = (customers: QuoteCustomerOption[]) =>
    customers.reduce((s, c) => s + Object.keys(getQuoteConfig(customerQuotes, c.id).products).length, 0);

  return (
    <>
      <ContentHeader title="报品报（调）价" breadcrumbs={['销售', '报品报（调）价']} />
      <div className="content-body">
        {/* Tab 切换：直营 → 渠道 → 平台（个人客户不提前报价，无此 Tab） */}
        <div style={{ display: 'flex', gap: 4, padding: 2, background: 'var(--color-neutral-100)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)', width: 'fit-content' }}>
          {TAB_CONFIG.map((t) => {
            const isActive = activeTab === t.key;
            const count = t.key === 'direct' ? configuredCount(directCustomers)
              : t.key === 'channel' ? configuredCount(channelCustomers)
                : configuredCount(platformCustomers);
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '6px 16px', borderRadius: 'var(--radius-sm)', border: 'none',
                  background: isActive ? 'var(--color-neutral-0)' : 'transparent',
                  fontSize: 'var(--text-sm)', fontWeight: isActive ? 'var(--font-medium)' : 'normal',
                  color: isActive ? PRIMARY : 'var(--color-neutral-500)', cursor: 'pointer',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none', transition: 'var(--transition-fast)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                {t.label}
                <span style={{ fontSize: 'var(--text-xs)', background: isActive ? PRIMARY_LIGHT : 'var(--color-neutral-200)', padding: '1px 6px', borderRadius: 'var(--radius-sm)' }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* 当前 Tab 描述 */}
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }}>
          {TAB_CONFIG.find((t) => t.key === activeTab)?.desc}
          <span style={{ color: 'var(--color-neutral-400)' }}>　报价优先级：单品价格 &gt; 品牌整体折扣（市场价×折扣%）&gt; 未配置；个人客户不提前报价。</span>
        </div>

        <Card style={{ padding: 'var(--space-4)' }}>
          {activeTab === 'direct' && (
            <QuoteConfigurator customers={directCustomers} allowPlatformQuotes selectedId={directCustomers.find((c) => c.id === selDirect)?.id ?? directCustomers[0]?.id ?? ''} onSelect={setSelDirect} />
          )}
          {activeTab === 'channel' && channelCustomers.length > 0 && (
            <QuoteConfigurator customers={channelCustomers} allowPlatformQuotes={false} selectedId={channelSel} onSelect={setSelChannel} />
          )}
          {activeTab === 'channel' && channelCustomers.length === 0 && (
            <div style={{ padding: 'var(--space-5)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无渠道客户</div>
          )}
          {activeTab === 'platform' && (
            <QuoteConfigurator customers={platformCustomers} allowPlatformQuotes={false} selectedId={selPlatform} onSelect={setSelPlatform} />
          )}
        </Card>
      </div>
    </>
  );
}
