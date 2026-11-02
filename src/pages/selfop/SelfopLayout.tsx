import { useState, useEffect, type ReactNode } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import BrandLogo from '../../components/common/BrandLogo';
import { useMyFollowCount } from './selfopShared';
import '../partner/partner.css';

/* ── 登录态（persona：自营运营人员，接单默认带出跟单人） ── */

export interface SelfopAuth {
  username: string;
  name: string;
  role: string;
}

/** 演示自营运营账号（与管理后台跟单人口径一致） */
export const SELFOP_ACCOUNTS: { username: string; password: string; name: string; role: string }[] = [
  { username: 'zy01', password: '123456', name: '周雨桐', role: '自营运营组长' },
  { username: 'zy02', password: '123456', name: '陈默', role: '自营运营专员' },
  { username: 'zy03', password: '123456', name: '孙浩然', role: '自营运营专员' },
];

const AUTH_KEY = 'selfopAuth';

export function getSelfopAuth(): SelfopAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as SelfopAuth) : null;
  } catch {
    return null;
  }
}

export function setSelfopAuth(auth: SelfopAuth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function clearSelfopAuth() {
  localStorage.removeItem(AUTH_KEY);
}

/* ── 一级菜单配置 ── */

const SELFOP_MENUS: { key: string; label: string; path: string; icon: ReactNode; children?: { label: string; path: string }[] }[] = [
  {
    key: 'dashboard', label: '工作台', path: '/selfop/dashboard',
    icon: <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  },
  {
    key: 'orders', label: '订单', path: '/selfop/orders',
    icon: <svg viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6h6M7 9h6M7 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    children: [
      { label: '订单管理', path: '/selfop/orders' },
      { label: '物流跟踪', path: '/selfop/logistics' },
    ],
  },
  {
    key: 'purchase', label: '采购', path: '/selfop/purchase',
    icon: <svg viewBox="0 0 20 20" fill="none"><path d="M3 5h12l-1.2 8H4.2L3 5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    key: 'settlement', label: '结算', path: '/selfop/settlement',
    icon: <svg viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 9h2M5 12h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="14" cy="10" r="2" stroke="currentColor" strokeWidth="1.2"/></svg>,
  },
  {
    key: 'account', label: '设置', path: '/selfop/account',
    icon: <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  },
];

/** 自营工作台布局：参照合作商工作台，简约侧边栏（品牌 + 菜单 + 用户），无顶栏；销售模块茶金主题 */
export default function SelfopLayout() {
  const auth = getSelfopAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // 自营工作台使用销售模块主题（茶金）；卸载时恢复主系统当前模块主题
  useEffect(() => {
    document.title = '淡茶半盏 — 自营工作台';
    document.body.dataset.module = 'sales';
    return () => {
      document.body.dataset.module = useAppStore.getState().currentModule;
    };
  }, []);

  const myOrders = useMyFollowCount(auth?.name);

  if (!auth) return <Navigate to="/selfop/login" replace />;

  const handleLogout = () => {
    clearSelfopAuth();
    navigate('/selfop/login');
  };


  const activeKey = SELFOP_MENUS.find((m) =>
    location.pathname === m.path || m.children?.some((c) => location.pathname === c.path),
  )?.key ?? 'dashboard';

  return (
    <div className="partner-shell">
      {/* 侧边栏 */}
      <aside className={`pk-side${collapsed ? ' collapsed' : ''}`}>
        <div className="pk-brand">
          <div className="pk-brand-mark"><BrandLogo /></div>
          <div className="pk-brand-text">
            <div className="pk-brand-name">淡茶半盏</div>
            <div className="pk-brand-sub">自营工作台</div>
          </div>
        </div>

        <nav className="pk-nav">
          <div className="pk-nav-label">MENU</div>
          {SELFOP_MENUS.map((menu) => {
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
                </button>
                {isActive && menu.children && !collapsed && (
                  <div className="pk-subnav">
                    {menu.children.map((child) => (
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

        {/* 底部：跟单人信息 + 用户 */}
        <div className="pk-side-foot">
          <div className="pk-partner-block" title="自营运营 · 跟单人">
            <div className="pk-partner-name">跟单中 {myOrders} 单</div>
            <div className="pk-partner-code mono">{auth.name} · {auth.role}</div>
          </div>
          <div className="pk-user">
            <div className="pk-avatar">{auth.name.charAt(0)}</div>
            <div className="pk-user-text">
              <div className="pk-user-name">{auth.name}</div>
              <div className="pk-user-role">{auth.role}</div>
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
