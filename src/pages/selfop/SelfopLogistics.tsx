import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../partner/PartnerUI';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { isSelfOrder } from './selfopShared';

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/** 包裹行（自营分仓包裹 或 采购单直发包裹） */
interface PackageRow {
  id: string;
  packageNo: string;
  orderCode: string;
  orderId: string;
  sourceType: 'own' | 'po';
  fromName: string;
  itemsText: string;
  logisticsCompany: string;
  trackingNo: string;
  status: 'shipped' | 'delivered';
  time: string;
}

/** 自营工作台 · 物流跟踪：自营分仓包裹 + 以销定采直发包裹，按妥投推进（系统跟踪物流的演示替代） */
export default function SelfopLogistics() {
  const navigate = useNavigate();
  const orders = useOrderFlowStore((s) => s.orders);
  const purchaseDocs = usePurchaseStore((s) => s.docs);
  const store = useOrderFlowStore;
  const [filter, setFilter] = useState<'' | 'shipped' | 'delivered'>('');

  const rows = useMemo<PackageRow[]>(() => {
    const list: PackageRow[] = [];
    for (const o of orders.filter(isSelfOrder)) {
      for (const p of o.selfShipments ?? []) {
        list.push({
          id: p.id, packageNo: p.packageNo, orderCode: o.code, orderId: o.id, sourceType: 'own',
          fromName: p.warehouseName,
          itemsText: p.items.map((i) => `${i.productName}×${i.qty}`).join('、'),
          logisticsCompany: p.logisticsCompany, trackingNo: p.trackingNo,
          status: p.status, time: p.status === 'delivered' ? (p.deliveredAt ?? p.shippedAt) : p.shippedAt,
        });
      }
      for (const d of purchaseDocs.filter((x) => x.childOrderId === o.id)) {
        for (const p of d.packages.filter((x) => x.status !== 'void')) {
          list.push({
            id: `${d.id}:${p.id}`, packageNo: p.packageNo, orderCode: o.code, orderId: o.id, sourceType: 'po',
            fromName: `${d.supplierName}（直发）`,
            itemsText: p.items.map((i) => `${i.productName}×${i.qty}`).join('、'),
            logisticsCompany: p.logisticsCompany, trackingNo: p.trackingNo,
            status: p.status as 'shipped' | 'delivered', time: p.shippedAt,
          });
        }
      }
    }
    return list.sort((a, b) => b.time.localeCompare(a.time));
  }, [orders, purchaseDocs]);

  const filtered = filter ? rows.filter((r) => r.status === filter) : rows;
  const shipped = rows.filter((r) => r.status === 'shipped').length;

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="订单 · 物流"
        title="物流跟踪"
        desc={<>全部 {rows.length} 个包裹（自营分仓 {rows.filter((r) => r.sourceType === 'own').length} · 采购直发 {rows.filter((r) => r.sourceType === 'po').length}），运输中 {shipped} 个；物流投递完成后推进妥投，订单全部包裹妥投自动进入「妥投」待确认收货</>}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {([['', '全部'], ['shipped', '运输中'], ['delivered', '已妥投']] as const).map(([k, label]) => (
          <button
            key={k || 'all'}
            onClick={() => setFilter(k as typeof filter)}
            style={{
              padding: '6px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
              border: `1px solid ${filter === k ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
              background: filter === k ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
              color: filter === k ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
              fontWeight: filter === k ? 600 : 400,
            }}
          >
            {label} · {k === '' ? rows.length : rows.filter((r) => r.status === k).length}
          </button>
        ))}
      </div>

      <div className="pk-panel" style={{ padding: 0 }}>
        <Table
          headers={['包裹号', '关联订单', '发货方', '商品', '快递', '状态', '时间', '操作']}
          rows={filtered.map((r) => [
            <span key="p" className="cell-mono-emph">{r.packageNo}</span>,
            <span key="o" className="mono" style={{ fontSize: 'var(--text-sm)' }}>{r.orderCode}</span>,
            <span key="f" style={{ fontSize: 'var(--text-sm)' }}>{r.fromName}</span>,
            <span key="i" style={{ fontSize: 'var(--text-sm)' }}>{r.itemsText}</span>,
            <span key="l" style={{ fontSize: 'var(--text-sm)' }}>{r.logisticsCompany} <span className="mono">{r.trackingNo}</span></span>,
            r.status === 'delivered'
              ? pill('#E0F2F1', '#00695C', '已妥投')
              : pill('#E1F5FE', '#0277BD', '运输中'),
            <span key="t" className="cell-muted" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{r.time}</span>,
            <div key="act" className="row-actions">
              {r.status !== 'delivered' && (
                <Button size="sm" variant="ghost" onClick={() => store.getState().deliverSelfShipment(r.orderId, r.sourceType === 'own' ? r.id : undefined)}>模拟妥投</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => navigate('/selfop/orders')}>去订单</Button>
            </div>,
          ])}
        />
        {filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--color-neutral-400)' }}>暂无物流包裹（采购&amp;发货 / 到货出库后生成）</div>
        )}
      </div>
    </div>
  );
}
