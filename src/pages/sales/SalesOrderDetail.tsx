import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { regionTextOf } from '../../data/regions';
import { EXTERNAL_CHANNEL_LABELS, EXTERNAL_PLATFORM_LABELS, TRANSFER_SOURCE_LABELS } from '../../data/externalOrders';
import {
  buildFamilies, familyStatesOf, distributeStateOf, shipStateOf, settleStateOf, FAMILY_STATE_COLORS, fulfillmentUnitsOf,
  type OrderFamily,
} from '../../utils/salesOrderFamily';
import {
  FULFILLMENT_STAGE_LABELS, FULFILLMENT_STAGE_COLORS, stageOfOrder, fulfillmentTimes,
} from '../../utils/fulfillment';
import type { ExternalOrder, FulfillmentStage, PurchaseDoc } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (text: string) => {
  const c = (FAMILY_STATE_COLORS as Record<string, { bg: string; color: string }>)[text] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{text}</span>
  );
};

/** 履约状态标签（统一五状态口径） */
const stagePill = (stage: FulfillmentStage) => {
  const c = FULFILLMENT_STAGE_COLORS[stage];
  return (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{FULFILLMENT_STAGE_LABELS[stage]}</span>
  );
};

/** 路径标签（与销售单分发页口径一致） */
function pathLabel(o: ExternalOrder): string {
  if (o.processStatus === 'report_match_pending') return '转派-报备';
  if (o.path === 'self') return '自营';
  if (o.transferSource) return TRANSFER_SOURCE_LABELS[o.transferSource];
  if (o.distributeMode === 'compare') return '转派-比单';
  return '—';
}

/** 信息项 */
const infoItem = (label: string, value: React.ReactNode, opts?: { mono?: boolean; emph?: boolean; span?: number }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, gridColumn: opts?.span ? `span ${opts.span}` : undefined, minWidth: 0 }}>
    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{label}</span>
    <span className={`${opts?.mono ? 'mono ' : ''}${opts?.emph ? 'cell-emph' : ''}`} style={{ fontSize: 'var(--text-sm)', wordBreak: 'break-all' }}>{value}</span>
  </div>
);

/* ──────────────────────────────────────────────
 * 共享区块：销售单详情页与销售单列表「查看」抽屉共用
 * ────────────────────────────────────────────── */

/** 母销售单信息内容（「销售单信息」Tab 内容区） */
function MotherOrderInfoSection({ family, showStates = true }: { family: OrderFamily; showStates?: boolean }) {
  const mother = family.mother;
  const children = family.children;
  const states = familyStatesOf(family);
  const amount = (children.length > 0 ? children : family.all).reduce((s, o) => s + o.totalAmount, 0);
  return (
    <>
      {showStates && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {pill(states.distribute)}
            {states.total > 1 && <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{states.distributed}/{states.total}</span>}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {pill(states.ship)}
            {states.total > 1 && <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{states.shipped}/{states.total}</span>}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {pill(states.settle)}
            {states.total > 1 && <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{states.settled}/{states.total}</span>}
          </span>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3) var(--space-4)' }}>
        {infoItem('销售单号', family.rootCode, { mono: true, emph: true })}
        {infoItem('订单来源', <>淡茶半盏<span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{EXTERNAL_CHANNEL_LABELS[mother.sourceChannel]}</span></>)}
        {infoItem('下单平台', mother.platform ? EXTERNAL_PLATFORM_LABELS[mother.platform] : '—')}
        {infoItem('平台订单号', mother.externalOrderNo, { mono: true })}
        {infoItem('客户', `${mother.customerName}（${mother.customerType}）`, { emph: true })}
        {infoItem('客户区域', regionTextOf(mother.customerRegion, mother.receiverAddress))}
        {infoItem('总金额', <span style={{ color: 'var(--color-module-current-base)', fontWeight: 'var(--font-semibold)' }}>{money(amount)}</span>, { mono: true })}
        {infoItem('履约单数', children.length > 0 ? `${children.length} 单` : '1 单（未拆分，母销售单即履约单）')}
        {infoItem('收货人', mother.receiver)}
        {infoItem('联系电话', mother.receiverPhone, { mono: true })}
        {infoItem('销售路径', mother.salesPath === 'via_platform' ? '经平台销售' : '直接销售')}
        {infoItem('客户下单时间', mother.customerOrderTime ?? '—')}
        {infoItem('客户侧订单号', mother.customerOrderNo ?? '—', { mono: true })}
        {infoItem('录入时间', mother.entryTime)}
        {infoItem('录入人', mother.operator)}
        {mother.platformCustomerName && infoItem('平台客户', mother.platformCustomerName)}
        {infoItem('收货地址', mother.receiverAddress, { span: 2 })}
        {infoItem('备注', mother.remark || '—', { span: 2 })}
      </div>
    </>
  );
}

/** 单个履约单详情内容（Tab 内容区：code = 该履约单对应底层订单编号） */
function FulfillmentUnitDetail({ family, poDocs, code }: { family: OrderFamily; poDocs: PurchaseDoc[]; code: string }) {
  const children = family.children;
  const current = family.all.find((o) => o.code === code) ?? family.mother;
  const currentPos = poDocs.filter((d) => d.childOrderId === current.id);

  return (
    <>
      {/* 当前订单信息 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
        {infoItem('履约单编号', current.code, { mono: true, emph: true })}
        {infoItem('分发路径', pathLabel(current))}
        {infoItem('合作商 / 跟单人', current.partnerName ?? (current.path === 'self' ? `自营${current.follower ? ` · ${current.follower}` : ''}` : '—'))}
        {infoItem('金额', <span style={{ fontWeight: 'var(--font-semibold)' }}>{money(current.totalAmount)}</span>, { mono: true })}
        {infoItem('分发状态', pill(distributeStateOf(current)))}
        {infoItem('履约状态', pill(shipStateOf(current, currentPos)))}
        {infoItem('结算状态', pill(settleStateOf(current)))}
        {infoItem(current.parentCode ? '关联销售单' : '单据性质', current.parentCode ?? (children.length > 0 ? '母销售单（已拆分）' : '母销售单（未拆分，即履约单）'))}
      </div>

      {/* 履约时间线：来单 → 接单 → 发货 → 妥投 → 确收 */}
      <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>销售履约状态</span>
          {stagePill(stageOfOrder(current))}
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>待接单 → 已接单 → 已发货 → 已签收/妥投 → 确认收货</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 'var(--space-3)' }}>
          {fulfillmentTimes(current).map((t) => (
            <div key={t.label} style={{ minWidth: 0 }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 2 }}>{t.label}</div>
              <div className="mono" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: t.value === '—' ? 'var(--color-neutral-400)' : 'var(--color-neutral-800)', whiteSpace: 'nowrap' }}>{t.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 'var(--space-4)' }}>
        {/* 商品明细 */}
        <div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>商品明细（{current.items.length} 种）</div>
          <table className="detail-inline-table">
            <thead><tr><th>商品名称</th><th>规格</th><th>数量</th><th>单价</th><th>小计</th></tr></thead>
            <tbody>
              {current.items.map((it, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                  <td>{it.spec}</td>
                  <td className="mono">{it.quantity}</td>
                  <td className="mono">{money(it.price)}</td>
                  <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(it.price * it.quantity)}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 'var(--font-semibold)' }}>
                <td colSpan={4} style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>合计</td>
                <td className="mono" style={{ color: 'var(--color-module-current-base)' }}>{money(current.totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 处理轨迹 */}
        <div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>处理轨迹</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 320, overflowY: 'auto' }}>
            {current.history.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', alignItems: 'baseline' }}>
                <span className="mono" style={{ color: 'var(--color-neutral-400)', flexShrink: 0 }}>{h.time}</span>
                <span style={{ fontWeight: 'var(--font-medium)', flexShrink: 0 }}>{h.action}</span>
                {h.detail && <span style={{ color: 'var(--color-neutral-500)' }}>{h.detail}</span>}
              </div>
            ))}
          </div>
        </div>
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
              <span>{sh.status === 'delivered' ? '已妥投' : '运输中'}</span>
            </div>
          ))}
        </div>
      )}

      {/* 发货情况（包裹1、包裹2…：该履约单下全部发货包裹，PO 包裹 + 自营分仓发货） */}
      {(() => {
        const poPkgs = currentPos.flatMap((d) => d.packages.filter((x) => x.status !== 'void').map((x) => ({ no: x.packageNo, company: x.logisticsCompany, tracking: x.trackingNo, delivered: x.status === 'delivered', items: x.items.map((i) => `${i.productName}×${i.qty}`).join('、') })));
        const selfPkgs = (current.selfShipments ?? []).map((x) => ({ no: x.packageNo, company: x.logisticsCompany, tracking: x.trackingNo, delivered: x.status === 'delivered', items: x.items.map((i) => `${i.productName}×${i.qty}`).join('、') }));
        const all = [...poPkgs, ...selfPkgs];
        return (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>发货情况（{all.length} 个包裹）</div>
            {all.length === 0 ? (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)', padding: 'var(--space-2) 0' }}>暂无发货包裹（发货后此处按包裹 1、包裹 2… 展示物流信息）</div>
            ) : (
              <table className="detail-inline-table">
                <thead><tr><th style={{ width: 70 }}>包裹</th><th style={{ width: 170 }}>发货单号</th><th>物流公司 / 单号</th><th>商品</th><th style={{ width: 90 }}>状态</th></tr></thead>
                <tbody>
                  {all.map((x, i) => (
                    <tr key={x.no + i}>
                      <td style={{ fontWeight: 'var(--font-medium)' }}>包裹{i + 1}</td>
                      <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{x.no}</td>
                      <td style={{ fontSize: 'var(--text-sm)' }}>{x.company} <span className="mono">{x.tracking}</span></td>
                      <td style={{ fontSize: 'var(--text-sm)' }}>{x.items}</td>
                      <td>{x.delivered ? pill('已妥投') : pill('运输中')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })()}

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
export function SalesOrderDetailTabs({ family, poDocs, initialTab = 'info', showStates = true }: {
  family: OrderFamily;
  poDocs: PurchaseDoc[];
  /** 初始展示的 Tab：'info' = 销售单信息；其余为履约单对应底层订单编号（子单「查看」进入默认定位该履约单） */
  initialTab?: string;
  /** 销售单信息 Tab 顶部是否展示三状态药丸（抽屉头部已展示时传 false） */
  showStates?: boolean;
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
        ? <MotherOrderInfoSection family={family} showStates={showStates} />
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
          <SalesOrderDetailTabs family={family} poDocs={poDocs} initialTab={searchParams.get('child') ?? 'info'} />
        </Card>
      </div>
    </>
  );
}
