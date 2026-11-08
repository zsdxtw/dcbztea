import { useMemo } from 'react';
import { PageHead } from '../partner/PartnerUI';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { isSelfOrder } from './selfopShared';
import type { PurchaseDoc } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/** 自营工作台 · 结算：已确认收货（完成）自营订单台账 + 关联采购单结算状态与毛利估算 */
export default function SelfopSettlement() {
  const orders = useOrderFlowStore((s) => s.orders);
  const docs = usePurchaseStore((s) => s.docs);
  const poStore = usePurchaseStore;

  const doneOrders = useMemo(
    () => orders.filter((o) => isSelfOrder(o) && o.processStatus === 'completed').sort((a, b) => b.entryTime.localeCompare(a.entryTime)),
    [orders],
  );

  const posOf = (orderId: string): PurchaseDoc[] => docs.filter((d) => d.childOrderId === orderId);

  const totalAmount = doneOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalCost = doneOrders.reduce((s, o) => s + posOf(o.id).reduce((x, d) => x + d.amount, 0), 0);

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="结算"
        title="自营结算"
        desc={<>客户确认收货的自营订单结算台账；关联采购单随「确认收货」联动结算（也可在此按单补结算）</>}
      />

      {/* 汇总 */}
      <div className="pk-stats">
        <div className="pk-stat">
          <div className="pk-stat-label">已完结订单</div>
          <div className="pk-stat-value">{doneOrders.length}<small>单</small></div>
          <div className="pk-stat-sub">确认收货 · 订单完成</div>
        </div>
        <div className="pk-stat">
          <div className="pk-stat-label">订单金额</div>
          <div className="pk-stat-value">{(totalAmount / 10000).toFixed(2)}<small>万</small></div>
          <div className="pk-stat-sub">{money(totalAmount)}</div>
        </div>
        <div className="pk-stat">
          <div className="pk-stat-label">采购成本</div>
          <div className="pk-stat-value">{(totalCost / 10000).toFixed(2)}<small>万</small></div>
          <div className="pk-stat-sub">以销定采采购单金额合计</div>
        </div>
        <div className="pk-stat accent">
          <div className="pk-stat-label">毛利估算</div>
          <div className="pk-stat-value">{(totalAmount - totalCost).toLocaleString()}<small>元</small></div>
          <div className="pk-stat-sub">订单金额 − 采购成本（未含分仓物流费）</div>
        </div>
      </div>

      <div className="pk-panel" style={{ padding: 0, marginTop: 16 }}>
        <Table
          headers={['订单编号', '客户', '订单金额', '采购成本', '毛利估算', '采购单', '采购结算', '确认收货时间', '操作']}
          rows={doneOrders.map((o) => {
            const pos = posOf(o.id);
            const cost = pos.reduce((s, d) => s + d.amount, 0);
            const allSettled = pos.length > 0 && pos.every((d) => d.status === 'settled');
            const doneAt = [...o.history].reverse().find((h) => h.action.includes('确认收货'))?.time ?? o.entryTime;
            return [
              <span key="c" className="cell-mono-emph">{o.code}</span>,
              <span key="cu" className="cell-emph">{o.customerName}</span>,
              <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(o.totalAmount)}</span>,
              <span key="p" className="mono">{cost > 0 ? money(cost) : '—'}</span>,
              <span key="g" className="mono" style={{ color: 'var(--color-module-current-base)', fontWeight: 'var(--font-semibold)' }}>{money(o.totalAmount - cost)}</span>,
              <span key="po" style={{ fontSize: 'var(--text-sm)' }}>{pos.length > 0 ? pos.map((d) => d.code).join('、') : '—（全库存直发）'}</span>,
              pos.length === 0
                ? <span key="ps" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>无采购单</span>
                : allSettled
                  ? pill('#ECEFF1', '#455A64', '已结算')
                  : pill('#FBF3E2', '#9A7A1C', '待结算'),
              <span key="t" className="cell-muted" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{doneAt}</span>,
              <div key="act" className="row-actions">
                {pos.length > 0 && !allSettled && (
                  <Button size="sm" onClick={() => pos.forEach((d) => poStore.getState().settleByChild(d.childOrderCode))}>按单结算</Button>
                )}
                {allSettled && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>已完结</span>}
              </div>,
            ];
          })}
        />
        {doneOrders.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--color-neutral-400)' }}>
            暂无已完结自营订单（订单「妥投 → 确认收货」后进入结算台账）
          </div>
        )}
      </div>
    </div>
  );
}
