/**
 * 财务 · 收款管理（客户回款台账）
 * 数据源 = 客户对账单的收款记录（含钱包余额支付）；未收余额按对账单展示。
 * 收款登记操作在「销售 → 客户对账」；本页为回款台账视角。
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusTag from '../../components/common/StatusTag';
import { useSettlementStore, netOf, receivedOf } from '../../stores/settlementStore';
import { RECEIPT_METHOD_LABELS } from '../../types';
import type { StatementStatus } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const METHOD_TONE: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  bank: 'success', wallet: 'info', cash: 'default', acceptance: 'warning', alipay: 'info', wechat: 'info',
};

export default function FinanceSalesCollection() {
  const navigate = useNavigate();
  const statements = useSettlementStore((s) => s.statements);
  const [keyword, setKeyword] = useState('');
  const [view, setView] = useState<'records' | 'pending'>('records');

  /** 回款记录：对账单收款流水（每笔一行） */
  const records = useMemo(() => statements.flatMap((s) => s.receipts.map((r) => ({
    id: r.id, code: s.code, target: s.settleTarget, amount: r.amount, date: r.date,
    method: r.method as string, remark: r.remark ?? '', wallet: r.method === 'wallet',
  }))).sort((a, b) => b.date.localeCompare(a.date)), [statements]);

  /** 待回款：已确认对账单的未收余额 */
  const pending = useMemo(() => statements
    .filter((s) => (s.status === 'confirmed' || s.status === 'disputed') && receivedOf(s) < netOf(s) - 0.001)
    .map((s) => ({
      code: s.code, target: s.settleTarget, net: netOf(s), rec: receivedOf(s),
      balance: netOf(s) - receivedOf(s), status: s.status as StatementStatus,
    })), [statements]);

  const kw = keyword.trim();
  const filteredRecords = kw ? records.filter((r) => r.code.includes(kw) || r.target.includes(kw)) : records;
  const filteredPending = kw ? pending.filter((p) => p.code.includes(kw) || p.target.includes(kw)) : pending;
  const totalReceived = records.reduce((s, r) => s + r.amount, 0);
  const walletReceived = records.filter((r) => r.wallet).reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <ContentHeader title="收款管理" breadcrumbs={['财务', '应收应付', '收款管理']} actions={<Button onClick={() => navigate('/sales/sales-reconciliation')}>去登记收款 →</Button>} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          客户回款台账：数据来自<strong>客户对账单</strong>的收款登记（支持部分收款，多笔到账逐步核销）；
          预付客户可选<strong>钱包余额支付</strong>（核销扣减客户钱包）。累计回款 <strong className="mono">{money(totalReceived)}</strong>
          （其中钱包支付 {money(walletReceived)}）。
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          {([['records', `回款记录 ${records.length}`], ['pending', `待回款 ${pending.length}`]] as const).map(([k, label]) => (
            <button key={k} className={`tab-card-simple${view === k ? ' active' : ''}`} onClick={() => setView(k as typeof view)}>{label}</button>
          ))}
          <input className="filter-input" placeholder="搜索对账单号、结算对象..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 240 }} />
        </div>

        {view === 'records' ? (
          <Card style={{ padding: 0 }}>
            <Table
              headers={['回款日期', '对账单号', '结算对象', '回款金额', '收款方式', '备注']}
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
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无回款记录（在客户对账登记收款后展示）</div>
            )}
          </Card>
        ) : (
          <Card style={{ padding: 0 }}>
            <Table
              headers={['对账单号', '结算对象', '对账净额', '已收', '未收余额', '对账状态']}
              rows={filteredPending.map((p) => [
                <span key="c" className="cell-mono-emph">{p.code}</span>,
                <span key="t" className="cell-emph">{p.target}</span>,
                <span key="n" className="mono">{money(p.net)}</span>,
                <span key="r" className="mono" style={{ color: '#01795D' }}>{money(p.rec)}</span>,
                <span key="b" className="mono" style={{ color: '#B26A00', fontWeight: 'var(--font-semibold)' }}>{money(p.balance)}</span>,
                <StatusTag key="s" variant={p.status === 'disputed' ? 'error' : 'warning'} label={p.status === 'disputed' ? '有异议' : '已确认 · 待收'} />,
              ])}
            />
            {filteredPending.length === 0 && (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无待回款对账单</div>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
