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
  { label: '应付余额', value: '28,400', unit: '¥', icon: <svg viewBox="0 0 18 18" fill="none"><rect x="4" y="2" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6h4M7 9h4M7 12h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { label: '本月新增', value: '9,200', unit: '¥', trend: { direction: 'up', value: '4 笔' }, icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 5h12l-1.2 8H4.2L3 5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
  { label: '本月支付', value: '6,800', unit: '¥', icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '逾期', value: '0', unit: '笔', icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v4M9 12.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
];

interface OtherPayableRecord {
  code: string;
  partner: string;
  reason: string;
  amount: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  remark?: string;
}

const payableItems: OtherPayableRecord[] = [
  { code: 'OP-2025-0016', partner: '顺丰速运有限公司', reason: '运费', amount: '¥ 8,500', dueDate: '2025-08-15', status: 'pending', remark: '7月物流运费结算' },
  { code: 'OP-2025-0015', partner: '杭州冷链仓储有限公司', reason: '仓储费', amount: '¥ 6,200', dueDate: '2025-08-20', status: 'pending', remark: '7月冷库仓储费' },
  { code: 'OP-2025-0014', partner: '福建包装材料厂', reason: '包装费', amount: '¥ 4,800', dueDate: '2025-07-25', status: 'paid', remark: '茶叶礼盒包装费已付' },
  { code: 'OP-2025-0013', partner: '国家茶叶质量检测中心', reason: '检测费', amount: '¥ 3,200', dueDate: '2025-08-10', status: 'pending', remark: '批次质检费用' },
  { code: 'OP-2025-0012', partner: '杭州物流有限公司', reason: '运费', amount: '¥ 2,800', dueDate: '2025-07-18', status: 'paid', remark: '同城配送运费已付' },
  { code: 'OP-2025-0011', partner: '安溪茶叶加工厂', reason: '加工费', amount: '¥ 2,900', dueDate: '2025-08-05', status: 'pending', remark: '代加工费用' },
];

function payableStatusToVariant(status: string) {
  switch (status) {
    case 'paid': return 'success' as const;
    case 'pending': return 'warning' as const;
    case 'overdue': return 'error' as const;
    default: return 'info' as const;
  }
}

function payableStatusLabel(status: string) {
  switch (status) {
    case 'paid': return '已支付';
    case 'pending': return '待支付';
    case 'overdue': return '已逾期';
    default: return status;
  }
}

function reasonColor(reason: string) {
  switch (reason) {
    case '运费': return 'var(--color-module-current-base)';
    case '仓储费': return '#FD742D';
    case '包装费': return '#01795D';
    case '检测费': return 'var(--color-module-finance-secondary)';
    case '加工费': return '#9D73BD';
    default: return 'var(--color-neutral-400)';
  }
}

export default function FinanceOtherPayable() {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OtherPayableRecord | null>(null);

  const handleView = (item: OtherPayableRecord) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  return (
    <>
      <ContentHeader title="其他应付" breadcrumbs={['财务', '结算管理', '其他应付']} actions={<><Button variant="ghost">导出</Button><Button><PlusIcon />新建应付</Button></>} />
      <div className="content-body">
        <div className="stat-cards">
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>
        <FilterBar>
          <FilterInput placeholder="搜索单号、往来单位、事由..." />
          <FilterSelect options={['全部状态', '待支付', '已支付', '已逾期']} />
          <FilterSelect options={['全部类别', '运费', '仓储费', '包装费', '检测费', '加工费']} />
        </FilterBar>
        <Card>
          <Table
            headers={['单号', '往来单位', '事由', '金额', '应付日期', '状态', '操作']}
            rows={payableItems.map((p) => [
              <span className="mono">{p.code}</span>,
              <span className="cell-emph">{p.partner}</span>,
              <span style={{ padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: `${reasonColor(p.reason)}12`, color: reasonColor(p.reason), border: `1px solid ${reasonColor(p.reason)}30` }}>{p.reason}</span>,
              <span className="mono">{p.amount}</span>,
              <span className="mono">{p.dueDate}</span>,
              <StatusTag variant={payableStatusToVariant(p.status)} label={payableStatusLabel(p.status)} />,
              <div className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => handleView(p)}>查看</Button>
                <Button size="sm" variant="ghost" onClick={() => handleView(p)}>编辑</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      <DetailDrawer
        open={showDetail && !!selectedItem}
        onClose={() => setShowDetail(false)}
        badge="OP"
        title={selectedItem?.code}
        statusTag={selectedItem && <StatusTag variant={payableStatusToVariant(selectedItem.status)} label={payableStatusLabel(selectedItem.status)} />}
        subtitle={selectedItem && `${selectedItem.partner} · ${selectedItem.amount}`}
        mode="view"
      >
        {selectedItem && (
          <DrawerSection title="基本信息">
            <InfoGrid cols={3}>
              <InfoItem label="单号" emph mono>{selectedItem.code}</InfoItem>
              <InfoItem label="往来单位" emph>{selectedItem.partner}</InfoItem>
              <InfoItem label="事由">{selectedItem.reason}</InfoItem>
              <InfoItem label="金额" mono valueStyle={{ color: 'var(--color-module-current-base)', fontWeight: 'var(--font-semibold)' }}>{selectedItem.amount}</InfoItem>
              <InfoItem label="应付日期" mono>{selectedItem.dueDate}</InfoItem>
              <InfoItem label="备注" span={3}>{selectedItem.remark || '—'}</InfoItem>
            </InfoGrid>
          </DrawerSection>
        )}
      </DetailDrawer>
    </>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
