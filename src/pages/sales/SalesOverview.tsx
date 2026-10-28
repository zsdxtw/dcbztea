import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Tag from '../../components/common/Tag';
import Button from '../../components/common/Button';
import StatusTag, { orderStatusToVariant, orderStatusLabel } from '../../components/common/StatusTag';
import LineChart from '../../components/charts/LineChart';
import { salesOrders } from '../../data/mock';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import {
  EXTERNAL_PLATFORM_LABELS, EXTERNAL_CHANNEL_LABELS, EXTERNAL_STATUS_LABELS,
  EXTERNAL_STATUS_COLORS, TRANSFER_SOURCE_LABELS,
} from '../../data/externalOrders';
import type { StatCardData, ExternalOrder } from '../../types';

/* ── 销售趋势数据（mock） ── */
const salesTrendData = {
  labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
  series: [
    { name: '销售额', color: 'var(--color-module-current-base)', data: [82, 78, 95, 88, 105, 98, 128] },
    { name: '去年同期', color: 'var(--color-neutral-300)', data: [65, 60, 75, 70, 82, 78, 85] },
  ],
};

/** 流程状态 → 概览分布项（顺序即流程图顺序） */
const FLOW_BRIEF: { key: string; label: string }[] = [
  { key: 'pending', label: '分发-待处理' },
  { key: 'report_match_pending', label: '报备-匹配待确认' },
  { key: 'self_pending', label: '自营待接单' },
  { key: 'grabbing', label: '抢单中' },
  { key: 'comparing', label: '比单中' },
  { key: 'distribute_pending', label: '转派待接单' },
  { key: 'handled', label: '分发-已完成' },
];

const money = (n: number) => `¥${n.toLocaleString()}`;

const statusPill = (status: string, label?: string) => {
  const c = EXTERNAL_STATUS_COLORS[status];
  return (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: c?.bg, color: c?.color, whiteSpace: 'nowrap' }}>
      {label ?? EXTERNAL_STATUS_LABELS[status]}
    </span>
  );
};

/** 路径标签（与订单分发页口径一致：自营 / 转派-报备·指定·抢单·比单） */
const pathLabel = (o: ExternalOrder): string => {
  if (o.path === 'self') return '自营';
  if (o.transferSource) return TRANSFER_SOURCE_LABELS[o.transferSource];
  if (o.distributeMode === 'grab') return '转派-抢单';
  if (o.distributeMode === 'compare') return '转派-比单';
  return '—';
};

export default function SalesOverview() {
  const navigate = useNavigate();
  const flowOrders = useOrderFlowStore((s) => s.orders);

  /** 订单分发各状态单数（已处理 = 已处理 + 已完成） */
  const statusCount = useMemo(() => {
    const c: Record<string, number> = {};
    flowOrders.forEach((o) => {
      const key = o.processStatus === 'completed' ? 'handled' : o.processStatus;
      c[key] = (c[key] ?? 0) + 1;
    });
    return c;
  }, [flowOrders]);

  const flowTodo = (statusCount.pending ?? 0) + (statusCount.report_match_pending ?? 0) + (statusCount.self_pending ?? 0) + (statusCount.distribute_pending ?? 0);
  const compareQuotes = flowOrders
    .filter((o) => o.processStatus === 'comparing')
    .reduce((s, o) => s + (o.compare?.quotes.length ?? 0), 0);
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthFlowAmount = flowOrders
    .filter((o) => o.entryTime.startsWith(monthKey))
    .reduce((s, o) => s + o.totalAmount, 0);
  const recentFlow = useMemo(
    () => [...flowOrders].sort((a, b) => b.entryTime.localeCompare(a.entryTime) || b.code.localeCompare(a.code)).slice(0, 6),
    [flowOrders],
  );

  /* ── 统计卡片（订单分发待办来自分发中心实时数据） ── */
  const statCards: StatCardData[] = [
    {
      label: '本月销售额',
      value: '1,285,600',
      unit: '¥',
      trend: { direction: 'up', value: '12.5%' },
      icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 14l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
    {
      label: '销售订单数',
      value: '58',
      trend: { direction: 'up', value: '+8 单' },
      icon: <svg viewBox="0 0 18 18" fill="none"><rect x="4" y="2" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/></svg>,
    },
    {
      label: '订单分发待办',
      value: String(flowTodo),
      trend: { direction: flowTodo > 0 ? 'up' : 'down', value: `比单报名 ${statusCount.comparing ?? 0} 单` },
      icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 8h4M7 11h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    },
    {
      label: '客户数',
      value: '25',
      trend: { direction: 'up', value: '+3' },
      icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M3 15a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    },
    {
      label: '本月退货额',
      value: '28,960',
      unit: '¥',
      trend: { direction: 'down', value: '5.4%' },
      icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 5h12l-1.2 8H4.2L3 5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M11 5l2-2M13 3l0 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    },
    {
      label: '待对账',
      value: '6',
      trend: { direction: 'up', value: '需及时处理' },
      icon: <svg viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M6 8h6M6 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    },
  ];

  /* ── 待办事项：由订单分发状态实时派生 ── */
  const todoItems = [
    (statusCount.pending ?? 0) > 0 && {
      text: `${statusCount.pending} 单外部订单待分流（自营 / 指定 · 抢单 · 比单）`, tag: '待处理', color: EXTERNAL_STATUS_COLORS.pending, to: '/sales/order-distribute',
    },
    (statusCount.report_match_pending ?? 0) > 0 && {
      text: `${statusCount.report_match_pending} 单命中报备待确认匹配（确认后分发报备合作商）`, tag: '报备', color: EXTERNAL_STATUS_COLORS.report_match_pending, to: '/sales/order-distribute',
    },
    (statusCount.self_pending ?? 0) > 0 && {
      text: `${statusCount.self_pending} 单自营订单待接单（销售订单 · 分发订单）`, tag: '自营', color: EXTERNAL_STATUS_COLORS.self_pending, to: '/sales/sales-orders',
    },
    (statusCount.comparing ?? 0) > 0 && {
      text: `${statusCount.comparing} 单比单报名中 · 已报名 ${compareQuotes} 家`, tag: '比单', color: EXTERNAL_STATUS_COLORS.comparing, to: '/sales/compare-manage',
    },
    (statusCount.grabbing ?? 0) > 0 && {
      text: `${statusCount.grabbing} 单抢单进行中（合作商大厅先到先得）`, tag: '抢单', color: EXTERNAL_STATUS_COLORS.grabbing, to: '/sales/order-distribute',
    },
    (statusCount.distribute_pending ?? 0) > 0 && {
      text: `${statusCount.distribute_pending} 单已分发待合作商接单`, tag: '分发', color: EXTERNAL_STATUS_COLORS.distribute_pending, to: '/sales/order-distribute',
    },
  ].filter(Boolean) as { text: string; tag: string; color: { bg: string; color: string }; to: string }[];

  return (
    <>
      <ContentHeader title="销售概览" breadcrumbs={['销售', '销售概览']} />
      <div className="content-body">
        {/* 核心指标 */}
        <div className="stat-cards">
          {statCards.map((s, i) => <StatCard key={i} data={s} />)}
        </div>

        {/* 销售趋势 + 待办事项 */}
        <div className="grid-2">
          <Card title="销售趋势">
            <LineChart data={salesTrendData} />
          </Card>
          <Card title="待办事项" headerRight={<span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-module-sales-secondary)' }}>{todoItems.length} 项待处理 · 来自订单分发中心</span>}>
            <div style={{ padding: 'var(--space-2) 0' }}>
              {todoItems.map((item, i) => (
                <div
                  key={i}
                  onClick={() => navigate(item.to)}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: i < todoItems.length - 1 ? '1px solid var(--color-neutral-100)' : 'none', cursor: 'pointer' }}
                >
                  <span style={{ padding: '1px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: item.color.bg, color: item.color.color, flexShrink: 0 }}>{item.tag}</span>
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)' }}>{item.text}</span>
                  <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14, color: 'var(--color-neutral-300)', flexShrink: 0 }}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              ))}
              {todoItems.length === 0 && (
                <div style={{ padding: 'var(--space-4) 0', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)', textAlign: 'center' }}>订单分发暂无待办</div>
              )}
            </div>
          </Card>
        </div>

        {/* 订单分发动态（分发中心实时数据） */}
        <Card
          title="订单分发动态"
          style={{ marginTop: 'var(--space-4)' }}
          headerRight={<span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>本月分发金额 <span className="mono" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)' }}>{money(monthFlowAmount)}</span></span>}
        >
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
            {FLOW_BRIEF.map((b) => {
              const c = EXTERNAL_STATUS_COLORS[b.key === 'handled' ? 'processed' : b.key];
              const count = statusCount[b.key] ?? 0;
              return (
                <button
                  key={b.key}
                  onClick={() => navigate('/sales/order-distribute')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-neutral-100)', background: 'var(--color-neutral-50)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)', cursor: 'pointer' }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
                  {b.label}
                  <span className="mono" style={{ fontWeight: 'var(--font-semibold)', color: count > 0 ? c.color : 'var(--color-neutral-400)' }}>{count}</span>
                </button>
              );
            })}
          </div>
          <Table
            headers={['订单编号', '来源', '客户', '路径', '金额', '状态', '操作']}
            rows={recentFlow.map((o) => [
              <span key="c" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{o.code}</span>,
              <span key="src">{EXTERNAL_PLATFORM_LABELS[o.platform]} · {EXTERNAL_CHANNEL_LABELS[o.sourceChannel]}</span>,
              <span key="cu" style={{ fontWeight: 'var(--font-medium)' }}>{o.customerName}</span>,
              <span key="p">{pathLabel(o)}</span>,
              <span key="a" className="mono">{money(o.totalAmount)}</span>,
              o.processStatus === 'completed' ? statusPill('completed', '已完成') : statusPill(o.processStatus),
              <Button key="act" size="sm" variant="ghost" onClick={() => navigate('/sales/order-distribute')}>去处理</Button>,
            ])}
          />
        </Card>

        {/* 近期销售订单 */}
        <Card title="近期销售订单" style={{ marginTop: 'var(--space-4)' }}>
          <Table
            headers={['订单编号', '客户', '商品', '茶类', '金额', '状态']}
            rows={salesOrders.map(order => [
              <span className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{order.code}</span>,
              <span>{order.partner}</span>,
              <span style={{ fontWeight: 'var(--font-medium)' }}>{order.product}</span>,
              <Tag category={order.teaCategory} />,
              <span className="mono">{order.amount}</span>,
              <StatusTag variant={orderStatusToVariant(order.status)} label={orderStatusLabel(order.status)} />,
            ])}
          />
        </Card>
      </div>
    </>
  );
}
