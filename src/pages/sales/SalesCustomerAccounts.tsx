import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useCustomerStore } from '../../stores/customerStore';
import { customerItems } from '../../data/customers';
import { CUSTOMER_ORDER_STATUS_LABELS } from '../../data/customer';
import type { CustomerAccount, CustomerItem, CustomerOrder } from '../../types';

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

const ACC_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active: { bg: '#E8F5E9', color: '#01795D' },
  disabled: { bg: '#FFEBEE', color: '#C62828' },
};
const ORDER_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FFF3E0', color: '#E65100' },
  confirmed: { bg: '#E3F2FD', color: '#0F64B5' },
  shipping: { bg: '#E8EAF6', color: '#3949AB' },
  delivered: { bg: '#E8F5E9', color: '#01795D' },
  completed: { bg: '#F3E5F5', color: '#7B1FA2' },
  cancelled: { bg: '#FFEBEE', color: '#C62828' },
};

/** 开通账号表单 */
interface OpenForm {
  username: string;
  password: string;
  name: string;
  phone: string;
  remark: string;
}

/** 管理台-销售-客户下单账号：为直营客户开通/管理客户终端下单账号，处理客户终端订单 */
export default function SalesCustomerAccounts() {
  const accounts = useCustomerStore((s) => s.accounts);
  const orders = useCustomerStore((s) => s.orders);
  const openAccount = useCustomerStore((s) => s.openAccount);
  const setAccountStatus = useCustomerStore((s) => s.setAccountStatus);
  const resetPassword = useCustomerStore((s) => s.resetPassword);
  const reviewOrder = useCustomerStore((s) => s.reviewOrder);

  const [tab, setTab] = useState<'accounts' | 'orders'>('accounts');
  const [keyword, setKeyword] = useState('');

  /** 开通弹窗 */
  const [opening, setOpening] = useState<CustomerItem | null>(null);
  const [openForm, setOpenForm] = useState<OpenForm>({ username: '', password: '123456', name: '', phone: '', remark: '' });
  const [openError, setOpenError] = useState('');

  /** 重置密码弹窗 */
  const [resetting, setResetting] = useState<CustomerAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');

  /** 取消订单弹窗 */
  const [cancelling, setCancelling] = useState<CustomerOrder | null>(null);
  const [cancelNote, setCancelNote] = useState('');

  /** 订单详情抽屉 */
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);

  /** 直营客户（含未开通） */
  const directCustomers = useMemo(() => customerItems.filter(c => c.type === 'direct'), []);
  const accountOf = (customerName: string) => accounts.find(a => a.customerName === customerName);

  const filteredCustomers = useMemo(() => directCustomers.filter(c => {
    if (!keyword) return true;
    return c.name.includes(keyword) || (c.customerCode ?? '').includes(keyword) || c.region.includes(keyword);
  }), [directCustomers, keyword]);

  const filteredOrders = useMemo(() => orders.filter(o => {
    if (!keyword) return true;
    return o.code.includes(keyword) || o.customerName.includes(keyword) ||
      o.items.some(it => it.productName.includes(keyword));
  }), [orders, keyword]);

  const activeCount = accounts.filter(a => a.status === 'active').length;
  const pendingOrderCount = orders.filter(o => o.status === 'pending').length;

  const accStatusTag = (a?: CustomerAccount) =>
    a
      ? pill(ACC_STATUS_STYLE[a.status].bg, ACC_STATUS_STYLE[a.status].color, a.status === 'active' ? '正常' : '已停用')
      : pill('#F5F5F5', '#9E9E9E', '未开通');

  const orderStatusTag = (status: string) =>
    pill(ORDER_STATUS_STYLE[status].bg, ORDER_STATUS_STYLE[status].color, CUSTOMER_ORDER_STATUS_LABELS[status]);

  /** 打开开通弹窗（预填建议账号与客户联系人） */
  const openOpenDialog = (customer: CustomerItem) => {
    const suggest = `kh${String(accounts.length + 1).padStart(3, '0')}`;
    setOpenForm({
      username: suggest,
      password: '123456',
      name: customer.contactPerson ?? '',
      phone: customer.contactPhone ?? '',
      remark: '',
    });
    setOpenError('');
    setOpening(customer);
  };

  /** 确认开通 */
  const confirmOpen = () => {
    if (!opening) return;
    const username = openForm.username.trim();
    if (!username || !openForm.password.trim() || !openForm.name.trim()) {
      setOpenError('登录账号、初始密码与账号名称为必填');
      return;
    }
    if (accounts.some(a => a.username === username)) {
      setOpenError('登录账号已存在，请更换');
      return;
    }
    openAccount({
      id: `ca_${Date.now()}`,
      username,
      password: openForm.password.trim(),
      name: openForm.name.trim(),
      customerName: opening.name,
      customerCode: opening.customerCode ?? '—',
      phone: openForm.phone.trim() || '—',
      status: 'active',
      createTime: new Date().toISOString().slice(0, 10),
      remark: openForm.remark.trim() || undefined,
    });
    setOpening(null);
  };

  const todayOrders = orders.filter(o => o.status === 'pending');

  const currentOrder = selectedOrder ? orders.find(o => o.id === selectedOrder.id) ?? selectedOrder : null;

  return (
    <>
      <ContentHeader title="客户下单账号" breadcrumbs={['销售', '客户下单账号']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          为<strong>直营客户</strong>开通客户终端下单账号，客户凭账号登录 <span className="mono">/customer/login</span> 在线选购茶品并自助下单。
          <strong>待确认</strong>订单需平台确认后发货；账号可随时停用或重置密码。
        </div>

        {/* Tab 切换 */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <button className={`tab-card-simple${tab === 'accounts' ? ' active' : ''}`} onClick={() => setTab('accounts')}>
            <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 8h6M7 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            下单账号
            <span className="tab-card-simple-count">{activeCount} 个启用 / {directCustomers.length} 家直营客户</span>
          </button>
          <button className={`tab-card-simple${tab === 'orders' ? ' active' : ''}`} onClick={() => setTab('orders')}>
            <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6h6M7 9h6M7 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            客户终端订单
            <span className="tab-card-simple-count">待确认 {pendingOrderCount} 单</span>
          </button>
        </div>

        {/* 筛选 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <input
            className="filter-input"
            placeholder={tab === 'accounts' ? '搜索客户名称、编号、区域...' : '搜索订单编号、客户、商品...'}
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
            {tab === 'accounts' ? `共 ${filteredCustomers.length} 家直营客户` : `共 ${filteredOrders.length} 单`}
          </span>
        </div>

        {/* ── 下单账号 Tab ── */}
        {tab === 'accounts' && (
          <Card style={{ padding: 0 }}>
            <Table
              headers={['客户编号', '客户名称', '区域', '等级', '联系人', '下单账号', '账号状态', '开通时间', '最近登录', '操作']}
              rows={filteredCustomers.map(c => {
                const acc = accountOf(c.name);
                return [
                  <span key="code" className="cell-mono-emph">{c.customerCode ?? '—'}</span>,
                  <span key="name" className="cell-emph">{c.name}</span>,
                  <span key="region">{c.region}</span>,
                  <span key="level">{c.level ?? '—'}</span>,
                  <span key="contact" style={{ fontSize: 'var(--text-sm)' }}>
                    {c.contactPerson}
                    <span style={{ color: 'var(--color-neutral-400)', marginLeft: 6 }} className="mono">{c.contactPhone}</span>
                  </span>,
                  acc
                    ? <span key="acc" className="cell-emph mono">{acc.username}<span style={{ color: 'var(--color-neutral-400)', fontWeight: 400, marginLeft: 6, fontSize: 'var(--text-sm)' }}>{acc.name}</span></span>
                    : <span key="acc" style={{ color: 'var(--color-neutral-300)' }}>未开通</span>,
                  accStatusTag(acc),
                  <span key="ct" className="cell-muted">{acc?.createTime ?? '—'}</span>,
                  <span key="ll" className="cell-muted">{acc?.lastLogin ?? '—'}</span>,
                  <div key="act" className="row-actions">
                    {!acc && <Button size="sm" onClick={() => openOpenDialog(c)}>开通下单账号</Button>}
                    {acc && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => { setResetting(acc); setNewPassword(''); }}>重置密码</Button>
                        {acc.status === 'active'
                          ? <Button size="sm" variant="danger" onClick={() => setAccountStatus(acc.id, 'disabled')}>停用</Button>
                          : <Button size="sm" variant="ghost" onClick={() => setAccountStatus(acc.id, 'active')}>启用</Button>}
                      </>
                    )}
                  </div>,
                ];
              })}
            />
          </Card>
        )}

        {/* ── 客户终端订单 Tab ── */}
        {tab === 'orders' && (
          <Card style={{ padding: 0 }}>
            <Table
              headers={['订单编号', '下单客户', '商品', '件数', '订单金额', '状态', '下单日期', '操作']}
              rows={filteredOrders.map(o => [
                <span key="code" className="cell-mono-emph">{o.code}</span>,
                <span key="cust" className="cell-emph">{o.customerName}</span>,
                <span key="prod" style={{ whiteSpace: 'nowrap' }}>
                  {o.items[0].productName}{o.items.length > 1 ? ` 等 ${o.items.length} 种` : ''}
                </span>,
                <span key="qty" className="mono">{o.items.reduce((s, it) => s + it.quantity, 0)}</span>,
                <span key="amt" className="mono" style={{ fontWeight: 'var(--font-semibold)' }}>¥{o.totalAmount.toLocaleString()}</span>,
                orderStatusTag(o.status),
                <span key="date" className="cell-muted">{o.orderDate}</span>,
                <div key="act" className="row-actions">
                  {o.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => reviewOrder(o.id, 'confirmed', '订单已确认，安排发货')}>确认订单</Button>
                      <Button size="sm" variant="danger" onClick={() => { setCancelling(o); setCancelNote(''); }}>取消订单</Button>
                    </>
                  )}
                  {o.status === 'confirmed' && <Button size="sm" onClick={() => reviewOrder(o.id, 'shipping', '商品已发出')}>发货</Button>}
                  {o.status === 'shipping' && <Button size="sm" onClick={() => reviewOrder(o.id, 'delivered', '订单已送达，等待客户确认收货')}>确认送达</Button>}
                  {o.status === 'delivered' && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>待客户签收</span>}
                  <Button size="sm" variant="ghost" onClick={() => setSelectedOrder(o)}>查看</Button>
                </div>,
              ])}
            />
            {todayOrders.length > 0 && (
              <div style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
                共 {todayOrders.length} 笔待确认订单，客户在终端下单后需平台确认方可发货
              </div>
            )}
          </Card>
        )}
      </div>

      {/* 订单详情抽屉 */}
      <DetailDrawer
        open={!!currentOrder}
        onClose={() => setSelectedOrder(null)}
        badge="KHD"
        title={currentOrder?.code ?? ''}
        statusTag={currentOrder ? orderStatusTag(currentOrder.status) : null}
        subtitle={currentOrder ? `${currentOrder.customerName} · 客户终端自助下单 · ${currentOrder.orderDate}` : ''}
        hideFooter
        footer={
          currentOrder && (
            <>
              <Button variant="ghost" onClick={() => setSelectedOrder(null)}>关闭</Button>
              {currentOrder.status === 'pending' && (
                <>
                  <Button variant="danger" onClick={() => { setCancelling(currentOrder); setCancelNote(''); setSelectedOrder(null); }}>取消订单</Button>
                  <Button onClick={() => reviewOrder(currentOrder.id, 'confirmed', '订单已确认，安排发货')}>确认订单</Button>
                </>
              )}
              {currentOrder.status === 'confirmed' && <Button onClick={() => reviewOrder(currentOrder.id, 'shipping', '商品已发出')}>发货</Button>}
              {currentOrder.status === 'shipping' && <Button onClick={() => reviewOrder(currentOrder.id, 'delivered', '订单已送达，等待客户确认收货')}>确认送达</Button>}
            </>
          )
        }
      >
        {currentOrder && (
          <>
            <DrawerSection title="订单信息">
              <InfoGrid>
                <InfoItem label="订单编号" mono emph>{currentOrder.code}</InfoItem>
                <InfoItem label="下单客户">{currentOrder.customerName}</InfoItem>
                <InfoItem label="订单来源">客户终端自助下单</InfoItem>
                <InfoItem label="订单状态">{CUSTOMER_ORDER_STATUS_LABELS[currentOrder.status]}</InfoItem>
                <InfoItem label="下单日期">{currentOrder.orderDate}</InfoItem>
                <InfoItem label="订单金额" mono emph valueStyle={{ color: 'var(--color-module-current-base)' }}>¥{currentOrder.totalAmount.toLocaleString()}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title={`商品明细（${currentOrder.items.length} 种）`}>
              <table className="detail-inline-table">
                <thead>
                  <tr><th>商品名称</th><th>规格</th><th>数量</th><th>单价</th><th>小计</th></tr>
                </thead>
                <tbody>
                  {currentOrder.items.map((it, i) => (
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
                <InfoItem label="收货人">{currentOrder.receiver}</InfoItem>
                <InfoItem label="联系电话" mono>{currentOrder.receiverPhone}</InfoItem>
                <InfoItem label="收货地址" span={3}>{currentOrder.receiverAddress}</InfoItem>
                <InfoItem label="买家备注" span={3}>{currentOrder.remark || '—'}</InfoItem>
                <InfoItem label="平台处理说明" span={3}>{currentOrder.sellerNote || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>

      {/* 开通下单账号弹窗 */}
      {opening && (
        <div className="category-dialog-overlay" onClick={() => setOpening(null)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ width: 480 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>开通下单账号</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              为 <strong>{opening.name}</strong>（{opening.customerCode}）开通客户终端下单账号，开通后客户即可登录终端在线选购与下单。
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>登录账号 *</label>
                <input className="filter-input" placeholder="如 kh003" value={openForm.username} onChange={e => { setOpenForm({ ...openForm, username: e.target.value }); setOpenError(''); }} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>初始密码 *</label>
                <input className="filter-input" placeholder="初始密码" value={openForm.password} onChange={e => { setOpenForm({ ...openForm, password: e.target.value }); setOpenError(''); }} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>账号名称 *</label>
                <input className="filter-input" placeholder="联系人姓名" value={openForm.name} onChange={e => { setOpenForm({ ...openForm, name: e.target.value }); setOpenError(''); }} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>手机号</label>
                <input className="filter-input" placeholder="联系手机号" value={openForm.phone} onChange={e => setOpenForm({ ...openForm, phone: e.target.value })} style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>开通备注</label>
              <input className="filter-input" placeholder="如：月结客户、主联系人账号" value={openForm.remark} onChange={e => setOpenForm({ ...openForm, remark: e.target.value })} style={{ width: '100%' }} />
            </div>

            {openError && (
              <div style={{ padding: '8px 12px', background: '#FFEBEE', color: '#C62828', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
                {openError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setOpening(null)}>取消</Button>
              <Button onClick={confirmOpen}>确认开通</Button>
            </div>
          </div>
        </div>
      )}

      {/* 重置密码弹窗 */}
      {resetting && (
        <div className="category-dialog-overlay" onClick={() => setResetting(null)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ width: 420 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>重置密码</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              重置账号 <strong className="mono">{resetting.username}</strong>（{resetting.customerName}）的登录密码。
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>新密码 *</label>
              <input className="filter-input" placeholder="请输入新密码" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setResetting(null)}>取消</Button>
              <Button
                disabled={!newPassword.trim()}
                onClick={() => { resetPassword(resetting.id, newPassword.trim()); setResetting(null); }}
              >
                确认重置
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 取消订单弹窗 */}
      {cancelling && (
        <div className="category-dialog-overlay" onClick={() => setCancelling(null)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ width: 460 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>取消客户订单</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              确认取消订单 <strong className="mono">{cancelling.code}</strong>（{cancelling.customerName} · ¥{cancelling.totalAmount.toLocaleString()}）？取消后客户终端同步显示「已取消」。
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>取消说明（客户可见）</label>
              <textarea className="filter-input" placeholder="请输入取消原因" value={cancelNote}
                onChange={e => setCancelNote(e.target.value)} style={{ width: '100%', minHeight: 72, resize: 'vertical', padding: '10px 12px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setCancelling(null)}>取消</Button>
              <Button variant="danger" onClick={() => { reviewOrder(cancelling.id, 'cancelled', cancelNote.trim() || '订单已取消'); setCancelling(null); }}>
                确认取消订单
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
