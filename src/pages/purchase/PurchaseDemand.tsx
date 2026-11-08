import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { buildSupplyPlan } from '../../stores/purchaseStore';
import type {} from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

/**
 * 采购 · 采购需求（自营净需求池）
 * 聚合所有「自营待接单」子单的 ATP 缺口行（订单数量 − 可用库存）：
 * 浏览需求、按商品/供应商分析（自营订单库存缺口池；缺口采购经「销售单自营 · 采购&发货」定案）。
 * 跨子单合并生成单据为阶段④扩展。
 */
export default function PurchaseDemand() {
  const navigate = useNavigate();
  const orders = useOrderFlowStore((s) => s.orders);
  const [kw, setKw] = useState('');
  const [onlyShort, setOnlyShort] = useState(false);

  /** 需求行：自营待接单 × 净需求>0 的商品行 */
  const demandRows = useMemo(() => {
    const rows: { orderId: string; code: string; customer: string; productId: string; productName: string; spec: string; orderQty: number; stockQty: number; netQty: number }[] = [];
    for (const o of orders.filter((x) => ['self_pending', 'self_accepted'].includes(x.processStatus) && !x.selfPo)) {
      for (const l of buildSupplyPlan(o)) {
        if (l.netQty <= 0) continue;
        rows.push({ orderId: o.id, code: o.code, customer: o.customerName, productId: l.productId, productName: l.productName, spec: l.spec, orderQty: l.orderQty, stockQty: l.stockQty, netQty: l.netQty });
      }
    }
    return rows;
  }, [orders]);

  const filtered = useMemo(() => demandRows.filter((r) => {
    if (onlyShort && r.stockQty > 0) return false;
    if (kw && !r.productName.includes(kw) && !r.code.includes(kw) && !r.customer.includes(kw)) return false;
    return true;
  }), [demandRows, kw, onlyShort]);

  const totalNet = filtered.reduce((s, r) => s + r.netQty, 0);
  const byProduct = useMemo(() => {
    const m = new Map<string, { productName: string; netQty: number }>();
    for (const r of filtered) m.set(r.productId, { productName: r.productName, netQty: (m.get(r.productId)?.netQty ?? 0) + r.netQty });
    return [...m.values()].sort((a, b) => b.netQty - a.netQty);
  }, [filtered]);


  return (
    <>
      <ContentHeader title="采购申请" breadcrumbs={['采购&仓储', '采购申请']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          采购需求池聚合<strong>自营待接单</strong>的 ATP 净需求（订单数量 − 可用库存）：浏览缺口、按商品汇总；
          在「去供应方案」中行级选择库存直发与供应商（多源），定案后自动按供应商分组生成入库制采购单。
        </div>


        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
          <input className="filter-input" placeholder="搜索商品、订单号、客户..." value={kw} onChange={(e) => setKw(e.target.value)} style={{ width: 240 }} />
          <button className={`tab-card-simple${onlyShort ? ' active' : ''}`} style={{ padding: 'var(--space-1) var(--space-3)' }} onClick={() => setOnlyShort(!onlyShort)}>仅完全缺货商品</button>
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', alignSelf: 'center' }}>共 {filtered.length} 行</span>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['订单编号', '客户', '商品', '规格', '订单数量', '可用库存', '净需求', '操作']}
            rows={filtered.map((r) => [
              <span key="c" className="cell-mono-emph">{r.code}</span>,
              <span key="cu" style={{ fontSize: 'var(--text-sm)' }}>{r.customer}</span>,
              <span key="p" className="cell-emph">{r.productName}</span>,
              <span key="s" style={{ fontSize: 'var(--text-sm)' }}>{r.spec}</span>,
              <span key="q" className="mono">{r.orderQty}</span>,
              <span key="st" className="mono" style={{ color: r.stockQty > 0 ? '#01795D' : '#C13A54' }}>{r.stockQty}</span>,
              <span key="n" className="mono" style={{ fontWeight: 'var(--font-semibold)', color: '#B26A00' }}>{r.netQty}</span>,
              <div key="act" className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => navigate('/sales/order-distribute')}>去供应方案</Button>
              </div>,
            ])}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无采购申请。自营订单（待接单 / 已接单未采购）的商品缺口将进入本需求池；接单与「采购&发货」在「销售单自营」操作。
            </div>
          )}
        </Card>

        {byProduct.length > 0 && (
          <Card title="按商品汇总（净需求）" style={{ marginTop: 'var(--space-4)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {byProduct.map((b) => (
                <span key={b.productName} style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-neutral-200)', fontSize: 'var(--text-sm)', background: 'var(--color-neutral-50)' }}>
                  {b.productName} · <span className="mono" style={{ fontWeight: 'var(--font-semibold)', color: '#B26A00' }}>{b.netQty}</span> 件
                </span>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
