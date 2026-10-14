import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import type { StatCardData } from '../../types';
import { partnerOrders, partnerCustomers, partnerSettlements, partnerReports, PARTNER_ORDER_STATUS_LABELS } from '../../data/partner';

/** 合作商工作台：核心统计 + 待办事项 + 快捷入口 */
export default function PartnerDashboard() {
  const navigate = useNavigate();

  const pendingCount = partnerOrders.filter(o => o.status === 'pending').length;
  const shippingCount = partnerOrders.filter(o => o.status === 'accepted' || o.status === 'shipping').length;
  const unsettled = partnerSettlements.find(s => s.status === 'unsettled');
  const customerCount = partnerCustomers.filter(c => c.status === 'cooperating').length;
  const reportPending = partnerReports.filter(r => r.status === 'pending').length;

  const stats: StatCardData[] = [
    {
      label: '待接单', value: String(pendingCount), unit: '单',
      trend: { direction: 'up', value: '需及时处理' },
      icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="4" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 8h12M7 2v3M11 2v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    },
    {
      label: '履约中', value: String(shippingCount), unit: '单',
      trend: { direction: 'up', value: '接单/发货中' },
      icon: <svg viewBox="0 0 18 18" fill="none"><path d="M2 12l3-4 3 2 4-6 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="14" r="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>,
    },
    {
      label: '本月待结算', value: unsettled ? unsettled.settleAmount.toLocaleString() : '0', unit: '元',
      trend: { direction: 'up', value: `${unsettled?.orderCount ?? 0} 笔订单` },
      icon: <svg viewBox="0 0 18 18" fill="none"><rect x="2" y="5" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 9h2M5 11.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="13" cy="9.5" r="1.8" stroke="currentColor" strokeWidth="1.2"/></svg>,
    },
    {
      label: '合作客户', value: String(customerCount), unit: '家',
      trend: { direction: 'up', value: '营销中' },
      icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="7" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 15a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="14" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/></svg>,
    },
  ];

  // 待办事项
  const todos = [
    { label: '待接单订单', count: pendingCount, path: '/partner/orders', desc: '请尽快确认接单并安排发货' },
    { label: '履约中订单', count: shippingCount, path: '/partner/orders', desc: '跟进物流并确认签收' },
    { label: '待审核报备', count: reportPending, path: '/partner/reports', desc: '报备审核中，请留意结果' },
  ];

  // 快捷入口
  const shortcuts = [
    { label: '订单管理', path: '/partner/orders', desc: '处理平台分发的订单' },
    { label: '新增报备', path: '/partner/reports', desc: '报备订单 / 商品 / 客户' },
    { label: '合作客户', path: '/partner/customers', desc: '查看客户与可下单商品' },
    { label: '结算中心', path: '/partner/settlement', desc: '发货订单结算进度' },
  ];

  return (
    <>
      <ContentHeader title="工作台" breadcrumbs={['合作商终端', '工作台']} />
      <div className="content-body">
        <div className="stat-cards">
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 'var(--space-5)' }}>
          {/* 待办事项 */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-800)' }}>待办事项</span>
              <Button size="sm" variant="ghost" onClick={() => navigate('/partner/orders')}>查看全部</Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {todos.map(t => (
                <div
                  key={t.label}
                  onClick={() => navigate(t.path)}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                >
                  <div style={{
                    minWidth: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-module-current-lightest)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--color-module-current-base)',
                  }}>{t.count}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-neutral-800)' }}>{t.label}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{t.desc}</div>
                  </div>
                  <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14, color: 'var(--color-neutral-300)' }}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              ))}
            </div>
          </Card>

          {/* 快捷入口 */}
          <Card>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-800)', marginBottom: 'var(--space-4)' }}>快捷入口</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              {shortcuts.map(sc => (
                <div
                  key={sc.label}
                  onClick={() => navigate(sc.path)}
                  style={{ padding: 'var(--space-3)', border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-module-current-base)', marginBottom: 4 }}>{sc.label}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{sc.desc}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 最新订单 */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-800)' }}>最新分发订单</span>
            <Button size="sm" variant="ghost" onClick={() => navigate('/partner/orders')}>全部订单</Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {partnerOrders.slice(0, 5).map(o => (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
                <span className="mono" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-neutral-700)' }}>{o.code}</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-800)', flex: 1 }}>{o.customerName}</span>
                <span className="mono" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)' }}>¥{o.totalAmount.toLocaleString()}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                  background: o.status === 'pending' ? '#FFF3E0' : o.status === 'settled' ? '#F3E5F5' : o.status === 'rejected' ? '#FFEBEE' : '#E8F5E9',
                  color: o.status === 'pending' ? '#E65100' : o.status === 'settled' ? '#7B1FA2' : o.status === 'rejected' ? '#C62828' : '#01795D',
                }}>{PARTNER_ORDER_STATUS_LABELS[o.status]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
