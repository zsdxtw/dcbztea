/**
 * 财务 · 付款管理（合作商付款操作页 + 台账）
 * 付款登记 = 已确认采购结算单（签收后付款 / 先款后货预付款，分批登记；预付到账后合作商可发货）。
 * 台账数据源 = 采购结算单付款记录；生成与确认在采购菜单（采购单结算 / 采购结算）。
 * 设计见 docs/销售单结算流程设计建议.md 第七节、第六节。
 */
import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusTag from '../../components/common/StatusTag';
import { useSettlementStore } from '../../stores/settlementStore';
import type { PurchaseStatement } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

type Dialog = { kind: 'pay'; id: string; code: string; supplier: string } | null;

export default function FinancePurchasePayment() {
  const purchaseStatements = useSettlementStore((s) => s.purchaseStatements);
  const store = useSettlementStore;
  const [keyword, setKeyword] = useState('');
  const [view, setView] = useState<'pending' | 'records'>('pending');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), account: '', remark: '' });
  const [msg, setMsg] = useState('');
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 4500); };
  const run = (res: { ok: boolean; msg: string }) => { flash(res.msg); if (res.ok) setDialog(null); };

  const paidOf = (s: PurchaseStatement) => s.payments.reduce((acc, p) => acc + p.amount, 0);

  /** 待付款：已确认采购结算单。先款后货取发货前应付额度，签收后取结算金额 */
  const pending = useMemo(() => purchaseStatements
    .filter((s) => s.status === 'confirmed')
    .map((s) => {
      const paid = paidOf(s);
      const cap = s.paymentStage === 'prepaid' ? (s.prepaidAmount ?? s.amount) : s.amount;
      const isPrepaid = s.paymentStage === 'prepaid' && paid < cap - 0.001;
      const balance = s.amount - paid;
      return { stmt: s, code: s.code, supplier: s.supplierName, amount: s.amount, cap, paid, balance, isPrepaid, stage: isPrepaid ? '预付款（发货前）' : s.paymentStage === 'prepaid' ? '尾款' : '付款' };
    })
    .filter((x) => (x.isPrepaid ? true : x.balance > 0.001)), [purchaseStatements]);

  /** 付款记录 */
  const records = useMemo(() => purchaseStatements.flatMap((s) => s.payments.map((p) => ({
    id: p.id, code: s.code, supplier: s.supplierName, amount: p.amount, date: p.date,
    account: p.account ?? '', remark: p.remark ?? '',
  }))).sort((a, b) => b.date.localeCompare(a.date)), [purchaseStatements]);

  const kw = keyword.trim();
  const filteredPending = kw ? pending.filter((p) => p.code.includes(kw) || p.supplier.includes(kw)) : pending;
  const filteredRecords = kw ? records.filter((r) => r.code.includes(kw) || r.supplier.includes(kw)) : records;
  const totalPaid = records.reduce((s, r) => s + r.amount, 0);

  const openPay = (x: typeof pending[0]) => {
    setDialog({ kind: 'pay', id: x.stmt.id, code: x.code, supplier: x.supplier });
    setForm({
      amount: String(x.isPrepaid ? Math.min(x.cap - x.paid, x.balance) : x.balance),
      date: new Date().toISOString().slice(0, 10), account: '', remark: '',
    });
  };

  return (
    <>
      <ContentHeader title="付款管理" breadcrumbs={['财务', '应收应付', '付款管理']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          合作商付款操作与台账：对<strong>已确认的采购结算单</strong>付款登记（签收后付款分批核销；
          <strong>先款后货</strong>按发货前应付额度登记预付款，预付到账后合作商可发货，办结时采购单置为已结算）。
          累计付款 <strong className="mono">{money(totalPaid)}</strong>。
        </div>

        {msg && (
          <div style={{ marginBottom: 'var(--space-3)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: '#E8F5E9', color: '#01795D' }}>{msg}</div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          {([['pending', `待付款 ${pending.length}`], ['records', `付款记录 ${records.length}`]] as const).map(([k, label]) => (
            <button key={k} className={`tab-card-simple${view === k ? ' active' : ''}`} onClick={() => setView(k)}>{label}</button>
          ))}
          <input className="filter-input" placeholder="搜索结算单号、合作商..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 260 }} />
        </div>

        {view === 'pending' && (
          <Card style={{ padding: 0 }}>
            <Table
              headers={['结算单号', '合作商', '确认方式', '付款节点', '结算金额', '已付', '本次可付', '状态', '操作']}
              rows={filteredPending.map((x) => [
                <span key="c" className="cell-mono-emph">{x.code}</span>,
                <span key="s" className="cell-emph">{x.supplier}</span>,
                <span key="t" style={{ fontSize: 'var(--text-xs)', color: x.stmt.hasTerminal ? 'var(--color-neutral-500)' : '#E65100', fontWeight: x.stmt.hasTerminal ? 400 : 500 }}>{x.stmt.hasTerminal ? '终端确认' : '后台代确认'}</span>,
                <span key="ps" style={{ fontSize: 'var(--text-xs)' }}>{x.stmt.paymentStage === 'prepaid' ? '发货前（先款后货）' : '签收后'}</span>,
                <span key="a" className="mono">{money(x.amount)}</span>,
                <span key="p" className="mono" style={{ color: '#01795D' }}>{money(x.paid)}</span>,
                <span key="c" className="mono" style={{ color: '#B26A00', fontWeight: 'var(--font-semibold)' }}>{money(x.isPrepaid ? x.cap - x.paid : x.balance)}</span>,
                <StatusTag key="st" variant={x.isPrepaid ? 'info' : 'warning'} label={x.isPrepaid ? '预付款（发货前）' : '已确认 · 待付款'} />,
                <div key="act" className="row-actions">
                  <Button size="sm" onClick={() => openPay(x)}>付款登记</Button>
                </div>,
              ])}
            />
            {filteredPending.length === 0 && (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无待付款结算单（采购结算单确认后展示）</div>
            )}
          </Card>
        )}

        {view === 'records' && (
          <Card style={{ padding: 0 }}>
            <Table
              headers={['付款日期', '结算单号', '合作商', '付款金额', '付款账户', '备注']}
              rows={filteredRecords.map((r) => [
                <span key="d" className="mono">{r.date}</span>,
                <span key="c" className="cell-mono-emph">{r.code}</span>,
                <span key="s" className="cell-emph">{r.supplier}</span>,
                <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)', color: '#01795D' }}>{money(r.amount)}</span>,
                <span key="ac" style={{ fontSize: 'var(--text-sm)' }}>{r.account || '—'}</span>,
                <span key="rm" className="cell-muted" style={{ fontSize: 'var(--text-sm)' }}>{r.remark || '—'}</span>,
              ])}
            />
            {filteredRecords.length === 0 && (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无付款记录（付款登记后展示）</div>
            )}
          </Card>
        )}
      </div>

      {/* 付款登记弹窗 */}
      {dialog && (() => {
        const s = purchaseStatements.find((x) => x.id === dialog.id)!;
        const paid = paidOf(s);
        const cap = s.paymentStage === 'prepaid' ? (s.prepaidAmount ?? s.amount) : s.amount;
        const isPrepaid = s.paymentStage === 'prepaid' && paid < cap - 0.001;
        return (
          <div className="category-dialog-overlay" onClick={() => setDialog(null)}>
            <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 500 }}>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
                {isPrepaid ? '预付款登记（发货前）' : '付款登记'} · {dialog.code}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
                {dialog.supplier} · {s.paymentStage === 'prepaid' ? `发货前应付 ${money(cap)}` : `结算金额 ${money(s.amount)}`} ·
                已付 {money(paid)} · 未付余额 <strong className="mono">{money(s.amount - paid)}</strong>
                （支持分批登记{isPrepaid ? '；预付到账后合作商可发货' : ''}）
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <Button variant="ghost" onClick={() => setDialog(null)}>关闭</Button>
                <Button disabled={!(Number(form.amount) > 0)} onClick={() => run(store.getState().registerPurchasePayment(dialog.id, { amount: Number(form.amount), date: form.date, account: form.account, remark: form.remark }))}>确认付款</Button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
