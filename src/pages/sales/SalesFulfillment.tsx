import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import DetailDrawer from '../../components/common/DetailDrawer';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { usePriceStore } from '../../stores/priceStore';
import SalesOrderInfoModal from '../../components/business/SalesOrderInfoModal';
import { useSettlementStore, statementOfOrder } from '../../stores/settlementStore';
import { SalesOrderDetailTabs } from './SalesOrderDetail';
import { CUSTOMER_COL_WIDTH, PARTNER_COL_WIDTH } from './SalesOrders';
import TakebackDialog from '../../components/business/TakebackDialog';
import { EXTERNAL_PLATFORM_LABELS, EXTERNAL_CHANNEL_LABELS, SOURCE_TAG_LABELS, platformLabelOf } from '../../data/externalOrders';
import { regionTextOf } from '../../data/regions';
import { buildFamilies, familyStatesOf, fulfillStateOf, orderProgressOf, FAMILY_STATE_COLORS } from '../../utils/salesOrderFamily';
import type { ExternalOrder } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

/** 列内容最小宽度：客户列、履约主体列同销售单列表 */
const COL_MIN_WIDTHS = { 客户: CUSTOMER_COL_WIDTH, 履约主体: PARTNER_COL_WIDTH };

/** 辅色实心小按钮（同履约单分发列表的「取回」）：列表操作列的 取回 / 确认收货 */
const SECONDARY_BTN: CSSProperties = { background: 'var(--color-module-current-secondary)', borderColor: 'var(--color-module-current-secondary)', color: '#fff' };

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

const statePill = (text: string) => {
  const c = (FAMILY_STATE_COLORS as Record<string, { bg: string; color: string }>)[text] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
  return pill(c.bg, c.color, text);
};

/** 销售履约单号：子履约单取自身编号；未拆分的销售单本身即履约单，按规则展示为 LY01（与履约单分发列表同口径） */
const fulfillmentCodeOf = (o: ExternalOrder): string => (o.parentCode ? o.code : `${o.code}LY01`);
/** 销售单号（履约单上层订单编号）：子履约单指向母销售单；未拆分时为自身 */
const salesOrderCodeOf = (o: ExternalOrder): string => o.parentCode ?? o.code;

/** 履约状态 5 态 TAB（已取消归入订单进度，不单列 TAB） */
const FULFILL_CHAIN = ['待接单', '已接单', '运输中', '已妥投', '已确收'] as const;
const FULFILL_ORDER: Record<string, number> = { '—': 0, '待接单': 1, '已接单': 2, '运输中': 3, '已妥投': 4, '已确收': 5 };

/** 履约单元：子订单 + 未被拆分的母销售单（有子单的母单由其子单代表） */
export default function SalesFulfillment() {
  const orders = useOrderFlowStore((s) => s.orders);
  const purchaseDocs = usePurchaseStore((s) => s.docs);
  const products = usePriceStore((s) => s.products);
  const [tab, setTab] = useState<string>('');
  /** 列表分页：每页条数（10/20/50，右下角下拉）与当前页 */
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  /** 履约单详情抽屉（右侧拉出，样式同销售单列表详情） */
  const [view, setView] = useState<{ root: string; child?: string } | null>(null);
  const salesStatements = useSettlementStore((s) => s.salesStatements);
  const families = useMemo(() => buildFamilies(orders), [orders]);
  const [linkOrderCode, setLinkOrderCode] = useState<string | null>(null);
  /** 待接单取回弹窗 */
  const [recallOf, setRecallOf] = useState<ExternalOrder | null>(null);
  /** 操作结果提示（取回 / 确认收货） */
  const [actionMsg, setActionMsg] = useState('');
  /** 确认收货弹窗（已妥投履约单，人工确认后 → 已确收） */
  const [confirming, setConfirming] = useState<ExternalOrder | null>(null);

  /** 品牌/数量：本单商品去重品牌数 + 商品总数量（与履约单分发列表同口径） */
  const brandQtyOf = (o: ExternalOrder) => {
    const brands = new Set(o.items.map((it) => products.find((p) => p.id === it.productId)?.brand
      ?? products.find((p) => p.name === it.productName)?.brand ?? '其他'));
    const qty = o.items.reduce((s, it) => s + it.quantity, 0);
    return `${brands.size}种/${qty}份`;
  };

  const units = useMemo(() => {
    const childCodes = new Set(orders.filter((o) => o.parentCode).map((o) => o.code));
    const rootHasChild = new Set(orders.filter((o) => childCodes.has(o.code) || o.parentCode).map((o) => o.parentCode ?? o.code));
    return orders
      // 履约环节仅含已分发且未取消的订单（未分发 / 待分发 / 比单中留在销售单处理 / 履约单分发；已取消仅在销售单列表查看）
      .filter((o) => !['unprocessed', 'pending', 'comparing', 'cancelled'].includes(o.processStatus))
      // 已纳入销售结算单的履约单抽离到「履约单结算」阶段，不在履约列表展示
      .filter((o) => !statementOfOrder(salesStatements, o.id))
      .filter((o) => !o.parentCode && !rootHasChild.has(o.code) || o.parentCode)
      .map((o) => {
        const fulfill = fulfillStateOf(o);
        const progress = orderProgressOf(o);
        const doc = purchaseDocs.find((d) => d.childOrderCode === o.code);
        const pkgs = doc?.packages.filter((p) => p.status !== 'void') ?? [];
        const delivered = pkgs.filter((p) => p.status === 'delivered' || p.status === 'confirmed').length;
        return {
          order: o,
          rootCode: o.parentCode ?? o.code,
          fulfill,
          progress,
          fulfillIdx: FULFILL_ORDER[fulfill] ?? 0,
          pkgCount: pkgs.length,
          pkgDelivered: delivered,
          lastTracking: pkgs[pkgs.length - 1],
        };
      })
      .sort((a, b) => b.fulfillIdx - a.fulfillIdx || b.order.entryTime.localeCompare(a.order.entryTime));
  }, [orders, purchaseDocs]);

  const inTab = (u: { fulfill: string }, k: string) => u.fulfill === k;
  const countOf = (k: string) => (k === '' ? units.length : units.filter((u) => inTab(u, k)).length);
  const filtered = useMemo(() => (tab === '' ? units : units.filter((u) => inTab(u, tab))), [units, tab]);

  /** 列表分页：切换履约状态 / 页大小变化回第 1 页（越界收敛由 Pagination 组件处理） */
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [tab, pageSize]);

  return (
    <>
      <ContentHeader title="履约单履约" breadcrumbs={['销售', '销售单管理', '履约单履约']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          按<strong>子履约单 / 未拆分的母销售单</strong>维度跟踪每一张销售单的履约进度（未拆分时母销售单即履约单）：
          待接单 → 已接单 → 运输中 / 妥投 → 已确收，并记录<strong>来单 / 接单 / 发货 / 妥投 / 确收</strong>五个时间节点。
          已拆分的母销售单由其子履约单各自呈现；包裹物流与合作商发货登记实时联动。
        </div>

        {actionMsg && (
          <div style={{ marginBottom: 'var(--space-3)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: '#E8F5E9', color: '#01795D' }}>{actionMsg}</div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          <button className={`tab-card-simple${tab === '' ? ' active' : ''}`} style={{ transition: 'none' }} onClick={() => setTab('')}>
            全部<span className="tab-card-simple-count">{units.length} 单</span>
          </button>
          {FULFILL_CHAIN.map((s) => (
            <button key={s} className={`tab-card-simple${tab === s ? ' active' : ''}`} style={{ transition: 'none' }} onClick={() => setTab(s)}>
              {s}
              <span className="tab-card-simple-count">{countOf(s)} 单</span>
            </button>
          ))}
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            colMinWidths={COL_MIN_WIDTHS}
            headers={['序号', '销售履约单号', '销售单号', '订单来源', '销售路径', '客户', '履约主体', '收件人 / 地区', '品牌/数量', '金额', '订单进度', '履约状态', '包裹物流', '录入时间', '操作']}
            rows={paged.map((u, idx) => {
              const o = u.order;
              return [
                <span key="no" className="mono cell-muted">{(page - 1) * pageSize + idx + 1}</span>,
                <span key="c" className="cell-mono-emph" style={{ whiteSpace: 'nowrap' }}>{fulfillmentCodeOf(o)}<span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{o.externalOrderNo ?? '—'}</span></span>,
                <span
                  key="link"
                  className="mono"
                  style={{ fontSize: 'var(--text-sm)', color: 'var(--color-module-current-base)', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', whiteSpace: 'nowrap' }}
                  title="点击查看销售单订单信息"
                  onClick={() => setLinkOrderCode(salesOrderCodeOf(o))}
                >
                  {salesOrderCodeOf(o)}
                </span>,
                <span key="src">
                  {o.salesPath === 'via_platform'
                    ? (o.platformCustomerName ?? (o.platform ? EXTERNAL_PLATFORM_LABELS[o.platform] : '经平台销售'))
                    : '淡茶半盏'}
                  <span style={{ display: 'block' }}>{pill(
                    o.sourceChannel === 'push' ? '#F3E5F5' : '#E3F2FD',
                    o.sourceChannel === 'push' ? '#7B1FA2' : '#0F64B5',
                    EXTERNAL_CHANNEL_LABELS[o.sourceChannel],
                  )}</span>
                  {o.sourceTag && (
                    <span style={{ display: 'block', marginTop: 2 }}>{pill(
                      SOURCE_TAG_LABELS[o.sourceTag].bg,
                      SOURCE_TAG_LABELS[o.sourceTag].color,
                      SOURCE_TAG_LABELS[o.sourceTag].label,
                    )}</span>
                  )}
                </span>,
                <span key="sp">
                  {o.salesPath === 'via_platform'
                    ? pill('#E3F2FD', '#0F64B5', '经平台销售')
                    : pill('#E8F5E9', '#2E7D32', '直接销售')}
                </span>,
                <span key="cu" className="cell-emph">{o.customerName}</span>,
                <span key="pt" style={{ fontSize: 'var(--text-sm)' }}>{o.partnerName ?? (o.path === 'self' ? '淡茶半盏（自营）' : '—')}</span>,
                <span key="rcv" style={{ minWidth: 0 }}>
                  <span className="cell-emph" style={{ fontSize: 'var(--text-sm)', display: 'block' }}>{o.receiver}</span>
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', whiteSpace: 'nowrap' }}>{regionTextOf(o.customerRegion, o.receiverAddress)}</span>
                </span>,
                <span key="bq" className="mono" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{brandQtyOf(o)}</span>,
                <span key="a" className="mono" style={{ fontWeight: 'var(--font-semibold)' }}>{money(o.totalAmount)}</span>,
                <span key="pg" style={{ whiteSpace: 'nowrap' }}>{statePill(u.progress)}</span>,
                <span key="fs" style={{ whiteSpace: 'nowrap' }}>{statePill(u.fulfill)}</span>,
                u.pkgCount > 0
                  ? <span key="pkg" style={{ fontSize: 'var(--text-sm)' }}>
                      {u.pkgCount} 包裹 · {u.pkgDelivered} 妥投
                      {u.lastTracking && <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{u.lastTracking.logisticsCompany} {u.lastTracking.trackingNo}</span>}
                    </span>
                  : <span key="pkg" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>—</span>,
                <span key="t" className="cell-muted" style={{ whiteSpace: 'nowrap' }}>{o.entryTime.slice(0, 10)}</span>,
                <div key="act" className="row-actions" style={{ whiteSpace: 'nowrap' }}>
                  <Button size="sm" variant="ghost" onClick={() => setView({ root: u.rootCode, child: o.code })}>查看</Button>
                  {(o.processStatus === 'self_pending' || o.processStatus === 'distribute_pending') && (
                    <Button size="sm" style={SECONDARY_BTN} onClick={() => { setRecallOf(o); setActionMsg(''); }}>取回</Button>
                  )}
                  {u.fulfill === '已妥投' && (
                    <Button size="sm" style={SECONDARY_BTN} onClick={() => setConfirming(o)}>确认收货</Button>
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

        {/* 列表分页（公共组件：下方页码数字 + 右下角每页条数下拉） */}
        <Pagination total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} label="单" />
      </div>
      <SalesOrderInfoModal code={linkOrderCode} onClose={() => setLinkOrderCode(null)} />

      {/* 待接单取回弹窗（整体 / 部分两段式） */}
      <TakebackDialog
        order={recallOf}
        onClose={() => setRecallOf(null)}
        onDone={(m) => { setActionMsg(m); setTimeout(() => setActionMsg(''), 3600); }}
      />

      {/* 确认收货弹窗（已妥投履约单：人工确认后履约状态 → 已确收） */}
      {confirming && (
        <div className="category-dialog-overlay" onClick={() => setConfirming(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 440 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>确认收货</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              确认履约单 <strong className="mono">{confirming.code}</strong>（{confirming.customerName} · {money(confirming.totalAmount)}）已签收？确认后履约状态变为<strong>已确收</strong>。
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setConfirming(null)}>关闭</Button>
              <Button onClick={() => { const res = useOrderFlowStore.getState().confirmReceipt(confirming.id); setConfirming(null); setActionMsg(res.msg); setTimeout(() => setActionMsg(''), 3600); }}>确认收货</Button>
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
          return <>{statePill(st.orderStatus)}{statePill(st.distribute)}{statePill(st.fulfill)}{statePill(st.settle)}</>;
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
