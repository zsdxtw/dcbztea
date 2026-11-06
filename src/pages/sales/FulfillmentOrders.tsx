import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { TRANSFER_SOURCE_LABELS } from '../../data/externalOrders';
import type { StatCardData, ExternalOrder, PurchaseDoc } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/** 履约主体与方式（自营=平台仓发货；转派=合作商采购直发） */
function fulfillerOf(o: ExternalOrder): { subject: string; mode: string; isSelf: boolean } {
  if (o.path === 'self') {
    return { subject: `平台自营${o.follower ? ` · 跟单 ${o.follower}` : ''}`, mode: '平台仓发货', isSelf: true };
  }
  return { subject: o.partnerName ?? '—', mode: o.transferSource ? `${TRANSFER_SOURCE_LABELS[o.transferSource]} · 采购直发` : '采购直发', isSelf: false };
}

/** 数量六态：分配(=订单)/已采购/已入库/已发货/已签收/待发货 */
function qtyStatsOf(o: ExternalOrder, pos: PurchaseDoc[]) {
  const allocated = o.items.reduce((s, it) => s + it.quantity, 0);
  const purchased = pos.reduce((s, d) => s + d.items.reduce((x, it) => x + it.quantity, 0), 0);
  const inbound = pos
    .filter((d) => d.deliveryMode === 'warehouse' && ['received', 'partial_shipped', 'fully_shipped', 'delivered', 'settled'].includes(d.status))
    .reduce((s, d) => s + d.items.reduce((x, it) => x + it.quantity, 0), 0);
  let shipped = (o.selfShipments ?? []).reduce((s, p) => s + p.items.reduce((x, i) => x + i.qty, 0), 0);
  let delivered = (o.selfShipments ?? []).filter((p) => p.status === 'delivered').reduce((s, p) => s + p.items.reduce((x, i) => x + i.qty, 0), 0);
  for (const d of pos) {
    for (const p of d.packages) {
      if (p.status === 'void') continue;
      shipped += p.items.reduce((x, i) => x + i.qty, 0);
      if (p.status === 'delivered') delivered += p.items.reduce((x, i) => x + i.qty, 0);
    }
  }
  return { allocated, purchased, inbound, shipped, delivered, waiting: Math.max(0, allocated - shipped) };
}

/** 任务状态 */
function taskStatusOf(o: ExternalOrder, pos: PurchaseDoc[]): { label: string; bg: string; color: string } {
  const q = qtyStatsOf(o, pos);
  if (o.processStatus === 'completed') return { label: '已完成', bg: '#ECEFF1', color: '#455A64' };
  if (o.processStatus === 'self_delivered') return { label: '已妥投 · 待确认收货', bg: '#E0F2F1', color: '#00695C' };
  if (o.processStatus === 'self_shipped' || q.shipped > 0) return { label: '发货中', bg: '#E1F5FE', color: '#0277BD' };
  if (['distribute_pending', 'self_pending', 'report_match_pending'].includes(o.processStatus)) return { label: '待接单', bg: '#FBF3E2', color: '#9A7A1C' };
  if (o.processStatus === 'grabbing' || o.processStatus === 'comparing') return { label: '分配中（抢单/比单）', bg: '#FFF8E1', color: '#B26A00' };
  return { label: q.inbound > 0 ? '到货待发' : '备货中', bg: '#E8EAF6', color: '#3949AB' };
}

/**
 * 销售 · 履约任务（销售订单与实际发货之间的桥梁）
 * 覆盖转派（合作商履约）与自营（平台仓履约）两类任务：数量六态跟踪 + 关联采购/发货单据。
 * 自营任务的执行操作在「销售单自营 / 自营工作台」；转派任务由合作商终端履约，此处跟踪与重新分配。
 */
export default function FulfillmentOrders() {
  const navigate = useNavigate();
  const orders = useOrderFlowStore((s) => s.orders);
  const purchaseDocs = usePurchaseStore((s) => s.docs);
  const store = useOrderFlowStore;
  const [tab, setTab] = useState<'' | 'self' | 'partner'>('');
  const [detailId, setDetailId] = useState<string | null>(null);

  /** 履约任务集合：已分配出执行主体的订单（转派待接单起 / 自营待接单起；抢单比单中的母单属分配中，不计入） */
  const tasks = useMemo(() => orders.filter((o) => {
    if (o.path === 'self') return true;
    if (o.path === 'distribute') return ['distribute_pending', 'processed', 'completed'].includes(o.processStatus);
    return false;
  }), [orders]);

  const posOf = (o: ExternalOrder) => purchaseDocs.filter((d) => d.childOrderId === o.id);
  const filtered = useMemo(() => (tab ? tasks.filter((o) => (tab === 'self' ? o.path === 'self' : o.path === 'distribute')) : tasks), [tasks, tab]);
  const detail = detailId ? orders.find((o) => o.id === detailId) ?? null : null;
  const detailPos = detail ? posOf(detail) : [];

  const waitingCount = tasks.filter((o) => ['distribute_pending', 'self_pending'].includes(o.processStatus)).length;
  const shippingCount = tasks.filter((o) => { const st = taskStatusOf(o, posOf(o)); return st.label === '发货中'; }).length;
  const doneCount = tasks.filter((o) => o.processStatus === 'completed').length;

  const stats: StatCardData[] = [
    { label: '履约任务总数', value: String(tasks.length), unit: '单', trend: { direction: 'up', value: `自营 ${tasks.filter((o) => o.path === 'self').length} / 合作商 ${tasks.filter((o) => o.path === 'distribute').length}` }, icon: <svg viewBox="0 0 18 18" fill="none"><rect x="4" y="2" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6h4M7 9h4M7 12h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
    { label: '待接单', value: String(waitingCount), unit: '单', trend: { direction: 'down', value: '等待履约方接单' }, icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: '发货中', value: String(shippingCount), unit: '单', trend: { direction: 'up', value: '物流跟踪至妥投' }, icon: <svg viewBox="0 0 18 18" fill="none"><path d="M2 12h10l4-4H6L2 12zM6 8l2-4h8l-2 4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
    { label: '已完成', value: String(doneCount), unit: '单', trend: { direction: 'up', value: '签收/确认收货' }, icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M6.5 9l2 2 3.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  ];

  return (
    <>
      <ContentHeader title="履约任务" breadcrumbs={['销售', '履约任务', '履约任务']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          履约任务是<strong>销售订单与实际发货之间的桥梁</strong>：履约分配确认后生成（自营=平台仓发货，转派=合作商采购直发）。
          跟踪每个履约主体的<strong>分配 / 已采购 / 已入库 / 已发货 / 已签收</strong>数量六态，并关联采购订单与发货单。自营任务操作在「销售单自营」，转派任务由合作商终端履约。
        </div>

        <div className="stat-cards">{stats.map((s, i) => <StatCard key={i} data={s} />)}</div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', marginTop: 'var(--space-4)' }}>
          {([['', '全部任务'], ['self', '自营任务（平台仓）'], ['partner', '合作商任务（采购直发）']] as const).map(([k, label]) => (
            <button key={k || 'all'} className={`tab-card-simple${tab === k ? ' active' : ''}`} onClick={() => setTab(k as typeof tab)}>
              {label}
              <span className="tab-card-simple-count">{k === '' ? tasks.length : tasks.filter((o) => (k === 'self' ? o.path === 'self' : o.path === 'distribute')).length}</span>
            </button>
          ))}
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['任务编号', '来源销售订单', '客户', '商品', '履约主体', '履约方式', '分配', '已采购', '已入库', '已发货', '已签收', '关联采购单', '任务状态', '操作']}
            rows={filtered.map((o) => {
              const f = fulfillerOf(o);
              const pos = posOf(o);
              const q = qtyStatsOf(o, pos);
              const st = taskStatusOf(o, pos);
              return [
                <span key="c" className="cell-mono-emph">{o.code}</span>,
                <span key="so" className="mono" style={{ fontSize: 'var(--text-sm)' }}>{o.parentCode ?? o.code}</span>,
                <span key="cu" className="cell-emph">{o.customerName}</span>,
                <span key="i" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{o.items[0].productName}{o.items.length > 1 ? ` 等${o.items.length}种` : ''}</span>,
                <span key="sub" style={{ fontSize: 'var(--text-sm)' }}>{f.subject}</span>,
                <span key="m" style={{ fontSize: 'var(--text-sm)' }}>{f.mode}</span>,
                <span key="q1" className="mono">{q.allocated}</span>,
                <span key="q2" className="mono" style={{ color: q.purchased > 0 ? undefined : 'var(--color-neutral-400)' }}>{q.purchased}</span>,
                <span key="q3" className="mono" style={{ color: q.inbound > 0 ? undefined : 'var(--color-neutral-400)' }}>{q.inbound}</span>,
                <span key="q4" className="mono" style={{ color: q.shipped > 0 ? '#0277BD' : undefined }}>{q.shipped}</span>,
                <span key="q5" className="mono" style={{ color: q.delivered > 0 ? '#00695C' : undefined }}>{q.delivered}</span>,
                <span key="po" style={{ fontSize: 'var(--text-sm)' }}>{pos.length > 0 ? pos.map((d) => d.code).join('、') : '—'}</span>,
                pill(st.bg, st.color, st.label),
                <div key="act" className="row-actions" style={{ whiteSpace: 'nowrap' }}>
                  <Button size="sm" variant="ghost" onClick={() => setDetailId(o.id)}>查看</Button>
                  {o.processStatus === 'distribute_pending' && (
                    <Button size="sm" variant="danger" onClick={() => store.getState().resetToPending(o.id, '履约任务 · 重新分配（退回履约分配）')}>重新分配</Button>
                  )}
                </div>,
              ];
            })}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无履约任务。在「履约分配」完成自营/转派分配后生成。
            </div>
          )}
        </Card>
      </div>

      {/* 任务详情（只读 + 关联单据跳转） */}
      <DetailDrawer
        open={!!detail}
        onClose={() => setDetailId(null)}
        badge="FO"
        title={detail?.code ?? ''}
        statusTag={detail ? (() => { const st = taskStatusOf(detail, detailPos); return pill(st.bg, st.color, st.label); })() : null}
        subtitle={detail ? `${fulfillerOf(detail).subject} · ${detail.customerName} · ${money(detail.totalAmount)}` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDetailId(null)}>关闭</Button>
            {detail && (
              <Button onClick={() => navigate(detail.path === 'self' ? '/sales/order-shipping' : '/sales/sales-delivery')}>
                {detail.path === 'self' ? '去销售单自营处理' : '去销售发货跟踪'}
              </Button>
            )}
          </>
        }
      >
        {detail && (() => {
          const f = fulfillerOf(detail);
          const q = qtyStatsOf(detail, detailPos);
          return (
            <>
              <DrawerSection title="任务信息">
                <InfoGrid>
                  <InfoItem label="履约任务编号" mono emph>{detail.code}</InfoItem>
                  <InfoItem label="来源销售订单" mono>{detail.parentCode ?? detail.code}</InfoItem>
                  <InfoItem label="履约主体类型">{f.isSelf ? '平台仓（自营）' : '合作商'}</InfoItem>
                  <InfoItem label="履约主体">{f.subject}</InfoItem>
                  <InfoItem label="履约方式">{f.mode}</InfoItem>
                  <InfoItem label="客户">{detail.customerName}</InfoItem>
                  <InfoItem label="收货地址" span={3}>{detail.receiverAddress}</InfoItem>
                </InfoGrid>
              </DrawerSection>

              <DrawerSection title="履约数量（六态）">
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {[
                    ['分配数量', q.allocated], ['已采购', q.purchased], ['已入库', q.inbound],
                    ['已发货', q.shipped], ['已签收', q.delivered], ['待发货', q.waiting],
                  ].map(([label, v]) => (
                    <span key={String(label)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-neutral-50)', border: '1px solid var(--color-neutral-100)', fontSize: 'var(--text-sm)' }}>
                      {label}：<b className="mono">{v}</b>
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 'var(--space-2)' }}>
                  分配=订单数量；已采购/已入库按关联采购单；已发货/已签收按发货包裹（平台仓包裹 + 采购直发包裹）。
                </div>
              </DrawerSection>

              <DrawerSection title="关联单据">
                <InfoGrid>
                  <InfoItem label="销售订单" mono>{detail.parentCode ?? detail.code}</InfoItem>
                  <InfoItem label="采购订单" mono>{detailPos.length > 0 ? detailPos.map((d) => d.code).join('、') : '—'}</InfoItem>
                  <InfoItem label="发货单" mono>{(detail.selfShipments ?? []).length + detailPos.reduce((s, d) => s + d.packages.filter((x) => x.status !== 'void').length, 0) > 0 ? '见「销售发货」' : '—'}</InfoItem>
                </InfoGrid>
              </DrawerSection>

              <DrawerSection title={`商品明细（${detail.items.length} 种）`}>
                <table className="detail-inline-table">
                  <thead><tr><th>商品名称</th><th>规格</th><th>分配数量</th></tr></thead>
                  <tbody>
                    {detail.items.map((it, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                        <td>{it.spec}</td>
                        <td className="mono">{it.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DrawerSection>

              <DrawerSection title="履约轨迹">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {detail.history.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                      <span className="mono" style={{ color: 'var(--color-neutral-400)', flexShrink: 0 }}>{h.time}</span>
                      <span style={{ fontWeight: 'var(--font-medium)', flexShrink: 0 }}>{h.action}</span>
                      {h.detail && <span style={{ color: 'var(--color-neutral-500)' }}>{h.detail}</span>}
                    </div>
                  ))}
                </div>
              </DrawerSection>
            </>
          );
        })()}
      </DetailDrawer>
    </>
  );
}
