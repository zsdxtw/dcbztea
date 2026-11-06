import { useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import AlertItem from '../../components/business/AlertItem';
import { alertItems } from '../../data/mock';
import { STOCK_BY_PRODUCT, WAREHOUSE_STOCK, WAREHOUSE_NAMES, getWarehouseStock } from '../../data/stock';
import { usePriceStore } from '../../stores/priceStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import type { StatCardData } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

/**
 * 仓储 · 库存总览（平台库存与合作商库存分列，记录货权）
 * 演示口径：平台分仓台账实时汇总；预留=自营已接单待发货；合作商可供货为合作商库存域（未验证不作为平台可用）。
 */
export default function InventoryOverview() {
  const products = usePriceStore((s) => s.products);
  const purchaseDocs = usePurchaseStore((s) => s.docs);

  /** 平台库存：按商品汇总（实物/预留/可用/在途采购/金额） */
  const rows = useMemo(() => {
    return Object.entries(STOCK_BY_PRODUCT).map(([productId, qty]) => {
      const p = products.find((x) => x.id === productId);
      const cost = Math.round((p?.marketPrice ?? 0) * 0.55);
      const whs = getWarehouseStock(productId);
      const inTransit = purchaseDocs
        .filter((d) => d.deliveryMode === 'warehouse' && ['confirmed', 'partial_shipped'].includes(d.status) && d.items.some((it) => it.productId === productId))
        .reduce((s, d) => s + (d.items.find((it) => it.productId === productId)?.quantity ?? 0), 0);
      return {
        productId, productName: p?.name ?? productId, brand: p?.brand ?? '—',
        qty, resv: 0, available: qty, inTransit, amount: qty * cost,
        warehouseText: whs.length > 0 ? whs.map((w) => `${w.warehouseName} ${w.qty}`).join(' · ') : '—（缺货）',
      };
    }).filter((r) => r.qty > 0 || r.inTransit > 0);
  }, [products, purchaseDocs]);

  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
  const totalInTransit = rows.reduce((s, r) => s + r.inTransit, 0);
  const shortage = Object.entries(STOCK_BY_PRODUCT).filter(([, q]) => q === 0).length;

  const stats: StatCardData[] = [
    { label: '平台库存总量', value: totalQty.toLocaleString(), unit: '件', trend: { direction: 'up', value: `${Object.keys(WAREHOUSE_STOCK).length} 个自有仓` }, icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg> },
    { label: '平台可用库存', value: (totalQty).toLocaleString(), unit: '件', trend: { direction: 'up', value: '实物 − 预留 − 不可用' }, icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M6.5 9l2 2 3.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: '在途采购', value: totalInTransit.toLocaleString(), unit: '件', trend: { direction: 'up', value: '入库制采购在途' }, icon: <svg viewBox="0 0 18 18" fill="none"><path d="M2 13L13 2M6 2h7v7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: '库存金额', value: (totalAmount / 10000).toFixed(1), unit: '万', trend: { direction: 'down', value: money(totalAmount) }, icon: <svg viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8h2M5 11h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
    { label: '缺货商品', value: String(shortage), unit: '种', trend: { direction: shortage > 0 ? 'down' : 'up', value: '需以销定采 / 补货' }, icon: <svg viewBox="0 0 18 18" fill="none"><path d="M10 2a5 5 0 015 5v3l2 2H3l2-2V7a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
    { label: '合作商可供货', value: '—', trend: { direction: 'up', value: '合作商库存域（未验证）' }, icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 16a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  ];

  return (
    <>
      <ContentHeader title="库存总览" breadcrumbs={['仓储', '库存总览']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          平台库存与合作商库存<strong>分权管理</strong>：平台库存按仓库×批次记实物/预留/不可用；合作商库存为其自有货权（未经验证的数量不作为平台自动履约的可用库存）。
          明细见「库存明细」，预留见「库存预留」，全部变动见「库存流水」。
        </div>

        <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>

        <Card title="平台库存（按商品 × 分仓）" style={{ marginTop: 'var(--space-4)' }}>
          <Table
            headers={['商品', '品牌', '分仓分布', '实物库存', '预留', '可用', '在途采购', '库存金额']}
            rows={rows.map((r) => [
              <span key="n" className="cell-emph">{r.productName}</span>,
              <span key="b" style={{ fontSize: 'var(--text-sm)' }}>{r.brand}</span>,
              <span key="w" style={{ fontSize: 'var(--text-sm)' }}>{r.warehouseText}</span>,
              <span key="q" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{r.qty}</span>,
              <span key="r" className="mono" style={{ color: 'var(--color-neutral-400)' }}>{r.resv}</span>,
              <span key="a" className="mono" style={{ color: '#01795D', fontWeight: 'var(--font-medium)' }}>{r.available}</span>,
              <span key="t" className="mono" style={{ color: r.inTransit > 0 ? '#B26A00' : 'var(--color-neutral-400)' }}>{r.inTransit}</span>,
              <span key="m" className="mono">{money(r.amount)}</span>,
            ])}
          />
        </Card>

        <Card title="库存预警" headerRight={<span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-semantic-warning)' }}>{alertItems.length} 项预警</span>} style={{ marginTop: 'var(--space-4)' }}>
          {alertItems.map((a, i) => <AlertItem key={i} data={a} />)}
        </Card>
      </div>
    </>
  );
}
