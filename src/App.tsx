import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useEffect, useRef } from 'react';
import { useAppStore } from './stores/appStore';
import { ModuleKey } from './types';

/** 根据 URL 路径首段推断当前模块 */
/** 合作商一级菜单页面(/cooperation/* 前缀,映射到 partner 模块;终端 /partner 不受影响) */
const PARTNER_MODULE_PATHS = ['/cooperation'];

function inferModuleFromPath(): ModuleKey {
  const path = window.location.pathname;
  if (PARTNER_MODULE_PATHS.some((p) => path.startsWith(p))) return ModuleKey.PARTNER;
  // 仓储已并入采购&仓储:原 /inventory 路径归入 purchase 模块
  if (path.startsWith('/inventory')) return ModuleKey.PURCHASE;
  const segments = path.split('/').filter(Boolean);
  const first = segments[0] ?? '';
  const validKeys: string[] = Object.values(ModuleKey);
  return validKeys.includes(first) ? (first as ModuleKey) : ModuleKey.DASHBOARD;
}

/** 根组件：初始化 data-module 并提供路由 */
export default function App() {
  const currentModule = useAppStore((s) => s.currentModule);
  const switchModule = useAppStore((s) => s.switchModule);
  const initialized = useRef(false);

  // 初始化：从 URL 路径同步 Store 状态（解决刷新后不同步问题）
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const inferred = inferModuleFromPath();
      if (inferred !== currentModule) {
        switchModule(inferred);
      }
    }
  }, []);

  // 模块切换时同步 data-module 属性（合作商终端路由除外，由 PartnerLayout 自行设置）
  useEffect(() => {
    if (window.location.pathname.startsWith('/partner')) return;
    document.body.dataset.module = currentModule;
  }, [currentModule]);

  return <RouterProvider router={router} />;
}
