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
  { key: 'direct', label: '直营客户报价', desc: '为每个直营客户单独配置商品并报价（单品价格 > 品牌整体折扣）；经平台客户还需对所经各平台设置「经平台销售报价」与平台 SKU（默认=客户报价×(1−扣点)）' },
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
 * 客户报价配置器（参照合作商工作台·报价页）：
 * 下拉选择客户 → 左侧品牌栏（整体折扣设置）→ 右侧商品列表（市场价 + 灰字京东/天猫价；单品价格/品牌折扣；经平台子表）。
 * 报价优先级：单品价格 > 品牌整体折扣（市场价×折扣%）> 未配置。
 */
function QuoteConfigurator({ customers, allowPlatformQuotes, selectedId, onSelect }: QuoteConfiguratorProps) {
  const products = usePriceStore((s) => s.products);
  const customerQuotes = usePriceStore((s) => s.customerQuotes);
  const addCustomerQuoteProduct = usePriceStore((s) => s.addCustomerQuoteProduct);
  const removeCustomerQuoteProduct = usePriceStore((s) => s.removeCustomerQuoteProduct);
  const setCustomerProductPrice = usePriceStore((s) => s.setCustomerProductPrice);
  const setBrandDiscount = usePriceStore((s) => s.setBrandDiscount);
  const setCustomerPlatformQuote = usePriceStore((s) => s.setCustomerPlatformQuote);

  const [brandFilter, setBrandFilter] = useState('');
  const customer = customers.find((c) => c.id === selectedId) ?? customers[0];
  const cfg = customer ? getQuoteConfig(customerQuotes, customer.id) : { brandDiscounts: {}, products: {} };

  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))], [products]);
  const listProducts = useMemo(
    () => products.filter((p) => !brandFilter || p.brand === brandFilter),
    [products, brandFilter],
  );
  const configuredCount = Object.keys(cfg.products).length;

  if (!customer) return null;

  /** 有效报价（单品价 > 品牌折扣 > 未配置） */
  const quoteOf = (productId: string) => effectiveCustomerQuote(customerQuotes, customer.id, productId, products);

  return (
    <div>
      {/* 客户下拉选择 */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>选择客户：</label>
        <select className="filter-select" value={customer.id} onChange={(e) => { onSelect(e.target.value); setBrandFilter(''); }} style={{ width: 240 }}>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--color-neutral-100)', color: 'var(--color-neutral-500)' }}>{customer.sub}</span>
        {allowPlatformQuotes && customer.platforms.length > 0 && customer.platforms.map((p) => (
          <span key={p.id} style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: '#FFF3E0', color: '#E65100', fontWeight: 'var(--font-medium)' }}>
            经平台：{p.name}（扣 {p.rate}）
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>已配置 <b className="mono">{configuredCount}</b> 款商品</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '216px 1fr', gap: 'var(--space-4)', alignItems: 'start' }}>
        {/* 左侧：品牌栏（整体折扣设置，参照合作商报价） */}
        <Card style={{ padding: 0, position: 'sticky', top: 0 }}>
          <div style={{ padding: '10px 12px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', borderBottom: '1px solid var(--color-neutral-100)' }}>品牌整体折扣</div>
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            <button
              onClick={() => setBrandFilter('')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left', cursor: 'pointer',
                padding: '8px 12px', border: 'none', borderBottom: '1px solid var(--color-neutral-50)',
                background: brandFilter === '' ? PRIMARY_LIGHT : 'transparent',
                borderLeft: brandFilter === '' ? `3px solid ${PRIMARY}` : '3px solid transparent',
                fontSize: 'var(--text-sm)', fontWeight: brandFilter === '' ? 'var(--font-medium)' : 'normal', color: brandFilter === '' ? PRIMARY : undefined,
              }}
            >
              全部品牌<span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{products.length}</span>
            </button>
            {brands.map((b) => {
              const discount = cfg.brandDiscounts[b];
              return (
                <div key={b} style={{ padding: '7px 12px 7px 15px', borderBottom: '1px solid var(--color-neutral-50)' }}>
                  <button
                    onClick={() => setBrandFilter(b)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', border: 'none', padding: 0, background: 'transparent',
                      fontSize: 'var(--text-sm)', fontWeight: brandFilter === b ? 'var(--font-medium)' : 'normal',
                      color: brandFilter === b ? PRIMARY : undefined, marginBottom: 4,
                    }}
                  >
                    {b}
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginLeft: 6 }}>
                      {products.filter((p) => p.brand === b).length} 款
                      {discount !== undefined ? ` · 已设 ${discount}%` : ''}
                    </span>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      className="filter-input mono" type="number" min={1} max={100} placeholder="折扣%"
                      value={discount ?? ''}
                      onChange={(e) => setBrandDiscount(customer.id, b, e.target.value === '' ? null : Math.min(100, Math.max(1, Number(e.target.value) || 0)))}
                      style={{ width: 66, height: 26, fontSize: 12, padding: '0 6px' }}
                      title="该品牌全部商品报价 = 市场价 × 折扣%（未单独设价的商品生效）"
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-neutral-400)' }}>%
                      {discount !== undefined && <button onClick={() => setBrandDiscount(customer.id, b, null)} style={{ border: 'none', background: 'transparent', color: '#C13A54', cursor: 'pointer', fontSize: 11, marginLeft: 4, padding: 0 }}>清除</button>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 右侧：商品报价列表 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 560, overflowY: 'auto', padding: 2 }}>
          {listProducts.map((p) => {
            const q = cfg.products[p.id];
            const effective = quoteOf(p.id);
            const brandDiscount = cfg.brandDiscounts[p.brand];
            const img = p.mainImages?.[0];
            const platforms = allowPlatformQuotes ? customer.platforms : [];
            return (
              <div key={p.id} style={{ border: `1px solid ${q ? 'var(--color-neutral-200)' : 'var(--color-neutral-100)'}`, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: q ? 'var(--color-neutral-0)' : 'var(--color-neutral-50)' }}>
                {/* 商品行 */}
                <div style={{ display: 'grid', gridTemplateColumns: '44px 1.6fr 1fr 1.1fr auto', gap: 'var(--space-2)', alignItems: 'center', padding: '8px 10px' }}>
                  {img
                    ? <img src={img} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-100)' }} />
                    : <span style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--color-neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--color-neutral-400)' }}>无图</span>}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{p.spec} · {p.brand}</div>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 'var(--text-sm)' }}>{formatMoney(p.marketPrice)}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>京东价：{p.jdPrice} / 天猫价：{p.tmallPrice}</div>
                  </div>
                  {/* 销售报价 */}
                  {q ? (
                    <div>
                      <input
                        className="filter-input mono" type="number" min={0} placeholder={brandDiscount !== undefined ? `品牌${brandDiscount}%` : '设单品价'}
                        value={q.price ?? ''}
                        onChange={(e) => setCustomerProductPrice(customer.id, p.id, e.target.value === '' ? undefined : Number(e.target.value) || 0)}
                        style={{ width: '100%', height: 28, borderColor: PRIMARY, fontWeight: 'var(--font-semibold)', color: PRIMARY }}
                        title="单品价格（覆盖品牌折扣）；清空则按品牌整体折扣计算"
                      />
                      <div style={{ fontSize: 'var(--text-xs)', color: effective !== undefined ? PRIMARY : 'var(--color-neutral-400)' }}>
                        有效报价：{effective !== undefined ? formatMoney(effective) : '未配置（品牌未设折扣）'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
                      {brandDiscount !== undefined ? `品牌${brandDiscount}% → ${formatMoney(Math.round(p.marketPrice * brandDiscount) / 100)}` : '未配置'}
                    </div>
                  )}
                  {q
                    ? <Button size="sm" variant="ghost" onClick={() => removeCustomerQuoteProduct(customer.id, p.id)}>移除</Button>
                    : <Button size="sm" onClick={() => addCustomerQuoteProduct(customer.id, p.id)}>+ 配置</Button>}
                </div>
                {/* 经平台子表：各平台销售报价 + 平台 SKU */}
                {q && platforms.length > 0 && (
                  <div style={{ background: 'var(--color-bg-tertiary)', padding: '6px 10px 8px 56px' }}>
                    <table className="detail-inline-table">
                      <thead><tr><th>经平台销售（扣点）</th><th style={{ width: 150 }}>平台销售报价</th><th style={{ width: 200 }}>平台 SKU</th></tr></thead>
                      <tbody>
                        {platforms.map((plat) => {
                          const pq = q.platformQuotes.find((x) => x.platformId === plat.id);
                          const auto = effective !== undefined ? calcPlatformNetPrice(effective, plat.rate) : undefined;
                          const platEffective = effectivePlatformQuote(customerQuotes, customer.id, p.id, plat.id, products, plat.rate);
                          return (
                            <tr key={plat.id}>
                              <td style={{ fontSize: 'var(--text-sm)' }}>{plat.name} <span style={{ color: '#E65100', fontSize: 'var(--text-xs)' }}>（扣 {plat.rate}）</span></td>
                              <td>
                                <input
                                  className="filter-input mono" type="number" min={0}
                                  placeholder={auto !== undefined ? `自动 ${auto}` : '未配置'}
                                  value={pq?.price ?? ''}
                                  onChange={(e) => setCustomerPlatformQuote(customer.id, p.id, plat.id, { price: e.target.value === '' ? undefined : Number(e.target.value) || 0 })}
                                  style={{ width: '100%', height: 26, color: '#CB405D', fontWeight: 'var(--font-semibold)' }}
                                  title="平台销售报价；清空则自动=客户有效报价×(1−扣点)"
                                />
                                <div style={{ fontSize: 11, color: '#CB405D' }}>生效：{platEffective !== undefined ? formatMoney(platEffective) : '—'}</div>
                              </td>
                              <td><input className="filter-input mono" placeholder="平台 SKU 编码" value={pq?.sku ?? ''} onChange={(e) => setCustomerPlatformQuote(customer.id, p.id, plat.id, { sku: e.target.value })} style={{ width: '100%', height: 26 }} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
          {listProducts.length === 0 && (
            <div style={{ padding: 'var(--space-5)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>该品牌下暂无商品</div>
          )}
        </div>
      </div>
    </div>
  );
}

/** 页面：销售报（调）价（客户销售报价配置） */
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
      <ContentHeader title="销售报（调）价" breadcrumbs={['销售', '销售报（调）价']} />
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
