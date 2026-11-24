/**
 * 财务 · 发票管理（销项 / 进项发票台账）
 * 数据源 = 客户对账单发票记录（销项）+ 合作商对账单进项发票记录（收票）。
 * 开票 / 收票登记分别在「销售 → 客户对账」「财务 → 合作商结算」操作。
 */
import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import StatusTag from '../../components/common/StatusTag';
import { useSettlementStore } from '../../stores/settlementStore';

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

export default function FinanceInvoice() {
  const statements = useSettlementStore((s) => s.statements);
  const partnerStatements = useSettlementStore((s) => s.partnerStatements);
  const [keyword, setKeyword] = useState('');
  const [tab, setTab] = useState<'' | 'output' | 'input'>('');

  const rows = useMemo<InvoiceRow[]>(() => {
    const output = statements.flatMap((s) => s.invoices.map((i) => ({
      invoiceNo: i.invoiceNo, type: '销项发票' as const, party: s.settleTarget, refCode: s.code,
      amount: i.amount, date: i.date, remark: i.remark,
    })));
    const input = partnerStatements.flatMap((s) => s.invoices.map((i) => ({
      invoiceNo: i.invoiceNo, type: '进项发票' as const, party: s.supplierName, refCode: s.code,
      amount: i.amount, date: i.date, remark: '采购进项收票',
    })));
    return [...output, ...input].sort((a, b) => b.date.localeCompare(a.date));
  }, [statements, partnerStatements]);

  const kw = keyword.trim();
  const filtered = rows
    .filter((r) => (tab === '' ? true : tab === 'output' ? r.type === '销项发票' : r.type === '进项发票'))
    .filter((r) => (!kw ? true : r.invoiceNo.includes(kw) || r.party.includes(kw) || r.refCode.includes(kw)));
  const outputTotal = rows.filter((r) => r.type === '销项发票').reduce((s, r) => s + r.amount, 0);
  const inputTotal = rows.filter((r) => r.type === '进项发票').reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <ContentHeader title="发票管理" breadcrumbs={['财务', '发票管理']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          发票台账与对账单打通：销项发票来自<strong>客户对账单</strong>开票登记（部分开票支持多张发票累计覆盖），
          进项发票来自<strong>合作商对账单</strong>收票登记。销项合计 {money(outputTotal)} · 进项合计 {money(inputTotal)}。
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          {([['', '全部发票'], ['output', '销项发票'], ['input', '进项发票']] as const).map(([k, label]) => (
            <button key={k || 'all'} className={`tab-card-simple${tab === k ? ' active' : ''}`} onClick={() => setTab(k as typeof tab)}>
              {label}
              <span className="tab-card-simple-count">{rows.filter((r) => (k === '' ? true : k === 'output' ? r.type === '销项发票' : r.type === '进项发票')).length}</span>
            </button>
          ))}
          <input className="filter-input" placeholder="搜索发票号、购买方 / 销售方、对账单号..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 280 }} />
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['发票号', '类型', '购买方 / 销售方', '关联对账单', '金额', '开票 / 收票日期', '备注']}
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
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无发票记录（对账单开票 / 合作商收票后展示）</div>
          )}
        </Card>
      </div>
    </>
  );
}
