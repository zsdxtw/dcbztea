/**
 * 销售 · 客户对账（应收结算一级单据工作台）
 * 对账单手工生成（默认账期仅作参考）：生成 → 客户确认 → 部分开票（多张发票累计覆盖）→
 * 部分收款（多笔到账核销，预付客户可选钱包余额支付）→ 退货冲减 → 核销回写履约单 → 已办结。
 * 设计见 docs/销售单结算流程设计建议.md 第四节。
 */
import { useMemo, useState, type ReactNode } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusTag from '../../components/common/StatusTag';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import {
  useSettlementStore, settleTargetOf, statementAmountOf, statementOfOrder,
  netOf, invoicedOf, receivedOf,
} from '../../stores/settlementStore';
import { RECEIPT_METHOD_LABELS } from '../../types';
import type { CustomerStatement, ExternalOrder, ReceiptMethod, StatementStatus } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const STATUS_VARIANT: Record<StatementStatus, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  pending: 'warning', reconciling: 'info', confirmed: 'success', disputed: 'error', closed: 'default',
};
const STATUS_LABELS: Record<StatementStatus, string> = {
  pending: '待对账', reconciling: '对账中', confirmed: '已确认', disputed: '有异议', closed: '已办结',
};

type DialogKind = 'invoice' | 'receipt' | 'adjust' | 'dispute' | 'recharge' | null;

export default function SalesReconciliation() {
  const orders = useOrderFlowStore((s) => s.orders);
  const statements = useSettlementStore((s) => s.statements);
  const wallets = useSettlementStore((s) => s.wallets);
  const store = useSettlementStore;
  const [msg, setMsg] = useState('');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [customer, setCustomer] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [genOpen, setGenOpen] = useState(false);

  /** 弹窗（开票 / 收款 / 冲减 / 异议 / 钱包充值） */
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [form, setForm] = useState<{ invoiceNo: string; amount: string; date: string; method: ReceiptMethod; remark: string; reason: string }>({
    invoiceNo: '', amount: '', date: new Date().toISOString().slice(0, 10), method: 'bank', remark: '', reason: '',
  });

  /** 生成对账单弹窗 */
  const [genTarget, setGenTarget] = useState('');
  const [genPeriod, setGenPeriod] = useState('');
  const [genPicked, setGenPicked] = useState<Set<string>>(new Set());

  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 4200); };
  const run = (res: { ok: boolean; msg: string }) => { flash(res.msg); if (res.ok) setDialog(null); };

  /** 可纳入对账单的履约单：已确收、未取消、未在任何对账单中 */
  const eligibleOrders = useMemo(() => orders.filter((o) => (
    o.processStatus !== 'cancelled' && o.fulfillment?.stage === 'confirmed' && !statementOfOrder(statements, o.id)
  )), [orders, statements]);
  /** 生成弹窗按结算对象分组 */
  const genGroups = useMemo(() => {
    const map = new Map<string, ExternalOrder[]>();
    for (const o of eligibleOrders) {
      const k = settleTargetOf(o);
      map.set(k, [...(map.get(k) ?? []), o]);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [eligibleOrders]);

  const filtered = useMemo(() => statements.filter((s) => {
    if (status && s.status !== status) return false;
    if (customer && s.settleTarget !== customer) return false;
    const k = keyword.trim();
    if (k) {
      const hit = s.code.includes(k) || s.settleTarget.includes(k) || s.lines.some((l) => l.orderCode.includes(k));
      if (!hit) return false;
    }
    return true;
  }), [statements, status, customer, keyword]);

  const totalNet = statements.reduce((acc, s) => acc + netOf(s), 0);
  const totalInvoiced = statements.reduce((acc, s) => acc + invoicedOf(s), 0);
  const totalReceived = statements.reduce((acc, s) => acc + receivedOf(s), 0);
  const current = selectedId ? statements.find((s) => s.id === selectedId) ?? null : null;
  const currentWallet = current ? wallets.find((w) => w.customerName === current.settleTarget) : undefined;
  const genOrders = genTarget ? (genGroups.find(([k]) => k === genTarget)?.[1] ?? []) : [];
  const genAmount = genOrders.filter((o) => genPicked.has(o.id)).reduce((s, o) => s + statementAmountOf(o), 0);

  const openDialog = (kind: DialogKind) => {
    setForm({ invoiceNo: '', amount: '', date: new Date().toISOString().slice(0, 10), method: 'bank', remark: '', reason: '' });
    setDialog(kind);
  };

  const statusPill = (s: CustomerStatement) => <StatusTag variant={STATUS_VARIANT[s.status]} label={STATUS_LABELS[s.status]} />;

  return (
    <>
      <ContentHeader
        title="客户对账"
        breadcrumbs={['销售', '客户对账']}
        actions={(
          <>
            <Button variant="ghost" onClick={() => openDialog('recharge')}>钱包充值</Button>
            <Button onClick={() => { setGenOpen(true); setGenTarget(''); setGenPeriod(''); setGenPicked(new Set()); }}>新建对账单</Button>
          </>
        )}
      />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          客户结算以<strong>对账单</strong>为一级单据：客户定期要求开票 → 对账确认 → <strong>开票登记</strong>（支持部分开票）→
          <strong>收款登记</strong>（支持部分收款；预付客户可用钱包余额支付）→ 核销回写履约单 → <strong>已办结</strong>。
          对账单按实际情况<strong>手工生成</strong>，默认账期仅作参考；结算对象：直接销售＝客户本人，经平台销售＝平台客户（销平台实价口径）。
        </div>

        {/* 汇总 */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          {[
            { label: '对账净额', value: money(totalNet), hint: `${statements.length} 张对账单` },
            { label: '已开票', value: money(totalInvoiced), hint: '发票累计覆盖' },
            { label: '已收款', value: money(totalReceived), hint: '到账累计核销' },
            { label: '应收余额', value: money(totalNet - totalReceived), hint: '对账净额 − 已收款' },
          ].map((c) => (
            <div key={c.label} style={{ flex: '1 1 200px', border: '1px solid var(--color-neutral-100)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', background: 'var(--color-neutral-50)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{c.label}</div>
              <div className="mono" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginTop: 'var(--space-1)' }}>{c.value}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 'var(--space-1)' }}>{c.hint}</div>
            </div>
          ))}
        </div>

        {msg && (
          <div style={{ marginBottom: 'var(--space-3)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: '#E8F5E9', color: '#01795D' }}>{msg}</div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          <input className="filter-input" placeholder="搜索对账单号、结算对象、履约单号..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 280 }} />
          <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部状态</option>
            {(Object.keys(STATUS_LABELS) as StatementStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABELS[k]}</option>)}
          </select>
          <select className="filter-select" value={customer} onChange={(e) => setCustomer(e.target.value)}>
            <option value="">全部结算对象</option>
            {[...new Set(statements.map((s) => s.settleTarget))].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['对账单号', '结算对象', '客户类型', '账期', '明细', '对账净额', '已开票', '已收款', '应收余额', '状态', '操作']}
            rows={filtered.map((s) => {
              const net = netOf(s);
              const inv = invoicedOf(s);
              const rec = receivedOf(s);
              const canOp = s.status === 'confirmed';
              return [
                <span key="c" className="cell-mono-emph">{s.code}</span>,
                <span key="t" className="cell-emph">{s.settleTarget}</span>,
                <span key="ct" style={{ fontSize: 'var(--text-sm)' }}>{s.customerType}</span>,
                <span key="p" className="cell-muted" style={{ fontSize: 'var(--text-xs)' }}>{s.period}</span>,
                <span key="l" className="mono">{s.lines.length} 行</span>,
                <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(net)}</span>,
                <span key="i" className="mono" style={{ color: inv > 0 ? '#01795D' : 'var(--color-neutral-400)' }}>{money(inv)}</span>,
                <span key="r" className="mono" style={{ color: rec > 0 ? '#01795D' : 'var(--color-neutral-400)' }}>{money(rec)}</span>,
                <span key="u" className="mono" style={{ color: net - rec > 0 ? '#B26A00' : 'var(--color-neutral-400)', fontWeight: net - rec > 0 ? 'var(--font-semibold)' : undefined }}>{money(net - rec)}</span>,
                statusPill(s),
                <div key="act" className="row-actions">
                  {s.status !== 'closed' && s.status !== 'confirmed' && <Button size="sm" variant="ghost" onClick={() => run(store.getState().confirmStatement(s.id))}>确认对账</Button>}
                  {canOp && inv < net - 0.001 && <Button size="sm" variant="ghost" onClick={() => { setSelectedId(s.id); openDialog('invoice'); }}>开票登记</Button>}
                  {canOp && rec < net - 0.001 && <Button size="sm" variant="ghost" onClick={() => { setSelectedId(s.id); openDialog('receipt'); }}>收款登记</Button>}
                  {canOp && rec >= net - 0.001 && inv < net - 0.001 && <Button size="sm" variant="ghost" onClick={() => run(store.getState().closeStatement(s.id))}>手工办结</Button>}
                  {s.status !== 'closed' && <Button size="sm" variant="ghost" onClick={() => { setSelectedId(s.id); openDialog('adjust'); }}>退货冲减</Button>}
                  <Button size="sm" variant="ghost" onClick={() => setSelectedId(s.id)}>查看</Button>
                </div>,
              ];
            })}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无对账单：点击右上角「新建对账单」，从已确收未对账的履约单中勾选生成。
            </div>
          )}
        </Card>
      </div>

      {/* ── 对账单详情抽屉 ── */}
      <DetailDrawer
        open={!!current}
        onClose={() => setSelectedId(null)}
        badge="DZ"
        title={current?.code ?? ''}
        statusTag={current ? statusPill(current) : null}
        subtitle={current ? `${current.settleTarget} · ${current.customerType} · ${current.period}` : ''}
        footer={current && current.status !== 'closed' ? (
          <>
            <Button variant="ghost" onClick={() => setSelectedId(null)}>关闭</Button>
            {current.status !== 'confirmed' && <Button variant="ghost" onClick={() => { setSelectedId(current.id); openDialog('dispute'); }}>登记异议</Button>}
            {current.status !== 'confirmed' && <Button onClick={() => run(store.getState().confirmStatement(current.id))}>确认对账</Button>}
          </>
        ) : <Button variant="ghost" onClick={() => setSelectedId(null)}>关闭</Button>}
      >
        {current && (
          <>
            <DrawerSection title="对账信息">
              <InfoGrid cols={4}>
                <InfoItem label="结算对象" emph>{current.settleTarget}</InfoItem>
                <InfoItem label="客户类型">{current.customerType}</InfoItem>
                <InfoItem label="账期" span={2}>{current.period}</InfoItem>
                <InfoItem label="对账金额" mono>{money(current.amount)}</InfoItem>
                <InfoItem label="退货冲减" mono>{money(current.adjustments.reduce((s, a) => s + a.amount, 0))}</InfoItem>
                <InfoItem label="对账净额" mono emph>{money(netOf(current))}</InfoItem>
                <InfoItem label="已开票" mono>{money(invoicedOf(current))}</InfoItem>
                <InfoItem label="已收款" mono>{money(receivedOf(current))}</InfoItem>
                <InfoItem label="应收余额" mono>{money(netOf(current) - receivedOf(current))}</InfoItem>
                {currentWallet && <InfoItem label="钱包余额" mono>{money(currentWallet.balance)}</InfoItem>}
                {current.disputeReason && <InfoItem label="异议原因" span={3}>{current.disputeReason}</InfoItem>}
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title={`对账明细（${current.lines.length} 行）`}>
              <table className="detail-inline-table">
                <thead><tr><th>履约单号</th><th>计入金额</th><th>开票覆盖</th><th>收款覆盖</th></tr></thead>
                <tbody>
                  {(() => {
                    let invPool = invoicedOf(current);
                    let recPool = receivedOf(current);
                    return current.lines.map((l) => {
                      const invTake = Math.min(l.amount, Math.max(0, invPool));
                      invPool -= invTake;
                      const recTake = Math.min(l.amount, Math.max(0, recPool));
                      recPool -= recTake;
                      return (
                        <tr key={l.orderId}>
                          <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{l.orderCode}</td>
                          <td className="mono">{money(l.amount)}</td>
                          <td className="mono" style={{ color: invTake >= l.amount ? '#01795D' : '#B26A00' }}>{money(invTake)}{invTake >= l.amount ? '（已覆盖）' : invTake > 0 ? '（部分）' : ''}</td>
                          <td className="mono" style={{ color: recTake >= l.amount ? '#01795D' : '#B26A00' }}>{money(recTake)}{recTake >= l.amount ? '（已核销）' : recTake > 0 ? '（部分）' : ''}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </DrawerSection>

            <DrawerSection title={`发票记录（${current.invoices.length}）`}>
              {current.invoices.length === 0 ? <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂未开票</div> : (
                <table className="detail-inline-table">
                  <thead><tr><th>发票号</th><th>金额</th><th>开票日期</th><th>备注</th></tr></thead>
                  <tbody>
                    {current.invoices.map((i) => (
                      <tr key={i.id}><td className="mono">{i.invoiceNo}</td><td className="mono">{money(i.amount)}</td><td className="mono">{i.date}</td><td className="cell-muted">{i.remark ?? '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </DrawerSection>

            <DrawerSection title={`收款记录（${current.receipts.length}）`}>
              {current.receipts.length === 0 ? <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂未收款</div> : (
                <table className="detail-inline-table">
                  <thead><tr><th>日期</th><th>金额</th><th>方式</th><th>备注</th></tr></thead>
                  <tbody>
                    {current.receipts.map((r) => (
                      <tr key={r.id}><td className="mono">{r.date}</td><td className="mono">{money(r.amount)}</td><td>{RECEIPT_METHOD_LABELS[r.method]}</td><td className="cell-muted">{r.remark ?? '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </DrawerSection>

            {current.adjustments.length > 0 && (
              <DrawerSection title={`退货冲减（${current.adjustments.length}）`}>
                <table className="detail-inline-table">
                  <thead><tr><th>日期</th><th>金额</th><th>原因</th><th>关联单号</th></tr></thead>
                  <tbody>
                    {current.adjustments.map((a) => (
                      <tr key={a.id}><td className="mono">{a.date}</td><td className="mono" style={{ color: '#CB405D' }}>-{money(a.amount)}</td><td>{a.reason}</td><td className="mono">{a.refCode ?? '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </DrawerSection>
            )}
          </>
        )}
      </DetailDrawer>

      {/* ── 新建对账单弹窗 ── */}
      {genOpen && (
        <div className="category-dialog-overlay" onClick={() => setGenOpen(false)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 860, maxWidth: '94vw', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>新建客户对账单</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
              从<strong>已确收未对账</strong>的履约单中按结算对象勾选生成；经平台销售按<strong>销平台实价</strong>计入。对账单生成后为「待对账」，确认后才能开票 / 收款。
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <select className="filter-select" value={genTarget} onChange={(e) => { setGenTarget(e.target.value); setGenPicked(new Set()); }} style={{ minWidth: 220 }}>
                <option value="">选择结算对象（{genGroups.length} 个待对账）</option>
                {genGroups.map(([k, list]) => <option key={k} value={k}>{k}（{list.length} 单）</option>)}
              </select>
              <input className="filter-input" placeholder="账期说明（如 2026-11 月结，仅作参考）" value={genPeriod} onChange={(e) => setGenPeriod(e.target.value)} style={{ flex: 1 }} />
            </div>
            {genTarget && (
              <table className="detail-inline-table" style={{ marginBottom: 'var(--space-3)' }}>
                <thead><tr><th style={{ width: 44 }}>纳入</th><th>履约单号</th><th>客户</th><th>计入金额</th></tr></thead>
                <tbody>
                  {genOrders.map((o) => (
                    <tr key={o.id}>
                      <td><input type="checkbox" checked={genPicked.has(o.id)} onChange={() => setGenPicked((prev) => { const n = new Set(prev); if (n.has(o.id)) n.delete(o.id); else n.add(o.id); return n; })} /></td>
                      <td className="mono">{o.code}</td>
                      <td>{o.customerName}</td>
                      <td className="mono">{money(statementAmountOf(o))}{o.salesPath === 'via_platform' ? '（销平台实价）' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-sm)' }}>已选 {genPicked.size} 行 · 合计 <strong className="mono">{money(genAmount)}</strong></span>
              <span style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <Button variant="ghost" onClick={() => setGenOpen(false)}>关闭</Button>
                <Button
                  disabled={genPicked.size === 0}
                  onClick={() => {
                    const res = store.getState().generateStatement({
                      settleTarget: genTarget,
                      customerType: genOrders.find((o) => genPicked.has(o.id))?.salesPath === 'via_platform' ? '平台客户' : (genOrders.find((o) => genPicked.has(o.id))?.customerType ?? '直营客户'),
                      period: genPeriod,
                      orderIds: [...genPicked],
                    });
                    flash(res.msg);
                    if (res.ok) { setGenOpen(false); }
                  }}
                >生成对账单</Button>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 开票 / 收款 / 冲减 / 异议 / 充值 弹窗 ── */}
      {dialog && dialog !== 'recharge' && current && (
        <div className="category-dialog-overlay" onClick={() => setDialog(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 520 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
              {dialog === 'invoice' ? `开票登记 · ${current.code}` : dialog === 'receipt' ? `收款登记 · ${current.code}` : dialog === 'adjust' ? `退货冲减 · ${current.code}` : `登记异议 · ${current.code}`}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
              对账净额 {money(netOf(current))} · 已开票 {money(invoicedOf(current))} · 已收款 {money(receivedOf(current))}
              {dialog === 'invoice' && ` · 未开票余额 ${money(netOf(current) - invoicedOf(current))}`}
              {dialog === 'receipt' && ` · 未收余额 ${money(netOf(current) - receivedOf(current))}`}
            </div>
            {dialog === 'invoice' && (
              <>
                <Field label="发票号 *"><input className="filter-input" value={form.invoiceNo} onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })} style={{ width: '100%' }} placeholder="如 FP-02611724" /></Field>
                <Field label={`开票金额 *（≤ ${money(netOf(current) - invoicedOf(current))}）`}><input className="filter-input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: '100%' }} /></Field>
              </>
            )}
            {dialog === 'receipt' && (
              <>
                <Field label={`收款金额 *（≤ ${money(netOf(current) - receivedOf(current))}）`}><input className="filter-input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: '100%' }} /></Field>
                <Field label="收款方式">
                  <select className="filter-select" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as ReceiptMethod })} style={{ width: '100%' }}>
                    {(Object.keys(RECEIPT_METHOD_LABELS) as ReceiptMethod[]).map((m) => (
                      <option key={m} value={m}>{RECEIPT_METHOD_LABELS[m]}{m === 'wallet' && currentWallet ? `（余额 ${money(currentWallet.balance)}）` : ''}</option>
                    ))}
                  </select>
                </Field>
              </>
            )}
            {dialog === 'adjust' && (
              <>
                <Field label="冲减金额 *"><input className="filter-input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: '100%' }} /></Field>
                <Field label="冲减原因 *（退货单号可填关联单号）"><input className="filter-input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} style={{ width: '100%' }} /></Field>
              </>
            )}
            {dialog === 'dispute' && (
              <Field label="异议原因 *"><input className="filter-input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} style={{ width: '100%' }} /></Field>
            )}
            {dialog !== 'dispute' && <Field label="日期"><input className="filter-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ width: '100%' }} /></Field>}
            {(dialog === 'invoice' || dialog === 'receipt') && <Field label="备注"><input className="filter-input" value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} style={{ width: '100%' }} /></Field>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Button variant="ghost" onClick={() => setDialog(null)}>关闭</Button>
              <Button
                disabled={
                  (dialog === 'invoice' && (!form.invoiceNo.trim() || !(Number(form.amount) > 0)))
                  || (dialog === 'receipt' && !(Number(form.amount) > 0))
                  || ((dialog === 'adjust' || dialog === 'dispute') && (!form.reason.trim() || !(Number(form.amount) > 0 || dialog === 'dispute')))
                }
                onClick={() => {
                  if (dialog === 'invoice') run(store.getState().registerStatementInvoice(current.id, { invoiceNo: form.invoiceNo, amount: Number(form.amount), date: form.date, remark: form.remark }));
                  else if (dialog === 'receipt') run(store.getState().registerStatementReceipt(current.id, { amount: Number(form.amount), date: form.date, method: form.method, remark: form.remark }));
                  else if (dialog === 'adjust') run(store.getState().adjustStatement(current.id, { amount: Number(form.amount), reason: form.reason }));
                  else if (dialog === 'dispute') run(store.getState().disputeStatement(current.id, form.reason));
                }}
              >确认</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 钱包充值弹窗 ── */}
      {dialog === 'recharge' && (
        <div className="category-dialog-overlay" onClick={() => setDialog(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 480 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>客户钱包充值</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
              预付客户的预付款登记为钱包余额；对账收款时可选择「钱包余额支付」核销扣减。
            </div>
            <RechargeForm wallets={wallets} onSubmit={(name, amount) => run(store.getState().walletRecharge(name, amount))} onCancel={() => setDialog(null)} />
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>{label}</label>
      {children}
    </div>
  );
}

function RechargeForm({ wallets, onSubmit, onCancel }: {
  wallets: { customerName: string; balance: number }[];
  onSubmit: (name: string, amount: number) => void;
  onCancel: () => void;
}) {
  const names = [...new Set(wallets.map((w) => w.customerName))];
  const [picked, setPicked] = useState(names[0] ?? '__other');
  const [newName, setNewName] = useState('');
  const [amount, setAmount] = useState('');
  const isOther = picked === '__other';
  const finalName = isOther ? newName.trim() : picked;
  return (
    <>
      <Field label="客户">
        <select className="filter-select" value={picked} onChange={(e) => setPicked(e.target.value)} style={{ width: '100%' }}>
          {names.map((n) => <option key={n} value={n}>{n}（余额 {money(wallets.find((w) => w.customerName === n)?.balance ?? 0)}）</option>)}
          <option value="__other">其他客户（手动输入）</option>
        </select>
      </Field>
      {isOther && <Field label="客户名称"><input className="filter-input" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ width: '100%' }} /></Field>}
      <Field label="充值金额 *"><input className="filter-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%' }} /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <Button variant="ghost" onClick={onCancel}>关闭</Button>
        <Button disabled={!finalName || !(Number(amount) > 0)} onClick={() => onSubmit(finalName, Number(amount))}>确认充值</Button>
      </div>
    </>
  );
}
