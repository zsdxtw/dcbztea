/**
 * 财务 · 发票管理（销项开票 / 进项收票操作页）
 * 销项开票登记 = 已确认销售结算单（部分开票，多张发票累计覆盖）；进项收票登记 = 已确认采购结算单。
 * 台账数据源 = 结算单发票记录；生成与确认在销售 / 采购菜单。
 * 设计见 docs/销售单结算流程设计建议.md 第七节。
 */
import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusTag from '../../components/common/StatusTag';
import { useSettlementStore, netOf, invoicedOf } from '../../stores/settlementStore';
import type { PurchaseStatement, SalesStatement } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

interface InvoiceRow {
  invoiceNo: string;
  type: '销项发票' | '进项发票';
  party: string;
  refCode: string;
  amount: number;
  date: string;
  remark?: string;
}

type Dialog = { kind: 'output' | 'input'; id: string; code: string; party: string } | null;

export default function FinanceInvoice() {
  const salesStatements = useSettlementStore((s) => s.salesStatements);
  const purchaseStatements = useSettlementStore((s) => s.purchaseStatements);
  const store = useSettlementStore;
  const [keyword, setKeyword] = useState('');
  const [tab, setTab] = useState<'' | 'output' | 'input'>('');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState({ invoiceNo: '', amount: '', date: new Date().toISOString().slice(0, 10), remark: '' });
  const [msg, setMsg] = useState('');
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 4500); };
  const run = (res: { ok: boolean; msg: string }) => { flash(res.msg); if (res.ok) setDialog(null); };

  /** 销项待开票：已确认销售结算单，开票未覆盖净额 */
  const outputPending = useMemo(() => salesStatements
    .filter((s) => s.status === 'confirmed' && invoicedOf(s) < netOf(s) - 0.001)
    .map((s) => ({ stmt: s, net: netOf(s), inv: invoicedOf(s), balance: netOf(s) - invoicedOf(s) })), [salesStatements]);

  /** 进项待收票：已确认采购结算单，未收票（先款后货以预付额度为收票口径上限提示） */
  const inputPending = useMemo(() => purchaseStatements
    .filter((s) => s.status === 'confirmed')
    .map((s) => ({ stmt: s, inv: s.invoices.reduce((acc, i) => acc + i.amount, 0), balance: Math.max(0, s.amount - s.invoices.reduce((acc, i) => acc + i.amount, 0)) })), [purchaseStatements]);

  const rows = useMemo<InvoiceRow[]>(() => {
    const output = salesStatements.flatMap((s) => s.invoices.map((i) => ({
      invoiceNo: i.invoiceNo, type: '销项发票' as const, party: s.settleTarget, refCode: s.code,
      amount: i.amount, date: i.date, remark: i.remark,
    })));
    const input = purchaseStatements.flatMap((s) => s.invoices.map((i) => ({
      invoiceNo: i.invoiceNo, type: '进项发票' as const, party: s.supplierName, refCode: s.code,
      amount: i.amount, date: i.date, remark: '采购进项收票',
    })));
    return [...output, ...input].sort((a, b) => b.date.localeCompare(a.date));
  }, [salesStatements, purchaseStatements]);

  const kw = keyword.trim();
  const filtered = rows
    .filter((r) => (tab === '' ? true : tab === 'output' ? r.type === '销项发票' : r.type === '进项发票'))
    .filter((r) => (!kw ? true : r.invoiceNo.includes(kw) || r.party.includes(kw) || r.refCode.includes(kw)));
  const outputTotal = rows.filter((r) => r.type === '销项发票').reduce((s, r) => s + r.amount, 0);
  const inputTotal = rows.filter((r) => r.type === '进项发票').reduce((s, r) => s + r.amount, 0);

  const openDialog = (kind: 'output' | 'input', id: string) => {
    const stmt = kind === 'output'
      ? salesStatements.find((s) => s.id === id)
      : purchaseStatements.find((s) => s.id === id);
    if (!stmt) return;
    const party = kind === 'output' ? (stmt as SalesStatement).settleTarget : (stmt as PurchaseStatement).supplierName;
    setDialog({ kind, id, code: stmt.code, party });
    setForm({ invoiceNo: '', amount: '', date: new Date().toISOString().slice(0, 10), remark: '' });
  };

  const submit = () => {
    if (!dialog) return;
    if (!form.invoiceNo.trim() || !(Number(form.amount) > 0)) return;
    if (dialog.kind === 'output') {
      run(store.getState().registerSalesInvoice(dialog.id, { invoiceNo: form.invoiceNo, amount: Number(form.amount), date: form.date, remark: form.remark }));
    } else {
      run(store.getState().registerIncomingInvoice(dialog.id, { invoiceNo: form.invoiceNo, amount: Number(form.amount), date: form.date }));
    }
  };

  return (
    <>
      <ContentHeader title="发票管理" breadcrumbs={['财务', '核算与其他', '发票管理']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          发票台账与结算单打通：销项发票对<strong>已确认的销售结算单</strong>开票登记（部分开票支持多张发票累计覆盖），
          进项发票对<strong>已确认的采购结算单</strong>收票登记。销项合计 {money(outputTotal)} · 进项合计 {money(inputTotal)}。
        </div>

        {msg && (
          <div style={{ marginBottom: 'var(--space-3)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: '#E8F5E9', color: '#01795D' }}>{msg}</div>
        )}

        {/* 待开票 / 待收票（操作区） */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Card style={{ flex: '1 1 440px', padding: 0 }}>
            <div style={{ padding: '10px 14px', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', borderBottom: '1px solid var(--color-neutral-100)', display: 'flex', justifyContent: 'space-between' }}>
              <span>销项 · 待开票</span><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{outputPending.length} 张</span>
            </div>
            <Table
              headers={['结算单号', '结算对象', '结算净额', '已开票', '未开票余额', '操作']}
              rows={outputPending.map((x) => [
                <span key="c" className="cell-mono-emph">{x.stmt.code}</span>,
                <span key="t" className="cell-emph">{x.stmt.settleTarget}</span>,
                <span key="n" className="mono">{money(x.net)}</span>,
                <span key="i" className="mono">{money(x.inv)}</span>,
                <span key="b" className="mono" style={{ color: '#B26A00', fontWeight: 'var(--font-semibold)' }}>{money(x.balance)}</span>,
                <Button key="a" size="sm" onClick={() => openDialog('output', x.stmt.id)}>开票登记</Button>,
              ])}
            />
            {outputPending.length === 0 && <div style={{ padding: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无待开票结算单</div>}
          </Card>
          <Card style={{ flex: '1 1 440px', padding: 0 }}>
            <div style={{ padding: '10px 14px', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', borderBottom: '1px solid var(--color-neutral-100)', display: 'flex', justifyContent: 'space-between' }}>
              <span>进项 · 待收票</span><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{inputPending.length} 张</span>
            </div>
            <Table
              headers={['结算单号', '合作商', '结算金额', '已收票', '未收票余额', '操作']}
              rows={inputPending.map((x) => [
                <span key="c" className="cell-mono-emph">{x.stmt.code}</span>,
                <span key="t" className="cell-emph">{x.stmt.supplierName}</span>,
                <span key="n" className="mono">{money(x.stmt.amount)}</span>,
                <span key="i" className="mono">{money(x.inv)}</span>,
                <span key="b" className="mono" style={{ color: '#B26A00', fontWeight: 'var(--font-semibold)' }}>{money(x.balance)}</span>,
                <Button key="a" size="sm" onClick={() => openDialog('input', x.stmt.id)}>收票登记</Button>,
              ])}
            />
            {inputPending.length === 0 && <div style={{ padding: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无待收票结算单</div>}
          </Card>
        </div>

        {/* 发票台账 */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          {([['', '全部发票'], ['output', '销项发票'], ['input', '进项发票']] as const).map(([k, label]) => (
            <button key={k || 'all'} className={`tab-card-simple${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>
              {label}
              <span className="tab-card-simple-count">{rows.filter((r) => (k === '' ? true : k === 'output' ? r.type === '销项发票' : r.type === '进项发票')).length}</span>
            </button>
          ))}
          <input className="filter-input" placeholder="搜索发票号、购买方 / 销售方、结算单号..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 300 }} />
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['发票号', '类型', '购买方 / 销售方', '关联结算单', '金额', '开票 / 收票日期', '备注']}
            rows={filtered.map((r) => [
              <span key="no" className="cell-mono-emph">{r.invoiceNo}</span>,
              <StatusTag key="t" variant={r.type === '销项发票' ? 'success' : 'info'} label={r.type} />,
              <span key="p" className="cell-emph">{r.party}</span>,
              <span key="rc" className="mono" style={{ fontSize: 'var(--text-sm)' }}>{r.refCode}</span>,
              <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(r.amount)}</span>,
              <span key="d" className="mono">{r.date}</span>,
              <span key="rm" className="cell-muted" style={{ fontSize: 'var(--text-sm)' }}>{r.remark || '—'}</span>,
            ])}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无发票记录（开票 / 收票登记后展示）</div>
          )}
        </Card>
      </div>

      {/* 开票 / 收票登记弹窗 */}
      {dialog && (
        <div className="category-dialog-overlay" onClick={() => setDialog(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 480 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
              {dialog.kind === 'output' ? '销项开票登记' : '进项收票登记'} · {dialog.code}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)' }}>
              {dialog.party}
              {dialog.kind === 'output' && (() => {
                const s = salesStatements.find((x) => x.id === dialog.id)!;
                return <> · 结算净额 {money(netOf(s))} · 已开票 {money(invoicedOf(s))} · 未开票 <strong className="mono">{money(netOf(s) - invoicedOf(s))}</strong></>;
              })()}
              {dialog.kind === 'input' && (() => {
                const s = purchaseStatements.find((x) => x.id === dialog.id)!;
                const inv = s.invoices.reduce((acc, i) => acc + i.amount, 0);
                return <> · 结算金额 {money(s.amount)} · 已收票 {money(inv)} · 未收票 <strong className="mono">{money(s.amount - inv)}</strong></>;
              })()}
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>发票号 *</label>
              <input className="filter-input" value={form.invoiceNo} onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })} style={{ width: '100%' }} placeholder="如 FP-02611724" />
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>发票金额 *</label>
              <input className="filter-input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>日期</label>
              <input className="filter-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ width: '100%' }} />
            </div>
            {dialog.kind === 'output' && (
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>备注</label>
                <input className="filter-input" value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} style={{ width: '100%' }} placeholder="如 增值税专用发票" />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Button variant="ghost" onClick={() => setDialog(null)}>关闭</Button>
              <Button disabled={!form.invoiceNo.trim() || !(Number(form.amount) > 0)} onClick={submit}>确认登记</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
