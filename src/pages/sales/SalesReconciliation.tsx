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
    label: '待对账', value: '6',
    trend: { direction: 'up', value: '需及时处理' },
    icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="4" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M6 8h6M6 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    label: '对账中', value: '4',
    trend: { direction: 'up', value: '+1 单' },
    icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    label: '已确认', value: '28',
    trend: { direction: 'up', value: '+5 单' },
    icon: <svg viewBox="0 0 18 18" fill="none"><path d="M4 9l3.5 3.5L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    label: '本月对账额', value: '986,500', unit: '¥',
    trend: { direction: 'up', value: '15.2%' },
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

/* ── 客户类型 ── */
type CustomerType = 'direct' | 'channel' | 'platform';

const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  direct: '直营客户',
  channel: '渠道客户',
  platform: '平台客户',
};

/* ── 对账记录 ── */
interface ReconciliationRecord {
  id: string;
  code: string;
  customer: string;
  customerType: CustomerType;
  period: string;
  salesAmount: string;
  receivedAmount: string;
  balance: string;
  settlementMethod: string;
  status: ReconciliationStatus;
  contactPerson: string;
  contactPhone: string;
  orderCount: number;
  invoiceStatus: string;
  paymentRecords: { date: string; amount: string; method: string; remark: string }[];
}

const reconciliationData: ReconciliationRecord[] = [
  {
    id: '1', code: 'REC-S-2025-0048', customer: '华茗堂茶庄', customerType: 'direct',
    period: '2025.06.01 - 2025.06.15',
    salesAmount: '¥ 186,500', receivedAmount: '¥ 120,000', balance: '¥ 66,500',
    settlementMethod: '月结', status: 'pending',
    contactPerson: '王经理', contactPhone: '0571-87651234',
    orderCount: 6, invoiceStatus: '待开票',
    paymentRecords: [
      { date: '2025-06-05', amount: '¥ 80,000', method: '银行转账', remark: '6月首批货款' },
      { date: '2025-06-10', amount: '¥ 40,000', method: '银行转账', remark: '6月第二批预付' },
    ],
  },
  {
    id: '2', code: 'REC-S-2025-0047', customer: '雅韵茶社', customerType: 'channel',
    period: '2025.06.01 - 2025.06.15',
    salesAmount: '¥ 245,800', receivedAmount: '¥ 200,000', balance: '¥ 45,800',
    settlementMethod: '见票结', status: 'reconciling',
    contactPerson: '赵总', contactPhone: '0599-51234567',
    orderCount: 4, invoiceStatus: '已开票',
    paymentRecords: [
      { date: '2025-06-03', amount: '¥ 150,000', method: '银行转账', remark: '金骏眉系列货款' },
      { date: '2025-06-12', amount: '¥ 50,000', method: '银行转账', remark: '正山小种预付款' },
    ],
  },
  {
    id: '3', code: 'REC-S-2025-0046', customer: '清心茶坊', customerType: 'direct',
    period: '2025.06.01 - 2025.06.15',
    salesAmount: '¥ 312,000', receivedAmount: '¥ 312,000', balance: '¥ 0',
    settlementMethod: '月结', status: 'confirmed',
    contactPerson: '林老板', contactPhone: '0768-2345678',
    orderCount: 8, invoiceStatus: '已收票',
    paymentRecords: [
      { date: '2025-06-01', amount: '¥ 200,000', method: '银行转账', remark: '凤凰单丛系列全款' },
      { date: '2025-06-08', amount: '¥ 112,000', method: '银行转账', remark: '大红袍系列全款' },
    ],
  },
  {
    id: '4', code: 'REC-S-2025-0045', customer: '品茗轩', customerType: 'platform',
    period: '2025.05.16 - 2025.05.31',
    salesAmount: '¥ 198,600', receivedAmount: '¥ 150,000', balance: '¥ 48,600',
    settlementMethod: '周期结', status: 'disputed',
    contactPerson: '张女士', contactPhone: '0593-5678901',
    orderCount: 5, invoiceStatus: '已开票',
    paymentRecords: [
      { date: '2025-05-20', amount: '¥ 100,000', method: '银行转账', remark: '白毫银针首批货款' },
      { date: '2025-05-28', amount: '¥ 50,000', method: '承兑汇票', remark: '白牡丹第二批' },
    ],
  },
  {
    id: '5', code: 'REC-S-2025-0044', customer: '翠竹茶行', customerType: 'channel',
    period: '2025.05.16 - 2025.05.31',
    salesAmount: '¥ 88,400', receivedAmount: '¥ 88,400', balance: '¥ 0',
    settlementMethod: '先款结', status: 'confirmed',
    contactPerson: '周经理', contactPhone: '0774-7234567',
    orderCount: 3, invoiceStatus: '已收票',
    paymentRecords: [
      { date: '2025-05-16', amount: '¥ 88,400', method: '银行转账', remark: '六堡茶全款预付' },
    ],
  },
  {
    id: '6', code: 'REC-S-2025-0043', customer: '和风茶屋', customerType: 'direct',
    period: '2025.05.16 - 2025.05.31',
    salesAmount: '¥ 156,200', receivedAmount: '¥ 100,000', balance: '¥ 56,200',
    settlementMethod: '月结', status: 'reconciling',
    contactPerson: '何老板', contactPhone: '0730-8234567',
    orderCount: 5, invoiceStatus: '已开票',
    paymentRecords: [
      { date: '2025-05-18', amount: '¥ 60,000', method: '银行转账', remark: '君山银针第一批' },
      { date: '2025-05-25', amount: '¥ 40,000', method: '银行转账', remark: '君山银针第二批' },
    ],
  },
  {
    id: '7', code: 'REC-S-2025-0042', customer: '云隐茶庄', customerType: 'channel',
    period: '2025.05.16 - 2025.05.31',
    salesAmount: '¥ 178,900', receivedAmount: '¥ 178,900', balance: '¥ 0',
    settlementMethod: '见票结', status: 'confirmed',
    contactPerson: '江总', contactPhone: '0599-5234567',
    orderCount: 4, invoiceStatus: '已收票',
    paymentRecords: [
      { date: '2025-05-20', amount: '¥ 100,000', method: '银行转账', remark: '正山小种系列全款' },
      { date: '2025-05-27', amount: '¥ 78,900', method: '银行转账', remark: '铁观音系列全款' },
    ],
  },
  {
    id: '8', code: 'REC-S-2025-0041', customer: '茗香斋', customerType: 'platform',
    period: '2025.05.01 - 2025.05.15',
    salesAmount: '¥ 90,400', receivedAmount: '¥ 50,000', balance: '¥ 40,400',
    settlementMethod: '月结', status: 'pending',
    contactPerson: '吴经理', contactPhone: '0595-2345678',
    orderCount: 2, invoiceStatus: '待开票',
    paymentRecords: [
      { date: '2025-05-05', amount: '¥ 50,000', method: '银行转账', remark: '铁观音预付' },
    ],
  },
];

export default function SalesReconciliation() {
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
        title="客户对账"
        breadcrumbs={['销售', '客户对账']}
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
          <FilterInput placeholder="搜索对账单号、客户..." />
          <FilterSelect options={['全部状态', '待对账', '对账中', '已确认', '有异议']} />
          <FilterSelect options={['全部客户', '华茗堂茶庄', '雅韵茶社', '清心茶坊', '品茗轩', '翠竹茶行', '和风茶屋', '云隐茶庄', '茗香斋']} />
          <FilterSelect options={['全部时间', '本月', '上个月', '近3月', '本年度']} />
        </FilterBar>

        <Card>
          <Table
            headers={['对账单号', '客户', '客户类型', '对账周期', '销售金额', '已收金额', '应收余额', '结算方式', '状态', '操作']}
            rows={reconciliationData.map((r) => [
              <span className="mono">{r.code}</span>,
              r.customer,
              <span style={{
                padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                background: r.customerType === 'direct' ? '#E3F2FD' : r.customerType === 'channel' ? '#FFF3E0' : '#E8F5E9',
                color: r.customerType === 'direct' ? '#1565C0' : r.customerType === 'channel' ? '#E65100' : '#2E7D32',
                border: `1px solid ${r.customerType === 'direct' ? '#90CAF9' : r.customerType === 'channel' ? '#FFCC80' : '#A5D6A7'}`,
              }}>{CUSTOMER_TYPE_LABELS[r.customerType]}</span>,
              r.period,
              <span className="mono">{r.salesAmount}</span>,
              <span className="mono">{r.receivedAmount}</span>,
              <span className="mono" style={{ color: r.balance !== '¥ 0' ? 'var(--color-module-current-base)' : 'var(--color-text-tertiary)', fontWeight: r.balance !== '¥ 0' ? 'var(--font-semibold)' : undefined }}>{r.balance}</span>,
              r.settlementMethod,
              <StatusTag variant={reconciliationStatusToVariant(r.status)} label={reconciliationStatusLabel(r.status)} />,
              <div className="row-actions" key="act">
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
        statusTag={selectedRecord && <StatusTag variant={reconciliationStatusToVariant(selectedRecord.status)} label={reconciliationStatusLabel(selectedRecord.status)} />}
        subtitle={selectedRecord && `${selectedRecord.customer} · ${selectedRecord.period}`}
        mode="view"
      >
        {selectedRecord && (
          <>
            <DrawerSection title="客户信息">
              <InfoGrid cols={3}>
                <InfoItem label="客户名称" emph>{selectedRecord.customer}</InfoItem>
                <InfoItem label="客户类型">{CUSTOMER_TYPE_LABELS[selectedRecord.customerType]}</InfoItem>
                <InfoItem label="对账单号" emph mono>{selectedRecord.code}</InfoItem>
                <InfoItem label="对账周期" span={2}>{selectedRecord.period}</InfoItem>
                <InfoItem label="联系人">{selectedRecord.contactPerson}</InfoItem>
                <InfoItem label="联系电话" mono>{selectedRecord.contactPhone}</InfoItem>
                <InfoItem label="结算方式">{selectedRecord.settlementMethod}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="订单汇总">
              <InfoGrid cols={3}>
                <InfoItem label="关联销售单数" mono>{selectedRecord.orderCount} 单</InfoItem>
                <InfoItem label="发票状态">{selectedRecord.invoiceStatus}</InfoItem>
                <InfoItem label="状态">{reconciliationStatusLabel(selectedRecord.status)}</InfoItem>
                <InfoItem label="销售金额" mono>{selectedRecord.salesAmount}</InfoItem>
                <InfoItem label="已收金额" mono>{selectedRecord.receivedAmount}</InfoItem>
                <InfoItem label="应收余额" mono valueStyle={{ color: selectedRecord.balance !== '¥ 0' ? 'var(--color-module-current-base)' : 'var(--color-text-tertiary)', fontWeight: selectedRecord.balance !== '¥ 0' ? 'var(--font-semibold)' : undefined }}>{selectedRecord.balance}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="收款记录">
              <table className="detail-inline-table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th style={{ textAlign: 'right' }}>金额</th>
                    <th>方式</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRecord.paymentRecords.map((pr, i) => (
                    <tr key={i}>
                      <td className="cell-muted">{pr.date}</td>
                      <td style={{ textAlign: 'right' }} className="mono">{pr.amount}</td>
                      <td>{pr.method}</td>
                      <td className="cell-muted">{pr.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
