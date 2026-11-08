import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import { setTerminalDocTitle } from '../../data/terminals';

/** 内容区域 + 布局外壳 */
export default function ContentArea() {
  return (
    <div className="main-wrapper">
      <Sidebar />
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}

/** 仅有布局壳（TopNav + Sidebar + Outlet），被 AppLayout 使用 */
export function AppLayout() {
  useEffect(() => { setTerminalDocTitle('admin'); }, []);
  return (
    <div className="app-layout">
      <TopNav />
      <ContentArea />
    </div>
  );
}
