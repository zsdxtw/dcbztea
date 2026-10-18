import { useState, useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import type { StoreItem, StatCardData } from '../../types';
import { storeItems as initialStores, generateStoreCode } from '../../data/stores';
import { PROVINCE_NAMES, getCityNames, getDistricts } from '../../data/regions';

const PRIMARY = '#0F64B5';
const PRIMARY_LIGHT = '#EBF3FC';
const SECONDARY = '#CB405D';

const stats = (list: StoreItem[]): StatCardData[] => {
  const active = list.filter(s => s.status === 'active');
  const totalArea = list.reduce((sum, s) => sum + s.area, 0);
  return [
    { label: '门店总数', value: String(list.length), unit: '家', icon: <IconStore />, trend: { direction: 'up', value: `营业中 ${active.length}` } },
    { label: '营业中', value: String(active.length), unit: '家', icon: <IconActive />, trend: { direction: 'up', value: `占比 ${list.length ? Math.round(active.length / list.length * 100) : 0}%` } },
    { label: '已停业', value: String(list.length - active.length), unit: '家', icon: <IconInactive />, trend: { direction: 'down', value: '暂停营业' } },
    { label: '门店总面积', value: String(totalArea), unit: '㎡', icon: <IconArea />, trend: { direction: 'up', value: `均值 ${list.length ? Math.round(totalArea / list.length) : 0}㎡` } },
  ];
};

const emptyForm: StoreItem = {
  id: '',
  code: '',
  name: '',
  province: '',
  city: '',
  district: '',
  address: '',
  manager: '',
  phone: '',
  businessHours: '09:00-21:00',
  openingDate: '',
  area: 0,
  status: 'active',
  remark: '',
};

export default function SalesStores() {
  const [keyword, setKeyword] = useState('');
  const [data, setData] = useState<StoreItem[]>(initialStores);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [detailStore, setDetailStore] = useState<StoreItem | null>(null);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [editing, setEditing] = useState<StoreItem | null>(null);
  const [form, setForm] = useState<StoreItem>(emptyForm);

  const filtered = useMemo(() => {
    if (!keyword) return data;
    return data.filter(s =>
      s.name.includes(keyword) || s.code.includes(keyword) || s.manager.includes(keyword) ||
      s.phone.includes(keyword) || s.province.includes(keyword) || s.city.includes(keyword) ||
      s.district.includes(keyword) || s.address.includes(keyword)
    );
  }, [data, keyword]);

  const enterDeleteMode = () => { setDeleteMode(true); setSelectedForDelete(new Set()); };
  const exitDeleteMode = () => { setDeleteMode(false); setSelectedForDelete(new Set()); };
  const toggleSelect = (id: string) => setSelectedForDelete(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const confirmDelete = () => {
    setData(prev => prev.filter(s => !selectedForDelete.has(s.id)));
    setShowDeleteConfirm(false);
    exitDeleteMode();
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, code: generateStoreCode(data.length + 1), openingDate: new Date().toISOString().slice(0, 10) });
    setShowAddDrawer(true);
  };

  const openEdit = (s: StoreItem) => {
    setEditing(s);
    setForm({ ...s });
    setShowAddDrawer(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim() || !form.province || !form.city) return;
    if (editing) {
      setData(prev => prev.map(s => s.id === editing.id ? { ...form } : s));
      setDetailStore({ ...form });
    } else {
      setData(prev => [...prev, { ...form, id: `store-${Date.now()}` }]);
    }
    setShowAddDrawer(false);
    setEditing(null);
  };

  const statusTag = (status: 'active' | 'inactive') => (
    <span style={{
      padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)',
      fontWeight: 'var(--font-medium)',
      background: status === 'active' ? '#E8F5E9' : '#FFF3E0',
      color: status === 'active' ? '#2E7D32' : '#E65100',
    }}>
      {status === 'active' ? '营业中' : '已停业'}
    </span>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 34, padding: '0 var(--space-3)',
    border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)', fontFamily: 'var(--font-family-sans)',
    color: 'var(--color-neutral-700)', background: 'var(--color-neutral-0)',
  };

  const canSave = form.name.trim().length > 0 && form.code.trim().length > 0 && form.province.length > 0 && form.city.length > 0;

  return (
    <>
      <ContentHeader title="门店管理" breadcrumbs={['人员', '门店管理']} />
      <div className="content-body">
        <div className="stat-cards">
          {stats(data).map((s, i) => <StatCard key={i} data={s} />)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
          <input className="filter-input" placeholder="搜索门店名称、编号、店长、地区..." value={keyword} onChange={e => setKeyword(e.target.value)} style={{ width: 280 }} />
          <Button onClick={openAdd}>
            <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            新增门店
          </Button>
          {deleteMode ? (
            <>
              <Button style={{ background: SECONDARY, borderColor: SECONDARY }} onClick={() => setShowDeleteConfirm(true)} disabled={selectedForDelete.size === 0}>
                <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                删除所选({selectedForDelete.size})
              </Button>
              <Button variant="ghost" onClick={exitDeleteMode}>取消</Button>
            </>
          ) : (
            <Button style={{ background: SECONDARY, borderColor: SECONDARY }} onClick={enterDeleteMode}>
              <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              删除
            </Button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>共 {filtered.length} 家门店</span>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={[...(deleteMode ? ['选择'] : ['序号']), '门店编号', '门店名称', '所在地区', '详细地址', '店长', '联系电话', '营业时间', '面积', '状态', '操作']}
            rows={filtered.map((s, idx) => [
              deleteMode ? <input key="chk" type="checkbox" checked={selectedForDelete.has(s.id)} onChange={() => toggleSelect(s.id)} /> : <span key="idx" className="mono">{idx + 1}</span>,
              <span key="code" className="mono" style={{ color: 'var(--color-neutral-600)' }}>{s.code}</span>,
              <span key="name" className="cell-emph">{s.name}</span>,
              <span key="region" style={{ fontSize: 'var(--text-sm)' }}>{[s.province, s.city, s.district].filter(Boolean).join(' / ')}</span>,
              <span key="addr" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>{s.address}</span>,
              <span key="mgr">{s.manager}</span>,
              <span key="ph" className="mono" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{s.phone}</span>,
              <span key="bh" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>{s.businessHours}</span>,
              <span key="area" className="mono">{s.area}㎡</span>,
              <span key="st">{statusTag(s.status)}</span>,
              <div className="row-actions" key="act">
                <Button size="sm" variant="ghost" onClick={() => setDetailStore(s)}>查看</Button>
                <Button size="sm" variant="ghost" onClick={() => setDetailStore(s)}>编辑</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      {/* 删除确认 */}
      {showDeleteConfirm && (
        <div className="category-dialog-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>确认删除</h3>
            <p style={{ color: 'var(--color-neutral-600)', marginBottom: 'var(--space-4)' }}>确定要删除选中的 {selectedForDelete.size} 个门店吗？关联的门店仓库将同步移除。此操作不可撤销。</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>取消</Button>
              <Button style={{ background: 'var(--color-semantic-error)', borderColor: 'var(--color-semantic-error)' }} onClick={confirmDelete}>确认删除</Button>
            </div>
          </div>
        </div>
      )}

      {/* 详情抽屉 */}
      <DetailDrawer
        open={!!detailStore}
        onClose={() => setDetailStore(null)}
        badge="ST"
        title={detailStore?.name}
        statusTag={detailStore && statusTag(detailStore.status)}
        subtitle={detailStore && `${detailStore.code} · ${[detailStore.province, detailStore.city, detailStore.district].filter(Boolean).join(' / ') || '—'}`}
        mode="view"
        onEdit={() => { if (detailStore) { const s = detailStore; setDetailStore(null); openEdit(s); } }}
      >
        {detailStore && (
          <>
            <DrawerSection title="基本信息">
              <InfoGrid cols={3}>
                <InfoItem label="门店编号" emph mono>{detailStore.code}</InfoItem>
                <InfoItem label="门店名称" emph>{detailStore.name}</InfoItem>
                <InfoItem label="营业状态">{statusTag(detailStore.status)}</InfoItem>
                <InfoItem label="店长">{detailStore.manager || '—'}</InfoItem>
                <InfoItem label="联系电话" mono>{detailStore.phone || '—'}</InfoItem>
                <InfoItem label="营业时间">{detailStore.businessHours || '—'}</InfoItem>
                <InfoItem label="开业日期">{detailStore.openingDate || '—'}</InfoItem>
                <InfoItem label="门店面积" mono>{detailStore.area}㎡</InfoItem>
                <InfoItem label="关联门店仓库">{detailStore.name}仓（WH-ST）</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="地址信息">
              <InfoGrid cols={3}>
                <InfoItem label="所在地区">{[detailStore.province, detailStore.city, detailStore.district].filter(Boolean).join(' / ') || '—'}</InfoItem>
                <InfoItem label="详细地址" span={2}>{detailStore.address || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="备注">
              <InfoGrid cols={3}>
                <InfoItem label="备注" span={3}>{detailStore.remark || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="联动说明">
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                门店地址已联动至「仓储 &gt; 仓库设置 &gt; 门店仓库」，作为门店仓库的地址来源。
              </div>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>

      {/* 新增/编辑抽屉 */}
      {showAddDrawer && (
        <div className="drawer-overlay" onClick={() => setShowAddDrawer(false)}>
          <div className="drawer-panel" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-title">{editing ? '编辑门店' : '新增门店'}</span>
              <button className="drawer-close" onClick={() => setShowAddDrawer(false)}>×</button>
            </div>
            <div className="drawer-body">
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">门店编号 <span style={{ color: 'var(--color-semantic-error)' }}>*</span></label>
                  <input className="filter-input" style={inputStyle} placeholder="MD-0001" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">门店名称 <span style={{ color: 'var(--color-semantic-error)' }}>*</span></label>
                  <input className="filter-input" style={inputStyle} placeholder="如：西湖茶庄" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
              </div>

              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)', margin: 'var(--space-4) 0 var(--space-2)' }}>门店地址</div>
              <div className="drawer-form-row" style={{ marginBottom: 'var(--space-2)' }}>
                <div className="drawer-form-field">
                  <label className="drawer-label">省份 <span style={{ color: 'var(--color-semantic-error)' }}>*</span></label>
                  <select className="filter-select" style={inputStyle} value={form.province} onChange={e => setForm({ ...form, province: e.target.value, city: '', district: '' })}>
                    <option value="">请选择省份</option>
                    {PROVINCE_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">城市 <span style={{ color: 'var(--color-semantic-error)' }}>*</span></label>
                  <select className="filter-select" style={inputStyle} value={form.city} onChange={e => setForm({ ...form, city: e.target.value, district: '' })} disabled={!form.province}>
                    <option value="">请选择城市</option>
                    {form.province && getCityNames(form.province).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">区县</label>
                  <select className="filter-select" style={inputStyle} value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} disabled={!form.city}>
                    <option value="">请选择区县</option>
                    {form.province && form.city && getDistricts(form.province, form.city).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="drawer-form-field" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="drawer-label">详细地址</label>
                <input className="filter-input" style={inputStyle} placeholder="请输入详细地址" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>

              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">店长</label>
                  <input className="filter-input" style={inputStyle} placeholder="请输入" value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">联系电话</label>
                  <input className="filter-input" style={inputStyle} placeholder="请输入" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">营业时间</label>
                  <input className="filter-input" style={inputStyle} placeholder="如：09:00-21:00" value={form.businessHours} onChange={e => setForm({ ...form, businessHours: e.target.value })} />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">开业日期</label>
                  <input type="date" className="filter-input" style={inputStyle} value={form.openingDate} onChange={e => setForm({ ...form, openingDate: e.target.value })} />
                </div>
              </div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">门店面积（㎡）</label>
                  <input type="number" className="filter-input" style={inputStyle} placeholder="请输入" value={form.area || ''} onChange={e => setForm({ ...form, area: Number(e.target.value) || 0 })} />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">营业状态</label>
                  <select className="filter-select" style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}>
                    <option value="active">营业中</option>
                    <option value="inactive">已停业</option>
                  </select>
                </div>
              </div>
              <div className="drawer-form-field" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="drawer-label">备注</label>
                <textarea className="filter-input" style={{ ...inputStyle, height: 'auto', padding: 'var(--space-2) var(--space-3)', minHeight: 60, resize: 'vertical' }} placeholder="请输入备注" value={form.remark || ''} onChange={e => setForm({ ...form, remark: e.target.value })} />
              </div>
              <div style={{ padding: 'var(--space-3)', background: PRIMARY_LIGHT, borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: PRIMARY }}>
                门店保存后，将自动在「仓储 &gt; 仓库设置 &gt; 门店仓库」中创建对应的门店仓库，仓库地址取自门店地址。
              </div>
            </div>
            <div className="drawer-footer">
              <Button variant="ghost" onClick={() => setShowAddDrawer(false)}>取消</Button>
              <Button onClick={handleSave} disabled={!canSave}>保存</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function IconStore() {
  return <svg viewBox="0 0 18 18" fill="none"><path d="M3 7l1.5-3h9L15 7M3 7v8h12V7M3 7h12" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 15v-4h4v4" stroke="currentColor" strokeWidth="1.3"/></svg>;
}
function IconActive() {
  return <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function IconInactive() {
  return <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M6 6l6 6M12 6l-6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
}
function IconArea() {
  return <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="3" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 9h12M9 3v12" stroke="currentColor" strokeWidth="1.2"/></svg>;
}
