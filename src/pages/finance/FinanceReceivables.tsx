import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { EXTERNAL_PLATFORM_LABELS, platformLabelOf } from '../../data/externalOrders';
import type {} from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

const addDays = (date: string, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

/**
 * 财务 · 应收管理（客户应收账款）
 * 由销售订单按合同约定确认节点派生（演示：妥投/完成后确认应收）；收款核销见「收款管理」。
 */
export default function FinanceReceivables() {
  const navigate = useNavigate();
  const orders = useOrderFlowStore((s) => s.orders);
  const [tab, setTab] = useState<'' | 'unsettled' | 'settled'>('');

  /** 应收范围：已进入履约的订单（转派待接单起 / 自营已接单起）；确认节点=妥投以后 */
  const arOrders = useMemo(() => orders.filter((o) => {
    if (o.path === 'self') return !['self_pending'].includes(o.processStatus);
    return ['distribute_pending', 'processed', 'completed'].includes(o.processStatus);
  }), [orders]);

  const rows = arOrders.map((o) => {
    const confirmed = ['self_delivered', 'completed', 'processed'].includes(o.processStatus)
      && (o.path === 'self' ? true : (o.partnerStatus ?? 'accepted') !== 'pending');
    // 演示收款口径：确认收货/结算完成 → 全额已收；妥投 → 收 60%；确认前 → 未收
    const settled = o.processStatus === 'completed';
    const received = settled ? o.totalAmount : confirmed ? Math.round(o.totalAmount * 0.6) : 0;
    const dueDate = addDays(o.entryTime, 30);
    const overdue = !settled && new Date(dueDate) < new Date('2026-11-30');
    return {
      code: o.code, customer: o.customerName, platform: platformLabelOf(o),
      amount: o.totalAmount, received, unreceived: o.totalAmount - received,
      dueDate, confirmed, settled, overdue,
    };
  });

  const filtered = tab === '' ? rows : rows.filter((r) => (tab === 'settled' ? r.settled : !r.settled));
  const totalAR = rows.reduce((s, r) => s + r.amount, 0);
  const totalReceived = rows.reduce((s, r) => s + r.received, 0);
  const totalUnreceived = totalAR - totalReceived;


  return (
    <>
      <ContentHeader title="应收管理" breadcrumbs={['财务', '应收应付', '应收管理']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          管理平台向客户销售形成的<strong>应收账款</strong>：应收按<strong>合同约定的确认节点</strong>生成（演示：妥投后确认，账期 30 天）；
          收款核销在「收款管理」（支持一笔收款核销多单、部分收款与预收款）。
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
            headers={['应收单号', '客户', '来源销售订单', '应收金额', '已收金额', '未收金额', '到期日期', '应收状态']}
            rows={filtered.map((r) => [
              <span key="c" className="cell-mono-emph">AR-{r.code}</span>,
              <span key="cu" className="cell-emph">{r.customer}</span>,
              <span key="so" className="mono" style={{ fontSize: 'var(--text-sm)' }}>{r.code}</span>,
              <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(r.amount)}</span>,
              <span key="rec" className="mono" style={{ color: r.received > 0 ? '#01795D' : 'var(--color-neutral-400)' }}>{money(r.received)}</span>,
              <span key="un" className="mono" style={{ color: r.unreceived > 0 ? '#B26A00' : 'var(--color-neutral-400)' }}>{money(r.unreceived)}</span>,
              <span key="d" className="cell-muted" style={{ fontSize: 'var(--text-sm)' }}>{r.dueDate}</span>,
              r.settled
                ? pill('#ECEFF1', '#455A64', '已结清')
                : r.received > 0
                  ? pill('#E0F2F1', '#00695C', r.confirmed ? '部分已收' : '预收')
                  : pill(r.confirmed ? '#FBF3E2' : '#F5F5F5', r.confirmed ? '#9A7A1C' : '#9E9E9E', r.confirmed ? (r.overdue ? '已逾期 · 待收' : '已确认 · 待收') : '未到确认节点'),
            ])}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无应收记录</div>
          )}
        </Card>

        <div style={{ marginTop: 'var(--space-3)', display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate('/finance/finance-sales-collection')}>去收款管理核销 →</Button>
        </div>
      </div>
    </>
  );
}
