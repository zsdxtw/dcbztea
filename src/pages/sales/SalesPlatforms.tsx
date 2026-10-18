import { useState, useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import type { StatCardData, PlatformItem, PlatformBankAccount, PlatformInvoiceInfo } from '../../types';
import { platformItems as initialPlatforms, generatePlatformCode } from '../../data/platforms';

const SECONDARY = '#CB405D';

export default function SalesPlatforms() {
  const [data, setData] = useState<PlatformItem[]>(initialPlatforms);
  const [keyword, setKeyword] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [selected, setSelected] = useState<PlatformItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<PlatformItem | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const filtered = useMemo(() => {
    if (!keyword) return data;
    return data.filter(p => p.name.includes(keyword) || p.shortName.includes(keyword) || p.code.includes(keyword) || p.contactPerson.includes(keyword));
  }, [data, keyword]);

  const stats: StatCardData[] = useMemo(() => {
    const active = data.filter(p => p.status === 'active').length;
    return [
      { label: '平台总数', value: String(data.length), unit: '个', trend: { direction: 'up', value: `在册 ${active}` }, icon: <IconPlatform /> },
      { label: '在册平台', value: String(active), unit: '个', trend: { direction: 'up', value: '正常合作' }, icon: <IconActive /> },
      { label: '平均保证金', value: data.length ? (data.reduce((s, p) => s + (p.deposit ?? 0), 0) / data.filter(p => p.deposit).length || 0).toLocaleString('en-US') : '0', unit: '¥', icon: <IconPercent /> },
      { label: '结算账户', value: String(data.reduce((s, p) => s + p.bankAccounts.length, 0)), unit: '个', icon: <IconBank /> },
    ];
  }, [data]);

  const handleView = (p: PlatformItem) => { setSelected(p); setEditing(false); setEditForm(null); setShowDetail(true); };
  const handleStartEdit = () => { if (selected) { setEditForm({ ...selected, bankAccounts: selected.bankAccounts.map(b => ({ ...b })), invoiceInfos: selected.invoiceInfos.map(i => ({ ...i })) }); setEditing(true); } };
  const handleCancelEdit = () => { setEditing(false); setEditForm(null); };
  const handleSaveEdit = () => { if (editForm) { setData(prev => prev.map(p => p.id === editForm.id ? editForm : p)); setSelected(editForm); setEditing(false); setEditForm(null); } };

  const enterDeleteMode = () => { setDeleteMode(true); setSelectedForDelete(new Set()); };
  const exitDeleteMode = () => { setDeleteMode(false); setSelectedForDelete(new Set()); };
  const toggleSelect = (id: string) => setSelectedForDelete(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const confirmDelete = () => { setData(prev => prev.filter(p => !selectedForDelete.has(p.id))); setShowDeleteConfirm(false); exitDeleteMode(); };

  const statusTag = (status: PlatformItem['status']) => (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: status === 'active' ? '#E8F5E9' : '#FFF3E0', color: status === 'active' ? '#2E7D32' : '#E65100' }}>
      {status === 'active' ? '在册' : '停用'}
    </span>
  );

  return (
    <div>
      <ContentHeader title="平台方管理" breadcrumbs={['销售', '平台方管理']} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        {stats.map((s, i) => <StatCard key={i} data={s} />)}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <input className="filter-input" placeholder="搜索平台名称、编码、联系人..." value={keyword} onChange={e => setKeyword(e.target.value)} style={{ width: 280 }} />
        <Button onClick={() => setShowAddDrawer(true)}>
          <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          新增
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
        <span style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>共 {filtered.length} 个平台</span>
      </div>

      <Card style={{ padding: 0 }}>
        <Table
          headers={[deleteMode ? '选择' : '序号', '平台名称', '编码', '简称', '联系人', '联系人职务', '联系电话', '结算账户', '发票主体', '状态', '操作']}
          rows={filtered.map((p, idx) => [
            deleteMode ? <input key="chk" type="checkbox" checked={selectedForDelete.has(p.id)} onChange={() => toggleSelect(p.id)} /> : <span key="idx" className="mono">{idx + 1}</span>,
            <span key="name" className="cell-emph">{p.name}</span>,
            <span key="code" className="mono" style={{ color: 'var(--color-neutral-600)' }}>{p.code}</span>,
            <span key="sn">{p.shortName}</span>,
            <span key="cp">{p.contactPerson}</span>,
            <span key="cpo" style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--text-xs)' }}>{p.contactPosition || '—'}</span>,
            <span key="cph" className="mono" style={{ color: 'var(--color-neutral-600)' }}>{p.contactPhone}</span>,
            <span key="ba" className="mono">{p.bankAccounts.length}个</span>,
            <span key="ii">{p.invoiceInfos.length > 0 ? p.invoiceInfos[0].invoiceEntity : '—'}</span>,
            <span key="st">{statusTag(p.status)}</span>,
            <div key="act" className="row-actions">
              <Button size="sm" variant="ghost" onClick={() => handleView(p)}>查看</Button>
              <Button size="sm" variant="ghost" onClick={() => handleView(p)}>编辑</Button>
            </div>,
          ])}
        />
      </Card>

      {/* 删除确认 */}
      {showDeleteConfirm && (
        <div className="category-dialog-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>确认删除</h3>
            <p style={{ color: 'var(--color-neutral-600)', marginBottom: 'var(--space-4)' }}>确定要删除选中的 {selectedForDelete.size} 个平台吗？</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>取消</Button>
              <Button style={{ background: SECONDARY, borderColor: SECONDARY }} onClick={confirmDelete}>确认删除</Button>
            </div>
          </div>
        </div>
      )}

      {/* 详情/编辑抽屉 */}
      <DetailDrawer
        open={showDetail && !!selected}
        onClose={() => { setShowDetail(false); setEditing(false); setEditForm(null); }}
        badge="SF"
        title={selected?.name}
        statusTag={selected && statusTag(selected.status)}
        subtitle={selected && `${selected.code} · ${selected.contactPerson} · ${selected.contactPhone}`}
        mode={editing ? 'edit' : 'view'}
        onEdit={handleStartEdit}
        onCancelEdit={handleCancelEdit}
        onSave={handleSaveEdit}
      >
        {selected && (
          <>
            <DrawerSection title="基本信息">
              {editing && editForm ? (
                <div style={grid2}>
                  <Field label="平台名称"><input className="filter-input" style={{ width: '100%' }} value={editForm.name ?? ''} onChange={e => setEditForm(prev => prev ? { ...prev, name: e.target.value } : prev)} /></Field>
                  <Field label="平台简称"><input className="filter-input" style={{ width: '100%' }} value={editForm.shortName ?? ''} onChange={e => setEditForm(prev => prev ? { ...prev, shortName: e.target.value } : prev)} /></Field>
                  <Field label="平台编码"><Text className="mono">{selected.code}</Text></Field>
                  <Field label="联系人"><input className="filter-input" style={{ width: '100%' }} value={editForm.contactPerson ?? ''} onChange={e => setEditForm(prev => prev ? { ...prev, contactPerson: e.target.value } : prev)} /></Field>
                  <Field label="联系人职务"><input className="filter-input" style={{ width: '100%' }} value={editForm.contactPosition ?? ''} onChange={e => setEditForm(prev => prev ? { ...prev, contactPosition: e.target.value } : prev)} /></Field>
                  <Field label="联系电话"><input className="filter-input" style={{ width: '100%' }} value={editForm.contactPhone ?? ''} onChange={e => setEditForm(prev => prev ? { ...prev, contactPhone: e.target.value } : prev)} /></Field>
                  <Field label="联系地址"><input className="filter-input" style={{ width: '100%' }} value={editForm.contactAddress ?? ''} onChange={e => setEditForm(prev => prev ? { ...prev, contactAddress: e.target.value } : prev)} /></Field>
                  <Field label="合作日期"><input className="filter-input" style={{ width: '100%' }} type="date" value={editForm.cooperationDate ?? ''} onChange={e => setEditForm(prev => prev ? { ...prev, cooperationDate: e.target.value } : prev)} /></Field>
                  <Field label="支付保证金（元）"><input className="filter-input" style={{ width: '100%' }} type="number" value={editForm.deposit ?? ''} onChange={e => setEditForm(prev => prev ? { ...prev, deposit: e.target.value === '' ? undefined : Number(e.target.value) } : prev)} placeholder="平台交纳的保证金金额" /></Field>
                  <Field label="保证金应收日期"><input className="filter-input" style={{ width: '100%' }} type="date" value={editForm.depositDueDate ?? ''} onChange={e => setEditForm(prev => prev ? { ...prev, depositDueDate: e.target.value || undefined } : prev)} /></Field>
                  <Field label="备注" full><input className="filter-input" style={{ width: '100%' }} value={editForm.remark ?? ''} onChange={e => setEditForm(prev => prev ? { ...prev, remark: e.target.value } : prev)} /></Field>
                </div>
              ) : (
                <InfoGrid cols={3}>
                  <InfoItem label="平台名称" emph>{selected.name}</InfoItem>
                  <InfoItem label="平台简称" emph>{selected.shortName}</InfoItem>
                  <InfoItem label="平台编码" emph mono>{selected.code}</InfoItem>
                  <InfoItem label="联系人">{selected.contactPerson}</InfoItem>
                  <InfoItem label="联系人职务">{selected.contactPosition || '—'}</InfoItem>
                  <InfoItem label="联系电话" mono>{selected.contactPhone}</InfoItem>
                  <InfoItem label="联系地址" span={3}>{selected.contactAddress || '—'}</InfoItem>
                  <InfoItem label="合作日期">{selected.cooperationDate}</InfoItem>
                  <InfoItem label="支付保证金（元）" mono valueStyle={{ color: SECONDARY, fontWeight: 'var(--font-medium)' }}>{typeof selected.deposit === 'number' ? `¥ ${selected.deposit.toLocaleString('en-US')}` : '—'}</InfoItem>
                  <InfoItem label="保证金应收日期">{selected.depositDueDate || '—'}</InfoItem>
                  <InfoItem label="备注" span={3}>{selected.remark || '—'}</InfoItem>
                </InfoGrid>
              )}
            </DrawerSection>

            <DrawerSection title={`结算账户（${selected.bankAccounts.length}/5）`}>
              {selected.bankAccounts.length === 0 ? <EmptyText>暂无结算账户</EmptyText> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {selected.bankAccounts.map((ba, i) => (
                    <div key={i} style={{ padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                        <div><span style={{ color: 'var(--color-neutral-500)' }}>户名：</span><span style={{ fontWeight: 'var(--font-medium)' }}>{ba.accountName}</span></div>
                        <div><span style={{ color: 'var(--color-neutral-500)' }}>账号：</span><span className="mono">{ba.accountNo}</span></div>
                        <div><span style={{ color: 'var(--color-neutral-500)' }}>开户行：</span>{ba.bankName}</div>
                        <div><span style={{ color: 'var(--color-neutral-500)' }}>行号：</span><span className="mono">{ba.bankNo}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DrawerSection>

            <DrawerSection title={`发票信息（${selected.invoiceInfos.length}/5）`}>
              {selected.invoiceInfos.length === 0 ? <EmptyText>暂无发票信息</EmptyText> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {selected.invoiceInfos.map((inv, i) => (
                    <div key={i} style={{ padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                        <div><span style={{ color: 'var(--color-neutral-500)' }}>发票主体：</span><span style={{ fontWeight: 'var(--font-medium)' }}>{inv.invoiceEntity}</span></div>
                        <div><span style={{ color: 'var(--color-neutral-500)' }}>税号：</span><span className="mono">{inv.taxNo}</span></div>
                        <div><span style={{ color: 'var(--color-neutral-500)' }}>税率：</span>{inv.taxRate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DrawerSection>
          </>
        )}
      </DetailDrawer>

      {/* 新增抽屉 */}
      {showAddDrawer && <AddPlatformDrawer onCancel={() => setShowAddDrawer(false)} onSave={item => { setData(prev => [item, ...prev]); setShowAddDrawer(false); }} existingCodes={data.map(p => p.code)} />}
    </div>
  );
}

/* ── 新增平台抽屉 ── */
function AddPlatformDrawer({ onCancel, onSave, existingCodes }: { onCancel: () => void; onSave: (item: PlatformItem) => void; existingCodes: string[] }) {
  const [form, setForm] = useState<Partial<PlatformItem>>({
    name: '', shortName: '', contactPerson: '', contactPosition: '', contactPhone: '', contactAddress: '',
    cooperationDate: new Date().toISOString().slice(0, 10), status: 'active',
    bankAccounts: [], invoiceInfos: [], remark: '',
  });
  const [bankAccounts, setBankAccounts] = useState<PlatformBankAccount[]>([]);
  const [invoiceInfos, setInvoiceInfos] = useState<PlatformInvoiceInfo[]>([]);
  const [newBank, setNewBank] = useState<PlatformBankAccount>({ accountName: '', accountNo: '', bankName: '', bankNo: '' });
  const [newInvoice, setNewInvoice] = useState<PlatformInvoiceInfo>({ invoiceEntity: '', taxNo: '', taxRate: '' });

  const update = <K extends keyof PlatformItem>(k: K, v: PlatformItem[K]) => setForm(prev => ({ ...prev, [k]: v }));
  const canSave = (form.name?.trim().length ?? 0) > 0 && (form.shortName?.trim().length ?? 0) > 0;

  const addBankAccount = () => {
    if (bankAccounts.length >= 5 || !newBank.accountName) return;
    setBankAccounts(prev => [...prev, { ...newBank }]);
    setNewBank({ accountName: '', accountNo: '', bankName: '', bankNo: '' });
  };
  const addInvoiceInfo = () => {
    if (invoiceInfos.length >= 5 || !newInvoice.invoiceEntity) return;
    setInvoiceInfos(prev => [...prev, { ...newInvoice }]);
    setNewInvoice({ invoiceEntity: '', taxNo: '', taxRate: '' });
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: `p_${Date.now()}`, name: form.name!, shortName: form.shortName!, code: generatePlatformCode(form.shortName!, existingCodes),
      contactPerson: form.contactPerson ?? '', contactPosition: form.contactPosition ?? '', contactPhone: form.contactPhone ?? '', contactAddress: form.contactAddress ?? '',
      cooperationDate: form.cooperationDate ?? new Date().toISOString().slice(0, 10),
      bankAccounts, invoiceInfos, status: 'active', remark: form.remark,
    } as PlatformItem);
  };

  return (
    <div className="drawer-overlay" onClick={onCancel}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-title">新增平台</span>
          <button className="drawer-close" onClick={onCancel}><svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>
        </div>
        <div className="drawer-body">
          <SectionTitle>基本信息</SectionTitle>
          <div style={grid2}>
            <Field label="平台名称 *"><input className="filter-input" style={{ width: '100%' }} value={form.name ?? ''} onChange={e => update('name', e.target.value)} placeholder="请输入平台全称" /></Field>
            <Field label="平台简称 *"><input className="filter-input" style={{ width: '100%' }} value={form.shortName ?? ''} onChange={e => update('shortName', e.target.value)} placeholder="如：京东慧采" /></Field>
            <Field label="联系人"><input className="filter-input" style={{ width: '100%' }} value={form.contactPerson ?? ''} onChange={e => update('contactPerson', e.target.value)} /></Field>
            <Field label="联系人职务"><input className="filter-input" style={{ width: '100%' }} value={form.contactPosition ?? ''} onChange={e => update('contactPosition', e.target.value)} placeholder="如：采购总监" /></Field>
            <Field label="联系电话"><input className="filter-input" style={{ width: '100%' }} value={form.contactPhone ?? ''} onChange={e => update('contactPhone', e.target.value)} /></Field>
            <Field label="联系地址" full><input className="filter-input" style={{ width: '100%' }} value={form.contactAddress ?? ''} onChange={e => update('contactAddress', e.target.value)} /></Field>
            <Field label="合作日期"><input className="filter-input" style={{ width: '100%' }} type="date" value={form.cooperationDate ?? ''} onChange={e => update('cooperationDate', e.target.value)} /></Field>
            <Field label="支付保证金（元）"><input className="filter-input" style={{ width: '100%' }} type="number" value={form.deposit ?? ''} onChange={e => update('deposit', e.target.value === '' ? undefined : Number(e.target.value))} placeholder="平台交纳的保证金金额" /></Field>
            <Field label="保证金应收日期"><input className="filter-input" style={{ width: '100%' }} type="date" value={form.depositDueDate ?? ''} onChange={e => update('depositDueDate', e.target.value || undefined)} /></Field>
            <Field label="备注" full><input className="filter-input" style={{ width: '100%' }} value={form.remark ?? ''} onChange={e => update('remark', e.target.value)} /></Field>
          </div>

          <SectionTitle>结算账户（{bankAccounts.length}/5）</SectionTitle>
          {bankAccounts.map((ba, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              <span style={{ fontWeight: 'var(--font-medium)' }}>{ba.accountName}</span>
              <span className="mono" style={{ color: 'var(--color-neutral-500)' }}>{ba.accountNo}</span>
              <span style={{ color: 'var(--color-neutral-500)' }}>{ba.bankName}</span>
              <button style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: SECONDARY, cursor: 'pointer', fontSize: 14 }} onClick={() => setBankAccounts(prev => prev.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          {bankAccounts.length < 5 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
              <div><label className="drawer-label">户名 *</label><input className="filter-input" style={{ width: '100%' }} value={newBank.accountName} onChange={e => setNewBank(prev => ({ ...prev, accountName: e.target.value }))} /></div>
              <div><label className="drawer-label">账号</label><input className="filter-input" style={{ width: '100%' }} value={newBank.accountNo} onChange={e => setNewBank(prev => ({ ...prev, accountNo: e.target.value }))} /></div>
              <div><label className="drawer-label">开户行</label><input className="filter-input" style={{ width: '100%' }} value={newBank.bankName} onChange={e => setNewBank(prev => ({ ...prev, bankName: e.target.value }))} /></div>
              <div><label className="drawer-label">行号</label><input className="filter-input" style={{ width: '100%' }} value={newBank.bankNo} onChange={e => setNewBank(prev => ({ ...prev, bankNo: e.target.value }))} /></div>
              <div style={{ gridColumn: '1 / -1' }}><Button size="sm" onClick={addBankAccount} disabled={!newBank.accountName}>+ 添加账户</Button></div>
            </div>
          )}

          <SectionTitle>发票信息（{invoiceInfos.length}/5）</SectionTitle>
          {invoiceInfos.map((inv, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              <span style={{ fontWeight: 'var(--font-medium)' }}>{inv.invoiceEntity}</span>
              <span className="mono" style={{ color: 'var(--color-neutral-500)' }}>{inv.taxNo}</span>
              <span style={{ color: 'var(--color-neutral-500)' }}>{inv.taxRate}</span>
              <button style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: SECONDARY, cursor: 'pointer', fontSize: 14 }} onClick={() => setInvoiceInfos(prev => prev.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          {invoiceInfos.length < 5 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
              <div><label className="drawer-label">发票主体 *</label><input className="filter-input" style={{ width: '100%' }} value={newInvoice.invoiceEntity} onChange={e => setNewInvoice(prev => ({ ...prev, invoiceEntity: e.target.value }))} /></div>
              <div><label className="drawer-label">税号</label><input className="filter-input" style={{ width: '100%' }} value={newInvoice.taxNo} onChange={e => setNewInvoice(prev => ({ ...prev, taxNo: e.target.value }))} /></div>
              <div><label className="drawer-label">税率</label><input className="filter-input" style={{ width: '100%' }} value={newInvoice.taxRate} onChange={e => setNewInvoice(prev => ({ ...prev, taxRate: e.target.value }))} placeholder="6%" /></div>
              <div style={{ gridColumn: '1 / -1' }}><Button size="sm" onClick={addInvoiceInfo} disabled={!newInvoice.invoiceEntity}>+ 添加发票主体</Button></div>
            </div>
          )}
        </div>
        <div className="drawer-footer">
          <Button variant="ghost" onClick={onCancel}>取消</Button>
          <Button onClick={handleSave} disabled={!canSave}>保存</Button>
        </div>
      </div>
    </div>
  );
}

/* ── 通用组件 ── */
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' };
function SectionTitle({ children }: { children: React.ReactNode }) { return <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)', margin: 'var(--space-4) 0 var(--space-3)' }}>{children}</div>; }
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) { return <div style={{ gridColumn: full ? '1 / -1' : undefined }}><label className="drawer-label">{label}</label>{children}</div>; }
function Text({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) { return <div className={className} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-800)', fontWeight: 'var(--font-medium)', ...style }}>{children}</div>; }
function EmptyText({ children }: { children: React.ReactNode }) { return <div style={{ padding: 'var(--space-3)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>{children}</div>; }

/* ── SVG 图标 ── */
function IconPlatform() { return <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M6 5V3.5A1.5 1.5 0 017.5 2h3A1.5 1.5 0 0112 3.5V5" stroke="currentColor" strokeWidth="1.3" /><path d="M9 8v2M8 9h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>; }
function IconActive() { return <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.3" /><path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconPercent() { return <svg viewBox="0 0 18 18" fill="none"><circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.3" /><circle cx="11.5" cy="11.5" r="2" stroke="currentColor" strokeWidth="1.3" /><path d="M13 5L5 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>; }
function IconBank() { return <svg viewBox="0 0 18 18" fill="none"><path d="M9 2l7 4H2l7-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M3 6v8h12V6M6 6v8M12 6v8M3 14h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>; }
