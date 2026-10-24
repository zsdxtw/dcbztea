import { useState, useMemo, type ReactNode } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { PageHead, Pill, ORDER_STATUS_TONE } from './PartnerUI';
import { getPartnerAuth } from './PartnerLayout';
import { useReportStore, getTransferredOrders } from '../../stores/reportStore';
import { useOrderFlowStore, getPartnerFlowOrders } from '../../stores/orderFlowStore';
import { useSupplierStore } from '../../stores/supplierStore';
import type { PartnerOrder, PartnerOrderStatus } from '../../types';
import {
  partnerOrders as initialOrders,
  PARTNER_DELIVERY_LABELS,
  PARTNER_COOP_LABELS,
  PARTNER_ORDER_STATUS_LABELS,
  PARTNER_TRANSFER_KIND_LABELS,
} from '../../data/partner';

/** 转入类型 → 药丸色调 */
const TRANSFER_TONE: Record<string, 'green' | 'gray' | 'purple' | 'amber' | 'blue'> = {
  'order-self': 'green',
  'order-opportunity': 'gray',
  product: 'purple',
  customer: 'amber',
  assign: 'blue',
  grab: 'green',
  compare: 'purple',
};

/** 订单状态 Tab（原状态下拉框改为列表上方标签页） */
const STATUS_TABS: { key: PartnerOrderStatus | ''; label: string; icon: ReactNode }[] = [
  { key: '', label: '全部状态', icon: <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><rect x="3.5" y="4.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6.5 8h7M6.5 11.5h4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { key: 'pending', label: '待接单', icon: <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M10 6v4l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { key: 'accepted', label: '已接单', icon: <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { key: 'shipping', label: '发货中', icon: <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><path d="M3 6.5h9V14H3zM12 9.5h3l2 3V14h-5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><circle cx="6.5" cy="15.5" r="1.6" stroke="currentColor" strokeWidth="1.3"/><circle cx="14.5" cy="15.5" r="1.6" stroke="currentColor" strokeWidth="1.3"/></svg> },
  { key: 'delivered', label: '已签收', icon: <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><path d="M10 3l7 3v8l-7 3-7-3V6l7-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 10.5l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { key: 'settled', label: '已结算', icon: <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M8 7l2 3 2-3M10 10v4.5M7.8 11h4.4M7.8 13h4.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { key: 'rejected', label: '已驳回', icon: <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
];

/** 合作商订单管理：平台分发订单 + 报备审批通过后自动转入的订单 + 外部订单流转转入（报备/指定/抢单/比单） */
export default function PartnerOrders() {
  const reports = useReportStore((s) => s.reports);
  /** 报备规则自动转入的订单（商机订单由平台履约） */
  const transferred = useMemo(() => getTransferredOrders(reports), [reports]);
  /** 外部订单流转中心转入的订单（按当前登录合作商过滤） */
  const flowOrdersVersion = useOrderFlowStore((s) => s.orders);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const flowOrders = useMemo(() => {
    const auth = getPartnerAuth();
    const myId = auth?.supplierId ?? suppliers.find((s) => s.terminal.enabled && s.terminal.username === auth?.username)?.id;
    return myId ? getPartnerFlowOrders(myId) : [];
  }, [flowOrdersVersion, suppliers]);
  /** 平台分发的手动订单 */
  const [manualOrders, setManualOrders] = useState<PartnerOrder[]>(initialOrders);
  /** 转入订单的状态覆盖（接单/发货等操作仅存于本次会话） */
  const [transferOverrides, setTransferOverrides] = useState<Record<string, PartnerOrderStatus>>({});
  const [keyword, setKeyword] = useState('');
  const [filterDelivery, setFilterDelivery] = useState('');
  const [filterCoop, setFilterCoop] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<PartnerOrder | null>(null);

  const allOrders = useMemo(() => [
    ...flowOrders,
    ...transferred.map((t) => (transferOverrides[t.id] ? { ...t, status: transferOverrides[t.id]! } : t)),
    ...manualOrders,
  ], [flowOrders, transferred, transferOverrides, manualOrders]);

  /** 应用搜索/配送/合作模式筛选（不含状态）后的订单：供状态 Tab 计数与状态过滤复用 */
  const baseOrders = useMemo(() => allOrders.filter(o => {
    if (keyword && !o.code.includes(keyword) && !o.customerName.includes(keyword) && !o.receiver.includes(keyword)) return false;
    if (filterDelivery && o.deliveryMode !== filterDelivery) return false;
    if (filterCoop && o.coopMode !== filterCoop) return false;
    return true;
  }), [allOrders, keyword, filterDelivery, filterCoop]);

  /** 各状态 Tab 的订单数（随搜索与其它筛选联动） */
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    STATUS_TABS.forEach(t => { c[t.key] = t.key === '' ? baseOrders.length : baseOrders.filter(o => o.status === t.key).length; });
    return c;
  }, [baseOrders]);

  const filtered = useMemo(
    () => (filterStatus ? baseOrders.filter(o => o.status === filterStatus) : baseOrders),
    [baseOrders, filterStatus],
  );

  const transferCount = transferred.length;

  const updateStatus = (id: string, status: PartnerOrderStatus) => {
    if (id.startsWith('ext_')) {
      // 外部订单流转中心转入的订单：状态回写 orderFlowStore（结算自动写积分台账）
      useOrderFlowStore.getState().advancePartner(id.replace('ext_', ''), status, { onTime: true });
    } else if (id.startsWith('transfer_')) {
      setTransferOverrides((prev) => ({ ...prev, [id]: status }));
    } else {
      setManualOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    }
    setSelected((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
  };

  const statusPill = (status: PartnerOrderStatus) => (
    <Pill tone={ORDER_STATUS_TONE[status]}>{PARTNER_ORDER_STATUS_LABELS[status]}</Pill>
  );

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 订单"
        title="订单管理"
        desc="订单来源于平台分发与报备转入。配送方式：直送订单（合作商直发客户）与入库订单（先入合作仓再发）；合作模式：供应商模式与服务商模式。商机报备转入的订单由平台进货发货，仅同步展示。"
      />

      {/* 订单状态 Tab 卡片 */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        {STATUS_TABS.map(t => (
          <button key={t.key || 'all'} className={`tab-card-simple${filterStatus === t.key ? ' active' : ''}`} onClick={() => setFilterStatus(t.key)}>
            {t.icon}
            {t.label}
            <span className="tab-card-simple-count">{statusCounts[t.key] ?? 0} 单</span>
          </button>
        ))}
      </div>

      {/* 筛选 */}
      <div className="pk-toolbar">
        <input className="filter-input" placeholder="搜索订单号、客户、收货人..." value={keyword} onChange={e => setKeyword(e.target.value)} />
        <select className="filter-select" value={filterDelivery} onChange={e => setFilterDelivery(e.target.value)}>
          <option value="">全部配送方式</option>
          <option value="direct">直送订单</option>
          <option value="warehouse">入库订单</option>
        </select>
        <select className="filter-select" value={filterCoop} onChange={e => setFilterCoop(e.target.value)}>
          <option value="">全部合作模式</option>
          <option value="supplier">供应商模式</option>
          <option value="service">服务商模式</option>
        </select>
        <span className="pk-count">共 {filtered.length} 单{transferCount > 0 ? ` · 含报备转入 ${transferCount} 单` : ''}</span>
      </div>

      <div className="pk-table-panel">
        <Table
          headers={['订单编号', '客户', '商品数', '总金额', '配送方式', '合作模式', '状态', '下单日期', '操作']}
          rows={filtered.map(o => {
            /** 商机报备订单：平台履约，合作商不可操作 */
            const platformHandled = o.transferKind === 'order-opportunity';
            return [
              <div key="code" style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <span className="cell-mono-emph">{o.code}</span>
                {o.transferKind && (
                  <Pill tone={TRANSFER_TONE[o.transferKind]}>{PARTNER_TRANSFER_KIND_LABELS[o.transferKind]}</Pill>
                )}
                {platformHandled && <Pill tone="blue">平台履约</Pill>}
              </div>,
              <span key="cust" className="cell-emph">{o.customerName}</span>,
              <span key="cnt" className="mono">{o.items.length} 种</span>,
              <span key="amt" className="mono" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--pk-accent)' }}>¥{o.totalAmount.toLocaleString()}</span>,
              <Pill key="dm" tone={o.deliveryMode === 'direct' ? 'green' : 'blue'}>{PARTNER_DELIVERY_LABELS[o.deliveryMode]}</Pill>,
              <Pill key="cm" tone={o.coopMode === 'supplier' ? 'amber' : 'purple'}>{PARTNER_COOP_LABELS[o.coopMode]}</Pill>,
              statusPill(o.status),
              <span key="date" className="cell-muted">{o.orderDate}</span>,
              <div key="act" className="row-actions">
                {!platformHandled && o.status === 'pending' && <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, 'accepted')}>接单</Button>}
                {!platformHandled && o.status === 'accepted' && <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, 'shipping')}>发货</Button>}
                {!platformHandled && o.status === 'shipping' && <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, 'delivered')}>确认签收</Button>}
                <Button size="sm" variant="ghost" onClick={() => setSelected(o)}>查看</Button>
              </div>,
            ];
          })}
        />
      </div>

      {/* 订单详情抽屉 */}
      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        badge="PO"
        title={selected?.code ?? ''}
        statusTag={selected ? statusPill(selected.status) : null}
        subtitle={selected ? `${selected.customerName}（${selected.customerType}）· ${PARTNER_DELIVERY_LABELS[selected.deliveryMode]} · ${PARTNER_COOP_LABELS[selected.coopMode]}` : ''}
        hideFooter
        footer={
          selected && (
            <>
              <Button variant="ghost" onClick={() => setSelected(null)}>关闭</Button>
              {selected.transferKind !== 'order-opportunity' && selected.status === 'pending' && <Button onClick={() => updateStatus(selected.id, 'accepted')}>接单</Button>}
              {selected.transferKind !== 'order-opportunity' && selected.status === 'accepted' && <Button onClick={() => updateStatus(selected.id, 'shipping')}>发货</Button>}
              {selected.transferKind !== 'order-opportunity' && selected.status === 'shipping' && <Button onClick={() => updateStatus(selected.id, 'delivered')}>确认签收</Button>}
            </>
          )
        }
      >
        {selected && (
          <>
            <DrawerSection title="订单信息">
              <InfoGrid>
                <InfoItem label="订单编号" mono emph>{selected.code}</InfoItem>
                <InfoItem label="客户名称">{selected.customerName}</InfoItem>
                <InfoItem label="客户类型">{selected.customerType}</InfoItem>
                <InfoItem label="配送方式">{PARTNER_DELIVERY_LABELS[selected.deliveryMode]}</InfoItem>
                <InfoItem label="合作模式">{PARTNER_COOP_LABELS[selected.coopMode]}</InfoItem>
                <InfoItem label="订单状态">{PARTNER_ORDER_STATUS_LABELS[selected.status]}</InfoItem>
                <InfoItem label="下单日期">{selected.orderDate}</InfoItem>
                <InfoItem label="预计发货">{selected.expectedShipDate}</InfoItem>
                <InfoItem label="总金额" mono emph valueStyle={{ color: 'var(--color-module-current-base)' }}>¥{selected.totalAmount.toLocaleString()}</InfoItem>
                {selected.sourceReport && (
                  <InfoItem label="转入来源" span={3}>
                    {PARTNER_TRANSFER_KIND_LABELS[selected.transferKind ?? 'product']}
                    {' '}（报备编号 <span className="mono">{selected.sourceReport}</span>，审批通过后自动转入）
                  </InfoItem>
                )}
                {selected.transferKind === 'order-opportunity' && (
                  <InfoItem label="履约方式" span={3}>商机报备订单，由平台进货发货处理，本终端仅同步展示、无需履约</InfoItem>
                )}
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title={`商品明细（${selected.items.length} 种）`}>
              <table className="detail-inline-table">
                <thead>
                  <tr><th>商品名称</th><th>规格</th><th>数量</th><th>单价</th><th>小计</th></tr>
                </thead>
                <tbody>
                  {selected.items.map((it, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                      <td>{it.spec}</td>
                      <td className="mono">{it.quantity}</td>
                      <td className="mono">¥{it.price}</td>
                      <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>¥{(it.quantity * it.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DrawerSection>

            <DrawerSection title="收货信息">
              <InfoGrid>
                <InfoItem label="收货人">{selected.receiver}</InfoItem>
                <InfoItem label="联系电话" mono>{selected.receiverPhone}</InfoItem>
                <InfoItem label="收货地址" span={3}>{selected.receiverAddress}</InfoItem>
                <InfoItem label="备注" span={3}>{selected.remark || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </div>
  );
}
