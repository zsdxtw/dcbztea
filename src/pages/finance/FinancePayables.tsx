import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import type {} from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/**
 * 财务 · 应付管理（供应商及合作商应付账款）
 * 由采购订单按约定确认条件派生：入库制=到货入库确认；直发=客户签收确认（见采购·直发确认）。
 * 付款核销见「付款管理」；退货 / 质量扣款等调整后续接入。
 */
export default function FinancePayables() {
  const navigate = useNavigate();
  const docs = usePurchaseStore((s) => s.docs);
  const orders = useOrderFlowStore((s) => s.orders);
  const [tab, setTab] = useState<'' | 'unsettled' | 'settled'>('');

  const orderById = useMemo(() => new Map(orders.map((o) => [o.id, o])), [orders]);

  const rows = useMemo(() => docs.map((d) => {
    const o = orderById.get(d.childOrderId);
    // 应付确认节点：入库制 → 到货入库；直发 → 客户签收（delivered）；结算（settled）= 已付
    const confirmPoint = d.deliveryMode === 'warehouse' ? '到货入库' : '客户签收';
    const confirmed = d.deliveryMode === 'warehouse'
      ? ['received', 'partial_shipped', 'fully_shipped', 'delivered', 'settled'].includes(d.status)
      : ['delivered', 'settled'].includes(d.status);
    const settled = d.status === 'settled';
    return {
      code: d.code, poCode: d.code, supplier: d.supplierName,
      type: d.source === 'distribute' ? '合作商直发' : d.deliveryMode === 'direct' ? '以销定采·直发' : '以销定采·入库',
      orderCode: d.childOrderCode, motherCode: o?.parentCode ?? d.motherCode,
      amount: d.amount, confirmPoint, confirmed, settled,
    };
  }), [docs, orderById]);

  const filtered = tab === '' ? rows : rows.filter((r) => (tab === 'settled' ? r.settled : !r.settled));
  const totalAP = rows.reduce((s, r) => s + r.amount, 0);
  const totalPaid = rows.filter((r) => r.settled).reduce((s, r) => s + r.amount, 0);
  const confirmedUnpaid = rows.filter((r) => r.confirmed && !r.settled).reduce((s, r) => s + r.amount, 0);


  return (
    <>
      <ContentHeader title="应付管理" breadcrumbs={['财务', '应收应付', '应付管理']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          管理平台向<strong>供应商及合作商</strong>采购产生的应付账款：应付按<strong>合同约定的确认条件</strong>生成——
          入库制采购到货入库确认、直发采购客户签收确认（「采购 → 直发确认」操作）；付款核销在「付款管理」，支持按单/按周期汇总付款。
        </div>


        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
          {([['', '全部应付'], ['unsettled', '未付'], ['settled', '已付']] as const).map(([k, label]) => (
            <button key={k || 'all'} className={`tab-card-simple${tab === k ? ' active' : ''}`} onClick={() => setTab(k as typeof tab)}>
              {label}
              <span className="tab-card-simple-count">{k === '' ? rows.length : rows.filter((r) => (k === 'settled' ? r.settled : !r.settled)).length}</span>
            </button>
          ))}
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['应付单号', '供应商', '采购类型', '采购订单', '关联销售订单', '采购金额', '确认节点', '应付状态']}
            rows={filtered.map((r) => [
              <span key="c" className="cell-mono-emph">AP-{r.poCode}</span>,
              <span key="s" className="cell-emph">{r.supplier}</span>,
              <span key="t" style={{ fontSize: 'var(--text-sm)' }}>{r.type}</span>,
              <span key="po" className="mono" style={{ fontSize: 'var(--text-sm)' }}>{r.poCode}</span>,
              <span key="so" className="mono" style={{ fontSize: 'var(--text-sm)' }}>{r.orderCode}<span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>母单 {r.motherCode}</span></span>,
              <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(r.amount)}</span>,
              <span key="cp" style={{ fontSize: 'var(--text-sm)' }}>{r.confirmPoint}</span>,
              r.settled
                ? pill('#ECEFF1', '#455A64', '已付清')
                : r.confirmed
                  ? pill('#FBF3E2', '#9A7A1C', '已确认 · 待付款')
                  : pill('#F5F5F5', '#9E9E9E', '未到确认节点'),
            ])}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无应付记录</div>
          )}
        </Card>

        <div style={{ marginTop: 'var(--space-3)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" onClick={() => navigate('/purchase/direct-delivery-confirm')}>去直发确认交付</Button>
          <Button onClick={() => navigate('/finance/finance-purchase-payment')}>去付款管理付款 →</Button>
        </div>
      </div>
    </>
  );
}
