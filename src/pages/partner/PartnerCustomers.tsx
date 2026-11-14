import { useState, useMemo, useEffect } from 'react';
import Pagination from '../../components/common/Pagination';
import { PageHead, Pill } from './PartnerUI';
import { getPartnerAuth } from './PartnerLayout';
import { customerItems, CUSTOMER_TYPE_LABELS } from '../../data/customers';
import { useCustomerStore } from '../../stores/customerStore';
import { usePriceStore, effectiveCustomerQuote } from '../../stores/priceStore';
import { useSupplierStore } from '../../stores/supplierStore';
import { PROVINCE_NAMES, getCities, getDistricts } from '../../data/regions';
import type { CustomerItem, CustomerPoolConfig } from '../../types';
import './partner.css';

const money = (n: number) => `¥${n.toLocaleString()}`;
const norm = (s: string) => s.replace(/市$/, '');

/** 经营地区路径：'省' | '省/市' | '省/市/县' */
function buildSelPath(prov: string, city: string, dist: string): string {
  return [prov, city, dist].filter(Boolean).join('/');
}

/**
 * 入池范围与经营地区是否重叠（命中任一范围路径即展示）：
 * 经营地区路径 S 与范围路径 P 互为前缀（同一条行政线上）即命中；
 * 例：经营地区=江苏 时，范围=江苏（全省）/ 江苏·南京市 / 江苏·南京市·玄武区 均展示。
 */
function scopeOverlap(selPath: string, cfg: CustomerPoolConfig): boolean {
  if (cfg.nationwide) return true;
  if (!selPath) return true; // 未选地区（理论上默认选中）展示全部入池客户
  const segS = selPath.split('/').filter(Boolean);
  const paths = [
    ...cfg.provinces,
    ...cfg.cities,
    ...cfg.districts,
  ];
  for (const P of paths) {
    if (P === '全国') return true;
    const segP = P.split('/');
    const n = Math.min(segS.length, segP.length);
    let ok = true;
    for (let i = 0; i < n; i++) {
      if (norm(segS[i]) !== norm(segP[i])) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

/** 入池范围摘要 */
function poolScopeText(cfg: CustomerPoolConfig): string {
  if (cfg.nationwide) return '全国';
  const parts = [
    ...cfg.provinces.map((p) => `${p}（全省）`),
    ...cfg.cities.map((c) => c.split('/').slice(1).join('·') + '（全市）'),
    ...cfg.districts.map((d) => d.split('/').slice(1).join('·')),
  ];
  return parts.length > 0 ? parts.join('、') : '未设置';
}

/** 该客户可报商品（报品=是的上架商品） */
function orderableProductsOf(c: CustomerItem, customerQuotes: ReturnType<typeof usePriceStore.getState>['customerQuotes'], storeProducts: ReturnType<typeof usePriceStore.getState>['products']) {
  const cfg = customerQuotes[c.id];
  return storeProducts.filter((p) => {
    if (p.shelfStatus !== 'on') return false;
    const q = cfg?.products[p.id];
    return q ? q.reported !== false : true;
  });
}

/** 客户池：经营地区默认取注册地址省市县，展示入池范围命中的客户卡片（5×2），选中后下方展示该客户报品商品（左品牌栏+右列表，参照供货报价） */
export default function PartnerCustomers() {
  const poolConfigs = useCustomerStore((s) => s.poolConfigs);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const customerQuotes = usePriceStore((s) => s.customerQuotes);
  const storeProducts = usePriceStore((s) => s.products);

  const auth = getPartnerAuth();
  const partner = useMemo(() => {
    return auth?.supplierId
      ? suppliers.find((s) => s.id === auth.supplierId)
      : suppliers.find((s) => s.terminal.enabled && s.terminal.username === auth?.username);
  }, [suppliers, auth]);

  /** 经营地区：默认合作商注册地址所在的省/市/县 */
  const [selProv, setSelProv] = useState(partner?.registeredProvince ?? '');
  const [selCity, setSelCity] = useState(partner?.registeredCity ?? '');
  const [selDist, setSelDist] = useState(partner?.registeredDistrict ?? '');
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<CustomerItem | null>(null);
  const [brand, setBrand] = useState('');
  const [prodPage, setProdPage] = useState(1);
  const [prodPageSize, setProdPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const selPath = buildSelPath(selProv, selCity, selDist);

  /** 命中经营地区的入池客户 */
  const matched = useMemo(() => customerItems.filter((c) => {
    const cfg = poolConfigs[c.id];
    if (!cfg?.enabled) return false;
    return scopeOverlap(selPath, cfg);
  }), [poolConfigs, selPath]);

  const filtered = useMemo(() => {
    const kw = keyword.trim();
    return matched.filter((c) => !kw || c.name.includes(kw) || (c.shortName ?? '').includes(kw) || c.contactPerson.includes(kw));
  }, [matched, keyword]);

  /** 客户卡片：一行 5 个、两行（每页 10），下方居中分页 */
  const pagedCustomers = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); setSelected(null); }, [selProv, selCity, selDist, keyword]);

  /** 选中客户的可报商品（报品=是） */
  const orderableProducts = useMemo(() => (selected ? orderableProductsOf(selected, customerQuotes, storeProducts) : []), [selected, customerQuotes, storeProducts]);

  /** 左侧品牌栏 */
  const brandNav = useMemo(() => {
    const map = new Map<string, number>();
    orderableProducts.forEach((p) => map.set(p.brand, (map.get(p.brand) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
  }, [orderableProducts]);
  const brandProducts = useMemo(() => orderableProducts.filter((p) => !brand || p.brand === brand), [orderableProducts, brand]);
  /** 可报商品列表分页 */
  const prodTotalPages = Math.max(1, Math.ceil(brandProducts.length / prodPageSize));
  const pagedBrandProducts = brandProducts.slice((prodPage - 1) * prodPageSize, prodPage * prodPageSize);
  useEffect(() => { setProdPage(1); }, [selected?.id, brand, prodPageSize]);

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 客户池"
        title="客户池"
        desc="经营地区默认取贵司注册地址所在的省/市/县，可自由切换。展示入池范围覆盖当前经营地区的客户（入池=是）；点击客户卡片，下方展示该客户报品商品与报价（由平台报品报（调）价统一设置）。"
      />

      {/* 经营地区筛选 */}
      <div className="pk-toolbar">
        <span style={{ fontSize: 13, color: 'var(--pk-ink2)', fontWeight: 500 }}>经营地区：</span>
        <select className="filter-select" value={selProv} onChange={(e) => { setSelProv(e.target.value); setSelCity(''); setSelDist(''); }}>
          <option value="">全部省份</option>
          {PROVINCE_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="filter-select" disabled={!selProv} value={selCity} onChange={(e) => { setSelCity(e.target.value); setSelDist(''); }}>
          <option value="">全部地市</option>
          {(selProv ? getCities(selProv).map((c) => c.name) : []).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" disabled={!selCity} value={selDist} onChange={(e) => setSelDist(e.target.value)}>
          <option value="">全部区县</option>
          {(selProv && selCity ? getDistricts(selProv, selCity) : []).map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input className="filter-input" placeholder="搜索客户名称、联系人..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <span className="pk-count">共 {filtered.length} 家客户</span>
      </div>

      {/* 客户卡片：一行 5 个 × 两行，下方居中分页 */}
      {filtered.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--pk-ink3)', fontSize: 13, background: '#fff', borderRadius: 12 }}>
          当前经营地区暂无客户：仅展示入池范围覆盖该地区且入池状态为「是」的客户。
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(144px, 1fr))', gap: 12, marginBottom: 4, overflowX: 'auto' }}>
          {pagedCustomers.map((c) => {
            const cfg = poolConfigs[c.id];
            const prodCount = orderableProductsOf(c, customerQuotes, storeProducts).length;
            const on = selected?.id === c.id;
            return (
              <button key={c.id} type="button" onClick={() => { setSelected(on ? null : c); setBrand(''); setPage(1); }}
                style={{
                  textAlign: 'left', cursor: 'pointer', padding: '10px 12px', borderRadius: 10, position: 'relative',
                  border: `2px solid ${on ? '#01795D' : 'var(--pk-line)'}`,
                  background: on ? 'var(--pk-accent-soft)' : '#fff',
                  display: 'flex', flexDirection: 'column', gap: 5, minHeight: 120,
                }}>
                <span style={{ position: 'absolute', top: 8, right: 8 }} title={c.status === 'active' ? '合作中' : '已暂停'}>
                  <Pill tone={c.status === 'active' ? 'green' : 'amber'}>{c.status === 'active' ? '合作中' : '已暂停'}</Pill>
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--pk-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 56 }}>{c.shortName || c.name}</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: on ? '#01795D' : 'var(--pk-ink2)' }}>{prodCount}</span>
                  <span style={{ fontSize: 11, color: 'var(--pk-ink3)' }}>款商品可供货</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--pk-ink3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={poolScopeText(cfg)}>
                  地区：{poolScopeText(cfg)}
                </div>
              </button>
            );
          })}
        </div>
      )}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} label="家客户" />
        </div>
      )}

      {/* 选中客户：可报商品（左品牌栏 + 右商品列表，参照供货报价） */}
      {selected && (
        <div className="pk-panel" style={{ marginTop: 18 }}>
          <div className="pk-panel-head" style={{ flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' }}>
            <div className="pk-panel-title">
              {selected.shortName || selected.name}
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--pk-ink3)' }}>
                {CUSTOMER_TYPE_LABELS[selected.type]} · {selected.level} · 可报商品 {orderableProducts.length} 款 · 报价由平台「报品报（调）价」设置
              </span>
            </div>
            <input className="filter-input" placeholder="搜索商品名称..." style={{ width: 180, height: 32, fontSize: 13 }} value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div className="pk-panel-body">
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              {/* 左侧品牌栏 */}
              <div className="pk-panel" style={{ width: 200, flexShrink: 0, margin: 0 }}>
                <div className="pk-panel-head" style={{ paddingBottom: 10 }}>
                  <div className="pk-panel-title" style={{ fontSize: 13 }}>商品品牌</div>
                </div>
                <div className="pk-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button type="button" onClick={() => setBrand('')}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                      padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                      border: brand === '' ? '1px solid var(--pk-accent)' : '1px solid transparent',
                      background: brand === '' ? 'var(--pk-accent-soft)' : 'transparent',
                      color: brand === '' ? '#01795D' : 'var(--pk-ink2)',
                      fontWeight: brand === '' ? 600 : 500, fontSize: 13,
                    }}>
                    全部品牌
                    <span style={{ fontSize: 12, color: 'var(--pk-ink3)' }}>{orderableProducts.length}</span>
                  </button>
                  {brandNav.map((b) => (
                    <button key={b.name} type="button" onClick={() => setBrand(b.name)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                        padding: '8px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                        border: brand === b.name ? '1px solid var(--pk-accent)' : '1px solid transparent',
                        background: brand === b.name ? 'var(--pk-accent-soft)' : 'transparent',
                        color: brand === b.name ? '#01795D' : 'var(--pk-ink2)',
                        fontWeight: brand === b.name ? 600 : 500, fontSize: 13,
                      }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--pk-ink3)' }}>{b.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 右侧商品列表（分页位于其下方） */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="pk-table-panel" style={{ margin: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>序号</th><th>商品编号</th><th>商品名称</th><th>品牌</th><th>分类</th>
                      <th>市场价</th><th>客户报价</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedBrandProducts.map((p, idx) => {
                      const quote = effectiveCustomerQuote(customerQuotes, selected.id, p.id, storeProducts);
                      return (
                        <tr key={p.id}>
                          <td className="mono" style={{ color: 'var(--pk-ink3)' }}>{idx + 1}</td>
                          <td className="cell-mono-emph">{p.code}</td>
                          <td className="cell-emph">{p.name}</td>
                          <td>{p.brand}</td>
                          <td className="cell-muted">{p.category}</td>
                          <td className="mono">{money(p.marketPrice)}</td>
                          <td className="mono" style={{ fontWeight: 600, color: quote !== undefined ? '#01795D' : 'var(--pk-ink3)' }}>
                            {quote !== undefined ? money(quote) : `${money(p.marketPrice)}（未单独报价）`}
                          </td>
                        </tr>
                      );
                    })}
                    {brandProducts.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--pk-ink3)', padding: '28px 0' }}>该品牌下暂无可报商品</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {(brandProducts.length > 0) && (
                <Pagination total={brandProducts.length} page={prodPage} pageSize={prodPageSize} onPage={setProdPage} onPageSize={setProdPageSize} label="款商品" />
              )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
