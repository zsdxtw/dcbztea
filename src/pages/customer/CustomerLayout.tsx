import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { useCustomerStore } from '../../stores/customerStore';
import BrandLogo from '../../components/common/BrandLogo';
import '../partner/partner.css';
import './customer.css';
import { clearCustomerAuth, getCustomerAuth } from './CustomerUI';

/** 一级菜单配置 */
const CUSTOMER_MENUS: { key: string; label: string; path: string; icon: ReactNode; children?: { label: string; path: string }[] }[] = [
  {
    key: 'dashboard', label: '工作台', path: '/customer/dashboard',
    icon: <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  },
  {
    key: 'products', label: '商品', path: '/customer/products',
    icon: <svg viewBox="0 0 20 20" fill="none"><path d="M3 8l1.5-4h11L17 8M3 8v9h14V8M3 8h14" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 17v-5h4v5" stroke="currentColor" strokeWidth="1.3"/></svg>,
    children: [
      { label: '商品浏览', path: '/customer/products' },
    ],
  },
  {
    key: 'orders', label: '订单', path: '/customer/orders',
    icon: <svg viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6h6M7 9h6M7 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    children: [
      { label: '购物车', path: '/customer/cart' },
      { label: '我的订单', path: '/customer/orders' },
    ],
  },
  {
    key: 'system', label: '系统', path: '/customer/account',
    icon: <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    children: [
      { label: '账号信息', path: '/customer/account' },
    ],
  },
];

/** 客户终端布局：参照合作商终端，简约侧边栏（品牌 + 菜单 + 用户），无顶栏 */
export default function CustomerLayout() {
  const auth = getCustomerAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const cartCount = useCustomerStore((s) => s.cart.reduce((sum, c) => sum + c.quantity, 0));

  // 客户终端使用翡翠绿主题（商品模块色）；卸载时恢复主系统当前模块主题
  useEffect(() => {
    document.body.dataset.module = 'product';
    return () => {
      document.body.dataset.module = useAppStore.getState().currentModule;
    };
  }, []);

  if (!auth) return <Navigate to="/customer/login" replace />;

  const handleLogout = () => {
    clearCustomerAuth();
    navigate('/customer/login');
  };

  // 当前激活的一级菜单 key
  const activeKey = CUSTOMER_MENUS.find(m =>
    location.pathname === m.path || m.children?.some(c => location.pathname === c.path),
  )?.key ?? 'dashboard';

  return (
    <div className="customer-shell">
      {/* 侧边栏 */}
      <aside className={`pk-side${collapsed ? ' collapsed' : ''}`}>
        {/* 品牌 */}
        <div className="pk-brand">
          <div className="pk-brand-mark"><BrandLogo /></div>
          <div className="pk-brand-text">
            <div className="pk-brand-name">淡茶半盏</div>
            <div className="pk-brand-sub">客户终端</div>
          </div>
        </div>

        {/* 菜单 */}
        <nav className="pk-nav">
          <div className="pk-nav-label">MENU</div>
          {CUSTOMER_MENUS.map(menu => {
            const isActive = activeKey === menu.key;
            return (
              <div key={menu.key}>
                <button
                  className={`pk-nav-item${isActive ? ' active' : ''}`}
                  onClick={() => navigate(menu.path)}
                  title={menu.label}
                >
                  {menu.icon}
                  <span className="pk-nav-item-text">{menu.label}</span>
                  {menu.key === 'orders' && cartCount > 0 && (
                    <span className="ck-cart-badge">{cartCount}</span>
                  )}
                </button>
                {isActive && menu.children && !collapsed && (
                  <div className="pk-subnav">
                    {menu.children.map(child => (
                      <button
                        key={child.path}
                        className={`pk-subnav-item${location.pathname === child.path ? ' active' : ''}`}
                        onClick={() => navigate(child.path)}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* 底部用户 */}
        <div className="pk-side-foot">
          <div className="pk-user">
            <div className="pk-avatar">{auth.name.charAt(0)}</div>
            <div className="pk-user-text">
              <div className="pk-user-name">{auth.name}</div>
              <div className="pk-user-role">{auth.customerName}</div>
            </div>
            <button className="pk-icon-btn" onClick={handleLogout} title="退出登录">
              <svg viewBox="0 0 16 16" fill="none"><path d="M6 14H3.5A1.5 1.5 0 012 12.5v-9A1.5 1.5 0 013.5 2H6M10.5 11l3-3-3-3M13.5 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <button className="pk-collapse" onClick={() => setCollapsed(!collapsed)} title={collapsed ? '展开菜单' : '收起菜单'}>
            <svg viewBox="0 0 16 16" fill="none" style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}>
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {!collapsed && <span>收起菜单</span>}
          </button>
        </div>
      </aside>

      {/* 内容 */}
      <main className="pk-main">
        <Outlet />
      </main>
    </div>
  );
}
