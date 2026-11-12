import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import SalesOrderInfoModal from '../../components/business/SalesOrderInfoModal';
import {
  EXTERNAL_STATUS_LABELS, EXTERNAL_STATUS_COLORS, TRANSFER_SOURCE_LABELS,
} from '../../data/externalOrders';
import type { ExternalOrder } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/** 履约阶段：1 分发 → 2 接单 → 3 履约 → 4 运输 → 5 妥投 */
type StageKey = 'dispatch' | 'accept' | 'doing' | 'transit' | 'done';
const STAGE_CHAIN: { key: StageKey; label: string }[] = [
  { key: 'dispatch', label: '分发' },
  { key: 'accept', label: '接单' },
  { key: 'doing', label: '履约' },
  { key: 'transit', label: '运输' },
  { key: 'done', label: '妥投' },
];

function stageOf(o: ExternalOrder): { idx: number; label: string } {
  // 阶段 1：分发中
  if (['pending', 'report_match_pending', 'comparing'].includes(o.processStatus)) return { idx: 0, label: '分发中' };
  // 阶段 2：待接单
  if (['self_pending', 'distribute_pending'].includes(o.processStatus)) return { idx: 1, label: '待接单' };
  // 阶段 4：运输中
  if (o.processStatus === 'self_shipped') return { idx: 3, label: '运输中' };
  if (o.path === 'distribute' && (o.partnerStatus === 'shipping' || o.partnerStatus === 'transit')) return { idx: 3, label: o.partnerStatus === 'transit' ? '妥投待签收' : '运输中' };
  // 阶段 5：妥投 / 完成
  if (o.processStatus === 'self_delivered' || o.processStatus === 'completed') return { idx: 4, label: o.processStatus === 'completed' ? '已结算' : '已妥投' };
  if (o.path === 'distribute' && ['delivered', 'settled'].includes(o.partnerStatus ?? '')) return { idx: 4, label: o.partnerStatus === 'settled' ? '已结算' : '已妥投' };
  // 阶段 3：履约中（自营采购/入库、合作商备货）
  return { idx: 2, label: o.path === 'self' ? '履约中（采购/发货准备）' : '履约中（备货）' };
}

/** 履约单元：子订单 + 未被拆分的母销售单（有子单的母单由其子单代表） */
export default function SalesFulfillment() {
  const navigate = useNavigate();
  const orders = useOrderFlowStore((s) => s.orders);
  const purchaseDocs = usePurchaseStore((s) => s.docs);
  const [tab, setTab] = useState<'' | StageKey>('');
  const [linkOrderCode, setLinkOrderCode] = useState<string | null>(null);

  const units = useMemo(() => {
    const childCodes = new Set(orders.filter((o) => o.parentCode).map((o) => o.code));
    const rootHasChild = new Set(orders.filter((o) => childCodes.has(o.code) || o.parentCode).map((o) => o.parentCode ?? o.code));
    return orders.filter((o) => !o.parentCode && !rootHasChild.has(o.code) || o.parentCode)
      .map((o) => {
        const st = stageOf(o);
        const doc = purchaseDocs.find((d) => d.childOrderCode === o.code);
        const pkgs = doc?.packages.filter((p) => p.status !== 'void') ?? [];
        const delivered = pkgs.filter((p) => p.status === 'delivered').length;
        return {
          order: o,
          rootCode: o.parentCode ?? o.code,
          stageIdx: st.idx,
          stageLabel: st.label,
          pkgCount: pkgs.length,
          pkgDelivered: delivered,
          lastTracking: pkgs[pkgs.length - 1],
        };
      })
      .sort((a, b) => b.stageIdx - a.stageIdx || b.order.entryTime.localeCompare(a.order.entryTime));
  }, [orders, purchaseDocs]);

  const countOf = (k: '' | StageKey) => (k === '' ? units.length : units.filter((u) => u.stageIdx === STAGE_CHAIN.findIndex((s) => s.key === k)).length);
  const filtered = useMemo(() => (tab === '' ? units : units.filter((u) => u.stageIdx === STAGE_CHAIN.findIndex((s) => s.key === tab))), [units, tab]);

  return (
    <>
      <ContentHeader title="销售单履约" breadcrumbs={['销售', '销售单管理', '销售单履约']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          按<strong>子履约单 / 未拆分的母销售单</strong>维度跟踪每一张销售单的履约进度（未拆分时母销售单即履约单）：
          分发 → 接单 → 履约（自营采购入库 / 合作商备货）→ 运输（包裹在途）→ 妥投 / 结算。
          已拆分的母销售单由其子履约单各自呈现；包裹物流与合作商发货登记实时联动。
        </div>

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
            headers={['订单编号', '关联销售单', '客户', '供应方式', '履约主体', '金额', '当前状态', '履约进度', '包裹物流', '录入时间', '操作']}
            rows={filtered.map((u) => {
              const o = u.order;
              const c = EXTERNAL_STATUS_COLORS[o.processStatus === 'completed' ? 'processed' : o.processStatus] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
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
                <span key="cu" className="cell-emph">{o.customerName}</span>,
                <span key="src" style={{ fontSize: 'var(--text-sm)' }}>
                  {o.path === 'self' ? '自营' : TRANSFER_SOURCE_LABELS[o.transferSource ?? ''] ?? '待分发'}
                </span>,
                <span key="sub" style={{ fontSize: 'var(--text-sm)' }}>
                  {o.path === 'self' ? `自营${o.follower ? ` · ${o.follower}` : ''}` : (o.partnerName ?? '—')}
                </span>,
                <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(o.totalAmount)}</span>,
                pill(c.bg, c.color, EXTERNAL_STATUS_LABELS[o.processStatus] ?? o.processStatus),
                <span key="stg" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {STAGE_CHAIN.map((s, i) => (
                    <span key={s.key} style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: i < u.stageIdx ? '#01795D' : i === u.stageIdx ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)',
                    }} title={s.label} />
                  ))}
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginLeft: 4, whiteSpace: 'nowrap' }}>{u.stageLabel}</span>
                </span>,
                u.pkgCount > 0
                  ? <span key="pkg" style={{ fontSize: 'var(--text-sm)' }}>
                      {u.pkgCount} 包裹 · {u.pkgDelivered} 签收
                      {u.lastTracking && <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{u.lastTracking.logisticsCompany} {u.lastTracking.trackingNo}</span>}
                    </span>
                  : <span key="pkg" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>—</span>,
                <span key="t" className="cell-muted" style={{ whiteSpace: 'nowrap' }}>{o.entryTime}</span>,
                <div key="act" className="row-actions">
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/sales/sales-orders/${u.rootCode}`)}>查看详情</Button>
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
    </>
  );
}
