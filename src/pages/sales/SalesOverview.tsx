/**
 * 销售 · 销售概览（依据当前销售一级菜单内容重新设计，全部实时派生）
 * 覆盖：销售单管理（新建/列表/分发/履约）+ 客户管理（客户/报品报调价/对账）+ 销售退货
 * 结构：核心指标卡（6）→ 分发动态 | 履约动态 → 待办事项（跨页跳转）→ 最近母销售单（四状态聚合）
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { customerItems } from '../../data/customers';
import { EXTERNAL_CHANNEL_LABELS, EXTERNAL_STATUS_LABELS,
  EXTERNAL_STATUS_COLORS, platformLabelOf } from '../../data/externalOrders';
import { FULFILLMENT_STAGE_LABELS, FULFILLMENT_STAGE_COLORS, stageOfOrder } from '../../utils/fulfillment';
import { buildFamilies, fulfillmentUnitsOf, familyStatesOf, fulfillStateOf,
  settleStateOf, invoiceStateOf, FAMILY_STATE_COLORS } from '../../utils/salesOrderFamily';
import type { StatCardData, ExternalOrder } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/** 分发状态 → 概览分布项（顺序即分发流程顺序） */
const FLOW_BRIEF: { key: string; label: string }[] = [
  { key: 'pending', label: '待分发' },
  { key: 'report_match_pending', label: '报备-匹配待确认' },
  { key: 'self_pending', label: '自营待接单' },
  { key: 'comparing', label: '分发比单中' },
  { key: 'distribute_pending', label: '转派待接单' },
  { key: 'processed', label: '分发已完成' },
  { key: 'cancelled', label: '已取消' },
];

/** 履约状态分布项（对齐销售单履约 TAB 口径：「已发货」= 运输中 + 妥投 合并桶） */
const FULFILL_BRIEF: { key: string; label: string; keys: string[] }[] = [
  { key: 'pending_accept', label: '待接单', keys: ['pending_accept'] },
  { key: 'accepted', label: '已接单', keys: ['accepted'] },
  { key: 'shipping', label: '已发货', keys: ['shipping', 'transit'] },
  { key: 'confirmed', label: '已确收', keys: ['confirmed'] },
  { key: 'cancelled', label: '已取消', keys: ['cancelled'] },
];

const statusPill = (status: string, label?: string) => {
  const c = EXTERNAL_STATUS_COLORS[status];
  return (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: c?.bg, color: c?.color, whiteSpace: 'nowrap' }}>
      {label ?? EXTERNAL_STATUS_LABELS[status]}
    </span>
  );
};

/** 路径标签（与销售单分发页口径一致：自营 / 转派-报备·指定·比单） */
const pathLabel = (o: ExternalOrder): string => {
  if (o.path === 'self') return '自营';
  if (o.transferSource) return o.transferSource === 'report' ? '转派-报备' : o.transferSource === 'compare' ? '转派-比单' : '转派-指定';
  if (o.distributeMode === 'compare') return '转派-比单';
  return '—';
};

export default function SalesOverview() {
  const navigate = useNavigate();
  const flowOrders = useOrderFlowStore((s) => s.orders);
  const poDocs = usePurchaseStore((s) => s.docs);

  /** 分发状态单数 */
  const statusCount = useMemo(() => {
    const c: Record<string, number> = {};
    flowOrders.forEach((o) => {
      c[o.processStatus] = (c[o.processStatus] ?? 0) + 1;
    });
    return c;
  }, [flowOrders]);

  /** 母销售单家族（四状态聚合） */
  const families = useMemo(() => buildFamilies(flowOrders), [flowOrders]);

  /** 履约单维度（未拆分 = 默认履约单01；拆分后 = 全部子履约单） */
  const units = useMemo(
    () => families.flatMap((f) => fulfillmentUnitsOf(f).map((u) => u.underlying)),
    [families],
  );

  /** 履约状态单数（已发货 = 运输中 + 妥投） */
  const fulfillCount = useMemo(() => {
    const c: Record<string, number> = {};
    units.forEach((o) => {
      const k = stageOfOrder(o);
      c[k] = (c[k] ?? 0) + 1;
    });
    return c;
  }, [units]);

  const unitPos = (o: ExternalOrder) => poDocs.filter((d) => d.childOrderId === o.id);
  const waitReceipt = units.filter((o) => stageOfOrder(o) === 'transit').length;
  const waitSettle = units.filter((o) => stageOfOrder(o) === 'confirmed' && settleStateOf(o, unitPos(o)) !== '已结算').length;
  const waitInvoice = units.filter((o) => stageOfOrder(o) === 'confirmed' && invoiceStateOf(o) !== '已开票').length;

  const compareQuotes = flowOrders
    .filter((o) => o.processStatus === 'comparing')
    .reduce((s, o) => s + (o.compare?.quotes.length ?? 0), 0);
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthOrders = flowOrders.filter((o) => o.entryTime.startsWith(monthKey));
  const monthFlowAmount = monthOrders.reduce((s, o) => s + o.totalAmount, 0);
  const monthNewFamilies = monthOrders.filter((o) => !o.parentCode).length;
  const totalAmount = flowOrders.filter((o) => o.processStatus !== 'cancelled').reduce((s, o) => s + o.totalAmount, 0);
  const recentFlow = useMemo(
    () => [...flowOrders].sort((a, b) => b.entryTime.localeCompare(a.entryTime) || b.code.localeCompare(a.code)).slice(0, 6),
    [flowOrders],
  );
  const recentFamilies = useMemo(
    () => [...families].sort((a, b) => b.mother.entryTime.localeCompare(a.mother.entryTime)).slice(0, 6),
    [families],
  );

  /* ── 核心指标卡（全部实时派生） ── */
  const statCards: StatCardData[] = [
    {
      label: '母销售单',
      value: String(families.length),
      unit: '张',
      trend: { direction: 'up', value: `本月 +${monthNewFamilies} 张` },
      icon: <svg viewBox="0 0 18 18" fill="none"><rect x="4" y="2" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/></svg>,
    },
    {
      label: '销售总金额',
      value: money(totalAmount),
      trend: { direction: 'up', value: `本月 ${money(monthFlowAmount)}` },
      icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 14l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
    {
      label: '待分发',
      value: String(statusCount.pending ?? 0),
      unit: '单',
      trend: { direction: (statusCount.pending ?? 0) > 0 ? 'up' : 'down', value: `含报备确认 ${statusCount.report_match_pending ?? 0} 单` },
      icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 8h4M7 11h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    },
    {
      label: '履约中',
      value: String((fulfillCount.accepted ?? 0) + (fulfillCount.shipping ?? 0) + (fulfillCount.transit ?? 0)),
      unit: '单',
      trend: { direction: 'up', value: `已发货 ${(fulfillCount.shipping ?? 0) + (fulfillCount.transit ?? 0)} 单` },
      icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 6.5h9V14H3zM12 9.5h3l2 3V14h-5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><circle cx="6.5" cy="15.5" r="1.6" stroke="currentColor" strokeWidth="1.3"/><circle cx="14.5" cy="15.5" r="1.6" stroke="currentColor" strokeWidth="1.3"/></svg>,
    },
    {
      label: '待确收',
      value: String(waitReceipt),
      unit: '单',
      trend: { direction: waitReceipt > 0 ? 'up' : 'down', value: '妥投订单待确认收货' },
      icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 9.5l4 4 8-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
    {
      label: '待结算 / 待开票',
      value: `${waitSettle} / ${waitInvoice}`,
      unit: '单',
      trend: { direction: waitSettle + waitInvoice > 0 ? 'up' : 'down', value: '已确收订单' },
      icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="3" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6 7h6M6 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    },
  ];

  /* ── 待办事项（跨页跳转） ── */
  const todoItems = [
    (statusCount.pending ?? 0) > 0 && {
      text: `${statusCount.pending} 单待分发（分发 / 拆单 / 修改）`, tag: '待分发', color: EXTERNAL_STATUS_COLORS.pending, to: '/sales/order-distribute',
    },
    (statusCount.report_match_pending ?? 0) > 0 && {
      text: `${statusCount.report_match_pending} 单命中报备待确认匹配（确认后分发报备合作商）`, tag: '报备', color: EXTERNAL_STATUS_COLORS.report_match_pending, to: '/sales/order-distribute',
    },
    (statusCount.comparing ?? 0) > 0 && {
      text: `${statusCount.comparing} 单分发比单中 · 已报名 ${compareQuotes} 家`, tag: '比单', color: EXTERNAL_STATUS_COLORS.comparing, to: '/sales/order-distribute',
    },
    (statusCount.self_pending ?? 0) > 0 && {
      text: `${statusCount.self_pending} 单自营待接单（接单 / 退回在自营工作台）`, tag: '自营', color: EXTERNAL_STATUS_COLORS.self_pending, to: '/selfop/orders',
    },
    (statusCount.distribute_pending ?? 0) > 0 && {
      text: `${statusCount.distribute_pending} 单转派待接单（等合作商终端接单）`, tag: '分发', color: EXTERNAL_STATUS_COLORS.distribute_pending, to: '/sales/order-distribute',
    },
    waitReceipt > 0 && {
      text: `${waitReceipt} 张履约单已妥投待确认收货（管理后台确认收货）`, tag: '确收', color: FULFILLMENT_STAGE_COLORS.transit, to: '/sales/sales-fulfillment',
    },
    waitSettle > 0 && {
      text: `${waitSettle} 张履约单已确收待结算（按发货单可部分结算）`, tag: '结算', color: FAMILY_STATE_COLORS['结算中'], to: '/sales/order-distribute',
    },
    waitInvoice > 0 && {
      text: `${waitInvoice} 张履约单已确收未开票（详情抽屉登记开票）`, tag: '开票', color: FAMILY_STATE_COLORS['开票中'], to: '/sales/order-distribute',
    },
    (statusCount.cancelled ?? 0) > 0 && {
      text: `${statusCount.cancelled} 单已取消（分发状态与履约状态均为已取消）`, tag: '取消', color: EXTERNAL_STATUS_COLORS.cancelled, to: '/sales/order-distribute',
    },
  ].filter(Boolean) as { text: string; tag: string; color: { bg: string; color: string }; to: string }[];

  const fp = (t: string) => {
    const c = (FAMILY_STATE_COLORS as Record<string, { bg: string; color: string }>)[t] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
    return (
      <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{t}</span>
    );
  };

  return (
    <>
      <ContentHeader title="销售概览" breadcrumbs={['销售', '销售概览']} />
      <div className="content-body">
        {/* 核心指标 */}
        <div className="stat-cards">
          {statCards.map((s, i) => <StatCard key={i} data={s} />)}
        </div>

        {/* 分发动态 + 履约动态 */}
        <div className="grid-2">
          <Card
            title="履约单分发动态"
            headerRight={<span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>本月分发金额 <span className="mono" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)' }}>{money(monthFlowAmount)}</span></span>}
          >
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
              {FLOW_BRIEF.map((b) => {
                const c = EXTERNAL_STATUS_COLORS[b.key] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
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
              headers={['销售履约单号', '客户', '分发方式', '金额', '分发状态']}
              rows={recentFlow.map((o) => [
                <span key="c" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{o.parentCode ? o.code : `${o.code}LY01`}</span>,
                <span key="cu" style={{ fontWeight: 'var(--font-medium)' }}>{o.customerName}</span>,
                <span key="p">{pathLabel(o)}</span>,
                <span key="a" className="mono">{money(o.totalAmount)}</span>,
                statusPill(o.processStatus),
              ])}
            />
          </Card>

          <Card title="履约动态" headerRight={<span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>履约单 {units.length} 张 · 点击前往履约单履约</span>}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
              {FULFILL_BRIEF.map((b) => {
                const c = FULFILLMENT_STAGE_COLORS[b.keys[0] as keyof typeof FULFILLMENT_STAGE_COLORS];
                const count = b.keys.reduce((s, k) => s + (fulfillCount[k] ?? 0), 0);
                return (
                  <button
                    key={b.key}
                    onClick={() => navigate('/sales/sales-fulfillment')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-neutral-100)', background: 'var(--color-neutral-50)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)', cursor: 'pointer' }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: c?.color ?? 'var(--color-neutral-400)' }} />
                    {b.label}
                    <span className="mono" style={{ fontWeight: 'var(--font-semibold)', color: count > 0 ? c?.color ?? 'var(--color-neutral-400)' : 'var(--color-neutral-400)' }}>{count}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {units.slice(0, 6).map((o) => {
                const stage = stageOfOrder(o);
                const c = FULFILLMENT_STAGE_COLORS[stage];
                return (
                  <div
                    key={o.id}
                    onClick={() => navigate('/sales/sales-fulfillment')}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-neutral-100)', cursor: 'pointer' }}
                  >
                    <span className="mono" style={{ fontWeight: 'var(--font-medium)', flexShrink: 0 }}>{o.code}</span>
                    <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customerName}</span>
                    <span style={{ flexShrink: 0 }}>{pill(c?.bg ?? '#F5F5F5', c?.color ?? '#9E9E9E', FULFILLMENT_STAGE_LABELS[stage])}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* 待办事项（跨页跳转） */}
        <Card
          title="待办事项"
          style={{ marginTop: 'var(--space-4)' }}
          headerRight={<span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-module-sales-secondary)' }}>{todoItems.length} 项待处理 · 来自销售单管理 / 客户管理</span>}
        >
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
              <div style={{ padding: 'var(--space-4) 0', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)', textAlign: 'center' }}>暂无待办</div>
            )}
          </div>
        </Card>

        {/* 最近母销售单（四状态聚合，实时） */}
        <Card
          title="最近母销售单"
          style={{ marginTop: 'var(--space-4)' }}
          headerRight={<Button size="sm" variant="ghost" onClick={() => navigate('/sales/sales-orders')}>前往销售单列表</Button>}
        >
          <Table
            headers={['销售单号', '来源', '客户', '履约单数', '总金额', '分发进度', '履约进度', '结算进度', '开票进度', '录入时间', '操作']}
            rows={recentFamilies.map((f) => {
              const st = familyStatesOf(f);
              const amount = (f.children.length > 0 ? f.children : f.all).reduce((s, o) => s + o.totalAmount, 0);
              return [
                <span key="c" className="cell-mono-emph">{f.rootCode}<span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{f.mother.externalOrderNo}</span></span>,
                <span key="src">
                  {f.mother.salesPath === 'via_platform'
                    ? (f.mother.platformCustomerName ?? (f.mother.platform ? platformLabelOf(f.mother) : '经平台销售'))
                    : '淡茶半盏'}
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: f.mother.sourceChannel === 'push' ? '#7B1FA2' : '#0F64B5' }}>{EXTERNAL_CHANNEL_LABELS[f.mother.sourceChannel]}</span>
                </span>,
                <span key="cu" style={{ fontWeight: 'var(--font-medium)' }}>{f.mother.customerName}</span>,
                <span key="n" style={{ textAlign: 'center' }}>{st.total} 单</span>,
                <span key="a" className="mono" style={{ fontWeight: 'var(--font-semibold)' }}>{money(amount)}</span>,
                <span key="st1">{fp(st.distribute)}</span>,
                <span key="st2">{fp(st.fulfill)}</span>,
                <span key="st3">{fp(st.settle)}</span>,
                <span key="st4">{fp(st.invoice)}</span>,
                <span key="t" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>{f.mother.entryTime.slice(0, 10)}</span>,
                <Button key="act" size="sm" variant="ghost" onClick={() => navigate('/sales/sales-orders')}>查看</Button>,
              ];
            })}
          />
        </Card>
      </div>
    </>
  );
}
