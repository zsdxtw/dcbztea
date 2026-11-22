import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer from '../../components/common/DetailDrawer';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import SalesOrderInfoModal from '../../components/business/SalesOrderInfoModal';
import { SalesOrderDetailTabs } from './SalesOrderDetail';
import { EXTERNAL_CHANNEL_LABELS, platformLabelOf } from '../../data/externalOrders';
import { buildFamilies, familyStatesOf, FAMILY_STATE_COLORS } from '../../utils/salesOrderFamily';
import {
  FULFILLMENT_STAGE_LABELS, FULFILLMENT_STAGE_COLORS,
  stageOfOrder, stageIndexOf,
} from '../../utils/fulfillment';
import type { ExternalOrder, FulfillmentStage } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/** 履约 TAB（对齐合作商工作台：「已发货」= 运输中 + 妥投 合并桶，行内仍显示细档） */
const STAGE_CHAIN: { key: string; label: string }[] = [
  { key: 'pending_accept', label: '待接单' },
  { key: 'accepted', label: '已接单' },
  { key: 'shipping', label: '已发货' },
  { key: 'confirmed', label: '已确收' },
  { key: 'cancelled', label: '已取消' },
];

/** 履约单元：子订单 + 未被拆分的母销售单（有子单的母单由其子单代表） */
export default function SalesFulfillment() {
  const orders = useOrderFlowStore((s) => s.orders);
  const purchaseDocs = usePurchaseStore((s) => s.docs);
  const [tab, setTab] = useState<string>('');
  /** 履约单详情抽屉（右侧拉出，样式同销售单列表详情） */
  const [view, setView] = useState<{ root: string; child?: string } | null>(null);
  const families = useMemo(() => buildFamilies(orders), [orders]);
  const [linkOrderCode, setLinkOrderCode] = useState<string | null>(null);
  /** 待接单取回弹窗 */
  const [recallOf, setRecallOf] = useState<ExternalOrder | null>(null);
  const [recallQty, setRecallQty] = useState<Record<string, string>>({});
  const [recallMsg, setRecallMsg] = useState('');

  const submitRecall = (all: boolean) => {
    if (!recallOf) return;
    const parts = all
      ? undefined
      : Object.entries(recallQty)
        .map(([productName, q]) => ({ productName, quantity: Number(q) || 0 }))
        .filter((p) => p.quantity > 0);
    const res = useOrderFlowStore.getState().recallPendingOrder(recallOf.id, parts);
    if (res.ok) {
      setRecallOf(null);
      setRecallQty({});
      setRecallMsg(res.msg);
      setTimeout(() => setRecallMsg(''), 3600);
    } else {
      setRecallMsg(res.msg);
    }
  };

  const units = useMemo(() => {
    const childCodes = new Set(orders.filter((o) => o.parentCode).map((o) => o.code));
    const rootHasChild = new Set(orders.filter((o) => childCodes.has(o.code) || o.parentCode).map((o) => o.parentCode ?? o.code));
    return orders
      // 履约环节仅含已分发订单（未分发 / 待分发 / 报备待确认 / 比单中仍留在销售单处理 / 履约单分发）
      .filter((o) => !['unprocessed', 'pending', 'report_match_pending', 'comparing'].includes(o.processStatus))
      .filter((o) => !o.parentCode && !rootHasChild.has(o.code) || o.parentCode)
      .map((o) => {
        const stage = stageOfOrder(o);
        const doc = purchaseDocs.find((d) => d.childOrderCode === o.code);
        const pkgs = doc?.packages.filter((p) => p.status !== 'void') ?? [];
        const delivered = pkgs.filter((p) => p.status === 'delivered' || p.status === 'confirmed').length;
        return {
          order: o,
          rootCode: o.parentCode ?? o.code,
          stage,
          stageIdx: stageIndexOf(stage),
          pkgCount: pkgs.length,
          pkgDelivered: delivered,
          lastTracking: pkgs[pkgs.length - 1],
        };
      })
      .sort((a, b) => b.stageIdx - a.stageIdx || b.order.entryTime.localeCompare(a.order.entryTime));
  }, [orders, purchaseDocs]);

  const inTab = (u: { stage: FulfillmentStage }, k: string) =>
    k === 'shipping' ? u.stage === 'shipping' || u.stage === 'transit' : u.stage === k;
  const countOf = (k: string) => (k === '' ? units.length : units.filter((u) => inTab(u, k)).length);
  const filtered = useMemo(() => (tab === '' ? units : units.filter((u) => inTab(u, tab))), [units, tab]);

  return (
    <>
      <ContentHeader title="履约单履约" breadcrumbs={['销售', '销售单管理', '履约单履约']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          按<strong>子履约单 / 未拆分的母销售单</strong>维度跟踪每一张销售单的履约进度（未拆分时母销售单即履约单）：
          待接单 → 已接单 → 运输中 / 妥投 → 已确收，并记录<strong>来单 / 接单 / 发货 / 妥投 / 确收</strong>五个时间节点。
          已拆分的母销售单由其子履约单各自呈现；包裹物流与合作商发货登记实时联动。
        </div>

        {recallMsg && (
          <div style={{ marginBottom: 'var(--space-3)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: '#E8F5E9', color: '#01795D' }}>{recallMsg}</div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          <button className={`tab-card-simple${tab === '' ? ' active' : ''}`} style={{ transition: 'none' }} onClick={() => setTab('')}>
            全部<span className="tab-card-simple-count">{units.length} 单</span>
          </button>
          {STAGE_CHAIN.map((s) => (
            <button key={s.key} className={`tab-card-simple${tab === s.key ? ' active' : ''}`} style={{ transition: 'none' }} onClick={() => setTab(s.key)}>
              {s.label}
              <span className="tab-card-simple-count">{countOf(s.key)} 单</span>
            </button>
          ))}
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['销售单编号', '关联销售单', '销售路径', '客户', '履约主体', '金额', '履约状态', '包裹物流', '操作']}
            rows={filtered.map((u) => {
              const o = u.order;
              const sc = FULFILLMENT_STAGE_COLORS[u.stage];
              const isVia = o.salesPath === 'via_platform';
              return [
                <span key="c" className="cell-mono-emph">
                  {o.code}
                </span>,
                o.parentCode ? (
                  <span
                    key="link"
                    className="mono"
                    style={{ fontSize: 'var(--text-sm)', color: 'var(--color-module-current-base)', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                    title="点击查看母销售单信息"
                    onClick={() => setLinkOrderCode(o.parentCode!)}
                  >
                    {o.parentCode}
                  </span>
                ) : (
                  <span key="link" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>—</span>
                ),
                <span key="sp">{isVia
                  ? <><span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: '#E3F2FD', color: '#0F64B5', whiteSpace: 'nowrap' }}>经平台销售</span><span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: '#0F64B5' }}>{o.platformCustomerName ?? '—'}</span></>
                  : <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: '#E8F5E9', color: '#2E7D32', whiteSpace: 'nowrap' }}>直接销售</span>}</span>,
                <span key="cu" className="cell-emph">{o.customerName}</span>,
                <span key="sub" style={{ fontSize: 'var(--text-sm)' }}>
                  {o.path === 'self' ? '自营' : (o.partnerName ?? '待分发')}
                </span>,
                <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(o.totalAmount)}</span>,
                pill(sc.bg, sc.color, FULFILLMENT_STAGE_LABELS[u.stage]),
                u.pkgCount > 0
                  ? <span key="pkg" style={{ fontSize: 'var(--text-sm)' }}>
                      {u.pkgCount} 包裹 · {u.pkgDelivered} 妥投
                      {u.lastTracking && <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{u.lastTracking.logisticsCompany} {u.lastTracking.trackingNo}</span>}
                    </span>
                  : <span key="pkg" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>—</span>,
                <div key="act" className="row-actions">
                  <Button size="sm" variant="ghost" onClick={() => setView({ root: u.rootCode, child: o.code })}>查看详情</Button>
                  {(o.processStatus === 'self_pending' || o.processStatus === 'distribute_pending') && (
                    <Button size="sm" variant="ghost" onClick={() => { setRecallOf(o); setRecallQty({}); setRecallMsg(''); }}>取回</Button>
                  )}
                </div>,
              ];
            })}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无该阶段履约单。
            </div>
          )}
        </Card>
      </div>
      <SalesOrderInfoModal code={linkOrderCode} onClose={() => setLinkOrderCode(null)} />

      {/* 待接单取回弹窗：整体取回（编号不变）/ 部分取回（取回部分生成新履约单） */}
      {recallOf && (
        <div className="category-dialog-overlay" onClick={() => setRecallOf(null)}>
          <div className="category-dialog" style={{ width: 640 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 4 }}>取回订单 · {recallOf.code}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', lineHeight: 1.7, marginBottom: 'var(--space-4)' }}>
              从 <strong>{recallOf.path === 'self' ? '自营' : (recallOf.partnerName ?? '合作商')}</strong> 取回，取回后进入履约单分发。
              整体取回时履约单编号不变；部分取回时<strong>剩余部分沿用原编号 {recallOf.code}</strong>，取回部分按规则生成新履约单。
              留空或 0 表示不取回该商品。
            </div>
            <table className="detail-inline-table">
              <thead><tr><th>商品名称</th><th>规格</th><th>订单数量</th><th>取回数量</th></tr></thead>
              <tbody>
                {recallOf.items.map((it) => (
                  <tr key={it.productName}>
                    <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                    <td>{it.spec}</td>
                    <td className="mono">{it.quantity}</td>
                    <td>
                      <input
                        className="filter-input mono"
                        type="number"
                        min={0}
                        max={it.quantity}
                        placeholder="0"
                        value={recallQty[it.productName] ?? ''}
                        onChange={(e) => setRecallQty((prev) => ({ ...prev, [it.productName]: e.target.value }))}
                        style={{ width: 96, height: 30 }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recallMsg && (
              <div style={{ marginTop: 'var(--space-3)', padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: '#FFF3E0', color: '#B26A00' }}>{recallMsg}</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
              <Button variant="ghost" onClick={() => setRecallOf(null)}>关闭</Button>
              <Button variant="ghost" onClick={() => submitRecall(true)}>整体取回</Button>
              <Button onClick={() => submitRecall(false)}>确认部分取回</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 履约单详情抽屉（右侧拉出，展示样式与销售单列表详情一致） ── */}
      <DetailDrawer
        open={!!view}
        onClose={() => setView(null)}
        badge="SO"
        title={view?.root ?? ''}
        statusTag={(() => {
          const fam = families.find((f) => f.rootCode === view?.root);
          if (!fam) return null;
          const st = familyStatesOf(fam);
          const fp = (t: string) => {
            const c = (FAMILY_STATE_COLORS as Record<string, { bg: string; color: string }>)[t] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
            return pill(c.bg, c.color, t);
          };
          return <>{fp(st.distribute)}{fp(st.fulfill)}{fp(st.settle)}{fp(st.invoice)}</>;
        })()}
        subtitle={(() => {
          const m = families.find((f) => f.rootCode === view?.root)?.mother;
          return m ? `${platformLabelOf(m)} · ${m.customerName}（${m.customerType}） · ${m.receiver} ${m.receiverPhone}` : '';
        })()}
        footer={
          <Button variant="ghost" onClick={() => setView(null)}>关闭</Button>
        }
      >
        {(() => {
          const fam = families.find((f) => f.rootCode === view?.root);
          if (!fam) return null;
          return <SalesOrderDetailTabs family={fam} poDocs={purchaseDocs} initialTab={view?.child ?? 'info'} />;
        })()}
      </DetailDrawer>
    </>
  );
}
