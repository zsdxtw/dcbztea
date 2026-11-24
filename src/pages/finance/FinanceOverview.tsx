import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import LineChart from '../../components/charts/LineChart';
import PieChart from '../../components/charts/PieChart';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { useSettlementStore, netOf, receivedOf, partnerPaidOfPo } from '../../stores/settlementStore';
import { receiveStateOf } from '../../utils/salesOrderFamily';
import type { StatCardData } from '../../types';

const revenueTrendData = {
  labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
  series: [
    { name: '收入', color: 'var(--color-module-current-base)', data: [180, 165, 210, 195, 230, 245, 280] },
    { name: '支出', color: 'var(--color-module-finance-secondary)', data: [120, 110, 140, 135, 155, 160, 175] },
  ],
};

const receivablePayablePieData = [
  { name: '应收金额', value: 65, color: 'var(--color-module-current-base)' },
  { name: '应付金额', value: 35, color: 'var(--color-module-finance-secondary)' },
];

const todoItems = [
  { text: '华茗堂茶庄应收款 ¥28,600 即将到期', time: '3天后', type: '收款' },
  { text: '武夷山茶业应付单 ¥42,800 待付款', time: '今日', type: '付款' },
  { text: '与雅韵茶社6月对账单待确认', time: '明天', type: '对账' },
  { text: '云南普洱茶业逾期付款 ¥45,600', time: '已逾期5天', type: '逾期' },
  { text: '品茗轩销项发票 ¥38,000 待开具', time: '本周内', type: '开票' },
];

function todoTypeColor(type: string) {
  switch (type) {
    case '收款': return '#01795D';
    case '付款': return 'var(--color-module-current-base)';
    case '对账': return 'var(--color-module-finance-secondary)';
    case '逾期': return '#CB405D';
    case '开票': return '#FD742D';
    default: return 'var(--color-neutral-400)';
  }
}

/**
 * 财务概览：应收 / 应付 / 收支按结算中心真实数据联动——
 * 收入 = 客户对账单收款核销累计 + 未入对账单的已收款订单；支出 = 合作商付款核销 + 自营采购已结算；
 * 应收余额 = 对账单净额 − 已收款；应付余额 = 未结算采购单金额 − 对账单已付分摊。
 */
export default function FinanceOverview() {
  const orders = useOrderFlowStore((s) => s.orders);
  const docs = usePurchaseStore((s) => s.docs);
  const statements = useSettlementStore((s) => s.statements);
  const partnerStatements = useSettlementStore((s) => s.partnerStatements);

  const inStatement = new Set(statements.flatMap((s) => s.lines.map((l) => l.orderId)));
  const receivedTotal = statements.reduce((acc, s) => acc + receivedOf(s), 0)
    + orders.filter((o) => !inStatement.has(o.id) && o.processStatus !== 'cancelled' && receiveStateOf(o, docs.filter((d) => d.childOrderId === o.id)) === '已收款')
      .reduce((acc, o) => acc + o.totalAmount, 0);
  const paidTotal = partnerStatements.reduce((acc, s) => acc + s.payments.reduce((x, p) => x + p.amount, 0), 0)
    + docs.filter((d) => d.source === 'self' && d.status === 'settled').reduce((acc, d) => acc + d.amount, 0);
  const arBalance = statements.filter((s) => s.status !== 'pending').reduce((acc, s) => acc + Math.max(0, netOf(s) - receivedOf(s)), 0);
  const apBalance = docs
    .filter((d) => ['confirmed', 'received', 'partial_shipped', 'fully_shipped', 'delivered'].includes(d.status))
    .reduce((acc, d) => acc + Math.max(0, d.amount - partnerPaidOfPo(partnerStatements, d.id)), 0);
  const profit = receivedTotal - paidTotal;
  const profitRate = receivedTotal > 0 ? ((profit / receivedTotal) * 100).toFixed(1) : '0.0';

  const stats: StatCardData[] = [
    { label: '总收入（已回款）', value: receivedTotal.toLocaleString(), unit: '¥', trend: { direction: 'up', value: '按对账单收款核销' }, icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 14l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: '总支出（已付款）', value: paidTotal.toLocaleString(), unit: '¥', trend: { direction: 'up', value: '含自营采购结算' }, icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 5h12l-1.2 8H4.2L3 5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
    { label: '应收余额', value: arBalance.toLocaleString(), unit: '¥', icon: <svg viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8h2M5 11h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
    { label: '应付余额', value: apBalance.toLocaleString(), unit: '¥', icon: <svg viewBox="0 0 18 18" fill="none"><rect x="4" y="2" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6h4M7 9h4M7 12h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
    { label: '利润（回款−付款）', value: profit.toLocaleString(), unit: '¥', trend: { direction: profit >= 0 ? 'up' : 'down', value: '毛口径' }, icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: '利润率', value: profitRate, unit: '%', icon: <svg viewBox="0 0 18 18" fill="none"><path d="M9 2l2.5 5 5.5.8-4 3.9.9 5.5L9 14.7 5.1 17.2l.9-5.5-4-3.9L7.5 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
  ];

  return (
    <>
      <ContentHeader title="财务概览" breadcrumbs={['财务', '财务概览']} actions={<Button><PlusIcon />新建收支</Button>} />
      <div className="content-body">
        <div className="stat-cards">
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>
        <div className="grid-2">
          <Card title="收支趋势">
            <LineChart data={revenueTrendData} />
          </Card>
          <Card title="应收应付概览">
            <PieChart data={receivablePayablePieData} />
          </Card>
        </div>
        <Card title="近期待办" style={{ marginTop: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {todoItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: i < todoItems.length - 1 ? '1px solid var(--color-border-primary)' : 'none' }}>
                <span style={{ padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: `${todoTypeColor(item.type)}12`, color: todoTypeColor(item.type), border: `1px solid ${todoTypeColor(item.type)}30`, flexShrink: 0 }}>{item.type}</span>
                <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{item.text}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{item.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
