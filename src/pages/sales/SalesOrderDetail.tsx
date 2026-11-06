import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import {
  EXTERNAL_PLATFORM_LABELS, EXTERNAL_CHANNEL_LABELS, TRANSFER_SOURCE_LABELS,
} from '../../data/externalOrders';
import {
  buildFamilies, familyStatesOf, distributeStateOf, shipStateOf, settleStateOf, FAMILY_STATE_COLORS,
} from '../../utils/salesOrderFamily';
import type { ExternalOrder } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (text: string) => {
  const c = (FAMILY_STATE_COLORS as Record<string, { bg: string; color: string }>)[text] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{text}</span>
  );
};

/** 路径标签（与履约分配页口径一致） */
function pathLabel(o: ExternalOrder): string {
  if (o.processStatus === 'report_match_pending') return '转派-报备';
  if (o.path === 'self') return '自营';
  if (o.transferSource) return TRANSFER_SOURCE_LABELS[o.transferSource];
  if (o.distributeMode === 'grab') return '转派-抢单';
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

/**
 * 销售 · 销售单详情（母子单）
 * 上部：母子订单共同信息（母销售单来源/客户/收货等）；
 * 下部：Tab 逐个展示子订单（含母订单）自身的信息（商品、路径、三状态、轨迹）。
 */
export default function SalesOrderDetail() {
  const navigate = useNavigate();
  const { rootCode } = useParams<{ rootCode: string }>();
  const [searchParams] = useSearchParams();
  const orders = useOrderFlowStore((s) => s.orders);
  const poDocs = usePurchaseStore((s) => s.docs);

  const family = useMemo(() => buildFamilies(orders).find((f) => f.rootCode === rootCode) ?? null, [orders, rootCode]);

  /** 当前选中 Tab 的单号（默认母单；?child= 子单号定位） */
  const [activeCode, setActiveCode] = useState<string>(() => searchParams.get('child') ?? '');
  const currentCode = useMemo(() => {
    if (!family) return '';
    if (activeCode && family.all.some((o) => o.code === activeCode)) return activeCode;
    return family.mother.code;
  }, [family, activeCode]);

  if (!family) {
    return (
      <>
        <ContentHeader title="销售单详情" breadcrumbs={['销售', '销售单管理', '销售订单', '销售单详情']} />
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

  const mother = family.mother;
  const children = family.children;
  const states = familyStatesOf(family);
  const amount = family.all.reduce((s, o) => s + o.totalAmount, 0);
  const current = family.all.find((o) => o.code === currentCode) ?? mother;
  const currentPos = poDocs.filter((d) => d.childOrderId === current.id);

  const tabBtn = (code: string, label: string) => (
    <button
      key={code}
      onClick={() => setActiveCode(code)}
      style={{
        padding: '6px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
        border: `1px solid ${currentCode === code ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
        background: currentCode === code ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
        color: currentCode === code ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
        fontSize: 'var(--text-sm)', fontWeight: 500,
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <ContentHeader
        title={`销售单详情 · ${family.rootCode}`}
        breadcrumbs={['销售', '销售单管理', '销售订单', family.rootCode]}
        actions={<Button variant="ghost" onClick={() => navigate('/sales/sales-orders')}>返回列表</Button>}
      />
      <div className="content-body">
        {/* ── 母子订单共同信息 ── */}
        <Card title="订单信息（母子共同）">
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
            {pill(states.distribute)}
            {pill(states.ship)}
            {pill(states.settle)}
            {children.length > 0 && pill(`已拆分 ${children.length} 单`)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3) var(--space-4)' }}>
            {infoItem('母销售单号', family.rootCode, { mono: true, emph: true })}
            {infoItem('来源平台', EXTERNAL_PLATFORM_LABELS[mother.platform])}
            {infoItem('平台原始单号', mother.externalOrderNo, { mono: true })}
            {infoItem('来源渠道', EXTERNAL_CHANNEL_LABELS[mother.sourceChannel])}
            {infoItem('客户', `${mother.customerName}（${mother.customerType}）`, { emph: true })}
            {infoItem('客户区域', mother.customerRegion)}
            {infoItem('订单金额（含子单）', <span style={{ color: 'var(--color-module-current-base)', fontWeight: 'var(--font-semibold)' }}>{money(amount)}</span>, { mono: true })}
            {infoItem('子单数', children.length > 0 ? `${children.length} 单` : '未拆分')}
            {infoItem('收货人', mother.receiver)}
            {infoItem('联系电话', mother.receiverPhone, { mono: true })}
            {infoItem('录入时间', mother.entryTime)}
            {infoItem('录入人', mother.operator)}
            {infoItem('收货地址', mother.receiverAddress, { span: 2 })}
            {infoItem('备注', mother.remark || '—', { span: 2 })}
          </div>
        </Card>

        {/* ── 子订单 Tab（母订单 + 子订单1..N，各展示自身内容） ── */}
        <Card
          title="单据明细（按订单切换）"
          style={{ marginTop: 'var(--space-4)' }}
          headerRight={<span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>母订单保留拆分后剩余商品，子订单为拆出/分拆定案部分</span>}
        >
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
            {tabBtn(mother.code, `母订单 ${mother.code}`)}
            {children.map((c, i) => tabBtn(c.code, `子订单${i + 1} ${c.code}`))}
          </div>

          {/* 当前订单信息 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
            {infoItem('订单编号', current.code, { mono: true, emph: true })}
            {infoItem('分发路径', pathLabel(current))}
            {infoItem('合作商 / 跟单人', current.partnerName ?? (current.path === 'self' ? `自营${current.follower ? ` · ${current.follower}` : ''}` : '—'))}
            {infoItem('订单金额', <span style={{ fontWeight: 'var(--font-semibold)' }}>{money(current.totalAmount)}</span>, { mono: true })}
            {infoItem('分发状态', pill(distributeStateOf(current)))}
            {infoItem('发货状态', pill(shipStateOf(current, currentPos)))}
            {infoItem('结算状态', pill(settleStateOf(current)))}
            {infoItem(current.parentCode ? '母订单编号' : '订单性质', current.parentCode ?? (children.length > 0 ? '母订单（拆分后保留剩余商品）' : '单一销售单（未拆分）'))}
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
                <span>接单 / 发货操作见「销售 → 销售单自营」</span>
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

          {/* 报备命中 */}
          {current.reportMatches && current.reportMatches.length > 0 && (
            <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', background: '#E0F7FA', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
              命中报备：<strong className="mono">{current.reportMatches.map((m) => m.reportCode).join('、')}</strong>
              （{current.reportMatches.map((m) => `${m.reportCode}→${m.partnerName}`).join('；')}）
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
