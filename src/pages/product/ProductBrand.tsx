import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Tag from '../../components/common/Tag';
import type { BrandItem } from '../../types';
import { TeaCategory } from '../../types';
import { brandItems } from '../../data/brands';
import { PROVINCE_NAMES, getCityNames, getDistricts } from '../../data/regions';
import { teaCategoryData, teawareCategoryData, teaPeripheralCategoryData, otherCategoryData } from '../../data/productCategories';

/** 通过茶类中文名称获取 TeaCategory 枚举 */
function nameToTeaCategory(name: string): TeaCategory | undefined {
  const map: Record<string, TeaCategory> = {
    '绿茶': TeaCategory.GREEN, '红茶': TeaCategory.RED, '青茶': TeaCategory.OOLONG,
    '白茶': TeaCategory.WHITE, '黄茶': TeaCategory.YELLOW, '黑茶': TeaCategory.DARK,
    '花草茶': TeaCategory.FLOWER,
  };
  return map[name];
}

/** 一级分类选项 */
const LEVEL1_OPTIONS = [
  { label: '茶叶', data: teaCategoryData },
  { label: '茶具', data: teawareCategoryData },
  { label: '茶周边', data: teaPeripheralCategoryData },
  { label: '其他', data: otherCategoryData },
];

/** 获取一级分类下的二级分类名称列表 */
function getLevel2Names(level1: string): string[] {
  const found = LEVEL1_OPTIONS.find((o) => o.label === level1);
  return found ? (found.data.children?.map((c) => c.name) ?? []) : [];
}

/** 新增品牌表单初始值 */
const emptyForm = {
  name: '', owner: '', introduction: '', requirements: '', policy: '',
  mainCategories: [] as string[], series: [] as string[],
  jdStoreUrl: '', tmallStoreUrl: '', website: '',
  contactPerson: '', contactPhone: '', province: '', city: '', district: '', address: '',
};

export default function ProductBrand() {
  const navigate = useNavigate();
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterLevel1, setFilterLevel1] = useState('');
  const [filterLevel2, setFilterLevel2] = useState('');
  const level2Options = useMemo(() => filterLevel1 ? getLevel2Names(filterLevel1) : [], [filterLevel1]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [newSeries, setNewSeries] = useState('');
  const [showSeriesInput, setShowSeriesInput] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // 批量删除
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEnterDeleteMode = () => {
    setDeleteMode(true);
    setSelectedForDelete(new Set());
  };

  const handleCancelDeleteMode = () => {
    setDeleteMode(false);
    setSelectedForDelete(new Set());
  };

  const handleToggleSelect = (id: string) => {
    setSelectedForDelete((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmDelete = () => {
    // 模拟删除（实际项目中应调用API）
    handleCancelDeleteMode();
  };

  const filteredItems = brandItems.filter((b) => {
    if (filterKeyword && !b.name.includes(filterKeyword) && !b.code.toLowerCase().includes(filterKeyword.toLowerCase()) && !b.owner.includes(filterKeyword)) return false;
    if (filterLevel2 && !b.mainCategories.includes(filterLevel2)) return false;
    if (filterLevel1 && !filterLevel2) {
      const level2Names = getLevel2Names(filterLevel1);
      if (!b.mainCategories.some((c) => level2Names.includes(c))) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  const handleRowClick = (id: string) => {
    navigate(`/product/product-brand/${id}`);
  };

  const handleOpenDrawer = () => {
    setForm({ ...emptyForm });
    setNewSeries('');
    setShowSeriesInput(false);
    setShowDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
  };

  const handleToggleCategory = (cat: string) => {
    setForm((prev) => ({
      ...prev,
      mainCategories: prev.mainCategories.includes(cat)
        ? prev.mainCategories.filter((c) => c !== cat)
        : [...prev.mainCategories, cat],
    }));
  };

  const handleAddSeries = () => {
    if (newSeries.trim()) {
      setForm((prev) => ({ ...prev, series: [...prev.series, newSeries.trim()] }));
      setNewSeries('');
      setShowSeriesInput(false);
    }
  };

  const handleRemoveSeries = (idx: number) => {
    setForm((prev) => ({ ...prev, series: prev.series.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = () => {
    // 模拟提交
    setShowDrawer(false);
  };

  /** 生成下一个品牌编号 */
  const nextCode = String(brandItems.length + 1).padStart(3, '0');

  return (
    <>
      <ContentHeader title="品牌管理" breadcrumbs={['商品', '品牌管理']} />
      <div className="content-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <input className="filter-input" placeholder="搜索品牌名称、编码、所属公司..." value={filterKeyword} onChange={(e) => { setFilterKeyword(e.target.value); setCurrentPage(1); }} />
          <select className="filter-select" value={filterLevel1} onChange={(e) => { setFilterLevel1(e.target.value); setFilterLevel2(''); setCurrentPage(1); }}>
            <option value="">全部</option>
            {LEVEL1_OPTIONS.map((o) => <option key={o.label} value={o.label}>{o.label}</option>)}
          </select>
          <select className="filter-select" value={filterLevel2} onChange={(e) => { setFilterLevel2(e.target.value); setCurrentPage(1); }}>
            <option value="">全部</option>
            {level2Options.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button onClick={handleOpenDrawer}>
            <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}>
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            新增
          </Button>
          {deleteMode ? (
            <>
              <Button onClick={() => setShowDeleteConfirm(true)} disabled={selectedForDelete.size === 0} style={{ background: '#eb5c20', borderColor: '#eb5c20' }}>
                <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}>
                  <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                删除所选({selectedForDelete.size})
              </Button>
              <Button variant="ghost" onClick={handleCancelDeleteMode} style={{ color: 'var(--color-neutral-500)' }}>关闭</Button>
            </>
          ) : (
            <Button style={{ background: '#eb5c20', borderColor: '#eb5c20' }} onClick={handleEnterDeleteMode}>
              <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}>
                <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              删除
            </Button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', flexShrink: 0 }}>共 {filteredItems.length} 个品牌</span>
        </div>
        <Card>
          <Table
            headers={[deleteMode ? '选择' : '序号', '品牌LOGO', '品牌名称', '品牌编号', '品牌所属', '主营品类', '商品数量', '联系人', '联系电话', '操作']}
            rows={pagedItems.map((b, idx) => [
              deleteMode
                ? <input type="checkbox" checked={selectedForDelete.has(b.id)} onChange={() => handleToggleSelect(b.id)} />
                : <span className="mono">{(currentPage - 1) * PAGE_SIZE + idx + 1}</span>,
              <div className="brand-logo-cell" onClick={() => handleRowClick(b.id)} style={{ cursor: 'pointer' }}>
                {b.logo ? <img src={b.logo} alt={b.name} className="brand-logo-img" /> : <div className="brand-logo-placeholder">{b.name[0]}</div>}
              </div>,
              <span style={{ fontWeight: 'var(--font-medium)', cursor: 'pointer', color: 'var(--color-module-current-base)' }} onClick={() => handleRowClick(b.id)}>{b.name}</span>,
              <span className="mono">{b.code}</span>,
              <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }} title={b.owner}>{b.owner}</span>,
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {b.mainCategories.map((c) => {
                  const cat = nameToTeaCategory(c);
                  return cat ? <Tag key={c} category={cat} /> : <span key={c} className="brand-series-tag">{c}</span>;
                })}
              </div>,
              <span className="mono">{b.productCount}</span>,
              <span>{b.contactPerson}</span>,
              <span className="mono">{b.contactPhone}</span>,
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="ghost" size="sm" onClick={() => handleRowClick(b.id)} style={{ color: '#01795D' }}>详情</Button>
              </div>,
            ])}
          />
        </Card>
        {/* 分页 */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-5)',
            paddingBottom: 'var(--space-4)',
          }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-neutral-200)',
                background: 'var(--color-neutral-0)',
                color: currentPage === 1 ? 'var(--color-neutral-300)' : 'var(--color-neutral-600)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: 'var(--text-sm)',
              }}
            >
              上一页
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${currentPage === page ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
                  background: currentPage === page ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
                  color: currentPage === page ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: currentPage === page ? 'var(--font-semibold)' : 'normal',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-neutral-200)',
                background: 'var(--color-neutral-0)',
                color: currentPage === totalPages ? 'var(--color-neutral-300)' : 'var(--color-neutral-600)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: 'var(--text-sm)',
              }}
            >
              下一页
            </button>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginLeft: 'var(--space-2)' }}>
              第 {currentPage}/{totalPages} 页
            </span>
          </div>
        )}
      </div>

      {/* 右侧滑出抽屉 - 新增品牌 */}
      {showDrawer && (
        <div className="drawer-overlay" onClick={handleCloseDrawer}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-title">新增品牌</span>
              <button className="drawer-close" onClick={handleCloseDrawer}>
                <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="drawer-body">
              {/* LOGO 上传 */}
              <div style={{ marginBottom: 'var(--space-5)' }}>
                <label className="drawer-label">品牌LOGO</label>
                <div style={{ width: 75, height: 75, border: '2px dashed var(--color-neutral-300)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-neutral-400)', fontSize: 'var(--text-xs)', gap: '2px', transition: 'var(--transition-fast)' }}>
                  <svg viewBox="0 0 20 20" fill="none" style={{ width: 20, height: 20 }}><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  上传LOGO
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: 'none' }} />
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: '4px' }}>正方形，最大500×500像素</div>
              </div>

              {/* 基本信息 */}
              <div className="drawer-section-title">基本信息</div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">品牌编号</label>
                  <input className="detail-input" value={nextCode} readOnly style={{ background: 'var(--color-neutral-100)', color: 'var(--color-neutral-500)' }} />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">品牌名称 <span style={{ color: '#eb5c20' }}>*</span></label>
                  <input className="detail-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="请输入品牌名称" />
                </div>
              </div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">品牌所属 <span style={{ color: '#eb5c20' }}>*</span></label>
                  <input className="detail-input" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="请输入所属公司" />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">主营品类</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: '4px' }}>
                    {LEVEL1_OPTIONS.map((opt) => {
                      const level2Names = opt.data.children?.map((c) => c.name) ?? [];
                      return (
                        <div key={opt.label} style={{ width: '100%', marginBottom: 'var(--space-1)' }}>
                          <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)', marginBottom: '4px', color: 'var(--color-neutral-700)' }}>{opt.label}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                            {level2Names.map((cat) => (
                              <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                                <input type="checkbox" checked={form.mainCategories.includes(cat)} onChange={() => handleToggleCategory(cat)} />
                                {cat}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">品牌介绍</label>
                  <textarea className="detail-textarea" value={form.introduction} onChange={(e) => setForm({ ...form, introduction: e.target.value })} placeholder="请输入品牌介绍" rows={3} />
                </div>
              </div>

              {/* 联系信息 */}
              <div className="drawer-section-title">联系信息</div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">联系人</label>
                  <input className="detail-input" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="请输入联系人" />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">联系电话</label>
                  <input className="detail-input" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="请输入联系电话" />
                </div>
              </div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">省份</label>
                  <select className="detail-select" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value, city: '', district: '' })}>
                    <option value="">请选择省份</option>
                    {PROVINCE_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">城市</label>
                  <select className="detail-select" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value, district: '' })} disabled={!form.province}>
                    <option value="">请选择城市</option>
                    {form.province && getCityNames(form.province).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">区县</label>
                  <select className="detail-select" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} disabled={!form.city}>
                    <option value="">请选择区县</option>
                    {form.province && form.city && getDistricts(form.province, form.city).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">详细地址</label>
                  <input className="detail-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="请输入详细地址" />
                </div>
              </div>

              {/* 网络地址 */}
              <div className="drawer-section-title">网络地址</div>
              <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">品牌官网</label>
                  <input className="detail-input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
                </div>
              </div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">京东店地址</label>
                  <input className="detail-input" value={form.jdStoreUrl} onChange={(e) => setForm({ ...form, jdStoreUrl: e.target.value })} placeholder="https://" />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">天猫店地址</label>
                  <input className="detail-input" value={form.tmallStoreUrl} onChange={(e) => setForm({ ...form, tmallStoreUrl: e.target.value })} placeholder="https://" />
                </div>
              </div>

              {/* 品牌政策与要求 */}
              <div className="drawer-section-title">品牌政策与要求</div>
              <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">品牌要求</label>
                  <textarea className="detail-textarea" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="请输入品牌要求" rows={2} />
                </div>
              </div>
              <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">品牌政策</label>
                  <textarea className="detail-textarea" value={form.policy} onChange={(e) => setForm({ ...form, policy: e.target.value })} placeholder="请输入品牌政策" rows={2} />
                </div>
              </div>
              <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">品牌系列</label>
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      {form.series.map((s, i) => (
                        <span key={i} className="brand-series-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {s}
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-400)', fontSize: 'var(--text-xs)', padding: 0, lineHeight: 1 }} onClick={() => handleRemoveSeries(i)}>✕</button>
                        </span>
                      ))}
                    </div>
                    {showSeriesInput ? (
                      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                        <input className="detail-input" value={newSeries} onChange={(e) => setNewSeries(e.target.value)} placeholder="输入系列名称" style={{ flex: 1 }} onKeyDown={(e) => { if (e.key === 'Enter') handleAddSeries(); }} />
                        <Button variant="ghost" size="sm" onClick={() => { setShowSeriesInput(false); setNewSeries(''); }} style={{ color: 'var(--color-neutral-400)' }}>关闭</Button>
                        <Button size="sm" onClick={handleAddSeries}>确认</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setShowSeriesInput(true)}>+ 添加系列</Button>
                    )}
                  </div>
                </div>
              </div>

              {/* 商标证书 */}
              <div className="drawer-section-title">商标证书</div>
              <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <Button variant="ghost" size="sm">+ 上传文件</Button>
                </div>
              </div>
            </div>
            <div className="drawer-footer">
              <Button variant="ghost" onClick={handleCloseDrawer}>关闭</Button>
              <Button onClick={handleSubmit}>确认新增</Button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="category-dialog-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 400 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-800)', marginBottom: 'var(--space-3)' }}>确认删除</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-5)' }}>
              确定要删除选中的 {selectedForDelete.size} 个品牌吗？此操作不可撤销。
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>关闭</Button>
              <Button onClick={() => { handleConfirmDelete(); setShowDeleteConfirm(false); }} style={{ background: '#eb5c20', borderColor: '#eb5c20' }}>确认删除</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
