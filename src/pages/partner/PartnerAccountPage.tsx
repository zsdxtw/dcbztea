import { useState, useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import type { PartnerAccount } from '../../types';
import { partnerAccounts as initialAccounts, PARTNER_ACCOUNT_ROLE_LABELS } from '../../data/partner';

/** 新增账号表单 */
interface AccountForm {
  username: string;
  name: string;
  role: PartnerAccount['role'];
  phone: string;
}

const EMPTY_FORM: AccountForm = { username: '', name: '', role: 'business', phone: '' };

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  admin: { bg: '#F3E5F5', color: '#7B1FA2' },
  business: { bg: '#E3F2FD', color: '#0F64B5' },
  warehouse: { bg: '#FFF8E1', color: '#B8860B' },
};

/** 合作商系统-账号管理：子账号增删与启停 */
export default function PartnerAccountPage() {
  const [accounts, setAccounts] = useState<PartnerAccount[]>(initialAccounts);
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<PartnerAccount | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AccountForm>(EMPTY_FORM);

  const filtered = useMemo(() => accounts.filter(a => {
    if (keyword && !a.username.includes(keyword) && !a.name.includes(keyword) && !a.phone.includes(keyword)) return false;
    return true;
  }), [accounts, keyword]);

  const addAccount = () => {
    if (!form.username.trim() || !form.name.trim()) return;
    const newAccount: PartnerAccount = {
      id: `pa_${Date.now()}`,
      username: form.username.trim(),
      name: form.name.trim(),
      role: form.role,
      phone: form.phone.trim() || '—',
      status: 'active',
      createTime: new Date().toISOString().slice(0, 10),
    };
    setAccounts(prev => [...prev, newAccount]);
    setShowAdd(false);
    setForm(EMPTY_FORM);
  };

  const toggleStatus = (id: string) => {
    setAccounts(prev => prev.map(a => (a.id === id ? { ...a, status: a.status === 'active' ? 'disabled' : 'active' } : a)));
    setSelected(prev => (prev && prev.id === id ? { ...prev, status: prev.status === 'active' ? 'disabled' : 'active' } : prev));
  };

  return (
    <>
      <ContentHeader title="账号管理" breadcrumbs={['合作商终端', '系统', '账号管理']} />
      <div className="content-body">
        {/* 筛选 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <input className="filter-input" placeholder="搜索账号、姓名、手机号..." value={keyword} onChange={e => setKeyword(e.target.value)} />
          <Button onClick={() => { setForm(EMPTY_FORM); setShowAdd(true); }}>
            <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            新增账号
          </Button>
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>共 {filtered.length} 个账号</span>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['账号', '姓名', '角色', '手机号', '状态', '创建时间', '最近登录', '操作']}
            rows={filtered.map(a => [
              <span key="u" className="cell-mono-emph">{a.username}</span>,
              <span key="n" className="cell-emph">{a.name}</span>,
              <span key="r" style={{
                padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                background: ROLE_STYLE[a.role].bg, color: ROLE_STYLE[a.role].color,
              }}>{PARTNER_ACCOUNT_ROLE_LABELS[a.role]}</span>,
              <span key="p" className="mono cell-muted">{a.phone}</span>,
              <span key="st" style={{
                padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                background: a.status === 'active' ? '#E8F5E9' : '#FFEBEE',
                color: a.status === 'active' ? '#01795D' : '#C62828',
              }}>{a.status === 'active' ? '启用' : '停用'}</span>,
              <span key="c" className="cell-muted">{a.createTime}</span>,
              <span key="l" className="cell-muted">{a.lastLogin || '—'}</span>,
              <div key="act" className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => setSelected(a)}>查看</Button>
                <Button size="sm" variant="ghost" onClick={() => toggleStatus(a.id)}>{a.status === 'active' ? '停用' : '启用'}</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      {/* 账号详情抽屉 */}
      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        badge="AC"
        title={selected?.username ?? ''}
        statusTag={selected ? (
          <span style={{
            padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
            background: selected.status === 'active' ? '#E8F5E9' : '#FFEBEE',
            color: selected.status === 'active' ? '#01795D' : '#C62828',
          }}>{selected.status === 'active' ? '启用' : '停用'}</span>
        ) : null}
        subtitle={selected ? `${selected.name} · ${PARTNER_ACCOUNT_ROLE_LABELS[selected.role]}` : ''}
      >
        {selected && (
          <DrawerSection title="账号信息">
            <InfoGrid>
              <InfoItem label="账号" mono emph>{selected.username}</InfoItem>
              <InfoItem label="姓名">{selected.name}</InfoItem>
              <InfoItem label="角色">{PARTNER_ACCOUNT_ROLE_LABELS[selected.role]}</InfoItem>
              <InfoItem label="手机号" mono>{selected.phone}</InfoItem>
              <InfoItem label="状态">{selected.status === 'active' ? '启用' : '停用'}</InfoItem>
              <InfoItem label="创建时间">{selected.createTime}</InfoItem>
              <InfoItem label="最近登录" span={3}>{selected.lastLogin || '—'}</InfoItem>
            </InfoGrid>
          </DrawerSection>
        )}
      </DetailDrawer>

      {/* 新增账号弹窗 */}
      {showAdd && (
        <div className="category-dialog-overlay" onClick={() => setShowAdd(false)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ width: 460 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>新增账号</div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>账号 *</label>
              <input className="filter-input" placeholder="登录账号，如 sales02" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>姓名 *</label>
              <input className="filter-input" placeholder="请输入姓名" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>角色</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {(['admin', 'business', 'warehouse'] as PartnerAccount['role'][]).map(r => (
                  <button key={r} onClick={() => setForm({ ...form, role: r })}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', cursor: 'pointer',
                      border: `1px solid ${form.role === r ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
                      background: form.role === r ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
                      color: form.role === r ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
                      fontWeight: form.role === r ? 'var(--font-medium)' : 'normal',
                    }}>{PARTNER_ACCOUNT_ROLE_LABELS[r]}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>手机号</label>
              <input className="filter-input" placeholder="请输入手机号" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>取消</Button>
              <Button onClick={addAccount} disabled={!form.username.trim() || !form.name.trim()}>保存</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
