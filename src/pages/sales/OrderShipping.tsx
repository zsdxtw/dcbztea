import { useEffect, useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import DeptEmployeeSelect from '../../components/business/DeptEmployeeSelect';
import { useOrderFlowStore, getSelfPurchaseEstimate } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { EXTERNAL_PLATFORM_LABELS, EXTERNAL_CHANNEL_LABELS } from '../../data/externalOrders';
import { getWarehouseStock, WAREHOUSE_NAMES } from '../../data/stock';
import { getEmployeeName } from '../../data/organization';
import type { ExternalOrder, SelfShipment } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/* ── 自营阶段推导（含关联采购单包裹：任一物流单号即运输中） ── */
type SelfStage = 'pending' | 'accepted' | 'shipping' | 'delivered' | 'done';

const STAGE_META: Record<SelfStage, { label: string; bg: string; color: string }> = {
  pending: { label: '自营待接单', bg: '#E3F2FD', color: '#0F64B5' },
  accepted: { label: '已接单', bg: '#E8EAF6', color: '#3949AB' },
  shipping: { label: '已发货运输中', bg: '#E1F5FE', color: '#0277BD' },
  delivered: { label: '妥投', bg: '#E0F2F1', color: '#00695C' },
  done: { label: '确认收货', bg: '#ECEFF1', color: '#455A64' },
};

function selfStageOf(o: ExternalOrder, pos: { packages: { status: string }[] }[]): SelfStage {
  switch (o.processStatus) {
    case 'self_pending': return 'pending';
    case 'self_accepted': {
      const hasPackage = (o.selfShipments?.length ?? 0) > 0 || pos.some((d) => d.packages.some((x) => x.status !== 'void'));
      return hasPackage ? 'shipping' : 'accepted';
    }
    case 'self_shipped': return 'shipping';
    case 'self_delivered': return 'delivered';
    default: return 'done';
  }
}

/** 已接单子状态：采购在途 / 到货待发（入库制采购到货） */
function acceptedSub(o: ExternalOrder, pos: { status: string; deliveryMode: string }[]): string {
  const wh = pos.filter((d) => d.deliveryMode === 'warehouse');
  if (wh.some((d) => ['received', 'partial_shipped', 'fully_shipped', 'delivered'].includes(d.status))) return '到货待出库';
  if (pos.length > 0) return '采购在途';
  return '待采购&发货';
}

interface WarehouseRow {
  warehouseId: string;
  logisticsCompany: string;
  trackingNo: string;
  qty: Record<string, string>;
}

const LOGISTICS_COMPANIES = ['顺丰速运', '京东物流', '德邦物流', '中通快递', '圆通速递'];

/**
 * 销售 · 销售单自营（自营订单处理中心）
 * 销售单分发「转自营」后：待接单 →（详情页：接单 / 退回）→ 已接单 →（拆单 / 采购&发货：分仓直发 + 缺口以销定采）
 * → 已发货运输中（有物流单号）→ 妥投（系统跟踪物流投递完成）→ 确认收货（人工 / 联机）。
 */
export default function OrderShipping() {
  const orders = useOrderFlowStore((s) => s.orders);
  const store = useOrderFlowStore;
  const purchaseDocs = usePurchaseStore((s) => s.docs);

  /** 自营订单（分发转自营后的全链路） */
  const selfOrders = useMemo(() => orders.filter((o) => o.path === 'self' || ['self_pending', 'self_accepted', 'self_shipped', 'self_delivered'].includes(o.processStatus)), [orders]);

  const posOf = (o: ExternalOrder) => purchaseDocs.filter((d) => d.childOrderId === o.id);
  const stageOf = (o: ExternalOrder): SelfStage => selfStageOf(o, posOf(o));

  const [tab, setTab] = useState<SelfStage | ''>('');
  const countOf = (k: SelfStage | '') => (k === '' ? selfOrders.length : selfOrders.filter((o) => stageOf(o) === k).length);
  const filtered = useMemo(() => (tab ? selfOrders.filter((o) => stageOf(o) === tab) : selfOrders), [selfOrders, tab, purchaseDocs]);

  /* ── 详情抽屉 ── */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const current = selectedId ? orders.find((o) => o.id === selectedId) ?? null : null;
  const currentPos = current ? posOf(current) : [];

  /* 接单弹窗（跟单人） */
  const [acceptFollower, setAcceptFollower] = useState('');
  const [acceptError, setAcceptError] = useState('');
  /* 退回确认 */
  const [returning, setReturning] = useState(false);
  /* 拆单弹窗 */
  const [splitQty, setSplitQty] = useState<Record<string, string>>({});
  const [splitOpen, setSplitOpen] = useState(false);
  /* 采购&发货弹窗 */
  const [shipOpen, setShipOpen] = useState(false);
  const [whRows, setWhRows] = useState<WarehouseRow[]>([]);
  const [buyEnabled, setBuyEnabled] = useState(true);
  const [buySupplier, setBuySupplier] = useState('');
  const [buyMode, setBuyMode] = useState<'direct' | 'warehouse'>('direct');
  const [buyQty, setBuyQty] = useState<Record<string, string>>({});
  const [shipError, setShipError] = useState('');
  /* 出库弹窗（入库制到货出库） */
  const [outCompany, setOutCompany] = useState('顺丰速运');
  const [outTracking, setOutTracking] = useState('');
  const [outOpen, setOutOpen] = useState(false);

  useEffect(() => {
    setAcceptFollower(''); setAcceptError(''); setReturning(false);
    setSplitQty({}); setSplitOpen(false);
    setShipOpen(false); setShipError('');
    setOutOpen(false); setOutCompany('顺丰速运'); setOutTracking('');
  }, [selectedId]);

  /** 打开采购&发货弹窗：初始化分仓行与采购数量（缺口默认以销定采） */
  const openShipDialog = (o: ExternalOrder) => {
    const firstWarehouse = o.items.map((it) => getWarehouseStock(it.productId)).flat()[0]?.warehouseId ?? '';
    setWhRows([{ warehouseId: firstWarehouse, logisticsCompany: '顺丰速运', trackingNo: '', qty: {} }]);
    const gaps: Record<string, string> = {};
    for (const it of o.items) gaps[it.productId] = String(it.quantity);
    setBuyQty(gaps);
    setBuyEnabled(true);
    setBuySupplier('');
    setBuyMode('direct');
    setShipOpen(true);
    setShipError('');
  };

  /** 弹窗内可用仓库（订单商品有库存的仓库） */
  const whOptions = useMemo(() => {
    if (!current) return [];
    const ids = new Set<string>();
    for (const it of current.items) for (const w of getWarehouseStock(it.productId)) ids.add(w.warehouseId);
    return [...ids].map((id) => ({ id, name: WAREHOUSE_NAMES[id] ?? id }));
  }, [current]);

  const allocByProduct = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of whRows) {
      for (const [productId, v] of Object.entries(row.qty)) {
        m.set(productId, (m.get(productId) ?? 0) + (Number(v) || 0));
      }
    }
    return m;
  }, [whRows]);

  const gapByProduct = (o: ExternalOrder) => new Map(o.items.map((it) => [it.productId, it.quantity - (allocByProduct.get(it.productId) ?? 0)]));
  const hasGap = current ? [...gapByProduct(current).values()].some((g) => g > 0) : false;
  const buyEstimates = useMemo(() => (current ? getSelfPurchaseEstimate(current.items) : []), [current]);
  const buyEstimate = buyEstimates.find((e) => e.supplierId === buySupplier);

  /** 分仓发货数量与库存校验后的可提交判断在提交时做，这里仅做按钮可用性 */
  const shipCanSubmit = current && (
    whRows.some((r) => Object.values(r.qty).some((v) => (Number(v) || 0) > 0))
    || (buyEnabled && hasGap && buySupplier)
  );

  const submitShip = () => {
    if (!current) return;
    for (const r of whRows) {
      if (Object.values(r.qty).some((v) => (Number(v) || 0) > 0) && !r.warehouseId) {
        setShipError('请为填写了发货数量的仓库行选择仓库');
        return;
      }
    }
    const shipments = whRows
      .filter((r) => r.warehouseId && Object.values(r.qty).some((v) => (Number(v) || 0) > 0))
      .map((r) => ({
        warehouseId: r.warehouseId,
        warehouseName: whOptions.find((w) => w.id === r.warehouseId)?.name ?? r.warehouseId,
        logisticsCompany: r.logisticsCompany,
        trackingNo: r.trackingNo,
        items: current.items.map((it) => ({ productId: it.productId, productName: it.productName, qty: Number(r.qty[it.productId]) || 0 })),
      }));
    // 分仓数量不得超库存
    for (const sh of shipments) {
      for (const line of sh.items.filter((x) => x.qty > 0)) {
        const whStock = getWarehouseStock(line.productId).find((w) => w.warehouseId === sh.warehouseId);
        if (!whStock || whStock.qty < line.qty) {
          setShipError(`${sh.warehouseName} 的 ${line.productName} 库存不足（可用 ${whStock?.qty ?? 0}）`);
          return;
        }
      }
    }
    const gaps = gapByProduct(current);
    const purchase = buyEnabled && hasGap && buySupplier
      ? {
        supplierId: buySupplier,
        supplierName: buyEstimate?.supplierName ?? '',
        mode: buyMode,
        items: current.items.map((it) => ({ productId: it.productId, quantity: Number(buyQty[it.productId]) || 0 })),
      }
      : undefined;
    if (purchase) {
      for (const line of purchase.items.filter((x) => x.quantity > 0)) {
        const it = current.items.find((x) => x.productId === line.productId)!;
        if (line.quantity < (gaps.get(it.productId) ?? 0)) {
          setShipError(`${it.productName} 采购数量不得低于缺口 ${gaps.get(it.productId)}`);
          return;
        }
      }
    }
    const res = store.getState().shipSelfOrder(current.id, { shipments, purchase });
    if (res.ok) {
      setShipOpen(false);
      setSelectedId(null);
    } else {
      setShipError(res.msg);
    }
  };

  const submitAccept = () => {
    if (!current) return;
    if (!acceptFollower) { setAcceptError('请选择跟单人'); return; }
    const res = store.getState().acceptSelfOrder(current.id, { follower: getEmployeeName(acceptFollower) });
    if (res.ok) { setAcceptError(''); } else { setAcceptError(res.msg); }
  };

  /* 包裹集合（自营包裹 + 关联采购单直发包裹） */
  const ownShipments = current?.selfShipments ?? [];
  const poPackages = currentPos.flatMap((d) => d.packages.filter((x) => x.status !== 'void').map((x) => ({ ...x, poCode: d.code, childOrderCode: d.childOrderCode, supplierName: d.supplierName })));
  const allDelivered = ownShipments.every((x) => x.status === 'delivered') && poPackages.every((x) => x.status === 'delivered')
    && (ownShipments.length + poPackages.length) > 0;

  const renderShipmentRow = (pkg: SelfShipment) => (
    <div key={pkg.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-neutral-100)', borderRadius: 'var(--radius-md)', flexWrap: 'wrap' }}>
      <span className="mono" style={{ fontWeight: 'var(--font-medium)', minWidth: 130 }}>{pkg.packageNo}</span>
      <span style={{ fontSize: 'var(--text-sm)', minWidth: 80 }}>{pkg.warehouseName}</span>
      <span style={{ fontSize: 'var(--text-sm)', flex: 1 }}>{pkg.items.map((i) => `${i.productName}×${i.qty}`).join('、')}</span>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>{pkg.logisticsCompany} <span className="mono">{pkg.trackingNo}</span></span>
      {pkg.status === 'delivered'
        ? pill('#E0F2F1', '#00695C', '已妥投')
        : pill('#E1F5FE', '#0277BD', '运输中')}
      {pkg.status !== 'delivered' && (
        <Button size="sm" variant="ghost" onClick={() => store.getState().deliverSelfShipment(current!.id, pkg.id)}>模拟妥投</Button>
      )}
    </div>
  );

  return (
    <>
      <ContentHeader title="销售单自营" breadcrumbs={['销售', '销售单自营']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          销售单自营处理<strong>分发时转成自营的订单</strong>：<strong>待接单</strong>（接单 / 退回分发，仅详情页操作）→ <strong>已接单</strong>（拆单 → 母子单进入销售单列表；采购&amp;发货：分仓直发 + 缺口以销定采）→
          <strong>已发货运输中</strong>（有物流单号，系统跟踪）→ <strong>妥投</strong>（物流投递完成）→ <strong>确认收货</strong>（人工 / 联机变更）。进入自营后不支持修改订单内容。
        </div>

        {/* 状态阶段 Tab */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          {([['', '全部'], ['pending', '待接单'], ['accepted', '已接单'], ['shipping', '已发货运输中'], ['delivered', '妥投'], ['done', '确认收货']] as const).map(([k, label]) => (
            <button key={k || 'all'} className={`tab-card-simple${tab === k ? ' active' : ''}`} onClick={() => setTab(k as typeof tab)}>
              {label}
              <span className="tab-card-simple-count">{countOf(k as SelfStage | '')}</span>
            </button>
          ))}
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginLeft: 'auto' }}>待接单 → 接单 / 退回 · 已接单 → 拆单 / 采购&amp;发货 · 妥投 → 确认收货</span>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['订单编号', '客户', '商品', '金额', '跟单人', '采购', '状态', '物流', '操作']}
            rows={filtered.map((o) => {
              const st = stageOf(o);
              const meta = STAGE_META[st];
              const pos = posOf(o);
              const pkgs = [
                ...(o.selfShipments ?? []).map((x) => ({ status: x.status, no: x.trackingNo })),
                ...pos.flatMap((d) => d.packages.filter((x) => x.status !== 'void').map((x) => ({ status: x.status, no: x.trackingNo }))),
              ];
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
                  {pkgs.length > 0 ? `${pkgs.length} 包裹 · ${pkgs.filter((x) => x.status === 'delivered').length} 妥投` : '—'}
                </span>,
                <div key="act" className="row-actions">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedId(o.id)}>查看</Button>
                </div>,
              ];
            })}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无自营订单。在「销售单分发」选择「转自营」后，订单将进入本页待接单。
            </div>
          )}
        </Card>
      </div>

      {/* ── 详情抽屉（接单 / 退回 / 拆单 / 采购&发货 / 物流 / 确认收货均在此操作） ── */}
      <DetailDrawer
        open={!!current}
        onClose={() => setSelectedId(null)}
        badge="WB"
        title={current?.code ?? ''}
        statusTag={current ? pill(STAGE_META[stageOf(current)].bg, STAGE_META[stageOf(current)].color, STAGE_META[stageOf(current)].label) : null}
        subtitle={current ? `${EXTERNAL_PLATFORM_LABELS[current.platform]} · ${EXTERNAL_CHANNEL_LABELS[current.sourceChannel]} · ${current.customerName} · ${money(current.totalAmount)}` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedId(null)}>关闭</Button>
            {current && current.processStatus === 'self_pending' && (
              <>
                <Button variant="danger" onClick={() => setReturning(true)}>退回分发</Button>
                <Button onClick={submitAccept}>接单</Button>
              </>
            )}
            {current && current.processStatus === 'self_accepted' && (
              <>
                <Button variant="ghost" onClick={() => { setSplitQty({}); setSplitOpen(true); }}>拆单</Button>
                <Button onClick={() => openShipDialog(current)}>采购&发货</Button>
              </>
            )}
            {current && stageOf(current) === 'shipping' && !allDelivered && (
              <Button onClick={() => store.getState().deliverSelfShipment(current.id)}>全部妥投（模拟物流）</Button>
            )}
            {current && current.processStatus === 'self_delivered' && (
              <Button onClick={() => store.getState().confirmSelfReceipt(current.id)}>确认收货</Button>
            )}
          </>
        }
      >
        {current && (
          <>
            <DrawerSection title="订单信息">
              <InfoGrid>
                <InfoItem label="订单编号" mono emph>{current.code}</InfoItem>
                {current.parentCode && <InfoItem label="母订单编号" mono>{current.parentCode}</InfoItem>}
                <InfoItem label="客户">{current.customerName}（{current.customerType}）</InfoItem>
                <InfoItem label="跟单人">{current.follower ?? '—'}</InfoItem>
                <InfoItem label="订单金额" mono emph valueStyle={{ color: 'var(--color-module-current-base)' }}>{money(current.totalAmount)}</InfoItem>
                <InfoItem label="来源">{EXTERNAL_PLATFORM_LABELS[current.platform]} · {EXTERNAL_CHANNEL_LABELS[current.sourceChannel]}</InfoItem>
                <InfoItem label="录入时间">{current.entryTime}</InfoItem>
                <InfoItem label="收货人">{current.receiver}（{current.receiverPhone}）</InfoItem>
                <InfoItem label="收货地址" span={3}>{current.receiverAddress}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title={`商品明细（${current.items.length} 种）`}>
              <table className="detail-inline-table">
                <thead><tr><th>商品名称</th><th>规格</th><th>订单数量</th><th>已发数量</th><th>缺口</th></tr></thead>
                <tbody>
                  {(() => {
                    const shipped = new Map<string, number>();
                    for (const p of current.selfShipments ?? []) for (const i of p.items) shipped.set(i.productId, (shipped.get(i.productId) ?? 0) + i.qty);
                    return current.items.map((it, idx) => {
                      const done = shipped.get(it.productId) ?? 0;
                      return (
                        <tr key={idx}>
                          <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                          <td>{it.spec}</td>
                          <td className="mono">{it.quantity}</td>
                          <td className="mono" style={{ color: done > 0 ? '#01795D' : undefined }}>{done}</td>
                          <td className="mono" style={{ color: it.quantity - done > 0 ? '#B26A00' : undefined }}>{it.quantity - done}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </DrawerSection>

            {/* 待接单：接单（选跟单人）+ 退回分发（详情页专属操作） */}
            {current.processStatus === 'self_pending' && (
              <DrawerSection title="接单（自营）">
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)', lineHeight: 1.7 }}>
                  接单后订单进入<strong>已接单</strong>，可进行拆单与采购&amp;发货；退回则订单回到<strong>销售单分发 · 分发-待处理</strong>（来源标注「自营退回」）。进入自营后不支持修改订单内容。
                </div>
                {returning ? (
                  <div style={{ padding: 'var(--space-3)', border: '1px solid #FBEDEF', background: '#FFF8F9', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, marginBottom: 'var(--space-2)' }}>
                      确认退回 <strong className="mono">{current.code}</strong> 至销售单分发？退回后重新进入<strong>分发-待处理</strong>，来源将标注「自营退回」。
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Button variant="ghost" size="sm" onClick={() => setReturning(false)}>取消</Button>
                      <Button variant="danger" size="sm" onClick={() => { store.getState().returnToDistribute(current.id); setReturning(false); setSelectedId(null); }}>确认退回</Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 240, flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>跟单人 *</label>
                      <DeptEmployeeSelect value={acceptFollower} onChange={(v: string) => { setAcceptFollower(v); setAcceptError(''); }} placeholder="选择员工" style={{ width: '100%' }} />
                    </div>
                    {acceptError && <span style={{ fontSize: 'var(--text-sm)', color: '#C62828', alignSelf: 'flex-end', paddingBottom: 6 }}>{acceptError}</span>}
                  </div>
                )}
              </DrawerSection>
            )}

            {/* 已接单：拆单 + 采购&发货 */}
            {current.processStatus === 'self_accepted' && (
              <DrawerSection title="执行操作（已接单）">
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)', lineHeight: 1.7 }}>
                  可<strong>拆单</strong>（拆出后母子单在销售单列表独立展示、各自发货），或<strong>采购&amp;发货</strong>（分仓直发 + 缺口以销定采）。
                </div>
                {splitOpen ? (
                  <div style={{ padding: 'var(--space-3)', border: '1px solid var(--color-neutral-100)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)' }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>拆单 · 按商品+数量拆出子订单（编号 {current.code}-N，继承自营已接单）</div>
                    <table className="detail-inline-table">
                      <thead><tr><th>商品</th><th>剩余数量</th><th>拆出数量</th></tr></thead>
                      <tbody>
                        {current.items.map((it) => (
                          <tr key={it.productId}>
                            <td>{it.productName}</td>
                            <td className="mono">{it.quantity}</td>
                            <td>
                              <input className="filter-input mono" type="number" min={0} max={it.quantity} placeholder="0"
                                value={splitQty[it.productName] ?? ''} style={{ width: 90 }}
                                onChange={(e) => setSplitQty((f) => ({ ...f, [it.productName]: e.target.value }))} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      <Button size="sm" variant="ghost" onClick={() => setSplitOpen(false)}>取消</Button>
                      <Button size="sm" disabled={!current.items.some((it) => Number(splitQty[it.productName] ?? 0) > 0)}
                        onClick={() => {
                          const parts = current.items
                            .map((it) => ({ productName: it.productName, quantity: Number(splitQty[it.productName] ?? 0) }))
                            .filter((x) => x.quantity > 0);
                          store.getState().splitOrder(current.id, parts);
                          setSplitOpen(false);
                        }}>确认拆单</Button>
                    </div>
                  </div>
                ) : shipOpen ? (
                  <div style={{ padding: 'var(--space-3)', border: '1px solid var(--color-neutral-100)', borderRadius: 'var(--radius-md)' }}>
                    {/* ── 采购&发货弹窗内容（内嵌） ── */}
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>采购&amp;发货 · {current.code}</div>
                    <table className="detail-inline-table" style={{ marginBottom: 'var(--space-3)' }}>
                      <thead><tr><th>商品</th><th>订单数量</th><th>各仓可用库存</th></tr></thead>
                      <tbody>
                        {current.items.map((it) => (
                          <tr key={it.productId}>
                            <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                            <td className="mono">{it.quantity}</td>
                            <td style={{ fontSize: 'var(--text-sm)' }}>
                              {getWarehouseStock(it.productId).length > 0
                                ? getWarehouseStock(it.productId).map((w) => `${w.warehouseName} ${w.qty}`).join(' · ')
                                : <span style={{ color: '#C13A54' }}>无库存（需以销定采）</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>分仓发货（同一仓库一个快递单号；不同仓库各自单号）</div>
                    {whRows.map((row, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end', flexWrap: 'wrap', padding: 'var(--space-2) 0', borderBottom: '1px dashed var(--color-neutral-100)' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>仓库</label>
                          <select className="filter-select" value={row.warehouseId} style={{ width: 130 }}
                            onChange={(e) => setWhRows((rs) => rs.map((r, i) => (i === idx ? { ...r, warehouseId: e.target.value } : r)))}>
                            {whOptions.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                          </select>
                        </div>
                        {current.items.map((it) => (
                          <div key={it.productId}>
                            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', whiteSpace: 'nowrap' }}>{it.productName}</label>
                            <input className="filter-input mono" type="number" min={0} placeholder="0" style={{ width: 76 }}
                              value={row.qty[it.productId] ?? ''}
                              onChange={(e) => setWhRows((rs) => rs.map((r, i) => (i === idx ? { ...r, qty: { ...r.qty, [it.productId]: e.target.value } } : r)))} />
                          </div>
                        ))}
                        <div>
                          <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>快递公司</label>
                          <select className="filter-select" value={row.logisticsCompany} style={{ width: 110 }}
                            onChange={(e) => setWhRows((rs) => rs.map((r, i) => (i === idx ? { ...r, logisticsCompany: e.target.value } : r)))}>
                            {LOGISTICS_COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>快递单号 *</label>
                          <input className="filter-input mono" placeholder="如 SF1368889999" style={{ width: 150 }}
                            value={row.trackingNo}
                            onChange={(e) => setWhRows((rs) => rs.map((r, i) => (i === idx ? { ...r, trackingNo: e.target.value } : r)))} />
                        </div>
                        {whRows.length > 1 && (
                          <Button size="sm" variant="ghost" onClick={() => setWhRows((rs) => rs.filter((_, i) => i !== idx))}>移除</Button>
                        )}
                      </div>
                    ))}
                    <div style={{ margin: 'var(--space-2) 0' }}>
                      <Button size="sm" variant="ghost" onClick={() => setWhRows((rs) => [...rs, { warehouseId: whOptions[0]?.id ?? '', logisticsCompany: '顺丰速运', trackingNo: '', qty: {} }])}>+ 添加仓库行</Button>
                    </div>

                    {/* 缺口以销定采 */}
                    {hasGap ? (
                      <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>
                          <input type="checkbox" checked={buyEnabled} onChange={(e) => setBuyEnabled(e.target.checked)} />
                          缺口以销定采（生成采购订单，进入「采购 → 采购订单」）
                        </label>
                        {buyEnabled && (
                          <>
                            <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>采购供应商 *（按采购价预估，低价在前）</label>
                                <select className="filter-select" value={buySupplier} style={{ width: 220 }}
                                  onChange={(e) => setBuySupplier(e.target.value)}>
                                  <option value="">选择供应商</option>
                                  {buyEstimates.map((e2) => <option key={e2.supplierId} value={e2.supplierId}>{e2.supplierName}（约 {money(e2.amount)}）</option>)}
                                </select>
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>采购模式</label>
                                <select className="filter-select" value={buyMode} style={{ width: 150 }} onChange={(e) => setBuyMode(e.target.value as 'direct' | 'warehouse')}>
                                  <option value="direct">直发客户（同等数量直发）</option>
                                  <option value="warehouse">入库制（到货后出库）</option>
                                </select>
                              </div>
                            </div>
                            <table className="detail-inline-table">
                              <thead><tr><th>商品</th><th>缺口</th><th>采购数量（可多采，多出入库备货）</th></tr></thead>
                              <tbody>
                                {current.items.map((it) => {
                                  const gap = gapByProduct(current).get(it.productId) ?? 0;
                                  return (
                                    <tr key={it.productId}>
                                      <td>{it.productName}</td>
                                      <td className="mono" style={{ color: gap > 0 ? '#B26A00' : undefined }}>{gap}</td>
                                      <td>
                                        <input className="filter-input mono" type="number" min={0} style={{ width: 90 }}
                                          value={buyQty[it.productId] ?? ''}
                                          onChange={(e) => setBuyQty((f) => ({ ...f, [it.productId]: e.target.value }))} />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: 'var(--text-xs)', color: '#01795D', marginBottom: 'var(--space-2)' }}>分仓发货已覆盖全部商品数量，无需以销定采</div>
                    )}

                    {shipError && <div style={{ padding: '8px 12px', background: '#FFEBEE', color: '#C62828', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>{shipError}</div>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                      <Button variant="ghost" size="sm" onClick={() => setShipOpen(false)}>取消</Button>
                      <Button size="sm" disabled={!shipCanSubmit} onClick={submitShip}>确认发货</Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <Button size="sm" variant="ghost" onClick={() => { setSplitQty({}); setSplitOpen(true); }}>拆单</Button>
                    <Button size="sm" onClick={() => openShipDialog(current)}>采购&发货</Button>
                    {/* 入库制采购到货：入库 / 出库 */}
                    {currentPos.filter((d) => d.deliveryMode === 'warehouse' && d.status === 'confirmed').map((d) => (
                      <Button key={d.id} size="sm" variant="ghost" onClick={() => usePurchaseStore.getState().receiveByChild(d.childOrderCode)}>
                        到货入库（{d.supplierName.slice(0, 6)}）
                      </Button>
                    ))}
                    {(() => {
                      const received = currentPos.filter((d) => d.deliveryMode === 'warehouse' && ['received'].includes(d.status));
                      if (received.length === 0 || (current.selfShipments?.length ?? 0) > 0) return null;
                      return outOpen ? (
                        <span style={{ display: 'inline-flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                          <select className="filter-select" value={outCompany} onChange={(e) => setOutCompany(e.target.value)} style={{ width: 110 }}>
                            {LOGISTICS_COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <input className="filter-input mono" placeholder="快递单号" style={{ width: 140 }} value={outTracking} onChange={(e) => setOutTracking(e.target.value)} />
                          <Button size="sm" disabled={!outTracking.trim()} onClick={() => {
                            const res = store.getState().outboundSelf(current.id, { logisticsCompany: outCompany, trackingNo: outTracking });
                            if (res.ok) { setOutOpen(false); }
                          }}>确认出库</Button>
                        </span>
                      ) : (
                        <Button size="sm" onClick={() => setOutOpen(true)}>到货出库发货</Button>
                      );
                    })()}
                  </div>
                )}
              </DrawerSection>
            )}

            {/* 发货包裹（自营分仓包裹 + 采购单直发包裹）：运输跟踪 → 妥投 */}
            {(ownShipments.length > 0 || poPackages.length > 0) && (
              <DrawerSection title={`发货包裹（${ownShipments.length + poPackages.length} 个）`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {ownShipments.map(renderShipmentRow)}
                  {poPackages.map((pkg) => (
                    <div key={pkg.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-neutral-100)', borderRadius: 'var(--radius-md)', flexWrap: 'wrap' }}>
                      <span className="mono" style={{ fontWeight: 'var(--font-medium)', minWidth: 130 }}>{pkg.packageNo}</span>
                      <span style={{ fontSize: 'var(--text-sm)', minWidth: 80 }}>{pkg.supplierName}</span>
                      <span style={{ fontSize: 'var(--text-sm)', flex: 1 }}>{pkg.items.map((i) => `${i.productName}×${i.qty}`).join('、')}</span>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>{pkg.logisticsCompany} <span className="mono">{pkg.trackingNo}</span></span>
                      {pkg.status === 'delivered'
                        ? pill('#E0F2F1', '#00695C', '已妥投')
                        : pill('#E1F5FE', '#0277BD', '运输中')}
                      {pkg.status !== 'delivered' && (
                        <Button size="sm" variant="ghost" onClick={() => usePurchaseStore.getState().deliverPackage(pkg.childOrderCode, pkg.id)}>模拟妥投</Button>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 'var(--space-2)' }}>
                  系统跟踪物流单号投递状态；全部包裹妥投后订单自动进入「妥投」。采购单直发包裹也可在「采购 → 采购订单」跟踪。
                </div>
              </DrawerSection>
            )}

            {/* 妥投：确认收货 */}
            {current.processStatus === 'self_delivered' && (
              <DrawerSection title="妥投 · 待确认收货">
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', lineHeight: 1.7 }}>
                  全部包裹已投递，待客户确认收货。可由人工点击下方「确认收货」变更，或由联机（客户终端 / 对接系统）自动确认；确认后订单完成并结算关联采购单。
                </div>
              </DrawerSection>
            )}

            {/* 确认收货（完成） */}
            {current.processStatus === 'completed' && (
              <DrawerSection title="确认收货（已完成）">
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', lineHeight: 1.7 }}>
                  客户已确认收货，订单完成；关联采购单已同步结算。
                </div>
              </DrawerSection>
            )}

            <DrawerSection title="处理轨迹">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {current.history.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                    <span className="mono" style={{ color: 'var(--color-neutral-400)', flexShrink: 0 }}>{h.time}</span>
                    <span style={{ fontWeight: 'var(--font-medium)', flexShrink: 0 }}>{h.action}</span>
                    {h.detail && <span style={{ color: 'var(--color-neutral-500)' }}>{h.detail}</span>}
                  </div>
                ))}
              </div>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </>
  );
}
