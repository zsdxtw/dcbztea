/**
 * 财务 · 应收管理（客户应收账款）
 * 应收 = 客户对账单（已确认 / 有异议 / 已办结）：应收余额 = 对账净额 − 已收款核销。
 * 对账单生成与开票 / 收款操作在「销售 → 客户对账」；本页为应收台账视角。
 * 设计见 docs/销售单结算流程设计建议.md 4.2-7。
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useSettlementStore, netOf, receivedOf, invoicedOf } from '../../stores/settlementStore';
import type { StatementStatus } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

export default function FinanceReceivables() {
  const navigate = useNavigate();
  const statements = useSettlementStore((s) => s.statements);
  const [tab, setTab] = useState<'' | 'unsettled' | 'settled'>('');

  /** 应收台账：进入对账环节的对账单（待对账为预对账、确认后为正式应收） */
  const rows = useMemo(() => statements.map((s) => {
    const net = netOf(s);
    const rec = receivedOf(s);
    const inv = invoicedOf(s);
    return {
      code: s.code, target: s.settleTarget, type: s.customerType, period: s.period,
      lines: s.lines.length, net, inv, rec, balance: net - rec,
      status: s.status as StatementStatus,
      settled: rec >= net - 0.001,
      confirmed: s.status === 'confirmed' || s.status === 'closed',
    };
  }), [statements]);

  const filtered = tab === '' ? rows : rows.filter((r) => (tab === 'settled' ? r.settled : !r.settled));
  const totalAR = rows.reduce((s, r) => s + r.net, 0);
  const totalReceived = rows.reduce((s, r) => s + r.rec, 0);

  return (
    <>
      <ContentHeader title="应收管理" breadcrumbs={['财务', '应收应付', '应收管理']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          管理平台向客户销售形成的<strong>应收账款</strong>：应收以<strong>客户对账单</strong>为载体（按结算对象 + 账期手工生成），
          应收余额 = <strong>对账净额 − 已收款核销</strong>（部分收款按已收金额计）。开票 / 收款核销在「销售 → 客户对账」操作。
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
          {([['', '全部应收'], ['unsettled', '未结清'], ['settled', '已结清']] as const).map(([k, label]) => (
            <button key={k || 'all'} className={`tab-card-simple${tab === k ? ' active' : ''}`} onClick={() => setTab(k as typeof tab)}>
              {label}
              <span className="tab-card-simple-count">{k === '' ? rows.length : rows.filter((r) => (k === 'settled' ? r.settled : !r.settled)).length}</span>
            </button>
          ))}
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['对账单号', '结算对象', '客户类型', '账期', '对账明细', '应收金额', '已开票', '已收金额', '应收余额', '应收状态']}
            rows={filtered.map((r) => [
              <span key="c" className="cell-mono-emph">{r.code}</span>,
              <span key="cu" className="cell-emph">{r.target}</span>,
              <span key="t" style={{ fontSize: 'var(--text-sm)' }}>{r.type}</span>,
              <span key="p" className="cell-muted" style={{ fontSize: 'var(--text-xs)' }}>{r.period}</span>,
              <span key="l" className="mono">{r.lines} 行</span>,
              <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(r.net)}</span>,
              <span key="i" className="mono" style={{ color: r.inv > 0 ? '#01795D' : 'var(--color-neutral-400)' }}>{money(r.inv)}</span>,
              <span key="r" className="mono" style={{ color: r.rec > 0 ? '#01795D' : 'var(--color-neutral-400)' }}>{money(r.rec)}</span>,
              <span key="u" className="mono" style={{ color: r.balance > 0 ? '#B26A00' : 'var(--color-neutral-400)', fontWeight: r.balance > 0 ? 'var(--font-semibold)' : undefined }}>{money(r.balance)}</span>,
              r.settled
                ? pill('#ECEFF1', '#455A64', r.status === 'closed' ? '已办结 · 已结清' : '已结清')
                : r.rec > 0
                  ? pill('#E0F2F1', '#00695C', '部分已收')
                  : pill(r.confirmed ? '#FBF3E2' : '#F5F5F5', r.confirmed ? '#9A7A1C' : '#9E9E9E', r.confirmed ? '已确认 · 待收' : '待对账'),
            ])}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无应收记录（对账单确认后进入应收）</div>
          )}
        </Card>

        <div style={{ marginTop: 'var(--space-3)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
            应收总额 {money(totalAR)} · 已核销 {money(totalReceived)} · 余额 <strong className="mono">{money(totalAR - totalReceived)}</strong>
          </span>
          <Button onClick={() => navigate('/sales/sales-reconciliation')}>去客户对账操作 →</Button>
        </div>
      </div>
    </>
  );
}
