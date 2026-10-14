import { useNavigate } from 'react-router-dom';
import { PageHead, Pill, ORDER_STATUS_TONE } from './PartnerUI';
import { getPartnerAuth } from './PartnerLayout';
import { partnerOrders, partnerCustomers, partnerSettlements, partnerReports, PARTNER_ORDER_STATUS_LABELS } from '../../data/partner';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/** 合作商工作台：统计带 + 待办事项 + 快捷入口 + 最新订单 */
export default function PartnerDashboard() {
  const navigate = useNavigate();
  const auth = getPartnerAuth();

  const pendingCount = partnerOrders.filter(o => o.status === 'pending').length;
  const shippingCount = partnerOrders.filter(o => o.status === 'accepted' || o.status === 'shipping').length;
  const unsettled = partnerSettlements.find(s => s.status === 'unsettled');
  const customerCount = partnerCustomers.filter(c => c.status === 'cooperating').length;
  const reportPending = partnerReports.filter(r => r.status === 'pending').length;

  const now = new Date();
  const dateStr = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 · 星期${WEEKDAYS[now.getDay()]}`;

  const stats = [
    { label: '待接单', value: String(pendingCount), unit: '单', sub: '需尽快确认接单', accent: false },
    { label: '履约中', value: String(shippingCount), unit: '单', sub: '接单 / 发货进行中', accent: false },
    { label: '本月待结算', value: (unsettled?.settleAmount ?? 0).toLocaleString(), unit: '元', sub: `${unsettled?.orderCount ?? 0} 笔订单待结算`, accent: true },
    { label: '合作客户', value: String(customerCount), unit: '家', sub: '本地营销进行中', accent: false },
  ];

  const todos = [
    { label: '待接单订单', count: pendingCount, path: '/partner/orders', desc: '请尽快确认接单并安排发货' },
    { label: '履约中订单', count: shippingCount, path: '/partner/orders', desc: '跟进物流并确认客户签收' },
    { label: '审核中报备', count: reportPending, path: '/partner/reports', desc: '报备审核中，请留意审核结果' },
  ];

  const shortcuts = [
    { label: '订单管理', path: '/partner/orders', desc: '处理平台分发的订单' },
    { label: '新增报备', path: '/partner/reports', desc: '报备订单 / 商品 / 客户' },
    { label: '合作客户', path: '/partner/customers', desc: '查看客户与可下单商品' },
    { label: '结算中心', path: '/partner/settlement', desc: '发货订单结算进度' },
  ];

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 工作台"
        title="工作台"
        desc={`${auth?.name ?? ''}，您好。今天是 ${dateStr}，祝您生意兴隆。`}
      />

      {/* 统计带 */}
      <div className="pk-stats">
        {stats.map(s => (
          <div key={s.label} className={`pk-stat${s.accent ? ' accent' : ''}`}>
            <div className="pk-stat-label">{s.label}</div>
            <div className="pk-stat-value">{s.value}<small>{s.unit}</small></div>
            <div className="pk-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="pk-grid pk-grid-32">
        {/* 待办事项 */}
        <div className="pk-panel">
          <div className="pk-panel-head">
            <span className="pk-panel-title">待办事项</span>
            <button className="pk-link" onClick={() => navigate('/partner/orders')}>
              查看全部
              <svg viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div className="pk-rows">
            {todos.map(t => (
              <div key={t.label} className="pk-row" onClick={() => navigate(t.path)}>
                <div className="pk-num">{t.count}</div>
                <div className="pk-row-main">
                  <div className="pk-row-title">{t.label}</div>
                  <div className="pk-row-sub">{t.desc}</div>
                </div>
                <svg className="pk-row-arrow" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            ))}
          </div>
        </div>

        {/* 快捷入口 */}
        <div className="pk-panel">
          <div className="pk-panel-head">
            <span className="pk-panel-title">快捷入口</span>
          </div>
          <div className="pk-shortcuts">
            {shortcuts.map(sc => (
              <div key={sc.label} className="pk-shortcut" onClick={() => navigate(sc.path)}>
                <div className="pk-shortcut-t">
                  {sc.label}
                  <svg viewBox="0 0 16 16" fill="none"><path d="M3 13L13 3M6 3h7v7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="pk-shortcut-d">{sc.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 最新订单 */}
      <div className="pk-panel">
        <div className="pk-panel-head">
          <span className="pk-panel-title">最新分发订单</span>
          <button className="pk-link" onClick={() => navigate('/partner/orders')}>
            全部订单
            <svg viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <div className="pk-rows">
          {partnerOrders.slice(0, 5).map(o => (
            <div key={o.id} className="pk-row" onClick={() => navigate('/partner/orders')}>
              <span className="mono" style={{ fontSize: 13, color: 'var(--pk-ink2)' }}>{o.code}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--pk-ink)', flex: 1 }}>{o.customerName}</span>
              <span className="mono" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--pk-accent)' }}>¥{o.totalAmount.toLocaleString()}</span>
              <Pill tone={ORDER_STATUS_TONE[o.status]}>{PARTNER_ORDER_STATUS_LABELS[o.status]}</Pill>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
