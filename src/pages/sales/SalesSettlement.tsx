import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer from '../../components/common/DetailDrawer';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { SalesOrderDetailTabs } from './SalesOrderDetail';
import { platformLabelOf } from '../../data/externalOrders';
import {
  buildFamilies, familyStatesOf, fulfillmentUnitsOf, fulfillStateOf, orderProgressOf,
  receiveStateOf, invoiceStateOf, settleStateOf, FAMILY_STATE_COLORS,
} from '../../utils/salesOrderFamily';
import type { ExternalOrder } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (text: string) => {
  const c = (FAMILY_STATE_COLORS as Record<string, { bg: string; color: string }>)[text] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{text}</span>
  );
};

/** 结算 TAB：待结算（已确收未发起）/ 结算中 / 已办结 */
type SettleTab = 'pending' | 'settling' | 'closed' | 'all';

export default function SalesSettlement() {
  const orders = useOrderFlowStore((s) => s.orders);
  const poDocs = usePurchaseStore((s) => s.docs);
  const [tab, setTab] = useState<SettleTab>('pending');
  const [msg, setMsg] = useState('');
  const [view, setView] = useState<{ root: string; child?: string } | null>(null);

  const families = useMemo(() => buildFamilies(orders), [orders]);

  /** 履约单单元（携带母单编号，便于查看详情） */
  const units = useMemo(() => families.flatMap((f) =>
    fulfillmentUnitsOf(f).map((u) => {
      const pos = poDocs.filter((d) => d.childOrderId === u.underlying.id);
      return {
        unit: u,
        rootCode: f.rootCode,
        order: u.underlying,
        fulfill: fulfillStateOf(u.underlying),
        progress: orderProgressOf(u.underlying, pos),
        received: receiveStateOf(u.underlying, pos),
        invoice: invoiceStateOf(u.underlying),
        settle: settleStateOf(u.underlying, pos),
        pos,
      };
    }),
  // 结算页仅含已确收及之后的履约单（已取消 / 未确收不进结算）
  ).filter((x) => x.order.processStatus !== 'cancelled' && x.fulfill === '已确收'), [families, poDocs]);

  const pendingUnits = units.filter((x) => x.progress !== '结算中' && x.progress !== '已办结');
  const settlingUnits = units.filter((x) => x.progress === '结算中');
  const closedUnits = units.filter((x) => x.progress === '已办结');

  const shown = tab === 'pending' ? pendingUnits : tab === 'settling' ? settlingUnits : tab === 'closed' ? closedUnits : units;

  const flash = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3600);
  };

  const startSettlement = (o: ExternalOrder) => {
    const res = useOrderFlowStore.getState().startSettlement(o.id);
    flash(res.msg);
  };
  const registerReceipt = (o: ExternalOrder) => {
    if (!window.confirm(`确认已收到该履约单款项？\n${o.code} · ${money(o.totalAmount)}`)) return;
    const res = useOrderFlowStore.getState().settleOrder(o.id, { onTime: true });
    flash(res.msg);
  };
  const registerInvoice = (o: ExternalOrder) => {
    const res = useOrderFlowStore.getState().registerInvoice(o.id, 'full');
    flash(res.msg);
  };
  const closeManually = (o: ExternalOrder) => {
    if (!window.confirm(`已收款但未开票，确认将该履约单手工办结？\n${o.code}`)) return;
    const res = useOrderFlowStore.getState().closeOrder(o.id);
    flash(res.msg);
  };

  const tabBtn = (key: SettleTab, label: string, count: number) => (
    <button key={key} className={`tab-card-simple${tab === key ? ' active' : ''}`} style={{ transition: 'none' }} onClick={() => setTab(key)}>
      {label}
      <span className="tab-card-simple-count">{count} 单</span>
    </button>
  );

  return (
    <>
      <ContentHeader title="履约单结算" breadcrumbs={['销售', '销售单管理', '履约单结算']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          对<strong>已确收</strong>的履约单发起<strong>对账结算</strong>（订单进度＝结算中），随后分别登记
          <strong>收款</strong>（未收款 / 已收款）与<strong>开票</strong>（未开票 / 已开票）两个独立维度：
          两者均完成 → 订单进度自动<strong>已办结</strong>；已完成收款但未开票的，可<strong>手工办结</strong>。
        </div>

        {msg && (
          <div style={{ marginBottom: 'var(--space-3)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: '#E8F5E9', color: '#01795D' }}>{msg}</div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          {tabBtn('pending', '待结算', pendingUnits.length)}
          {tabBtn('settling', '结算中', settlingUnits.length)}
          {tabBtn('closed', '已办结', closedUnits.length)}
          {tabBtn('all', '全部已确收', units.length)}
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['履约单号', '关联销售单', '客户', '履约主体', '金额', '履约状态', '收款状态', '开票状态', '结算状态', '订单进度', '操作']}
            rows={shown.map((x) => {
              const o = x.order;
              return [
                <span key="c" className="cell-mono-emph">{o.code}</span>,
                o.parentCode
                  ? <span key="p" className="mono" style={{ fontSize: 'var(--text-sm)' }}>{o.parentCode}</span>
                  : <span key="p" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>—</span>,
                <span key="cu" className="cell-emph">{o.customerName}</span>,
                <span key="sub" style={{ fontSize: 'var(--text-sm)' }}>{o.path === 'self' ? '淡茶半盏（自营）' : (o.partnerName ?? '—')}</span>,
                <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(o.totalAmount)}</span>,
                pill(x.fulfill),
                pill(x.received),
                pill(x.invoice),
                pill(x.settle),
                pill(x.progress),
                <div key="act" className="row-actions">
                  {(x.progress === '履约中') && <Button size="sm" variant="ghost" onClick={() => startSettlement(o)}>发起对账结算</Button>}
                  {x.progress !== '已办结' && x.received === '未收款' && <Button size="sm" variant="ghost" onClick={() => registerReceipt(o)}>登记收款</Button>}
                  {x.progress !== '已办结' && x.invoice === '未开票' && <Button size="sm" variant="ghost" onClick={() => registerInvoice(o)}>登记开票</Button>}
                  {x.progress !== '已办结' && x.received === '已收款' && x.invoice === '未开票' && <Button size="sm" variant="ghost" onClick={() => closeManually(o)}>手工办结</Button>}
                  <Button size="sm" variant="ghost" onClick={() => setView({ root: x.rootCode, child: o.code })}>查看</Button>
                </div>,
              ];
            })}
          />
          {shown.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              当前分类下暂无履约单（仅已确收履约单进入结算）。
            </div>
          )}
        </Card>
      </div>

      {/* 履约单详情抽屉（销售单信息 / 各履约单 Tab） */}
      <DetailDrawer
        open={!!view}
        onClose={() => setView(null)}
        badge="SO"
        title={view?.root ?? ''}
        statusTag={(() => {
          const fam = families.find((f) => f.rootCode === view?.root);
          if (!fam) return null;
          const st = familyStatesOf(fam);
          return <>{pill(st.orderStatus)}{pill(st.distribute)}{pill(st.fulfill)}{pill(st.settle)}</>;
        })()}
        subtitle={(() => {
          const m = families.find((f) => f.rootCode === view?.root)?.mother;
          return m ? `${platformLabelOf(m)} · ${m.customerName}（${m.customerType}）` : '';
        })()}
        mode="view"
      >
        {(() => {
          const fam = families.find((f) => f.rootCode === view?.root);
          if (!fam) return null;
          return <SalesOrderDetailTabs family={fam} poDocs={poDocs} initialTab={view?.child ?? 'info'} showStates={false} />;
        })()}
      </DetailDrawer>
    </>
  );
}
