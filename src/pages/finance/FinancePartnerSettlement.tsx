/**
 * 财务 · 合作商结算（应付侧 · 购销背对背）
 * 流程（docs/销售单结算流程设计建议.md 第五节）：客户确收 → 对应采购单进入待对账 →
 * 生成合作商对账单（按合作商汇总，账期仅参考）→ 合作商确认 → 收票登记 → 付款核销
 * → 付款完成置采购单已结算。付款按合作商独立账期执行，不以客户回款为前提。
 */
import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusTag from '../../components/common/StatusTag';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { useSettlementStore, partnerPaidOfPo, partnerStatementOfPo } from '../../stores/settlementStore';
import { TRANSFER_SOURCE_LABELS } from '../../data/externalOrders';
import { receiveStateOf } from '../../utils/salesOrderFamily';
import type { PartnerStatement } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

type View = 'partner' | 'pending' | 'statements' | 'closed';

export default function FinancePartnerSettlement() {
  const orders = useOrderFlowStore((s) => s.orders);
  const poDocs = usePurchaseStore((s) => s.docs);
  const statements = useSettlementStore((s) => s.partnerStatements);
  const store = useSettlementStore;
  const [view, setView] = useState<View>('partner');
  const [msg, setMsg] = useState('');
  const [keyword, setKeyword] = useState('');

  /** 付款 / 收票弹窗 */
  const [payOf, setPayOf] = useState<PartnerStatement | null>(null);
  const [invOf, setInvOf] = useState<PartnerStatement | null>(null);
  const [form, setForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), account: '', remark: '', invoiceNo: '' });

  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 4200); };
  const run = (res: { ok: boolean; msg: string }) => { flash(res.msg); if (res.ok) { setPayOf(null); setInvOf(null); } };

  /** 待对账采购单：合作商直发、已签收（客户确收解锁）、未入对账单 */
  const eligiblePos = useMemo(() => poDocs.filter((d) => (
    d.source === 'distribute' && d.status === 'delivered' && !partnerStatementOfPo(statements, d.id)
  )), [poDocs, statements]);

  /** 按合作商汇总（采购总额 / 应付 / 已付 / 未付） */
  const partnerRows = useMemo(() => {
    const map = new Map<string, { id: string; name: string; poCount: number; amount: number; payable: number; paid: number; stmtOpen: number }>();
    for (const d of poDocs.filter((x) => x.source === 'distribute')) {
      const cur = map.get(d.supplierId) ?? { id: d.supplierId, name: d.supplierName, poCount: 0, amount: 0, payable: 0, paid: 0, stmtOpen: 0 };
      cur.poCount += 1;
      cur.amount += d.amount;
      const st = partnerStatementOfPo(statements, d.id);
      const paidAmt = partnerPaidOfPo(statements, d.id);
      if (d.status === 'delivered' || d.status === 'settled' || st) cur.payable += d.amount;
      cur.paid += paidAmt;
      map.set(d.supplierId, cur);
    }
    for (const s of statements) {
      const cur = map.get(s.supplierId);
      if (cur && s.status !== 'closed') cur.stmtOpen += 1;
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount);
  }, [poDocs, statements]);

  const orderById = useMemo(() => new Map(orders.map((o) => [o.id, o])), [orders]);
  const openStatements = statements.filter((s) => s.status === 'pending' || s.status === 'confirmed' || s.status === 'disputed');
  const closedStatements = statements.filter((s) => s.status === 'closed');
  const kw = keyword.trim();
  const matchStmt = (s: PartnerStatement) => (!kw ? true : s.code.includes(kw) || s.supplierName.includes(kw) || s.lines.some((l) => l.orderCode.includes(kw)));

  /** 按合作商批量生成对账单（账期仅参考） */
  const generateBySupplier = () => {
    const bySupplier = new Map<string, typeof eligiblePos>();
    for (const d of eligiblePos) bySupplier.set(d.supplierId, [...(bySupplier.get(d.supplierId) ?? []), d]);
    if (bySupplier.size === 0) { flash('暂无待对账采购单（客户确收后进入待对账）'); return; }
    const msgs: string[] = [];
    for (const [supplierId, list] of bySupplier) {
      const res = store.getState().generatePartnerStatement({
        supplierId, supplierName: list[0].supplierName,
        poIds: list.map((d) => d.id),
        period: '手工生成（账期参考）',
      });
      msgs.push(res.msg);
    }
    flash(msgs.join('；'));
  };

  return (
    <>
      <ContentHeader title="合作商结算" breadcrumbs={['财务', '对账结算', '合作商结算']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          合作商结算＝<strong>采购应付</strong>（购销背对背）：客户确收后对应采购单进入待对账 →
          按合作商汇总生成<strong>对账单</strong>（确认 → 收票 → 付款核销）→ 付款完成置采购单已结算。
          付款按合作商<strong>独立账期</strong>执行（隔月付款），不以客户回款为前提；「结算完成」合作商经营积分在
          <strong>付款完成且客户回款到位</strong>后计入。
        </div>

        {msg && (
          <div style={{ marginBottom: 'var(--space-3)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: '#E8F5E9', color: '#01795D' }}>{msg}</div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          {([['partner', '按合作商汇总'], ['pending', `待对账 ${eligiblePos.length}`], ['statements', `对账中 ${openStatements.length}`], ['closed', `已办结 ${closedStatements.length}`]] as const).map(([k, label]) => (
            <button key={k} className={`tab-card-simple${view === k ? ' active' : ''}`} onClick={() => setView(k as typeof view)}>{label}</button>
          ))}
          <input className="filter-input" placeholder="搜索对账单号、合作商、履约单号..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 260 }} />
          {view === 'pending' && eligiblePos.length > 0 && <Button onClick={generateBySupplier}>按合作商汇总生成对账单</Button>}
        </div>

        {/* 按合作商汇总 */}
        {view === 'partner' && (
          <Card style={{ padding: 0 }}>
            <Table
              headers={['合作商', '采购单数', '采购总额', '应付金额（确收口径）', '已付金额', '未付金额', '在途对账单']}
              rows={partnerRows.map((r) => [
                <span key="n" className="cell-emph">{r.name}</span>,
                <span key="c" className="mono">{r.poCount}</span>,
                <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(r.amount)}</span>,
                <span key="p" className="mono" style={{ color: '#B26A00' }}>{money(r.payable)}</span>,
                <span key="pa" className="mono" style={{ color: '#01795D' }}>{money(r.paid)}</span>,
                <span key="u" className="mono" style={{ fontWeight: r.payable - r.paid > 0 ? 'var(--font-semibold)' : undefined }}>{money(r.payable - r.paid)}</span>,
                r.stmtOpen > 0 ? <StatusTag key="s" variant="warning" label={`${r.stmtOpen} 张在途`} /> : <span key="s" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>—</span>,
              ])}
            />
          </Card>
        )}

        {/* 待对账采购单 */}
        {view === 'pending' && (
          <Card style={{ padding: 0 }}>
            <Table
              headers={['采购单号', '合作商', '关联履约单', '客户', '转入来源', '客户回款', '采购金额', '操作']}
              rows={eligiblePos.filter((d) => (!kw ? true : d.code.includes(kw) || d.supplierName.includes(kw))).map((d) => {
                const o = orderById.get(d.childOrderId);
                return [
                  <span key="c" className="cell-mono-emph">{d.code}</span>,
                  <span key="s" className="cell-emph">{d.supplierName}</span>,
                  <span key="o" className="mono" style={{ fontSize: 'var(--text-sm)' }}>{d.childOrderCode}</span>,
                  <span key="cu" style={{ fontSize: 'var(--text-sm)' }}>{o?.customerName ?? '—'}</span>,
                  <span key="src" style={{ fontSize: 'var(--text-sm)' }}>{TRANSFER_SOURCE_LABELS[o?.transferSource ?? ''] ?? '—'}</span>,
                  o ? receiveStateOf(o, poDocs.filter((x) => x.childOrderId === o.id)) : '—',
                  <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(d.amount)}</span>,
                  <span key="act" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>随「按合作商汇总生成」纳入对账单</span>,
                ];
              })}
            />
            {eligiblePos.length === 0 && (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
                暂无待对账采购单（客户确收后，对应采购单进入待对账）
              </div>
            )}
          </Card>
        )}

        {/* 对账单（在途） */}
        {view === 'statements' && (
          <Card style={{ padding: 0 }}>
            <Table
              headers={['对账单号', '合作商', '账期', '采购单数', '应付金额', '已收票', '已付款', '未付余额', '状态', '操作']}
              rows={openStatements.filter(matchStmt).map((s) => {
                const paid = s.payments.reduce((acc, p) => acc + p.amount, 0);
                return [
                  <span key="c" className="cell-mono-emph">{s.code}</span>,
                  <span key="s" className="cell-emph">{s.supplierName}</span>,
                  <span key="p" className="cell-muted" style={{ fontSize: 'var(--text-xs)' }}>{s.period}</span>,
                  <span key="l" className="mono">{s.lines.length} 张</span>,
                  <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(s.amount)}</span>,
                  <span key="i" className="mono" style={{ color: s.invoices.length > 0 ? '#01795D' : 'var(--color-neutral-400)' }}>{money(s.invoices.reduce((acc, i) => acc + i.amount, 0))}</span>,
                  <span key="pd" className="mono" style={{ color: paid > 0 ? '#01795D' : 'var(--color-neutral-400)' }}>{money(paid)}</span>,
                  <span key="b" className="mono" style={{ color: s.amount - paid > 0 ? '#B26A00' : 'var(--color-neutral-400)', fontWeight: 'var(--font-semibold)' }}>{money(s.amount - paid)}</span>,
                  <StatusTag variant={s.status === 'confirmed' ? 'success' : s.status === 'disputed' ? 'error' : 'warning'} label={s.status === 'confirmed' ? '已确认' : s.status === 'disputed' ? '有异议' : '待确认'} />,
                  <div key="act" className="row-actions">
                    {s.status === 'pending' && <Button size="sm" onClick={() => run(store.getState().confirmPartnerStatement(s.id))}>确认对账</Button>}
                    {s.status === 'confirmed' && <Button size="sm" variant="ghost" onClick={() => { setInvOf(s); setForm({ ...form, invoiceNo: '', amount: '', date: new Date().toISOString().slice(0, 10) }); }}>收票登记</Button>}
                    {s.status === 'confirmed' && paid < s.amount - 0.001 && <Button size="sm" onClick={() => { setPayOf(s); setForm({ ...form, amount: String(Math.round(s.amount - paid)), date: new Date().toISOString().slice(0, 10), account: '', remark: '' }); }}>付款核销</Button>}
                  </div>,
                ];
              })}
            />
            {openStatements.filter(matchStmt).length === 0 && (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无在途对账单</div>
            )}
          </Card>
        )}

        {/* 已办结 */}
        {view === 'closed' && (
          <Card style={{ padding: 0 }}>
            <Table
              headers={['对账单号', '合作商', '账期', '采购单数', '应付金额', '付款完成日', '状态']}
              rows={closedStatements.filter(matchStmt).map((s) => [
                <span key="c" className="cell-mono-emph">{s.code}</span>,
                <span key="s" className="cell-emph">{s.supplierName}</span>,
                <span key="p" className="cell-muted" style={{ fontSize: 'var(--text-xs)' }}>{s.period}</span>,
                <span key="l" className="mono">{s.lines.length} 张</span>,
                <span key="a" className="mono">{money(s.amount)}</span>,
                <span key="d" className="mono">{s.closedAt ?? '—'}</span>,
                <StatusTag variant="default" label="已办结 · 采购单已结算" />,
              ])}
            />
            {closedStatements.filter(matchStmt).length === 0 && (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无已办结对账单</div>
            )}
          </Card>
        )}
      </div>

      {/* 付款核销弹窗 */}
      {payOf && (
        <div className="category-dialog-overlay" onClick={() => setPayOf(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 500 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>付款核销 · {payOf.code}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
              {payOf.supplierName} · 应付 {money(payOf.amount)} · 已付 {money(payOf.payments.reduce((acc, p) => acc + p.amount, 0))} ·
              未付余额 <strong className="mono">{money(payOf.amount - payOf.payments.reduce((acc, p) => acc + p.amount, 0))}</strong>
              （支持部分付款，分批核销；行付清 → 采购单已结算）
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>付款金额 *</label>
              <input className="filter-input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>付款日期</label>
              <input className="filter-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>付款账户</label>
              <input className="filter-input" placeholder="如 招商银行基本户" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>备注</label>
              <input className="filter-input" value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setPayOf(null)}>关闭</Button>
              <Button disabled={!(Number(form.amount) > 0)} onClick={() => run(store.getState().registerPartnerPayment(payOf.id, { amount: Number(form.amount), date: form.date, account: form.account, remark: form.remark }))}>确认付款</Button>
            </div>
          </div>
        </div>
      )}

      {/* 收票登记弹窗 */}
      {invOf && (
        <div className="category-dialog-overlay" onClick={() => setInvOf(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 480 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>收票登记 · {invOf.code}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
              登记合作商开来的<strong>进项发票</strong>（累计 {money(invOf.invoices.reduce((acc, i) => acc + i.amount, 0))}）。
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>发票号 *</label>
              <input className="filter-input" value={form.invoiceNo} onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>发票金额 *</label>
              <input className="filter-input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setInvOf(null)}>关闭</Button>
              <Button disabled={!form.invoiceNo.trim() || !(Number(form.amount) > 0)} onClick={() => run(store.getState().registerIncomingInvoice(invOf.id, { invoiceNo: form.invoiceNo, amount: Number(form.amount), date: form.date }))}>确认收票</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
