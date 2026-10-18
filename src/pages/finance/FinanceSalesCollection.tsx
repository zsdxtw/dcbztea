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
  { label: '待回款', value: '586,200', unit: '¥', icon: <svg viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8h2M5 11h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { label: '本月已收', value: '698,500', unit: '¥', trend: { direction: 'up', value: '22.3%' }, icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 14l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '回款单数', value: '22', unit: '笔', icon: <svg viewBox="0 0 18 18" fill="none"><rect x="4" y="2" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6h4M7 9h4M7 12h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { label: '逾期', value: '3', unit: '笔', icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v4M9 12.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
];

interface CollectionRecord {
  code: string;
  customer: string;
  reconciliationCode: string;
  amount: string;
  method: string;
  date: string;
  status: 'pending' | 'collecting' | 'received' | 'overdue';
  bankName?: string;
  bankAccount?: string;
  remark?: string;
}

const collectionItems: CollectionRecord[] = [
  { code: 'SC-2025-0042', customer: '华茗堂茶庄', reconciliationCode: 'RC-2025-0138', amount: '¥ 68,000', method: '银行转账', date: '2025-07-15', status: 'received', bankName: '工商银行杭州分行', bankAccount: '1202 0200 5678 1234', remark: '6月销售对账回款' },
  { code: 'SC-2025-0041', customer: '雅韵茶社', reconciliationCode: 'RC-2025-0137', amount: '¥ 45,600', method: '微信支付', date: '2025-07-14', status: 'received', bankName: '微信支付', bankAccount: 'yayun_tea@wechat', remark: '7月订单回款' },
  { code: 'SC-2025-0040', customer: '清心茶坊', reconciliationCode: 'RC-2025-0136', amount: '¥ 82,400', method: '银行转账', date: '2025-07-18', status: 'pending', bankName: '建设银行杭州分行', bankAccount: '3302 0100 4321 8765', remark: '待客户确认对账' },
  { code: 'SC-2025-0039', customer: '品茗轩', reconciliationCode: 'RC-2025-0135', amount: '¥ 128,000', method: '承兑汇票', date: '2025-07-20', status: 'collecting', bankName: '农业银行杭州分行', bankAccount: '1202 0300 8765 4321', remark: '承兑汇票到期日8月20日' },
  { code: 'SC-2025-0038', customer: '翠竹茶行', reconciliationCode: 'RC-2025-0134', amount: '¥ 52,500', method: '银行转账', date: '2025-07-10', status: 'overdue', bankName: '中国银行杭州分行', bankAccount: '5402 0400 1357 2468', remark: '逾期5天，需催收' },
  { code: 'SC-2025-0037', customer: '茗香斋', reconciliationCode: 'RC-2025-0133', amount: '¥ 38,600', method: '微信支付', date: '2025-07-12', status: 'received', bankName: '微信支付', bankAccount: 'mingxiangzhai@wechat', remark: '7月销售回款' },
  { code: 'SC-2025-0036', customer: '和风茶屋', reconciliationCode: 'RC-2025-0132', amount: '¥ 96,800', method: '支付宝', date: '2025-07-22', status: 'pending', bankName: '支付宝', bankAccount: 'hefeng_tea@alipay.com', remark: '待回款确认' },
  { code: 'SC-2025-0035', customer: '云隐茶庄', reconciliationCode: 'RC-2025-0131', amount: '¥ 74,300', method: '银行转账', date: '2025-07-05', status: 'overdue', bankName: '工商银行杭州分行', bankAccount: '1202 0500 2468 1357', remark: '逾期8天，已发催收函' },
];

function collectionStatusToVariant(status: string) {
  switch (status) {
    case 'received': return 'success' as const;
    case 'collecting': return 'info' as const;
    case 'pending': return 'warning' as const;
    case 'overdue': return 'error' as const;
    default: return 'info' as const;
  }
}

function collectionStatusLabel(status: string) {
  switch (status) {
    case 'received': return '已回款';
    case 'collecting': return '回款中';
    case 'pending': return '待回款';
    case 'overdue': return '已逾期';
    default: return status;
  }
}

export default function FinanceSalesCollection() {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<CollectionRecord | null>(null);

  const handleView = (item: CollectionRecord) => {
    setSelectedCollection(item);
    setShowDetail(true);
  };

  return (
    <>
      <ContentHeader title="销售回款" breadcrumbs={['财务', '结算管理', '销售回款']} actions={<><Button variant="ghost">导出</Button><Button><PlusIcon />新建回款</Button></>} />
      <div className="content-body">
        <div className="stat-cards">
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>
        <FilterBar>
          <FilterInput placeholder="搜索回款单号、客户..." />
          <FilterSelect options={['全部状态', '待回款', '回款中', '已回款', '已逾期']} />
          <FilterSelect options={['全部客户', '华茗堂茶庄', '雅韵茶社', '清心茶坊', '品茗轩', '翠竹茶行', '茗香斋', '和风茶屋', '云隐茶庄']} />
          <FilterSelect options={['全部时间', '今日', '本周', '本月', '近3月']} />
        </FilterBar>
        <Card>
          <Table
            headers={['回款单号', '客户', '对账单号', '回款金额', '回款方式', '回款日期', '状态', '操作']}
            rows={collectionItems.map((c) => [
              <span className="mono">{c.code}</span>,
              <span className="cell-emph">{c.customer}</span>,
              <span className="mono">{c.reconciliationCode}</span>,
              <span className="mono">{c.amount}</span>,
              c.method,
              <span className="mono">{c.date}</span>,
              <StatusTag variant={collectionStatusToVariant(c.status)} label={collectionStatusLabel(c.status)} />,
              <div className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => handleView(c)}>查看</Button>
                <Button size="sm" variant="ghost" onClick={() => handleView(c)}>编辑</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      <DetailDrawer
        open={showDetail && !!selectedCollection}
        onClose={() => setShowDetail(false)}
        badge="SC"
        title={selectedCollection?.code}
        statusTag={selectedCollection && <StatusTag variant={collectionStatusToVariant(selectedCollection.status)} label={collectionStatusLabel(selectedCollection.status)} />}
        subtitle={selectedCollection && `${selectedCollection.customer} · ${selectedCollection.amount}`}
        mode="view"
      >
        {selectedCollection && (
          <>
            <DrawerSection title="基本信息">
              <InfoGrid cols={3}>
                <InfoItem label="回款单号" emph mono>{selectedCollection.code}</InfoItem>
                <InfoItem label="客户" emph>{selectedCollection.customer}</InfoItem>
                <InfoItem label="对账单号" mono>{selectedCollection.reconciliationCode}</InfoItem>
                <InfoItem label="回款金额" mono valueStyle={{ color: 'var(--color-module-current-base)', fontWeight: 'var(--font-semibold)' }}>{selectedCollection.amount}</InfoItem>
                <InfoItem label="回款方式">{selectedCollection.method}</InfoItem>
                <InfoItem label="回款日期" mono>{selectedCollection.date}</InfoItem>
                <InfoItem label="备注" span={3}>{selectedCollection.remark || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="收款账户">
              <InfoGrid cols={3}>
                <InfoItem label="收款银行/平台" span={2} valueStyle={{ color: 'var(--color-module-finance-secondary)' }}>{selectedCollection.bankName || '—'}</InfoItem>
                <InfoItem label="收款账号" mono valueStyle={{ color: 'var(--color-module-finance-secondary)' }}>{selectedCollection.bankAccount || '—'}</InfoItem>
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
