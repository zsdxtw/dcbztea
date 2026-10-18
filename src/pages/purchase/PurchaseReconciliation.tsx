import { useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusTag from '../../components/common/StatusTag';
import FilterBar, { FilterInput, FilterSelect } from '../../components/business/FilterBar';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import type { StatCardData } from '../../types';

/* ── 统计卡片 ── */
const stats: StatCardData[] = [
  {
    label: '待对账',
    value: '8',
    trend: { direction: 'up', value: '需及时处理' },
    icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="4" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M6 8h6M6 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    label: '对账中',
    value: '5',
    trend: { direction: 'up', value: '+1单' },
    icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    label: '已确认',
    value: '32',
    trend: { direction: 'up', value: '+4单' },
    icon: <svg viewBox="0 0 18 18" fill="none"><path d="M4 9l3.5 3.5L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    label: '本月对账额',
    value: '1,256,800',
    unit: '¥',
    trend: { direction: 'up', value: '12.5%' },
    icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 14l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 7h2v7H2V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
];

/* ── 对账状态 ── */
type ReconciliationStatus = 'pending' | 'reconciling' | 'confirmed' | 'disputed';

function reconciliationStatusToVariant(status: ReconciliationStatus) {
  switch (status) {
    case 'pending': return 'warning' as const;
    case 'reconciling': return 'info' as const;
    case 'confirmed': return 'success' as const;
    case 'disputed': return 'error' as const;
    default: return 'default' as const;
  }
}

function reconciliationStatusLabel(status: ReconciliationStatus) {
  switch (status) {
    case 'pending': return '待对账';
    case 'reconciling': return '对账中';
    case 'confirmed': return '已确认';
    case 'disputed': return '有异议';
    default: return status;
  }
}

/* ── 对账记录 ── */
interface ReconciliationRecord {
  id: string;
  code: string;
  supplier: string;
  period: string;
  purchaseAmount: string;
  paidAmount: string;
  balance: string;
  settlementMethod: string;
  status: ReconciliationStatus;
  /** 详情数据 */
  contactPerson: string;
  contactPhone: string;
  orderCount: number;
  invoiceStatus: string;
  paymentRecords: { date: string; amount: string; method: string; remark: string }[];
}

const reconciliationData: ReconciliationRecord[] = [
  {
    id: '1',
    code: 'REC-2025-0048',
    supplier: '杭州西湖茶叶有限公司',
    period: '2025.06.01 - 2025.06.15',
    purchaseAmount: '¥ 186,500',
    paidAmount: '¥ 120,000',
    balance: '¥ 66,500',
    settlementMethod: '月结',
    status: 'pending',
    contactPerson: '王建国',
    contactPhone: '0571-87654321',
    orderCount: 6,
    invoiceStatus: '待开票',
    paymentRecords: [
      { date: '2025-06-05', amount: '¥ 80,000', method: '银行转账', remark: '6月首批货款' },
      { date: '2025-06-10', amount: '¥ 40,000', method: '银行转账', remark: '6月第二批预付' },
    ],
  },
  {
    id: '2',
    code: 'REC-2025-0047',
    supplier: '福建正山堂茶业有限责任公司',
    period: '2025.06.01 - 2025.06.15',
    purchaseAmount: '¥ 245,800',
    paidAmount: '¥ 200,000',
    balance: '¥ 45,800',
    settlementMethod: '见票结',
    status: 'reconciling',
    contactPerson: '张志明',
    contactPhone: '0599-51234567',
    orderCount: 4,
    invoiceStatus: '已开票',
    paymentRecords: [
      { date: '2025-06-03', amount: '¥ 150,000', method: '银行转账', remark: '正山小种货款' },
      { date: '2025-06-12', amount: '¥ 50,000', method: '银行转账', remark: '金骏眉预付款' },
    ],
  },
  {
    id: '3',
    code: 'REC-2025-0046',
    supplier: '八马茶业股份有限公司',
    period: '2025.06.01 - 2025.06.15',
    purchaseAmount: '¥ 312,000',
    paidAmount: '¥ 312,000',
    balance: '¥ 0',
    settlementMethod: '月结',
    status: 'confirmed',
    contactPerson: '李文辉',
    contactPhone: '0595-22334455',
    orderCount: 8,
    invoiceStatus: '已收票',
    paymentRecords: [
      { date: '2025-06-01', amount: '¥ 200,000', method: '银行转账', remark: '铁观音系列全款' },
      { date: '2025-06-08', amount: '¥ 112,000', method: '银行转账', remark: '大红袍系列全款' },
    ],
  },
  {
    id: '4',
    code: 'REC-2025-0045',
    supplier: '云南大益茶业集团有限公司',
    period: '2025.05.16 - 2025.05.31',
    purchaseAmount: '¥ 198,600',
    paidAmount: '¥ 150,000',
    balance: '¥ 48,600',
    settlementMethod: '周期结',
    status: 'disputed',
    contactPerson: '陈海涛',
    contactPhone: '0871-66778899',
    orderCount: 5,
    invoiceStatus: '已开票',
    paymentRecords: [
      { date: '2025-05-20', amount: '¥ 100,000', method: '银行转账', remark: '普洱茶首批货款' },
      { date: '2025-05-28', amount: '¥ 50,000', method: '承兑汇票', remark: '普洱茶第二批' },
    ],
  },
  {
    id: '5',
    code: 'REC-2025-0044',
    supplier: '福建品品香茶业有限公司',
    period: '2025.05.16 - 2025.05.31',
    purchaseAmount: '¥ 88,400',
    paidAmount: '¥ 88,400',
    balance: '¥ 0',
    settlementMethod: '先款结',
    status: 'confirmed',
    contactPerson: '林振华',
    contactPhone: '0593-78787878',
    orderCount: 3,
    invoiceStatus: '已收票',
    paymentRecords: [
      { date: '2025-05-16', amount: '¥ 88,400', method: '银行转账', remark: '白毫银针全款预付' },
    ],
  },
  {
    id: '6',
    code: 'REC-2025-0043',
    supplier: '杭州西湖茶叶有限公司',
    period: '2025.05.16 - 2025.05.31',
    purchaseAmount: '¥ 156,200',
    paidAmount: '¥ 100,000',
    balance: '¥ 56,200',
    settlementMethod: '月结',
    status: 'reconciling',
    contactPerson: '王建国',
    contactPhone: '0571-87654321',
    orderCount: 5,
    invoiceStatus: '已开票',
    paymentRecords: [
      { date: '2025-05-18', amount: '¥ 60,000', method: '银行转账', remark: '龙井春茶第一批' },
      { date: '2025-05-25', amount: '¥ 40,000', method: '银行转账', remark: '龙井春茶第二批' },
    ],
  },
  {
    id: '7',
    code: 'REC-2025-0042',
    supplier: '福建正山堂茶业有限责任公司',
    period: '2025.05.16 - 2025.05.31',
    purchaseAmount: '¥ 178,900',
    paidAmount: '¥ 178,900',
    balance: '¥ 0',
    settlementMethod: '见票结',
    status: 'confirmed',
    contactPerson: '张志明',
    contactPhone: '0599-51234567',
    orderCount: 4,
    invoiceStatus: '已收票',
    paymentRecords: [
      { date: '2025-05-20', amount: '¥ 100,000', method: '银行转账', remark: '红茶系列全款' },
      { date: '2025-05-27', amount: '¥ 78,900', method: '银行转账', remark: '骏眉系列全款' },
    ],
  },
  {
    id: '8',
    code: 'REC-2025-0041',
    supplier: '八马茶业股份有限公司',
    period: '2025.05.01 - 2025.05.15',
    purchaseAmount: '¥ 90,400',
    paidAmount: '¥ 50,000',
    balance: '¥ 40,400',
    settlementMethod: '月结',
    status: 'pending',
    contactPerson: '李文辉',
    contactPhone: '0595-22334455',
    orderCount: 2,
    invoiceStatus: '待开票',
    paymentRecords: [
      { date: '2025-05-05', amount: '¥ 50,000', method: '银行转账', remark: '清香铁观音预付' },
    ],
  },
];

export default function PurchaseReconciliation() {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ReconciliationRecord | null>(null);

  const handleView = (record: ReconciliationRecord) => {
    setSelectedRecord(record);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedRecord(null);
  };

  return (
    <>
      <ContentHeader
        title="供应商对账"
        breadcrumbs={['采购', '供应商对账']}
        actions={
          <>
            <Button variant="ghost">导出</Button>
            <Button><PlusIcon />新建对账单</Button>
          </>
        }
      />
      <div className="content-body">
        <div className="stat-cards">
          {stats.map((s, i) => (
            <StatCard key={i} data={s} />
          ))}
        </div>

        <FilterBar>
          <FilterInput placeholder="搜索对账单号、供应商..." />
          <FilterSelect options={['全部状态', '待对账', '对账中', '已确认', '有异议']} />
          <FilterSelect options={['全部供应商', '杭州西湖茶叶有限公司', '福建正山堂茶业有限责任公司', '八马茶业股份有限公司', '云南大益茶业集团有限公司', '福建品品香茶业有限公司']} />
          <FilterSelect options={['全部时间', '本月', '上个月', '近3月', '本年度']} />
        </FilterBar>

        <Card>
          <Table
            headers={['对账单号', '供应商', '对账周期', '采购金额', '已付金额', '应付余额', '结算方式', '状态', '操作']}
            rows={reconciliationData.map((r) => [
              <span className="mono">{r.code}</span>,
              r.supplier,
              r.period,
              <span className="mono">{r.purchaseAmount}</span>,
              <span className="mono">{r.paidAmount}</span>,
              <span className="mono" style={{ color: r.balance !== '¥ 0' ? 'var(--color-module-current-base)' : 'var(--color-text-tertiary)', fontWeight: r.balance !== '¥ 0' ? 'var(--font-semibold)' : undefined }}>{r.balance}</span>,
              r.settlementMethod,
              <StatusTag variant={reconciliationStatusToVariant(r.status)} label={reconciliationStatusLabel(r.status)} />,
              <div className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => handleView(r)}>查看</Button>
                <Button size="sm" variant="ghost" onClick={() => handleView(r)}>编辑</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      {/* 对账详情抽屉 */}
      <DetailDrawer
        open={showDetail && !!selectedRecord}
        onClose={handleCloseDetail}
        badge="RC"
        title={selectedRecord?.code}
        statusTag={selectedRecord && (
          <StatusTag variant={reconciliationStatusToVariant(selectedRecord.status)} label={reconciliationStatusLabel(selectedRecord.status)} />
        )}
        subtitle={selectedRecord && `${selectedRecord.supplier} · 对账周期 ${selectedRecord.period}`}
      >
        {selectedRecord && (
          <>
            {/* 供应商信息 */}
            <DrawerSection title="供应商信息">
              <InfoGrid cols={3}>
                <InfoItem label="供应商名称" emph>{selectedRecord.supplier}</InfoItem>
                <InfoItem label="对账单号" mono>{selectedRecord.code}</InfoItem>
                <InfoItem label="对账周期">{selectedRecord.period}</InfoItem>
                <InfoItem label="联系人">{selectedRecord.contactPerson}</InfoItem>
                <InfoItem label="联系电话">{selectedRecord.contactPhone}</InfoItem>
                <InfoItem label="结算方式">{selectedRecord.settlementMethod}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            {/* 订单汇总 */}
            <DrawerSection title="订单汇总">
              <InfoGrid cols={3}>
                <InfoItem label="关联采购单数" emph>{selectedRecord.orderCount} 单</InfoItem>
                <InfoItem label="采购金额" mono>{selectedRecord.purchaseAmount}</InfoItem>
                <InfoItem label="已付金额" mono>{selectedRecord.paidAmount}</InfoItem>
                <InfoItem label="应付余额" mono emph valueStyle={{ color: selectedRecord.balance !== '¥ 0' ? 'var(--color-module-current-base)' : 'var(--color-text-tertiary)' }}>{selectedRecord.balance}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            {/* 付款记录 */}
            <DrawerSection title="付款记录">
              <table className="detail-inline-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center' }}>序号</th>
                    <th>付款日期</th>
                    <th style={{ textAlign: 'right' }}>付款金额</th>
                    <th>付款方式</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRecord.paymentRecords.map((pr, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center' }}>{i + 1}</td>
                      <td>{pr.date}</td>
                      <td style={{ textAlign: 'right' }} className="mono">{pr.amount}</td>
                      <td>{pr.method}</td>
                      <td>{pr.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DrawerSection>

            {/* 发票状态 */}
            <DrawerSection title="发票状态">
              <InfoGrid cols={3}>
                <InfoItem label="发票状态" emph valueStyle={{ color: selectedRecord.invoiceStatus === '已收票' ? '#01795D' : selectedRecord.invoiceStatus === '已开票' ? '#0F64B5' : '#FD742D' }}>
                  {selectedRecord.invoiceStatus}
                </InfoItem>
              </InfoGrid>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
