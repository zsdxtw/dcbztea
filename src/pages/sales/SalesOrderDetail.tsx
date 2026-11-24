import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { usePriceStore, effectiveCustomerQuote } from '../../stores/priceStore';
import { calcPlatformNetPrice } from '../../data/prices';
import { customerItems, orderPlatformRate } from '../../data/customers';
import { regionTextOf } from '../../data/regions';
import { EXTERNAL_CHANNEL_LABELS, EXTERNAL_PLATFORM_LABELS, TRANSFER_SOURCE_LABELS } from '../../data/externalOrders';
import {
  buildFamilies, familyStatesOf, distributeStateOf, fulfillStateOf, settleStateOf, receiveStateOf, invoiceStateOf, orderProgressOf, FAMILY_STATE_COLORS, fulfillmentUnitsOf,
  type OrderFamily,
} from '../../utils/salesOrderFamily';
import { fulfillmentTimes } from '../../utils/fulfillment';
import type { ExternalOrder, PurchaseDoc } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;
/** 详情页时间展示：日期+时分秒（演示数据无时分秒时补齐演示值） */
const fmtDateTime = (v?: string) => (!v ? '—' : v.length > 10 ? v : `${v} 09:12:00`);

const pill = (text: string) => {
  const c = (FAMILY_STATE_COLORS as Record<string, { bg: string; color: string }>)[text] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{text}</span>
  );
};

/** 路径标签（与销售单分发页口径一致） */
function pathLabel(o: ExternalOrder): string {
  if (o.path === 'self') return '自营';
  if (o.transferSource) return TRANSFER_SOURCE_LABELS[o.transferSource];
  if (o.distributeMode === 'compare') return '转派-比单';
  return '—';
}

/** 信息项 */
/** 商品明细表（字段参照新建销售单：序号/图片/名称/品牌/规格/市场价+京东天猫价/销售报价/数量/销售实价/小计；经平台订单多一列销平台实价——扣点取订单下单快照） */
export function ProductItemsTable({ items, customerName, salesPath, platformCustomerId, platform, platformRateSnapshot, footerAmount }: {
  items: ExternalOrder['items'];
  customerName: string;
  salesPath?: ExternalOrder['salesPath'];
  platformCustomerId?: string;
  platform?: ExternalOrder['platform'];
  /** 订单平台扣点快照%（下单时点固化；缺省回退客户档案现值——旧数据兜底） */
  platformRateSnapshot?: number;
  footerAmount?: number;
}) {
  const products = usePriceStore((s) => s.products);
  const customerQuotes = usePriceStore((s) => s.customerQuotes);
  const isVia = salesPath === 'via_platform';
  const customer = customerItems.find((c) => c.name === customerName);
  const rate = isVia ? orderPlatformRate({ salesPath, platformCustomerId, customerName, platformRateSnapshot }) : undefined;
  return (
    <table className="detail-inline-table">
      <thead><tr>
        <th style={{ width: 44 }}>序号</th>
        <th style={{ width: 60 }}>图片</th>
        <th>商品名称</th>
        <th style={{ width: 90 }}>品牌</th>
        <th style={{ width: 110 }}>规格</th>
        <th style={{ width: 130 }}>市场价</th>
        <th style={{ width: 100 }}>销售报价</th>
        <th style={{ width: 80 }}>数量</th>
        <th style={{ width: 100 }}>销售实价</th>
        {isVia && <th style={{ width: 110 }}>销平台实价</th>}
        <th style={{ width: 100, textAlign: 'right' }}>小计</th>
      </tr></thead>
      <tbody>
        {items.map((it, i) => {
          /* 价格档案优先按 productId 匹配；演示种子使用旧编号时按商品名称兜底 */
          const p = products.find((x) => x.id === it.productId) ?? products.find((x) => x.name === it.productName);
          const img = p?.mainImages?.[0];
          const quote = customer && customer.type !== 'personal'
            ? effectiveCustomerQuote(customerQuotes, customer.id, p ? p.id : it.productId, products)
            : undefined;
          const net = rate !== undefined ? calcPlatformNetPrice(it.price, `${rate}%`) : undefined;
          return (
            <tr key={i}>
              <td className="mono" style={{ color: 'var(--color-neutral-400)' }}>{i + 1}</td>
              <td>{img
                ? <img src={img} alt={it.productName} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-100)' }} />
                : <span style={{ display: 'inline-flex', width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--color-neutral-100)', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--color-neutral-400)' }}>无图</span>}
              </td>
              <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
              <td>{p?.brand ?? '—'}</td>
              <td style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>{it.spec}</td>
              <td>
                <div className="mono" style={{ fontSize: 'var(--text-sm)' }}>{p ? money(p.marketPrice) : '—'}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>京东价：{p?.jdPrice ?? '—'} / 天猫价：{p?.tmallPrice ?? '—'}</div>
              </td>
              <td>{quote !== undefined
                ? <span className="mono" style={{ color: 'var(--color-module-current-base)', fontWeight: 'var(--font-semibold)' }}>{money(quote)}</span>
                : <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>—</span>}
              </td>
              <td className="mono">{it.quantity}</td>
              <td className="mono">{money(it.price)}</td>
              {isVia && <td className="mono">{net !== undefined ? money(net) : '—'}</td>}
              <td className="mono" style={{ textAlign: 'right', fontWeight: 'var(--font-medium)' }}>{money(it.price * it.quantity)}</td>
            </tr>
          );
        })}
      </tbody>
      {footerAmount !== undefined && (
        <tfoot><tr style={{ fontWeight: 'var(--font-semibold)' }}>
          <td colSpan={isVia ? 10 : 9} style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>合计</td>
          <td className="mono" style={{ textAlign: 'right', color: 'var(--color-module-current-base)' }}>{money(footerAmount)}</td>
        </tr></tfoot>
      )}
    </table>
  );
}

/* ──────────────────────────────────────────────
 * 共享区块：销售单详情页与销售单列表「查看」抽屉共用
 * ────────────────────────────────────────────── */

/** 母销售单信息内容（「销售单信息」Tab 内分 订单信息 / 收货信息 / 商品信息 三段，参照分发详情页 DrawerSection 样式） */
export function MotherOrderInfoSection({ family }: { family: OrderFamily }) {
  const mother = family.mother;
  const children = family.children;
  const amount = (children.length > 0 ? children : family.all).reduce((s, o) => s + o.totalAmount, 0);
  /* 商品信息：按商品规格聚合（拆单家族合并全部子履约单商品行） */
  const productRows = (() => {
    const rows = children.length > 0 ? children.flatMap((c) => c.items) : mother.items;
    const map = new Map<string, { productId: string; productName: string; spec: string; quantity: number; price: number }>();
    for (const it of rows) {
      const key = `${it.productName}|${it.spec}`;
      const cur = map.get(key);
      if (cur) cur.quantity += it.quantity;
      else map.set(key, { productId: it.productId, productName: it.productName, spec: it.spec, quantity: it.quantity, price: it.price });
    }
    return [...map.values()];
  })();
  return (
    <>
      <DrawerSection title="订单信息">
        <InfoGrid cols={4}>
          <InfoItem label="销售单号" mono emph>{family.rootCode}</InfoItem>
          <InfoItem label="订单来源">{mother.salesPath === 'via_platform'
            ? (mother.platformCustomerName ?? (mother.platform ? EXTERNAL_PLATFORM_LABELS[mother.platform] : '经平台销售'))
            : '淡茶半盏'}（{EXTERNAL_CHANNEL_LABELS[mother.sourceChannel]}）</InfoItem>
          <InfoItem label="下单平台">{mother.salesPath === 'via_platform' ? (mother.platformCustomerName ?? '—') : '—'}</InfoItem>
          <InfoItem label="平台订单号" mono>{mother.externalOrderNo}</InfoItem>
          <InfoItem label="客户" emph>{`${mother.customerName}（${mother.customerType}）`}</InfoItem>
          <InfoItem label="客户区域">{regionTextOf(mother.customerRegion, mother.receiverAddress)}</InfoItem>
          <InfoItem label="总金额" mono valueStyle={{ color: 'var(--color-module-current-base)', fontWeight: 'var(--font-semibold)' }}>{money(amount)}</InfoItem>
          <InfoItem label="履约单数">{children.length > 0 ? `${children.length} 单` : '1 单（未拆分，母销售单即履约单）'}</InfoItem>
          <InfoItem label="销售路径">{mother.salesPath === 'via_platform' ? '经平台销售' : '直接销售'}</InfoItem>
          <InfoItem label="客户下单时间">{mother.customerOrderTime ?? '—'}</InfoItem>
          <InfoItem label="客户侧订单号" mono>{mother.customerOrderNo ?? '—'}</InfoItem>
          <InfoItem label="录入时间" mono>{fmtDateTime(mother.entryTime)}</InfoItem>
          <InfoItem label="录入人">{mother.operator}</InfoItem>
          {mother.platformCustomerName && <InfoItem label="平台客户">{mother.platformCustomerName}</InfoItem>}
        </InfoGrid>
      </DrawerSection>

      <DrawerSection title="收货信息">
        <InfoGrid cols={4}>
          <InfoItem label="收货人" emph>{mother.receiver}</InfoItem>
          <InfoItem label="联系电话" mono>{mother.receiverPhone}</InfoItem>
          <InfoItem label="收货地区">{regionTextOf(mother.customerRegion, mother.receiverAddress)}</InfoItem>
          <InfoItem label="收货地址" span={2}>{mother.receiverAddress}</InfoItem>
          <InfoItem label="备注" span={2}>{mother.remark || '—'}</InfoItem>
        </InfoGrid>
      </DrawerSection>

      <DrawerSection title="商品明细">
        <ProductItemsTable
          items={productRows}
          customerName={mother.customerName}
          salesPath={mother.salesPath}
          platformCustomerId={mother.platformCustomerId}
          platform={mother.platform}
          platformRateSnapshot={mother.platformRateSnapshot}
          footerAmount={amount}
        />
      </DrawerSection>
    </>
  );
}

/** 履约进度块：履约时间线 + 发货情况表（包裹级，物流公司/单号可点开物流跟踪弹窗）——履约单详情与分发列表抽屉共用 */
export function FulfillmentProgressBlock({ order, poDocs }: { order: ExternalOrder; poDocs: PurchaseDoc[] }) {
  /* 物流跟踪弹窗（点击发货情况表的物流公司/单号）：展示货物当前位置与途经轨迹 */
  const [logView, setLogView] = useState<{
    company: string; tracking: string; status: string;
    currentLoc: string; currentEvent: string;
    trail: { time: string; loc: string; event: string }[];
  } | null>(null);

  return (
    <>
      <div style={{ marginBottom: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>销售履约状态</span>
          {pill(fulfillStateOf(order))}
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>待接单 → 已接单 → 运输中 → 已妥投 → 已确收</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 'var(--space-3)' }}>
          {fulfillmentTimes(order).map((t) => (
            <div key={t.label} style={{ minWidth: 0 }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 2 }}>{t.label}</div>
              <div className="mono" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: t.value === '—' ? 'var(--color-neutral-400)' : 'var(--color-neutral-800)', whiteSpace: 'nowrap' }}>{t.value}</div>
            </div>
          ))}
        </div>
        {/* 管理后台推进（合作商链推进发货/妥投、妥投后确认收货） */}
        {(() => {
          const stage = order.fulfillment?.stage;
          const partnerChain = order.processStatus === 'processed' && order.path === 'distribute' && !!order.partnerName;
          const actions: ReactNode[] = [];
          if (partnerChain && order.partnerStatus === 'accepted') {
            actions.push(<Button key="ship" size="sm" onClick={() => useOrderFlowStore.getState().advancePartner(order.id, 'shipping')}>推进：发货</Button>);
          }
          if (partnerChain && order.partnerStatus === 'shipping') {
            actions.push(<Button key="transit" size="sm" onClick={() => useOrderFlowStore.getState().advancePartner(order.id, 'transit')}>推进：物流妥投</Button>);
          }
          if (stage === 'transit') {
            actions.push(<Button key="confirm" size="sm" onClick={() => useOrderFlowStore.getState().confirmReceipt(order.id)}>确认收货（管理后台）</Button>);
          }
          if (actions.length === 0) return null;
          return (
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              {actions}
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>接单 / 发货 / 妥投由履约主体推进；全部包裹妥投后确认收货 → 已确收，随后在「履约单结算」页发起对账</span>
            </div>
          );
        })()}
      </div>

      {/* 发货情况（包裹1、包裹2…：该履约单下全部发货包裹，PO 包裹 + 自营分仓发货；不单独成标签组） */}
      {(() => {
        const poPkgs = poDocs.flatMap((d) => d.packages.filter((x) => x.status !== 'void').map((x) => ({ no: x.packageNo, company: x.logisticsCompany, tracking: x.trackingNo, status: x.status as string, settled: x.settled, shippedAt: x.shippedAt, items: x.items.map((i) => `${i.productName}×${i.qty}`).join('、'), itemsList: x.items, poCode: d.code, supplierName: d.supplierName, deliveredAt: undefined, confirmedAt: undefined, warehouseName: undefined })));
        const selfPkgs = (order.selfShipments ?? []).map((x) => ({ no: x.packageNo, company: x.logisticsCompany, tracking: x.trackingNo, status: x.status as string, settled: x.settled, shippedAt: x.shippedAt, deliveredAt: x.deliveredAt, confirmedAt: x.confirmedAt, items: x.items.map((i) => `${i.productName}×${i.qty}`).join('、'), itemsList: x.items, warehouseName: x.warehouseName, poCode: undefined, supplierName: undefined }));
        const all = [...poPkgs, ...selfPkgs];
        return all.length === 0 ? (
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)', padding: 'var(--space-2) 0' }}>暂无发货包裹（发货后此处按包裹 1、包裹 2… 展示物流信息）</div>
        ) : (
          <table className="detail-inline-table">
            <thead><tr><th style={{ width: 70 }}>包裹</th><th style={{ width: 170 }}>发货单号</th><th>物流公司 / 单号</th><th>商品</th><th style={{ width: 90 }}>状态</th></tr></thead>
            <tbody>
              {all.map((x, i) => (
                <tr key={x.no + i}>
                  <td style={{ fontWeight: 'var(--font-medium)' }}>包裹{i + 1}</td>
                  <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{x.no}</td>
                  <td style={{ fontSize: 'var(--text-sm)' }}>
                    <span
                      style={{ color: 'var(--color-module-current-base)', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                      title="点击查看物流详情"
                      onClick={() => {
                        /* 确定性演示轨迹：揽收 → 干线 → 目的城分拨 → 派送 → 妥投/确收（按单号哈希选枢纽，同一单号轨迹一致） */
                        const destCity = regionTextOf(order.customerRegion, order.receiverAddress).split(' / ')[1] ?? '目的地';
                        const origin = x.warehouseName ?? `${x.supplierName ?? '供应商'}发货仓`;
                        const hash = [...x.tracking].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
                        const hubs = ['杭州', '上海', '南京', '武汉', '合肥'].filter((h) => !destCity.startsWith(h));
                        const hub = hubs[hash % hubs.length];
                        const plus = (h: number) => {
                          const d = new Date((x.shippedAt ?? '').replace(' ', 'T'));
                          if (isNaN(d.getTime())) return x.shippedAt ?? '';
                          d.setHours(d.getHours() + h);
                          const p = (n: number) => String(n).padStart(2, '0');
                          return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
                        };
                        const trail: { time: string; loc: string; event: string }[] = [
                          { time: plus(0), loc: origin, event: `${x.company}已揽收` },
                          { time: plus(3), loc: origin, event: `离开${origin}，发往${destCity}` },
                          { time: plus(14), loc: `${hub}转运中心`, event: `途经${hub}转运中心，装车发往${destCity}` },
                        ];
                        if (x.status !== 'shipped') {
                          trail.push({ time: plus(26), loc: `${destCity}转运中心`, event: `到达${destCity}转运中心` });
                          trail.push({ time: plus(34), loc: `${destCity}派送网点`, event: `到达${destCity}派送网点，安排投递` });
                          trail.push({ time: plus(40), loc: `${destCity} · ${order.receiverAddress.slice(-12)}`, event: '已妥投（投递完成）' });
                        }
                        if (x.status === 'confirmed') {
                          trail.push({ time: plus(46), loc: destCity, event: '客户确认收货' });
                        }
                        const last = trail[trail.length - 1];
                        const currentLoc = x.status === 'shipped' ? `${hub}转运中心 → ${destCity} 干线运输中`
                          : x.status === 'delivered' ? `已投递至 ${destCity}`
                            : `已确收 · ${destCity}`;
                        setLogView({ company: x.company, tracking: x.tracking, status: x.status, currentLoc, currentEvent: `${last.event} · ${last.time}`, trail });
                      }}
                    >
                      {x.company} <span className="mono">{x.tracking}</span>
                    </span>
                  </td>
                  <td style={{ fontSize: 'var(--text-sm)' }}>{x.items}</td>
                  <td>{pill(x.status === 'confirmed' ? '已确收' : x.status === 'delivered' ? '妥投' : '运输中')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      })()}

      {/* 物流跟踪弹窗（当前所在地 + 途经轨迹） */}
      {logView && (
        <div className="category-dialog-overlay" onClick={() => setLogView(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 560 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 2 }}>物流跟踪 · {logView.tracking}</div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-3)' }}>
              <span>物流公司：<strong>{logView.company}</strong></span>
              <span>运单号：<strong className="mono">{logView.tracking}</strong></span>
            </div>

            {/* 当前所在地（突出展示） */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
              <svg viewBox="0 0 18 18" fill="none" style={{ width: 20, height: 20, color: 'var(--color-module-current-base)', flexShrink: 0 }}><path d="M9 16s5.5-4.6 5.5-8.5A5.5 5.5 0 009 2a5.5 5.5 0 00-5.5 5.5C3.5 11.4 9 16 9 16z" stroke="currentColor" strokeWidth="1.3"/><circle cx="9" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>当前所在：{logView.currentLoc}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{logView.currentEvent}</div>
              </div>
            </div>

            {/* 途经轨迹（最新在上） */}
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>物流轨迹</div>
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 300, overflowY: 'auto' }}>
              {[...logView.trail].reverse().map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', padding: '6px 0' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 6, background: i === 0 ? 'var(--color-module-current-base)' : 'var(--color-neutral-300)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-sm)', color: i === 0 ? 'var(--color-neutral-800)' : 'var(--color-neutral-600)', fontWeight: i === 0 ? 'var(--font-semibold)' : 400 }}>{t.event}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{t.loc}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', flexShrink: 0 }}>{t.time}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
              <Button variant="ghost" onClick={() => setLogView(null)}>关闭</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** 结算 & 开票块：收款 / 开票 / 结算状态（收款·开票二维组合；订单状态在履约单属性区展示） */
export function SettleInvoiceBlock({ order, poDocs }: { order: ExternalOrder; poDocs: PurchaseDoc[] }) {
  return (
    <InfoGrid cols={4}>
      <InfoItem label="收款状态">{pill(receiveStateOf(order, poDocs))}</InfoItem>
      <InfoItem label="开票状态">{pill(invoiceStateOf(order))}</InfoItem>
      <InfoItem label="结算状态">{pill(settleStateOf(order, poDocs))}</InfoItem>
    </InfoGrid>
  );
}

/** 履约单详情内部分区 Tab（样式参照客户列表详情页顶部标签） */
type UnitTab = 'dispatch' | 'fulfill' | 'settle' | 'history';
const UNIT_TABS: { key: UnitTab; label: string }[] = [
  { key: 'dispatch', label: '分发情况' },
  { key: 'fulfill', label: '履约情况' },
  { key: 'settle', label: '结算情况' },
  { key: 'history', label: '操作轨迹' },
];

/** 单个履约单详情内容（Tab 内容区：code = 该履约单对应底层订单编号） */
function FulfillmentUnitDetail({ family, poDocs, code }: { family: OrderFamily; poDocs: PurchaseDoc[]; code: string }) {
  const children = family.children;
  const current = family.all.find((o) => o.code === code) ?? family.mother;
  const currentPos = poDocs.filter((d) => d.childOrderId === current.id);
  const [tab, setTab] = useState<UnitTab>('dispatch');

  return (
    <>
      {/* 履约单信息：字段直接展示（不设分区标题与横线） */}
      <InfoGrid cols={4}>
        <InfoItem label="履约单编号" mono emph>{current.code}</InfoItem>
        <InfoItem label="订单进度">{pill(orderProgressOf(current, currentPos))}</InfoItem>
        <InfoItem label={current.parentCode ? '关联销售单' : '单据性质'}>{current.parentCode ?? (children.length > 0 ? '母销售单（已拆分）' : '母销售单（未拆分，即履约单）')}</InfoItem>
        <InfoItem label="生成时间" mono>{fmtDateTime(current.history?.[0]?.time ?? current.entryTime)}</InfoItem>
        <InfoItem label="金额" mono valueStyle={{ fontWeight: 'var(--font-semibold)' }}>{money(current.totalAmount)}</InfoItem>
      </InfoGrid>
      <div style={{ marginTop: 'var(--space-3)' }}>
        <ProductItemsTable
          items={current.items}
          customerName={current.customerName}
          salesPath={current.salesPath ?? 'direct'}
          platformCustomerId={current.platformCustomerId}
          platform={current.platform}
          platformRateSnapshot={current.platformRateSnapshot}
          footerAmount={current.totalAmount}
        />
      </div>

      {/* 分发 / 履约 / 结算 / 操作轨迹：标签页展示（样式同客户列表详情页顶部 Tab） */}
      <div className="drawer-tab-bar" style={{ marginTop: 'var(--space-5)' }}>
        {UNIT_TABS.map((t) => (
          <button key={t.key} type="button" className={`drawer-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
            {t.key === 'history' && <span className="drawer-tab-count">{current.history.length}</span>}
          </button>
        ))}
      </div>
      <div className="drawer-tab-contents">
        {tab === 'dispatch' && (
          <InfoGrid cols={4}>
            <InfoItem label="分发状态">{pill(distributeStateOf(current))}</InfoItem>
            <InfoItem label="分发方式">{pathLabel(current)}</InfoItem>
            <InfoItem label="履约主体">{current.partnerName ?? (current.path === 'self' ? '淡茶半盏（自营）' : '待分发')}</InfoItem>
            <InfoItem label="分发时间">{current.fulfillment?.acceptTime ?? '—'}</InfoItem>
          </InfoGrid>
        )}

        {tab === 'fulfill' && (
          <FulfillmentProgressBlock order={current} poDocs={currentPos} />
        )}

        {tab === 'settle' && (
          <SettleInvoiceBlock order={current} poDocs={currentPos} />
        )}

        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 320, overflowY: 'auto' }}>
            {current.history.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', alignItems: 'baseline' }}>
                <span className="mono" style={{ color: 'var(--color-neutral-400)', flexShrink: 0 }}>{h.time}</span>
                <span style={{ fontWeight: 'var(--font-medium)', flexShrink: 0 }}>{h.action}</span>
                {h.detail && <span style={{ color: 'var(--color-neutral-500)' }}>{h.detail}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 自营执行信息（采购&发货 / 物流跟踪） */}
      {current.path === 'self' && ((current.selfShipments?.length ?? 0) > 0 || currentPos.length > 0) && (
        <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>自营执行（分仓发货 / 以销定采）</div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
            {current.selfPo && <span>采购：{current.selfPo.supplierName}（{current.selfPo.mode === 'direct' ? '直发客户' : '入库制'}）</span>}
            {currentPos.length > 0 && <span>采购单：<strong className="mono">{currentPos.map((d) => d.code).join('、')}</strong></span>}
            <span>接单 / 发货操作见「自营工作台」</span>
          </div>
          {(current.selfShipments ?? []).map((sh) => (
            <div key={sh.id} style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', padding: '2px 0' }}>
              <span className="mono">{sh.packageNo}</span>
              <span>{sh.warehouseName}</span>
              <span style={{ flex: 1 }}>{sh.items.map((i) => `${i.productName}×${i.qty}`).join('、')}</span>
              <span style={{ color: 'var(--color-neutral-500)' }}>{sh.logisticsCompany} <span className="mono">{sh.trackingNo}</span></span>
              <span>{sh.status === 'confirmed' ? '已确收' : sh.status === 'delivered' ? '已妥投' : '运输中'}</span>
            </div>
          ))}
        </div>
      )}

      {/* 报备命中 */}
      {current.reportMatches && current.reportMatches.length > 0 && (
        <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', background: '#E0F7FA', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          命中报备：<strong className="mono">{current.reportMatches.map((m) => m.reportCode).join('、')}</strong>
          （{current.reportMatches.map((m) => `${m.reportCode}→${m.partnerName}`).join('；')}）
        </div>
      )}

    </>
  );
}

/** 销售单详情 Tab 视图：销售单信息 / 履约单01 / 履约单02… 分开以 Tab 展示（列表「查看」抽屉与本详情页共用） */
export function SalesOrderDetailTabs({ family, poDocs, initialTab = 'info' }: {
  family: OrderFamily;
  poDocs: PurchaseDoc[];
  /** 初始展示的 Tab：'info' = 销售单信息；其余为履约单对应底层订单编号（子单「查看」进入默认定位该履约单） */
  initialTab?: string;
}) {
  const units = useMemo(() => fulfillmentUnitsOf(family), [family]);
  const isUnitCode = (code: string) => units.some((u) => u.underlying.code === code);
  const [active, setActive] = useState<string>(initialTab === 'info' || isUnitCode(initialTab) ? initialTab : 'info');

  const tabBtn = (code: string, label: string) => (
    <button
      key={code}
      onClick={() => setActive(code)}
      style={{
        padding: '6px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
        border: `1px solid ${active === code ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
        background: active === code ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
        color: active === code ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
        fontSize: 'var(--text-sm)', fontWeight: 500,
      }}
    >
      {label}
    </button>
  );

  const showInfo = active === 'info' || !isUnitCode(active);
  return (
    <>
      {/* 顶部 Tab：销售单信息 + 各履约单 */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        {tabBtn('info', '销售单信息')}
        {units.map((u) => tabBtn(u.underlying.code, `履约单${String(u.seq).padStart(2, '0')} · ${u.code}`))}
      </div>
      {showInfo
        ? <MotherOrderInfoSection family={family} />
        : <FulfillmentUnitDetail family={family} poDocs={poDocs} code={active} />}
    </>
  );
}

/**
 * 销售 · 销售单详情（母销售单 + 子履约单）
 * 销售单信息与各履约单（履约单01/02…，未拆分即默认履约单01）分开以 Tab 展示。
 * 销售单列表的母单/子单「查看」抽屉与本页共用 SalesOrderDetailTabs；
 * 本页保留直链访问（销售单履约「查看详情」等入口跳转）。
 */
export default function SalesOrderDetail() {
  const navigate = useNavigate();
  const { rootCode } = useParams<{ rootCode: string }>();
  const [searchParams] = useSearchParams();
  const orders = useOrderFlowStore((s) => s.orders);
  const poDocs = usePurchaseStore((s) => s.docs);

  const family = useMemo(() => buildFamilies(orders).find((f) => f.rootCode === rootCode) ?? null, [orders, rootCode]);

  if (!family) {
    return (
      <>
        <ContentHeader title="销售单详情" breadcrumbs={['销售', '销售单管理', '销售单列表', '销售单详情']} />
        <div className="content-body">
          <Card style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
            未找到销售单 {rootCode}，可能已被删除或拆分变更。
            <div style={{ marginTop: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => navigate('/sales/sales-orders')}>返回销售订单</Button>
            </div>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <ContentHeader
        title={`销售单详情 · ${family.rootCode}`}
        breadcrumbs={['销售', '销售单管理', '销售单列表', family.rootCode]}
        actions={<Button variant="ghost" onClick={() => navigate('/sales/sales-orders')}>返回列表</Button>}
      />
      <div className="content-body">
        {/* 销售单信息 / 履约单01 / 履约单02… 分开以 Tab 展示（?child= 定位默认履约单 Tab） */}
        <Card>
          <div className="detail-page-body">
            <SalesOrderDetailTabs family={family} poDocs={poDocs} initialTab={searchParams.get('child') ?? 'info'} />
          </div>
        </Card>
      </div>
    </>
  );
}
