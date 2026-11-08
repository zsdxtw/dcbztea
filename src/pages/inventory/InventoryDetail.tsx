import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import { WAREHOUSE_STOCK, WAREHOUSE_NAMES } from '../../data/stock';
import { usePriceStore } from '../../stores/priceStore';

const money = (n: number) => `¥${n.toLocaleString()}`;

/** 稳定演示批次号（同商品同仓固定批次） */
const lotOf = (productId: string, warehouseId: string) => `LOT-${productId.slice(-2).toUpperCase()}-${warehouseId.slice(-2).toUpperCase()}-A`;

/**
 * 仓储 · 库存明细（SKU × 仓库 × 货主 × 批次）
 * 演示口径：平台所有的分仓台账（WAREHOUSE_STOCK）；预留数量来自「库存预留」未释放记录（演示为 0 起步）。
 */
export default function InventoryDetail() {
  const products = usePriceStore((s) => s.products);
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [keyword, setKeyword] = useState('');

  const rows = useMemo(() => {
    const list: {
      productId: string; productName: string; brand: string; spec: string;
      warehouseId: string; warehouseName: string; qty: number; cost: number;
    }[] = [];
    for (const [warehouseId, stocks] of Object.entries(WAREHOUSE_STOCK)) {
      for (const [productId, qty] of Object.entries(stocks)) {
        if (qty <= 0) continue;
        const p = products.find((x) => x.id === productId);
        list.push({
          productId, productName: p?.name ?? productId, brand: p?.brand ?? '—', spec: p?.spec ?? '—',
          warehouseId, warehouseName: WAREHOUSE_NAMES[warehouseId] ?? warehouseId,
          qty, cost: Math.round((p?.marketPrice ?? 0) * 0.55),
        });
      }
    }
    return list;
  }, [products]);

  const filtered = rows.filter((r) => {
    if (warehouseFilter && r.warehouseId !== warehouseFilter) return false;
    if (keyword && !r.productName.includes(keyword) && !r.productId.toUpperCase().includes(keyword.toUpperCase())) return false;
    return true;
  });

  const totalQty = filtered.reduce((s, r) => s + r.qty, 0);
  const totalAmount = filtered.reduce((s, r) => s + r.qty * r.cost, 0);

  return (
    <>
      <ContentHeader title="库存明细" breadcrumbs={['采购&仓储', '库存管理', '库存明细']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          按 <strong>SKU × 仓库 × 货主 × 批次</strong>的库存台账：货权当前为<strong>平台所有</strong>（合作商库存归合作商库存域，未经验证不作为平台可用库存）；
          成本单价按采购价规则估算（市场价 55%）。点击行可追溯采购入库 / 销售出库 / 调拨等流水（见「库存流水」）。
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="filter-select" value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
            <option value="">全部仓库</option>
            {Object.keys(WAREHOUSE_STOCK).map((id) => <option key={id} value={id}>{WAREHOUSE_NAMES[id] ?? id}</option>)}
          </select>
          <input className="filter-input" placeholder="搜索商品名称 / SKU..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 220 }} />
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
            {filtered.length} 条明细 · 数量合计 <b className="mono">{totalQty}</b> · 金额合计 <b className="mono">{money(totalAmount)}</b>
          </span>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['商品名称', 'SKU', '品牌', '规格', '仓库', '库位', '库存所有者', '批次号', '生产日期', '保质期', '实物数量', '预留数量', '不可用', '可用数量', '成本单价', '库存金额']}
            rows={filtered.map((r) => [
              <span key="n" className="cell-emph">{r.productName}</span>,
              <span key="id" className="mono" style={{ fontSize: 'var(--text-sm)' }}>{r.productId.toUpperCase()}</span>,
              <span key="b" style={{ fontSize: 'var(--text-sm)' }}>{r.brand}</span>,
              <span key="s" style={{ fontSize: 'var(--text-sm)' }}>{r.spec}</span>,
              <span key="w" style={{ fontSize: 'var(--text-sm)' }}>{r.warehouseName}</span>,
              <span key="loc" className="mono" style={{ fontSize: 'var(--text-sm)' }}>A-01</span>,
              <span key="o" style={{ fontSize: 'var(--text-sm)', color: '#01795D' }}>平台所有</span>,
              <span key="lot" className="mono" style={{ fontSize: 'var(--text-sm)' }}>{lotOf(r.productId, r.warehouseId)}</span>,
              <span key="pd" className="cell-muted" style={{ fontSize: 'var(--text-sm)' }}>2026-09-15</span>,
              <span key="sh" className="cell-muted" style={{ fontSize: 'var(--text-sm)' }}>18 个月</span>,
              <span key="q" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{r.qty}</span>,
              <span key="r" className="mono" style={{ color: 'var(--color-neutral-400)' }}>0</span>,
              <span key="u" className="mono" style={{ color: 'var(--color-neutral-400)' }}>0</span>,
              <span key="a" className="mono" style={{ color: '#01795D', fontWeight: 'var(--font-medium)' }}>{r.qty}</span>,
              <span key="c" className="mono">{money(r.cost)}</span>,
              <span key="amt" className="mono">{money(r.qty * r.cost)}</span>,
            ])}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>当前筛选条件下暂无库存明细</div>
          )}
        </Card>
      </div>
    </>
  );
}
