import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusTag from '../../components/common/StatusTag';
import { useSupplierStore } from '../../stores/supplierStore';
import { brandItems } from '../../data/brands';
import type { NewArrivalReminder, NewArrivalStatus } from '../../types';

/** 状态 → StatusTag 映射 */
const statusTag = (status: NewArrivalStatus) => {
  switch (status) {
    case 'pending': return <StatusTag variant="warning" label="待处理" />;
    case 'listed': return <StatusTag variant="success" label="已上架" />;
    case 'dismissed': return <StatusTag variant="default" label="已忽略" />;
  }
};

/** 处理弹窗：标记上架 / 忽略（填写处理备注） */
interface HandleDialog {
  reminder: NewArrivalReminder;
  action: 'listed' | 'dismissed';
  note: string;
}

export default function ProductNewArrivals() {
  const arrivalReminders = useSupplierStore(s => s.arrivalReminders);
  const handleArrivalReminder = useSupplierStore(s => s.handleArrivalReminder);

  const [statusTab, setStatusTab] = useState<'' | NewArrivalStatus>('');
  const [keyword, setKeyword] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [dialog, setDialog] = useState<HandleDialog | null>(null);
  const [toast, setToast] = useState('');

  const counts = useMemo(() => ({
    all: arrivalReminders.length,
    pending: arrivalReminders.filter(r => r.status === 'pending').length,
    listed: arrivalReminders.filter(r => r.status === 'listed').length,
    dismissed: arrivalReminders.filter(r => r.status === 'dismissed').length,
  }), [arrivalReminders]);

  const filtered = useMemo(() => arrivalReminders.filter(r => {
    if (statusTab && r.status !== statusTab) return false;
    if (filterBrand && r.brand !== filterBrand) return false;
    if (keyword) {
      const kw = keyword.toLowerCase();
      if (!r.code.toLowerCase().includes(kw)
        && !r.productName.includes(keyword)
        && !r.brand.includes(keyword)
        && !r.supplierName.includes(keyword)
        && !(r.submitter ?? '').includes(keyword)) return false;
    }
    return true;
  }), [arrivalReminders, statusTab, filterBrand, keyword]);

  const openDialog = (reminder: NewArrivalReminder, action: 'listed' | 'dismissed') => {
    setDialog({ reminder, action, note: action === 'listed' ? '已上架至商品管理' : '' });
  };

  const confirmHandle = () => {
    if (!dialog) return;
    handleArrivalReminder(dialog.reminder.id, dialog.action, dialog.note.trim());
    setToast(dialog.action === 'listed'
      ? `已标记「${dialog.reminder.productName}」为已上架`
      : `已忽略「${dialog.reminder.productName}」的提醒`);
    setDialog(null);
    window.setTimeout(() => setToast(''), 2600);
  };

  const reminderBrands = useMemo(
    () => Array.from(new Set(arrivalReminders.map(r => r.brand))).filter(Boolean),
    [arrivalReminders],
  );

  return (
    <>
      <ContentHeader title="新品提醒" breadcrumbs={['商品', '新品提醒']} />
      <div className="content-body">
        {/* 状态 Tab 卡片 */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <button className={`tab-card-simple${statusTab === '' ? ' active' : ''}`} onClick={() => setStatusTab('')}>
            <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><path d="M10 3a5 5 0 015 5v3l2 2H3l2-2V8a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 15a2 2 0 004 0" stroke="currentColor" strokeWidth="1.3"/></svg>
            全部提醒
            <span className="tab-card-simple-count">{counts.all} 条</span>
          </button>
          <button className={`tab-card-simple${statusTab === 'pending' ? ' active' : ''}`} onClick={() => setStatusTab('pending')}>
            <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M10 6v4l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            待处理
            <span className="tab-card-simple-count">{counts.pending} 条</span>
          </button>
          <button className={`tab-card-simple${statusTab === 'listed' ? ' active' : ''}`} onClick={() => setStatusTab('listed')}>
            <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            已上架
            <span className="tab-card-simple-count">{counts.listed} 条</span>
          </button>
          <button className={`tab-card-simple${statusTab === 'dismissed' ? ' active' : ''}`} onClick={() => setStatusTab('dismissed')}>
            <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            已忽略
            <span className="tab-card-simple-count">{counts.dismissed} 条</span>
          </button>
        </div>

        {/* 筛选 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <input
            className="filter-input"
            placeholder="搜索提醒编号、商品名称、合作商、提报人..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          <select className="filter-select" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
            <option value="">全部品牌</option>
            {reminderBrands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', flexShrink: 0 }}>共 {filtered.length} 条提醒</span>
        </div>

        <Card>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-neutral-400)', padding: '48px 0', fontSize: 'var(--text-sm)' }}>
              暂无新品提醒，合作商可在合作商终端「报价」菜单中提报
            </div>
          ) : (
          <Table
            headers={['提醒编号', '品牌', '商品名称', '电商平台链接', '提报合作商', '提报人', '提报时间', '状态', '处理备注', '操作']}
            rows={filtered.map(r => [
              <span className="cell-mono-emph">{r.code}</span>,
              <span className="cell-emph">{r.brand}</span>,
              <span className="cell-emph" title={r.productName}>{r.productName}</span>,
              <a
                href={r.productUrl}
                target="_blank"
                rel="noreferrer"
                className="cell-muted"
                style={{ maxWidth: 240, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom', color: 'var(--color-module-current-base)' }}
                title={r.productUrl}
              >
                {r.productUrl}
              </a>,
              <span>{r.supplierName}</span>,
              <span className="cell-muted">{r.submitter}</span>,
              <span className="cell-muted">{r.submitTime}</span>,
              statusTag(r.status),
              <span className="cell-muted" title={r.handleNote ?? ''}>
                {r.handleNote
                  ? <span style={{ display: 'inline-block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>{r.handleNote}</span>
                  : <span style={{ color: 'var(--color-neutral-300)' }}>—</span>}
                {r.handleTime && <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{r.handleTime}</span>}
              </span>,
              r.status === 'pending' ? (
                <div className="row-actions" style={{ display: 'flex', gap: 'var(--space-2)', whiteSpace: 'nowrap' }}>
                  <Button variant="ghost" size="sm" style={{ color: 'var(--color-module-current-base)' }} onClick={() => openDialog(r, 'listed')}>标记上架</Button>
                  <Button variant="ghost" size="sm" style={{ color: 'var(--color-module-current-secondary)' }} onClick={() => openDialog(r, 'dismissed')}>忽略</Button>
                </div>
              ) : <span className="cell-muted">已处理</span>,
            ])}
          />
          )}
        </Card>

        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 'var(--space-3)', lineHeight: 1.7 }}>
          新品提醒由合作商在合作商终端「报价」菜单中提报：品牌商已经上市、但淡茶半盏平台未上架的商品。处理「标记上架」后请在商品管理中同步建档。
          品牌列表来源于品牌管理（共 {brandItems.length} 个品牌）。
        </div>

        {/* 处理弹窗 */}
        {dialog && (
          <div className="category-dialog-overlay" onClick={() => setDialog(null)}>
            <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ width: 440 }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 4 }}>
                {dialog.action === 'listed' ? '标记为已上架' : '忽略该提醒'}
              </h3>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }}>
                {dialog.reminder.code} · {dialog.reminder.brand} · {dialog.reminder.productName} · 提报方：{dialog.reminder.supplierName}
              </div>
              <label className="drawer-label" style={{ display: 'block', marginBottom: 6 }}>处理备注</label>
              <textarea
                className="detail-textarea"
                rows={3}
                placeholder={dialog.action === 'listed' ? '如：已上架至商品管理-茶叶' : '如：重复提报 / 暂无合作计划'}
                value={dialog.note}
                onChange={e => setDialog(d => d ? { ...d, note: e.target.value } : d)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                <Button variant="ghost" onClick={() => setDialog(null)}>取消</Button>
                <Button variant={dialog.action === 'listed' ? 'primary' : 'danger'} onClick={confirmHandle}>
                  {dialog.action === 'listed' ? '确认上架' : '确认忽略'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 轻提示 */}
        {toast && (
          <div style={{
            position: 'fixed', top: 68, right: 24, zIndex: 1200,
            padding: '10px 18px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)',
            background: 'var(--color-module-current-darkest)', color: '#fff', boxShadow: 'var(--shadow-lg)',
          }}>
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
