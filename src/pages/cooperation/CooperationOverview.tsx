import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useSupplierStore } from '../../stores/supplierStore';
import { useScoreStore, getScoreSummary } from '../../stores/scoreStore';
import { useReportStore } from '../../stores/reportStore';
import { SUPPLIER_TYPE_LABELS, SUPPLIER_TYPE_COLORS, GRADE_COLORS } from '../../data/suppliers';
import type { StatCardData, SupplierType } from '../../types';

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/** 等级分布展示顺序 */
const GRADE_ORDER = ['S', 'A', 'B', 'C', 'D'] as const;

/** 横向占比条（构成分布图，配色跟随模块主题） */
function DistBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0' }}>
      <span style={{ width: 64, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 8, borderRadius: 'var(--radius-full)', background: 'var(--color-neutral-100)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 'var(--radius-full)', background: color, transition: 'none' }} />
      </div>
      <span className="mono" style={{ width: 72, textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color, flexShrink: 0 }}>{count} 家 · {pct}%</span>
    </div>
  );
}

/** 合作商概览：合作商体系全貌（类型/等级构成、审批与报备待办、积分排行、最新合作商、门店分布） */
export default function CooperationOverview() {
  const navigate = useNavigate();
  const suppliers = useSupplierStore((s) => s.suppliers);
  const approvals = useSupplierStore((s) => s.approvals);
  const scoreEntries = useScoreStore((s) => s.entries);
  const reports = useReportStore((s) => s.reports);

  const activeCount = suppliers.filter((s) => s.status === 'active').length;
  const inactiveCount = suppliers.length - activeCount;
  const typeCount = (t: SupplierType) => suppliers.filter((s) => s.types.includes(t)).length;
  const brandCount = typeCount('brand');
  const supplierCount = typeCount('supplier');
  const serviceCount = typeCount('service');
  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const pendingReports = reports.filter((r) => r.status === 'pending');
  const qualAlertCount = suppliers.filter((s) => s.qualificationStatus !== 'qualified').length;
  const terminalOffCount = suppliers.filter((s) => !s.terminal.enabled).length;
  const storeTotal = suppliers.reduce((n, s) => n + s.stores.length, 0);
  const warehouseTotal = suppliers.reduce((n, s) => n + s.warehouses.length, 0);

  /* ── 统计卡片 ── */
  const statCards: StatCardData[] = [
    {
      label: '合作商总数',
      value: String(suppliers.length),
      unit: '家',
      trend: { direction: 'up', value: `在册 ${activeCount} · 停用 ${inactiveCount}` },
      icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.3" /><path d="M3 15a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
    },
    {
      label: '品牌商',
      value: String(brandCount),
      unit: '家',
      trend: { direction: 'up', value: '直接合作' },
      icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6.5" r="3.5" stroke="currentColor" strokeWidth="1.3" /><path d="M7.2 9.4L5.5 15.5l3.5-2 3.5 2-1.7-6.1" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" /></svg>,
    },
    {
      label: '供应商',
      value: String(supplierCount),
      unit: '家',
      trend: { direction: 'up', value: '差价模式' },
      icon: <svg viewBox="0 0 18 18" fill="none"><path d="M9 2.5l6 3v7l-6 3-6-3v-7l6-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M3 5.5l6 3 6-3M9 8.5v7" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>,
    },
    {
      label: '服务商',
      value: String(serviceCount),
      unit: '家',
      trend: { direction: 'up', value: '扣点模式' },
      icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 11a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><rect x="2.5" y="10" width="3" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="12.5" y="10" width="3" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.3" /><path d="M15.5 14.5v.5a2 2 0 01-2 2h-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
    },
    {
      label: '注册审批待办',
      value: String(pendingApprovals.length),
      unit: '单',
      trend: { direction: pendingApprovals.length > 0 ? 'up' : 'down', value: pendingApprovals.length > 0 ? '需及时处理' : '暂无待审批' },
      icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="4" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M3 8h12M6 2v3M12 2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
    },
    {
      label: '报备待审批',
      value: String(pendingReports.length),
      unit: '单',
      trend: { direction: pendingReports.length > 0 ? 'up' : 'down', value: `门店 ${storeTotal} · 仓库 ${warehouseTotal}` },
      icon: <svg viewBox="0 0 18 18" fill="none"><path d="M4 3h7l3 3v9a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>,
    },
  ];

  /* ── 待办事项：由审批 / 报备 / 档案实时派生 ── */
  const todoItems = [
    pendingApprovals.length > 0 && {
      text: `${pendingApprovals.length} 条合作商注册/信息修改申请待审批`, tag: '注册审批', color: { bg: '#FFF3EB', color: '#eb5c20' }, to: '/cooperation/cooperation-approvals',
    },
    pendingReports.length > 0 && {
      text: `${pendingReports.length} 单报备待审批（订单 / 商品 / 客户报备，通过后自动转单）`, tag: '报备', color: { bg: '#E8F5E9', color: '#01795D' }, to: '/cooperation/cooperation-reports',
    },
    qualAlertCount > 0 && {
      text: `${qualAlertCount} 家合作商资质待更新或已过期，请跟进换证`, tag: '资质', color: { bg: '#FFF8E1', color: '#F18F4D' }, to: '/cooperation/cooperation-partners',
    },
    terminalOffCount > 0 && {
      text: `${terminalOffCount} 家合作商终端未开通（终端未开通无法接单/报备）`, tag: '终端', color: { bg: '#F5F5F5', color: '#9E9E9E' }, to: '/cooperation/cooperation-partners',
    },
  ].filter(Boolean) as { text: string; tag: string; color: { bg: string; color: string }; to: string }[];

  /* ── 积分排行（期初分 + 台账四维累加，取前 5） ── */
  const scoreRank = useMemo(
    () => suppliers
      .map((s) => getScoreSummary(scoreEntries, s.id, s.name))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
    [suppliers, scoreEntries],
  );

  /* ── 最新合作商（按合作日期倒序前 6） ── */
  const recentPartners = useMemo(
    () => [...suppliers].sort((a, b) => b.cooperationDate.localeCompare(a.cooperationDate) || (b.code ?? '').localeCompare(a.code ?? '')).slice(0, 6),
    [suppliers],
  );

  /* ── 门店省份分布（取前 6 省份） ── */
  const storeDist = useMemo(() => {
    const byProvince = new Map<string, number>();
    suppliers.forEach((s) => s.stores.forEach((st) => {
      const prov = st.province ?? '未填写';
      byProvince.set(prov, (byProvince.get(prov) ?? 0) + 1);
    }));
    return [...byProvince.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [suppliers]);

  return (
    <>
      <ContentHeader title="合作商概览" breadcrumbs={['合作商', '合作商概览']} />
      <div className="content-body">
        {/* 核心指标 */}
        <div className="stat-cards">
          {statCards.map((s, i) => <StatCard key={i} data={s} />)}
        </div>

        {/* 合作商构成 + 待办事项 */}
        <div className="grid-2">
          <Card
            title="合作商构成"
            headerRight={<span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>共 {suppliers.length} 家 · 类型与等级双维分布</span>}
          >
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)', margin: 'var(--space-1) 0 2px' }}>类型分布</div>
            {(['brand', 'supplier', 'service'] as SupplierType[]).map((t) => (
              <DistBar key={t} label={SUPPLIER_TYPE_LABELS[t]} count={typeCount(t)} total={suppliers.length} color={SUPPLIER_TYPE_COLORS[t]} />
            ))}
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)', margin: 'var(--space-3) 0 2px' }}>等级分布</div>
            {GRADE_ORDER.map((g) => (
              <DistBar key={g} label={`${g} 级`} count={suppliers.filter((s) => s.grade === g).length} total={suppliers.length} color={GRADE_COLORS[g]} />
            ))}
          </Card>
          <Card title="待办事项" headerRight={<span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-module-current-base)' }}>{todoItems.length} 项待处理 · 来自注册审批与报备管理</span>}>
            <div style={{ padding: 'var(--space-2) 0' }}>
              {todoItems.map((item, i) => (
                <div
                  key={i}
                  onClick={() => navigate(item.to)}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: i < todoItems.length - 1 ? '1px solid var(--color-neutral-100)' : 'none', cursor: 'pointer' }}
                >
                  <span style={{ padding: '1px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: item.color.bg, color: item.color.color, flexShrink: 0 }}>{item.tag}</span>
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)' }}>{item.text}</span>
                  <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14, color: 'var(--color-neutral-300)', flexShrink: 0 }}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              ))}
              {todoItems.length === 0 && (
                <div style={{ padding: 'var(--space-4) 0', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)', textAlign: 'center' }}>合作商体系暂无待办</div>
              )}
            </div>
          </Card>
        </div>

        {/* 积分排行 + 最新合作商 */}
        <div className="grid-2" style={{ marginTop: 'var(--space-4)' }}>
          <Card
            title="合作商积分排行"
            headerRight={<Button size="sm" variant="ghost" onClick={() => navigate('/cooperation/cooperation-scores')}>查看全部</Button>}
          >
            <Table
              headers={['排名', '合作商', '拜访', '报备', '履约', '违约', '总分']}
              rows={scoreRank.map((r, i) => [
                <span key="rk" className="mono" style={{ fontWeight: 'var(--font-semibold)', color: i < 3 ? 'var(--color-module-current-base)' : 'var(--color-neutral-500)' }}>{i + 1}</span>,
                <span key="n" style={{ fontWeight: 'var(--font-medium)' }}>{r.supplierName}</span>,
                <span key="v" className="mono">{r.visit}</span>,
                <span key="r" className="mono">{r.report}</span>,
                <span key="f" className="mono">{r.fulfillment}</span>,
                <span key="p" className="mono" style={{ color: r.penalty < 0 ? '#C62828' : undefined }}>{r.penalty}</span>,
                <span key="t" className="mono" style={{ fontWeight: 'var(--font-bold)', color: 'var(--color-module-current-base)' }}>{r.total}</span>,
              ])}
            />
          </Card>
          <Card
            title="最新合作商"
            headerRight={<Button size="sm" variant="ghost" onClick={() => navigate('/cooperation/cooperation-partners')}>合作商列表</Button>}
          >
            <Table
              headers={['编号', '合作商名称', '类型', '等级', '地区', '终端', '合作日期']}
              rows={recentPartners.map((s) => [
                <span key="c" className="mono">{s.code ?? '—'}</span>,
                <span key="n" style={{ fontWeight: 'var(--font-medium)' }}>{s.name}</span>,
                <span key="t" style={{ fontSize: 'var(--text-sm)' }}>{s.types.map((t) => SUPPLIER_TYPE_LABELS[t]).join(' ')}</span>,
                pill(GRADE_COLORS[s.grade] ?? '#6B7280', '#fff', `${s.grade}级`),
                <span key="rg" style={{ fontSize: 'var(--text-sm)' }}>{[s.registeredProvince, s.registeredCity, s.registeredDistrict].filter(Boolean).join(' / ') || '—'}</span>,
                pill(s.terminal.enabled ? '#E8F5E9' : '#F5F5F5', s.terminal.enabled ? '#01795D' : '#9E9E9E', s.terminal.enabled ? '已开通' : '未开通'),
                <span key="d" className="cell-muted">{s.cooperationDate}</span>,
              ])}
            />
          </Card>
        </div>

        {/* 门店分布 */}
        <Card
          title="合作商门店分布"
          style={{ marginTop: 'var(--space-4)' }}
          headerRight={<span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>共 {storeTotal} 家门店 · 按省份汇总 <Button size="sm" variant="ghost" onClick={() => navigate('/cooperation/cooperation-stores')}>门店地图</Button></span>}
        >
          {storeDist.length > 0 ? storeDist.map(([prov, n]) => (
            <DistBar key={prov} label={prov} count={n} total={storeTotal} color="var(--color-module-current-base)" />
          )) : (
            <div style={{ padding: 'var(--space-4) 0', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)', textAlign: 'center' }}>暂无门店数据</div>
          )}
        </Card>
      </div>
    </>
  );
}
