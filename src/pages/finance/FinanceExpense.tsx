import { useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import StatusTag from '../../components/common/StatusTag';
import Button from '../../components/common/Button';
import FilterBar, { FilterInput, FilterSelect } from '../../components/business/FilterBar';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import type { StatCardData } from '../../types';

const stats: StatCardData[] = [
  { label: '本月费用', value: '86,500', unit: '¥', trend: { direction: 'up', value: '5.2%' }, icon: <svg viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8h2M5 11h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { label: '待审批', value: '4', unit: '笔', icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v4M9 12.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { label: '已审批', value: '18', unit: '笔', icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '费用预算达成', value: '72.3', unit: '%', icon: <svg viewBox="0 0 18 18" fill="none"><path d="M9 2l2.5 5 5.5.8-4 3.9.9 5.5L9 14.7 5.1 17.2l.9-5.5-4-3.9L7.5 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
];

interface ExpenseRecord {
  code: string;
  category: string;
  reason: string;
  amount: string;
  applicant: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  approvalFlow?: { step: string; person: string; time: string; result: string }[];
  remark?: string;
}

const expenseItems: ExpenseRecord[] = [
  { code: 'EX-2025-0023', category: '差旅费', reason: '赴武夷山考察红茶产区', amount: '¥ 3,200', applicant: '王明远', date: '2025-07-15', status: 'pending', approvalFlow: [{ step: '部门主管', person: '陈经理', time: '2025-07-15 10:30', result: '待审批' }, { step: '财务总监', person: '李总监', time: '—', result: '待审批' }], remark: '含交通、住宿费用' },
  { code: 'EX-2025-0022', category: '办公费', reason: '办公室耗材采购', amount: '¥ 860', applicant: '张小芳', date: '2025-07-14', status: 'approved', approvalFlow: [{ step: '部门主管', person: '陈经理', time: '2025-07-14 14:20', result: '已通过' }, { step: '财务总监', person: '李总监', time: '2025-07-14 16:00', result: '已通过' }], remark: '打印纸、墨盒等' },
  { code: 'EX-2025-0021', category: '业务招待', reason: '华茗堂茶庄客户接待', amount: '¥ 2,800', applicant: '刘建国', date: '2025-07-13', status: 'approved', approvalFlow: [{ step: '部门主管', person: '陈经理', time: '2025-07-13 15:00', result: '已通过' }, { step: '财务总监', person: '李总监', time: '2025-07-13 17:30', result: '已通过' }], remark: '客户品茶交流' },
  { code: 'EX-2025-0020', category: '差旅费', reason: '安溪铁观音产地调研', amount: '¥ 4,600', applicant: '赵志强', date: '2025-07-12', status: 'pending', approvalFlow: [{ step: '部门主管', person: '陈经理', time: '2025-07-12 09:15', result: '已通过' }, { step: '财务总监', person: '李总监', time: '—', result: '待审批' }], remark: '含交通、住宿、餐费' },
  { code: 'EX-2025-0019', category: '营销费用', reason: '抖音直播推广费', amount: '¥ 8,500', applicant: '王明远', date: '2025-07-11', status: 'pending', approvalFlow: [{ step: '部门主管', person: '陈经理', time: '—', result: '待审批' }, { step: '财务总监', person: '李总监', time: '—', result: '待审批' }], remark: '7月直播推广预算' },
  { code: 'EX-2025-0018', category: '办公费', reason: '茶叶品鉴会场地租赁', amount: '¥ 5,800', applicant: '张小芳', date: '2025-07-10', status: 'rejected', approvalFlow: [{ step: '部门主管', person: '陈经理', time: '2025-07-10 11:00', result: '已通过' }, { step: '财务总监', person: '李总监', time: '2025-07-10 14:30', result: '已驳回' }], remark: '预算超标，需调整方案' },
  { code: 'EX-2025-0017', category: '业务招待', reason: '品茗轩年度合作洽谈', amount: '¥ 3,500', applicant: '刘建国', date: '2025-07-09', status: 'approved', approvalFlow: [{ step: '部门主管', person: '陈经理', time: '2025-07-09 16:00', result: '已通过' }, { step: '财务总监', person: '李总监', time: '2025-07-10 09:00', result: '已通过' }], remark: '年度合作签约招待' },
  { code: 'EX-2025-0016', category: '差旅费', reason: '福鼎白茶产区考察', amount: '¥ 1,850', applicant: '赵志强', date: '2025-07-08', status: 'pending', approvalFlow: [{ step: '部门主管', person: '陈经理', time: '—', result: '待审批' }, { step: '财务总监', person: '李总监', time: '—', result: '待审批' }], remark: '单日出差' },
];

function expenseStatusToVariant(status: string) {
  switch (status) {
    case 'pending': return 'warning' as const;
    case 'approved': return 'success' as const;
    case 'rejected': return 'error' as const;
    default: return 'info' as const;
  }
}

function expenseStatusLabel(status: string) {
  switch (status) {
    case 'pending': return '待审批';
    case 'approved': return '已审批';
    case 'rejected': return '已驳回';
    default: return status;
  }
}

function categoryColor(category: string) {
  switch (category) {
    case '办公费': return 'var(--color-module-current-base)';
    case '差旅费': return 'var(--color-module-finance-secondary)';
    case '业务招待': return '#CB405D';
    case '营销费用': return '#FD742D';
    default: return 'var(--color-neutral-400)';
  }
}

export default function FinanceExpense() {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null);

  const handleView = (item: ExpenseRecord) => {
    setSelectedExpense(item);
    setShowDetail(true);
  };

  return (
    <>
      <ContentHeader title="费用管理" breadcrumbs={['财务', '费用管理']} actions={<><Button variant="ghost">导出</Button><Button><PlusIcon />新建报销</Button></>} />
      <div className="content-body">
        <div className="stat-cards">
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>
        <FilterBar>
          <FilterInput placeholder="搜索费用单号、申请人..." />
          <FilterSelect options={['全部类别', '办公费', '差旅费', '业务招待', '营销费用', '其他']} />
          <FilterSelect options={['全部状态', '待审批', '已审批', '已驳回']} />
          <FilterSelect options={['全部时间', '今日', '本周', '本月', '近3月']} />
        </FilterBar>
        <Card>
          <Table
            headers={['费用单号', '费用类别', '事由', '金额', '申请人', '申请日期', '状态', '操作']}
            rows={expenseItems.map((e) => [
              <span className="mono">{e.code}</span>,
              <span style={{ padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: `${categoryColor(e.category)}12`, color: categoryColor(e.category), border: `1px solid ${categoryColor(e.category)}30` }}>{e.category}</span>,
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{e.reason}</span>,
              <span className="mono">{e.amount}</span>,
              e.applicant,
              <span className="mono">{e.date}</span>,
              <StatusTag variant={expenseStatusToVariant(e.status)} label={expenseStatusLabel(e.status)} />,
              <div className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => handleView(e)}>查看</Button>
                <Button size="sm" variant="ghost" onClick={() => handleView(e)}>编辑</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      <DetailDrawer
        open={showDetail && !!selectedExpense}
        onClose={() => setShowDetail(false)}
        badge="EX"
        title={selectedExpense?.code}
        statusTag={selectedExpense && <StatusTag variant={expenseStatusToVariant(selectedExpense.status)} label={expenseStatusLabel(selectedExpense.status)} />}
        subtitle={selectedExpense && `${selectedExpense.category} · ${selectedExpense.applicant}`}
        mode="view"
      >
        {selectedExpense && (
          <>
            <DrawerSection title="基本信息">
              <InfoGrid cols={3}>
                <InfoItem label="费用单号" emph mono>{selectedExpense.code}</InfoItem>
                <InfoItem label="费用类别">{selectedExpense.category}</InfoItem>
                <InfoItem label="金额" mono valueStyle={{ color: 'var(--color-module-current-base)', fontWeight: 'var(--font-semibold)' }}>{selectedExpense.amount}</InfoItem>
                <InfoItem label="事由" span={3}>{selectedExpense.reason}</InfoItem>
                <InfoItem label="申请人">{selectedExpense.applicant}</InfoItem>
                <InfoItem label="申请日期" mono>{selectedExpense.date}</InfoItem>
                <InfoItem label="备注" span={3}>{selectedExpense.remark || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            {selectedExpense.approvalFlow && (
              <DrawerSection title="审批流程">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {selectedExpense.approvalFlow.map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: step.result === '已通过' ? '#E8F5E9' : step.result === '已驳回' ? '#FFEBEE' : '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: step.result === '已通过' ? '#2E7D32' : step.result === '已驳回' ? '#C62828' : '#E65100', flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{step.step}</span>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{step.person}</span>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{step.time}</div>
                      </div>
                      <span style={{ padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: step.result === '已通过' ? '#E8F5E9' : step.result === '已驳回' ? '#FFEBEE' : '#FFF3E0', color: step.result === '已通过' ? '#2E7D32' : step.result === '已驳回' ? '#C62828' : '#E65100' }}>{step.result}</span>
                    </div>
                  ))}
                </div>
              </DrawerSection>
            )}
          </>
        )}
      </DetailDrawer>
    </>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
