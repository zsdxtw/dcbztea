import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { usePriceStore } from '../../stores/priceStore';
import type {} from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

/**
 * 财务 · 经营利润（订单 / 客户 / 商品 / 合作商 多维）
 * 口径：已完结（确认收货/已结算）订单；收入=订单金额；成本=关联采购单金额（直发）+ 平台仓出库成本（采购价估算）；
 * 预计毛利实时估算，最终经营利润以实际成本、退货与费用核算为准（退货/费用未接入前为演示口径）。
 */
export default function FinanceProfit() {
  const orders = useOrderFlowStore((s) => s.orders);
  const purchaseDocs = usePurchaseStore((s) => s.docs);
  const products = usePriceStore((s) => s.products);
  const [dim, setDim] = useState<'order' | 'customer' | 'product' | 'partner'>('order');

  /** 已完结订单利润行 */
  const orderRows = useMemo(() => {
    return orders
      .filter((o) => o.processStatus === 'completed')
      .map((o) => {
        const pos = purchaseDocs.filter((d) => d.childOrderId === o.id);
        const purchaseCost = pos.reduce((s, d) => s + d.amount, 0);
        // 平台仓出库成本：自营分仓包裹数量 × 采购价估算（市场价 55%）
        const stockCost = (o.selfShipments ?? []).reduce((s, p) => s + p.items.reduce((x, i) => {
          const m = products.find((pp) => pp.id === i.productId)?.marketPrice ?? 0;
          return x + Math.round(m * 0.55) * i.qty;
        }, 0), 0);
        const revenue = o.totalAmount;
        const gross = revenue - purchaseCost - stockCost;
        return {
          code: o.code, customer: o.customerName, partner: o.partnerName ?? (o.path === 'self' ? '平台自营' : '—'),
          mode: o.path === 'self' ? '自营履约' : '合作商履约',
          products: o.items.map((it) => it.productName),
          revenue, purchaseCost, stockCost, gross, net: gross,
        };
      });
  }, [orders, purchaseDocs, products]);

  const totals = orderRows.reduce((acc, r) => ({
    revenue: acc.revenue + r.revenue, cost: acc.cost + r.purchaseCost + r.stockCost, gross: acc.gross + r.gross,
  }), { revenue: 0, cost: 0, gross: 0 });

  /** 维度聚合 */
  const dimRows = useMemo(() => {
    if (dim === 'order') return null;
    const map = new Map<string, { key: string; mode?: string; orders: number; revenue: number; cost: number }>();
    for (const r of orderRows) {
      const keys: { key: string; mode?: string }[] = dim === 'customer'
        ? [{ key: r.customer }]
        : dim === 'partner'
          ? [{ key: r.partner, mode: r.mode }]
          : r.products.map((p) => ({ key: p }));
      for (const k of keys) {
        const cur = map.get(k.key) ?? { key: k.key, mode: k.mode, orders: 0, revenue: 0, cost: 0 };
        cur.orders += 1;
        cur.revenue += r.revenue;
        cur.cost += r.purchaseCost + r.stockCost;
        map.set(k.key, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [dim, orderRows]);


  return (
    <>
      <ContentHeader title="经营利润" breadcrumbs={['财务', '经营利润']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          从经营角度查看<strong>每张订单 / 客户 / 商品 / 合作商</strong>的利润：收入=订单金额；成本=合作商采购（直发 PO）+ 平台仓出库成本（采购价估算）。
          预计毛利实时估算；最终经营利润以实际成本、退货与费用核算为准（退货 / 物流费未接入前为演示口径）。
        </div>


        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
          {([['order', '按订单'], ['customer', '按客户'], ['product', '按商品'], ['partner', '按合作商/自营']] as const).map(([k, label]) => (
            <button key={k} className={`tab-card-simple${dim === k ? ' active' : ''}`} onClick={() => setDim(k as typeof dim)}>{label}</button>
          ))}
        </div>

        <Card style={{ padding: 0 }}>
          {dim === 'order' ? (
            <Table
              headers={['销售订单', '客户', '履约模式', '履约方', '销售收入', '采购成本', '库存成本', '毛利', '毛利率']}
              rows={orderRows.map((r) => [
                <span key="c" className="cell-mono-emph">{r.code}</span>,
                <span key="cu" className="cell-emph">{r.customer}</span>,
                <span key="m" style={{ fontSize: 'var(--text-sm)' }}>{r.mode}</span>,
                <span key="p" style={{ fontSize: 'var(--text-sm)' }}>{r.partner}</span>,
                <span key="rev" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(r.revenue)}</span>,
                <span key="pc" className="mono">{r.purchaseCost > 0 ? money(r.purchaseCost) : '—'}</span>,
                <span key="sc" className="mono">{r.stockCost > 0 ? money(r.stockCost) : '—'}</span>,
                <span key="g" className="mono" style={{ color: 'var(--color-module-current-base)', fontWeight: 'var(--font-semibold)' }}>{money(r.gross)}</span>,
                <span key="r" className="mono">{r.revenue > 0 ? `${Math.round((r.gross / r.revenue) * 100)}%` : '—'}</span>,
              ])}
            />
          ) : (
            <Table
              headers={[dim === 'customer' ? '客户' : dim === 'product' ? '商品' : '合作商/自营', '订单数', '销售收入', '商品成本', '毛利', '毛利率']}
              rows={(dimRows ?? []).map((r) => [
                <span key="k" className="cell-emph">{r.key}</span>,
                <span key="o" className="mono">{r.orders}</span>,
                <span key="rev" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(r.revenue)}</span>,
                <span key="c" className="mono">{money(r.cost)}</span>,
                <span key="g" className="mono" style={{ color: 'var(--color-module-current-base)', fontWeight: 'var(--font-semibold)' }}>{money(r.revenue - r.cost)}</span>,
                <span key="r" className="mono">{r.revenue > 0 ? `${Math.round(((r.revenue - r.cost) / r.revenue) * 100)}%` : '—'}</span>,
              ])}
            />
          )}
          {orderRows.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无已完结订单（确认收货 / 结算完成后进入利润核算）
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
