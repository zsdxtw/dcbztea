import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { TRANSFER_SOURCE_LABELS } from '../../data/externalOrders';
import type { StatCardData, ExternalOrder } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color: color, whiteSpace: 'nowrap' }}>{text}</span>
);

/** 发货环节状态推导：待接单 → 执行中 → 已妥投 */
function shipStage(o: ExternalOrder): { key: 'waiting' | 'doing' | 'delivered'; label: string; tone: { bg: string; color: string } } {
  if (o.processStatus === 'self_pending') return { key: 'waiting', label: '待接单（自营）', tone: { bg: '#FBF3E2', color: '#9A7A1C' } };
  if (o.processStatus === 'distribute_pending') return { key: 'waiting', label: '待接单', tone: { bg: '#FBF3E2', color: '#9A7A1C' } };
  if (o.path === 'self') {
    if (o.processStatus === 'completed') return { key: 'delivered', label: '已妥投签收', tone: { bg: '#E9F4EF', color: '#01795D' } };
    const s = o.selfChain;
    if (s?.outboundCode) return { key: 'doing', label: '已出库发货', tone: { bg: '#F3EFFA', color: '#7A5BA6' } };
    if (s?.inboundCode) return { key: 'doing', label: '已到货入库', tone: { bg: '#EDF3FB', color: '#1D64B0' } };
    return { key: 'doing', label: '采购中', tone: { bg: '#EDF3FB', color: '#1D64B0' } };
  }
  const ps = o.partnerStatus;
  if (ps === 'delivered' || ps === 'settled' || o.processStatus === 'completed') return { key: 'delivered', label: '已妥投签收', tone: { bg: '#E9F4EF', color: '#01795D' } };
  if (ps === 'shipping') return { key: 'doing', label: '已发货', tone: { bg: '#F3EFFA', color: '#7A5BA6' } };
  if (ps === 'accepted') return { key: 'doing', label: '已接单', tone: { bg: '#EDF3FB', color: '#1D64B0' } };
  return { key: 'waiting', label: '待接单', tone: { bg: '#FBF3E2', color: '#9A7A1C' } };
}

/**
 * 销售 · 订单发货（销售订单第二环节）
 * 订单分发到主体后：从待接单 → 接单 → 发货 → 妥投确认收货。
 * 分发链由合作商终端接单，管理端推进发货/签收；自营链在销售订单-分发订单接单后入库/出库/签收。
 */
export default function OrderShipping() {
  const navigate = useNavigate();
  const orders = useOrderFlowStore((s) => s.orders);
  const store = useOrderFlowStore;
  const [tab, setTab] = useState<'' | 'waiting' | 'doing' | 'delivered'>('');

  /** 发货环节订单：已分发到主体的订单（待接单起，至妥投） */
  const shippingOrders = useMemo(() => orders.filter((o) => {
    if (o.processStatus === 'self_pending') return true;
    if (o.processStatus === 'distribute_pending') return true;
    if (o.processStatus === 'processed') return true;
    return false;
  }), [orders]);

  const stageOf = (o: ExternalOrder) => shipStage(o);
  const filtered = useMemo(
    () => (tab ? shippingOrders.filter((o) => stageOf(o).key === tab) : shippingOrders),
    [shippingOrders, tab],
  );
  const countOf = (k: '' | 'waiting' | 'doing' | 'delivered') => (k === '' ? shippingOrders.length : shippingOrders.filter((o) => stageOf(o).key === k).length);

  const waitingAmount = shippingOrders.filter((o) => stageOf(o).key === 'waiting').reduce((s, o) => s + o.totalAmount, 0);

  const stats: StatCardData[] = [
    { label: '待接单', value: String(countOf('waiting')), unit: '单', trend: { direction: 'down', value: money(waitingAmount) }, icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: '执行中', value: String(countOf('doing')), unit: '单', trend: { direction: 'up', value: '接单 / 发货进行中' }, icon: <svg viewBox="0 0 18 18" fill="none"><path d="M2 13L13 2M6 2h7v7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 16h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
    { label: '已妥投', value: String(countOf('delivered')), unit: '单', trend: { direction: 'up', value: '待结算 / 已完成' }, icon: <svg viewBox="0 0 18 18" fill="none"><path d="M9 2l7 3v8l-7 3-7-3V5l7-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  ];

  return (
    <>
      <ContentHeader title="订单发货" breadcrumbs={['销售', '订单发货']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          订单发货是销售订单第二环节：订单已在<strong>订单分发</strong>分派到具体主体，此处跟踪<strong>待接单 → 接单 → 发货 → 妥投确认收货</strong>的全过程。
          分发类订单由合作商终端接单，管理端可推进发货与确认收货；自营订单在「销售订单 → 分发订单」接单后执行入库 / 出库 / 签收。
        </div>

        <div className="stat-cards">{stats.map((s, i) => <StatCard key={i} data={s} />)}</div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', marginTop: 'var(--space-4)' }}>
          {([['', '全部'], ['waiting', '待接单'], ['doing', '执行中'], ['delivered', '已妥投']] as const).map(([k, label]) => (
            <button key={k || 'all'} className={`tab-card-simple${tab === k ? ' active' : ''}`} onClick={() => setTab(k as typeof tab)}>
              {label}
              <span className="tab-card-simple-count">{countOf(k)} 单</span>
            </button>
          ))}
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['订单编号', '客户', '处理主体', '来源', '商品', '金额', '发货进度', '操作']}
            rows={filtered.map((o) => {
              const st = stageOf(o);
              const isSelf = o.path === 'self';
              const subject = isSelf ? `自营${o.follower ? ` · 跟单人 ${o.follower}` : ''}` : o.partnerName ?? '—';
              return [
                <span key="c" className="cell-mono-emph">{o.code}</span>,
                <span key="cu" className="cell-emph">{o.customerName}</span>,
                <span key="sub" style={{ fontSize: 'var(--text-sm)' }}>{subject}</span>,
                <span key="src" style={{ fontSize: 'var(--text-sm)' }}>{isSelf ? '转自营' : TRANSFER_SOURCE_LABELS[o.transferSource ?? ''] ?? '—'}</span>,
                <span key="i" style={{ fontSize: 'var(--text-sm)' }}>{o.items.map((it) => `${it.productName}×${it.quantity}`).join('、')}</span>,
                <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(o.totalAmount)}</span>,
                pill(st.tone.bg, st.tone.color, st.label),
                <div key="act" className="row-actions" style={{ whiteSpace: 'nowrap' }}>
                  {/* 分发链：管理端推进发货 / 确认收货（妥投）；待接单由合作商终端操作 */}
                  {!isSelf && o.processStatus === 'processed' && o.partnerStatus === 'accepted' && (
                    <Button size="sm" onClick={() => store.getState().advancePartner(o.id, 'shipping')}>推进发货</Button>
                  )}
                  {!isSelf && o.processStatus === 'processed' && o.partnerStatus === 'shipping' && (
                    <Button size="sm" onClick={() => store.getState().advancePartner(o.id, 'delivered')}>确认收货</Button>
                  )}
                  {!isSelf && (o.processStatus === 'distribute_pending') && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>等待合作商终端接单</span>
                  )}
                  {!isSelf && o.partnerStatus === 'delivered' && o.processStatus === 'processed' && (
                    <Button size="sm" variant="ghost" onClick={() => navigate('/sales/order-settlement')}>去结算</Button>
                  )}
                  {/* 自营链：跳转销售订单接单 / 推进入库出库签收 */}
                  {isSelf && o.processStatus === 'self_pending' && (
                    <Button size="sm" variant="ghost" onClick={() => navigate('/sales/sales-orders')}>去销售订单接单</Button>
                  )}
                  {isSelf && o.processStatus === 'processed' && o.selfChain && !o.selfChain.inboundCode && (
                    <Button size="sm" onClick={() => store.getState().selfInbound(o.id)}>确认到货入库</Button>
                  )}
                  {isSelf && o.processStatus === 'processed' && o.selfChain?.inboundCode && !o.selfChain.outboundCode && (
                    <Button size="sm" onClick={() => store.getState().selfOutbound(o.id)}>出库发货</Button>
                  )}
                  {isSelf && o.processStatus === 'processed' && o.selfChain?.outboundCode && (
                    <Button size="sm" onClick={() => store.getState().selfComplete(o.id)}>确认签收完成</Button>
                  )}
                  {st.key === 'delivered' && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>已妥投</span>
                  )}
                </div>,
              ];
            })}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无发货环节订单。在「订单分发」完成转派或自营接单后，订单将进入本页跟踪发货进度。
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
