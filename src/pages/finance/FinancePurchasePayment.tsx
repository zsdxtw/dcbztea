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
  { label: '待付款', value: '312,800', unit: '¥', icon: <svg viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8h2M5 11h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { label: '本月已付', value: '458,200', unit: '¥', trend: { direction: 'up', value: '12.5%' }, icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 14l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '付款单数', value: '15', unit: '笔', icon: <svg viewBox="0 0 18 18" fill="none"><rect x="4" y="2" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6h4M7 9h4M7 12h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { label: '逾期', value: '2', unit: '笔', icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v4M9 12.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
];

interface PaymentRecord {
  code: string;
  supplier: string;
  reconciliationCode: string;
  amount: string;
  method: string;
  date: string;
  status: 'pending' | 'paying' | 'paid' | 'overdue';
  bankName?: string;
  bankAccount?: string;
  invoiceCode?: string;
  remark?: string;
}

const paymentItems: PaymentRecord[] = [
  { code: 'PP-2025-0038', supplier: '杭州西湖茶叶有限公司', reconciliationCode: 'RC-2025-0128', amount: '¥ 86,000', method: '银行转账', date: '2025-07-15', status: 'paid', bankName: '工商银行杭州分行', bankAccount: '1202 0200 1234 5678', invoiceCode: 'INV-2025-0040', remark: '6月采购对账付款' },
  { code: 'PP-2025-0037', supplier: '福建正山堂茶业有限责任公司', reconciliationCode: 'RC-2025-0127', amount: '¥ 56,000', method: '银行转账', date: '2025-07-12', status: 'paid', bankName: '建设银行武夷山支行', bankAccount: '3502 0100 9876 5432', invoiceCode: 'INV-2025-0038', remark: '红茶采购对账' },
  { code: 'PP-2025-0036', supplier: '八马茶业股份有限公司', reconciliationCode: 'RC-2025-0126', amount: '¥ 42,500', method: '承兑汇票', date: '2025-07-20', status: 'paying', bankName: '农业银行安溪支行', bankAccount: '1302 0300 5678 1234', invoiceCode: 'INV-2025-0036', remark: '铁观音采购对账' },
  { code: 'PP-2025-0035', supplier: '福鼎白茶厂', reconciliationCode: 'RC-2025-0125', amount: '¥ 32,800', method: '银行转账', date: '2025-07-18', status: 'pending', bankName: '中国银行福鼎支行', bankAccount: '6102 0400 4321 8765', invoiceCode: 'INV-2025-0034', remark: '白茶采购对账' },
  { code: 'PP-2025-0034', supplier: '云南普洱茶业集团有限公司', reconciliationCode: 'RC-2025-0124', amount: '¥ 45,600', method: '银行转账', date: '2025-07-08', status: 'overdue', bankName: '工商银行昆明分行', bankAccount: '2502 0500 8765 4321', remark: '逾期未付，需催办' },
  { code: 'PP-2025-0033', supplier: '安溪铁观音集团', reconciliationCode: 'RC-2025-0123', amount: '¥ 28,200', method: '银行转账', date: '2025-07-10', status: 'paid', bankName: '建设银行安溪支行', bankAccount: '3502 0600 1357 2468', invoiceCode: 'INV-2025-0032', remark: '铁观音补货对账' },
  { code: 'PP-2025-0032', supplier: '武夷山茶业有限公司', reconciliationCode: 'RC-2025-0122', amount: '¥ 18,500', method: '银行转账', date: '2025-07-05', status: 'overdue', bankName: '农业银行武夷山支行', bankAccount: '1302 0700 2468 1357', remark: '逾期3天，需跟进' },
  { code: 'PP-2025-0031', supplier: '黄山毛峰茶业有限公司', reconciliationCode: 'RC-2025-0121', amount: '¥ 22,600', method: '支付宝', date: '2025-07-22', status: 'pending', bankName: '支付宝账户', bankAccount: 'hsmaofeng@alipay.com', remark: '绿茶采购对账' },
];

function paymentStatusToVariant(status: string) {
  switch (status) {
    case 'paid': return 'success' as const;
    case 'paying': return 'info' as const;
    case 'pending': return 'warning' as const;
    case 'overdue': return 'error' as const;
    default: return 'info' as const;
  }
}

function paymentStatusLabel(status: string) {
  switch (status) {
    case 'paid': return '已付款';
    case 'paying': return '付款中';
    case 'pending': return '待付款';
    case 'overdue': return '已逾期';
    default: return status;
  }
}

export default function FinancePurchasePayment() {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  const handleView = (item: PaymentRecord) => {
    setSelectedPayment(item);
    setShowDetail(true);
  };

  return (
    <>
      <ContentHeader title="采购付款" breadcrumbs={['财务', '结算管理', '采购付款']} actions={<><Button variant="ghost">导出</Button><Button><PlusIcon />新建付款</Button></>} />
      <div className="content-body">
        <div className="stat-cards">
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>
        <FilterBar>
          <FilterInput placeholder="搜索付款单号、供应商..." />
          <FilterSelect options={['全部状态', '待付款', '付款中', '已付款', '已逾期']} />
          <FilterSelect options={['全部供应商', '杭州西湖茶叶有限公司', '福建正山堂茶业有限责任公司', '八马茶业股份有限公司', '福鼎白茶厂', '云南普洱茶业集团有限公司', '安溪铁观音集团', '武夷山茶业有限公司', '黄山毛峰茶业有限公司']} />
          <FilterSelect options={['全部时间', '今日', '本周', '本月', '近3月']} />
        </FilterBar>
        <Card>
          <Table
            headers={['付款单号', '供应商', '对账单号', '付款金额', '付款方式', '付款日期', '状态', '操作']}
            rows={paymentItems.map((p) => [
              <span className="mono">{p.code}</span>,
              <span className="cell-emph">{p.supplier}</span>,
              <span className="mono">{p.reconciliationCode}</span>,
              <span className="mono">{p.amount}</span>,
              p.method,
              <span className="mono">{p.date}</span>,
              <StatusTag variant={paymentStatusToVariant(p.status)} label={paymentStatusLabel(p.status)} />,
              <div className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => handleView(p)}>查看</Button>
                <Button size="sm" variant="ghost" onClick={() => handleView(p)}>编辑</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      <DetailDrawer
        open={showDetail && !!selectedPayment}
        onClose={() => setShowDetail(false)}
        badge="PP"
        title={selectedPayment?.code}
        statusTag={selectedPayment && <StatusTag variant={paymentStatusToVariant(selectedPayment.status)} label={paymentStatusLabel(selectedPayment.status)} />}
        subtitle={selectedPayment && `${selectedPayment.supplier} · ${selectedPayment.amount}`}
        mode="view"
      >
        {selectedPayment && (
          <>
            <DrawerSection title="基本信息">
              <InfoGrid cols={3}>
                <InfoItem label="付款单号" emph mono>{selectedPayment.code}</InfoItem>
                <InfoItem label="供应商" emph>{selectedPayment.supplier}</InfoItem>
                <InfoItem label="对账单号" mono>{selectedPayment.reconciliationCode}</InfoItem>
                <InfoItem label="付款金额" mono valueStyle={{ color: 'var(--color-module-current-base)', fontWeight: 'var(--font-semibold)' }}>{selectedPayment.amount}</InfoItem>
                <InfoItem label="付款方式">{selectedPayment.method}</InfoItem>
                <InfoItem label="付款日期" mono>{selectedPayment.date}</InfoItem>
                <InfoItem label="备注" span={3}>{selectedPayment.remark || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="发票信息">
              <InfoGrid cols={3}>
                <InfoItem label="发票编号" mono>{selectedPayment.invoiceCode || '—'}</InfoItem>
                <InfoItem label="发票类型">增值税专用发票</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="银行信息">
              <InfoGrid cols={3}>
                <InfoItem label="开户行" span={2} valueStyle={{ color: 'var(--color-module-finance-secondary)' }}>{selectedPayment.bankName || '—'}</InfoItem>
                <InfoItem label="银行账号" mono valueStyle={{ color: 'var(--color-module-finance-secondary)' }}>{selectedPayment.bankAccount || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
