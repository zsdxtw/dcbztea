import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Tag from '../../components/common/Tag';
import StatusTag, { orderStatusToVariant, orderStatusLabel } from '../../components/common/StatusTag';
import LineChart from '../../components/charts/LineChart';
import { purchaseOrders } from '../../data/mock';
import type { StatCardData } from '../../types';

/* ── 统计卡片数据 ── */
const statCards: StatCardData[] = [
  {
    label: '本月采购额',
    value: '856,200',
    unit: '¥',
    trend: { direction: 'down', value: '3.2%' },
    icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 5h12l-1.2 8H4.2L3 5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    label: '采购订单数',
    value: '47',
    trend: { direction: 'up', value: '+5 单' },
    icon: <svg viewBox="0 0 18 18" fill="none"><rect x="4" y="2" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/></svg>,
  },
  {
    label: '待审核',
    value: '6',
    trend: { direction: 'down', value: '3 单' },
    icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 8h4M7 11h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  },
  {
    label: '供应商数',
    value: '10',
    trend: { direction: 'up', value: '+2' },
    icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M3 15a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    label: '本月退货额',
    value: '45,680',
    unit: '¥',
    trend: { direction: 'down', value: '8.5%' },
    icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 5h12l-1.2 8H4.2L3 5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M11 5l2-2M13 3l0 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    label: '待对账',
    value: '8',
    trend: { direction: 'up', value: '需及时处理' },
    icon: <svg viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M6 8h6M6 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  },
];

/* ── 采购趋势数据 ── */
const purchaseTrendData = {
  labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
  series: [
    { name: '采购额', color: 'var(--color-module-current-base)', data: [68, 72, 85, 78, 92, 88, 86] },
    { name: '去年同期', color: 'var(--color-neutral-300)', data: [55, 60, 70, 65, 75, 72, 70] },
  ],
};

/* ── 待办事项 ── */
const todoItems = [
  { text: '审核采购订单 PO-2025-0151', time: '10:30', done: false },
  { text: '确认大红袍入库', time: '11:00', done: false },
  { text: '供应商对账 — 武夷山茶业', time: '14:00', done: false },
  { text: '确认清香铁观音到货', time: '15:30', done: false },
  { text: '跟进白牡丹采购进度', time: '16:00', done: false },
];

export default function PurchaseOverview() {
  return (
    <>
      <ContentHeader title="采购概览" breadcrumbs={['采购&仓储', '采购概览']} />
      <div className="content-body">
        {/* 核心指标 */}
        <div className="stat-cards">
          {statCards.map((s, i) => <StatCard key={i} data={s} />)}
        </div>

        {/* 采购趋势 + 待办事项 */}
        <div className="grid-2">
          <Card title="采购趋势">
            <LineChart data={purchaseTrendData} />
          </Card>
          <Card title="待办事项" headerRight={<span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-module-purchase-secondary)' }}>{todoItems.filter(t => !t.done).length} 项待处理</span>}>
            <div style={{ padding: 'var(--space-2) 0' }}>
              {todoItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: i < todoItems.length - 1 ? '1px solid var(--color-neutral-100)' : 'none' }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: item.done ? 'var(--color-neutral-300)' : 'var(--color-module-current-base)',
                  }} />
                  <span style={{
                    flex: 1, fontSize: 'var(--text-sm)',
                    color: item.done ? 'var(--color-neutral-400)' : 'var(--color-neutral-700)',
                    textDecoration: item.done ? 'line-through' : 'none',
                  }}>{item.text}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', fontFamily: 'var(--font-family-mono)', flexShrink: 0 }}>{item.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 近期采购订单 */}
        <Card title="近期采购订单" style={{ marginTop: 'var(--space-4)' }}>
          <Table
            headers={['订单编号', '供应商', '商品', '茶类', '数量', '金额', '状态']}
            rows={purchaseOrders.map(order => [
              <span className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{order.code}</span>,
              <span>{order.partner}</span>,
              <span style={{ fontWeight: 'var(--font-medium)' }}>{order.product}</span>,
              <Tag category={order.teaCategory} />,
              <span className="mono">{order.quantity}</span>,
              <span className="mono">{order.amount}</span>,
              <StatusTag variant={orderStatusToVariant(order.status)} label={orderStatusLabel(order.status)} />,
            ])}
          />
        </Card>
      </div>
    </>
  );
}
