import { useState, useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Tag from '../../components/common/Tag';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem, EditRow, EditField } from '../../components/common/DetailDrawer';
import { TeaCategory } from '../../types';
import type { TeaProduct } from '../../types';
import { usePriceStore, getPurchaseRange, getSalesQuotationRange } from '../../stores/priceStore';

/* ── 工具函数 ── */
function nameToTeaCategory(name: string): TeaCategory | undefined {
  const map: Record<string, TeaCategory> = {
    '绿茶': TeaCategory.GREEN, '红茶': TeaCategory.RED, '青茶': TeaCategory.OOLONG,
    '白茶': TeaCategory.WHITE, '黄茶': TeaCategory.YELLOW, '黑茶': TeaCategory.DARK,
    '花草茶': TeaCategory.FLOWER,
  };
  return map[name];
}

/** 价格区间展示：最低价 ～ 最高价 */
function PriceRange({ min, max, count, color }: { min: number; max: number; count: number; color: string }) {
  if (count === 0) return <span style={{ color: 'var(--color-neutral-300)' }}>—</span>;
  return (
    <span className="mono" style={{ fontWeight: 'var(--font-semibold)', color }}>
      ¥{min}
      {count > 1 && min !== max && <span style={{ color: 'var(--color-neutral-400)', margin: '0 3px' }}>~</span>}
      {count > 1 && min !== max && `¥${max}`}
      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-regular)', color: 'var(--color-neutral-400)', marginLeft: 4 }}>{count}家</span>
    </span>
  );
}

/* ── 编辑态价格数据 ── */
interface EditData {
  marketPrice: string;
  tmallPrice: string;
  jdPrice: string;
  purchasePrices: Record<string, string>; // ruleId -> price
  quotedPrices: Record<string, string>;   // ruleId -> price
}

/** 价格管理页：市场价/天猫价/京东价（来源商品档案）、采购价（来源采购报（调）价）、销售价（来源销售报（调）价） */
export default function ProductPrice() {
  const products = usePriceStore((s) => s.products);
  const purchaseRules = usePriceStore((s) => s.purchaseRules);
  const salesQuotations = usePriceStore((s) => s.salesQuotations);
  const updateProductPrices = usePriceStore((s) => s.updateProductPrices);
  const updatePurchaseRulePrice = usePriceStore((s) => s.updatePurchaseRulePrice);
  const updateSalesQuotationPrice = usePriceStore((s) => s.updateSalesQuotationPrice);

  const [keyword, setKeyword] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // 详情抽屉
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [editData, setEditData] = useState<EditData | null>(null);

  const selected = products.find((p) => p.id === selectedId) ?? null;

  // 品牌列表
  const allBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach((p) => brands.add(p.brand));
    return Array.from(brands).sort();
  }, [products]);

  // 茶类列表
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => cats.add(p.category.split('-')[0]));
    return Array.from(cats).sort();
  }, [products]);

  /* ── 列表筛选 ── */
  const list = useMemo(() => {
    return products.filter((p) => {
      if (keyword && !p.name.includes(keyword) && !p.brand.includes(keyword) && !p.code.includes(keyword)) return false;
      if (filterBrand && p.brand !== filterBrand) return false;
      if (filterCategory && !p.category.startsWith(filterCategory)) return false;
      return true;
    });
  }, [products, keyword, filterBrand, filterCategory]);

  // 当前商品的采购价 / 销售报价
  const selectedPurchaseRules = useMemo(
    () => (selectedId ? purchaseRules.filter((r) => r.productId === selectedId && r.status === 'active') : []),
    [purchaseRules, selectedId],
  );
  const selectedQuotations = useMemo(
    () => (selectedId ? salesQuotations.filter((r) => r.productId === selectedId && r.status === 'active') : []),
    [salesQuotations, selectedId],
  );

  /* ── 打开详情（查看 / 直接进入编辑） ── */
  const openDetail = (productId: string, directEdit = false) => {
    setSelectedId(productId);
    setMode(directEdit ? 'edit' : 'view');
    const p = products.find((x) => x.id === productId);
    if (p) {
      const purchases: Record<string, string> = {};
      const quotes: Record<string, string> = {};
      purchaseRules.filter((r) => r.productId === productId && r.status === 'active').forEach((r) => { purchases[r.id] = String(r.purchasePrice); });
      salesQuotations.filter((r) => r.productId === productId && r.status === 'active').forEach((r) => { quotes[r.id] = String(r.quotedPrice); });
      setEditData({
        marketPrice: String(p.marketPrice),
        tmallPrice: String(p.tmallPrice),
        jdPrice: String(p.jdPrice),
        purchasePrices: purchases,
        quotedPrices: quotes,
      });
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setMode('view');
    setEditData(null);
  };

  /* ── 保存调价：联动更新数据来源 ── */
  const handleSave = () => {
    if (!selected || !editData) return;
    // 1. 基准价 → 联动商品档案（商品管理）
    updateProductPrices(selected.id, {
      marketPrice: Number(editData.marketPrice) || 0,
      tmallPrice: Number(editData.tmallPrice) || 0,
      jdPrice: Number(editData.jdPrice) || 0,
    });
    // 2. 采购价 → 联动采购价规则（采购报（调）价）
    selectedPurchaseRules.forEach((r) => {
      const v = Number(editData.purchasePrices[r.id]);
      if (!Number.isNaN(v) && v !== r.purchasePrice) updatePurchaseRulePrice(r.id, v);
    });
    // 3. 销售报价 → 联动销售报价规则（销售报（调）价）
    selectedQuotations.forEach((r) => {
      const v = Number(editData.quotedPrices[r.id]);
      if (!Number.isNaN(v) && v !== r.quotedPrice) updateSalesQuotationPrice(r.id, v);
    });
    setMode('view');
  };

  /* ── 编辑态辅助 ── */
  const setEdit = (patch: Partial<EditData>) => setEditData((prev) => (prev ? { ...prev, ...patch } : prev));
  const setPurchasePrice = (ruleId: string, v: string) => setEditData((prev) => (prev ? { ...prev, purchasePrices: { ...prev.purchasePrices, [ruleId]: v } } : prev));
  const setQuotedPrice = (ruleId: string, v: string) => setEditData((prev) => (prev ? { ...prev, quotedPrices: { ...prev.quotedPrices, [ruleId]: v } } : prev));

  const linkStyle: React.CSSProperties = {
    color: 'var(--color-module-current-base)', fontSize: 'var(--text-xs)',
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 6,
  };

  return (
    <>
      <ContentHeader title="价格管理" breadcrumbs={['商品', '价格管理']} />
      <div className="content-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <input className="filter-input" placeholder="搜索商品名称、品牌、编号..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <select className="filter-select" value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
            <option value="">全部品牌</option>
            {allBrands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">全部分类</option>
            {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>共 {list.length} 件商品</span>
        </div>
        <Card>
          <Table
            headers={['商品名称', '品牌', '分类', '规格', '市场价', '天猫价', '京东价', '采购价（多供应商）', '销售价（多客户）', '操作']}
            rows={list.map((p) => {
              const teaCat = nameToTeaCategory(p.category.split('-')[0]);
              const pr = getPurchaseRange(purchaseRules, p.id);
              const sr = getSalesQuotationRange(salesQuotations, p.id);
              return [
                <span
                  style={{ fontWeight: 'var(--font-medium)', color: 'var(--color-neutral-800)', cursor: 'pointer' }}
                  onClick={() => openDetail(p.id)}
                >{p.name}</span>,
                <span>{p.brand}</span>,
                teaCat ? <Tag category={teaCat} /> : <span>{p.category.split('-')[0]}</span>,
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{p.spec}</span>,
                <span className="mono" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)' }}>¥{p.marketPrice}</span>,
                <span className="mono" style={{ color: 'var(--color-neutral-600)' }}>{p.tmallPrice ? `¥${p.tmallPrice}` : '—'}</span>,
                <span className="mono" style={{ color: 'var(--color-neutral-600)' }}>{p.jdPrice ? `¥${p.jdPrice}` : '—'}</span>,
                <PriceRange min={pr.min} max={pr.max} count={pr.count} color="#0DAFC6" />,
                <PriceRange min={sr.min} max={sr.max} count={sr.count} color="#F18F4D" />,
                <Button variant="ghost" size="sm" style={{ color: 'var(--color-module-current-base)' }} onClick={() => openDetail(p.id, true)}>调价</Button>,
              ];
            })}
          />
        </Card>
      </div>

      {/* ── 商品价格详情抽屉 ── */}
      {selected && editData && (
        <DetailDrawer
          open
          onClose={closeDetail}
          badge="PR"
          title={selected.name}
          subtitle={`${selected.brand} · ${selected.spec} · 编号 ${selected.code}`}
          statusTag={(() => {
            const cat = nameToTeaCategory(selected.category.split('-')[0]);
            return cat ? <Tag category={cat} /> : <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{selected.category.split('-')[0]}</span>;
          })()}
          mode={mode}
          onEdit={() => setMode('edit')}
          onCancelEdit={() => setMode('view')}
          onSave={handleSave}
        >
          {/* 商品信息 */}
          <DrawerSection title="商品信息">
            <InfoGrid>
              <InfoItem label="商品编号" mono emph>{selected.code}</InfoItem>
              <InfoItem label="品牌">{selected.brand}</InfoItem>
              <InfoItem label="系列">{selected.series || '—'}</InfoItem>
              <InfoItem label="分类">{selected.category}</InfoItem>
              <InfoItem label="规格">{selected.spec}</InfoItem>
              <InfoItem label="包装单位">{selected.packageUnit}</InfoItem>
            </InfoGrid>
          </DrawerSection>

          {/* 平台基准价（联动商品管理） */}
          <DrawerSection title="平台基准价">
            {mode === 'view' ? (
              <InfoGrid>
                <InfoItem label="市场价" mono emph valueStyle={{ color: 'var(--color-module-current-base)' }}>¥{selected.marketPrice}</InfoItem>
                <InfoItem label="天猫价" mono>
                  {selected.tmallPrice ? `¥${selected.tmallPrice}` : '—'}
                  {selected.tmallUrl && (
                    <a href={selected.tmallUrl} target="_blank" rel="noreferrer" style={linkStyle}>
                      查看链接
                      <svg viewBox="0 0 12 12" fill="none" style={{ width: 10, height: 10 }}><path d="M4 2h6v6M10 2L4 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                    </a>
                  )}
                </InfoItem>
                <InfoItem label="京东价" mono>
                  {selected.jdPrice ? `¥${selected.jdPrice}` : '—'}
                  {selected.jdUrl && (
                    <a href={selected.jdUrl} target="_blank" rel="noreferrer" style={linkStyle}>
                      查看链接
                      <svg viewBox="0 0 12 12" fill="none" style={{ width: 10, height: 10 }}><path d="M4 2h6v6M10 2L4 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                    </a>
                  )}
                </InfoItem>
                <InfoItem label="标准销售价" mono>¥{selected.salesPrice}</InfoItem>
              </InfoGrid>
            ) : (
              <EditRow>
                <EditField label="市场价">
                  <input className="filter-input" type="number" aria-label="市场价" value={editData.marketPrice} onChange={(e) => setEdit({ marketPrice: e.target.value })} />
                </EditField>
                <EditField label="天猫价">
                  <input className="filter-input" type="number" aria-label="天猫价" value={editData.tmallPrice} onChange={(e) => setEdit({ tmallPrice: e.target.value })} />
                </EditField>
                <EditField label="京东价">
                  <input className="filter-input" type="number" aria-label="京东价" value={editData.jdPrice} onChange={(e) => setEdit({ jdPrice: e.target.value })} />
                </EditField>
              </EditRow>
            )}
            <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--color-module-current-base)' }}>
              基准价保存后同步更新商品管理中的商品档案{selected.tmallUrl || selected.jdUrl ? '，价格链接随档案一并维护' : ''}
            </div>
          </DrawerSection>

          {/* 供应商采购价（联动采购报（调）价） */}
          <DrawerSection title={`供应商采购价（${selectedPurchaseRules.length} 家供应商）`}>
            <table className="detail-inline-table">
              <thead>
                <tr>
                  <th>供应商</th>
                  <th>采购价</th>
                  <th>采购折扣</th>
                  <th>有效期</th>
                  <th>最近调价</th>
                </tr>
              </thead>
              <tbody>
                {selectedPurchaseRules.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-neutral-300)', padding: 'var(--space-4)' }}>暂无采购报价</td></tr>
                )}
                {selectedPurchaseRules.map((r) => {
                  const editing = mode === 'edit';
                  const val = editData.purchasePrices[r.id] ?? String(r.purchasePrice);
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 'var(--font-medium)' }}>{r.supplierName}</td>
                      <td>
                        {editing ? (
                          <input
                            className="filter-input"
                            type="number"
                            aria-label={`采购价-${r.supplierName}`}
                            value={val}
                            onChange={(e) => setPurchasePrice(r.id, e.target.value)}
                            style={{ width: 110, padding: '4px 8px' }}
                          />
                        ) : (
                          <span className="mono" style={{ fontWeight: 'var(--font-semibold)', color: '#0DAFC6' }}>¥{r.purchasePrice}</span>
                        )}
                      </td>
                      <td className="mono" style={{ color: 'var(--color-neutral-500)' }}>
                        {editing
                          ? `${editData.marketPrice ? Math.round((Number(val) || 0) / (Number(editData.marketPrice) || 1) * 100) : r.discountRate}%`
                          : `${r.discountRate}%`}
                      </td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{r.validFrom} ~ {r.validTo}</td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{r.lastAdjustDate || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
              采购价保存后同步更新采购 &gt; 采购报（调）价中对应商品+供应商的价格
            </div>
          </DrawerSection>

          {/* 销售报价（联动销售报（调）价） */}
          <DrawerSection title={`销售报价（${selectedQuotations.length} 条客户报价）`}>
            <table className="detail-inline-table">
              <thead>
                <tr>
                  <th>客户 / 等级</th>
                  <th>类型</th>
                  <th>销售报价</th>
                  <th>平台 / 平台实得价</th>
                  <th>有效期</th>
                </tr>
              </thead>
              <tbody>
                {selectedQuotations.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-neutral-300)', padding: 'var(--space-4)' }}>暂无销售报价</td></tr>
                )}
                {selectedQuotations.map((r) => {
                  const editing = mode === 'edit';
                  const val = editData.quotedPrices[r.id] ?? String(r.quotedPrice);
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 'var(--font-medium)' }}>{r.customerName || r.personalLevel || '—'}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                          background: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)',
                        }}>
                          {r.quotationType === 'direct_no_platform' && '直营'}
                          {r.quotationType === 'direct_with_platform' && '直营·经平台'}
                          {r.quotationType === 'channel' && '渠道'}
                          {r.quotationType === 'personal_by_level' && '个人'}
                        </span>
                      </td>
                      <td>
                        {editing ? (
                          <input
                            className="filter-input"
                            type="number"
                            aria-label={`销售报价-${r.customerName || r.personalLevel}`}
                            value={val}
                            onChange={(e) => setQuotedPrice(r.id, e.target.value)}
                            style={{ width: 110, padding: '4px 8px' }}
                          />
                        ) : (
                          <span className="mono" style={{ fontWeight: 'var(--font-semibold)', color: '#F18F4D' }}>¥{r.quotedPrice}</span>
                        )}
                      </td>
                      <td>
                        {r.platformName ? (
                          <span style={{ fontSize: 'var(--text-xs)' }}>
                            {r.platformName} <span className="mono" style={{ color: 'var(--color-neutral-500)' }}>¥{r.platformNetPrice}</span>
                            <span style={{ color: 'var(--color-neutral-400)', marginLeft: 4 }}>({r.platformCommissionRate})</span>
                          </span>
                        ) : <span style={{ color: 'var(--color-neutral-300)' }}>—</span>}
                      </td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{r.validFrom} ~ {r.validTo}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
              销售报价保存后同步更新销售 &gt; 销售报（调）价中对应商品+客户的报价；经平台报价自动重算平台实得价
            </div>
          </DrawerSection>
        </DetailDrawer>
      )}
    </>
  );
}
