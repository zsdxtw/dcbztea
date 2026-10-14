import { useState, useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import type { PartnerOrder, PartnerOrderStatus } from '../../types';
import {
  partnerOrders as initialOrders,
  PARTNER_DELIVERY_LABELS,
  PARTNER_COOP_LABELS,
  PARTNER_ORDER_STATUS_LABELS,
  PARTNER_ORDER_STATUS_COLORS,
} from '../../data/partner';

/** 合作商订单管理：处理淡茶半盏后台分发的订单（直送/入库 × 供应商/服务商模式） */
export default function PartnerOrders() {
  const [orders, setOrders] = useState<PartnerOrder[]>(initialOrders);
  const [keyword, setKeyword] = useState('');
  const [filterDelivery, setFilterDelivery] = useState('');
  const [filterCoop, setFilterCoop] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<PartnerOrder | null>(null);

  const filtered = useMemo(() => orders.filter(o => {
    if (keyword && !o.code.includes(keyword) && !o.customerName.includes(keyword) && !o.receiver.includes(keyword)) return false;
    if (filterDelivery && o.deliveryMode !== filterDelivery) return false;
    if (filterCoop && o.coopMode !== filterCoop) return false;
    if (filterStatus && o.status !== filterStatus) return false;
    return true;
  }), [orders, keyword, filterDelivery, filterCoop, filterStatus]);

  const updateStatus = (id: string, status: PartnerOrderStatus) => {
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)));
    setSelected(prev => (prev && prev.id === id ? { ...prev, status } : prev));
  };

  const statusTag = (status: PartnerOrderStatus) => (
    <span style={{
      padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
      background: PARTNER_ORDER_STATUS_COLORS[status].bg, color: PARTNER_ORDER_STATUS_COLORS[status].color,
    }}>{PARTNER_ORDER_STATUS_LABELS[status]}</span>
  );

  const modeTag = (bg: string, color: string, text: string) => (
    <span style={{ padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color }}>{text}</span>
  );

  return (
    <>
      <ContentHeader title="订单管理" breadcrumbs={['合作商终端', '订单', '订单管理']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)' }}>
          订单来源于淡茶半盏后台分发。配送方式：<strong>直送订单</strong>（合作商直发客户）与<strong>入库订单</strong>（先入合作仓再发）；合作模式：<strong>供应商模式</strong>与<strong>服务商模式</strong>。
        </div>

        {/* 筛选 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
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
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>共 {filtered.length} 单</span>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['订单编号', '客户', '商品数', '总金额', '配送方式', '合作模式', '状态', '下单日期', '操作']}
            rows={filtered.map(o => [
              <span key="code" className="cell-mono-emph">{o.code}</span>,
              <span key="cust" className="cell-emph">{o.customerName}</span>,
              <span key="cnt" className="mono">{o.items.length} 种</span>,
              <span key="amt" className="mono" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)' }}>¥{o.totalAmount.toLocaleString()}</span>,
              <span key="dm">{modeTag(o.deliveryMode === 'direct' ? '#E8F5E9' : '#E3F2FD', o.deliveryMode === 'direct' ? '#01795D' : '#0F64B5', PARTNER_DELIVERY_LABELS[o.deliveryMode])}</span>,
              <span key="cm">{modeTag(o.coopMode === 'supplier' ? '#FFF8E1' : '#F3E5F5', o.coopMode === 'supplier' ? '#B8860B' : '#7B1FA2', PARTNER_COOP_LABELS[o.coopMode])}</span>,
              statusTag(o.status),
              <span key="date" className="cell-muted">{o.orderDate}</span>,
              <div key="act" className="row-actions">
                {o.status === 'pending' && <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, 'accepted')}>接单</Button>}
                {o.status === 'accepted' && <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, 'shipping')}>发货</Button>}
                {o.status === 'shipping' && <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, 'delivered')}>确认签收</Button>}
                <Button size="sm" variant="ghost" onClick={() => setSelected(o)}>查看</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      {/* 订单详情抽屉 */}
      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        badge="PO"
        title={selected?.code ?? ''}
        statusTag={selected ? statusTag(selected.status) : null}
        subtitle={selected ? `${selected.customerName}（${selected.customerType}）· ${PARTNER_DELIVERY_LABELS[selected.deliveryMode]} · ${PARTNER_COOP_LABELS[selected.coopMode]}` : ''}
        hideFooter
        footer={
          selected && (
            <>
              <Button variant="ghost" onClick={() => setSelected(null)}>关闭</Button>
              {selected.status === 'pending' && <Button onClick={() => updateStatus(selected.id, 'accepted')}>接单</Button>}
              {selected.status === 'accepted' && <Button onClick={() => updateStatus(selected.id, 'shipping')}>发货</Button>}
              {selected.status === 'shipping' && <Button onClick={() => updateStatus(selected.id, 'delivered')}>确认签收</Button>}
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
    </>
  );
}
