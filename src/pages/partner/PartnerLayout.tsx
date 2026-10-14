import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';

/** 登录态存取 */
export interface PartnerAuth {
  username: string;
  name: string;
}

export function getPartnerAuth(): PartnerAuth | null {
  try {
    const raw = localStorage.getItem('partnerAuth');
    return raw ? (JSON.parse(raw) as PartnerAuth) : null;
  } catch {
    return null;
  }
}

export function setPartnerAuth(auth: PartnerAuth) {
  localStorage.setItem('partnerAuth', JSON.stringify(auth));
}

export function clearPartnerAuth() {
  localStorage.removeItem('partnerAuth');
}

/** 一级菜单配置 */
const PARTNER_MENUS: { key: string; label: string; path: string; icon: ReactNode; children?: { label: string; path: string }[] }[] = [
  {
    key: 'dashboard', label: '工作台', path: '/partner/dashboard',
    icon: <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  },
  {
    key: 'orders', label: '订单', path: '/partner/orders',
    icon: <svg viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6h6M7 9h6M7 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    children: [
      { label: '订单管理', path: '/partner/orders' },
      { label: '报备管理', path: '/partner/reports' },
    ],
  },
  {
    key: 'customers', label: '客户', path: '/partner/customers',
    icon: <svg viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 16a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="15" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/></svg>,
  },
  {
    key: 'settlement', label: '结算', path: '/partner/settlement',
    icon: <svg viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 9h2M5 12h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="14" cy="10" r="2" stroke="currentColor" strokeWidth="1.2"/></svg>,
  },
  {
    key: 'system', label: '系统', path: '/partner/account',
    icon: <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    children: [
      { label: '账号管理', path: '/partner/account' },
      { label: '合作商信息', path: '/partner/profile' },
    ],
  },
];

/** 合作商终端布局：登录校验 + 顶栏 + 侧边栏（5 个一级菜单，翡翠绿主题） */
export default function PartnerLayout() {
  const auth = getPartnerAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // 合作商终端使用翡翠绿主题（商品模块色）
  useEffect(() => {
    document.body.dataset.module = 'product';
  }, []);

  if (!auth) return <Navigate to="/partner/login" replace />;

  const handleLogout = () => {
    clearPartnerAuth();
    navigate('/partner/login');
  };

  // 当前激活的一级菜单 key
  const activeKey = PARTNER_MENUS.find(m =>
    location.pathname === m.path || m.children?.some(c => location.pathname === c.path),
  )?.key ?? 'dashboard';

  return (
    <div className="app-layout">
      {/* 顶栏 */}
      <header className="topnav">
        <div className="topnav-brand">
          <svg className="topnav-brand-icon" viewBox="0 0 28 28" fill="none">
            <path d="M14 3C9 7 6 11 6 15a8 8 0 0016 0c0-4-3-8-8-12z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M14 10c-2 2-3.5 4-3.5 6a3.5 3.5 0 007 0c0-2-1.5-4-3.5-6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          <span className="topnav-brand-text">淡茶半盏 · 合作商终端</span>
        </div>
        <div className="topnav-right">
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{auth.name}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '5px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral-200)',
              background: 'var(--color-neutral-0)', color: 'var(--color-neutral-600)', fontSize: 'var(--text-sm)',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
          >
            <svg viewBox="0 0 16 16" fill="none" style={{ width: 13, height: 13 }}><path d="M6 14H3.5A1.5 1.5 0 012 12.5v-9A1.5 1.5 0 013.5 2H6M10.5 11l3-3-3-3M13.5 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            退出登录
          </button>
        </div>
      </header>

      {/* 主体 */}
      <div className="main-wrapper">
        {/* 侧边栏 */}
        <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
          <nav className="sidebar-nav">
            {PARTNER_MENUS.map(menu => {
              const isActive = activeKey === menu.key;
              return (
                <div key={menu.key}>
                  <button
                    className={`sidebar-item${isActive ? ' active' : ''}`}
                    onClick={() => navigate(menu.path)}
                    title={menu.label}
                  >
                    <span className="sidebar-item-icon">{menu.icon}</span>
                    <span className="sidebar-item-label">{menu.label}</span>
                  </button>
                  {isActive && menu.children && !collapsed && (
                    <div className="sidebar-submenu">
                      {menu.children.map(child => (
                        <button
                          key={child.path}
                          className={`sidebar-item sidebar-subitem${location.pathname === child.path ? ' active' : ''}`}
                          onClick={() => navigate(child.path)}
                        >
                          <span className="sidebar-item-label">{child.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          <button className="sidebar-collapse" onClick={() => setCollapsed(!collapsed)} title="折叠/展开">
            <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14, transform: collapsed ? 'rotate(180deg)' : 'none' }}>
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </aside>

        {/* 内容 */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
