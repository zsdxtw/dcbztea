import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { PageHead, Pill, CUST_ORDER_STATUS_TONE, getCustomerAuth } from './CustomerUI';
import { useCustomerStore } from '../../stores/customerStore';
import { CUSTOMER_ORDER_STATUS_LABELS } from '../../data/customer';
import type { CustomerOrder } from '../../types';
import '../partner/partner.css';
import './customer.css';

const STATUS_TABS = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待确认' },
  { key: 'confirmed', label: '已确认' },
  { key: 'shipping', label: '配送中' },
  { key: 'delivered', label: '待签收' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

/** 我的订单：查询与跟踪自助下单的订单（待确认可取消、送达可签收） */
export default function CustomerOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getCustomerAuth();
  const orders = useCustomerStore((s) => s.orders.filter(o => o.customerName === auth?.customerName));
  const cancelOrder = useCustomerStore((s) => s.cancelOrder);
  const confirmReceipt = useCustomerStore((s) => s.confirmReceipt);
  const reorder = useCustomerStore((s) => s.reorder);

  const [tab, setTab] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<CustomerOrder | null>(null);
  /** 刚下单的提示 */
  const placedCode = (location.state as { placed?: string } | null)?.placed ?? '';

  const filtered = orders.filter(o => {
    if (tab && o.status !== tab) return false;
    if (keyword && !o.code.includes(keyword) && !o.items.some(it => it.productName.includes(keyword))) return false;
    return true;
  });

  const countOf = (key: string) => key ? orders.filter(o => o.status === key).length : orders.length;

  const statusPill = (status: string) => (
    <Pill tone={CUST_ORDER_STATUS_TONE[status]}>{CUSTOMER_ORDER_STATUS_LABELS[status]}</Pill>
  );

  /** 同步抽屉内的最新状态 */
  const current = selected ? orders.find(o => o.id === selected.id) ?? selected : null;

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="客户终端 · 订单"
        title="我的订单"
        desc="跟踪自助下单订单的确认、配送与签收进度。待确认订单可取消，已送达订单请确认收货，已完成订单可一键再来一单。"
      />

      {placedCode && (
        <div className="pk-panel" style={{ marginBottom: 18, borderColor: 'var(--pk-accent)', background: 'var(--pk-accent-soft)' }}>
          <div style={{ padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--pk-accent-dark)' }}>
            <svg viewBox="0 0 16 16" fill="none" style={{ width: 16, height: 16, flexShrink: 0 }}>
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M5.5 8.2l1.7 1.7 3.3-3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            订单 <b className="mono">{placedCode}</b> 已提交成功，等待平台确认。确认前可在列表中取消。
          </div>
        </div>
      )}

      {/* 状态 Tab */}
      <div className="pk-tabs">
        {STATUS_TABS.map(t => (
          <button key={t.key} className={`pk-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
            <span className="pk-tab-n">{countOf(t.key)}</span>
          </button>
        ))}
      </div>

      {/* 筛选 */}
      <div className="pk-toolbar">
        <input className="filter-input" placeholder="搜索订单编号或商品名称..." value={keyword} onChange={e => setKeyword(e.target.value)} />
        <span className="pk-count">共 {filtered.length} 单</span>
      </div>

      <div className="pk-table-panel">
        <Table
          headers={['订单编号', '商品', '件数', '订单金额', '状态', '下单日期', '操作']}
          rows={filtered.map(o => [
            <span key="code" className="cell-mono-emph">{o.code}</span>,
            <span key="prod" className="cell-emph" style={{ whiteSpace: 'nowrap' }}>
              {o.items[0].productName}{o.items.length > 1 ? ` 等 ${o.items.length} 种` : ''}
            </span>,
            <span key="qty" className="mono">{o.items.reduce((sum, it) => sum + it.quantity, 0)} 件</span>,
            <span key="amt" className="mono" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--pk-accent)' }}>¥{o.totalAmount.toLocaleString()}</span>,
            statusPill(o.status),
            <span key="date" className="cell-muted">{o.orderDate}</span>,
            <div key="act" className="row-actions">
              {o.status === 'pending' && <Button size="sm" variant="ghost" onClick={() => cancelOrder(o.id)}>取消订单</Button>}
              {o.status === 'delivered' && <Button size="sm" variant="ghost" onClick={() => confirmReceipt(o.id)}>确认收货</Button>}
              {(o.status === 'completed' || o.status === 'cancelled') && (
                <Button size="sm" variant="ghost" onClick={() => { reorder(o); navigate('/customer/cart'); }}>再来一单</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setSelected(o)}>查看</Button>
            </div>,
          ])}
        />
      </div>

      {/* 订单详情抽屉 */}
      <DetailDrawer
        open={!!current}
        onClose={() => setSelected(null)}
        badge="CO"
        title={current?.code ?? ''}
        statusTag={current ? statusPill(current.status) : null}
        subtitle={current ? `${current.customerName} · ${current.orderDate} · ¥${current.totalAmount.toLocaleString()}` : ''}
        hideFooter
        footer={
          current && (
            <>
              <Button variant="ghost" onClick={() => setSelected(null)}>关闭</Button>
              {current.status === 'pending' && <Button onClick={() => cancelOrder(current.id)}>取消订单</Button>}
              {current.status === 'delivered' && <Button onClick={() => confirmReceipt(current.id)}>确认收货</Button>}
              {(current.status === 'completed' || current.status === 'cancelled') && (
                <Button onClick={() => { reorder(current); setSelected(null); navigate('/customer/cart'); }}>再来一单</Button>
              )}
            </>
          )
        }
      >
        {current && (
          <>
            <DrawerSection title="订单信息">
              <InfoGrid>
                <InfoItem label="订单编号" mono emph>{current.code}</InfoItem>
                <InfoItem label="下单客户">{current.customerName}</InfoItem>
                <InfoItem label="订单状态">{CUSTOMER_ORDER_STATUS_LABELS[current.status]}</InfoItem>
                <InfoItem label="下单日期">{current.orderDate}</InfoItem>
                <InfoItem label="商品种数">{current.items.length} 种</InfoItem>
                <InfoItem label="订单金额" mono emph valueStyle={{ color: 'var(--pk-accent)' }}>¥{current.totalAmount.toLocaleString()}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title={`商品明细（${current.items.length} 种）`}>
              <table className="detail-inline-table">
                <thead>
                  <tr><th>商品名称</th><th>规格</th><th>数量</th><th>单价</th><th>小计</th></tr>
                </thead>
                <tbody>
                  {current.items.map((it, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                      <td>{it.spec}</td>
                      <td className="mono">{it.quantity}</td>
                      <td className="mono">¥{it.price.toLocaleString()}</td>
                      <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>¥{(it.quantity * it.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DrawerSection>

            <DrawerSection title="收货信息">
              <InfoGrid>
                <InfoItem label="收货人">{current.receiver}</InfoItem>
                <InfoItem label="联系电话" mono>{current.receiverPhone}</InfoItem>
                <InfoItem label="收货地址" span={3}>{current.receiverAddress}</InfoItem>
                <InfoItem label="买家备注" span={3}>{current.remark || '—'}</InfoItem>
                <InfoItem label="平台回复" span={3}>{current.sellerNote || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </div>
  );
}
