import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { TOPNAV_TABS } from '../../data/modules';
import { ModuleKey } from '../../types';
import BrandLogo from '../common/BrandLogo';

/** 顶部导航栏 */
export default function TopNav() {
  const navigate = useNavigate();
  const currentModule = useAppStore((s) => s.currentModule);
  const switchModule = useAppStore((s) => s.switchModule);

  const handleTabClick = (key: ModuleKey) => {
    switchModule(key);
    navigate(`/${key}`);
  };

  return (
    <header className="topnav">
      {/* 品牌 */}
      <div className="topnav-brand">
        <BrandLogo className="topnav-brand-icon" />
        <span className="topnav-brand-text">淡茶半盏</span>
      </div>

      {/* 模块 Tab */}
      <nav className="topnav-tabs">
        {TOPNAV_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`topnav-tab ${currentModule === tab.key ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.key)}
          >
            <span className="topnav-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 右侧工具栏 */}
      <div className="topnav-right">
        <div className="topnav-search">
          <svg className="topnav-search-icon" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input type="text" className="topnav-search-input" placeholder="搜索订单、商品、客户..." />
        </div>
        <button className="topnav-icon-btn" title="通知">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M10 2a5 5 0 015 5v3l2 2H3l2-2V7a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <path d="M8 15a2 2 0 004 0" stroke="currentColor" strokeWidth="1.3"/>
          </svg>
          <span className="notification-dot"></span>
        </button>
        <button
          onClick={() => navigate('/partner/login')}
          title="合作商终端"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral-200)',
            background: 'var(--color-neutral-0)', color: '#01795D', fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-medium)', cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          <svg viewBox="0 0 16 16" fill="none" style={{ width: 13, height: 13 }}>
            <path d="M2 3h12v9H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <path d="M2 6h12M5.5 6v6" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          合作商终端
        </button>
        <div className="topnav-avatar">陈</div>
      </div>

      {/* 模块色指示条 */}
      <div className="topnav-module-indicator"></div>
    </header>
  );
}
