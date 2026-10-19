import { useMemo, useState } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { PageHead, Pill } from './PartnerUI';
import { getPartnerAuth, setPartnerAuth } from './PartnerLayout';
import { useSupplierStore, getTerminalAccounts } from '../../stores/supplierStore';
import type { SupplierTerminalAccount } from '../../types';

/** 账号编辑表单 */
interface AccountForm {
  username: string;
  name: string;
  phone: string;
  password: string;
  status: 'active' | 'inactive';
}

const EMPTY_FORM: AccountForm = { username: '', name: '', phone: '', password: '', status: 'active' };
const today = () => new Date().toISOString().slice(0, 10);

/**
 * 合作商系统-账号管理：与共享 store 联动（管理后台「终端管理」Tab 同步）
 * - 管理员账号：可新增/修改/删除操作员账号；可修改本人姓名、手机号码、密码；
 *   本人账号名与删除仅支持在管理后台操作
 * - 操作员账号：仅支持查看
 */
export default function PartnerAccountPage() {
  const auth = getPartnerAuth();
  const suppliers = useSupplierStore(s => s.suppliers);
  const updateTerminalAccounts = useSupplierStore(s => s.updateTerminalAccounts);

  const supplier = suppliers.find(s => s.id === auth?.supplierId);
  const isAdmin = auth?.role !== 'operator';
  const accounts: SupplierTerminalAccount[] = supplier && supplier.terminal.enabled
    ? getTerminalAccounts(supplier.terminal)
    : [];

  const [keyword, setKeyword] = useState('');
  /** 当前编辑账号（null=未编辑） */
  const [editing, setEditing] = useState<SupplierTerminalAccount | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  /** 待删除确认的操作员账号 */
  const [deleting, setDeleting] = useState<SupplierTerminalAccount | null>(null);
  const [form, setForm] = useState<AccountForm>(EMPTY_FORM);
  const [error, setError] = useState('');

  const filtered = useMemo(() => accounts.filter(a => {
    if (keyword && !a.username.includes(keyword) && !a.name.includes(keyword) && !a.phone.includes(keyword)) return false;
    return true;
  }), [accounts, keyword]);

  const rolePill = (role: string) => (
    role === 'admin'
      ? <Pill tone="purple">管理员</Pill>
      : <Pill tone="blue">操作员</Pill>
  );
  const statusPill = (status: string) => (
    status === 'active' ? <Pill tone="green">启用</Pill> : <Pill tone="red">停用</Pill>
  );

  /** 打开编辑弹窗 */
  const openEdit = (acc: SupplierTerminalAccount) => {
    setEditing(acc);
    setError('');
    setForm({ username: acc.username, name: acc.name, phone: acc.phone, password: acc.password, status: acc.status });
  };

  /** 保存编辑（管理员改自己：账号名锁定不变；改操作员：全字段可改） */
  const saveEdit = () => {
    if (!supplier || !editing) return;
    if (!form.name.trim()) return setError('请填写姓名');
    if (editing.role === 'operator' && !form.username.trim()) return setError('请填写登录账号');
    if (form.username.trim() !== editing.username && accounts.some(a => a.id !== editing.id && a.username === form.username.trim())) {
      return setError('该账号名已存在，请更换');
    }
    const next = accounts.map(a => a.id === editing.id ? {
      ...a,
      username: editing.role === 'admin' ? a.username : form.username.trim(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      password: form.password,
      status: editing.role === 'admin' ? a.status : form.status,
    } : a);
    updateTerminalAccounts(supplier.id, next);
    // 修改本人信息时同步登录态姓名，侧边栏下次进入生效
    if (auth && editing.id === auth.accountId && form.name.trim() !== auth.name) {
      setPartnerAuth({ ...auth, name: form.name.trim() });
    }
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  /** 新增操作员账号 */
  const saveAdd = () => {
    if (!supplier) return;
    if (!form.username.trim()) return setError('请填写登录账号');
    if (!form.name.trim()) return setError('请填写姓名');
    if (!form.password.trim()) return setError('请填写登录密码');
    if (accounts.some(a => a.username === form.username.trim())) return setError('该账号名已存在，请更换');
    const newAcc: SupplierTerminalAccount = {
      id: `ta_${Date.now()}`,
      role: 'operator',
      username: form.username.trim(),
      password: form.password,
      name: form.name.trim(),
      phone: form.phone.trim(),
      status: form.status,
      createTime: today(),
    };
    updateTerminalAccounts(supplier.id, [...accounts, newAcc]);
    setShowAdd(false);
    setForm(EMPTY_FORM);
    setError('');
  };

  /** 删除操作员账号 */
  const confirmDelete = () => {
    if (!supplier || !deleting) return;
    updateTerminalAccounts(supplier.id, accounts.filter(a => a.id !== deleting.id));
    setDeleting(null);
  };

  /** 终端未开通或登录态未关联供应商 */
  if (!supplier || !supplier.terminal.enabled) {
    return (
      <div className="pk-page">
        <PageHead eyebrow="合作商终端 · 设置" title="账号管理" desc="管理合作商终端的登录账号。" />
        <div style={{ textAlign: 'center', padding: 'var(--space-10) var(--space-4)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', lineHeight: 1.8 }}>
          终端未开通或登录态已失效，<br />请重新登录后再试。
        </div>
      </div>
    );
  }

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 设置"
        title="账号管理"
        desc={isAdmin
          ? '管理员可自主新增、修改、删除操作员账号；本人姓名、手机号码、密码可在此修改，账号名与删除仅支持在管理后台操作。'
          : '当前为操作员账号，仅支持查看账号列表；如需调整请联系管理员。'}
        actions={isAdmin ? (
          <Button onClick={() => { setForm(EMPTY_FORM); setError(''); setShowAdd(true); }}>
            <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            新增操作员账号
          </Button>
        ) : undefined}
      />

      {/* 筛选 */}
      <div className="pk-toolbar">
        <input className="filter-input" placeholder="搜索账号、姓名、手机号..." value={keyword} onChange={e => setKeyword(e.target.value)} />
        <span className="pk-count">共 {filtered.length} 个账号（管理员 1 · 操作员 {Math.max(0, accounts.length - 1)}）</span>
      </div>

      <div className="pk-table-panel">
        <Table
          headers={['角色', '账号', '姓名', '手机号码', '状态', '创建时间', '最近登录', ...(isAdmin ? ['操作'] : [])]}
          rows={filtered.map(a => [
            <span key="r">{rolePill(a.role)}</span>,
            <span key="u" className="cell-mono-emph">{a.username || '—'}</span>,
            <span key="n" className="cell-emph">{a.name || '—'}</span>,
            <span key="p" className="mono cell-muted">{a.phone || '—'}</span>,
            <span key="s">{statusPill(a.status)}</span>,
            <span key="c" className="cell-muted">{a.createTime || '—'}</span>,
            <span key="l" className="cell-muted">{a.lastLogin || '—'}</span>,
            ...(isAdmin ? [
              <div key="act" className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => openEdit(a)}>编辑</Button>
                {a.role === 'operator' && (
                  <Button size="sm" variant="ghost" style={{ color: 'var(--color-semantic-error)' }} onClick={() => setDeleting(a)}>删除</Button>
                )}
              </div>,
            ] : []),
          ])}
        />
      </div>

      {/* 编辑账号弹窗 */}
      {editing && (
        <div className="category-dialog-overlay" onClick={() => setEditing(null)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ width: 460 }}>
            <div className="pk-dialog-title">{editing.role === 'admin' ? '修改管理员账号（本人）' : '修改操作员账号'}</div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>账号{editing.role === 'admin' ? '' : ' *'}</label>
              <input className="filter-input" placeholder="登录账号" value={form.username} disabled={editing.role === 'admin'}
                onChange={e => setForm({ ...form, username: e.target.value })} style={{ width: '100%' }} />
              {editing.role === 'admin' && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>管理员账号名仅支持在管理后台修改</div>
              )}
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>姓名 *</label>
              <input className="filter-input" placeholder="请输入姓名" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>手机号码</label>
              <input className="filter-input" placeholder="请输入手机号码" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>登录密码 *</label>
              <input className="filter-input" placeholder="设置登录密码" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>账号状态</label>
              {editing.role === 'admin' ? (
                <>
                  <div style={{ padding: '8px 12px', border: '1px solid var(--pk-line)', borderRadius: '9px', fontSize: 'var(--text-sm)', color: 'var(--pk-ink2)', background: '#FAFBFA' }}>启用（本人账号状态仅支持在管理后台调整）</div>
                </>
              ) : (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {(['active', 'inactive'] as const).map(s => (
                    <button key={s} onClick={() => setForm({ ...form, status: s })}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: '9px', fontSize: 'var(--text-sm)', cursor: 'pointer',
                        border: `1px solid ${form.status === s ? 'var(--pk-accent)' : 'var(--pk-line)'}`,
                        background: form.status === s ? 'var(--pk-accent-soft)' : '#fff',
                        color: form.status === s ? 'var(--pk-accent-dark)' : 'var(--pk-ink2)',
                        fontWeight: form.status === s ? 600 : 400,
                      }}>{s === 'active' ? '启用' : '停用'}</button>
                  ))}
                </div>
              )}
            </div>

            {error && <div style={{ fontSize: 'var(--text-xs)', color: '#CB405D', marginBottom: 'var(--space-3)' }}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setEditing(null)}>取消</Button>
              <Button onClick={saveEdit}>保存</Button>
            </div>
          </div>
        </div>
      )}

      {/* 新增操作员账号弹窗 */}
      {showAdd && (
        <div className="category-dialog-overlay" onClick={() => setShowAdd(false)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ width: 460 }}>
            <div className="pk-dialog-title">新增操作员账号</div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>账号 *</label>
              <input className="filter-input" placeholder="登录账号，如 sales02" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>姓名 *</label>
              <input className="filter-input" placeholder="请输入姓名" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>手机号码</label>
              <input className="filter-input" placeholder="请输入手机号码" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>登录密码 *</label>
              <input className="filter-input" placeholder="设置登录密码" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ width: '100%' }} />
            </div>

            {error && <div style={{ fontSize: 'var(--text-xs)', color: '#CB405D', marginBottom: 'var(--space-3)' }}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>取消</Button>
              <Button onClick={saveAdd}>保存</Button>
            </div>
          </div>
        </div>
      )}

      {/* 删除操作员账号确认弹窗 */}
      {deleting && (
        <div className="category-dialog-overlay" onClick={() => setDeleting(null)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ width: 420 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>删除操作员账号</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              账号 <b className="mono">{deleting.username}</b>（{deleting.name || '未命名'}）删除后无法恢复，确认删除？
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setDeleting(null)}>取消</Button>
              <Button variant="danger" onClick={confirmDelete}>确认删除</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
