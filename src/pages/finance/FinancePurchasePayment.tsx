/**
 * 财务 · 付款管理（合作商付款台账）
 * 数据源 = 合作商对账单的付款记录（购销背对背的应付侧：付款核销完成 → 采购单已结算）。
 * 对账生成 / 确认 / 付款核销在「财务 → 合作商结算」操作；本页为付款台账视角。
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusTag from '../../components/common/StatusTag';
import { useSettlementStore, partnerPaidOfPo } from '../../stores/settlementStore';
import { usePurchaseStore } from '../../stores/purchaseStore';

const money = (n: number) => `¥${n.toLocaleString()}`;

export default function FinancePurchasePayment() {
  const navigate = useNavigate();
  const partnerStatements = useSettlementStore((s) => s.partnerStatements);
  const poDocs = usePurchaseStore((s) => s.docs);
  const [keyword, setKeyword] = useState('');
  const [view, setView] = useState<'records' | 'pending'>('records');

  /** 付款记录：合作商对账单付款流水 */
  const records = useMemo(() => partnerStatements.flatMap((s) => s.payments.map((p) => ({
    id: p.id, code: s.code, supplier: s.supplierName, amount: p.amount, date: p.date,
    account: p.account ?? '', remark: p.remark ?? '',
  }))).sort((a, b) => b.date.localeCompare(a.date)), [partnerStatements]);

  /** 待付款：已确认合作商对账单的未付余额（付款核销未完成） */
  const pending = useMemo(() => partnerStatements
    .filter((s) => s.status === 'confirmed' && s.payments.reduce((acc, p) => acc + p.amount, 0) < s.amount - 0.001)
    .map((s) => {
      const paid = s.payments.reduce((acc, p) => acc + p.amount, 0);
      return { code: s.code, supplier: s.supplierName, amount: s.amount, paid, balance: s.amount - paid, poCount: s.lines.length };
    }), [partnerStatements]);

  const kw = keyword.trim();
  const filteredRecords = kw ? records.filter((r) => r.code.includes(kw) || r.supplier.includes(kw)) : records;
  const filteredPending = kw ? pending.filter((p) => p.code.includes(kw) || p.supplier.includes(kw)) : pending;
  const totalPaid = records.reduce((s, r) => s + r.amount, 0);
  /** 未入对账单但已签收未结算的采购单金额（待生成对账单） */
  const unStatemented = poDocs
    .filter((d) => d.status === 'delivered' && !partnerStatements.some((s) => s.lines.some((l) => l.poId === d.id)) && partnerPaidOfPo(partnerStatements, d.id) < d.amount - 0.001)
    .reduce((s, d) => s + d.amount, 0);

  return (
    <>
      <ContentHeader title="付款管理" breadcrumbs={['财务', '应收应付', '付款管理']} actions={<Button onClick={() => navigate('/finance/finance-partner-settlement')}>去合作商结算付款 →</Button>} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          合作商付款台账（<strong>购销背对背</strong>的应付侧）：数据来自<strong>合作商对账单</strong>的付款核销，
          付款按合作商独立账期执行、不以客户回款为前提；付款核销完成 → 关联采购单置为已结算。
          累计付款 <strong className="mono">{money(totalPaid)}</strong> · 已签收未入对账单 {money(unStatemented)}（待生成对账单）。
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          {([['records', `付款记录 ${records.length}`], ['pending', `待付款 ${pending.length}`]] as const).map(([k, label]) => (
            <button key={k} className={`tab-card-simple${view === k ? ' active' : ''}`} onClick={() => setView(k as typeof view)}>{label}</button>
          ))}
          <input className="filter-input" placeholder="搜索对账单号、合作商..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 240 }} />
        </div>

        {view === 'records' ? (
          <Card style={{ padding: 0 }}>
            <Table
              headers={['付款日期', '对账单号', '合作商', '付款金额', '付款账户', '备注']}
              rows={filteredRecords.map((r) => [
                <span key="d" className="mono">{r.date}</span>,
                <span key="c" className="cell-mono-emph">{r.code}</span>,
                <span key="s" className="cell-emph">{r.supplier}</span>,
                <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)', color: '#CB405D' }}>{money(r.amount)}</span>,
                <span key="ac" style={{ fontSize: 'var(--text-sm)' }}>{r.account || '—'}</span>,
                <span key="rm" className="cell-muted" style={{ fontSize: 'var(--text-sm)' }}>{r.remark || '—'}</span>,
              ])}
            />
            {filteredRecords.length === 0 && (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无付款记录（在合作商结算付款核销后展示）</div>
            )}
          </Card>
        ) : (
          <Card style={{ padding: 0 }}>
            <Table
              headers={['对账单号', '合作商', '采购单数', '应付金额', '已付', '未付余额', '状态']}
              rows={filteredPending.map((p) => [
                <span key="c" className="cell-mono-emph">{p.code}</span>,
                <span key="s" className="cell-emph">{p.supplier}</span>,
                <span key="n" className="mono">{p.poCount} 张</span>,
                <span key="a" className="mono">{money(p.amount)}</span>,
                <span key="pd" className="mono" style={{ color: '#01795D' }}>{money(p.paid)}</span>,
                <span key="b" className="mono" style={{ color: '#B26A00', fontWeight: 'var(--font-semibold)' }}>{money(p.balance)}</span>,
                <StatusTag variant="warning" label="已确认 · 待付款" />,
              ])}
            />
            {filteredPending.length === 0 && (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无待付款对账单</div>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
