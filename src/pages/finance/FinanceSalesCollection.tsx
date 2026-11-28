/**
 * 财务 · 收款管理（客户回款操作页 + 预存账户）
 * 收款登记 = 已确认销售结算单（部分收款，多笔到账逐步核销；预付客户可选预存余额支付）；
 * 预收款登记 = 客户预存余额充值；手工办结 = 已收款未开票的客户。
 * 台账数据源 = 销售结算单收款记录；确认对账在销售菜单。
 * 设计见 docs/销售单结算流程设计建议.md 第七节、5.3。
 */
import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusTag from '../../components/common/StatusTag';
import { useSettlementStore, netOf, receivedOf, invoicedOf } from '../../stores/settlementStore';
import { RECEIPT_METHOD_LABELS } from '../../types';
import type { ReceiptMethod, SalesStatement } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const METHOD_TONE: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  bank: 'success', wallet: 'info', cash: 'default', acceptance: 'warning', alipay: 'info', wechat: 'info',
};

type Dialog = { kind: 'receipt' | 'prepay' | 'close'; id?: string; code?: string; target?: string } | null;

export default function FinanceSalesCollection() {
  const salesStatements = useSettlementStore((s) => s.salesStatements);
  const wallets = useSettlementStore((s) => s.wallets);
  const store = useSettlementStore;
  const [keyword, setKeyword] = useState('');
  const [view, setView] = useState<'pending' | 'records' | 'accounts'>('pending');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), method: 'bank' as ReceiptMethod, remark: '', name: '', newName: '' });
  const [msg, setMsg] = useState('');
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 4500); };
  const run = (res: { ok: boolean; msg: string }) => { flash(res.msg); if (res.ok) setDialog(null); };

  /** 待回款：已确认销售结算单，收款未覆盖净额 */
  const pending = useMemo(() => salesStatements
    .filter((s) => s.status === 'confirmed' && receivedOf(s) < netOf(s) - 0.001)
    .map((s) => ({
      stmt: s, code: s.code, target: s.settleTarget, net: netOf(s), rec: receivedOf(s),
      balance: netOf(s) - receivedOf(s), inv: invoicedOf(s), wallet: wallets.find((w) => w.customerName === s.settleTarget),
    })), [salesStatements, wallets]);

  /** 回款记录 */
  const records = useMemo(() => salesStatements.flatMap((s) => s.receipts.map((r) => ({
    id: r.id, code: s.code, target: s.settleTarget, amount: r.amount, date: r.date,
    method: r.method as string, remark: r.remark ?? '',
  }))).sort((a, b) => b.date.localeCompare(a.date)), [salesStatements]);

  const kw = keyword.trim();
  const filteredPending = kw ? pending.filter((p) => p.code.includes(kw) || p.target.includes(kw)) : pending;
  const filteredRecords = kw ? records.filter((r) => r.code.includes(kw) || r.target.includes(kw)) : records;
  const totalReceived = records.reduce((s, r) => s + r.amount, 0);
  const walletTotal = wallets.reduce((s, w) => s + w.balance, 0);

  const openReceipt = (s: SalesStatement) => {
    const wallet = wallets.find((w) => w.customerName === s.settleTarget);
    const prepaidCustomer = false; // 默认银行转账；预存客户可手动选余额支付
    setDialog({ kind: 'receipt', id: s.id, code: s.code, target: s.settleTarget });
    setForm({ amount: String(Math.round(netOf(s) - receivedOf(s))), date: new Date().toISOString().slice(0, 10), method: "bank" as const, remark: "", name: "", newName: "" });
    void prepaidCustomer; void wallet;
  };

  return (
    <>
      <ContentHeader
        title="收款管理"
        breadcrumbs={['财务', '应收应付', '收款管理']}
        actions={<Button onClick={() => { setDialog({ kind: 'prepay' }); setForm({ ...form, date: new Date().toISOString().slice(0, 10), method: 'bank', amount: '' }); }}>预收款登记</Button>}
      />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          客户回款操作与台账：对<strong>已确认的销售结算单</strong>收款登记（部分收款，多笔到账逐步核销）；
          预付客户的预收款登记为<strong>预存余额</strong>，收款时可选「预存余额支付」（核销扣减）。
          累计回款 <strong className="mono">{money(totalReceived)}</strong> · 预存余额合计 <strong className="mono">{money(walletTotal)}</strong>。
        </div>

        {msg && (
          <div style={{ marginBottom: 'var(--space-3)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: '#E8F5E9', color: '#01795D' }}>{msg}</div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          {([['pending', `待回款 ${pending.length}`], ['records', `回款记录 ${records.length}`], ['accounts', `预存账户 ${wallets.length}`]] as const).map(([k, label]) => (
            <button key={k} className={`tab-card-simple${view === k ? ' active' : ''}`} onClick={() => setView(k)}>{label}</button>
          ))}
          <input className="filter-input" placeholder="搜索结算单号、结算对象..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 260 }} />
        </div>

        {view === 'pending' && (
          <Card style={{ padding: 0 }}>
            <Table
              headers={['结算单号', '结算对象', '结算净额', '已收', '未收余额', '预存余额', '操作']}
              rows={filteredPending.map((p) => [
                <span key="c" className="cell-mono-emph">{p.code}</span>,
                <span key="t" className="cell-emph">{p.target}</span>,
                <span key="n" className="mono">{money(p.net)}</span>,
                <span key="r" className="mono" style={{ color: '#01795D' }}>{money(p.rec)}</span>,
                <span key="b" className="mono" style={{ color: '#B26A00', fontWeight: 'var(--font-semibold)' }}>{money(p.balance)}</span>,
                <span key="w" className="mono" style={{ color: p.wallet ? '#01795D' : 'var(--color-neutral-300)' }}>{p.wallet ? money(p.wallet.balance) : '—'}</span>,
                <div key="a" className="row-actions">
                  <Button size="sm" onClick={() => openReceipt(p.stmt)}>收款登记</Button>
                  {p.inv < p.net - 0.001 && <Button size="sm" variant="ghost" onClick={() => run(store.getState().closeSalesStatement(p.stmt.id))}>手工办结</Button>}
                </div>,
              ])}
            />
            {filteredPending.length === 0 && (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无待回款结算单（销售结算单确认后展示）</div>
            )}
          </Card>
        )}

        {view === 'records' && (
          <Card style={{ padding: 0 }}>
            <Table
              headers={['回款日期', '结算单号', '结算对象', '回款金额', '收款方式', '备注']}
              rows={filteredRecords.map((r) => [
                <span key="d" className="mono">{r.date}</span>,
                <span key="c" className="cell-mono-emph">{r.code}</span>,
                <span key="t" className="cell-emph">{r.target}</span>,
                <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)', color: '#01795D' }}>{money(r.amount)}</span>,
                <StatusTag key="m" variant={METHOD_TONE[r.method] ?? 'info'} label={RECEIPT_METHOD_LABELS[r.method as keyof typeof RECEIPT_METHOD_LABELS] ?? r.method} />,
                <span key="rm" className="cell-muted" style={{ fontSize: 'var(--text-sm)' }}>{r.remark || '—'}</span>,
              ])}
            />
            {filteredRecords.length === 0 && (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无回款记录（收款登记后展示）</div>
            )}
          </Card>
        )}

        {view === 'accounts' && (
          <Card style={{ padding: 0 }}>
            <Table
              headers={['客户', '预存余额', '充值', '消费', '退款', '最近流水']}
              rows={wallets.map((w) => {
                const sum = (t: string) => w.txns.filter((x) => x.type === t).reduce((s, x) => s + x.amount, 0);
                return [
                  <span key="n" className="cell-emph">{w.customerName}</span>,
                  <span key="b" className="mono" style={{ fontWeight: 'var(--font-semibold)', color: '#01795D' }}>{money(w.balance)}</span>,
                  <span key="r" className="mono">{money(sum('recharge'))}</span>,
                  <span key="c" className="mono">{money(sum('consume'))}</span>,
                  <span key="f" className="mono">{money(sum('refund'))}</span>,
                  <span key="l" className="cell-muted" style={{ fontSize: 'var(--text-xs)' }}>{w.txns[0]?.note ?? '—'}（{w.txns[0]?.time ?? ''}）</span>,
                ];
              })}
            />
            {wallets.length === 0 && (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无预存账户（右上角「预收款登记」后展示）</div>
            )}
          </Card>
        )}
      </div>

      {/* 收款登记 / 预收款登记 弹窗 */}
      {dialog && (
        <div className="category-dialog-overlay" onClick={() => setDialog(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 480 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
              {dialog.kind === 'receipt' ? `收款登记 · ${dialog.code}` : '预收款登记'}
            </div>
            {dialog.kind === 'receipt' && (() => {
              const s = salesStatements.find((x) => x.id === dialog.id)!;
              const wallet = wallets.find((w) => w.customerName === s.settleTarget);
              return (
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
                  {s.settleTarget} · 结算净额 {money(netOf(s))} · 已收 {money(receivedOf(s))} ·
                  未收余额 <strong className="mono">{money(netOf(s) - receivedOf(s))}</strong>
                  （支持部分收款，多笔到账逐步核销）
                  {wallet && <> · 预存余额 <strong className="mono">{money(wallet.balance)}</strong></>}
                </div>
              );
            })()}
            {dialog.kind === 'prepay' && (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
                预付客户的预付款登记为预存余额；对账收款登记时可选择「预存余额支付」核销扣减。
              </div>
            )}
            {dialog.kind === 'prepay' && (
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>客户 *</label>
                <select className="filter-select" style={{ width: '100%' }} value={form.name || '__manual'} onChange={(e) => setForm({ ...form, name: e.target.value === '__manual' ? '' : e.target.value })}>
                  {[...new Set([...wallets.map((w) => w.customerName), ...salesStatements.map((s) => s.settleTarget)])].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                  <option value="__manual">其他客户（手动输入）</option>
                </select>
                {form.name === '' && (
                  <input className="filter-input" placeholder="客户名称" style={{ width: '100%', marginTop: 8 }} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                )}
              </div>
            )}
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>{dialog.kind === 'receipt' ? '收款金额 *' : '预收金额 *'}</label>
              <input className="filter-input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: '100%' }} />
            </div>
            {dialog.kind === 'receipt' && (
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>收款方式</label>
                <select className="filter-select" style={{ width: '100%' }} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as ReceiptMethod })}>
                  {(Object.keys(RECEIPT_METHOD_LABELS) as ReceiptMethod[]).map((m) => (
                    <option key={m} value={m}>{RECEIPT_METHOD_LABELS[m]}{m === 'wallet' && dialog.target ? `（${dialog.target}）` : ''}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>日期</label>
              <input className="filter-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Button variant="ghost" onClick={() => setDialog(null)}>关闭</Button>
              <Button
                disabled={!(Number(form.amount) > 0) || (dialog.kind === 'prepay' && !form.name.trim())}
                onClick={() => {
                  if (dialog.kind === 'receipt') {
                    run(store.getState().registerSalesReceipt(dialog.id!, { amount: Number(form.amount), date: form.date, method: form.method, remark: form.remark }));
                  } else {
                    run(store.getState().walletRecharge(form.name.trim(), Number(form.amount), '预付款充值'));
                  }
                }}
              >确认登记</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
