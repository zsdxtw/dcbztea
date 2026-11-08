import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { WAREHOUSE_STOCK, WAREHOUSE_NAMES, getWarehouseStock } from '../../data/stock';
import { isSelfOrder } from '../selfop/selfopShared';

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/**
 * 仓储 · 库存预留
 * 可用 = 实物 − 预留 − 不可用。演示口径：自营「已接单待发货」数量即平台仓预留（分配到首个有货仓），
 * 采购&发货/到货出库后自动释放并扣减实物；转派合作商订单不占平台仓预留（合作商库存域单独预留）。
 */
export default function InventoryReservation() {
  const orders = useOrderFlowStore((s) => s.orders);
  const [tab, setTab] = useState<'' | 'active' | 'released'>('');

  /** 预留记录：自营已接单（含运输前）订单按商品 × 首个有货仓 */
  const rows = useMemo(() => {
    const list: {
      key: string; resvNo: string; orderCode: string; customer: string;
      productId: string; productName: string; warehouseId: string; warehouseName: string;
      resvQty: number; shippedQty: number; status: 'active' | 'released'; time: string;
    }[] = [];
    for (const o of orders.filter(isSelfOrder)) {
      if (!['self_accepted', 'self_shipped'].includes(o.processStatus)) continue;
      const shippedMap = new Map<string, number>();
      for (const p of o.selfShipments ?? []) for (const i of p.items) shippedMap.set(i.productId, (shippedMap.get(i.productId) ?? 0) + i.qty);
      for (const it of o.items) {
        const shipped = shippedMap.get(it.productId) ?? 0;
        const resv = it.quantity - shipped;
        if (resv <= 0 && shipped <= 0) continue;
        const wh = getWarehouseStock(it.productId)[0];
        list.push({
          key: `${o.id}:${it.productId}`,
          resvNo: `RSV-${o.code.slice(-6)}-${it.productId.toUpperCase()}`,
          orderCode: o.code, customer: o.customerName,
          productId: it.productId, productName: it.productName,
          warehouseId: wh?.warehouseId ?? '—', warehouseName: wh?.warehouseName ?? '（缺货·以销定采）',
          resvQty: Math.max(0, resv), shippedQty: shipped,
          status: resv > 0 ? 'active' : 'released',
          time: o.entryTime,
        });
      }
    }
    return list;
  }, [orders]);

  const filtered = tab ? rows.filter((r) => r.status === tab) : rows;
  const activeQty = rows.filter((r) => r.status === 'active').reduce((s, r) => s + r.resvQty, 0);

  return (
    <>
      <ContentHeader title="库存预留" breadcrumbs={['采购&仓储', '库存管理', '库存预留']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          销售订单分配到平台仓时先<strong>锁定库存</strong>（防超卖）：<strong>可用库存 = 实物 − 预留 − 不可用</strong>。
          出库确认后自动释放预留并扣减实物。合作商订单的预留记录在合作商库存域，不占平台仓。
          当前预留中 <b className="mono">{activeQty}</b> 件（演示口径：自营已接单待发货数量，缺货行走以销定采不入预留）。
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
          {([['', '全部'], ['active', '预留中'], ['released', '已释放（已出库）']] as const).map(([k, label]) => (
            <button key={k || 'all'} className={`tab-card-simple${tab === k ? ' active' : ''}`} onClick={() => setTab(k as typeof tab)}>
              {label}
              <span className="tab-card-simple-count">{k === '' ? rows.length : rows.filter((r) => r.status === k).length}</span>
            </button>
          ))}
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['预留单号', '销售订单', '客户', '商品', '仓库', '预留数量', '已出库数量', '预留状态', '预留时间', '说明']}
            rows={filtered.map((r) => [
              <span key="n" className="cell-mono-emph">{r.resvNo}</span>,
              <span key="o" className="mono" style={{ fontSize: 'var(--text-sm)' }}>{r.orderCode}</span>,
              <span key="cu" style={{ fontSize: 'var(--text-sm)' }}>{r.customer}</span>,
              <span key="p" className="cell-emph">{r.productName}</span>,
              <span key="w" style={{ fontSize: 'var(--text-sm)' }}>{r.warehouseName}</span>,
              <span key="q" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{r.resvQty}</span>,
              <span key="s" className="mono" style={{ color: r.shippedQty > 0 ? '#01795D' : undefined }}>{r.shippedQty}</span>,
              r.status === 'active'
                ? pill('#FBF3E2', '#9A7A1C', '预留中')
                : pill('#E0F2F1', '#00695C', '已释放'),
              <span key="t" className="cell-muted" style={{ fontSize: 'var(--text-sm)' }}>{r.time}</span>,
              <span key="note" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
                {r.status === 'active' ? '采购&发货 / 到货出库后自动释放' : '出库发货完成'}
              </span>,
            ])}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无预留记录。自营订单接单后，待发货数量自动形成平台仓预留。
            </div>
          )}
        </Card>

        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 'var(--space-2)' }}>
          平台分仓台账（实物数量）：{Object.keys(WAREHOUSE_STOCK).map((id) => `${WAREHOUSE_NAMES[id]} ${Object.values(WAREHOUSE_STOCK[id]).reduce((s, q) => s + q, 0)}`).join(' · ')}
        </div>
      </div>
    </>
  );
}
