import { useState, useMemo, useEffect } from 'react';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import Pagination from '../../components/common/Pagination';
import { PageHead, Pill } from './PartnerUI';
import { getPartnerAuth } from './PartnerLayout';
import { useReturnStore } from '../../stores/returnStore';
import { useSupplierStore } from '../../stores/supplierStore';
import type { PartnerReturn, PartnerReturnStatus } from '../../types';
import './partner.css';

const money = (n: number) => `¥${n.toLocaleString()}`;

/** 状态 Tab（待处理 = 待受理+已寄回+已收货；已结束 = 已完成/已拒绝） */
const STATUS_TABS: { key: PartnerReturnStatus | ''; label: string }[] = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待受理' },
  { key: 'accepted', label: '已受理·待寄回' },
  { key: 'shipped', label: '已寄回·待收货' },
  { key: 'received', label: '已收货·待处理' },
  { key: 'completed', label: '已完成' },
  { key: 'rejected', label: '已拒绝' },
];

const STATUS_TONE: Record<PartnerReturnStatus, 'amber' | 'blue' | 'purple' | 'green' | 'gray' | 'red'> = {
  pending: 'amber',
  accepted: 'blue',
  shipped: 'purple',
  received: 'blue',
  completed: 'green',
  rejected: 'red',
};
const STATUS_LABELS: Record<PartnerReturnStatus, string> = {
  pending: '待受理', accepted: '已受理', shipped: '客户已寄回', received: '已收货', completed: '已完成', rejected: '已拒绝',
};

/** 登记退货草稿 */
interface ReturnDraft {
  sourceOrderCode: string;
  customerName: string;
  productName: string;
  spec: string;
  price: string;
  quantity: string;
  reason: string;
  solution: 'refund' | 'exchange';
  refundAmount: string;
}

const EMPTY_DRAFT: ReturnDraft = {
  sourceOrderCode: '', customerName: '', productName: '', spec: '', price: '', quantity: '',
  reason: '', solution: 'refund', refundAmount: '',
};

/** 合作商退货管理：处理客户退货（受理 → 收货 → 退款/换货完成） */
export default function PartnerReturns() {
  const returns = useReturnStore((s) => s.returns);
  const addReturn = useReturnStore((s) => s.addReturn);
  const setStatus = useReturnStore((s) => s.setStatus);
  const removeReturn = useReturnStore((s) => s.removeReturn);
  const suppliers = useSupplierStore((s) => s.suppliers);

  const myId = useMemo(() => {
    const auth = getPartnerAuth();
    return auth?.supplierId ?? suppliers.find((s) => s.terminal.enabled && s.terminal.username === auth?.username)?.id ?? '';
  }, [suppliers]);

  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<PartnerReturnStatus | ''>('');
  const [selected, setSelected] = useState<PartnerReturn | null>(null);
  /** 登记弹窗 */
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<ReturnDraft>(EMPTY_DRAFT);
  const [draftErr, setDraftErr] = useState('');
  /** 完成处理弹窗（退款/换货确认） */
  const [finishOf, setFinishOf] = useState<PartnerReturn | null>(null);
  const [finishNote, setFinishNote] = useState('');
  const [msg, setMsg] = useState('');
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 3200); };
  /** 分页 */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const mine = useMemo(() => returns.filter((r) => r.supplierId === myId), [returns, myId]);

  const filtered = useMemo(() => {
    const kw = keyword.trim();
    return mine.filter((r) => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (kw && !r.code.includes(kw) && !r.sourceOrderCode.includes(kw) && !r.customerName.includes(kw) && !r.reason.includes(kw)) return false;
      return true;
    });
  }, [mine, keyword, filterStatus]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { '': mine.length };
    STATUS_TABS.forEach((t) => { if (t.key) c[t.key] = mine.filter((r) => r.status === t.key).length; });
    return c;
  }, [mine]);

  const pagedRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [keyword, filterStatus, pageSize]);

  const saveDraft = () => {
    if (!draft.sourceOrderCode.trim()) { setDraftErr('请输入关联销售单号'); return; }
    if (!draft.customerName.trim()) { setDraftErr('请输入客户名称'); return; }
    if (!draft.productName.trim()) { setDraftErr('请输入退货商品名称'); return; }
    const qty = Number(draft.quantity);
    const price = Number(draft.price);
    if (!Number.isInteger(qty) || qty <= 0) { setDraftErr('请输入有效的退货数量'); return; }
    if (!Number.isFinite(price) || price <= 0) { setDraftErr('请输入有效的商品单价'); return; }
    const refund = draft.solution === 'refund' ? Number(draft.refundAmount || qty * price) : qty * price;
    if (!Number.isFinite(refund) || refund <= 0) { setDraftErr('请输入有效的退款金额'); return; }
    if (!draft.reason.trim()) { setDraftErr('请输入退货原因'); return; }
    const supplier = suppliers.find((s) => s.id === myId);
    const created = addReturn({
      supplierId: myId,
      supplierName: supplier?.name ?? '',
      sourceOrderCode: draft.sourceOrderCode.trim(),
      customerName: draft.customerName.trim(),
      reason: draft.reason.trim(),
      items: [{ productName: draft.productName.trim(), spec: draft.spec.trim() || '—', price, quantity: qty }],
      refundAmount: refund,
      solution: draft.solution,
    });
    flash(`退货单 ${created.code} 已登记（待受理）`);
    setAddOpen(false);
    setDraft(EMPTY_DRAFT);
    setDraftErr('');
  };

  const statusPill = (st: PartnerReturnStatus) => <Pill tone={STATUS_TONE[st]}>{STATUS_LABELS[st]}</Pill>;
  const solutionPill = (r: PartnerReturn) => (
    <Pill tone={r.solution === 'refund' ? 'green' : 'purple'}>{r.solution === 'refund' ? '退款' : '换货'}</Pill>
  );

  /** 行操作：按状态推进 */
  const rowActions = (r: PartnerReturn) => {
    switch (r.status) {
      case 'pending':
        return (
          <>
            <Button size="sm" onClick={() => { setStatus(r.id, 'accepted', `${r.solution === 'refund' ? '退款' : '换货'}处理 · 请客户寄回商品`); flash(`退货单 ${r.code} 已受理`); }}>受理</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>查看</Button>
          </>
        );
      case 'accepted':
        return <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>查看</Button>;
      case 'shipped':
        return (
          <>
            <Button size="sm" onClick={() => { setStatus(r.id, 'received', '退货商品已签收，待质检确认'); flash(`退货单 ${r.code} 已确认收货`); }}>确认收货</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>查看</Button>
          </>
        );
      case 'received':
        return (
          <>
            <Button size="sm" onClick={() => { setFinishOf(r); setFinishNote(''); }}>完成处理</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>查看</Button>
          </>
        );
      default:
        return <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>查看</Button>;
    }
  };

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 退货"
        title="退货管理"
        desc="处理客户退货：受理客户申请 → 客户寄回 → 确认收货质检 → 完成退款/换货。"
      />

      {/* 状态 Tab */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        {STATUS_TABS.map((t) => (
          <button key={t.key || 'all'} className={`tab-card-simple${filterStatus === t.key ? ' active' : ''}`} style={{ transition: 'none' }} onClick={() => setFilterStatus(t.key)}>
            {t.label}
            <span className="tab-card-simple-count">{statusCounts[t.key] ?? 0} 单</span>
          </button>
        ))}
      </div>

      {msg && <div style={{ marginBottom: 'var(--space-3)', padding: '8px 14px', background: '#E8F5E9', color: '#01795D', borderRadius: 10, fontSize: 13, fontWeight: 500 }}>{msg}</div>}

      <div className="pk-panel">
        <div className="pk-panel-head" style={{ flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' }}>
          <input className="filter-input" placeholder="搜索退货编号、销售单号、客户、原因..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 220, height: 32, fontSize: 13 }} />
        </div>
        <div className="pk-panel-body">
        <div className="pk-table-panel" style={{ margin: 0 }}>
          <table>
            <thead>
              <tr>
                <th>序号</th><th>退货编号</th><th>关联销售单</th><th>客户</th><th>退货商品</th>
                <th>退款金额</th><th>方案</th><th>状态</th><th>申请时间</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((r, idx) => (
                <tr key={r.id}>
                  <td className="mono" style={{ color: 'var(--pk-ink3)' }}>{(page - 1) * pageSize + idx + 1}</td>
                  <td className="cell-mono-emph">{r.code}</td>
                  <td className="mono" style={{ fontSize: 13 }}>{r.sourceOrderCode}</td>
                  <td className="cell-emph">{r.customerName}</td>
                  <td style={{ fontSize: 13 }}>{r.items.map((i) => `${i.productName}×${i.quantity}`).join('、')}</td>
                  <td className="mono" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--pk-accent)' }}>{money(r.refundAmount)}</td>
                  <td>{solutionPill(r)}</td>
                  <td>{statusPill(r.status)}</td>
                  <td className="cell-muted">{r.applyTime}</td>
                  <td><div className="row-actions">{rowActions(r)}</div></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--pk-ink3)', padding: '28px 0' }}>暂无{filterStatus ? STATUS_LABELS[filterStatus] : ''}退货单</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {(filtered.length > 0) && (
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} label="张退货单" />
        )}
        </div>
      </div>

      {/* 详情抽屉 */}
      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        badge="TH"
        title={selected?.code ?? ''}
        statusTag={selected ? <>{statusPill(selected.status)}{solutionPill(selected)}</> : null}
        subtitle={selected ? `${selected.customerName} · 关联销售单 ${selected.sourceOrderCode} · ${selected.applyTime}` : ''}
        hideFooter
        footer={<Button variant="ghost" onClick={() => setSelected(null)}>关闭</Button>}
      >
        {selected && (
          <>
            <DrawerSection title="退货信息">
              <InfoGrid>
                <InfoItem label="退货编号" mono emph>{selected.code}</InfoItem>
                <InfoItem label="关联销售单" mono>{selected.sourceOrderCode}</InfoItem>
                <InfoItem label="客户名称">{selected.customerName}</InfoItem>
                <InfoItem label="处理方案">{selected.solution === 'refund' ? '退款' : '换货'}</InfoItem>
                <InfoItem label="退款金额" mono emph valueStyle={{ color: 'var(--color-module-current-base)' }}>{money(selected.refundAmount)}</InfoItem>
                <InfoItem label="当前状态">{STATUS_LABELS[selected.status]}</InfoItem>
                <InfoItem label="申请时间">{selected.applyTime}</InfoItem>
                <InfoItem label="受理时间">{selected.acceptTime ?? '—'}</InfoItem>
                <InfoItem label="完成时间">{selected.finishTime ?? '—'}</InfoItem>
                <InfoItem label="退货原因" span={3}>{selected.reason}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title={`退货商品（${selected.items.length} 种）`}>
              <table className="detail-inline-table">
                <thead><tr><th>商品名称</th><th>规格</th><th>单价</th><th>退货数量</th><th>小计</th></tr></thead>
                <tbody>
                  {selected.items.map((it, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                      <td>{it.spec}</td>
                      <td className="mono">{money(it.price)}</td>
                      <td className="mono">{it.quantity}</td>
                      <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(it.price * it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DrawerSection>

            <DrawerSection title="处理轨迹">
              <table className="detail-inline-table">
                <thead><tr><th>时间</th><th>动作</th><th>说明</th></tr></thead>
                <tbody>
                  {selected.history.map((h, i) => (
                    <tr key={i}>
                      <td className="mono" style={{ whiteSpace: 'nowrap' }}>{h.time}</td>
                      <td style={{ fontWeight: 'var(--font-medium)', whiteSpace: 'nowrap' }}>{h.action}</td>
                      <td style={{ color: 'var(--color-neutral-500)' }}>{h.detail || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>

      {/* 登记退货弹窗 */}
      {addOpen && (
        <div className="category-dialog-overlay" onClick={() => setAddOpen(false)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: '94vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>登记客户退货</h3>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
                <div>
                  <label className="drawer-label" style={{ display: 'block', marginBottom: 6 }}>关联销售单号 *</label>
                  <input className="filter-input mono" style={{ width: '100%' }} placeholder="如 DXS202610210008" value={draft.sourceOrderCode} onChange={(e) => { setDraft((d) => ({ ...d, sourceOrderCode: e.target.value })); setDraftErr(''); }} />
                </div>
                <div>
                  <label className="drawer-label" style={{ display: 'block', marginBottom: 6 }}>客户名称 *</label>
                  <input className="filter-input" style={{ width: '100%' }} placeholder="客户名称" value={draft.customerName} onChange={(e) => { setDraft((d) => ({ ...d, customerName: e.target.value })); setDraftErr(''); }} />
                </div>
                <div>
                  <label className="drawer-label" style={{ display: 'block', marginBottom: 6 }}>退货商品 *</label>
                  <input className="filter-input" style={{ width: '100%' }} placeholder="商品名称" value={draft.productName} onChange={(e) => { setDraft((d) => ({ ...d, productName: e.target.value })); setDraftErr(''); }} />
                </div>
                <div>
                  <label className="drawer-label" style={{ display: 'block', marginBottom: 6 }}>规格</label>
                  <input className="filter-input" style={{ width: '100%' }} placeholder="如 250g/罐" value={draft.spec} onChange={(e) => setDraft((d) => ({ ...d, spec: e.target.value }))} />
                </div>
                <div>
                  <label className="drawer-label" style={{ display: 'block', marginBottom: 6 }}>单价（元）*</label>
                  <input className="filter-input mono" type="number" min={0} style={{ width: '100%' }} value={draft.price} onChange={(e) => { setDraft((d) => ({ ...d, price: e.target.value })); setDraftErr(''); }} />
                </div>
                <div>
                  <label className="drawer-label" style={{ display: 'block', marginBottom: 6 }}>退货数量 *</label>
                  <input className="filter-input mono" type="number" min={1} style={{ width: '100%' }} value={draft.quantity} onChange={(e) => { setDraft((d) => ({ ...d, quantity: e.target.value })); setDraftErr(''); }} />
                </div>
              </div>
              <div>
                <label className="drawer-label" style={{ display: 'block', marginBottom: 6 }}>处理方案 *</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {([['refund', '退款', '确认收货后原路/协商退款'], ['exchange', '换货', '确认收货后重新发货']] as const).map(([k, label, desc]) => (
                    <label key={k} style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', border: `1px solid ${draft.solution === k ? '#01795D' : 'var(--color-neutral-200)'}`, background: draft.solution === k ? '#E6F2ED' : 'transparent' }}>
                      <input type="radio" name="ret-solution" checked={draft.solution === k} onChange={() => setDraft((d) => ({ ...d, solution: k }))} style={{ marginTop: 3 }} />
                      <span>
                        <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{label}</span>
                        <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 2 }}>{desc}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {draft.solution === 'refund' && (
                <div>
                  <label className="drawer-label" style={{ display: 'block', marginBottom: 6 }}>退款金额（元）</label>
                  <input className="filter-input mono" type="number" min={0} style={{ width: 180 }} placeholder={`默认 ${Number(draft.price || 0) * Number(draft.quantity || 0)}`} value={draft.refundAmount} onChange={(e) => setDraft((d) => ({ ...d, refundAmount: e.target.value }))} />
                </div>
              )}
              <div>
                <label className="drawer-label" style={{ display: 'block', marginBottom: 6 }}>退货原因 *</label>
                <textarea className="filter-input" style={{ width: '100%', minHeight: 64, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }} placeholder="如：包装破损 / 口味不符 / 临期拒收..." value={draft.reason} onChange={(e) => { setDraft((d) => ({ ...d, reason: e.target.value })); setDraftErr(''); }} />
              </div>
              {draftErr && <div style={{ fontSize: 'var(--text-sm)', color: '#C62828' }}>{draftErr}</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)', flexShrink: 0 }}>
              <button className="pk-reg-cancel" style={{ height: 34, padding: '0 16px', fontSize: 13 }} onClick={() => setAddOpen(false)}>取消</button>
              <button className="pk-reg-submit" style={{ height: 34, padding: '0 18px', fontSize: 13, letterSpacing: 'normal', textIndent: 0 }} onClick={saveDraft}>保存登记</button>
            </div>
          </div>
        </div>
      )}

      {/* 完成处理弹窗（已收货 → 完成） */}
      {finishOf && (
        <div className="category-dialog-overlay" onClick={() => setFinishOf(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: '94vw' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>完成处理 · {finishOf.code}</h3>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-3)', lineHeight: 1.8 }}>
              {finishOf.customerName} · {finishOf.items.map((i) => `${i.productName}×${i.quantity}`).join('、')}<br />
              处理方案：<strong>{finishOf.solution === 'refund' ? `退款 ${money(finishOf.refundAmount)}` : '换货（重新发货）'}</strong>
            </div>
            <div>
              <label className="drawer-label" style={{ display: 'block', marginBottom: 6 }}>处理说明（质检结果 / 退款渠道等）</label>
              <textarea className="filter-input" style={{ width: '100%', minHeight: 64, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }} placeholder={finishOf.solution === 'refund' ? '如：质检通过，原路退回' : '如：已重新发出换货商品（顺丰 SF...）'} value={finishNote} onChange={(e) => setFinishNote(e.target.value)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <Button variant="ghost" onClick={() => setFinishOf(null)}>取消</Button>
              <Button onClick={() => {
                setStatus(finishOf.id, 'completed', finishNote.trim() || (finishOf.solution === 'refund' ? `已退款 ${money(finishOf.refundAmount)}` : '换货商品已发出'));
                flash(`退货单 ${finishOf.code} 已完成处理（${finishOf.solution === 'refund' ? '退款' : '换货'}）`);
                setFinishOf(null);
                setSelected(null);
              }}>确认完成</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
