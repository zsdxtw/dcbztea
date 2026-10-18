import { useState, useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import {
  supplierItems,
  SUPPLIER_TYPE_LABELS,
  SUPPLIER_TYPE_COLORS,
  GRADE_COLORS,
  TAX_TYPE_LABELS,
  SETTLEMENT_METHOD_LABELS,
  SHIPPING_SETTLEMENT_LABELS,
  QUALIFICATION_STATUS_LABELS,
} from '../../data/suppliers';
import type { SupplierItem, SupplierType, SupplierGrade, SupplierWarehouse, SupplierStore, SupplierTerminal } from '../../types';
import type { StatCardData } from '../../types';
import { PROVINCE_NAMES, getCityNames, getDistricts } from '../../data/regions';

/* ── 供应商类型筛选配置 ── */
const TYPE_FILTER: { key: SupplierType | 'all'; label: string; color: string; desc: string }[] = [
  { key: 'all', label: '全部供应商', color: 'var(--color-module-current-base)', desc: '所有合作供应商' },
  { key: 'brand', label: '品牌方', color: 'var(--color-module-current-base)', desc: '品牌方直接合作，拥有品牌授权' },
  { key: 'partner', label: '合作方', color: '#0DAFC6', desc: '合作方间接合作，非品牌持有方' },
];

/** 详情抽屉 Tab 键 */
type DrawerTabKey = 'basic' | 'qualification' | 'operation' | 'warehouse' | 'store' | 'finance' | 'terminal';

export default function PurchaseSuppliers() {
  const [activeType, setActiveType] = useState<SupplierType | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<SupplierItem | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  /** 抽屉当前激活 Tab */
  const [activeTab, setActiveTab] = useState<DrawerTabKey>('basic');
  /** 列表数据（编辑保存后同步门店数量等变化） */
  const [list, setList] = useState<SupplierItem[]>(supplierItems);

  // 筛选
  const filtered = useMemo(() => {
    return list.filter(s => {
      if (activeType !== 'all' && s.type !== activeType) return false;
      if (filterGrade && s.grade !== filterGrade) return false;
      if (keyword && !s.name.includes(keyword) && !s.unifiedCreditCode.includes(keyword) && !s.contactPerson.includes(keyword)) return false;
      return true;
    });
  }, [list, activeType, keyword, filterGrade]);

  // 统计
  const stats: StatCardData[] = useMemo(() => {
    const brandCount = list.filter(s => s.type === 'brand').length;
    const partnerCount = list.filter(s => s.type === 'partner').length;
    const activeCount = list.filter(s => s.status === 'active').length;
    const gradeA = list.filter(s => s.grade === 'A' || s.grade === 'S').length;
    return [
      {
        label: '品牌方', value: String(brandCount), unit: '家',
        trend: { direction: 'up', value: `在册 ${list.filter(s => s.type === 'brand' && s.status === 'active').length} 家` },
        icon: <svg viewBox="0 0 18 18" fill="none"><path d="M9 2L3 5v5c0 5 3.5 7.5 7 9 3.5-1.5 7-4 7-9V5L9 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
      },
      {
        label: '合作方', value: String(partnerCount), unit: '家',
        trend: { direction: 'up', value: `在册 ${list.filter(s => s.type === 'partner' && s.status === 'active').length} 家` },
        icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 16a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="14" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/></svg>,
      },
      {
        label: '在册供应商', value: String(activeCount), unit: '家',
        trend: { direction: 'up', value: `总计 ${list.length} 家` },
        icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 9h12M7 5V3h4v2" stroke="currentColor" strokeWidth="1.3"/></svg>,
      },
      {
        label: 'A级以上', value: String(gradeA), unit: '家',
        trend: { direction: 'up', value: `占比 ${(gradeA / list.length * 100).toFixed(0)}%` },
        icon: <svg viewBox="0 0 18 18" fill="none"><path d="M9 2l2.5 5 5.5.8-4 3.9.9 5.5L9 14.7 5.1 17.2l.9-5.5-4-3.9L7.5 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
      },
    ];
  }, [list]);

  // 删除
  const handleEnterDeleteMode = () => { setDeleteMode(true); setSelectedForDelete(new Set()); };
  const handleCancelDeleteMode = () => { setDeleteMode(false); setSelectedForDelete(new Set()); setShowDeleteConfirm(false); };
  const handleToggleSelect = (id: string) => {
    setSelectedForDelete(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  // 查看详情
  const handleView = (s: SupplierItem) => { setSelectedSupplier(s); setEditing(false); setEditForm(null); setActiveTab('basic'); setShowDetail(true); };
  // 进入编辑
  const handleStartEdit = () => { if (selectedSupplier) { setEditForm({ ...selectedSupplier, stores: selectedSupplier.stores.map(st => ({ ...st })), terminal: { ...selectedSupplier.terminal } }); setEditing(true); } };
  // 取消编辑
  const handleCancelEdit = () => { setEditing(false); setEditForm(null); };
  // 保存编辑（同步列表，门店数量等随之更新）
  const handleSaveEdit = () => { if (editForm) { setSelectedSupplier(editForm); setList(prev => prev.map(s => s.id === editForm.id ? editForm : s)); setEditing(false); setEditForm(null); } };

  // 仓库编辑（合作仓库联动仓储 > 仓库设置）
  const updateWarehouse = (idx: number, patch: Partial<SupplierWarehouse>) => {
    setEditForm(prev => prev ? { ...prev, warehouses: prev.warehouses.map((w, i) => i === idx ? { ...w, ...patch } : w) } : prev);
  };
  const addWarehouse = () => {
    setEditForm(prev => prev ? { ...prev, warehouses: [...prev.warehouses, { id: `w${Date.now()}`, name: '', address: '', contactPerson: '', contactPhone: '', isDefault: prev.warehouses.length === 0 }] } : prev);
  };
  const removeWarehouse = (idx: number) => {
    setEditForm(prev => prev ? { ...prev, warehouses: prev.warehouses.filter((_, i) => i !== idx) } : prev);
  };
  const setDefaultWarehouse = (idx: number) => {
    setEditForm(prev => prev ? { ...prev, warehouses: prev.warehouses.map((w, i) => ({ ...w, isDefault: i === idx })) } : prev);
  };

  // 门店编辑（增删改）
  /** 门店主营品牌输入草稿（解决「、」分隔符输入被吞问题） */
  const [brandDrafts, setBrandDrafts] = useState<Record<number, string>>({});
  const updateStore = (idx: number, patch: Partial<SupplierStore>) => {
    setEditForm(prev => prev ? { ...prev, stores: prev.stores.map((st, i) => i === idx ? { ...st, ...patch } : st) } : prev);
  };
  const addStore = () => {
    setEditForm(prev => prev ? { ...prev, stores: [...prev.stores, { id: `st${Date.now()}`, name: '', address: '', area: 0, mainBrands: [], status: 'active' }] } : prev);
  };
  const removeStore = (idx: number) => {
    setEditForm(prev => prev ? { ...prev, stores: prev.stores.filter((_, i) => i !== idx) } : prev);
    setBrandDrafts({});
  };

  // 终端编辑
  const suggestTerminalUsername = (s: SupplierItem) => `gys${s.id.padStart(3, '0')}`;
  const updateTerminal = (patch: Partial<SupplierTerminal>) => {
    setEditForm(prev => prev ? { ...prev, terminal: { ...prev.terminal, ...patch } } : prev);
  };
  /** 编辑态切换终端开通状态 */
  const handleTerminalEnable = (enable: boolean) => {
    setEditForm(prev => {
      if (!prev) return prev;
      if (enable) {
        return { ...prev, terminal: { ...prev.terminal, enabled: true, username: prev.terminal.username || suggestTerminalUsername(prev), password: prev.terminal.password || '123456', openTime: prev.terminal.openTime || new Date().toISOString().slice(0, 10) } };
      }
      return { ...prev, terminal: { ...prev.terminal, enabled: false } };
    });
  };
  /** 查看态一键开通终端（进入编辑态预填默认账号） */
  const handleEnableTerminal = () => {
    if (!selectedSupplier) return;
    setEditForm({
      ...selectedSupplier,
      stores: selectedSupplier.stores.map(st => ({ ...st })),
      terminal: { enabled: true, username: suggestTerminalUsername(selectedSupplier), password: '123456', status: 'active', openTime: new Date().toISOString().slice(0, 10) },
    });
    setEditing(true);
  };

  // OCR 模拟
  const handleOcr = () => {
    setOcrLoading(true);
    setTimeout(() => { setOcrLoading(false); }, 2000);
  };

  // 资质文件上传（最多 5 个）
  const handleAddQualificationFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || !editForm) return;
    const remaining = 5 - editForm.qualificationFiles.length;
    if (remaining <= 0) { window.alert('资质文件最多上传 5 个'); return; }
    const names = Array.from(files).map(f => f.name);
    if (names.length > remaining) window.alert(`资质文件最多上传 5 个，本次仅保留前 ${remaining} 个文件`);
    setEditForm(prev => prev ? { ...prev, qualificationFiles: [...prev.qualificationFiles, ...names.slice(0, remaining)] } : prev);
  };
  const handleRemoveQualificationFile = (idx: number) => {
    setEditForm(prev => prev ? { ...prev, qualificationFiles: prev.qualificationFiles.filter((_, i) => i !== idx) } : prev);
  };

  return (
    <>
      <ContentHeader title="供应商管理" breadcrumbs={['采购', '供应商管理']} />

      <div className="content-body">
      {/* 统计卡片 */}
      <div className="stat-cards">
        {stats.map((s, i) => <StatCard key={i} data={s} />)}
      </div>

      {/* 类型筛选卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        {TYPE_FILTER.map(tf => {
          const count = tf.key === 'all' ? list.length : list.filter(s => s.type === tf.key).length;
          const isActive = activeType === tf.key;
          return (
            <div key={tf.key} style={{ cursor: 'pointer', border: isActive ? `2px solid ${tf.color}` : '1px solid var(--color-border-primary)', background: isActive ? `${tf.color}08` : 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', boxShadow: 'var(--shadow-sm)' }} onClick={() => setActiveType(isActive ? 'all' : tf.key)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-base)', color: 'var(--color-text-primary)' }}>{tf.label}</span>
                <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: tf.color }}>{count}</span>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{tf.desc}</div>
            </div>
          );
        })}
      </div>

      {/* 工具栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        <input className="filter-input" placeholder="搜索名称、信用代码、联系人..." value={keyword} onChange={e => setKeyword(e.target.value)} style={{ width: 260 }} />
        <select className="filter-select" value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
          <option value="">全部等级</option>
          <option value="S">S级</option><option value="A">A级</option><option value="B">B级</option><option value="C">C级</option><option value="D">D级</option>
        </select>
        <Button onClick={() => setShowAddDrawer(true)}>
          <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          新增
        </Button>
        {deleteMode ? (
          <>
            <Button style={{ background: '#0F64B5', borderColor: '#0F64B5' }} onClick={() => setShowDeleteConfirm(true)} disabled={selectedForDelete.size === 0}>
              <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              删除所选({selectedForDelete.size})
            </Button>
            <Button variant="ghost" onClick={handleCancelDeleteMode}>取消</Button>
          </>
        ) : (
          <Button style={{ background: '#0F64B5', borderColor: '#0F64B5' }} onClick={handleEnterDeleteMode}>
            <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            删除
          </Button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>共 {filtered.length} 家供应商</span>
      </div>

      {/* 列表 */}
      <Card style={{ padding: 0 }}>
        <Table
          headers={[
            ...(deleteMode ? [<input key="chk" type="checkbox" checked={selectedForDelete.size === filtered.length && filtered.length > 0} onChange={e => { if (e.target.checked) setSelectedForDelete(new Set(filtered.map(s => s.id))); else setSelectedForDelete(new Set()); }} />] : []),
            '供应商名称', '类型', '渠道来源', '评价等级', '主营品类', '联系人', '联系电话', '仓库', '门店', '一件代发', '状态', '操作',
          ]}
          rows={filtered.map(s => [
            ...(deleteMode ? [<input key="chk" type="checkbox" checked={selectedForDelete.has(s.id)} onChange={() => handleToggleSelect(s.id)} />] : []),
            <span key="name" className="cell-emph">{s.name}</span>,
            <span key="type" style={{ padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: `${SUPPLIER_TYPE_COLORS[s.type]}15`, color: SUPPLIER_TYPE_COLORS[s.type], border: `1px solid ${SUPPLIER_TYPE_COLORS[s.type]}30` }}>{SUPPLIER_TYPE_LABELS[s.type]}</span>,
            <span key="src" style={{ padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: s.channelSource === 'terminal' ? '#E8F5E9' : 'var(--color-neutral-100)', color: s.channelSource === 'terminal' ? '#01795D' : 'var(--color-neutral-600)' }}>{s.channelSource === 'terminal' ? '终端注册' : '手动创建'}</span>,
            <span key="grade" style={{ fontWeight: 'var(--font-bold)', color: GRADE_COLORS[s.grade] || GRADE_COLORS['C'] }}>{s.grade}级</span>,
            <span key="cat" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{s.mainCategories.join('、')}</span>,
            <span key="cp" style={{ fontSize: 'var(--text-sm)' }}>{s.contactPerson}</span>,
            <span key="cph" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{s.contactPhone}</span>,
            <span key="wh" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{s.warehouses.length}个</span>,
            <span key="store" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{s.stores.length}个</span>,
            <span key="drop" style={{ fontSize: 'var(--text-sm)', color: s.supportDropship ? '#01795D' : 'var(--color-text-tertiary)' }}>{s.supportDropship ? '是' : '否'}</span>,
            <span key="st" style={{ padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: s.status === 'active' ? '#E8F5E9' : '#FFF3E0', color: s.status === 'active' ? '#2E7D32' : '#E65100' }}>{s.status === 'active' ? '在册' : '停用'}</span>,
            <div key="view" className="row-actions">
              <Button size="sm" variant="ghost" onClick={() => handleView(s)}>查看</Button>
              <Button size="sm" variant="ghost" onClick={() => handleView(s)}>编辑</Button>
            </div>,
          ])}
        />
      </Card>

      {/* 删除确认 */}
      {showDeleteConfirm && (
        <div className="category-dialog-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>确认删除</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>确定要删除选中的 {selectedForDelete.size} 家供应商吗？此操作不可撤销。</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>取消</Button>
              <Button style={{ background: '#0F64B5', borderColor: '#0F64B5' }} onClick={handleCancelDeleteMode}>确认删除</Button>
            </div>
          </div>
        </div>
      )}

      {/* 详情抽屉 */}
      <DetailDrawer
        open={showDetail && !!selectedSupplier}
        onClose={() => { setShowDetail(false); setEditing(false); setEditForm(null); }}
        badge={selectedSupplier?.name.charAt(0)}
        title={selectedSupplier?.name}
        statusTag={selectedSupplier && (
          <>
            <span style={{ padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: `${SUPPLIER_TYPE_COLORS[selectedSupplier.type]}15`, color: SUPPLIER_TYPE_COLORS[selectedSupplier.type], border: `1px solid ${SUPPLIER_TYPE_COLORS[selectedSupplier.type]}30` }}>{SUPPLIER_TYPE_LABELS[selectedSupplier.type]}</span>
            <span style={{ fontWeight: 'var(--font-bold)', color: GRADE_COLORS[selectedSupplier.grade] || GRADE_COLORS['C'], fontSize: 'var(--text-sm)' }}>{selectedSupplier.grade}级</span>
            <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: selectedSupplier.status === 'active' ? '#E8F5E9' : '#FFF3E0', color: selectedSupplier.status === 'active' ? '#2E7D32' : '#E65100' }}>{selectedSupplier.status === 'active' ? '在册' : '停用'}</span>
          </>
        )}
        subtitle={selectedSupplier?.introduction}
        mode={editing ? 'edit' : 'view'}
        onEdit={handleStartEdit}
        onCancelEdit={handleCancelEdit}
        onSave={handleSaveEdit}
      >
        {selectedSupplier && (
          <>
            {/* Tab 栏：分区标题标签化展示于抽屉顶部 */}
            <div className="drawer-tab-bar">
              {([
                ['basic', '基本信息'],
                ['qualification', '资质文件'],
                ['operation', '经营信息'],
                ['warehouse', '仓库信息'],
                ['store', '门店信息'],
                ['finance', '财务信息'],
                ['terminal', '终端管理'],
              ] as [DrawerTabKey, string][]).map(([key, label]) => (
                <button key={key} type="button" className={`drawer-tab${activeTab === key ? ' active' : ''}`} onClick={() => setActiveTab(key)}>
                  {label}
                  {key === 'qualification' && <span className="drawer-tab-count">{selectedSupplier.qualificationFiles.length}</span>}
                  {key === 'warehouse' && <span className="drawer-tab-count">{selectedSupplier.warehouses.length}</span>}
                  {key === 'store' && <span className="drawer-tab-count">{selectedSupplier.stores.length}</span>}
                  {key === 'terminal' && selectedSupplier.terminal.enabled && <span className="drawer-tab-count">已开通</span>}
                </button>
              ))}
            </div>
            <div className="drawer-tab-contents">
            {editing && editForm ? (
              <>
            {activeTab === 'basic' && (
              <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
                {([
                  ['统一社会信用代码', 'unifiedCreditCode', 'text'],
                  ['公司类型', 'companyType', 'text'],
                  ['法定代表人', 'legalRepresentative', 'text'],
                  ['成立日期', 'establishmentDate', 'text'],
                  ['注册资本', 'registeredCapital', 'text'],
                  ['注册地址', 'registeredAddress', 'text'],
                  ['经营范围', 'businessScope', 'textarea'],
                  ['联系人', 'contactPerson', 'text'],
                  ['联系人职务', 'contactPosition', 'text'],
                  ['联系电话', 'contactPhone', 'text'],
                  ['联系邮箱', 'contactEmail', 'text'],
                  ['联系地址', 'contactAddress', 'text'],
                  ['合作时间', 'cooperationDate', 'text'],
                  ['主营品类', 'mainCategories', 'text'],
                  ['资质状态', 'qualificationStatus', 'text'],
                ] as [string, string, string][]).map(([label, field, type]) => {
                  if (field === 'registeredAddress' || field === 'contactAddress') {
                    const prefix = field === 'registeredAddress' ? 'registered' : 'contact';
                    const provField = `${prefix}Province`;
                    const cityField = `${prefix}City`;
                    const distField = `${prefix}District`;
                    const supAny = selectedSupplier as unknown as Record<string, string | undefined>;
                    const formAny = editForm as unknown as Record<string, string | undefined> | null;
                    const regionText = [supAny[provField], supAny[cityField], supAny[distField]].filter(Boolean).join(' / ');
                    const detailAddr = supAny[field] ?? '';
                    return (
                      <div key={field} style={{ gridColumn: '1 / -1' }}>
                        <label className="drawer-label">{label}</label>
                        {editing && formAny ? (
                          <>
                            <div className="drawer-form-row" style={{ marginBottom: 'var(--space-2)' }}>
                              <div className="drawer-form-field">
                                <select className="filter-select" style={{ width: '100%' }} value={formAny[provField] ?? ''} onChange={e => setEditForm(prev => prev ? { ...prev, [provField]: e.target.value, [cityField]: '', [distField]: '' } : prev)}>
                                  <option value="">请选择省份</option>
                                  {PROVINCE_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                              </div>
                              <div className="drawer-form-field">
                                <select className="filter-select" style={{ width: '100%' }} value={formAny[cityField] ?? ''} disabled={!formAny[provField]} onChange={e => setEditForm(prev => prev ? { ...prev, [cityField]: e.target.value, [distField]: '' } : prev)}>
                                  <option value="">请选择城市</option>
                                  {formAny[provField] && getCityNames(formAny[provField]).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                              <div className="drawer-form-field">
                                <select className="filter-select" style={{ width: '100%' }} value={formAny[distField] ?? ''} disabled={!formAny[cityField]} onChange={e => setEditForm(prev => prev ? { ...prev, [distField]: e.target.value } : prev)}>
                                  <option value="">请选择区县</option>
                                  {formAny[provField] && formAny[cityField] && getDistricts(formAny[provField], formAny[cityField]).map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                              </div>
                            </div>
                            <input className="filter-input" style={{ width: '100%' }} placeholder="请输入详细地址" value={formAny[field] ?? ''} onChange={e => setEditForm(prev => prev ? { ...prev, [field]: e.target.value } : prev)} />
                          </>
                        ) : (
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 'var(--font-medium)' }}>{[regionText, detailAddr].filter(Boolean).join(' ') || '—'}</div>
                        )}
                      </div>
                    );
                  }
                  const value = (selectedSupplier as unknown as Record<string, unknown>)[field];
                  const displayValue = Array.isArray(value) ? value.join('、') : String(value ?? '—');
                  return (
                    <div key={field} style={{ gridColumn: type === 'textarea' ? '1 / -1' : undefined }}>
                      <label className="drawer-label">{label}</label>
                      {editing && type !== 'textarea' ? (
                        <input className="filter-input" style={{ width: '100%' }} value={String((editForm as unknown as Record<string, unknown>)?.[field] ?? '')} onChange={e => setEditForm(prev => prev ? { ...prev, [field]: e.target.value } : prev)} />
                      ) : editing && type === 'textarea' ? (
                        <textarea className="filter-input" style={{ width: '100%', minHeight: 60, resize: 'vertical' }} value={String((editForm as unknown as Record<string, unknown>)?.[field] ?? '')} onChange={e => setEditForm(prev => prev ? { ...prev, [field]: e.target.value } : prev)} />
                      ) : (
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 'var(--font-medium)' }}>{displayValue}</div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* 渠道来源（编辑态只读：由创建方式决定） */}
              <div style={{ marginTop: 'var(--space-3)' }}>
                <label className="drawer-label">渠道来源</label>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  <span style={{ padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: (editForm?.channelSource ?? 'manual') === 'terminal' ? '#E8F5E9' : 'var(--color-neutral-100)', color: (editForm?.channelSource ?? 'manual') === 'terminal' ? '#01795D' : 'var(--color-neutral-600)' }}>
                    {(editForm?.channelSource ?? 'manual') === 'terminal' ? '终端注册' : '手动创建'}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>由创建方式决定，不可修改</span>
                </div>
              </div>
              </div>
            )}

            {activeTab === 'qualification' && (
              <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                {(editForm?.qualificationFiles ?? []).map((f, i) => (
                  <div key={`${f}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14, color: 'var(--color-module-current-base)', flexShrink: 0 }}><path d="M4 1.5h5.5L13 5v9.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-12a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M9.5 1.5V5H13" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', flex: 1 }}>{f}</span>
                    <Button size="sm" variant="ghost" style={{ color: 'var(--color-semantic-error)' }} onClick={() => handleRemoveQualificationFile(i)}>删除</Button>
                  </div>
                ))}
              </div>
              {(editForm?.qualificationFiles.length ?? 0) < 5 ? (
                <label style={{ display: 'block', border: '2px dashed var(--color-border-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-primary)', marginBottom: 4 }}>点击上传资质文件</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>支持营业执照、生产许可证等，最多 5 个，还可上传 {5 - (editForm?.qualificationFiles.length ?? 0)} 个</div>
                  <input type="file" multiple style={{ display: 'none' }} onChange={e => { handleAddQualificationFiles(e.target.files); e.target.value = ''; }} />
                </label>
              ) : (
                <div style={{ border: '2px dashed var(--color-border-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>
                  已达上限（5/5），如需更换请先删除已有文件
                </div>
              )}
              </div>
            )}

            {activeTab === 'operation' && (
              <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
                {([
                  ['结算方式', 'settlementMethod', 'select', Object.entries(SETTLEMENT_METHOD_LABELS)],
                  ['付款条件', 'paymentTerms', 'text'],
                  ['交货周期', 'deliveryCycle', 'text'],
                  ['最低起订额', 'minOrderAmount', 'text'],
                  ['退货政策', 'returnPolicy', 'text'],
                  ['质量保证', 'qualityGuarantee', 'text'],
                  ['快递费结算', 'shippingSettlement', 'select', Object.entries(SHIPPING_SETTLEMENT_LABELS)],
                  ['运费', 'shippingFee', 'text'],
                  ['运费备注', 'shippingRemark', 'text'],
                  ['一件代发', 'supportDropship', 'text'],
                  ['税务类型', 'taxType', 'select', Object.entries(TAX_TYPE_LABELS)],
                  ['备注', 'remark', 'textarea'],
                ] as [string, string, string, [string, string][]?][]).map(([label, field, type, options]) => {
                  const rawValue = (selectedSupplier as unknown as Record<string, unknown>)[field];
                  let displayValue = '—';
                  if (field === 'minOrderAmount') displayValue = `¥${Number(rawValue).toLocaleString()}`;
                  else if (field === 'supportDropship') displayValue = rawValue ? '支持' : '不支持';
                  else if (type === 'select' && options) displayValue = options.find(([k]) => k === String(rawValue))?.[1] ?? String(rawValue);
                  else displayValue = String(rawValue ?? '—');
                  return (
                    <div key={field} style={{ gridColumn: type === 'textarea' ? '1 / -1' : undefined }}>
                      <label className="drawer-label">{label}</label>
                      {editing && type === 'select' && options ? (
                        <select className="filter-select" style={{ width: '100%' }} value={String((editForm as unknown as Record<string, unknown>)?.[field] ?? '')} onChange={e => setEditForm(prev => prev ? { ...prev, [field]: e.target.value } : prev)}>
                          {options.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      ) : editing && type === 'textarea' ? (
                        <textarea className="filter-input" style={{ width: '100%', minHeight: 60, resize: 'vertical' }} value={String((editForm as unknown as Record<string, unknown>)?.[field] ?? '')} onChange={e => setEditForm(prev => prev ? { ...prev, [field]: e.target.value } : prev)} />
                      ) : editing ? (
                        <input className="filter-input" style={{ width: '100%' }} value={String((editForm as unknown as Record<string, unknown>)?.[field] ?? '')} onChange={e => setEditForm(prev => prev ? { ...prev, [field]: e.target.value } : prev)} />
                      ) : (
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 'var(--font-medium)' }}>{displayValue}</div>
                      )}
                    </div>
                  );
                })}
              </div>
              </div>
            )}

            {activeTab === 'warehouse' && (
              <div>
              <div>
                {editing && editForm ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {editForm.warehouses.map((wh, i) => (
                        <div key={wh.id} style={{ padding: 'var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                            <div style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', background: 'var(--color-module-current-lightest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)', flexShrink: 0 }}>{i + 1}</div>
                            <input className="filter-input" placeholder="仓库名称" style={{ flex: 1, height: 30, fontSize: 'var(--text-sm)' }} value={wh.name} onChange={e => updateWarehouse(i, { name: e.target.value })} />
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', cursor: 'pointer', flexShrink: 0 }}>
                              <input type="radio" name="default-wh" checked={wh.isDefault} onChange={() => setDefaultWarehouse(i)} /> 默认
                            </label>
                            <Button size="sm" variant="ghost" style={{ color: 'var(--color-semantic-error)', flexShrink: 0 }} onClick={() => removeWarehouse(i)}>删除</Button>
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                            <select className="filter-select" style={{ flex: 1, height: 30, fontSize: 'var(--text-sm)' }} value={wh.province ?? ''} onChange={e => updateWarehouse(i, { province: e.target.value, city: '', district: '' })}>
                              <option value="">省份</option>
                              {PROVINCE_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <select className="filter-select" style={{ flex: 1, height: 30, fontSize: 'var(--text-sm)' }} value={wh.city ?? ''} disabled={!wh.province} onChange={e => updateWarehouse(i, { city: e.target.value, district: '' })}>
                              <option value="">城市</option>
                              {wh.province && getCityNames(wh.province).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select className="filter-select" style={{ flex: 1, height: 30, fontSize: 'var(--text-sm)' }} value={wh.district ?? ''} disabled={!wh.city} onChange={e => updateWarehouse(i, { district: e.target.value })}>
                              <option value="">区县</option>
                              {wh.province && wh.city && getDistricts(wh.province, wh.city).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <input className="filter-input" placeholder="详细地址" style={{ flex: 2, height: 30, fontSize: 'var(--text-sm)' }} value={wh.address} onChange={e => updateWarehouse(i, { address: e.target.value })} />
                            <input className="filter-input" placeholder="联系人" style={{ flex: 1, height: 30, fontSize: 'var(--text-sm)' }} value={wh.contactPerson} onChange={e => updateWarehouse(i, { contactPerson: e.target.value })} />
                            <input className="filter-input" placeholder="电话" style={{ flex: 1, height: 30, fontSize: 'var(--text-sm)' }} value={wh.contactPhone} onChange={e => updateWarehouse(i, { contactPhone: e.target.value })} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" variant="ghost" style={{ marginTop: 'var(--space-2)' }} onClick={addWarehouse}>+ 添加仓库</Button>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-2)' }}>供应商仓库将同步至「仓储 &gt; 仓库设置」，作为合作仓库管理</div>
                  </>
                ) : (
                  <p style={{ color: 'var(--color-text-tertiary)' }}>—</p>
                )}
              </div>
              </div>
            )}

            {activeTab === 'store' && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {editForm.stores.map((st, i) => (
                    <div key={st.id} style={{ padding: 'var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                        <div style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', background: 'var(--color-module-current-lightest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)', flexShrink: 0 }}>{i + 1}</div>
                        <input className="filter-input" placeholder="门店名称" style={{ flex: 2, height: 30, fontSize: 'var(--text-sm)' }} value={st.name} onChange={e => updateStore(i, { name: e.target.value })} />
                        <select className="filter-select" style={{ width: 96, height: 30, fontSize: 'var(--text-sm)' }} value={st.status} onChange={e => updateStore(i, { status: e.target.value as SupplierStore['status'] })}>
                          <option value="active">营业中</option>
                          <option value="inactive">已停业</option>
                        </select>
                        <Button size="sm" variant="ghost" style={{ color: 'var(--color-semantic-error)', flexShrink: 0 }} onClick={() => removeStore(i)}>删除</Button>
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                        <select className="filter-select" style={{ flex: 1, height: 30, fontSize: 'var(--text-sm)' }} value={st.province ?? ''} onChange={e => updateStore(i, { province: e.target.value, city: '', district: '' })}>
                          <option value="">省份</option>
                          {PROVINCE_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <select className="filter-select" style={{ flex: 1, height: 30, fontSize: 'var(--text-sm)' }} value={st.city ?? ''} disabled={!st.province} onChange={e => updateStore(i, { city: e.target.value, district: '' })}>
                          <option value="">城市</option>
                          {st.province && getCityNames(st.province).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select className="filter-select" style={{ flex: 1, height: 30, fontSize: 'var(--text-sm)' }} value={st.district ?? ''} disabled={!st.city} onChange={e => updateStore(i, { district: e.target.value })}>
                          <option value="">区县</option>
                          {st.province && st.city && getDistricts(st.province, st.city).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                        <input className="filter-input" placeholder="详细地址" style={{ flex: 2, height: 30, fontSize: 'var(--text-sm)' }} value={st.address} onChange={e => updateStore(i, { address: e.target.value })} />
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input className="filter-input" placeholder="面积" type="number" style={{ flex: 1, height: 30, fontSize: 'var(--text-sm)' }} value={st.area || ''} onChange={e => updateStore(i, { area: Number(e.target.value) || 0 })} />
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', flexShrink: 0 }}>㎡</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <input className="filter-input" placeholder="主营品牌（多个用「、」分隔）" style={{ flex: 2, height: 30, fontSize: 'var(--text-sm)' }} value={brandDrafts[i] ?? st.mainBrands.join('、')} onChange={e => { setBrandDrafts(prev => ({ ...prev, [i]: e.target.value })); updateStore(i, { mainBrands: e.target.value.split(/[，,、]/).map(v => v.trim()).filter(Boolean) }); }} onBlur={() => setBrandDrafts(prev => { const next = { ...prev }; delete next[i]; return next; })} />
                        <input className="filter-input" placeholder="负责人" style={{ flex: 1, height: 30, fontSize: 'var(--text-sm)' }} value={st.manager ?? ''} onChange={e => updateStore(i, { manager: e.target.value })} />
                        <input className="filter-input" placeholder="联系电话" style={{ flex: 1, height: 30, fontSize: 'var(--text-sm)' }} value={st.phone ?? ''} onChange={e => updateStore(i, { phone: e.target.value })} />
                      </div>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="ghost" style={{ marginTop: 'var(--space-2)' }} onClick={addStore}>+ 新增门店</Button>
              </div>
            )}

            {activeTab === 'finance' && (
              <div>
              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>开票信息</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  {([
                    ['抬头', 'invoiceInfo.title'],
                    ['税号', 'invoiceInfo.taxNo'],
                    ['税率', 'invoiceInfo.taxRate'],
                    ['开票地址', 'invoiceInfo.address'],
                    ['开票电话', 'invoiceInfo.phone'],
                    ['开户银行', 'invoiceInfo.bankName'],
                    ['银行账号', 'invoiceInfo.bankAccount'],
                  ] as [string, string][]).map(([label, path]) => {
                    const val = path.split('.').reduce((obj: unknown, key) => (obj as Record<string, unknown>)?.[key], selectedSupplier);
                    const displayValue = path.includes('taxRate') ? `${val}%` : String(val ?? '—');
                    return (
                      <div key={path}>
                        <label className="drawer-label">{label}</label>
                        {editing ? (
                          <input className="filter-input" style={{ width: '100%' }} value={String(path.split('.').reduce((obj: unknown, key) => (obj as Record<string, unknown>)?.[key], editForm) ?? '')} onChange={e => {
                            const keys = path.split('.');
                            setEditForm(prev => {
                              if (!prev) return prev;
                              const updated = { ...prev };
                              let target: Record<string, unknown> = updated as Record<string, unknown>;
                              for (let i = 0; i < keys.length - 1; i++) {
                                target[keys[i]] = { ...(target[keys[i]] as Record<string, unknown>) };
                                target = target[keys[i]] as Record<string, unknown>;
                              }
                              target[keys[keys.length - 1]] = e.target.value;
                              return updated;
                            });
                          }} />
                        ) : (
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 'var(--font-medium)' }}>{displayValue}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>结算银行账号</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
                  {([
                    ['户名', 'bankAccount.accountName'],
                    ['账号', 'bankAccount.accountNo'],
                    ['开户行', 'bankAccount.bankName'],
                    ['行号', 'bankAccount.bankNo'],
                    ['结算备注', 'bankAccount.remark'],
                  ] as [string, string][]).map(([label, path]) => {
                    const val = path.split('.').reduce((obj: unknown, key) => (obj as Record<string, unknown>)?.[key], selectedSupplier);
                    return (
                      <div key={path} style={{ gridColumn: path === 'bankAccount.remark' ? '1 / -1' : undefined }}>
                        <label className="drawer-label">{label}</label>
                        {editing ? (
                          <input className="filter-input" style={{ width: '100%' }} value={String(path.split('.').reduce((obj: unknown, key) => (obj as Record<string, unknown>)?.[key], editForm) ?? '')} onChange={e => {
                            const keys = path.split('.');
                            setEditForm(prev => {
                              if (!prev) return prev;
                              const updated = { ...prev };
                              let target: Record<string, unknown> = updated as Record<string, unknown>;
                              for (let i = 0; i < keys.length - 1; i++) {
                                target[keys[i]] = { ...(target[keys[i]] as Record<string, unknown>) };
                                target = target[keys[i]] as Record<string, unknown>;
                              }
                              target[keys[keys.length - 1]] = e.target.value;
                              return updated;
                            });
                          }} />
                        ) : (
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 'var(--font-medium)' }}>{String(val ?? '—')}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              </div>
            )}

            {activeTab === 'terminal' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <label className="drawer-label">终端开通状态</label>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', height: 34 }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        <input type="radio" checked={editForm.terminal.enabled} onChange={() => handleTerminalEnable(true)} /> 已开通
                      </label>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        <input type="radio" checked={!editForm.terminal.enabled} onChange={() => handleTerminalEnable(false)} /> 未开通
                      </label>
                    </div>
                  </div>
                  {editForm.terminal.enabled && (
                    <>
                      <div>
                        <label className="drawer-label">账号状态</label>
                        <select className="filter-select" style={{ width: '100%' }} value={editForm.terminal.status} onChange={e => updateTerminal({ status: e.target.value as SupplierTerminal['status'] })}>
                          <option value="active">启用</option>
                          <option value="inactive">停用</option>
                        </select>
                      </div>
                      <div>
                        <label className="drawer-label">终端登录账号</label>
                        <input className="filter-input" style={{ width: '100%' }} value={editForm.terminal.username} onChange={e => updateTerminal({ username: e.target.value })} />
                      </div>
                      <div>
                        <label className="drawer-label">初始密码</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', height: 34 }}>
                          <span className="mono" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{editForm.terminal.password || '—'}</span>
                          <Button size="sm" variant="ghost" onClick={() => updateTerminal({ password: '123456' })}>重置密码</Button>
                        </div>
                      </div>
                      <div>
                        <label className="drawer-label">开通时间</label>
                        <input className="filter-input" style={{ width: '100%' }} value={editForm.terminal.openTime ?? ''} onChange={e => updateTerminal({ openTime: e.target.value })} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="drawer-label">备注</label>
                        <input className="filter-input" style={{ width: '100%' }} value={editForm.terminal.remark ?? ''} onChange={e => updateTerminal({ remark: e.target.value })} />
                      </div>
                    </>
                  )}
                </div>
                {editForm.terminal.enabled ? (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', lineHeight: 1.7 }}>供应商可凭该账号登录供应商终端，进行商品维护、订单接收等操作；密码遗忘可随时重置。</div>
                ) : (
                  <div style={{ fontSize: 'var(--text-xs)', color: '#E65100', background: '#FFF3E0', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)' }}>保存后该供应商的终端将被关闭，终端账号将无法登录</div>
                )}
              </div>
            )}
              </>
            ) : (
              <>
            {activeTab === 'basic' && (
              <div>
              <InfoGrid cols={3}>
                <InfoItem label="统一社会信用代码" mono>{selectedSupplier.unifiedCreditCode || '—'}</InfoItem>
                <InfoItem label="公司类型">{selectedSupplier.companyType || '—'}</InfoItem>
                <InfoItem label="法定代表人">{selectedSupplier.legalRepresentative || '—'}</InfoItem>
                <InfoItem label="成立日期">{selectedSupplier.establishmentDate || '—'}</InfoItem>
                <InfoItem label="注册资本">{selectedSupplier.registeredCapital || '—'}</InfoItem>
                <InfoItem label="合作时间">{selectedSupplier.cooperationDate || '—'}</InfoItem>
                <InfoItem label="联系人">{selectedSupplier.contactPerson || '—'}</InfoItem>
                <InfoItem label="联系人职务">{selectedSupplier.contactPosition || '—'}</InfoItem>
                <InfoItem label="联系电话">{selectedSupplier.contactPhone || '—'}</InfoItem>
                <InfoItem label="联系邮箱">{selectedSupplier.contactEmail || '—'}</InfoItem>
                <InfoItem label="主营品类">{selectedSupplier.mainCategories.join('、') || '—'}</InfoItem>
                <InfoItem label="资质状态">{String(selectedSupplier.qualificationStatus ?? '—')}</InfoItem>
                <InfoItem label="渠道来源">
                  <span style={{ padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: selectedSupplier.channelSource === 'terminal' ? '#E8F5E9' : 'var(--color-neutral-100)', color: selectedSupplier.channelSource === 'terminal' ? '#01795D' : 'var(--color-neutral-600)' }}>
                    {selectedSupplier.channelSource === 'terminal' ? '终端注册' : '手动创建'}
                  </span>
                </InfoItem>
                <InfoItem label="注册地址" span={3}>{[[selectedSupplier.registeredProvince, selectedSupplier.registeredCity, selectedSupplier.registeredDistrict].filter(Boolean).join(' / '), selectedSupplier.registeredAddress].filter(Boolean).join(' ') || '—'}</InfoItem>
                <InfoItem label="联系地址" span={3}>{[[selectedSupplier.contactProvince, selectedSupplier.contactCity, selectedSupplier.contactDistrict].filter(Boolean).join(' / '), selectedSupplier.contactAddress].filter(Boolean).join(' ') || '—'}</InfoItem>
                <InfoItem label="经营范围" span={3}>{selectedSupplier.businessScope || '—'}</InfoItem>
              </InfoGrid>
              </div>
            )}

            {activeTab === 'qualification' && (
              <div>
              {selectedSupplier.qualificationFiles.length === 0 ? (
                <p style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 'var(--space-4)' }}>暂无资质文件</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {selectedSupplier.qualificationFiles.map((f, i) => (
                    <div key={`${f}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14, color: 'var(--color-module-current-base)', flexShrink: 0 }}><path d="M4 1.5h5.5L13 5v9.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-12a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M9.5 1.5V5H13" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              )}
              </div>
            )}

            {activeTab === 'operation' && (
              <div>
              <InfoGrid cols={3}>
                <InfoItem label="结算方式">{SETTLEMENT_METHOD_LABELS[selectedSupplier.settlementMethod] ?? '—'}</InfoItem>
                <InfoItem label="付款条件">{selectedSupplier.paymentTerms || '—'}</InfoItem>
                <InfoItem label="交货周期">{selectedSupplier.deliveryCycle || '—'}</InfoItem>
                <InfoItem label="最低起订额" mono>{`¥${Number(selectedSupplier.minOrderAmount).toLocaleString()}`}</InfoItem>
                <InfoItem label="退货政策">{selectedSupplier.returnPolicy || '—'}</InfoItem>
                <InfoItem label="质量保证">{selectedSupplier.qualityGuarantee || '—'}</InfoItem>
                <InfoItem label="快递费结算">{SHIPPING_SETTLEMENT_LABELS[selectedSupplier.shippingSettlement] ?? '—'}</InfoItem>
                <InfoItem label="运费" mono>{selectedSupplier.shippingFee != null ? String(selectedSupplier.shippingFee) : '—'}</InfoItem>
                <InfoItem label="运费备注">{selectedSupplier.shippingRemark || '—'}</InfoItem>
                <InfoItem label="一件代发">{selectedSupplier.supportDropship ? '支持' : '不支持'}</InfoItem>
                <InfoItem label="税务类型">{TAX_TYPE_LABELS[selectedSupplier.taxType] ?? '—'}</InfoItem>
                <InfoItem label="备注" span={3}>{selectedSupplier.remark || '—'}</InfoItem>
              </InfoGrid>
              </div>
            )}

            {activeTab === 'warehouse' && (
              <div>
              {selectedSupplier.warehouses.length === 0 ? (
                <p style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 'var(--space-6)' }}>暂无仓库信息</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {selectedSupplier.warehouses.map((wh, i) => (
                    <div key={wh.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-module-current-lightest)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)' }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2 }}>
                          <span style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>{wh.name}</span>
                          {wh.isDefault && <span style={{ padding: '0 6px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', background: '#E8F5E9', color: '#2E7D32' }}>默认</span>}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{[wh.province, wh.city, wh.district].filter(Boolean).join(' / ')} {wh.address} | {wh.contactPerson} {wh.contactPhone}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 4 }}>供应商仓库已同步至「仓储 &gt; 仓库设置」，作为合作仓库管理</div>
                </div>
              )}
              </div>
            )}

            {activeTab === 'store' && (
              selectedSupplier.stores.length === 0 ? (
                <p style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 'var(--space-6)' }}>暂无门店信息，点击「编辑」可新增门店</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {selectedSupplier.stores.map((st, i) => (
                    <div key={st.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-module-current-lightest)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)' }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>{st.name || '（未命名门店）'}</span>
                          <span style={{ padding: '0 6px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: st.status === 'active' ? '#E8F5E9' : '#FFF3E0', color: st.status === 'active' ? '#2E7D32' : '#E65100' }}>{st.status === 'active' ? '营业中' : '已停业'}</span>
                          <span className="mono" style={{ padding: '0 6px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: 'var(--color-module-current-lightest)', color: 'var(--color-module-current-base)' }}>{st.area}㎡</span>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>
                          {[st.province, st.city, st.district].filter(Boolean).join(' / ')} {st.address}{(st.manager || st.phone) ? ` | ${st.manager ?? ''} ${st.phone ?? ''}` : ''}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>主营品牌</span>
                          {(st.mainBrands.length ? st.mainBrands : ['—']).map(b => (
                            <span key={b} style={{ padding: '0 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-secondary)' }}>{b}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'finance' && (
              <div>
              <InfoGrid cols={3}>
                <InfoItem label="开票抬头">{selectedSupplier.invoiceInfo.title || '—'}</InfoItem>
                <InfoItem label="税号" mono>{selectedSupplier.invoiceInfo.taxNo || '—'}</InfoItem>
                <InfoItem label="税率" mono>{selectedSupplier.invoiceInfo.taxRate != null ? `${selectedSupplier.invoiceInfo.taxRate}%` : '—'}</InfoItem>
                <InfoItem label="开票地址">{selectedSupplier.invoiceInfo.address || '—'}</InfoItem>
                <InfoItem label="开票电话">{selectedSupplier.invoiceInfo.phone || '—'}</InfoItem>
                <InfoItem label="开户银行">{selectedSupplier.invoiceInfo.bankName || '—'}</InfoItem>
                <InfoItem label="银行账号" mono>{selectedSupplier.invoiceInfo.bankAccount || '—'}</InfoItem>
                <InfoItem label="户名">{selectedSupplier.bankAccount.accountName || '—'}</InfoItem>
                <InfoItem label="账号" mono>{selectedSupplier.bankAccount.accountNo || '—'}</InfoItem>
                <InfoItem label="开户行">{selectedSupplier.bankAccount.bankName || '—'}</InfoItem>
                <InfoItem label="行号" mono>{selectedSupplier.bankAccount.bankNo || '—'}</InfoItem>
                <InfoItem label="结算备注" span={3}>{selectedSupplier.bankAccount.remark || '—'}</InfoItem>
              </InfoGrid>
              </div>
            )}

            {activeTab === 'terminal' && (
              selectedSupplier.terminal.enabled ? (
                <div>
                  <InfoGrid cols={3}>
                    <InfoItem label="终端状态"><span style={{ padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: '#E8F5E9', color: '#2E7D32' }}>已开通</span></InfoItem>
                    <InfoItem label="登录账号" mono emph>{selectedSupplier.terminal.username || '—'}</InfoItem>
                    <InfoItem label="账号状态"><span style={{ padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: selectedSupplier.terminal.status === 'active' ? '#E3F2FD' : '#FFF3E0', color: selectedSupplier.terminal.status === 'active' ? '#1565C0' : '#E65100' }}>{selectedSupplier.terminal.status === 'active' ? '启用' : '停用'}</span></InfoItem>
                    <InfoItem label="开通时间">{selectedSupplier.terminal.openTime ?? '—'}</InfoItem>
                    <InfoItem label="最近登录">{selectedSupplier.terminal.lastLogin ?? '—'}</InfoItem>
                    <InfoItem label="备注">{selectedSupplier.terminal.remark || '—'}</InfoItem>
                  </InfoGrid>
                  <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', lineHeight: 1.7 }}>供应商可凭该账号登录供应商终端，进行商品维护、订单接收等操作。如需调整账号或停用终端，点击「编辑」。</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', border: '2px dashed var(--color-border-primary)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ width: 48, height: 48, margin: '0 auto var(--space-3)', borderRadius: 'var(--radius-lg)', background: 'var(--color-module-current-lightest)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-module-current-base)' }}>
                    <svg viewBox="0 0 24 24" fill="none" style={{ width: 24, height: 24 }}><rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>该供应商尚未开通终端</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>开通后供应商可凭账号登录供应商终端，<br />在线维护商品、接收订单、查看对账等</div>
                  <Button onClick={handleEnableTerminal}>开通终端</Button>
                </div>
              )
            )}
              </>
            )}
            </div>
          </>
        )}
      </DetailDrawer>

      {/* 新增供应商抽屉 */}
      {showAddDrawer && (
        <div className="drawer-overlay" onClick={() => setShowAddDrawer(false)}>
          <div className="drawer-panel" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-title">新增供应商</span>
              <button className="drawer-close" onClick={() => setShowAddDrawer(false)}>
                <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="drawer-body">

            {/* 营业执照OCR */}
            <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>营业执照识别</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ flex: 1, border: '2px dashed var(--color-border-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                  点击上传营业执照图片
                </div>
                <Button onClick={handleOcr} disabled={ocrLoading}>
                  {ocrLoading ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid var(--color-neutral-300)', borderTopColor: 'var(--color-module-current-base)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      识别中...
                    </span>
                  ) : '自动识别'}
                </Button>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>上传营业执照图片，自动识别统一社会信用代码、公司名称、法定代表人等信息</div>
            </div>

            {/* 基本信息 */}
            <div className="drawer-section-title">基本信息</div>
            <div className="drawer-form-row">
              <div className="drawer-form-field">
                <label className="drawer-label">供应商类型 *</label>
                <select className="filter-select" style={{ width: '100%' }}>
                  <option value="">请选择</option>
                  <option value="brand">品牌方</option>
                  <option value="partner">合作方</option>
                </select>
              </div>
              <div className="drawer-form-field">
                <label className="drawer-label">名称 *</label>
                <input className="filter-input" placeholder="请输入供应商名称" style={{ width: '100%' }} />
              </div>
              <div className="drawer-form-field">
                <label className="drawer-label">统一社会信用代码 *</label>
                <input className="filter-input" placeholder="请输入18位信用代码" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="drawer-form-row">
              <div className="drawer-form-field">
                <label className="drawer-label">公司类型</label>
                <input className="filter-input" placeholder="如：有限责任公司" style={{ width: '100%' }} />
              </div>
              <div className="drawer-form-field">
                <label className="drawer-label">法定代表人</label>
                <input className="filter-input" placeholder="请输入" style={{ width: '100%' }} />
              </div>
              <div className="drawer-form-field">
                <label className="drawer-label">成立日期</label>
                <input className="filter-input" placeholder="YYYY-MM-DD" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="drawer-form-row">
              <div className="drawer-form-field">
                <label className="drawer-label">注册资本</label>
                <input className="filter-input" placeholder="如：500万元" style={{ width: '100%' }} />
              </div>
              <div className="drawer-form-field" style={{ flex: 2 }}>
                <label className="drawer-label">注册地址</label>
                <input className="filter-input" placeholder="请输入注册地址" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="drawer-form-row">
              <div className="drawer-form-field">
                <label className="drawer-label">经营范围</label>
                <textarea className="filter-input" placeholder="请输入经营范围" style={{ width: '100%', minHeight: 60, resize: 'vertical' }} />
              </div>
            </div>

            {/* 联系信息 */}
            <div className="drawer-section-title">联系信息</div>
            <div className="drawer-form-row">
              <div className="drawer-form-field"><label className="drawer-label">联系人 *</label><input className="filter-input" placeholder="请输入" style={{ width: '100%' }} /></div>
              <div className="drawer-form-field"><label className="drawer-label">联系人职务</label><input className="filter-input" placeholder="请输入" style={{ width: '100%' }} /></div>
              <div className="drawer-form-field"><label className="drawer-label">联系电话 *</label><input className="filter-input" placeholder="请输入" style={{ width: '100%' }} /></div>
            </div>
            <div className="drawer-form-row">
              <div className="drawer-form-field"><label className="drawer-label">联系邮箱</label><input className="filter-input" placeholder="请输入" style={{ width: '100%' }} /></div>
              <div className="drawer-form-field" style={{ flex: 2 }}><label className="drawer-label">联系地址</label><input className="filter-input" placeholder="请输入" style={{ width: '100%' }} /></div>
            </div>

            {/* 合作信息 */}
            <div className="drawer-section-title">合作信息</div>
            <div className="drawer-form-row">
              <div className="drawer-form-field"><label className="drawer-label">合作时间</label><input className="filter-input" placeholder="YYYY-MM-DD" style={{ width: '100%' }} /></div>
              <div className="drawer-form-field"><label className="drawer-label">评价等级</label><select className="filter-select" style={{ width: '100%' }}><option value="">请选择</option><option value="S">S级</option><option value="A">A级</option><option value="B">B级</option><option value="C">C级</option><option value="D">D级</option></select></div>
              <div className="drawer-form-field"><label className="drawer-label">主营品类</label><input className="filter-input" placeholder="如：绿茶、红茶" style={{ width: '100%' }} /></div>
            </div>
            <div className="drawer-form-row">
              <div className="drawer-form-field"><label className="drawer-label">结算方式</label><select className="filter-select" style={{ width: '100%' }}><option value="">请选择</option><option value="period">周期结</option><option value="prepaid">先款结</option><option value="invoice">见票结</option><option value="monthly">月结</option><option value="quarterly">季结</option></select></div>
              <div className="drawer-form-field"><label className="drawer-label">付款条件</label><input className="filter-input" placeholder="如：月结30天" style={{ width: '100%' }} /></div>
              <div className="drawer-form-field"><label className="drawer-label">交货周期</label><input className="filter-input" placeholder="如：3-5个工作日" style={{ width: '100%' }} /></div>
            </div>
            <div className="drawer-form-row">
              <div className="drawer-form-field"><label className="drawer-label">最低起订额(元)</label><input className="filter-input" placeholder="请输入" style={{ width: '100%' }} type="number" /></div>
              <div className="drawer-form-field"><label className="drawer-label">一件代发</label><select className="filter-select" style={{ width: '100%' }}><option value="no">否</option><option value="yes">是</option></select></div>
              <div className="drawer-form-field"><label className="drawer-label">快递费结算</label><select className="filter-select" style={{ width: '100%' }}><option value="free">包邮</option><option value="not_free_fixed">不包邮(固定运费)</option><option value="not_free_ratio">不包邮(按比例)</option><option value="not_free_bear">不包邮(到付)</option></select></div>
            </div>
            <div className="drawer-form-row">
              <div className="drawer-form-field"><label className="drawer-label">退货政策</label><input className="filter-input" placeholder="如：质量问题7天内可退换" style={{ width: '100%' }} /></div>
              <div className="drawer-form-field"><label className="drawer-label">质量保证</label><input className="filter-input" placeholder="如：符合GB/T标准" style={{ width: '100%' }} /></div>
            </div>

            {/* 税务与开票 */}
            <div className="drawer-section-title">税务与开票</div>
            <div className="drawer-form-row">
              <div className="drawer-form-field"><label className="drawer-label">税务类型</label><select className="filter-select" style={{ width: '100%' }}><option value="small">小规模</option><option value="general">一般纳税人</option></select></div>
              <div className="drawer-form-field"><label className="drawer-label">开票抬头</label><input className="filter-input" placeholder="请输入" style={{ width: '100%' }} /></div>
              <div className="drawer-form-field"><label className="drawer-label">税号</label><input className="filter-input" placeholder="请输入" style={{ width: '100%' }} /></div>
            </div>
            <div className="drawer-form-row">
              <div className="drawer-form-field"><label className="drawer-label">税率(%)</label><input className="filter-input" placeholder="如：13" style={{ width: '100%' }} type="number" /></div>
            </div>

            {/* 结算银行账号 */}
            <div className="drawer-section-title">结算银行账号</div>
            <div className="drawer-form-row">
              <div className="drawer-form-field"><label className="drawer-label">户名</label><input className="filter-input" placeholder="请输入" style={{ width: '100%' }} /></div>
              <div className="drawer-form-field"><label className="drawer-label">账号</label><input className="filter-input" placeholder="请输入" style={{ width: '100%' }} /></div>
              <div className="drawer-form-field"><label className="drawer-label">开户行</label><input className="filter-input" placeholder="请输入" style={{ width: '100%' }} /></div>
            </div>
            <div className="drawer-form-row">
              <div className="drawer-form-field"><label className="drawer-label">行号</label><input className="filter-input" placeholder="请输入联行号" style={{ width: '100%' }} /></div>
              <div className="drawer-form-field" style={{ flex: 2 }}><label className="drawer-label">结算要求备注</label><input className="filter-input" placeholder="请输入" style={{ width: '100%' }} /></div>
            </div>

            {/* 仓库地址 */}
            <div className="drawer-section-title">仓库地址（最多9个）</div>
            <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div className="drawer-form-row" style={{ marginBottom: 'var(--space-2)' }}>
                <div className="drawer-form-field"><label className="drawer-label" style={{ fontSize: 'var(--text-xs)' }}>仓库名称</label><input className="filter-input" placeholder="如：杭州仓" style={{ width: '100%' }} /></div>
                <div className="drawer-form-field" style={{ flex: 2 }}><label className="drawer-label" style={{ fontSize: 'var(--text-xs)' }}>仓库地址</label><input className="filter-input" placeholder="请输入详细地址" style={{ width: '100%' }} /></div>
                <div className="drawer-form-field"><label className="drawer-label" style={{ fontSize: 'var(--text-xs)' }}>联系人</label><input className="filter-input" placeholder="姓名" style={{ width: '100%' }} /></div>
                <div className="drawer-form-field"><label className="drawer-label" style={{ fontSize: 'var(--text-xs)' }}>电话</label><input className="filter-input" placeholder="电话" style={{ width: '100%' }} /></div>
                <Button size="sm">添加</Button>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>供应商仓库将同步至"仓储 &gt; 仓库设置"，作为合作仓库管理</div>
            </div>

            {/* 文件上传 */}
            <div className="drawer-section-title">协议文件</div>
            <div className="drawer-form-row">
              <div style={{ flex: 1, border: '2px dashed var(--color-border-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 4 }}>合作协议</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>点击或拖拽上传，支持多份</div>
              </div>
              <div style={{ flex: 1, border: '2px dashed var(--color-border-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 4 }}>品牌授权协议</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>点击或拖拽上传，支持多份</div>
              </div>
            </div>

            {/* 简介 */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label className="drawer-label">供应商简介</label>
              <textarea className="filter-input" placeholder="请输入供应商简介" style={{ width: '100%', minHeight: 80, resize: 'vertical' }} />
            </div>
            </div>
            <div className="drawer-footer">
              <Button variant="ghost" onClick={() => setShowAddDrawer(false)}>取消</Button>
              <Button onClick={() => setShowAddDrawer(false)}>保存</Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
