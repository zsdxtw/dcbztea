import { useMemo, useState } from 'react';
import { PageHead } from '../partner/PartnerUI';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import SelfOrderDetailDrawer from '../../components/selfop/SelfOrderDetailDrawer';
import { isSelfOrder } from './selfopShared';
import type { PurchaseDoc } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const PO_STATUS_LABELS: Record<string, string> = {
  pending: '待确认', confirmed: '已确认', received: '已入库', partial_shipped: '部分发出',
  fully_shipped: '全部发出', delivered: '已签收', settled: '已结算',
};
const PO_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#F5F5F5', color: '#9E9E9E' },
  confirmed: { bg: '#E3F2FD', color: '#0F64B5' },
  received: { bg: '#E8EAF6', color: '#3949AB' },
  partial_shipped: { bg: '#E1F5FE', color: '#0277BD' },
  fully_shipped: { bg: '#E1F5FE', color: '#0277BD' },
  delivered: { bg: '#E0F2F1', color: '#00695C' },
  settled: { bg: '#ECEFF1', color: '#455A64' },
};

const pillOf = (s: string) => {
  const c = PO_STATUS_COLORS[s] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
  return <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{PO_STATUS_LABELS[s] ?? s}</span>;
};

/** 自营工作台 · 采购：以销定采采购单（source=self），入库制到货入库、按单结算、回订单出库 */
export default function SelfopPurchase() {
  const orders = useOrderFlowStore((s) => s.orders);
  const docs = usePurchaseStore((s) => s.docs);
  const poStore = usePurchaseStore;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /** 以销定采采购单 = 关联自营订单的 PO */
  const selfOrders = useMemo(() => orders.filter(isSelfOrder), [orders]);
  const selfOrderIds = new Set(selfOrders.map((o) => o.id));
  const poList = useMemo(
    () => docs.filter((d) => d.source === 'self' && selfOrderIds.has(d.childOrderId)),
    [docs, selfOrderIds],
  );

  const orderOf = (d: PurchaseDoc) => selfOrders.find((o) => o.id === d.childOrderId);

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="采购"
        title="以销定采采购单"
        desc={<>「采购&amp;发货」缺口以销定采生成的采购单（共 {poList.length} 张）：直发客户模式由供应商直发（包裹在「物流跟踪」）；入库制到货入库后回订单「到货出库发货」；结算随订单确认收货联动</>}
      />

      <div className="pk-panel" style={{ padding: 0 }}>
        <Table
          headers={['采购单号', '关联销售订单', '供应商', '模式', '商品(已发/量)', '采购金额', '包裹', '状态', '时间', '操作']}
          rows={poList.map((d) => {
            const o = orderOf(d);
            const activePkgs = d.packages.filter((x) => x.status !== 'void');
            return [
              <span key="c" className="cell-mono-emph">{d.code}</span>,
              <span key="so" className="mono" style={{ fontSize: 'var(--text-sm)' }}>{d.childOrderCode}</span>,
              <span key="s" className="cell-emph">{d.supplierName}</span>,
              <span key="m" style={{ fontSize: 'var(--text-sm)' }}>{d.deliveryMode === 'direct' ? '直发客户' : '入库制'}</span>,
              <span key="i" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>
                {d.items[0].productName}{d.items.length > 1 ? ` 等${d.items.length}种` : ''}
                <span className="mono">（{d.items.reduce((s, it) => s + it.shippedQty, 0)}/{d.items.reduce((s, it) => s + it.quantity, 0)}）</span>
              </span>,
              <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(d.amount)}</span>,
              <span key="p" style={{ fontSize: 'var(--text-sm)' }}>{activePkgs.length > 0 ? `${activePkgs.length} 包裹` : '—'}</span>,
              pillOf(d.status),
              <span key="t" className="cell-muted" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{d.createTime}</span>,
              <div key="act" className="row-actions">
                {d.deliveryMode === 'warehouse' && d.status === 'confirmed' && (
                  <Button size="sm" variant="ghost" onClick={() => poStore.getState().receiveByChild(d.childOrderCode)}>到货入库</Button>
                )}
                {o && ['self_pending'].includes(o.processStatus) === false && (
                  <Button size="sm" variant="ghost" onClick={() => setSelectedId(o.id)}>去订单</Button>
                )}
              </div>,
            ];
          })}
        />
        {poList.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--color-neutral-400)' }}>
            暂无以销定采采购单（订单「采购&amp;发货」选择缺口以销定采后生成）
          </div>
        )}
      </div>

      {selectedId && (
        <SelfOrderDetailDrawer orderId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
