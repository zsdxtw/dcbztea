import { useNavigate } from 'react-router-dom';
import { PageHead, Pill, CUST_ORDER_STATUS_TONE, getCustomerAuth } from './CustomerUI';
import { useCustomerStore } from '../../stores/customerStore';
import { CUSTOMER_ORDER_STATUS_LABELS } from '../../data/customer';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/** 客户工作台：统计带 + 待办事项 + 快捷入口 + 最新订单 */
export default function CustomerDashboard() {
  const navigate = useNavigate();
  const auth = getCustomerAuth();
  const orders = useCustomerStore((s) => s.orders.filter(o => o.customerName === auth?.customerName));
  const cartCount = useCustomerStore((s) => s.cart.reduce((sum, c) => sum + c.quantity, 0));

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const shippingCount = orders.filter(o => o.status === 'confirmed' || o.status === 'shipping').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const month = new Date().toISOString().slice(0, 7);
  const monthAmount = orders
    .filter(o => o.status === 'completed' && o.orderDate.startsWith(month))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const now = new Date();
  const dateStr = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 · 星期${WEEKDAYS[now.getDay()]}`;

  const stats = [
    { label: '待确认订单', value: String(pendingCount), unit: '单', sub: '平台确认后安排发货', accent: pendingCount > 0 },
    { label: '配送中订单', value: String(shippingCount), unit: '单', sub: '已确认 / 配送进行中', accent: false },
    { label: '待签收订单', value: String(deliveredCount), unit: '单', sub: '签收后请在订单中确认', accent: deliveredCount > 0 },
    { label: '本月已完成', value: monthAmount.toLocaleString(), unit: '元', sub: '本月已收货订单金额', accent: true },
  ];

  const todos = [
    { label: '待确认订单', count: pendingCount, path: '/customer/orders', desc: '平台确认中，可取消或等待确认' },
    { label: '待签收订单', count: deliveredCount, path: '/customer/orders', desc: '签收后请确认收货完成订单' },
    { label: '购物车商品', count: cartCount, path: '/customer/cart', desc: cartCount > 0 ? '去结算下单' : '可去商品页选购' },
  ];

  const shortcuts = [
    { label: '去下单', path: '/customer/products', desc: '浏览在售茶品与价格' },
    { label: '购物车', path: '/customer/cart', desc: '核对商品并提交订单' },
    { label: '我的订单', path: '/customer/orders', desc: '跟踪订单配送进度' },
    { label: '账号信息', path: '/customer/account', desc: '查看账号与修改密码' },
  ];

  const recent = orders.slice(0, 4);

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="客户终端 · 工作台"
        title="工作台"
        desc={`${auth?.customerName ?? ''} 您好，${auth?.name ?? ''}。今天是 ${dateStr}。`}
      />

      {/* 统计带 */}
      <div className="pk-stats">
        {stats.map(s => (
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
            <button className="pk-link" onClick={() => navigate('/customer/orders')}>
              查看全部
              <svg viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div className="pk-rows">
            {todos.map(t => (
              <div key={t.label} className="pk-row" onClick={() => navigate(t.path)}>
                <div className="pk-num">{t.count}</div>
                <div className="pk-row-main">
                  <div className="pk-row-title">{t.label}</div>
                  <div className="pk-row-sub">{t.desc}</div>
                </div>
                <svg className="pk-row-arrow" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            ))}
          </div>
        </div>

        {/* 快捷入口 */}
        <div className="pk-panel">
          <div className="pk-panel-head">
            <span className="pk-panel-title">快捷入口</span>
          </div>
          <div className="pk-shortcuts">
            {shortcuts.map(sc => (
              <div key={sc.label} className="pk-shortcut" onClick={() => navigate(sc.path)}>
                <div className="pk-shortcut-t">
                  {sc.label}
                  <svg viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="pk-shortcut-d">{sc.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 最新订单 */}
      <div className="pk-panel">
        <div className="pk-panel-head">
          <span className="pk-panel-title">最新订单</span>
          <button className="pk-link" onClick={() => navigate('/customer/orders')}>
            全部订单
            <svg viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <div className="pk-rows">
          {recent.length === 0 && (
            <div className="ck-empty" style={{ padding: '40px 20px' }}>
              <div className="ck-empty-t">暂无订单</div>
              <div className="ck-empty-d">去 <button onClick={() => navigate('/customer/products')}>商品浏览</button> 选购茶品，在线提交第一笔订单</div>
            </div>
          )}
          {recent.map(o => (
            <div key={o.id} className="pk-row" onClick={() => navigate('/customer/orders')}>
              <div className="pk-num" style={{ minWidth: 46, fontSize: 13 }}>{o.items.length}</div>
              <div className="pk-row-main">
                <div className="pk-row-title">
                  {o.code}
                  <span className="pk-row-sub" style={{ display: 'inline', marginTop: 0, marginLeft: 10 }}>
                    {o.items[0].productName}{o.items.length > 1 ? ` 等 ${o.items.length} 种` : ''}
                  </span>
                </div>
                <div className="pk-row-sub">{o.orderDate} · ¥{o.totalAmount.toLocaleString()}</div>
              </div>
              <Pill tone={CUST_ORDER_STATUS_TONE[o.status]}>{CUSTOMER_ORDER_STATUS_LABELS[o.status]}</Pill>
              <svg className="pk-row-arrow" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
