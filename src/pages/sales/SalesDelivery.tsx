import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

type DeliveryType = 'own' | 'partner' | 'supplier';
const TYPE_LABELS: Record<DeliveryType, string> = {
  own: '平台仓发货',
  partner: '合作商直发',
  supplier: '供应商直发',
};
const TYPE_COLORS: Record<DeliveryType, { bg: string; color: string }> = {
  own: { bg: '#E8EAF6', color: '#3949AB' },
  partner: { bg: '#E0F2F1', color: '#00695C' },
  supplier: { bg: '#E3F2FD', color: '#0F64B5' },
};

interface DeliveryRow {
  key: string;
  packageNo: string;
  type: DeliveryType;
  orderCode: string;
  motherCode: string;
  orderId: string;
  fromName: string;
  customer: string;
  itemsText: string;
  qty: number;
  logisticsCompany: string;
  trackingNo: string;
  shippedAt: string;
  status: 'shipped' | 'delivered';
}

/**
 * 销售 · 销售发货（统一发货单管理）
 * 三类发货统一纳入：平台仓发货（自营分仓包裹）/ 合作商直发（转派 PO 包裹）/ 供应商直发（以销定采直发 PO 包裹）。
 * 发货回写订单已发数量；签收（妥投）回写履约状态。发货执行：平台仓在「销售单自营」，直发在合作商终端/采购侧。
 */
export default function SalesDelivery() {
  const navigate = useNavigate();
  const orders = useOrderFlowStore((s) => s.orders);
  const purchaseDocs = usePurchaseStore((s) => s.docs);
  const store = useOrderFlowStore;
  const [typeFilter, setTypeFilter] = useState<'' | DeliveryType>('');
  const [statusFilter, setStatusFilter] = useState<'' | 'shipped' | 'delivered'>('');
  const [keyword, setKeyword] = useState('');

  const rows = useMemo<DeliveryRow[]>(() => {
    const list: DeliveryRow[] = [];
    for (const o of orders) {
      // 平台仓发货：自营分仓包裹
      for (const p of o.selfShipments ?? []) {
        list.push({
          key: p.id, packageNo: p.packageNo, type: 'own',
          orderCode: o.code, motherCode: o.parentCode ?? o.code, orderId: o.id,
          fromName: `${p.warehouseName}（平台仓）`, customer: o.customerName,
          itemsText: p.items.map((i) => `${i.productName}×${i.qty}`).join('、'),
          qty: p.items.reduce((s, i) => s + i.qty, 0),
          logisticsCompany: p.logisticsCompany, trackingNo: p.trackingNo,
          shippedAt: p.shippedAt, status: p.status,
        });
      }
      // 合作商直发 / 供应商直发：PO 包裹（distribute / self·direct）
      for (const d of purchaseDocs.filter((x) => x.childOrderId === o.id && x.deliveryMode === 'direct')) {
        for (const p of d.packages.filter((x) => x.status !== 'void')) {
          list.push({
            key: `${d.id}:${p.id}`, packageNo: p.packageNo,
            type: d.source === 'distribute' ? 'partner' : 'supplier',
            orderCode: o.code, motherCode: o.parentCode ?? o.code, orderId: o.id,
            fromName: `${d.supplierName}（直发）`, customer: o.customerName,
            itemsText: p.items.map((i) => `${i.productName}×${i.qty}`).join('、'),
            qty: p.items.reduce((s, i) => s + i.qty, 0),
            logisticsCompany: p.logisticsCompany, trackingNo: p.trackingNo,
            shippedAt: p.shippedAt, status: p.status as 'shipped' | 'delivered',
          });
        }
      }
    }
    return list.sort((a, b) => b.shippedAt.localeCompare(a.shippedAt));
  }, [orders, purchaseDocs]);

  const filtered = rows.filter((r) => {
    if (typeFilter && r.type !== typeFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (keyword && !r.packageNo.includes(keyword) && !r.trackingNo.includes(keyword) && !r.orderCode.includes(keyword) && !r.customer.includes(keyword)) return false;
    return true;
  });
  const countBy = (t: '' | DeliveryType) => (t === '' ? rows.length : rows.filter((r) => r.type === t).length);

  const deliver = (r: DeliveryRow) => {
    if (r.type === 'own') {
      store.getState().deliverSelfShipment(r.orderId, r.key);
    } else {
      const doc = purchaseDocs.find((d) => d.childOrderId === r.orderId && d.deliveryMode === 'direct' && d.packages.some((x) => x.id === r.key.split(':')[1]));
      const pkgId = r.key.split(':')[1];
      if (doc) usePurchaseStore.getState().deliverPackage(doc.childOrderCode, pkgId);
    }
  };

  return (
    <>
      <ContentHeader title="销售发货" breadcrumbs={['销售', '销售发货']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          统一管理所有<strong>实际发货</strong>：<strong>平台仓发货</strong>（自营分仓出库，扣平台库存）、<strong>合作商直发</strong>（转派采购直发，扣合作商对应库存）、
          <strong>供应商直发</strong>（以销定采直发客户）。发货明细均关联销售单履约与采购明细；签收（妥投）回写订单履约状态。
          发货执行：平台仓在「销售单自营 · 采购&amp;发货」，直发由合作商/供应商端发货登记。
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          {([['', '全部'], ['own', '平台仓发货'], ['partner', '合作商直发'], ['supplier', '供应商直发']] as const).map(([k, label]) => (
            <button key={k || 'all'} className={`tab-card-simple${typeFilter === k ? ' active' : ''}`} onClick={() => setTypeFilter(k as typeof typeFilter)}>
              {label}
              <span className="tab-card-simple-count">{countBy(k as '' | DeliveryType)}</span>
            </button>
          ))}
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} style={{ marginLeft: 'auto' }}>
            <option value="">全部状态</option>
            <option value="shipped">运输中</option>
            <option value="delivered">已妥投</option>
          </select>
          <input className="filter-input" placeholder="搜索发货单号/物流单号/订单/客户..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 240 }} />
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['发货单号', '发货类型', '来源销售订单', '发货方', '收货客户', '商品', '发货数量', '物流公司/单号', '发货时间', '发货状态', '签收状态', '操作']}
            rows={filtered.map((r) => [
              <span key="p" className="cell-mono-emph">{r.packageNo}</span>,
              pill(TYPE_COLORS[r.type].bg, TYPE_COLORS[r.type].color, TYPE_LABELS[r.type]),
              <span key="o" className="mono" style={{ fontSize: 'var(--text-sm)' }}>{r.orderCode}<span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>母单 {r.motherCode}</span></span>,
              <span key="f" style={{ fontSize: 'var(--text-sm)' }}>{r.fromName}</span>,
              <span key="cu" className="cell-emph">{r.customer}</span>,
              <span key="i" style={{ fontSize: 'var(--text-sm)' }}>{r.itemsText}</span>,
              <span key="q" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{r.qty}</span>,
              <span key="l" style={{ fontSize: 'var(--text-sm)' }}>{r.logisticsCompany} <span className="mono">{r.trackingNo}</span></span>,
              <span key="t" className="cell-muted" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{r.shippedAt}</span>,
              pill('#E1F5FE', '#0277BD', '已发货'),
              r.status === 'delivered'
                ? pill('#E0F2F1', '#00695C', '已签收')
                : pill('#FBF3E2', '#9A7A1C', '在途'),
              <div key="act" className="row-actions" style={{ whiteSpace: 'nowrap' }}>
                {r.status !== 'delivered' && <Button size="sm" variant="ghost" onClick={() => deliver(r)}>模拟签收</Button>}
                <Button size="sm" variant="ghost" onClick={() => navigate('/sales/sales-fulfillment')}>看销售单履约</Button>
              </div>,
            ])}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无发货单。平台仓发货在「销售单自营 · 采购&amp;发货」生成；合作商/供应商直发由其端发货登记生成。
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
