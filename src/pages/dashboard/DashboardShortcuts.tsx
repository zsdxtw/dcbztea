import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import ShortcutItem from '../../components/business/ShortcutItem';
import type {} from '../../types';


export default function DashboardShortcuts() {
  return (
    <>
      <ContentHeader title="快捷入口" breadcrumbs={['工作台', '快捷入口']} />
      <div className="content-body">
        <Card title="快捷入口">
          <div className="shortcut-grid">
            <ShortcutItem moduleKey="purchase" iconClass="shortcut-icon-purchase" icon={<svg viewBox="0 0 20 20" fill="none"><path d="M3 5h12l-1.2 8H4.2L3 5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>} text="新建采购" />
            <ShortcutItem moduleKey="sales" iconClass="shortcut-icon-sales" icon={<svg viewBox="0 0 20 20" fill="none"><path d="M3 14l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>} text="新建销售" />
            <ShortcutItem moduleKey="inventory" iconClass="shortcut-icon-inventory" icon={<svg viewBox="0 0 20 20" fill="none"><rect x="3" y="5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 9h12" stroke="currentColor" strokeWidth="1.3"/></svg>} text="库存查询" />
            <ShortcutItem moduleKey="product" iconClass="shortcut-icon-product" icon={<svg viewBox="0 0 20 20" fill="none"><path d="M10 2L4 5v8l6 3 6-3V5L10 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>} text="商品管理" />
            <ShortcutItem moduleKey="finance" iconClass="shortcut-icon-finance" icon={<svg viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8h2M5 11h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>} text="财务对账" />
            <ShortcutItem moduleKey="statistics" iconClass="shortcut-icon-statistics" icon={<svg viewBox="0 0 20 20" fill="none"><rect x="3" y="10" width="3" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.3"/><rect x="7.5" y="6" width="3" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.3"/><rect x="12" y="3" width="3" height="13" rx="0.5" stroke="currentColor" strokeWidth="1.3"/></svg>} text="数据报表" />
            <ShortcutItem moduleKey="settings" iconClass="shortcut-icon-settings" icon={<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>} text="系统设置" />
            <ShortcutItem icon={<svg viewBox="0 0 20 20" fill="none" style={{ color: 'var(--color-neutral-500)' }}><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M10 7v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>} text="帮助中心" />
          </div>
        </Card>
      </div>
    </>
  );
}
