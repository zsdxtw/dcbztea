import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../partner/PartnerUI';
import { getSelfopAuth } from './SelfopLayout';
import { useSelfOrders } from './selfopShared';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { selfStageOf, STAGE_META, type SelfStage } from '../../components/selfop/selfStage';
import type { ExternalOrder } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

/** 自营工作台首页：统计带 + 待办事项 + 最近自营订单 */
export default function SelfopDashboard() {
  const navigate = useNavigate();
  const auth = getSelfopAuth();
  const orders = useSelfOrders();
  const purchaseDocs = usePurchaseStore((s) => s.docs);

  const posOf = (o: ExternalOrder) => purchaseDocs.filter((d) => d.childOrderId === o.id);
  const stageOf = (o: ExternalOrder): SelfStage => selfStageOf(o, posOf(o));
  const byStage = (k: SelfStage) => orders.filter((o) => stageOf(o) === k);

  const todos = useMemo(() => {
    const list: { text: string; tag: string; color: string; to: string }[] = [];
    const pending = byStage('pending');
    if (pending.length > 0) list.push({ text: `${pending.length} 单自营订单待接单（接单 / 退回分发）`, tag: '待接单', color: '#0F64B5', to: '/selfop/orders' });
    const accepted = byStage('accepted');
    const toOut = accepted.filter((o) => posOf(o).some((d) => d.deliveryMode === 'warehouse' && d.status === 'received'));
    const toShip = accepted.filter((o) => (o.selfShipments?.length ?? 0) === 0 && !posOf(o).some((d) => d.status === 'received'));
    if (toOut.length > 0) list.push({ text: `${toOut.length} 单采购到货待出库发货`, tag: '待出库', color: '#3949AB', to: '/selfop/orders' });
    if (toShip.length > 0) list.push({ text: `${toShip.length} 单已接单待采购&发货`, tag: '待发货', color: '#3949AB', to: '/selfop/orders' });
    const delivered = byStage('delivered');
    if (delivered.length > 0) list.push({ text: `${delivered.length} 单已妥投待客户确认收货`, tag: '妥投', color: '#00695C', to: '/selfop/orders' });
    const inTransit = byStage('shipping');
    if (inTransit.length > 0) list.push({ text: `${inTransit.length} 单运输中（物流跟踪）`, tag: '运输中', color: '#0277BD', to: '/selfop/logistics' });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, purchaseDocs]);

  const monthKey = new Date().toISOString().slice(0, 7);
  const monthAmount = orders.filter((o) => o.entryTime.startsWith(monthKey)).reduce((s, o) => s + o.totalAmount, 0);
  const recent = [...orders].sort((a, b) => b.entryTime.localeCompare(a.entryTime) || b.code.localeCompare(a.code)).slice(0, 6);

  const stats = [
    { label: '待接单', value: String(byStage('pending').length), unit: '单', sub: '接单 / 退回分发', accent: false },
    { label: '已接单', value: String(byStage('accepted').length), unit: '单', sub: '拆单 / 采购&发货', accent: false },
    { label: '运输中', value: String(byStage('shipping').length), unit: '单', sub: '物流跟踪至妥投', accent: false },
    { label: '本月自营额', value: (monthAmount / 10000).toFixed(1), unit: '万', sub: money(monthAmount), accent: true },
  ];

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="工作台"
        title={`下午好，${auth?.name ?? '自营运营'}`}
        desc={<>自营订单执行一览：待接单 → 已接单（拆单 / 采购&amp;发货）→ 已发货运输中 → 妥投 → 确认收货</>}
      />

      {/* 统计带 */}
      <div className="pk-stats">
        {stats.map((s) => (
          <div key={s.label} className={`pk-stat${s.accent ? ' accent' : ''}`}>
            <div className="pk-stat-label">{s.label}</div>
            <div className="pk-stat-value">{s.value}<small>{s.unit}</small></div>
            <div className="pk-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="pk-grid pk-grid-32">
        {/* 待办事项 */}
        <div className="pk-panel">
          <div className="pk-panel-head">
            <span className="pk-panel-title">待办事项</span>
            <button className="pk-link" onClick={() => navigate('/selfop/orders')}>全部订单 →</button>
          </div>
          <div className="pk-rows">
            {todos.length === 0 && (
              <div className="pk-row" style={{ color: 'var(--color-neutral-400)' }}>暂无待办，休息一下喝杯茶 ☕</div>
            )}
            {todos.map((t) => (
              <button key={t.text} className="pk-row" onClick={() => navigate(t.to)} style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                <span className="pk-row-dot" style={{ background: t.color }} />
                <span style={{ flex: 1, fontSize: 13 }}>{t.text}</span>
                <span className="pk-tag">{t.tag}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 最近自营订单 */}
        <div className="pk-panel">
          <div className="pk-panel-head">
            <span className="pk-panel-title">最近自营订单</span>
            <button className="pk-link" onClick={() => navigate('/selfop/orders')}>查看全部 →</button>
          </div>
          <div className="pk-rows">
            {recent.map((o) => {
              const meta = STAGE_META[stageOf(o)];
              return (
                <button key={o.id} className="pk-row" onClick={() => navigate('/selfop/orders')} style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                  <span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{o.code}</span>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--color-neutral-600)' }}>{o.customerName} · {money(o.totalAmount)}</span>
                  <span style={{ fontSize: 12, color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                </button>
              );
            })}
            {recent.length === 0 && <div className="pk-row" style={{ color: 'var(--color-neutral-400)' }}>暂无自营订单</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
