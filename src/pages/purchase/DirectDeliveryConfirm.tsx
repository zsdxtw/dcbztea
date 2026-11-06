import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: '待确认', bg: '#F5F5F5', color: '#9E9E9E' },
  confirmed: { label: '已确认 · 待发货', bg: '#E3F2FD', color: '#0F64B5' },
  partial_shipped: { label: '部分发出 · 待签收', bg: '#E1F5FE', color: '#0277BD' },
  fully_shipped: { label: '全部发出 · 待签收', bg: '#E1F5FE', color: '#0277BD' },
  delivered: { label: '已签收 · 待确认应付', bg: '#E0F2F1', color: '#00695C' },
  settled: { label: '交付完成 · 已结算', bg: '#ECEFF1', color: '#455A64' },
};

/**
 * 采购 · 直发确认（采购直发交付确认）
 * 直发采购单（转派合作商直发 / 以销定采供应商直发）的交付确认：
 * 核对发货数量 → 客户签收 → 确认采购交付 → 按约定节点确认应付（生成应付记录，见财务·应付管理）。
 */
export default function DirectDeliveryConfirm() {
  const orders = useOrderFlowStore((s) => s.orders);
  const docs = usePurchaseStore((s) => s.docs);
  const poStore = usePurchaseStore;
  const [sourceFilter, setSourceFilter] = useState<'' | 'distribute' | 'self'>('');

  const orderById = useMemo(() => new Map(orders.map((o) => [o.id, o])), [orders]);
  const directDocs = useMemo(
    () => docs.filter((d) => d.deliveryMode === 'direct' && orderById.has(d.childOrderId)),
    [docs, orderById],
  );
  const filtered = sourceFilter ? directDocs.filter((d) => d.source === sourceFilter) : directDocs;

  const qtyOf = (d: typeof directDocs[number]) => ({
    purchased: d.items.reduce((s, it) => s + it.quantity, 0),
    shipped: d.items.reduce((s, it) => s + it.shippedQty, 0),
    delivered: d.packages.filter((x) => x.status === 'delivered').reduce((s, p) => s + p.items.reduce((x, i) => x + i.qty, 0), 0),
  });

  return (
    <>
      <ContentHeader title="直发确认" breadcrumbs={['采购', '直发确认']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          采购直发的<strong>交付确认</strong>：货物由供应商/合作商直接交付客户，不进入平台仓库（不产生平台入库单）。
          核对发货数量 → 客户签收 → <strong>确认采购交付</strong> → 按合同约定节点<strong>确认应付</strong>（发货 / 验收 / 签收，接入财务·应付管理）。
          发货登记由合作商终端 / 供应商完成，此处核对与确认。
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
          {([['', '全部直发采购'], ['distribute', '合作商直发（转派）'], ['self', '供应商直发（以销定采）']] as const).map(([k, label]) => (
            <button key={k || 'all'} className={`tab-card-simple${sourceFilter === k ? ' active' : ''}`} onClick={() => setSourceFilter(k as typeof sourceFilter)}>
              {label}
              <span className="tab-card-simple-count">{k === '' ? directDocs.length : directDocs.filter((d) => d.source === k).length}</span>
            </button>
          ))}
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['采购单号', '采购类型', '来源销售订单', '供应商', '商品', '采购数量', '累计发货', '客户签收', '包裹', '采购金额', '确认状态', '操作']}
            rows={filtered.map((d) => {
              const o = orderById.get(d.childOrderId);
              const q = qtyOf(d);
              const st = STATUS_META[d.status] ?? STATUS_META.pending;
              const activePkgs = d.packages.filter((x) => x.status !== 'void');
              const allDelivered = activePkgs.length > 0 && activePkgs.every((x) => x.status === 'delivered');
              return [
                <span key="c" className="cell-mono-emph">{d.code}</span>,
                d.source === 'distribute'
                  ? pill('#E0F2F1', '#00695C', '合作商直发')
                  : pill('#E3F2FD', '#0F64B5', '供应商直发'),
                <span key="so" className="mono" style={{ fontSize: 'var(--text-sm)' }}>{d.childOrderCode}{o?.parentCode && <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>母单 {o.parentCode}</span>}</span>,
                <span key="s" className="cell-emph">{d.supplierName}</span>,
                <span key="i" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{d.items[0].productName}{d.items.length > 1 ? ` 等${d.items.length}种` : ''}</span>,
                <span key="q1" className="mono">{q.purchased}</span>,
                <span key="q2" className="mono" style={{ color: q.shipped > 0 ? '#0277BD' : undefined }}>{q.shipped}</span>,
                <span key="q3" className="mono" style={{ color: q.delivered > 0 ? '#00695C' : undefined }}>{q.delivered}</span>,
                <span key="p" className="mono">{activePkgs.length}</span>,
                <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(d.amount)}</span>,
                pill(st.bg, st.color, st.label),
                <div key="act" className="row-actions" style={{ whiteSpace: 'nowrap' }}>
                  {d.status !== 'settled' && (
                    <Button size="sm" variant="ghost" disabled={activePkgs.length === 0 || allDelivered}
                      onClick={() => poStore.getState().deliverAllByChild(d.childOrderCode)}>
                      确认签收（全部妥投）
                    </Button>
                  )}
                  {allDelivered && d.status !== 'settled' && (
                    <Button size="sm" onClick={() => poStore.getState().settleByChild(d.childOrderCode)}>确认交付·应付</Button>
                  )}
                  {d.status === 'settled' && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>已确认应付</span>}
                </div>,
              ];
            })}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无直发采购单。转派订单自动生成直发 PO；以销定采选择「直发客户」模式生成。
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
