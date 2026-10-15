import { useState, useMemo } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { PageHead, Pill, ORDER_STATUS_TONE } from './PartnerUI';
import { useReportStore, getTransferredOrders } from '../../stores/reportStore';
import type { PartnerOrder, PartnerOrderStatus } from '../../types';
import {
  partnerOrders as initialOrders,
  PARTNER_DELIVERY_LABELS,
  PARTNER_COOP_LABELS,
  PARTNER_ORDER_STATUS_LABELS,
  PARTNER_TRANSFER_KIND_LABELS,
} from '../../data/partner';

/** 转入类型 → 药丸色调 */
const TRANSFER_TONE: Record<string, 'green' | 'gray' | 'purple' | 'amber'> = {
  'order-self': 'green',
  'order-opportunity': 'gray',
  product: 'purple',
  customer: 'amber',
};

/** 合作商订单管理：平台分发订单 + 报备审批通过后自动转入的订单（直送/入库 × 供应商/服务商模式） */
export default function PartnerOrders() {
  const reports = useReportStore((s) => s.reports);
  /** 报备规则自动转入的订单（商机订单由平台履约） */
  const transferred = useMemo(() => getTransferredOrders(reports), [reports]);
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
    ...transferred.map((t) => (transferOverrides[t.id] ? { ...t, status: transferOverrides[t.id]! } : t)),
    ...manualOrders,
  ], [transferred, transferOverrides, manualOrders]);

  const filtered = useMemo(() => allOrders.filter(o => {
    if (keyword && !o.code.includes(keyword) && !o.customerName.includes(keyword) && !o.receiver.includes(keyword)) return false;
    if (filterDelivery && o.deliveryMode !== filterDelivery) return false;
    if (filterCoop && o.coopMode !== filterCoop) return false;
    if (filterStatus && o.status !== filterStatus) return false;
    return true;
  }), [allOrders, keyword, filterDelivery, filterCoop, filterStatus]);

  const transferCount = transferred.length;

  const updateStatus = (id: string, status: PartnerOrderStatus) => {
    if (id.startsWith('transfer_')) {
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
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">全部状态</option>
          <option value="pending">待接单</option>
          <option value="accepted">已接单</option>
          <option value="shipping">发货中</option>
          <option value="delivered">已签收</option>
          <option value="settled">已结算</option>
          <option value="rejected">已驳回</option>
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
