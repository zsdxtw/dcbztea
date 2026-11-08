import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { MODULE_CONFIGS, moduleMenuPath } from '../../data/modules';
import clsx from 'clsx';
import type { MenuItem } from '../../types';

/** 侧边栏 */
export default function Sidebar() {
  const navigate = useNavigate();
  const currentModule = useAppStore((s) => s.currentModule);
  const currentSubMenu = useAppStore((s) => s.currentSubMenu);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const switchSubMenu = useAppStore((s) => s.switchSubMenu);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  const config = MODULE_CONFIGS[currentModule];
  const menus = config?.menus ?? [];

  // 展开的菜单组
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const handleMenuClick = (menuKey: string) => {
    switchSubMenu(menuKey);
    navigate(moduleMenuPath(currentModule, menuKey));
  };

  const handleToggleExpand = (menuKey: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(menuKey)) {
        next.delete(menuKey);
      } else {
        next.add(menuKey);
      }
      return next;
    });
  };

  const isChildActive = (menu: MenuItem) => {
    return menu.children?.some((child) => currentSubMenu === child.key) ?? false;
  };

  return (
    <aside className={clsx('sidebar', sidebarCollapsed && 'collapsed')}>
      <div className="sidebar-header">
        <span className="sidebar-module-title">{config?.label ?? ''}</span>
        <button className="sidebar-toggle" onClick={toggleSidebar} title="折叠/展开">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <nav className="sidebar-nav">
        {menus.map((menu) => {
          const hasChildren = menu.children && menu.children.length > 0;
          const expanded = expandedKeys.has(menu.key);
          const childActive = isChildActive(menu);

          if (hasChildren) {
            return (
              <div key={menu.key} className={clsx('sidebar-nav-group', childActive && 'group-active')}>
                <div
                  className={clsx('sidebar-nav-item', childActive && 'active')}
                  onClick={() => handleToggleExpand(menu.key)}
                  data-tooltip={menu.label}
                >
                  <span className="sidebar-nav-item-icon">{menu.icon}</span>
                  <span className="sidebar-nav-item-text">{menu.label}</span>
                  <span className={clsx('sidebar-nav-arrow', expanded && 'expanded')}>
                    <svg viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </div>
                <div className={clsx('sidebar-nav-children', expanded && 'expanded')}>
                  {menu.children!.map((child) => (
                    <div
                      key={child.key}
                      className={clsx('sidebar-nav-child-item', currentSubMenu === child.key && 'active')}
                      onClick={() => handleMenuClick(child.key)}
                    >
                      <span className="sidebar-nav-child-dot" />
                      <span className="sidebar-nav-child-text">{child.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div
              key={menu.key}
              className={clsx('sidebar-nav-item', currentSubMenu === menu.key && 'active')}
              data-tooltip={menu.label}
              onClick={() => handleMenuClick(menu.key)}
            >
              <span className="sidebar-nav-item-icon">{menu.icon}</span>
              <span className="sidebar-nav-item-text">{menu.label}</span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
