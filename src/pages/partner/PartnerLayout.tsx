import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { useSupplierStore } from '../../stores/supplierStore';
import BrandLogo from '../../components/common/BrandLogo';
import './partner.css';

/** 登录态存取 */
export interface PartnerAuth {
  username: string;
  name: string;
  /** 关联供应商 ID（登录时按终端账号匹配） */
  supplierId?: string;
  /** 登录账号角色（admin=管理员 / operator=操作员） */
  role?: 'admin' | 'operator';
  /** 登录账号 ID（账号管理页定位本人账号） */
  accountId?: string;
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
    key: 'quotes', label: '报价', path: '/partner/quotes',
    icon: <svg viewBox="0 0 20 20" fill="none"><path d="M10 3v10M10 13l4-4M10 13l-4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 16.5h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M13 3.5h4v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
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
    key: 'system', label: '设置', path: '/partner/account',
    icon: <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    children: [
      { label: '账号管理', path: '/partner/account' },
      { label: '基本信息', path: '/partner/profile/basic' },
      { label: '联系信息', path: '/partner/profile/contact' },
      { label: '仓库信息', path: '/partner/profile/warehouse' },
      { label: '门店信息', path: '/partner/profile/store' },
      { label: '资质文件', path: '/partner/profile/qualification' },
      { label: '结算信息', path: '/partner/profile/finance' },
    ],
  },
];

/** 品牌茶叶图形（统一使用公共 BrandLogo 组件） */
export const TeaLeafMark = BrandLogo;

/** 合作商终端布局：简约侧边栏（品牌 + 菜单 + 合作商信息 + 用户），无顶栏 */
export default function PartnerLayout() {
  const auth = getPartnerAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  /** 当前登录合作商档案（按登录态关联 ID 或终端账号匹配，与管理后台实时联动） */
  const suppliers = useSupplierStore(s => s.suppliers);
  const partner = auth
    ? suppliers.find(s => s.id === auth.supplierId) ?? suppliers.find(s => s.terminal.enabled && s.terminal.username === auth.username)
    : undefined;

  // 合作商终端使用翡翠绿主题（商品模块色）；卸载时恢复主系统当前模块主题
  useEffect(() => {
    document.body.dataset.module = 'product';
    return () => {
      document.body.dataset.module = useAppStore.getState().currentModule;
    };
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
    <div className="partner-shell">
      {/* 侧边栏 */}
      <aside className={`pk-side${collapsed ? ' collapsed' : ''}`}>
        {/* 品牌 */}
        <div className="pk-brand">
          <div className="pk-brand-mark"><TeaLeafMark /></div>
          <div className="pk-brand-text">
            <div className="pk-brand-name">淡茶半盏</div>
            <div className="pk-brand-sub">合作商终端</div>
          </div>
        </div>

        {/* 菜单 */}
        <nav className="pk-nav">
          <div className="pk-nav-label">MENU</div>
          {PARTNER_MENUS.map(menu => {
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

        {/* 底部：合作商名称及编号 + 用户 */}
        <div className="pk-side-foot">
          {partner && (
            <div className="pk-partner-block" title={partner.name}>
              <div className="pk-partner-name">{partner.name}</div>
              <div className="pk-partner-code mono">{partner.code ?? '—'}</div>
            </div>
          )}
          <div className="pk-user">
            <div className="pk-avatar">{auth.name.charAt(0)}</div>
            <div className="pk-user-text">
              <div className="pk-user-name">{auth.name}</div>
              <div className="pk-user-role">{auth.role === 'operator' ? '操作员账号' : '合作商管理员'}</div>
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
