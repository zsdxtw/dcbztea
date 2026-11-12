import { useEffect, useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { teaProducts } from '../../data/teaProducts';
import { useSupplierStore } from '../../stores/supplierStore';
import type { SupplierItem, SupplierType, TeaProduct } from '../../types';

/* ── 工具函数 ── */
const formatMoney = (n: number) => `¥${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
const rateOf = (price: number, market: number) => market > 0 ? Math.round((price / market) * 100) : 0;

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

/** 采购报价合作商选项（品牌商 / 供应商，含终端开通与类型标记） */
interface QuotePartnerOption {
  id: string;
  name: string;
  types: SupplierType[];
  terminalOn: boolean;
}

/**
 * 采购报价配置器（参照销售-报品报（调）价 页面设计）：
 * 左侧品牌栏（点击选中）→ 品牌统一采购折扣 → 商品列表对单个商品设置单独折扣 / 单独报价。
 * 报价方式：单独报价 > 单独折扣 > 品牌统一折扣 >（供货未报价时）市场价。
 * 数据写入共享 quoteSettings，与合作商工作台「报价管理」实时双向同步。
 */
function PurchaseQuoteConfigurator({ partners, selectedId, onSelect }: {
  partners: QuotePartnerOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const suppliers = useSupplierStore((s) => s.suppliers);
  const quoteSettings = useSupplierStore((s) => s.quoteSettings);
  const updateQuoteSetting = useSupplierStore((s) => s.updateQuoteSetting);

  const partner = partners.find((c) => c.id === selectedId) ?? partners[0];
  const setting = useMemo(
    () => quoteSettings[partner?.id ?? ''] ?? { supplierId: partner?.id ?? '', brandDiscounts: {}, productOverrides: {} },
    [quoteSettings, partner],
  );
  const supplyMap = setting.supplyProducts ?? {};
  const isSupplied = (productId: string) => supplyMap[productId] === true;

  /** 左侧品牌栏：全部平台品牌（含未配置品牌） */
  const brands = useMemo(() => {
    const map = new Map<string, number>();
    teaProducts.forEach((p) => map.set(p.brand, (map.get(p.brand) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
  }, []);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [discountDraft, setDiscountDraft] = useState('');
  const [keyword, setKeyword] = useState('');
  /** 是否供货筛选（全部 / 是 / 否） */
  const [supplyFilter, setSupplyFilter] = useState<'all' | 'yes' | 'no'>('all');
  /** 报价方式筛选 */
  const [modeFilter, setModeFilter] = useState<'all' | 'price' | 'discount' | 'brand' | 'market'>('all');
  /** 列表分页：每页条数（10/20/50）与当前页 */
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  /** 单品报价设置弹窗（跟随品牌 / 单独折扣 / 单独报价） */
  const [overrideDialog, setOverrideDialog] = useState<{ product: TeaProduct; mode: 'none' | 'discount' | 'price'; value: string } | null>(null);

  /** 右侧商品列表：选中品牌后仅展示该品牌，支持搜索 / 是否供货 / 报价方式筛选 */
  const listProducts = useMemo(() => {
    const kw = keyword.trim();
    return teaProducts.filter((p) => {
      if (selectedBrand && p.brand !== selectedBrand) return false;
      if (kw && !p.name.includes(kw) && !p.code.includes(kw)) return false;
      if (supplyFilter === 'yes' && supplyMap[p.id] !== true) return false;
      if (supplyFilter === 'no' && supplyMap[p.id] === true) return false;
      const ov = setting.productOverrides[p.id];
      if (modeFilter !== 'all') {
        if (modeFilter === 'price' && ov?.type !== 'price') return false;
        if (modeFilter === 'discount' && ov?.type !== 'discount') return false;
        if (modeFilter === 'brand' && setting.brandDiscounts[p.brand] === undefined) return false;
        if (modeFilter === 'market' && (ov !== undefined || setting.brandDiscounts[p.brand] !== undefined)) return false;
      }
      return true;
    });
  }, [selectedBrand, keyword, supplyFilter, modeFilter, setting]);

  /** 分页：筛选/搜索/页大小变化回第 1 页，越界自动收敛 */
  const totalPages = Math.max(1, Math.ceil(listProducts.length / pageSize));
  const pagedProducts = listProducts.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [keyword, supplyFilter, modeFilter, selectedBrand, pageSize, partner?.id]);
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

  if (!partner) return null;

  /** 供货价（单独报价 > 单独折扣 > 品牌折扣 > 供货未报价按市场价；未供货为 —） */
  const supplyPriceOf = (p: TeaProduct): number | null => {
    if (!isSupplied(p.id)) return null;
    const ov = setting.productOverrides[p.id];
    if (ov?.type === 'price') return ov.value;
    if (ov?.type === 'discount') return Math.round(p.marketPrice * ov.value) / 100;
    const bd = setting.brandDiscounts[p.brand];
    if (bd) return Math.round(p.marketPrice * bd) / 100;
    return p.marketPrice;
  };

  /** 报价方式标签 */
  const modeTag = (p: TeaProduct) => {
    const ov = setting.productOverrides[p.id];
    if (ov?.type === 'price') return { text: '单独报价', on: true };
    if (ov?.type === 'discount') return { text: `单独折扣 ${ov.value}%`, on: true };
    const bd = setting.brandDiscounts[p.brand];
    if (bd !== undefined) return { text: `品牌折扣 ${bd}%`, on: true };
    return isSupplied(p.id) ? { text: '市场价（供货未报价）', on: false } : { text: '市场价', on: false };
  };

  const saveBrandDiscount = () => {
    const v = Number(discountDraft);
    if (!discountDraft || Number.isNaN(v) || v <= 0 || v > 100) { window.alert('请输入 1-100 之间的折扣百分比（如 85 表示市场价的 85%）'); return; }
    updateQuoteSetting(partner.id, { ...setting, brandDiscounts: { ...setting.brandDiscounts, [selectedBrand]: v } });
    setDiscountDraft('');
  };
  const saveOverride = () => {
    if (!overrideDialog) return;
    const { mode, value, product } = overrideDialog;
    const nextOverrides = { ...setting.productOverrides };
    if (mode === 'none') {
      delete nextOverrides[product.id];
    } else {
      const v = Number(value);
      if (!value || Number.isNaN(v) || v <= 0) { window.alert(mode === 'discount' ? '请输入有效的折扣百分比（如 85）' : '请输入有效的报价（元）'); return; }
      if (mode === 'discount' && v > 100) { window.alert('折扣百分比不能超过 100'); return; }
      nextOverrides[product.id] = { type: mode, value: v };
    }
    updateQuoteSetting(partner.id, { ...setting, productOverrides: nextOverrides });
    setOverrideDialog(null);
  };

  return (
    <div>
      {/* 合作商下拉选择 */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>选择合作商：</label>
        <select className="filter-select" value={partner.id} onChange={(e) => {
          onSelect(e.target.value);
          setSelectedBrand('');
          setDiscountDraft('');
          setKeyword('');
          setSupplyFilter('all');
          setModeFilter('all');
        }} style={{ width: 260 }}>
          {partners.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {partner.types.map((t) => (
          <span key={t} style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: t === 'brand' ? '#FDECEF' : '#E5F6F9', color: t === 'brand' ? '#CB405D' : '#0E7C95', fontWeight: 'var(--font-medium)' }}>
            {t === 'brand' ? '品牌商' : t === 'supplier' ? '供应商' : '服务商'}
          </span>
        ))}
        <span style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: partner.terminalOn ? '#E8F5E9' : 'var(--color-neutral-100)', color: partner.terminalOn ? '#01795D' : 'var(--color-neutral-500)', fontWeight: 'var(--font-medium)' }}>
          {partner.terminalOn ? '终端已开通' : '终端未开通'}
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>报价与合作商工作台「报价管理」实时双向同步</span>
      </div>

      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
        {/* 左侧品牌栏：全部品牌 */}
        <div style={{ width: 216, flexShrink: 0, border: '1px solid var(--color-neutral-100)', borderRadius: 'var(--radius-md)', background: 'var(--color-neutral-0)' }}>
          <div style={{ padding: '10px 12px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', borderBottom: '1px solid var(--color-neutral-100)' }}>全部品牌</div>
          <div style={{ maxHeight: 520, overflowY: 'auto', padding: 4 }}>
            <button
              onClick={() => { setSelectedBrand(''); setDiscountDraft(''); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                border: selectedBrand === '' ? '1px solid var(--color-module-current-base)' : '1px solid transparent',
                background: selectedBrand === '' ? 'var(--color-module-current-lightest)' : 'transparent',
                color: selectedBrand === '' ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
                fontWeight: selectedBrand === '' ? 'var(--font-medium)' : 500, fontSize: 'var(--text-sm)',
              }}
            >
              全部品牌
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{teaProducts.length}</span>
            </button>
            {brands.map((b) => {
              const active = selectedBrand === b.name;
              const discount = setting.brandDiscounts[b.name];
              return (
                <button
                  key={b.name}
                  onClick={() => { setSelectedBrand(b.name); setDiscountDraft(discount != null ? String(discount) : ''); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, width: '100%',
                    padding: '9px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: active ? '1px solid var(--color-module-current-base)' : '1px solid transparent',
                    background: active ? 'var(--color-module-current-lightest)' : 'transparent',
                    color: active ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
                    fontWeight: active ? 'var(--font-medium)' : 500, fontSize: 'var(--text-sm)',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    {discount != null && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-module-current-base)', background: 'var(--color-module-current-lightest)', borderRadius: 999, padding: '1px 7px' }}>{discount}%</span>}
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{b.count}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右侧：品牌统一折扣设置 + 商品列表 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selectedBrand && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-module-current-lightest)', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)' }}>{selectedBrand} · 品牌统一采购折扣</span>
              <input
                className="filter-input" type="number" min={1} max={100} placeholder="如 85"
                style={{ width: 110, height: 32, fontSize: 13 }} value={discountDraft}
                onChange={(e) => setDiscountDraft(e.target.value)}
              />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>%（基于市场价，对该品牌下未单独设置的商品生效，合作商终端同步可见）</span>
              <Button size="sm" onClick={saveBrandDiscount}>保存折扣</Button>
              {setting.brandDiscounts[selectedBrand] != null && (
                <Button size="sm" variant="ghost" onClick={() => {
                  const next = { ...setting.brandDiscounts };
                  delete next[selectedBrand];
                  updateQuoteSetting(partner.id, { ...setting, brandDiscounts: next });
                  setDiscountDraft('');
                }}>清除折扣</Button>
              )}
            </div>
          )}

          <div style={{ border: '1px solid var(--color-neutral-100)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--color-neutral-100)', background: 'var(--color-neutral-50)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)', flexShrink: 0 }}>
                {selectedBrand || '全部品牌'}的商品
                <span style={{ fontWeight: 500, color: 'var(--color-neutral-400)', marginLeft: 8 }}>共 {listProducts.length} 个</span>
              </span>
              <input className="filter-input" placeholder="搜索商品名称 / 编号" style={{ width: 180, height: 30, fontSize: 13 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', fontWeight: 'var(--font-medium)', flexShrink: 0, marginLeft: 4 }}>是否供货：</span>
              <select
                className="filter-select" style={{ height: 30, fontSize: 13 }} value={supplyFilter}
                onChange={(e) => setSupplyFilter(e.target.value as 'all' | 'yes' | 'no')}
                title="按是否供货筛选（供货状态由合作商终端维护，此处实时同步）"
              >
                <option value="all">全部</option>
                <option value="yes">是</option>
                <option value="no">否</option>
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
                  <th style={{ width: 44 }}>序号</th><th style={{ width: 82 }}>图片</th><th>商品名称</th><th>品牌 / 规格</th><th>市场价</th><th>供货价</th>
                  <th>折扣率</th>
                  <th>报价方式</th>
                  <th style={{ width: 110, textAlign: 'center' }}>是否供货</th>
                  <th style={{ width: 90 }}>操作（设置）</th>
                </tr>
              </thead>
              <tbody>
                {pagedProducts.map((p, idx) => {
                  const supplyPrice = supplyPriceOf(p);
                  const mode = modeTag(p);
                  const supplied = isSupplied(p.id);
                  return (
                    <tr key={p.id}>
                      <td className="mono" style={{ color: 'var(--color-neutral-500)' }}>{(page - 1) * pageSize + idx + 1}</td>
                      <td><ProductThumb p={p} /></td>
                      <td>
                        <div className="cell-emph" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{p.spec}</div>
                      </td>
                      <td style={{ fontSize: 'var(--text-sm)' }}>{p.brand}</td>
                      <td className="mono">{formatMoney(p.marketPrice)}</td>
                      <td>
                        <div className="mono" style={{ fontWeight: mode.on ? 'var(--font-semibold)' : 400, color: mode.on ? 'var(--color-module-current-base)' : supplied ? 'var(--color-neutral-600)' : 'var(--color-neutral-300)' }}>
                          {supplyPrice !== null ? formatMoney(supplyPrice) : '—'}
                        </div>
                        {supplied && setting.productOverrides[p.id] === undefined && setting.brandDiscounts[p.brand] === undefined && (
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>供货未报价 · 按市场价</div>
                        )}
                      </td>
                      <td className="mono" style={{ fontSize: 'var(--text-sm)', color: mode.on ? 'var(--color-module-current-base)' : 'var(--color-neutral-400)' }}>
                        {supplyPrice !== null ? `${rateOf(supplyPrice, p.marketPrice)}%` : '—'}
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 9px', borderRadius: 999, fontSize: 'var(--text-xs)', fontWeight: 500, whiteSpace: 'nowrap',
                          background: mode.on ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-100)',
                          color: mode.on ? 'var(--color-module-current-base)' : 'var(--color-neutral-400)',
                        }}>
                          {mode.text}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 'var(--text-xs)', fontWeight: 500,
                          background: supplied ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-100)',
                          color: supplied ? 'var(--color-module-current-base)' : 'var(--color-neutral-400)',
                        }} title="供货状态由合作商在工作台「报价管理」中维护，此处实时同步展示">
                          {supplied ? '是' : '否'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-module-current-base)', padding: '2px 4px', fontWeight: 500 }}
                          onClick={() => {
                            const ov = setting.productOverrides[p.id];
                            setOverrideDialog({
                              product: p,
                              mode: ov?.type === 'price' ? 'price' : ov?.type === 'discount' ? 'discount' : 'none',
                              value: ov ? String(ov.value) : '',
                            });
                          }}
                        >
                          报价
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {listProducts.length === 0 && (
                  <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--color-neutral-400)', padding: 'var(--space-4)' }}>暂无商品</td></tr>
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
            采购报价方式优先级：单独报价 &gt; 单独折扣 &gt; 品牌统一折扣 &gt;（供货未报价时）市场价。供货状态由合作商在工作台「报价管理」中以开关维护，本页实时同步展示；
            本页设置的品牌统一折扣与单品报价同样实时同步至合作商终端。
          </div>
        </div>
      </div>

      {/* 单品报价设置弹窗（跟随品牌 / 单独折扣 / 单独报价） */}
      {overrideDialog && (
        <div className="category-dialog-overlay" onClick={() => setOverrideDialog(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 440, maxWidth: '94vw' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 4 }}>设置单品采购报价</h3>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)', lineHeight: 1.8 }}>
              {partner.name} · {overrideDialog.product.name} · {overrideDialog.product.brand} · 市场价 {formatMoney(overrideDialog.product.marketPrice)}
              {setting.brandDiscounts[overrideDialog.product.brand] !== undefined ? ` · 品牌折扣 ${setting.brandDiscounts[overrideDialog.product.brand]}%` : ''}
              {isSupplied(overrideDialog.product.id) ? ' · 该商品该合作商已选择供货' : ' · 该商品该合作商未选择供货（设置报价后仍需合作商供货才有供货价）'}
            </div>
            {([
              ['none', '跟随品牌折扣', '清除单品设置，按品牌统一采购折扣计算'],
              ['discount', '单独折扣', '供货价 = 该商品市场价 × 折扣%'],
              ['price', '单独报价', '直接指定该商品供货价（元）'],
            ] as const).map(([m, name, desc]) => (
              <label key={m} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius-md)', border: `1px solid ${overrideDialog.mode === m ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`, background: overrideDialog.mode === m ? 'var(--color-module-current-lightest)' : 'transparent', cursor: 'pointer', marginBottom: 8 }}>
                <input type="radio" name="pov-mode" checked={overrideDialog.mode === m} onChange={() => setOverrideDialog({ ...overrideDialog, mode: m, value: '' })} style={{ marginTop: 3 }} />
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" onClick={() => setOverrideDialog(null)}>取消</Button>
              <Button onClick={saveOverride}>保存</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 页面：采购报价（品牌商/供应商采购报价配置，与合作商终端报价管理双向同步） */
export default function PurchasePricing() {
  const suppliers = useSupplierStore((s) => s.suppliers);

  /** 参与采购报价的合作商：类型含品牌商或供应商（含合作商档案主品牌数量副标） */
  const partners: QuotePartnerOption[] = useMemo(
    () => suppliers
      .filter((s: SupplierItem) => s.status === 'active' && (s.types.includes('brand') || s.types.includes('supplier')))
      .map((s) => ({ id: s.id, name: s.name, types: s.types, terminalOn: s.terminal.enabled })),
    [suppliers],
  );
  const [selectedId, setSelectedId] = useState('');

  return (
    <>
      <ContentHeader title="采购报价" breadcrumbs={['采购&仓储', '采购报价']} />
      <div className="content-body">
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }}>
          管理后台对<strong>品牌商 / 供应商</strong>各品牌各商品的采购报价配置：报价方式优先级为 单品报价 &gt; 品牌统一折扣（市场价×折扣%）&gt; 供货未报价按市场价；
          「是否供货」由合作商在工作台「报价管理」中逐商品开关维护。数据与合作商工作台实时双向同步。
        </div>
        <Card style={{ padding: 'var(--space-4)' }}>
          {partners.length > 0 ? (
            <PurchaseQuoteConfigurator partners={partners} selectedId={partners.find((p) => p.id === selectedId)?.id ?? partners[0].id} onSelect={setSelectedId} />
          ) : (
            <div style={{ padding: 'var(--space-5)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无在册品牌商 / 供应商</div>
          )}
        </Card>
      </div>
    </>
  );
}
