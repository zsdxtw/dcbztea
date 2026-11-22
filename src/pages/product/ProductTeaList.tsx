import { useState, useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Tag from '../../components/common/Tag';
import Button from '../../components/common/Button';
import { teaVarieties as initialData, getTeaImageUrl } from '../../data/teaVarieties';
import { getTeaCategoryLabel } from '../../data/teaCategories';
import { TeaCategory } from '../../types';
import type { TeaVariety } from '../../data/teaVarieties';

const PAGE_SIZE = 16;

/** 全国所有省份 */
const ALL_PROVINCES = [
  '安徽','北京','重庆','福建','甘肃','广东','广西','贵州','海南','河北',
  '河南','黑龙江','湖北','湖南','吉林','江苏','江西','辽宁','内蒙古','宁夏',
  '青海','山东','山西','陕西','上海','四川','台湾','天津','西藏','香港',
  '新疆','云南','浙江',
];

const emptyForm = {
  name: '', category: TeaCategory.GREEN, origin: [] as string[], originDetail: '',
  introduction: '', characteristics: '', brands: [] as string[], image: '',
};

/** 茶种大全页面 */
export default function ProductTeaList() {
  const [teas, setTeas] = useState<TeaVariety[]>(initialData);
  const [selectedCategory, setSelectedCategory] = useState<TeaCategory | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 抽屉状态
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState({ ...emptyForm });
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // 批量删除
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const allOrigins = useMemo(() => {
    const origins = new Set<string>();
    teas.forEach((t) => origins.add(t.origin));
    return Array.from(origins).sort();
  }, [teas]);

  const filtered = useMemo(() => {
    return teas.filter((t) => {
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (selectedOrigin && t.origin !== selectedOrigin) return false;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        if (!t.name.toLowerCase().includes(kw) && !t.origin.includes(kw) && !t.originDetail.includes(kw) && !t.characteristics.includes(kw) && !t.brands.some((b) => b.includes(kw))) return false;
      }
      return true;
    });
  }, [teas, selectedCategory, selectedOrigin, searchKeyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const handleCategoryChange = (cat: TeaCategory | null) => { setSelectedCategory(cat); setCurrentPage(1); };
  const handleOriginChange = (origin: string | null) => { setSelectedOrigin(origin); setCurrentPage(1); };
  const handleSearch = (kw: string) => { setSearchKeyword(kw); setCurrentPage(1); };

  // 新增
  const handleOpenAdd = () => {
    setDrawerMode('add');
    setForm({ ...emptyForm });
    setEditIndex(null);
    setShowDrawer(true);
  };

  // 编辑
  const handleOpenEdit = (idx: number) => {
    const tea = filtered[idx];
    const globalIdx = teas.indexOf(tea);
    setDrawerMode('edit');
    setForm({ ...tea, origin: [tea.origin], brands: [...tea.brands], image: tea.image || '' });
    setEditIndex(globalIdx);
    setShowDrawer(true);
  };

  // 保存
  const handleSave = () => {
    if (!form.name.trim()) return;
    const data: TeaVariety = { ...form, origin: form.origin[0] || '', brands: form.brands.filter(Boolean), popularity: 50, image: form.image || undefined };
    if (drawerMode === 'add') {
      setTeas((prev) => [...prev, data]);
    } else if (editIndex !== null) {
      const next = [...teas];
      next[editIndex] = data;
      setTeas(next);
    }
    setShowDrawer(false);
  };

  // 批量删除
  const handleEnterDeleteMode = () => {
    setDeleteMode(true);
    setSelectedForDelete(new Set());
  };

  const handleCancelDeleteMode = () => {
    setDeleteMode(false);
    setSelectedForDelete(new Set());
  };

  const handleToggleSelect = (globalIdx: number) => {
    setSelectedForDelete((prev) => {
      const next = new Set(prev);
      if (next.has(globalIdx)) next.delete(globalIdx);
      else next.add(globalIdx);
      return next;
    });
  };

  const handleConfirmDelete = () => {
    const next = teas.filter((_, i) => !selectedForDelete.has(i));
    setTeas(next);
    setDeleteMode(false);
    setSelectedForDelete(new Set());
  };

  // 产地多选
  const handleToggleFormOrigin = (origin: string) => {
    setForm((prev) => ({
      ...prev,
      origin: prev.origin.includes(origin)
        ? prev.origin.filter((o) => o !== origin)
        : [...prev.origin, origin],
    }));
  };

  const filterBtnStyle = (active: boolean) => ({
    padding: '4px 12px',
    borderRadius: 'var(--radius-md)' as const,
    border: `1px solid ${active ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
    background: active ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
    color: active ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
    cursor: 'pointer' as const,
    fontSize: 'var(--text-sm)' as const,
    transition: 'var(--transition-fast)' as const,
    whiteSpace: 'nowrap' as const,
  });

  return (
    <>
      <ContentHeader title="茶种大全" breadcrumbs={['商品', '茶叶档案', '茶种大全']} />
      <div className="content-body">
        {/* 筛选区 */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', fontWeight: 'var(--font-medium)', flexShrink: 0 }}>茶类：</span>
            <button style={filterBtnStyle(!selectedCategory)} onClick={() => handleCategoryChange(null)}>全部</button>
            {Object.values(TeaCategory).map((cat) => (
              <button key={cat} style={filterBtnStyle(selectedCategory === cat)} onClick={() => handleCategoryChange(selectedCategory === cat ? null : cat)}>
                {getTeaCategoryLabel(cat)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', fontWeight: 'var(--font-medium)', flexShrink: 0 }}>产地：</span>
            <button style={filterBtnStyle(!selectedOrigin)} onClick={() => handleOriginChange(null)}>全部</button>
            {allOrigins.map((o) => (
              <button key={o} style={filterBtnStyle(selectedOrigin === o)} onClick={() => handleOriginChange(selectedOrigin === o ? null : o)}>
                {o}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <input
              className="filter-input"
              placeholder="搜索茶种名称、产地、特点、品牌..."
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ maxWidth: 320 }}
            />
            <Button onClick={handleOpenAdd}><svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>新增</Button>
            {deleteMode ? (
              <>
                <Button onClick={() => setShowDeleteConfirm(true)} disabled={selectedForDelete.size === 0} style={{ background: '#eb5c20', borderColor: '#eb5c20' }}>
                  <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  删除所选({selectedForDelete.size})
                </Button>
                <Button variant="ghost" onClick={handleCancelDeleteMode} style={{ color: 'var(--color-neutral-500)' }}>关闭</Button>
              </>
            ) : (
              <Button onClick={handleEnterDeleteMode} style={{ background: '#eb5c20', borderColor: '#eb5c20' }}>
                <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                删除
              </Button>
            )}
          </div>
        </Card>

        {/* 茶种卡片列表 - 4列 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          {paged.map((tea, idx) => {
            const globalIdx = teas.indexOf(tea);
            const isSelected = selectedForDelete.has(globalIdx);
            return (
              <div key={`${tea.category}-${tea.name}-${idx}`} className="tea-card-hover" style={{ position: 'relative' }}>
                {deleteMode && (
                  <div
                    style={{ position: 'absolute', top: 'var(--space-2)', left: 'var(--space-2)', zIndex: 10, cursor: 'pointer' }}
                    onClick={() => handleToggleSelect(globalIdx)}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 'var(--radius-sm)',
                      border: `2px solid ${isSelected ? '#eb5c20' : 'var(--color-neutral-300)'}`,
                      background: isSelected ? '#eb5c20' : 'var(--color-neutral-0)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'var(--transition-fast)',
                    }}>
                      {isSelected && <svg viewBox="0 0 12 12" fill="none" style={{ width: 10, height: 10 }}><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </div>
                )}
                <Card style={isSelected ? { outline: '2px solid #eb5c20', borderRadius: 'var(--radius-lg)' } : undefined}>
                  {/* 茶种图片 */}
                  <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--space-3)', background: 'var(--color-neutral-100)', position: 'relative' }}>
                    <img
                      src={tea.image || getTeaImageUrl(tea.name)}
                      alt={tea.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(tea.name.charAt(0) + ' 茶字 书法 水墨')}&image_size=square`; }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-800)', lineHeight: 1.3 }}>{tea.name}</span>
                    <Tag category={tea.category} />
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-3)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {tea.introduction}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-1)', marginBottom: 'var(--space-3)' }}>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginBottom: '1px' }}>产地</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${tea.origin}·${tea.originDetail}`}>{tea.origin}·{tea.originDetail}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginBottom: '1px' }}>特点</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tea.characteristics}>{tea.characteristics}</div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--color-neutral-100)', paddingTop: 'var(--space-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginBottom: 'var(--space-1)' }}>代表品牌</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {tea.brands.map((brand) => (
                          <span key={brand} style={{ padding: '1px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
                            {brand}
                          </span>
                        ))}
                      </div>
                    </div>
                    {!deleteMode && (
                      <div className="tea-card-edit-btn" style={{ flexShrink: 0, marginLeft: 'var(--space-2)' }}>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(idx)} style={{ color: '#01795D', padding: '2px 6px', fontSize: 'var(--text-xs)' }}>编辑</Button>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* 空状态 */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)' }}>
            暂无匹配的茶种
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-5)', paddingBottom: 'var(--space-4)' }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral-200)', background: 'var(--color-neutral-0)', color: currentPage === 1 ? 'var(--color-neutral-300)' : 'var(--color-neutral-600)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 'var(--text-sm)' }}>上一页</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)} style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', border: `1px solid ${currentPage === page ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`, background: currentPage === page ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)', color: currentPage === page ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: currentPage === page ? 'var(--font-semibold)' : 'normal', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{page}</button>
            ))}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral-200)', background: 'var(--color-neutral-0)', color: currentPage === totalPages ? 'var(--color-neutral-300)' : 'var(--color-neutral-600)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: 'var(--text-sm)' }}>下一页</button>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginLeft: 'var(--space-2)' }}>第 {currentPage}/{totalPages} 页</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginLeft: 'var(--space-2)' }}>共 {filtered.length} 个茶种</span>
          </div>
        )}
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="category-dialog-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 400 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-800)', marginBottom: 'var(--space-3)' }}>确认删除</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-5)' }}>
              确定要删除选中的 {selectedForDelete.size} 个茶种吗？此操作不可撤销。
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>关闭</Button>
              <Button onClick={() => { handleConfirmDelete(); setShowDeleteConfirm(false); }} style={{ background: '#eb5c20', borderColor: '#eb5c20' }}>确认删除</Button>
            </div>
          </div>
        </div>
      )}

      {/* 新增/编辑抽屉 */}
      {showDrawer && (
        <div className="drawer-overlay" onClick={() => setShowDrawer(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-title">{drawerMode === 'add' ? '新增茶种' : '编辑茶种'}</span>
              <button className="drawer-close" onClick={() => setShowDrawer(false)}>
                <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="drawer-body">
              {/* 茶种图片 */}
              <div className="drawer-form-row" style={{ flexDirection: 'column', alignItems: 'center' }}>
                <div className="drawer-form-field" style={{ width: 'auto', alignItems: 'center' }}>
                  <label className="drawer-label" style={{ textAlign: 'center' }}>茶种图片</label>
                  <div style={{ position: 'relative', width: 160, height: 160, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-neutral-100)', border: '1px dashed var(--color-neutral-300)', cursor: 'pointer' }}
                    onClick={() => { const input = document.getElementById('tea-image-upload') as HTMLInputElement; if (input) input.click(); }}
                  >
                    <img
                      src={form.image || getTeaImageUrl(form.name || '茶')}
                      alt="茶种图片"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent((form.name || '茶').charAt(0) + ' 茶字 书法 水墨')}&image_size=square`; }}
                    />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', textAlign: 'center', padding: '4px 0', fontSize: 'var(--text-xs)' }}>
                      点击修改图片
                    </div>
                    <input
                      id="tea-image-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        // 校验图片尺寸不超过500x500
                        const img = new Image();
                        const url = URL.createObjectURL(file);
                        img.onload = () => {
                          if (img.width > 500 || img.height > 500) {
                            alert('图片尺寸不能超过500×500像素，请重新选择');
                            URL.revokeObjectURL(url);
                            return;
                          }
                          setForm({ ...form, image: url });
                          URL.revokeObjectURL(url);
                        };
                        img.src = url;
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', textAlign: 'center', marginTop: '4px' }}>
                    正方形图片，最大500×500像素
                  </div>
                </div>
              </div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">茶种名称 <span style={{ color: '#eb5c20' }}>*</span></label>
                  <input className="detail-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="请输入茶种名称" />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">茶类 <span style={{ color: '#eb5c20' }}>*</span></label>
                  <select className="detail-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TeaCategory })}>
                    {Object.values(TeaCategory).map((cat) => (
                      <option key={cat} value={cat}>{getTeaCategoryLabel(cat)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">产地（支持多选）</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: '4px' }}>
                    {ALL_PROVINCES.map((o) => (
                      <label key={o} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                        <input type="checkbox" checked={form.origin.includes(o)} onChange={() => handleToggleFormOrigin(o)} />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="drawer-form-row">
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">产地详情</label>
                  <input className="detail-input" value={form.originDetail} onChange={(e) => setForm({ ...form, originDetail: e.target.value })} placeholder="如：杭州西湖区" />
                </div>
              </div>
              <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">茶种介绍</label>
                  <textarea className="detail-textarea" value={form.introduction} onChange={(e) => setForm({ ...form, introduction: e.target.value })} placeholder="请输入茶种介绍" rows={3} />
                </div>
              </div>
              <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">特点</label>
                  <input className="detail-input" value={form.characteristics} onChange={(e) => setForm({ ...form, characteristics: e.target.value })} placeholder="请输入特点" />
                </div>
              </div>
              <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">代表品牌（用顿号分隔）</label>
                  <input className="detail-input" value={form.brands.join('、')} onChange={(e) => setForm({ ...form, brands: e.target.value.split(/[、,，]/).map((s: string) => s.trim()).filter(Boolean) })} placeholder="如：西湖牌、狮峰牌、贡牌" />
                </div>
              </div>
            </div>
            <div className="drawer-footer">
              <Button variant="ghost" onClick={() => setShowDrawer(false)}>关闭</Button>
              <Button onClick={handleSave}>{drawerMode === 'add' ? '确认新增' : '保存修改'}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
