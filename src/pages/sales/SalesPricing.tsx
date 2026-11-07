import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { platformItems } from '../../data/platforms';
import { customerItems } from '../../data/customers';
import { calcPlatformNetPrice } from '../../data/prices';
import {
  usePriceStore, getQuoteConfig, effectiveCustomerQuote, effectivePlatformQuote,
} from '../../stores/priceStore';

/* ── 工具函数 ── */
const formatMoney = (n: number) => `¥${n.toLocaleString('en-US')}`;

const PRIMARY = '#0F64B5';
const PRIMARY_LIGHT = '#EBF3FC';

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

  /** 单品报价设置弹窗(参照合作商终端:跟随品牌 / 单独折扣 / 单独报价) */
  const [overrideDialog, setOverrideDialog] = useState<{ product: typeof products[0]; mode: 'none' | 'discount' | 'price'; value: string } | null>(null);

  /** 右侧商品列表:选中品牌后仅展示该品牌,支持名称搜索 */
  const listProducts = useMemo(() => {
    const kw = keyword.trim();
    return products.filter((p) => (!selectedBrand || p.brand === selectedBrand) && (!kw || p.name.includes(kw)));
  }, [products, selectedBrand, keyword]);

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
        <select className="filter-select" value={customer.id} onChange={(e) => { onSelect(e.target.value); setSelectedBrand(''); setDiscountDraft(''); }} style={{ width: 240 }}>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--color-neutral-100)', background: 'var(--color-neutral-50)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)' }}>
                {selectedBrand || '全部品牌'}的商品
                <span style={{ fontWeight: 500, color: 'var(--color-neutral-400)', marginLeft: 8 }}>共 {listProducts.length} 个</span>
              </span>
              <input className="filter-input" placeholder="搜索商品名称" style={{ width: 200, height: 30, fontSize: 13 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <table className="detail-inline-table" style={{ border: 'none' }}>
              <thead>
                <tr>
                  <th>商品名称</th><th>品牌 / 规格</th><th>市场价</th><th>直销报价</th><th>报价方式</th>
                  {allowPlatformQuotes && <th>经平台报价</th>}
                  <th style={{ width: 110, textAlign: 'center' }}>是否报品</th>
                  <th style={{ width: 90 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {listProducts.map((p) => {
                  const effective = quoteOf(p.id);
                  const mode = modeTag(p);
                  const q = cfg.products[p.id];
                  const platforms = allowPlatformQuotes ? customer.platforms : [];
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="cell-emph" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{p.spec}</div>
                      </td>
                      <td style={{ fontSize: 'var(--text-sm)' }}>{p.brand}</td>
                      <td className="mono">{formatMoney(p.marketPrice)}</td>
                      <td className="mono" style={{ fontWeight: mode.on ? 'var(--font-semibold)' : 400, color: mode.on ? PRIMARY : 'var(--color-neutral-400)' }}>
                        {effective !== undefined ? formatMoney(effective) : '—'}
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 9px', borderRadius: 999, fontSize: 'var(--text-xs)', fontWeight: 500, whiteSpace: 'nowrap',
                          background: mode.on ? PRIMARY_LIGHT : 'var(--color-neutral-100)', color: mode.on ? PRIMARY : 'var(--color-neutral-400)',
                        }}>
                          {mode.text}
                        </span>
                      </td>
                      {allowPlatformQuotes && (
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', maxWidth: 220 }}>
                          {platforms.length === 0 ? '—' : (() => {
                            const setPlats = platforms
                              .map((plat) => ({ plat, pq: (q?.platformQuotes ?? []).find((x) => x.platformId === plat.id) }))
                              .filter((x) => x.pq && x.pq.price !== undefined);
                            if (setPlats.length === 0) return <span style={{ color: 'var(--color-neutral-400)' }}>未设置（需单独设置）</span>;
                            return setPlats.map((x, i) => (
                              <span key={x.plat.id}>
                                {i > 0 && <span style={{ color: 'var(--color-neutral-300)', margin: '0 4px' }}>\</span>}
                                <span style={{ color: 'var(--color-neutral-600)' }}>{x.plat.name}：</span>
                                <span className="mono" style={{ color: 'var(--color-neutral-700)', fontWeight: 500 }}>{formatMoney(x.pq!.price!)}</span>
                              </span>
                            ));
                          })()}
                        </td>
                      )}
                      <td style={{ textAlign: 'center' }}>
                        {(() => {
                          const reported = q ? q.reported !== false : true;
                          return (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <button
                                type="button" role="switch" aria-checked={reported}
                                title={reported ? '报品：是（点击改为否）' : '报品：否（点击改为是）'}
                                onClick={() => setCustomerProductReported(customer.id, p.id, !reported)}
                                style={{
                                  position: 'relative', width: 38, height: 20, borderRadius: 999, border: 'none', cursor: 'pointer',
                                  background: reported ? PRIMARY : 'var(--color-neutral-300)', transition: 'background .15s', padding: 0,
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
                          设置报价
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {listProducts.length === 0 && (
                  <tr><td colSpan={allowPlatformQuotes ? 8 : 7} style={{ textAlign: 'center', color: 'var(--color-neutral-400)', padding: 'var(--space-4)' }}>暂无商品</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 10, lineHeight: 1.7 }}>
            报价方式优先级：单独报价 &gt; 单独折扣 &gt; 品牌统一折扣 &gt; 市场价。左侧选中品牌后可设置该品牌统一折扣价；单个商品可「设置报价」覆盖为单独折扣或单独报价。
          </div>
        </div>
      </div>

      {/* 单品报价设置弹窗(参照合作商终端:跟随品牌 / 单独折扣 / 单独报价) */}
      {overrideDialog && (
        <div className="category-dialog-overlay" onClick={() => setOverrideDialog(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 440 }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 4 }}>设置单品报价</h3>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }}>
              {overrideDialog.product.name} · {overrideDialog.product.brand} · 市场价 {formatMoney(overrideDialog.product.marketPrice)}{cfg.brandDiscounts[overrideDialog.product.brand] !== undefined ? ` · 品牌折扣 ${cfg.brandDiscounts[overrideDialog.product.brand]}%` : ''}
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
                    className="filter-input mono" type="number" placeholder={m === 'discount' ? '如 85' : '如 368'}
                    style={{ width: 110, height: 30, fontSize: 'var(--text-sm)', flexShrink: 0 }}
                    value={overrideDialog.value} onChange={(e) => setOverrideDialog({ ...overrideDialog, value: e.target.value })}
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
                              className="filter-input mono" type="number" min={0} placeholder="未设置"
                              value={pq?.price ?? ''}
                              onChange={(e) => setCustomerPlatformQuote(customer.id, overrideDialog.product.id, plat.id, { price: e.target.value === '' ? undefined : Number(e.target.value) || 0 })}
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
              <button className="pk-reg-cancel" style={{ height: 34, padding: '0 16px', fontSize: 13 }} onClick={() => setOverrideDialog(null)}>取消</button>
              <button className="pk-reg-submit" style={{ height: 34, padding: '0 18px', fontSize: 13, letterSpacing: 'normal', textIndent: 0 }} onClick={saveOverride}>保存</button>
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
