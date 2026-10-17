import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead, Pill } from './CustomerUI';
import { getCustomerAuth } from './CustomerUI';
import { useCustomerStore } from '../../stores/customerStore';
import { customerItems } from '../../data/customers';
import '../partner/partner.css';
import './customer.css';

/** 购物车：核对商品数量 → 填写收货信息 → 提交订单 */
export default function CustomerCart() {
  const navigate = useNavigate();
  const auth = getCustomerAuth();
  const cart = useCustomerStore((s) => s.cart);
  const updateQuantity = useCustomerStore((s) => s.updateCartQuantity);
  const removeFromCart = useCustomerStore((s) => s.removeFromCart);
  const placeOrder = useCustomerStore((s) => s.placeOrder);

  /** 从客户档案带出默认收货信息 */
  const customer = useMemo(
    () => customerItems.find(c => c.name === auth?.customerName),
    [auth?.customerName],
  );
  const defaultAddress = customer
    ? `${customer.province ?? ''}${customer.city ?? ''}${customer.district ?? ''}${customer.contactAddress ?? ''}`
    : '';

  const [receiver, setReceiver] = useState(customer?.contactPerson ?? '');
  const [receiverPhone, setReceiverPhone] = useState(customer?.contactPhone ?? '');
  const [receiverAddress, setReceiverAddress] = useState(defaultAddress);
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');

  const totalAmount = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const totalQuantity = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleSubmit = () => {
    if (cart.length === 0) return;
    if (!receiver.trim() || !receiverPhone.trim() || !receiverAddress.trim()) {
      setError('请完整填写收货人、联系电话与收货地址');
      return;
    }
    const order = placeOrder({
      customerName: auth!.customerName,
      receiver: receiver.trim(),
      receiverPhone: receiverPhone.trim(),
      receiverAddress: receiverAddress.trim(),
      remark: remark.trim() || undefined,
    });
    navigate('/customer/orders', { state: { placed: order.code } });
  };

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="客户终端 · 订单"
        title="购物车"
        desc="核对已选商品与数量，确认收货信息后提交订单。订单提交后进入「待确认」状态，平台确认后即安排发货。"
      />

      {cart.length === 0 ? (
        <div className="pk-panel">
          <div className="ck-empty">
            <svg viewBox="0 0 20 20" fill="none"><path d="M3 5h8M3 10h5M3 15h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="14" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="11" cy="15" r="2.5" stroke="currentColor" strokeWidth="1.3"/></svg>
            <div className="ck-empty-t">购物车还是空的</div>
            <div className="ck-empty-d">去 <button onClick={() => navigate('/customer/products')}>商品浏览</button> 选购心仪茶品，加入购物车后在此结算</div>
          </div>
        </div>
      ) : (
        <div className="ck-cart-grid">
          {/* 商品清单 */}
          <div className="pk-panel">
            <div className="pk-panel-head">
              <span className="pk-panel-title">已选商品（{cart.length} 种）</span>
              <span className="pk-link">下单后价格以提交时销售价为准</span>
            </div>
            <div className="pk-rows">
              {cart.map(item => (
                <div key={item.productId} className="pk-row" style={{ cursor: 'default' }}>
                  <div className="pk-num" style={{ minWidth: 46, fontSize: 13 }}>
                    <ProdMark />
                  </div>
                  <div className="pk-row-main">
                    <div className="pk-row-title">{item.productName}</div>
                    <div className="pk-row-sub">{item.spec} · ¥{item.price.toLocaleString()}/件 · 小计 ¥{(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                  <div className="ck-qty">
                    <button className="ck-qty-btn" onClick={() => updateQuantity(item.productId, item.quantity - 1)} title="减少">−</button>
                    <input
                      className="ck-qty-num"
                      value={item.quantity}
                      onChange={e => {
                        const n = parseInt(e.target.value.replace(/\D/g, ''), 10);
                        if (!Number.isNaN(n)) updateQuantity(item.productId, n);
                      }}
                    />
                    <button className="ck-qty-btn" onClick={() => updateQuantity(item.productId, item.quantity + 1)} title="增加">+</button>
                  </div>
                  <Pill tone="red">¥{(item.price * item.quantity).toLocaleString()}</Pill>
                  <button className="pk-icon-btn" title="移除商品" onClick={() => removeFromCart(item.productId)}>
                    <svg viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4l.5 9a1 1 0 001 1h3a1 1 0 001-1L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 结算面板 */}
          <div className="ck-cart-summary">
            <div className="ck-cart-summary-title">确认下单</div>

            <div className="pk-login-field">
              <label className="pk-login-label">收货人</label>
              <input className="pk-login-input" placeholder="收货人姓名" value={receiver} onChange={e => { setReceiver(e.target.value); setError(''); }} />
            </div>
            <div className="pk-login-field">
              <label className="pk-login-label">联系电话</label>
              <input className="pk-login-input" placeholder="联系电话" value={receiverPhone} onChange={e => { setReceiverPhone(e.target.value); setError(''); }} />
            </div>
            <div className="pk-login-field">
              <label className="pk-login-label">收货地址</label>
              <textarea
                className="pk-login-input"
                style={{ height: 68, padding: '10px 14px', resize: 'none' }}
                placeholder="省市区 + 详细地址"
                value={receiverAddress}
                onChange={e => { setReceiverAddress(e.target.value); setError(''); }}
              />
            </div>
            <div className="pk-login-field">
              <label className="pk-login-label">订单备注（选填）</label>
              <input className="pk-login-input" placeholder="如发票、物流等要求" value={remark} onChange={e => setRemark(e.target.value)} />
            </div>

            <div className="ck-summary-rows" style={{ marginTop: 20 }}>
              <div className="ck-summary-row"><span>商品种数</span><span className="mono">{cart.length} 种 / {totalQuantity} 件</span></div>
              <div className="ck-summary-row"><span>客户</span><span>{auth?.customerName}</span></div>
              <div className="ck-summary-row total"><span>订单总额</span><b>¥{totalAmount.toLocaleString()}</b></div>
            </div>

            {error && <div className="pk-login-error" style={{ marginBottom: 14 }}>{error}</div>}

            <button className="ck-checkout-btn" onClick={handleSubmit}>提交订单</button>
            <div className="ck-checkout-note">提交后进入「待确认」，平台确认前可取消订单</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProdMark() {
  return (
    <svg viewBox="0 0 28 28" fill="none" style={{ width: 20, height: 20 }}>
      <path d="M14 3C9 7 6 11 6 15a8 8 0 0016 0c0-4-3-8-8-12z" stroke="#01795D" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M14 10c-2 2-3.5 4-3.5 6a3.5 3.5 0 007 0c0-2-1.5-4-3.5-6z" stroke="#01795D" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}
