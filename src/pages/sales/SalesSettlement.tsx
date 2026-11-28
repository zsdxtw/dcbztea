/**
 * 销售 · 履约单结算（履约单维度结算进度视图）
 * 列字段与「履约单履约」保持一致（不含履约状态 / 包裹物流），履约状态相关列替换为：
 * 所属销售结算单、收款状态、开票状态。
 * 展示已纳入销售结算单的履约单（自「履约单分发 / 履约单履约」抽离进入本页）；
 * 新建销售结算单在「销售 → 销售结算」页（生成销售结算单弹窗）。
 */
import { useEffect, useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer from '../../components/common/DetailDrawer';
import { useNavigate } from 'react-router-dom';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { usePriceStore } from '../../stores/priceStore';
import { useSettlementStore, statementOfOrder } from '../../stores/settlementStore';
import SalesOrderInfoModal from '../../components/business/SalesOrderInfoModal';
import { SalesOrderDetailTabs } from './SalesOrderDetail';
import { CUSTOMER_COL_WIDTH, PARTNER_COL_WIDTH } from './SalesOrders';
import { EXTERNAL_PLATFORM_LABELS, EXTERNAL_CHANNEL_LABELS, SOURCE_TAG_LABELS, platformLabelOf } from '../../data/externalOrders';
import { regionTextOf } from '../../data/regions';
import { buildFamilies, familyStatesOf, fulfillStateOf, orderProgressOf, receiveStateOf, invoiceStateOf, FAMILY_STATE_COLORS } from '../../utils/salesOrderFamily';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

const statePill = (text: string) => {
  const c = (FAMILY_STATE_COLORS as Record<string, { bg: string; color: string }>)[text] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
  return pill(c.bg, c.color, text);
};

/** 销售履约单号：子履约单取自身编号；未拆分的销售单本身即履约单，按规则展示为 LY01（与履约单履约列表同口径） */
const fulfillmentCodeOf = (o: { code: string; parentCode?: string }): string => (o.parentCode ? o.code : `${o.code}LY01`);
/** 销售单号：子履约单指向母销售单；未拆分时为自身 */
const salesOrderCodeOf = (o: { code: string; parentCode?: string }): string => o.parentCode ?? o.code;

/** 销售结算单阶段（对账中 / 结算中 / 已办结 / 有异议） */
function statementStage(s: { status: string } | undefined): string {
  if (!s) return '—';
  if (s.status === 'closed') return '已办结';
  if (s.status === 'disputed') return '有异议';
  if (s.status === 'confirmed') return '结算中';
  return '对账中';
}

export default function SalesSettlement() {
  const navigate = useNavigate();
  const orders = useOrderFlowStore((s) => s.orders);
  const poDocs = usePurchaseStore((s) => s.docs);
  const products = usePriceStore((s) => s.products);
  const statements = useSettlementStore((s) => s.salesStatements);
  const purchaseDocs = usePurchaseStore((s) => s.docs);
  const families = useMemo(() => buildFamilies(orders), [orders]);
  const [keyword, setKeyword] = useState('');
  /** 履约单详情抽屉（右侧拉出，样式同销售单列表详情） */
  const [view, setView] = useState<{ root: string; child?: string } | null>(null);
  const [linkOrderCode, setLinkOrderCode] = useState<string | null>(null);

  /** 品牌/数量：本单商品去重品牌数 + 商品总数量（与履约单履约列表同口径） */
  const brandQtyOf = (o: { items: { productId: string; productName: string; quantity: number }[] }) => {
    const brands = new Set(o.items.map((it) => products.find((p) => p.id === it.productId)?.brand
      ?? products.find((p) => p.name === it.productName)?.brand ?? '其他'));
    const qty = o.items.reduce((s, it) => s + it.quantity, 0);
    return `${brands.size}种/${qty}份`;
  };

  /** 履约单元：子履约单 + 未被拆分的母销售单（已分发、未取消），仅展示已纳入销售结算单的（自分发/履约列表抽离进入本页） */
  const units = useMemo(() => {
    const childCodes = new Set(orders.filter((o) => o.parentCode).map((o) => o.code));
    const rootHasChild = new Set(orders.filter((o) => childCodes.has(o.code) || o.parentCode).map((o) => o.parentCode ?? o.code));
    return orders
      .filter((o) => !['unprocessed', 'pending', 'comparing', 'cancelled'].includes(o.processStatus))
      .filter((o) => !o.parentCode && !rootHasChild.has(o.code) || o.parentCode)
      .filter((o) => !!statementOfOrder(statements, o.id))
      .map((o) => {
        const pos = poDocs.filter((d) => d.childOrderId === o.id);
        const stmt = statementOfOrder(statements, o.id);
        return {
          order: o,
          rootCode: o.parentCode ?? o.code,
          stmt,
          stage: statementStage(stmt),
          received: receiveStateOf(o, pos),
          invoiced: invoiceStateOf(o),
          progress: orderProgressOf(o, pos),
          fulfill: fulfillStateOf(o),
        };
      })
      .sort((a, b) => b.order.entryTime.localeCompare(a.order.entryTime));
  }, [orders, statements, poDocs]);

  const filtered = useMemo(() => {
    const kw = keyword.trim();
    if (!kw) return units;
    return units.filter((u) => u.order.code.includes(kw) || u.order.customerName.includes(kw) || (u.stmt?.code ?? '').includes(kw));
  }, [units, keyword]);

  useEffect(() => {
    if (keyword) return;
  }, [keyword]);

  const colMinWidths = { 销售履约单号: 168, 销售单号: 133, 客户: CUSTOMER_COL_WIDTH, 履约主体: PARTNER_COL_WIDTH, 所属销售结算单: 150, 收款状态: 90, 开票状态: 90, 订单进度: 90 };

  return (
    <>
      <ContentHeader title="履约单结算" breadcrumbs={['销售', '销售管理', '履约单结算']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          展示<strong>已纳入销售结算单</strong>的履约单（自「履约单分发 / 履约单履约」抽离进入本页）：所属<strong>销售结算单</strong>（对账中 / 结算中 / 已办结）与
          <strong>收款、开票状态</strong>。新建销售结算单请在「销售 → 销售结算」页点击「生成销售结算单」。
        </div>

        <div style={{ marginBottom: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="filter-input" placeholder="搜索履约单号、客户、结算单号..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 300 }} />
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
            共 {units.length} 张履约单已进入结算阶段
          </span>
          <Button variant="ghost" onClick={() => navigate('/sales/sales-settlement-confirm')}>去销售结算 →</Button>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            colMinWidths={colMinWidths}
            headers={['序号', '销售履约单号', '销售单号', '订单来源', '销售路径', '客户', '履约主体', '收件人 / 地区', '品牌/数量', '金额', '订单进度', '所属销售结算单', '收款状态', '开票状态', '录入时间', '操作']}
            rows={filtered.map((u, idx) => {
              const o = u.order;
              return [
                <span key="no" className="mono cell-muted">{idx + 1}</span>,
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
                <span key="stmt" className="mono" style={{ fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
                  {u.stmt ? `${u.stmt.code}（${u.stage}）` : '—'}
                </span>,
                <span key="rc" style={{ whiteSpace: 'nowrap' }}>{statePill(u.received)}</span>,
                <span key="iv" style={{ whiteSpace: 'nowrap' }}>{statePill(u.invoiced)}</span>,
                <span key="t" className="cell-muted" style={{ whiteSpace: 'nowrap' }}>{o.entryTime.slice(0, 10)}</span>,
                <div key="act" className="row-actions" style={{ whiteSpace: 'nowrap' }}>
                  <Button size="sm" variant="ghost" onClick={() => setView({ root: u.rootCode, child: o.code })}>查看</Button>
                </div>,
              ];
            })}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无已纳入销售结算单的履约单（生成销售结算单后展示）。
            </div>
          )}
        </Card>
      </div>
      <SalesOrderInfoModal code={linkOrderCode} onClose={() => setLinkOrderCode(null)} />

      {/* 履约单详情抽屉（右侧拉出，展示样式与销售单列表详情一致） */}
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
        footer={<Button variant="ghost" onClick={() => setView(null)}>关闭</Button>}
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
