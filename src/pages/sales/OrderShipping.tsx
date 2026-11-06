import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import SelfOrderDetailDrawer from '../../components/selfop/SelfOrderDetailDrawer';
import { selfStageOf, acceptedSub, STAGE_META, packageStatsOf, type SelfStage } from '../../components/selfop/selfStage';
import { isSelfOrder } from '../selfop/selfopShared';
import type { ExternalOrder } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/**
 * 销售 · 销售单自营（管理后台视角）
 * 逻辑与「自营工作台 · 订单管理」共用（SelfOrderDetailDrawer / selfStage）：
 * 待接单 → 接单 / 退回 → 已接单 → 拆单 / 采购&发货 → 已发货运输中 → 妥投 → 确认收货。
 */
export default function OrderShipping() {
  const orders = useOrderFlowStore((s) => s.orders);
  const purchaseDocs = usePurchaseStore((s) => s.docs);

  /** 自营订单（分发转自营后的全链路） */
  const selfOrders = useMemo(() => orders.filter(isSelfOrder), [orders]);

  const posOf = (o: ExternalOrder) => purchaseDocs.filter((d) => d.childOrderId === o.id);
  const stageOf = (o: ExternalOrder): SelfStage => selfStageOf(o, posOf(o));

  const [tab, setTab] = useState<SelfStage | ''>('');
  const countOf = (k: SelfStage | '') => (k === '' ? selfOrders.length : selfOrders.filter((o) => stageOf(o) === k).length);
  const filtered = useMemo(() => (tab ? selfOrders.filter((o) => stageOf(o) === tab) : selfOrders), [selfOrders, tab, purchaseDocs]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <ContentHeader title="销售单自营" breadcrumbs={['销售', '销售单自营']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          销售单自营处理<strong>分发时转成自营的订单</strong>（与「自营工作台」共用同一数据与操作）：
          <strong>待接单</strong>（接单 / 退回分发，仅详情页操作）→ <strong>已接单</strong>（拆单 / 采购&amp;发货：分仓直发 + 缺口以销定采）→
          <strong>已发货运输中</strong>（有物流单号，系统跟踪）→ <strong>妥投</strong> → <strong>确认收货</strong>。进入自营后不支持修改订单内容。
        </div>

        {/* 状态阶段 Tab */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          {([['', '全部'], ['pending', '待接单'], ['accepted', '已接单'], ['shipping', '已发货运输中'], ['delivered', '妥投'], ['done', '确认收货']] as const).map(([k, label]) => (
            <button key={k || 'all'} className={`tab-card-simple${tab === k ? ' active' : ''}`} onClick={() => setTab(k as typeof tab)}>
              {label}
              <span className="tab-card-simple-count">{countOf(k as SelfStage | '')}</span>
            </button>
          ))}
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginLeft: 'auto' }}>待接单 → 接单 / 退回 · 已接单 → 拆单 / 采购&amp;发货 · 妥投 → 确认收货</span>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['订单编号', '客户', '商品', '金额', '跟单人', '采购', '状态', '物流', '操作']}
            rows={filtered.map((o) => {
              const st = stageOf(o);
              const meta = STAGE_META[st];
              const pos = posOf(o);
              const pkgs = packageStatsOf(o, pos);
              return [
                <span key="c" className="cell-mono-emph">{o.code}{o.parentCode && <span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>母单 {o.parentCode}</span>}</span>,
                <span key="cu" className="cell-emph">{o.customerName}</span>,
                <span key="i" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{o.items[0].productName}{o.items.length > 1 ? ` 等${o.items.length}种` : ''} ×{o.items.reduce((s, it) => s + it.quantity, 0)}</span>,
                <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(o.totalAmount)}</span>,
                <span key="f" style={{ fontSize: 'var(--text-sm)' }}>{o.follower ?? '—'}</span>,
                <span key="po" style={{ fontSize: 'var(--text-sm)' }}>
                  {pos.length > 0 ? pos.map((d) => d.code).join('、') : '—'}
                  {o.selfPo && pos.length > 0 && <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{o.selfPo.mode === 'direct' ? '直发客户' : '入库制'}</span>}
                </span>,
                <span key="st">
                  {pill(meta.bg, meta.color, meta.label)}
                  {st === 'accepted' && <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 2 }}>{acceptedSub(o, pos)}</span>}
                </span>,
                <span key="lg" style={{ fontSize: 'var(--text-sm)' }}>
                  {pkgs.total > 0 ? `${pkgs.total} 包裹 · ${pkgs.delivered} 妥投` : '—'}
                </span>,
                <div key="act" className="row-actions">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedId(o.id)}>查看</Button>
                </div>,
              ];
            })}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无自营订单。在「履约分配」选择「转自营」后，订单将进入本页待接单。
            </div>
          )}
        </Card>
      </div>

      {/* 详情抽屉（共享组件：接单 / 退回 / 拆单 / 采购&发货 / 物流 / 确认收货） */}
      {selectedId && (
        <SelfOrderDetailDrawer orderId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
}
