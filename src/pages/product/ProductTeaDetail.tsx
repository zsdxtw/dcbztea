import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import StatusTag from '../../components/common/StatusTag';
import Button from '../../components/common/Button';
import Tag from '../../components/common/Tag';
import { getShelfStatusLabel, getPurchaseStatusLabel, getProductionStatusLabel } from '../../data/teaProducts';
import { usePriceStore } from '../../stores/priceStore';
import { TeaCategory, TeaProduct } from '../../types';
import { brandItems } from '../../data/brands';
import { weightUnits, dimensionUnits, packageUnits } from '../../data/units';
import { teaCategoryData, teawareCategoryData, teaPeripheralCategoryData, otherCategoryData, productCategoryLabels, type ProductCategoryType, type CategoryNode } from '../../data/productCategories';

/** 通过茶类中文名称获取 TeaCategory 枚举 */
function nameToTeaCategory(name: string): TeaCategory | undefined {
  const map: Record<string, TeaCategory> = {
    '绿茶': TeaCategory.GREEN, '红茶': TeaCategory.RED, '青茶': TeaCategory.OOLONG,
    '白茶': TeaCategory.WHITE, '黄茶': TeaCategory.YELLOW, '黑茶': TeaCategory.DARK,
    '花草茶': TeaCategory.FLOWER,
  };
  return map[name];
}

/** 从 category 字段提取一级茶类名称 */
function getTopCategory(category: string): string {
  return category.split('-')[0];
}

/** 一级分类数据映射 */
const CATEGORY_DATA_MAP: Record<ProductCategoryType, CategoryNode> = {
  tea: teaCategoryData,
  teaware: teawareCategoryData,
  'tea-peripheral': teaPeripheralCategoryData,
  other: otherCategoryData,
};

/** 一级分类名 -> ProductCategoryType 反向映射 */
const L1_NAME_TO_TYPE: Record<string, ProductCategoryType> = {
  '茶叶': 'tea', '茶具': 'teaware', '茶周边': 'tea-peripheral', '其他': 'other',
};

/** 详情行组件 */
function DetailRow({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div className={`detail-row${span ? ' detail-row-span' : ''}`}>
      <div className="detail-label">{label}</div>
      <div className="detail-value">{children}</div>
    </div>
  );
}

/** 编辑行组件 */
function EditRow({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div className={`detail-row${span ? ' detail-row-span' : ''}`}>
      <div className="detail-label">{label}</div>
      <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>{children}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '4px 8px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-neutral-200)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
  background: 'var(--color-neutral-0)',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '4px 8px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-neutral-200)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
  background: 'var(--color-neutral-0)',
  cursor: 'pointer',
};

export default function ProductTeaDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  // 拖拽排序状态
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragType, setDragType] = useState<'main' | 'detail' | null>(null);

  const product = usePriceStore((s) => s.products.find((p) => p.id === id));
  const storeUpdateProduct = usePriceStore((s) => s.updateProduct);

  if (!product) {
    return (
      <>
        <ContentHeader title="茶叶商品详情" breadcrumbs={['商品', '商品管理', '茶叶', '详情']} />
        <div className="content-body">
          <Card>
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-neutral-400)' }}>
              商品不存在
            </div>
          </Card>
        </div>
      </>
    );
  }

  // 从 categories 数组提取所有一级分类标签
  const allCategories = product.categories || [product.category];
  const categoryTags = allCategories.map(cat => {
    const l2Name = cat.split('-')[0];
    const teaCat = nameToTeaCategory(l2Name);
    if (teaCat) return { type: 'tea' as const, label: l2Name, teaCat };
    const l1Type = L1_NAME_TO_TYPE[l2Name];
    if (l1Type) return { type: 'other' as const, label: productCategoryLabels[l1Type], l1Type };
    return null;
  }).filter(Boolean);

  const mainPreview = previewImage ?? product.mainImages[product.displayImageIndex] ?? product.mainImages[0] ?? '';

  const shelfVariant = product.shelfStatus === 'on' ? 'success' : 'error';
  const purchaseVariant = product.purchaseStatus === 'available' ? 'success' : 'warning';
  const productionVariant = product.productionStatus === 'producing' ? 'success' : 'error';

  // ── 编辑模式逻辑 ──
  const handleEnterEdit = () => {
    const formData: any = { ...product };
    // 初始化分类选择 - 从 categories 数组反推
    const cats = product.categories || [product.category];
    const selectedL1List: ProductCategoryType[] = ['tea']; // 茶叶必选
    const selectedL2: string[] = [];
    const selectedL3: string[] = [];

    for (const cat of cats) {
      const parts = cat.split('-');
      const l2Name = parts[0] || '';
      const l3Name = parts[1] || '';
      // 判断属于哪个一级分类
      const teaL2Names = (teaCategoryData.children || []).map(c => c.name);
      const teawareL2Names = (teawareCategoryData.children || []).map(c => c.name);
      const peripheralL2Names = (teaPeripheralCategoryData.children || []).map(c => c.name);
      const otherL2Names = (otherCategoryData.children || []).map(c => c.name);

      if (teaL2Names.includes(l2Name)) {
        if (!selectedL1List.includes('tea')) selectedL1List.push('tea');
        if (!selectedL2.includes(l2Name)) selectedL2.push(l2Name);
        if (l3Name && !selectedL3.includes(l3Name)) selectedL3.push(l3Name);
      } else if (teawareL2Names.includes(l2Name)) {
        if (!selectedL1List.includes('teaware')) selectedL1List.push('teaware');
        if (!selectedL2.includes(l2Name)) selectedL2.push(l2Name);
      } else if (peripheralL2Names.includes(l2Name)) {
        if (!selectedL1List.includes('tea-peripheral')) selectedL1List.push('tea-peripheral');
        if (!selectedL2.includes(l2Name)) selectedL2.push(l2Name);
      } else if (otherL2Names.includes(l2Name)) {
        if (!selectedL1List.includes('other')) selectedL1List.push('other');
        if (!selectedL2.includes(l2Name)) selectedL2.push(l2Name);
      }
    }

    formData.selectedL1List = selectedL1List;
    formData.selectedL2 = selectedL2;
    formData.selectedL3 = selectedL3;
    formData.isNewSeries = false;
    formData.newSeriesName = '';
    formData.displayImageIndex = product.displayImageIndex || 0;
    setForm(formData);
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setForm({});
  };

  const handleSaveEdit = () => {
    // 更新分类
    if (editComputedCategories.length > 0) {
      form.category = editComputedCategories[0];
      form.categories = editComputedCategories;
    }
    // 含茶具标记由分类自动计算
    form.includesTeaware = computedIncludesTeaware;
    // 同步新系列到品牌管理
    const finalSeries = form.isNewSeries ? form.newSeriesName : form.series;
    if (finalSeries && form.brand) {
      syncSeriesToBrand(form.brand, finalSeries);
      form.series = finalSeries;
    }
    // 更新商品数据（走 priceStore：下架时自动联动所有客户的报品状态为否）
    storeUpdateProduct(product.id, { ...form });
    setEditMode(false);
    setForm({});
  };

  const f = editMode ? form : product;

  // 编辑模式下：品牌对应的系列选项
  const brandSeriesOptions = useMemo(() => {
    const brandName = (editMode ? form.brand : product.brand) || '';
    const brand = brandItems.find(b => b.name === brandName);
    return brand?.series || [];
  }, [editMode, form.brand, product.brand]);

  // 将新系列同步到品牌管理数据
  const syncSeriesToBrand = (brandName: string, seriesName: string) => {
    if (!seriesName.trim()) return;
    const brand = brandItems.find(b => b.name === brandName);
    if (brand && !brand.series.includes(seriesName.trim())) {
      brand.series.push(seriesName.trim());
    }
  };

  // 编辑模式下：分类联动
  const editL2Options = useMemo(() => {
    const l1List: ProductCategoryType[] = (form as any).selectedL1List || ['tea'];
    const result: { l1: ProductCategoryType; l1Label: string; nodes: CategoryNode[] }[] = [];
    for (const l1 of l1List) {
      const data = CATEGORY_DATA_MAP[l1];
      if (data?.children) {
        result.push({ l1, l1Label: productCategoryLabels[l1], nodes: data.children });
      }
    }
    return result;
  }, [(form as any).selectedL1List]);

  const editL3Options = useMemo(() => {
    const l1List: ProductCategoryType[] = (form as any).selectedL1List || ['tea'];
    if (!l1List.includes('tea')) return {};
    const result: Record<string, CategoryNode[]> = {};
    const teaData = teaCategoryData.children || [];
    for (const l2 of teaData) {
      if (form.selectedL2?.includes(l2.name) && l2.children && l2.children.length > 0) {
        result[l2.name] = l2.children;
      }
    }
    return result;
  }, [(form as any).selectedL1List, form.selectedL2]);

  const editComputedCategories = useMemo(() => {
    const l1List: ProductCategoryType[] = (form as any).selectedL1List || ['tea'];
    const cats: string[] = [];
    // 茶叶分类
    if (l1List.includes('tea')) {
      for (const l2Name of (form.selectedL2 || [])) {
        const teaL2Names = (teaCategoryData.children || []).map(c => c.name);
        if (!teaL2Names.includes(l2Name)) continue;
        const l2Node = teaCategoryData.children?.find(c => c.name === l2Name);
        if (l2Node?.children && l2Node.children.length > 0) {
          const selectedL3ForL2 = (form.selectedL3 || []).filter((l3Name: string) =>
            l2Node.children!.some(c => c.name === l3Name)
          );
          if (selectedL3ForL2.length > 0) {
            for (const l3Name of selectedL3ForL2) {
              cats.push(`${l2Name}-${l3Name}`);
            }
          } else {
            cats.push(l2Name);
          }
        } else {
          cats.push(l2Name);
        }
      }
    }
    // 非茶叶分类（统一使用 "L2-L3" 格式，与商品管理保持一致）
    for (const l1 of l1List) {
      if (l1 === 'tea') continue;
      const data = CATEGORY_DATA_MAP[l1];
      if (data?.children) {
        for (const l2 of data.children) {
          if (!(form.selectedL2 || []).includes(l2.name)) continue;
          if (l2.children && l2.children.length > 0) {
            const selectedL3ForL2 = (form.selectedL3 || []).filter((l3Name: string) =>
              l2.children!.some(c => c.name === l3Name)
            );
            if (selectedL3ForL2.length > 0) {
              for (const l3Name of selectedL3ForL2) {
                cats.push(`${l2.name}-${l3Name}`);
              }
            } else {
              cats.push(l2.name);
            }
          } else {
            cats.push(l2.name);
          }
        }
      }
    }
    return cats;
  }, [(form as any).selectedL1List, form.selectedL2, form.selectedL3]);

  const computedIncludesTeaware = useMemo(() => {
    const l1List: ProductCategoryType[] = (form as any).selectedL1List || ['tea'];
    return l1List.includes('teaware');
  }, [(form as any).selectedL1List]);

  const handleEditToggleL1 = (l1: ProductCategoryType) => {
    setForm((prev: any) => {
      const prevList: ProductCategoryType[] = prev.selectedL1List || ['tea'];
      const newList = prevList.includes(l1)
        ? prevList.filter((x: ProductCategoryType) => x !== l1)
        : [...prevList, l1];
      if (!newList.includes('tea')) newList.unshift('tea');
      // 清除不属于已选L1的L2
      const validL2Names: string[] = [];
      for (const selL1 of newList) {
        const data = CATEGORY_DATA_MAP[selL1];
        if (data?.children) {
          for (const c of data.children) {
            if ((prev.selectedL2 || []).includes(c.name)) validL2Names.push(c.name);
          }
        }
      }
      const validL3 = (prev.selectedL3 || []).filter((l3Name: string) => {
        const teaData = teaCategoryData.children || [];
        for (const l2 of teaData) {
          if (validL2Names.includes(l2.name) && l2.children?.some(c => c.name === l3Name)) {
            return true;
          }
        }
        return false;
      });
      return { ...prev, selectedL1List: newList, selectedL2: validL2Names, selectedL3: validL3 };
    });
  };

  const handleEditToggleL2 = (name: string) => {
    setForm(prev => {
      const prevL2: string[] = (prev as any).selectedL2 || [];
      const newL2 = prevL2.includes(name)
        ? prevL2.filter(n => n !== name)
        : [...prevL2, name];
      const prevL3: string[] = (prev as any).selectedL3 || [];
      const validL3 = prevL3.filter(l3Name => {
        const teaData = teaCategoryData.children || [];
        for (const l2 of teaData) {
          if (newL2.includes(l2.name) && l2.children?.some(c => c.name === l3Name)) {
            return true;
          }
        }
        return false;
      });
      return { ...prev, selectedL2: newL2, selectedL3: validL3 };
    });
  };

  const handleEditToggleL3 = (name: string) => {
    setForm(prev => {
      const prevL3: string[] = (prev as any).selectedL3 || [];
      return {
        ...prev,
        selectedL3: prevL3.includes(name)
          ? prevL3.filter(n => n !== name)
          : [...prevL3, name],
      };
    });
  };

  return (
    <>
      <ContentHeader
        title={editMode ? `编辑 - ${product.name}` : product.name}
        breadcrumbs={['商品', '商品管理', '茶叶', product.name]}
        actions={
          editMode ? (
            <>
              <Button variant="ghost" onClick={handleCancelEdit}>取消</Button>
              <Button onClick={handleSaveEdit}>保存修改</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate(-1)}>返回</Button>
              <Button onClick={handleEnterEdit}>编辑</Button>
              <Button style={{ background: '#eb5c20', borderColor: '#eb5c20' }} onClick={() => setShowDeleteConfirm(true)}>删除</Button>
            </>
          )
        }
      />
      <div className="content-body">
        {editMode ? (
          /* ── 编辑模式 ── */
          <>
            {/* 基本信息 */}
            <Card title="基本信息" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="detail-grid">
                <EditRow label="商品编码">
                  <input className="detail-input" value={f.code || ''} readOnly style={{ ...inputStyle, background: 'var(--color-neutral-100)', color: 'var(--color-neutral-400)', cursor: 'not-allowed' }} />
                </EditRow>
                <EditRow label="商品名称">
                  <input className="detail-input" value={f.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="请输入商品名称" />
                </EditRow>
                <EditRow label="一级分类（多选）">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(Object.keys(productCategoryLabels) as ProductCategoryType[]).map((key) => {
                      const l1List: ProductCategoryType[] = (form as any).selectedL1List || ['tea'];
                      const selected = l1List.includes(key);
                      return (
                        <label key={key} style={{
                          display: 'flex', alignItems: 'center', gap: '3px', cursor: key === 'tea' ? 'default' : 'pointer',
                          fontSize: 'var(--text-xs)', padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${selected ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
                          background: selected ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
                          color: selected ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
                          transition: 'var(--transition-fast)',
                        }}>
                          <input type="checkbox" checked={selected} onChange={() => handleEditToggleL1(key)} disabled={key === 'tea'} style={{ display: 'none' }} />
                          {productCategoryLabels[key]}
                          {key === 'tea' && <span style={{ fontSize: '9px', color: 'var(--color-neutral-400)' }}>（必选）</span>}
                        </label>
                      );
                    })}
                  </div>
                </EditRow>
                <EditRow label="二级分类（多选）" span>
                  <div>
                    {editL2Options.map(({ l1, l1Label, nodes }) => (
                      <div key={l1} style={{ marginBottom: '4px' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: '2px', fontWeight: 'var(--font-medium)' }}>{l1Label}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {nodes.map((l2) => {
                            const selected = ((form as any).selectedL2 || []).includes(l2.name);
                            return (
                              <label key={l2.id} style={{
                                display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer',
                                fontSize: 'var(--text-xs)', padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                                border: `1px solid ${selected ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
                                background: selected ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
                                color: selected ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
                                transition: 'var(--transition-fast)',
                              }}>
                                <input type="checkbox" checked={selected} onChange={() => handleEditToggleL2(l2.name)} style={{ display: 'none' }} />
                                {l2.name}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </EditRow>
                {((form as any).selectedL1List || ['tea']).includes('tea') && Object.keys(editL3Options).length > 0 && (
                  <EditRow label="三级茶种（多选）">
                    <div>
                      {Object.entries(editL3Options).map(([l2Name, l3Nodes]) => (
                        <div key={l2Name} style={{ marginBottom: '4px' }}>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: '2px' }}>{l2Name}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {l3Nodes.map((l3) => {
                              const selected = ((form as any).selectedL3 || []).includes(l3.name);
                              return (
                                <label key={l3.id} style={{
                                  display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer',
                                  fontSize: 'var(--text-xs)', padding: '1px 5px', borderRadius: 'var(--radius-sm)',
                                  border: `1px solid ${selected ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
                                  background: selected ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
                                  color: selected ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
                                }}>
                                  <input type="checkbox" checked={selected} onChange={() => handleEditToggleL3(l3.name)} style={{ display: 'none' }} />
                                  {l3.name}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </EditRow>
                )}
                {editComputedCategories.length > 0 && (
                  <EditRow label="已选分类">
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-module-current-base)', fontWeight: 'var(--font-medium)' }}>
                      {editComputedCategories.join('、')}
                    </span>
                  </EditRow>
                )}
                <EditRow label="品牌">
                  <select className="detail-input" value={f.brand || ''} onChange={(e) => setForm({ ...form, brand: e.target.value })} style={selectStyle}>
                    <option value="">请选择品牌</option>
                    {brandItems.map((b) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </EditRow>
                <EditRow label="系列">
                  {form.isNewSeries ? (
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', width: '100%' }}>
                      <input
                        className="detail-input"
                        value={form.newSeriesName || ''}
                        onChange={(e) => setForm({ ...form, newSeriesName: e.target.value })}
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder="输入新系列名称"
                        autoFocus
                      />
                      <button
                        onClick={() => setForm({ ...form, isNewSeries: false, newSeriesName: '' })}
                        style={{
                          padding: '4px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)',
                          border: '1px solid var(--color-neutral-200)', background: 'var(--color-neutral-0)',
                          color: 'var(--color-neutral-500)', cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >取消</button>
                    </div>
                  ) : (
                    <select
                      className="detail-input"
                      value={f.series || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__new__') {
                          setForm({ ...form, isNewSeries: true, series: '' });
                        } else {
                          setForm({ ...form, isNewSeries: false, series: val });
                        }
                      }}
                      style={selectStyle}
                    >
                      <option value="">请选择系列</option>
                      {brandSeriesOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      {f.series && !brandSeriesOptions.includes(f.series) && (
                        <option value={f.series}>{f.series}</option>
                      )}
                      <option value="__new__">填写新系列</option>
                    </select>
                  )}
                </EditRow>
                <EditRow label="品级">
                  <select className="detail-input" value={f.grade || ''} onChange={(e) => setForm({ ...form, grade: e.target.value })} style={selectStyle}>
                    <option value="">请选择品级</option>
                    <option value="特级">特级</option>
                    <option value="一级">一级</option>
                    <option value="二级">二级</option>
                    <option value="三级">三级</option>
                    <option value="精品">精品</option>
                    <option value="珍品">珍品</option>
                  </select>
                </EditRow>
                <EditRow label="产地">
                  <input className="detail-input" value={f.origin || ''} onChange={(e) => setForm({ ...form, origin: e.target.value })} style={inputStyle} placeholder="如：浙江杭州西湖区" />
                </EditRow>
                <EditRow label="产品特点" span>
                  <input className="detail-input" value={f.features || ''} onChange={(e) => setForm({ ...form, features: e.target.value })} style={inputStyle} placeholder="如：明前头采·豆花香·扁平挺直" />
                </EditRow>
              </div>
            </Card>

            {/* 规格包装 */}
            <Card title="规格包装" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="detail-grid">
                <EditRow label="规格">
                  <input className="detail-input" value={f.spec || ''} onChange={(e) => setForm({ ...form, spec: e.target.value })} style={inputStyle} placeholder="如：50g/罐" />
                </EditRow>
                <EditRow label="包装单位">
                  <select className="detail-input" value={f.packageUnit || ''} onChange={(e) => setForm({ ...form, packageUnit: e.target.value })} style={selectStyle}>
                    {packageUnits.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                  </select>
                </EditRow>
              </div>

              {/* 每份规格 */}
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)', margin: 'var(--space-3) 0 var(--space-2)', borderLeft: '3px solid var(--color-module-current-base)', paddingLeft: '8px' }}>每份规格</div>
              <div className="detail-grid">
                <EditRow label="净重">
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input className="detail-input" type="number" value={f.perUnitSpec?.netWeight || ''} onChange={(e) => {
                      const val = Number(e.target.value);
                      setForm({ ...form, perUnitSpec: { ...f.perUnitSpec!, netWeight: val }, perBoxSpec: { ...f.perBoxSpec!, netWeight: val * (f.perBoxSpec?.quantity || 0) } });
                    }} style={inputStyle} placeholder="0" />
                    <select className="detail-input" value={f.perUnitSpec?.netWeightUnit || 'g'} onChange={(e) => setForm({ ...form, perUnitSpec: { ...f.perUnitSpec!, netWeightUnit: e.target.value } })} style={{ ...selectStyle, width: 80 }}>
                      {weightUnits.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
                    </select>
                  </div>
                </EditRow>
                <EditRow label="毛重">
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input className="detail-input" type="number" value={f.perUnitSpec?.grossWeight || ''} onChange={(e) => {
                      const val = Number(e.target.value);
                      setForm({ ...form, perUnitSpec: { ...f.perUnitSpec!, grossWeight: val }, perBoxSpec: { ...f.perBoxSpec!, grossWeight: val * (f.perBoxSpec?.quantity || 0) } });
                    }} style={inputStyle} placeholder="0" />
                    <select className="detail-input" value={f.perUnitSpec?.grossWeightUnit || 'g'} onChange={(e) => setForm({ ...form, perUnitSpec: { ...f.perUnitSpec!, grossWeightUnit: e.target.value } })} style={{ ...selectStyle, width: 80 }}>
                      {weightUnits.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
                    </select>
                  </div>
                </EditRow>
                <EditRow label="体积" span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%' }}>
                    <input className="detail-input" type="number" value={f.perUnitSpec?.length || ''} onChange={(e) => setForm({ ...form, perUnitSpec: { ...f.perUnitSpec!, length: Number(e.target.value) } })} style={{ ...inputStyle, width: '22%' }} placeholder="长" />
                    <span style={{ color: 'var(--color-neutral-400)' }}>×</span>
                    <input className="detail-input" type="number" value={f.perUnitSpec?.width || ''} onChange={(e) => setForm({ ...form, perUnitSpec: { ...f.perUnitSpec!, width: Number(e.target.value) } })} style={{ ...inputStyle, width: '22%' }} placeholder="宽" />
                    <span style={{ color: 'var(--color-neutral-400)' }}>×</span>
                    <input className="detail-input" type="number" value={f.perUnitSpec?.height || ''} onChange={(e) => setForm({ ...form, perUnitSpec: { ...f.perUnitSpec!, height: Number(e.target.value) } })} style={{ ...inputStyle, width: '22%' }} placeholder="高" />
                    <select className="detail-input" value={f.perUnitSpec?.dimensionUnit || 'cm'} onChange={(e) => setForm({ ...form, perUnitSpec: { ...f.perUnitSpec!, dimensionUnit: e.target.value } })} style={{ ...selectStyle, width: 80 }}>
                      {dimensionUnits.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
                    </select>
                  </div>
                </EditRow>
              </div>

              {/* 每箱规格（箱规） */}
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)', margin: 'var(--space-3) 0 var(--space-2)', borderLeft: '3px solid var(--color-module-current-base)', paddingLeft: '8px' }}>每箱规格（箱规）</div>
              <div className="detail-grid">
                <EditRow label="每箱数量">
                  <input className="detail-input" type="number" value={f.perBoxSpec?.quantity || ''} onChange={(e) => {
                    const qty = Number(e.target.value);
                    setForm({ ...form, perBoxSpec: { ...f.perBoxSpec!, quantity: qty, netWeight: (f.perUnitSpec?.netWeight || 0) * qty, grossWeight: (f.perUnitSpec?.grossWeight || 0) * qty } });
                  }} style={inputStyle} placeholder="0" />
                </EditRow>
                <EditRow label="净重">
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input className="detail-input" type="number" value={f.perBoxSpec?.netWeight || ''} readOnly style={{ ...inputStyle, background: 'var(--color-neutral-50)', color: 'var(--color-neutral-500)' }} />
                    <select className="detail-input" value={f.perBoxSpec?.netWeightUnit || 'kg'} onChange={(e) => setForm({ ...form, perBoxSpec: { ...f.perBoxSpec!, netWeightUnit: e.target.value } })} style={{ ...selectStyle, width: 80 }}>
                      {weightUnits.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
                    </select>
                  </div>
                </EditRow>
                <EditRow label="毛重">
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input className="detail-input" type="number" value={f.perBoxSpec?.grossWeight || ''} readOnly style={{ ...inputStyle, background: 'var(--color-neutral-50)', color: 'var(--color-neutral-500)' }} />
                    <select className="detail-input" value={f.perBoxSpec?.grossWeightUnit || 'kg'} onChange={(e) => setForm({ ...form, perBoxSpec: { ...f.perBoxSpec!, grossWeightUnit: e.target.value } })} style={{ ...selectStyle, width: 80 }}>
                      {weightUnits.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
                    </select>
                  </div>
                </EditRow>
                <EditRow label="体积" span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%' }}>
                    <input className="detail-input" type="number" value={f.perBoxSpec?.length || ''} onChange={(e) => setForm({ ...form, perBoxSpec: { ...f.perBoxSpec!, length: Number(e.target.value) } })} style={{ ...inputStyle, width: '22%' }} placeholder="长" />
                    <span style={{ color: 'var(--color-neutral-400)' }}>×</span>
                    <input className="detail-input" type="number" value={f.perBoxSpec?.width || ''} onChange={(e) => setForm({ ...form, perBoxSpec: { ...f.perBoxSpec!, width: Number(e.target.value) } })} style={{ ...inputStyle, width: '22%' }} placeholder="宽" />
                    <span style={{ color: 'var(--color-neutral-400)' }}>×</span>
                    <input className="detail-input" type="number" value={f.perBoxSpec?.height || ''} onChange={(e) => setForm({ ...form, perBoxSpec: { ...f.perBoxSpec!, height: Number(e.target.value) } })} style={{ ...inputStyle, width: '22%' }} placeholder="高" />
                    <select className="detail-input" value={f.perBoxSpec?.dimensionUnit || 'cm'} onChange={(e) => setForm({ ...form, perBoxSpec: { ...f.perBoxSpec!, dimensionUnit: e.target.value } })} style={{ ...selectStyle, width: 80 }}>
                      {dimensionUnits.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
                    </select>
                  </div>
                </EditRow>
              </div>

              <div className="detail-grid" style={{ marginTop: 'var(--space-3)' }}>
                <EditRow label="69码">
                  <input className="detail-input" value={f.barcode69 || ''} onChange={(e) => setForm({ ...form, barcode69: e.target.value })} style={inputStyle} placeholder="13位条码" maxLength={13} />
                </EditRow>
                <EditRow label="型号">
                  <input className="detail-input" value={f.model || ''} onChange={(e) => setForm({ ...form, model: e.target.value })} style={inputStyle} placeholder="请输入型号" />
                </EditRow>
                <EditRow label="保质期(月)">
                  <input className="detail-input" type="number" value={f.shelfLife || ''} onChange={(e) => setForm({ ...form, shelfLife: Number(e.target.value) })} style={inputStyle} placeholder="12" />
                </EditRow>
                <EditRow label="税率(%)">
                  <input className="detail-input" type="number" value={f.taxRate || ''} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} style={inputStyle} placeholder="9" />
                </EditRow>
              </div>
            </Card>

            {/* 价格信息 */}
            <Card title="价格信息" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="detail-grid">
                <EditRow label="市场价(元)">
                  <input className="detail-input" type="number" value={f.marketPrice || ''} onChange={(e) => setForm({ ...form, marketPrice: Number(e.target.value) })} style={inputStyle} placeholder="0" />
                </EditRow>
                <EditRow label="天猫价(元)">
                  <input className="detail-input" type="number" value={f.tmallPrice || ''} onChange={(e) => setForm({ ...form, tmallPrice: Number(e.target.value) })} style={inputStyle} placeholder="0" />
                </EditRow>
                <EditRow label="天猫链接">
                  <input className="detail-input" value={f.tmallUrl || ''} onChange={(e) => setForm({ ...form, tmallUrl: e.target.value })} style={inputStyle} placeholder="https://" />
                </EditRow>
                <EditRow label="京东价(元)">
                  <input className="detail-input" type="number" value={f.jdPrice || ''} onChange={(e) => setForm({ ...form, jdPrice: Number(e.target.value) })} style={inputStyle} placeholder="0" />
                </EditRow>
                <EditRow label="京东链接">
                  <input className="detail-input" value={f.jdUrl || ''} onChange={(e) => setForm({ ...form, jdUrl: e.target.value })} style={inputStyle} placeholder="https://" />
                </EditRow>
              </div>
            </Card>

            {/* 状态与库存 */}
            <Card title="状态与库存" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="detail-grid">
                <EditRow label="上下架状态">
                  <select className="detail-input" value={f.shelfStatus || 'on'} onChange={(e) => setForm({ ...form, shelfStatus: e.target.value as 'on' | 'off' })} style={selectStyle}>
                    <option value="on">上架</option>
                    <option value="off">下架</option>
                  </select>
                </EditRow>
                <EditRow label="采购状态">
                  <select className="detail-input" value={f.purchaseStatus || 'available'} onChange={(e) => setForm({ ...form, purchaseStatus: e.target.value as 'available' | 'stopped' })} style={selectStyle}>
                    <option value="available">可采</option>
                    <option value="stopped">停采</option>
                  </select>
                </EditRow>
                <EditRow label="生产状态">
                  <select className="detail-input" value={f.productionStatus || 'producing'} onChange={(e) => setForm({ ...form, productionStatus: e.target.value as 'producing' | 'stopped' })} style={selectStyle}>
                    <option value="producing">在产</option>
                    <option value="stopped">停产</option>
                  </select>
                </EditRow>
                <EditRow label="库存预警值">
                  <input className="detail-input" type="number" value={f.stockAlert || ''} onChange={(e) => setForm({ ...form, stockAlert: Number(e.target.value) })} style={inputStyle} placeholder="50" />
                </EditRow>
                <EditRow label="自有库存">
                  <input className="detail-input" type="number" value={f.stock || ''} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} style={inputStyle} placeholder="0" />
                </EditRow>
                <EditRow label="预占库存">
                  <input className="detail-input" type="number" value={f.reservedStock || ''} onChange={(e) => setForm({ ...form, reservedStock: Number(e.target.value) })} style={inputStyle} placeholder="0" />
                </EditRow>
                <EditRow label="总销量">
                  <input className="detail-input" type="number" value={f.totalSales || ''} onChange={(e) => setForm({ ...form, totalSales: Number(e.target.value) })} style={inputStyle} placeholder="0" />
                </EditRow>

              </div>
            </Card>

            {/* 商品图片 */}
            <Card title="商品图片" style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-neutral-700)', marginBottom: 'var(--space-2)' }}>轮播图（点击设为主图）</div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {(form.mainImages as string[] || []).map((img: string, i: number) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={() => { setDragIndex(i); setDragType('main'); }}
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.opacity = '0.5'; }}
                      onDragLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.opacity = '1';
                        if (dragType === 'main' && dragIndex !== null && dragIndex !== i) {
                          const newImages = [...(form.mainImages as string[])];
                          const [moved] = newImages.splice(dragIndex, 1);
                          newImages.splice(i, 0, moved);
                          let newDisplayIndex = form.displayImageIndex ?? 0;
                          if (newDisplayIndex === dragIndex) newDisplayIndex = i;
                          else if (dragIndex < newDisplayIndex && i >= newDisplayIndex) newDisplayIndex--;
                          else if (dragIndex > newDisplayIndex && i <= newDisplayIndex) newDisplayIndex++;
                          setForm({ ...form, mainImages: newImages, displayImageIndex: newDisplayIndex });
                        }
                        setDragIndex(null); setDragType(null);
                      }}
                      onDragEnd={() => { setDragIndex(null); setDragType(null); }}
                      style={{
                        width: 80, height: 80, borderRadius: 'var(--radius-md)', overflow: 'hidden',
                        border: `2px solid ${(form.displayImageIndex ?? 0) === i ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
                        position: 'relative', cursor: 'pointer',
                        transition: 'border-color var(--transition-fast)',
                      }}
                      onClick={() => setForm({ ...form, displayImageIndex: i })}
                      onMouseEnter={(e) => {
                        if ((form.displayImageIndex ?? 0) !== i) {
                          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-module-current-base)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if ((form.displayImageIndex ?? 0) !== i) {
                          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-neutral-200)';
                        }
                      }}
                    >
                      <img src={img} alt={`轮播图-${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      {/* 序号 */}
                      <span style={{
                        position: 'absolute', top: 2, left: 2,
                        width: 16, height: 16, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.5)', color: '#fff',
                        fontSize: '10px', fontWeight: 'var(--font-semibold)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        lineHeight: 1,
                      }}>{i + 1}</span>
                      {(form.displayImageIndex ?? 0) === i && (
                        <span style={{
                          position: 'absolute', top: 2, right: 2,
                          padding: '1px 4px', borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-module-current-base)', color: '#fff',
                          fontSize: '10px', fontWeight: 'var(--font-semibold)', lineHeight: '14px',
                        }}>主图</span>
                      )}
                      {(form.displayImageIndex ?? 0) !== i && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'rgba(0,0,0,0.45)', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', opacity: 0, transition: 'opacity var(--transition-fast)',
                        }}
                          className="img-hover-label"
                        >设为主图</div>
                      )}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          const newImages = (form.mainImages as string[]).filter((_, idx) => idx !== i);
                          let newDisplayIndex = form.displayImageIndex ?? 0;
                          if (i < newDisplayIndex) newDisplayIndex--;
                          else if (i === newDisplayIndex) newDisplayIndex = 0;
                          if (newDisplayIndex >= newImages.length) newDisplayIndex = 0;
                          setForm({ ...form, mainImages: newImages, displayImageIndex: newDisplayIndex });
                        }}
                        style={{
                          position: 'absolute', bottom: 2, right: 2, width: 16, height: 16,
                          borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', fontSize: '10px', lineHeight: 1,
                        }}
                      >×</div>
                    </div>
                  ))}
                  <div style={{ position: 'relative' }}>
                    <label style={{
                      width: 80, height: 80, borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--color-neutral-300)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      background: 'var(--color-neutral-50)', color: 'var(--color-neutral-400)',
                      fontSize: 'var(--text-xs)', flexDirection: 'column', gap: 2,
                    }}>
                      <svg viewBox="0 0 16 16" fill="none" style={{ width: 20, height: 20 }}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                      添加轮播图
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if ((form.mainImages as string[] || []).length >= 8) { alert('轮播图最多8张'); return; }
                        const imgEl = new Image();
                        const url = URL.createObjectURL(file);
                        imgEl.onload = () => {
                          if (imgEl.width !== imgEl.height || imgEl.width < 500 || imgEl.width > 1920) {
                            alert('轮播图要求正方形，边长500-1920像素，请重新选择');
                            URL.revokeObjectURL(url);
                            return;
                          }
                          setForm({ ...form, mainImages: [...(form.mainImages as string[] || []), url] });
                        };
                        imgEl.src = url;
                        e.target.value = '';
                      }} />
                    </label>
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: 'var(--radius-md)',
                      background: 'rgba(0,0,0,0.45)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', opacity: 0, transition: 'opacity var(--transition-fast)',
                      pointerEvents: 'none',
                    }}
                      className="img-hover-label"
                    >正方形500-1920px</div>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-neutral-700)', marginBottom: 'var(--space-2)' }}>详情图</div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {(form.detailImages as string[] || []).map((img: string, i: number) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={() => { setDragIndex(i); setDragType('detail'); }}
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.opacity = '0.5'; }}
                      onDragLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.opacity = '1';
                        if (dragType === 'detail' && dragIndex !== null && dragIndex !== i) {
                          const newImages = [...(form.detailImages as string[])];
                          const [moved] = newImages.splice(dragIndex, 1);
                          newImages.splice(i, 0, moved);
                          setForm({ ...form, detailImages: newImages });
                        }
                        setDragIndex(null); setDragType(null);
                      }}
                      onDragEnd={() => { setDragIndex(null); setDragType(null); }}
                      style={{
                        width: 80, height: 80, borderRadius: 'var(--radius-md)', overflow: 'hidden',
                        border: '1px solid var(--color-neutral-200)', position: 'relative', cursor: 'grab',
                      }}
                    >
                      <img src={img} alt={`详情图-${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      {/* 序号 */}
                      <span style={{
                        position: 'absolute', top: 2, left: 2,
                        width: 16, height: 16, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.5)', color: '#fff',
                        fontSize: '10px', fontWeight: 'var(--font-semibold)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        lineHeight: 1,
                      }}>{i + 1}</span>
                      <div
                        onClick={() => setForm({ ...form, detailImages: (form.detailImages as string[]).filter((_, idx) => idx !== i) })}
                        style={{
                          position: 'absolute', bottom: 2, right: 2, width: 16, height: 16,
                          borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', fontSize: '10px', lineHeight: 1,
                        }}
                      >×</div>
                    </div>
                  ))}
                  <div style={{ position: 'relative' }}>
                    <label style={{
                      width: 80, height: 80, borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--color-neutral-300)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      background: 'var(--color-neutral-50)', color: 'var(--color-neutral-400)',
                      fontSize: 'var(--text-xs)', flexDirection: 'column', gap: 2,
                    }}>
                      <svg viewBox="0 0 16 16" fill="none" style={{ width: 20, height: 20 }}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                      添加详情图
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if ((form.detailImages as string[] || []).length >= 20) { alert('详情图最多20张'); return; }
                        const imgEl = new Image();
                        const url = URL.createObjectURL(file);
                        imgEl.onload = () => {
                          if (imgEl.width < 500 || imgEl.width > 1920 || imgEl.height > 3000) {
                            alert('详情图要求宽500-1920像素，高不超过3000像素，请重新选择');
                            URL.revokeObjectURL(url);
                            return;
                          }
                          setForm({ ...form, detailImages: [...(form.detailImages as string[] || []), url] });
                        };
                        imgEl.src = url;
                        e.target.value = '';
                      }} />
                    </label>
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: 'var(--radius-md)',
                      background: 'rgba(0,0,0,0.45)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', opacity: 0, transition: 'opacity var(--transition-fast)',
                      pointerEvents: 'none',
                    }}
                      className="img-hover-label"
                    >宽500-1920px 高≤3000px</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 包装清单 + 备注 */}
            <div className="grid-2">
              <Card title="包装清单">
                <input className="detail-input" value={f.packageList || ''} onChange={(e) => setForm({ ...form, packageList: e.target.value })} style={inputStyle} placeholder="如：茶叶罐×1、手提袋×1" />
              </Card>
              <Card title="备注">
                <textarea className="detail-textarea" value={f.remark || ''} onChange={(e) => setForm({ ...form, remark: e.target.value })} placeholder="请输入备注信息" rows={3} />
              </Card>
            </div>
          </>
        ) : (
          /* ── 查看模式 ── */
          <>
            {/* 顶部：图片 + 基本信息 */}
            <Card style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
                {/* 左侧图片区 */}
                <div style={{ flexShrink: 0, width: 400 }}>
                  {/* 主图预览 */}
                  <div style={{
                    width: 400, height: 400, borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                    background: '#fff', border: '1px solid var(--color-neutral-150)', marginBottom: 'var(--space-3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <img
                      src={mainPreview}
                      alt={product.name}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  {/* 缩略图列表 */}
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {product.mainImages.map((img, i) => (
                      <div
                        key={i}
                        onClick={() => setPreviewImage(img)}
                        style={{
                          width: 72, height: 72, borderRadius: 'var(--radius-md)', overflow: 'hidden',
                          background: '#fff', border: mainPreview === img ? '2px solid var(--color-module-current-base)' : '1px solid var(--color-neutral-150)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'border-color var(--transition-fast)',
                        }}
                      >
                        <img src={img} alt={`${product.name}-${i + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 右侧基本信息 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                    <span style={{ fontFamily: 'var(--font-family-serif)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-800)' }}>
                      {product.name}
                    </span>
                    {categoryTags.map((tag, i) => tag?.type === 'tea'
                      ? <Tag key={i} category={tag.teaCat} />
                      : <span key={i} style={{ padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: 'var(--color-module-current-lightest)', color: 'var(--color-module-current-base)', border: '1px solid var(--color-module-current-base)' }}>{tag?.label}</span>
                    )}
                  </div>
                  <div className="detail-grid">
                    <DetailRow label="商品编码"><span className="mono">{product.code}</span></DetailRow>
                    <DetailRow label="分类">{allCategories.join('、')}</DetailRow>
                    <DetailRow label="品牌"><span style={{ fontWeight: 'var(--font-medium)' }}>{product.brand}</span></DetailRow>
                    <DetailRow label="系列">{product.series}</DetailRow>
                    <DetailRow label="等级"><span style={{ fontWeight: 'var(--font-medium)' }}>{product.grade}</span></DetailRow>
                    <DetailRow label="产地">{product.origin}</DetailRow>
                    <DetailRow label="规格">{product.spec}</DetailRow>
                    <DetailRow label="包装单位">{product.packageUnit}</DetailRow>
                    <DetailRow label="保质期">{product.shelfLife} 个月</DetailRow>
                    <DetailRow label="税率">{product.taxRate}%</DetailRow>
                    <DetailRow label="69码"><span className="mono">{product.barcode69}</span></DetailRow>
                    <DetailRow label="型号"><span className="mono">{product.model}</span></DetailRow>
                  </div>
                  {/* 每份规格 */}
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)', margin: 'var(--space-3) 0 var(--space-2)', borderLeft: '3px solid var(--color-module-current-base)', paddingLeft: '8px' }}>每份规格</div>
                  <div className="detail-grid">
                    <DetailRow label="净重">{product.perUnitSpec?.netWeight || '-'} {product.perUnitSpec?.netWeightUnit || ''}</DetailRow>
                    <DetailRow label="毛重">{product.perUnitSpec?.grossWeight || '-'} {product.perUnitSpec?.grossWeightUnit || ''}</DetailRow>
                    <DetailRow label="体积">{product.perUnitSpec?.length || '-'}×{product.perUnitSpec?.width || '-'}×{product.perUnitSpec?.height || '-'} {product.perUnitSpec?.dimensionUnit || ''}</DetailRow>
                  </div>
                  {/* 每箱规格（箱规） */}
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)', margin: 'var(--space-3) 0 var(--space-2)', borderLeft: '3px solid var(--color-module-current-base)', paddingLeft: '8px' }}>每箱规格（箱规）</div>
                  <div className="detail-grid">
                    <DetailRow label="每箱数量">{product.perBoxSpec?.quantity || '-'}</DetailRow>
                    <DetailRow label="净重">{product.perBoxSpec?.netWeight || '-'} {product.perBoxSpec?.netWeightUnit || ''}</DetailRow>
                    <DetailRow label="毛重">{product.perBoxSpec?.grossWeight || '-'} {product.perBoxSpec?.grossWeightUnit || ''}</DetailRow>
                    <DetailRow label="体积">{product.perBoxSpec?.length || '-'}×{product.perBoxSpec?.width || '-'}×{product.perBoxSpec?.height || '-'} {product.perBoxSpec?.dimensionUnit || ''}</DetailRow>
                  </div>
                  <div className="detail-grid" style={{ marginTop: 'var(--space-2)' }}>
                    <DetailRow label="产品特点" span>{product.features}</DetailRow>
                  </div>
                </div>
              </div>
            </Card>

            {/* 中部：商品状态 + 价格信息 */}
            <div className="grid-2" style={{ marginBottom: 'var(--space-6)' }}>
              <Card title="商品状态">
                <div className="detail-grid">
                  <DetailRow label="上架状态">
                    <StatusTag variant={shelfVariant} label={getShelfStatusLabel(product.shelfStatus)} />
                  </DetailRow>
                  <DetailRow label="采购状态">
                    <StatusTag variant={purchaseVariant} label={getPurchaseStatusLabel(product.purchaseStatus)} />
                  </DetailRow>
                  <DetailRow label="生产状态">
                    <StatusTag variant={productionVariant} label={getProductionStatusLabel(product.productionStatus)} />
                  </DetailRow>
                  <DetailRow label="库存预警值">
                    <span style={{ fontWeight: 'var(--font-medium)' }}>{product.stockAlert}</span>
                  </DetailRow>
                  <DetailRow label="自有库存">
                    <span style={{ fontWeight: 'var(--font-medium)' }}>{product.stock}</span>
                  </DetailRow>
                  <DetailRow label="预占数量">
                    <span style={{ fontWeight: 'var(--font-medium)' }}>{product.reservedStock}</span>
                  </DetailRow>
                  <DetailRow label="总销量">
                    <span style={{ fontWeight: 'var(--font-medium)' }}>{product.totalSales}</span>
                  </DetailRow>
                </div>
              </Card>

              <Card title="价格信息">
                <div className="detail-grid">
                  <DetailRow label="市场价" span>
                    <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: '#CB405D' }}>
                      ¥{product.marketPrice}
                    </span>
                  </DetailRow>
                  <DetailRow label="天猫价" span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <span style={{ fontWeight: 'var(--font-medium)' }}>¥{product.tmallPrice}</span>
                      {product.tmallUrl && (
                        <a href={product.tmallUrl} target="_blank" rel="noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-module-current-base)' }}>
                          查看链接
                        </a>
                      )}
                    </div>
                  </DetailRow>
                  <DetailRow label="京东价" span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <span style={{ fontWeight: 'var(--font-medium)' }}>¥{product.jdPrice}</span>
                      {product.jdUrl && (
                        <a href={product.jdUrl} target="_blank" rel="noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-module-current-base)' }}>
                          查看链接
                        </a>
                      )}
                    </div>
                  </DetailRow>
                </div>
              </Card>
            </div>

            {/* 底部：附加信息 */}
            <div className="grid-2">
              <Card title="包装清单">
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', lineHeight: 'var(--leading-md)' }}>
                  {product.packageList || <span style={{ color: 'var(--color-neutral-400)' }}>未填写</span>}
                </div>
              </Card>

              <Card title="备注">
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', lineHeight: 'var(--leading-md)' }}>
                  {product.remark || <span style={{ color: 'var(--color-neutral-400)' }}>未填写</span>}
                </div>
              </Card>

              <Card title="详情图" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  {product.detailImages.length > 0 ? (
                    product.detailImages.map((img, i) => (
                      <div
                        key={i}
                        style={{
                          width: 200, height: 200, borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                          background: '#fff', border: '1px solid var(--color-neutral-150)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <img src={img} alt={`详情图-${i + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
                    ))
                  ) : (
                    <span style={{ color: 'var(--color-neutral-400)' }}>暂无详情图</span>
                  )}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="category-dialog-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 400 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-800)', marginBottom: 'var(--space-3)' }}>确认删除</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-5)' }}>
              确定要删除商品「{product?.name}」吗？此操作不可撤销。
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>取消</Button>
              <Button onClick={() => { setShowDeleteConfirm(false); navigate('/product/product-manage-tea'); }} style={{ background: '#eb5c20', borderColor: '#eb5c20' }}>确认删除</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
