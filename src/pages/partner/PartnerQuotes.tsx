import { useMemo, useState } from 'react';
import { PageHead } from './PartnerUI';
import { getPartnerAuth } from './PartnerLayout';
import { useSupplierStore } from '../../stores/supplierStore';
import { teaProducts } from '../../data/teaProducts';
import { brandItems } from '../../data/brands';
import { getMedianQuote, getMedianSalesPrice } from '../../data/prices';
import type { TeaProduct, PartnerQuoteSetting, PartnerQuoteOverride } from '../../types';
import './partner.css';

/** 报价菜单：左侧主营品牌栏 + 右侧平台商品列表（市场价/中位数报价/中位数售价），
 *  支持品牌整体折扣、单品单独折扣/单独价格，及「新品提醒」提报 */
export default function PartnerQuotes() {
  const auth = getPartnerAuth();
  const suppliers = useSupplierStore(s => s.suppliers);
  const quoteSettings = useSupplierStore(s => s.quoteSettings);
  const updateQuoteSetting = useSupplierStore(s => s.updateQuoteSetting);
  const arrivalReminders = useSupplierStore(s => s.arrivalReminders);
  const submitArrivalReminder = useSupplierStore(s => s.submitArrivalReminder);

  const supplier = useMemo(
    () => suppliers.find(s => s.id === auth?.supplierId) ?? suppliers.find(s => s.terminal.enabled && s.terminal.username === auth?.username),
    [suppliers, auth],
  );

  /** 当前合作商报价设置 */
  const setting: PartnerQuoteSetting = useMemo(
    () => quoteSettings[supplier?.id ?? ''] ?? { supplierId: supplier?.id ?? '', brandDiscounts: {}, productOverrides: {} },
    [quoteSettings, supplier],
  );
  const supplyMap = setting.supplyProducts ?? {};
  /** 该商品是否供货（缺省=不供货） */
  const isSupplied = (productId: string) => supplyMap[productId] === true;

  /** 左侧品牌栏：该合作商的主营品牌（无档案品牌时回退为全部平台品牌）；count=品牌下商品总数，supplyCount=其中供货商品数 */
  const brandNav = useMemo(() => {
    const brands = supplier?.mainBrands?.length ? supplier.mainBrands : brandItems.map(b => b.name);
    const counts = new Map<string, number>();
    const supplies = new Map<string, number>();
    teaProducts.forEach(p => {
      counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
      if (supplyMap[p.id] === true) supplies.set(p.brand, (supplies.get(p.brand) ?? 0) + 1);
    });
    return brands.map(name => ({ name, count: counts.get(name) ?? 0, supplyCount: supplies.get(name) ?? 0 }));
  }, [supplier, supplyMap]);

  const [selectedBrand, setSelectedBrand] = useState('');
  const [keyword, setKeyword] = useState('');
  /** 是否供货筛选（全部 / 是 / 否） */
  const [supplyFilter, setSupplyFilter] = useState<'all' | 'yes' | 'no'>('all');
  /** 报价方式筛选（全部 / 单独价格 / 单独折扣 / 品牌折扣 / 市场价） */
  const [modeFilter, setModeFilter] = useState<'all' | 'price' | 'discount' | 'brand' | 'market'>('all');
  /** 品牌整体折扣编辑草稿（选中具体品牌时可用） */
  const [discountDraft, setDiscountDraft] = useState('');
  /** 单品报价设置弹窗 */
  const [overrideDialog, setOverrideDialog] = useState<{ product: TeaProduct; mode: PartnerQuoteOverride['type'] | 'none'; value: string } | null>(null);
  /** 新品提报弹窗 / 提报管理弹窗 */
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderMgmtOpen, setReminderMgmtOpen] = useState(false);
  const [reminderForm, setReminderForm] = useState({ brand: '', productName: '', productUrl: '' });
  const [reminderMsg, setReminderMsg] = useState('');

  /** 右侧商品列表：默认全部品牌的全部商品，选中品牌后仅展示该品牌商品；支持搜索与是否供货筛选 */
  const products = useMemo(() => teaProducts.filter(p => {
    if (selectedBrand && p.brand !== selectedBrand) return false;
    if (keyword && !p.name.includes(keyword) && !p.code.includes(keyword)) return false;
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
  }), [selectedBrand, keyword, supplyFilter, modeFilter, supplyMap, setting]);

  /** 切换某商品是否供货（写入共享 quoteSettings，管理后台采购报价页同步可见） */
  const toggleSupply = (productId: string) => {
    if (!supplier) return;
    updateQuoteSetting(supplier.id, { ...setting, supplyProducts: { ...supplyMap, [productId]: supplyMap[productId] !== true } });
  };

  const saveBrandDiscount = () => {
    if (!supplier) return;
    const v = Number(discountDraft);
    if (!discountDraft || Number.isNaN(v) || v <= 0 || v > 100) { window.alert('请输入 1-100 之间的折扣百分比（如 85 表示市场价的 85%）'); return; }
    updateQuoteSetting(supplier.id, { ...setting, brandDiscounts: { ...setting.brandDiscounts, [selectedBrand]: v } });
  };
  const clearBrandDiscount = () => {
    if (!supplier || !selectedBrand) return;
    const next = { ...setting.brandDiscounts };
    delete next[selectedBrand];
    updateQuoteSetting(supplier.id, { ...setting, brandDiscounts: next });
    setDiscountDraft('');
  };

  const saveOverride = () => {
    if (!supplier || !overrideDialog) return;
    const { product, mode, value } = overrideDialog;
    const nextOverrides = { ...setting.productOverrides };
    if (mode === 'none') {
      delete nextOverrides[product.id];
    } else {
      const v = Number(value);
      if (!value || Number.isNaN(v) || v <= 0) { window.alert(mode === 'discount' ? '请输入有效的折扣百分比（如 85）' : '请输入有效的报价（元）'); return; }
      if (mode === 'discount' && v > 100) { window.alert('折扣百分比不能超过 100'); return; }
      nextOverrides[product.id] = { type: mode, value: v };
    }
    updateQuoteSetting(supplier.id, { ...setting, productOverrides: nextOverrides });
    setOverrideDialog(null);
  };

  const submitReminder = () => {
    if (!supplier) return;
    const { brand, productName, productUrl } = reminderForm;
    if (!brand) { setReminderMsg('请选择品牌'); return; }
    if (!productName.trim()) { setReminderMsg('请输入商品名称'); return; }
    if (!productUrl.trim()) { setReminderMsg('请输入商品电商平台链接'); return; }
    submitArrivalReminder({
      supplierId: supplier.id,
      supplierName: supplier.name,
      brand,
      productName: productName.trim(),
      productUrl: productUrl.trim(),
      submitter: auth?.name || auth?.username || '合作商',
    });
    setReminderMsg('');
    setReminderForm({ brand: '', productName: '', productUrl: '' });
    setReminderOpen(false);
  };

  /** 我的报价：单品覆盖（单独价格/单独折扣） > 品牌整体折扣 > 未设置（按市场价） */
  const getMyQuote = (p: TeaProduct): { price: number | null; mode: string } => {
    const ov = setting.productOverrides[p.id];
    if (ov?.type === 'price') return { price: ov.value, mode: '单独价格' };
    if (ov?.type === 'discount') return { price: Math.round(p.marketPrice * ov.value) / 100 * 100 === 0 ? 0 : Math.round(p.marketPrice * ov.value / 100 * 100) / 100, mode: '单独折扣' };
    const bd = setting.brandDiscounts[p.brand];
    if (bd) return { price: Math.round(p.marketPrice * bd) / 100 * 100 === 0 ? 0 : Math.round(p.marketPrice * bd / 100 * 100) / 100, mode: '品牌折扣' };
    return { price: null, mode: '未设置' };
  };

  const fmtMoney = (n: number | null) => n == null ? '—' : `¥${n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;

  if (!supplier) {
    return (
      <div className="pk-page">
        <PageHead eyebrow="合作商终端 · 报价" title="报价管理" desc="未找到关联的合作商档案，请联系平台运营。" />
      </div>
    );
  }

  const myReminders = arrivalReminders.filter(r => r.supplierId === supplier.id);

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 报价"
        title="报价管理"
        desc="左侧为贵司的主营品牌，右侧为平台在售商品（数据来源于管理后台商品菜单）。展示每个商品的市场价、中位数报价（去除品牌商报价外合作商报价的平均数）与中位数售价（所有客户售价的平均数）。支持按品牌整体设置报价折扣，并可对单个商品设置单独折扣或单独价格。"
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="pk-reg-submit" style={{ height: 38, padding: '0 22px', fontSize: 13, letterSpacing: 'normal', textIndent: 0 }} onClick={() => { setReminderOpen(true); setReminderMsg(''); }}>
              + 新品提报
            </button>
            <button className="pk-reg-submit" style={{ height: 38, padding: '0 22px', fontSize: 13, letterSpacing: 'normal', textIndent: 0 }} onClick={() => setReminderMgmtOpen(true)}>
              提报管理
            </button>
          </div>
        }
      />

      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
        {/* 左侧品牌栏 */}
        <div className="pk-panel" style={{ width: 232, flexShrink: 0 }}>
          <div className="pk-panel-head" style={{ paddingBottom: 12 }}>
            <div className="pk-panel-title" style={{ fontSize: 13 }}>公司主营品牌</div>
          </div>
          <div className="pk-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              type="button"
              onClick={() => { setSelectedBrand(''); setDiscountDraft(''); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                border: selectedBrand === '' ? '1px solid var(--color-module-current-base)' : '1px solid transparent',
                background: selectedBrand === '' ? 'rgba(1,121,93,0.06)' : 'transparent',
                color: selectedBrand === '' ? '#01795D' : 'var(--pk-ink2)',
                fontWeight: selectedBrand === '' ? 600 : 500, fontSize: 13,
              }}
            >
              全部品牌
              <span style={{ fontSize: 12, color: 'var(--pk-ink3)' }}>{teaProducts.length}（{teaProducts.filter(p => supplyMap[p.id] === true).length}）</span>
            </button>
            {brandNav.map(b => {
              const active = selectedBrand === b.name;
              const discount = setting.brandDiscounts[b.name];
              return (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => { setSelectedBrand(b.name); setDiscountDraft(discount ? String(discount) : ''); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, width: '100%',
                    padding: '9px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: active ? '1px solid var(--color-module-current-base)' : '1px solid transparent',
                    background: active ? 'rgba(1,121,93,0.06)' : 'transparent',
                    color: active ? '#01795D' : 'var(--pk-ink2)',
                    fontWeight: active ? 600 : 500, fontSize: 13,
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    {discount != null && <span style={{ fontSize: 11, fontWeight: 600, color: '#01795D', background: '#E6F2ED', borderRadius: 999, padding: '1px 7px' }}>{discount}折%</span>}
                    <span style={{ fontSize: 12, color: 'var(--pk-ink3)' }}>{b.count}（{b.supplyCount}）</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右侧商品报价区 */}
        <div className="pk-panel" style={{ flex: 1, minWidth: 0 }}>
          <div className="pk-panel-head" style={{ flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' }}>
            <div className="pk-panel-title">
              {selectedBrand || '全部品牌'}的商品
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--pk-ink3)' }}>共 {products.length} 个</span>
            </div>
            <input className="filter-input" placeholder="搜索商品名称 / 编号" style={{ width: 200, height: 32, fontSize: 13, marginLeft: 8 }} value={keyword} onChange={e => setKeyword(e.target.value)} />
            <span style={{ fontSize: 13, color: 'var(--pk-ink2)', fontWeight: 500, marginLeft: 4 }}>是否供货：</span>
            <select className="filter-select" style={{ height: 32, fontSize: 13 }} value={supplyFilter} onChange={e => setSupplyFilter(e.target.value as 'all' | 'yes' | 'no')} title="按是否供货筛选">
              <option value="all">全部</option>
              <option value="yes">是</option>
              <option value="no">否</option>
            </select>
            <span style={{ fontSize: 13, color: 'var(--pk-ink2)', fontWeight: 500, marginLeft: 4 }}>报价方式：</span>
            <select className="filter-select" style={{ height: 32, fontSize: 13 }} value={modeFilter} onChange={e => setModeFilter(e.target.value as 'all' | 'price' | 'discount' | 'brand' | 'market')} title="按报价方式筛选">
              <option value="all">全部</option>
              <option value="price">单独价格</option>
              <option value="discount">单独折扣</option>
              <option value="brand">品牌折扣</option>
              <option value="market">市场价</option>
            </select>
          </div>

          {/* 品牌整体折扣设置（选中具体品牌时） */}
          {selectedBrand && (
            <div className="pk-panel-body" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: 'rgba(1,121,93,0.04)', margin: '0 22px', padding: '12px 16px', borderRadius: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--pk-ink)' }}>{selectedBrand} · 整体报价折扣</span>
              <input
                className="filter-input" type="number" min={1} max={100} placeholder="如 85"
                style={{ width: 110, height: 32, fontSize: 13 }} value={discountDraft}
                onChange={e => setDiscountDraft(e.target.value)}
              />
              <span style={{ fontSize: 12, color: 'var(--pk-ink3)' }}>%（基于市场价，对该品牌下未单独设置的商品生效）</span>
              <button className="pk-reg-submit" style={{ height: 32, padding: '0 16px', fontSize: 12.5, letterSpacing: 'normal', textIndent: 0 }} onClick={saveBrandDiscount}>保存折扣</button>
              {setting.brandDiscounts[selectedBrand] != null && (
                <button className="pk-reg-cancel" style={{ height: 32, padding: '0 14px', fontSize: 12.5 }} onClick={clearBrandDiscount}>清除折扣</button>
              )}
            </div>
          )}

          <div className="pk-panel-body">
            <div className="pk-table-panel" style={{ margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>商品编号</th><th>商品名称</th><th>品牌</th><th>分类</th>
                    <th>市场价</th><th>中位数报价</th><th>中位数售价</th><th>我的报价</th><th>报价方式</th><th style={{ width: 92, textAlign: 'center' }}>是否供货</th><th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const mq = getMedianQuote(p.id);
                    const ms = getMedianSalesPrice(p.id);
                    const mine = getMyQuote(p);
                    return (
                      <tr key={p.id}>
                        <td className="cell-mono-emph">{p.code}</td>
                        <td className="cell-emph">{p.name}</td>
                        <td>{p.brand}</td>
                        <td className="cell-muted">{p.category}</td>
                        <td className="mono">{fmtMoney(p.marketPrice)}</td>
                        <td className="mono">{fmtMoney(mq)}</td>
                        <td className="mono">{fmtMoney(ms)}</td>
                        <td className="mono" style={{ fontWeight: 600, color: mine.price != null ? '#01795D' : 'var(--pk-ink3)' }}>
                          {mine.price != null ? fmtMoney(mine.price) : fmtMoney(p.marketPrice)}
                        </td>
                        <td>
                          <span style={{
                            padding: '2px 9px', borderRadius: 999, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                            background: mine.mode === '未设置' ? '#F0F2F1' : '#E6F2ED',
                            color: mine.mode === '未设置' ? 'var(--pk-ink3)' : '#01795D',
                          }}>
                            {mine.mode === '未设置'
                              ? (isSupplied(p.id) ? '供货价·市场价' : '市场价')
                              : mine.mode === '品牌折扣' ? `品牌折扣 ${setting.brandDiscounts[p.brand]}%` : mine.mode}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button" role="switch" aria-checked={isSupplied(p.id)}
                              title={isSupplied(p.id) ? '是否供货：是（点击改为否）' : '是否供货：否（点击改为是）'}
                              onClick={() => toggleSupply(p.id)}
                              style={{
                                position: 'relative', width: 38, height: 20, borderRadius: 999, border: 'none', cursor: 'pointer',
                                background: isSupplied(p.id) ? '#01795D' : 'var(--pk-ink3)', transition: 'background .15s', padding: 0, opacity: isSupplied(p.id) ? 1 : 0.55,
                              }}
                            >
                              <span style={{
                                position: 'absolute', top: 2, left: isSupplied(p.id) ? 20 : 2, width: 16, height: 16, borderRadius: '50%',
                                background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left .15s',
                              }} />
                            </button>
                            <span style={{ fontSize: 12, fontWeight: 500, color: isSupplied(p.id) ? '#01795D' : 'var(--pk-ink3)' }}>{isSupplied(p.id) ? '是' : '否'}</span>
                          </span>
                        </td>
                        <td>
                          <button
                            type="button" className="row-actions"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: '#01795D', padding: '2px 4px', fontWeight: 500 }}
                            onClick={() => {
                              const ov = setting.productOverrides[p.id];
                              setOverrideDialog({
                                product: p,
                                mode: ov?.type ?? 'none',
                                value: ov ? String(ov.value) : '',
                              });
                            }}
                          >
                            设置报价
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {products.length === 0 && (
                    <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--pk-ink3)', padding: '28px 0' }}>暂无商品</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 12, color: 'var(--pk-ink3)', marginTop: 10, lineHeight: 1.7 }}>
              中位数报价：去除品牌商报价外，其余合作商报价的平均数；中位数售价：所有客户售价的平均数。两项数据均来源于管理后台价格体系。我的报价优先级：单品单独价格 / 单独折扣 &gt; 品牌整体折扣 &gt; 市场价；<strong>已选择供货但未单独报价的商品，供货价按市场价计算</strong>。供货状态与管理后台「采购&仓储 → 采购报价」实时同步。
            </div>
          </div>
        </div>
      </div>

      {/* 单品报价设置弹窗 */}
      {overrideDialog && (
        <div className="category-dialog-overlay" onClick={() => setOverrideDialog(null)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ width: 440 }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 4 }}>设置单品报价</h3>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }}>
              {overrideDialog.product.name} · {overrideDialog.product.brand} · 市场价 {fmtMoney(overrideDialog.product.marketPrice)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              {([
                ['none', '跟随品牌整体折扣', '不单独设置，按品牌整体折扣（未设折扣时按市场价）计算'],
                ['discount', '单独折扣（%）', '基于市场价的折扣百分比，优先于品牌整体折扣'],
                ['price', '单独价格（元）', '直接指定报价金额，优先于品牌整体折扣'],
              ] as [PartnerQuoteOverride['type'] | 'none', string, string][]).map(([key, label, desc]) => (
                <label key={key} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: overrideDialog.mode === key ? '1px solid var(--color-module-current-base)' : '1px solid var(--color-border-primary)',
                  background: overrideDialog.mode === key ? 'var(--color-module-current-lightest)' : 'transparent',
                }}>
                  <input type="radio" checked={overrideDialog.mode === key} onChange={() => setOverrideDialog(d => d ? { ...d, mode: key } : d)} style={{ marginTop: 3 }} />
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-primary)' }}>{label}</span>
                    <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>{desc}</span>
                  </span>
                  {key !== 'none' && overrideDialog.mode === key && (
                    <input
                      className="filter-input" type="number" placeholder={key === 'discount' ? '如 85' : '如 368'}
                      style={{ width: 110, height: 30, fontSize: 'var(--text-sm)' }}
                      value={overrideDialog.value}
                      onChange={e => setOverrideDialog(d => d ? { ...d, value: e.target.value } : d)}
                    />
                  )}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <button className="pk-reg-cancel" style={{ height: 34, padding: '0 16px', fontSize: 13 }} onClick={() => setOverrideDialog(null)}>取消</button>
              <button className="pk-reg-submit" style={{ height: 34, padding: '0 18px', fontSize: 13, letterSpacing: 'normal', textIndent: 0 }} onClick={saveOverride}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 新品提醒提报弹窗 */}
      {reminderOpen && (
        <div className="category-dialog-overlay" onClick={() => setReminderOpen(false)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ width: 460 }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 4 }}>新品提报</h3>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              提报品牌商已经上市、但淡茶半盏平台未上架的商品，平台将尽快跟进上架。
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label className="drawer-label" style={{ display: 'block', marginBottom: 6 }}>品牌 *</label>
                <select className="filter-select" style={{ width: '100%' }} value={reminderForm.brand} onChange={e => setReminderForm(f => ({ ...f, brand: e.target.value }))}>
                  <option value="">请选择品牌</option>
                  {(supplier.mainBrands?.length ? supplier.mainBrands : brandItems.map(b => b.name)).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="drawer-label" style={{ display: 'block', marginBottom: 6 }}>商品名称 *</label>
                <input className="filter-input" style={{ width: '100%' }} placeholder="请输入商品名称" value={reminderForm.productName} onChange={e => setReminderForm(f => ({ ...f, productName: e.target.value }))} />
              </div>
              <div>
                <label className="drawer-label" style={{ display: 'block', marginBottom: 6 }}>商品电商平台链接 *</label>
                <input className="filter-input" style={{ width: '100%' }} placeholder="如：https://item.jd.com/xxxx.html" value={reminderForm.productUrl} onChange={e => setReminderForm(f => ({ ...f, productUrl: e.target.value }))} />
              </div>
              {reminderMsg && <div style={{ fontSize: 'var(--text-xs)', color: '#CB405D' }}>{reminderMsg}</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-5)' }}>
              <button className="pk-reg-cancel" style={{ height: 34, padding: '0 16px', fontSize: 13 }} onClick={() => setReminderOpen(false)}>取消</button>
              <button className="pk-reg-submit" style={{ height: 34, padding: '0 18px', fontSize: 13, letterSpacing: 'normal', textIndent: 0 }} onClick={submitReminder}>提交提报</button>
            </div>
          </div>
        </div>
      )}

      {/* 提报管理弹窗：此前提报的记录与进展情况 */}
      {reminderMgmtOpen && (
        <div className="category-dialog-overlay" onClick={() => setReminderMgmtOpen(false)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ width: 860, maxWidth: '94vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 4 }}>提报管理</h3>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)' }}>
              贵司此前的全部新品提报记录与处理进展（共 {myReminders.length} 条；待处理 {myReminders.filter(r => r.status === 'pending').length} · 已上架 {myReminders.filter(r => r.status === 'listed').length} · 已忽略 {myReminders.filter(r => r.status === 'dismissed').length}）；处理进度可在管理平台「商品 &gt; 新品提醒」中由平台跟进。
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['提报编号', '品牌', '商品名称', '电商平台链接', '提报时间', '当前进展', '处理说明'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--color-border-primary)', color: 'var(--pk-ink2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myReminders.map(r => (
                    <tr key={r.id}>
                      <td className="cell-mono-emph" style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-neutral-100)' }}>{r.code}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-neutral-100)' }}>{r.brand}</td>
                      <td className="cell-emph" style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-neutral-100)' }}>{r.productName}</td>
                      <td className="cell-muted" style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-neutral-100)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.productUrl}</td>
                      <td className="cell-muted" style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-neutral-100)', whiteSpace: 'nowrap' }}>{r.submitTime}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-neutral-100)' }}>
                        <span style={{
                          padding: '2px 9px', borderRadius: 999, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                          background: r.status === 'pending' ? '#FFF6E5' : r.status === 'listed' ? '#E6F2ED' : '#F0F2F1',
                          color: r.status === 'pending' ? '#B26A00' : r.status === 'listed' ? '#01795D' : 'var(--pk-ink3)',
                        }}>
                          {r.status === 'pending' ? '待处理（平台跟进中）' : r.status === 'listed' ? `已上架${r.handleTime ? ` · ${r.handleTime}` : ''}` : `已忽略${r.handleTime ? ` · ${r.handleTime}` : ''}`}
                        </span>
                      </td>
                      <td className="cell-muted" style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-neutral-100)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.handleNote ?? '—'}
                      </td>
                    </tr>
                  ))}
                  {myReminders.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--pk-ink3)', padding: '24px 0' }}>暂无提报记录，点击右上角「+ 新品提报」提交</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)', flexShrink: 0 }}>
              <button className="pk-reg-cancel" style={{ height: 34, padding: '0 16px', fontSize: 13 }} onClick={() => setReminderMgmtOpen(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
