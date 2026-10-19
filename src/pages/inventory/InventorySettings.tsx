import { useState, useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Toggle from '../../components/common/Toggle';
import Button from '../../components/common/Button';
import SettingsSection from '../../components/settings/SettingsSection';
import SettingsRow from '../../components/settings/SettingsRow';
import {
  ownWarehouses,
  getStoreWarehouses,
  getPartnerWarehouses,
  WAREHOUSE_CATEGORY_LABELS,
  WAREHOUSE_CATEGORY_COLORS,
} from '../../data/warehouses';
import { PROVINCE_NAMES, getCityNames, getDistricts } from '../../data/regions';
import type { Warehouse, WarehouseCategory, StatCardData } from '../../types';

type TabKey = WarehouseCategory;

const stats = (ownList: Warehouse[], storeList: Warehouse[], partnerList: Warehouse[]): StatCardData[] => [
  { label: '仓库总数', value: String(ownList.length + storeList.length + partnerList.length), unit: '个', icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 9h12" stroke="currentColor" strokeWidth="1.3"/></svg> },
  { label: '独立仓库', value: String(ownList.length), unit: '个', icon: <svg viewBox="0 0 18 18" fill="none"><path d="M9 2L3 5v5c0 5 3.5 7.5 7 9 3.5-1.5 7-4 7-9V5L9 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
  { label: '门店仓库', value: String(storeList.length), unit: '个', icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 7l1.5-3h9L15 7M3 7v8h12V7M3 7h12" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 15v-4h4v4" stroke="currentColor" strokeWidth="1.3"/></svg> },
  { label: '合作仓库', value: String(partnerList.length), unit: '个', icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 16a5 5 0 0110 0M14 10h4M16 8v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { label: '启用仓库', value: String([...ownList, ...storeList, ...partnerList].filter(w => w.enabled).length), unit: '个', icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
];

const emptyForm: Warehouse = {
  id: '',
  name: '',
  code: '',
  address: '',
  province: '',
  city: '',
  district: '',
  manager: '',
  phone: '',
  category: 'independent',
  enabled: true,
  isDefault: false,
};

export default function InventorySettings() {
  const [tab, setTab] = useState<TabKey>('independent');
  const [ownList, setOwnList] = useState<Warehouse[]>(ownWarehouses);
  const storeList = useMemo(() => getStoreWarehouses(), []);
  const partnerList = useMemo(() => getPartnerWarehouses(), []);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState<Warehouse>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);

  // 预警配置
  const [lowStockThreshold, setLowStockThreshold] = useState('20');
  const [turnoverDays, setTurnoverDays] = useState('45');
  const [defaultAllocation, setDefaultAllocation] = useState('auto');

  const handleToggle = (id: string, active: boolean) => {
    setOwnList(prev => prev.map(w => w.id === id ? { ...w, enabled: active } : w));
  };

  const handleSetDefault = (id: string) => {
    setOwnList(prev => prev.map(w => ({ ...w, isDefault: w.id === id })));
  };

  const openAdd = () => {
    setEditing(null);
    const seq = ownList.filter(w => w.category === 'independent').length + 1;
    setForm({ ...emptyForm, category: 'independent', code: `WH-HZ-${String(seq).padStart(2, '0')}` });
    setShowDrawer(true);
  };

  const openEdit = (w: Warehouse) => {
    setEditing(w);
    setForm({ ...w });
    setShowDrawer(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim()) return;
    if (editing) {
      setOwnList(prev => prev.map(w => w.id === editing.id ? { ...form } : w));
      if (form.isDefault) {
        setOwnList(prev => prev.map(w => w.id === editing.id ? { ...w, isDefault: true } : { ...w, isDefault: false }));
      }
    } else {
      const newWh: Warehouse = { ...form, id: `wh-own-${Date.now()}` };
      setOwnList(prev => form.isDefault ? [...prev.map(w => ({ ...w, isDefault: false })), newWh] : [...prev, newWh]);
    }
    setShowDrawer(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setOwnList(prev => prev.filter(w => w.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 34, padding: '0 var(--space-3)',
    border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)', fontFamily: 'var(--font-family-sans)',
    color: 'var(--color-neutral-700)', background: 'var(--color-neutral-0)',
  };

  return (
    <>
      <ContentHeader
        title="仓库设置"
        breadcrumbs={['仓储', '仓库设置']}
        actions={tab === 'independent' ? <Button onClick={openAdd}><PlusIcon />新增仓库</Button> : undefined}
      />
      <div className="content-body">
        <div className="stat-cards">
          {stats(ownList, storeList, partnerList).map((s, i) => <StatCard key={i} data={s} />)}
        </div>

        {/* Tab 切换 */}
        <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-neutral-200)' }}>
          {(['independent', 'store', 'partner'] as TabKey[]).map(k => {
            const count = k === 'independent' ? ownList.length : k === 'store' ? storeList.length : partnerList.length;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                style={{
                  padding: 'var(--space-2) var(--space-5)', border: 'none', background: 'none',
                  cursor: 'pointer', fontSize: 'var(--text-md)', fontWeight: 'var(--font-medium)',
                  color: tab === k ? 'var(--color-module-current-base)' : 'var(--color-neutral-500)',
                  borderBottom: tab === k ? '2px solid var(--color-module-current-base)' : '2px solid transparent',
                  transition: 'color 0.2s ease', marginBottom: '-1px',
                }}
              >
                {WAREHOUSE_CATEGORY_LABELS[k]}
                <span style={{ marginLeft: 6, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 独立仓库表格（可增删改查） */}
        {tab === 'independent' && (
          <Card title="独立仓库">
            <Table
              headers={['仓库名称', '仓库编码', '地址', '负责人', '电话', '默认', '状态', '操作']}
              rows={ownList.map(w => [
                <span className="cell-emph">{w.name}</span>,
                <span className="mono">{w.code}</span>,
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{[w.province, w.city, w.district].filter(Boolean).join(' / ')}</span>
                  <span style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--text-sm)' }}>{w.address}</span>
                </div>,
                w.manager,
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>{w.phone}</span>,
                <span
                  onClick={() => handleSetDefault(w.id)}
                  style={{
                    padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-medium)', cursor: 'pointer',
                    background: w.isDefault ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-100)',
                    color: w.isDefault ? 'var(--color-module-current-base)' : 'var(--color-neutral-400)',
                    border: `1px solid ${w.isDefault ? 'var(--color-module-current-light)' : 'var(--color-neutral-200)'}`,
                  }}
                >
                  {w.isDefault ? '默认' : '设为默认'}
                </span>,
                <Toggle active={w.enabled} onChange={(active) => handleToggle(w.id, active)} />,
                <div className="row-actions">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(w)}>编辑</Button>
                  <Button variant="ghost" size="sm" className="btn-row-danger" onClick={() => setDeleteTarget(w)}>删除</Button>
                </div>,
              ])}
            />
          </Card>
        )}

        {/* 门店仓库表格（来自门店管理，只读） */}
        {tab === 'store' && (
          <Card title="门店仓库" headerRight={
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
              数据联动自「销售 &gt; 门店管理」，请在门店管理中维护
            </span>
          }>
            <Table
              headers={['仓库名称', '仓库编码', '地址', '负责人', '电话', '来源门店', '状态']}
              rows={storeList.map(w => [
                <span className="cell-emph">{w.name}</span>,
                <span className="mono">{w.code}</span>,
                <span style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--text-sm)' }}>{w.address}</span>,
                w.manager,
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>{w.phone}</span>,
                <span style={{
                  padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-medium)', background: `${WAREHOUSE_CATEGORY_COLORS.store}15`,
                  color: WAREHOUSE_CATEGORY_COLORS.store, border: `1px solid ${WAREHOUSE_CATEGORY_COLORS.store}30`,
                }}>
                  {w.supplierName}
                </span>,
                <span style={{
                  padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-medium)',
                  background: w.enabled ? '#E8F5E9' : '#FFF3E0',
                  color: w.enabled ? '#2E7D32' : '#E65100',
                }}>
                  {w.enabled ? '启用' : '停用'}
                </span>,
              ])}
            />
          </Card>
        )}

        {/* 合作仓库表格（来自供应商，只读） */}
        {tab === 'partner' && (
          <Card title="合作仓库" headerRight={
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
              数据联动自「采购 &gt; 合作商管理」，请在合作商详情中维护
            </span>
          }>
            <Table
              headers={['仓库名称', '仓库编码', '地址', '联系人', '电话', '来源合作商', '默认', '状态']}
              rows={partnerList.map(w => [
                <span className="cell-emph">{w.name}</span>,
                <span className="mono">{w.code}</span>,
                <span style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--text-sm)' }}>{w.address}</span>,
                w.manager,
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>{w.phone}</span>,
                <span style={{
                  padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-medium)', background: `${WAREHOUSE_CATEGORY_COLORS.partner}15`,
                  color: WAREHOUSE_CATEGORY_COLORS.partner, border: `1px solid ${WAREHOUSE_CATEGORY_COLORS.partner}30`,
                }}>
                  {w.supplierName}
                </span>,
                <span style={{
                  padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-medium)',
                  background: w.isDefault ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-100)',
                  color: w.isDefault ? 'var(--color-module-current-base)' : 'var(--color-neutral-400)',
                }}>
                  {w.isDefault ? '默认' : '—'}
                </span>,
                <span style={{
                  padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-medium)',
                  background: w.enabled ? '#E8F5E9' : '#FFF3E0',
                  color: w.enabled ? '#2E7D32' : '#E65100',
                }}>
                  {w.enabled ? '启用' : '停用'}
                </span>,
              ])}
            />
          </Card>
        )}

        {/* 预警与分配规则配置 */}
        <Card style={{ marginTop: 'var(--space-6)' }}>
          <SettingsSection title="库存预警配置">
            <SettingsRow
              label="低库存预警阈值"
              description="当库存数量低于此值时触发预警"
              action={
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    style={{ width: 80, padding: 'var(--space-1) var(--space-2)', border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-family-mono)' }}
                  />
                  <span style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--text-sm)' }}>kg</span>
                </div>
              }
            />
            <SettingsRow
              label="库存周转天数"
              description="超过此天数的库存标记为滞销"
              action={
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <input
                    type="number"
                    value={turnoverDays}
                    onChange={(e) => setTurnoverDays(e.target.value)}
                    style={{ width: 80, padding: 'var(--space-1) var(--space-2)', border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-family-mono)' }}
                  />
                  <span style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--text-sm)' }}>天</span>
                </div>
              }
            />
          </SettingsSection>
          <SettingsSection title="默认分配规则">
            <SettingsRow
              label="默认库位分配"
              description="入库时自动分配库位的规则"
              action={
                <select
                  value={defaultAllocation}
                  onChange={(e) => setDefaultAllocation(e.target.value)}
                  style={{ padding: 'var(--space-1) var(--space-2)', border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', background: 'var(--color-neutral-0)' }}
                >
                  <option value="auto">自动分配</option>
                  <option value="category">按茶类分配</option>
                  <option value="manual">手动指定</option>
                </select>
              }
            />
          </SettingsSection>
        </Card>
      </div>

      {/* 新增/编辑抽屉 */}
      {showDrawer && (
        <div className="drawer-overlay" onClick={() => setShowDrawer(false)}>
          <div className="drawer-panel" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-title">{editing ? '编辑仓库' : '新增仓库'}</span>
              <button className="drawer-close" onClick={() => setShowDrawer(false)}>×</button>
            </div>
            <div className="drawer-body">
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">仓库名称 <span style={{ color: 'var(--color-semantic-error)' }}>*</span></label>
                  <input className="filter-input" style={inputStyle} placeholder="如：杭州总仓" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">仓库编码 <span style={{ color: 'var(--color-semantic-error)' }}>*</span></label>
                  <input className="filter-input" style={inputStyle} placeholder="如：WH-HZ-01" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)', margin: 'var(--space-4) 0 var(--space-2)' }}>仓库地址</div>
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
                  <label className="drawer-label">负责人</label>
                  <input className="filter-input" style={inputStyle} placeholder="请输入" value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">联系电话</label>
                  <input className="filter-input" style={inputStyle} placeholder="请输入" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', marginTop: 'var(--space-3)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                  <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} />
                  设为默认仓库
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                  <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
                  启用仓库
                </label>
              </div>
            </div>
            <div className="drawer-footer">
              <Button variant="ghost" onClick={() => setShowDrawer(false)}>取消</Button>
              <Button onClick={handleSave}>保存</Button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认 */}
      {deleteTarget && (
        <div className="category-dialog-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>确认删除</h3>
            <p style={{ color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)' }}>
              确定要删除仓库「<span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-800)' }}>{deleteTarget.name}</span>」吗？此操作不可撤销。
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>取消</Button>
              <Button style={{ background: 'var(--color-semantic-error)', borderColor: 'var(--color-semantic-error)' }} onClick={handleDelete}>确认删除</Button>
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
