import { useMemo, useState } from 'react';
import { PageHead } from '../partner/PartnerUI';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { usePurchaseStore } from '../../stores/purchaseStore';
import SelfOrderDetailDrawer from '../../components/selfop/SelfOrderDetailDrawer';
import { selfStageOf, acceptedSub, STAGE_META, packageStatsOf, type SelfStage } from '../../components/selfop/selfStage';
import { getSelfopAuth } from './SelfopLayout';
import { useSelfOrders } from './selfopShared';
import type { ExternalOrder } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/** 自营工作台 · 订单管理：自营订单全链路处理（与管理后台「销售单自营」共用抽屉与状态机） */
export default function SelfopOrders() {
  const auth = getSelfopAuth();
  const orders = useSelfOrders();
  const purchaseDocs = usePurchaseStore((s) => s.docs);

  const posOf = (o: ExternalOrder) => purchaseDocs.filter((d) => d.childOrderId === o.id);
  const stageOf = (o: ExternalOrder): SelfStage => selfStageOf(o, posOf(o));

  const [tab, setTab] = useState<SelfStage | ''>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const countOf = (k: SelfStage | '') => (k === '' ? orders.length : orders.filter((o) => stageOf(o) === k).length);
  const filtered = useMemo(() => (tab ? orders.filter((o) => stageOf(o) === tab) : orders), [orders, tab, purchaseDocs]);

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="订单"
        title="订单管理"
        desc={<>自营销售单全链路处理：待接单（接单 / 退回）→ 已接单（拆单 / 采购&amp;发货）→ 已发货运输中 → 妥投 → 确认收货；接单默认跟单人 <b>{auth?.name ?? '—'}</b></>}
      />

      {/* 状态阶段 Tab */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {([['', '全部'], ['pending', '待接单'], ['accepted', '已接单'], ['shipping', '已发货运输中'], ['delivered', '妥投'], ['done', '确认收货']] as const).map(([k, label]) => (
          <button
            key={k || 'all'}
            onClick={() => setTab(k as typeof tab)}
            style={{
              padding: '6px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
              border: `1px solid ${tab === k ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
              background: tab === k ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
              color: tab === k ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
              fontWeight: tab === k ? 600 : 400,
            }}
          >
            {label} · {countOf(k as SelfStage | '')}
          </button>
        ))}
      </div>

      <div className="pk-panel" style={{ padding: 0 }}>
        <Table
          headers={['订单编号', '客户', '商品', '金额', '跟单人', '采购', '状态', '物流', '操作']}
          rows={filtered.map((o) => {
            const st = stageOf(o);
            const meta = STAGE_META[st];
            const pos = posOf(o);
            const pkgs = packageStatsOf(o, pos);
            return [
              <span key="c" className="cell-mono-emph">{o.code}{o.parentCode && <span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>母单 {o.parentCode}</span>}</span>,
              <span key="cu" className="cell-emph">{o.customerName}</span>,
              <span key="i" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{o.items[0].productName}{o.items.length > 1 ? ` 等${o.items.length}种` : ''} ×{o.items.reduce((s, it) => s + it.quantity, 0)}</span>,
              <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(o.totalAmount)}</span>,
              <span key="f" style={{ fontSize: 'var(--text-sm)' }}>{o.follower ?? '—'}</span>,
              <span key="po" style={{ fontSize: 'var(--text-sm)' }}>
                {pos.length > 0 ? pos.map((d) => d.code).join('、') : '—'}
                {o.selfPo && pos.length > 0 && <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{o.selfPo.mode === 'direct' ? '直发客户' : '入库制'}</span>}
              </span>,
              <span key="st">
                {pill(meta.bg, meta.color, meta.label)}
                {st === 'accepted' && <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 2 }}>{acceptedSub(o, pos)}</span>}
              </span>,
              <span key="lg" style={{ fontSize: 'var(--text-sm)' }}>
                {pkgs.total > 0 ? `${pkgs.total} 包裹 · ${pkgs.delivered} 妥投` : '—'}
              </span>,
              <div key="act" className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => setSelectedId(o.id)}>查看</Button>
              </div>,
            ];
          })}
        />
        {filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--color-neutral-400)' }}>
            暂无自营订单（管理后台「履约分配」转自营后进入此处）
          </div>
        )}
      </div>

      {/* 详情抽屉（共享组件；接单默认带出当前登录运营为跟单人） */}
      {selectedId && (
        <SelfOrderDetailDrawer orderId={selectedId} onClose={() => setSelectedId(null)} defaultFollower={auth?.name} />
      )}
    </div>
  );
}
