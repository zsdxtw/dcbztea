import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { WAREHOUSE_NAMES } from '../../data/stock';

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

interface FlowRow {
  key: string;
  bizType: string;
  refCode: string;
  productName: string;
  warehouse: string;
  owner: string;
  inQty: number;
  outQty: number;
  operator: string;
  time: string;
}

/**
 * 仓储 · 库存流水（所有库存变动的底层追溯依据）
 * 演示口径：由业务单据实时派生——采购入库（入库制 PO 到货）、销售出库（自营分仓发货包裹）；
 * 每条流水必须有业务来源单据，禁止直接修改库存余额。
 */
export default function InventoryIORecord() {
  const orders = useOrderFlowStore((s) => s.orders);
  const purchaseDocs = usePurchaseStore((s) => s.docs);
  const [bizFilter, setBizFilter] = useState('');

  const rows = useMemo<FlowRow[]>(() => {
    const list: FlowRow[] = [];
    // 采购入库：入库制 PO 到货（received 及之后状态）
    for (const d of purchaseDocs.filter((x) => x.deliveryMode === 'warehouse' && ['received', 'partial_shipped', 'fully_shipped', 'delivered', 'settled'].includes(x.status))) {
      for (const it of d.items) {
        list.push({
          key: `in-${d.id}-${it.productId}`,
          bizType: '采购入库',
          refCode: `${d.code}（${d.supplierName}）`,
          productName: it.productName,
          warehouse: '杭州总仓',
          owner: '平台所有',
          inQty: it.quantity, outQty: 0,
          operator: '李仓管',
          time: `${d.createTime} 10:00`,
        });
      }
    }
    // 销售出库：自营分仓发货包裹
    for (const o of orders) {
      for (const p of o.selfShipments ?? []) {
        for (const it of p.items) {
          list.push({
            key: `out-${p.id}-${it.productId}`,
            bizType: '销售出库',
            refCode: `${p.packageNo} · 订单 ${o.code}`,
            productName: it.productName,
            warehouse: p.warehouseName,
            owner: '平台所有',
            inQty: 0, outQty: it.qty,
            operator: '平台仓',
            time: p.shippedAt,
          });
        }
      }
    }
    return list.sort((a, b) => b.time.localeCompare(a.time));
  }, [orders, purchaseDocs]);

  const filtered = bizFilter ? rows.filter((r) => r.bizType === bizFilter) : rows;
  const totalIn = rows.reduce((s, r) => s + r.inQty, 0);
  const totalOut = rows.reduce((s, r) => s + r.outQty, 0);

  return (
    <>
      <ContentHeader title="库存流水" breadcrumbs={['仓储', '库存流水']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          记录所有库存变化，是库存追溯的底层依据：<strong>所有库存变动必须有业务来源单据</strong>（采购入库 / 销售出库 / 调拨 / 盘点调整等），禁止直接修改库存余额。
          演示口径：流水由采购入库与自营分仓发货实时派生；调拨 / 盘点流水随对应功能接入。
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="filter-select" value={bizFilter} onChange={(e) => setBizFilter(e.target.value)}>
            <option value="">全部业务类型</option>
            <option value="采购入库">采购入库</option>
            <option value="销售出库">销售出库</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
            共 {rows.length} 条 · 入库合计 <b className="mono" style={{ color: '#01795D' }}>{totalIn}</b> · 出库合计 <b className="mono" style={{ color: '#0277BD' }}>{totalOut}</b>
          </span>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['业务类型', '关联单据', '商品', '仓库', '库存所有者', '入库数量', '出库数量', '操作人', '业务时间']}
            rows={filtered.map((r) => [
              r.bizType === '采购入库'
                ? pill('#E8F5E9', '#01795D', '采购入库')
                : pill('#E1F5FE', '#0277BD', '销售出库'),
              <span key="ref" className="mono" style={{ fontSize: 'var(--text-sm)' }}>{r.refCode}</span>,
              <span key="p" className="cell-emph">{r.productName}</span>,
              <span key="w" style={{ fontSize: 'var(--text-sm)' }}>{r.warehouse}</span>,
              <span key="o" style={{ fontSize: 'var(--text-sm)', color: '#01795D' }}>{r.owner}</span>,
              <span key="i" className="mono" style={{ color: r.inQty > 0 ? '#01795D' : 'var(--color-neutral-400)' }}>{r.inQty || '—'}</span>,
              <span key="out" className="mono" style={{ color: r.outQty > 0 ? '#0277BD' : 'var(--color-neutral-400)' }}>{r.outQty || '—'}</span>,
              <span key="u" className="cell-muted" style={{ fontSize: 'var(--text-sm)' }}>{r.operator}</span>,
              <span key="t" className="cell-muted" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{r.time}</span>,
            ])}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无流水记录。采购到货入库（入库制 PO）与自营分仓发货后自动生成。
            </div>
          )}
        </Card>

        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 'var(--space-2)' }}>
          平台自有仓：{Object.values(WAREHOUSE_NAMES).join(' / ')}；合作商直发不产生平台流水（货权不经过平台仓）。
        </div>
      </div>
    </>
  );
}
