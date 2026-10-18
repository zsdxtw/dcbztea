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
  { label: '待开票', value: '8', unit: '笔', icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v4M9 12.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { label: '本月开票额', value: '856,200', unit: '¥', trend: { direction: 'up', value: '15.6%' }, icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 14l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '本月收票额', value: '423,600', unit: '¥', trend: { direction: 'up', value: '8.2%' }, icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 5h12l-1.2 8H4.2L3 5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
  { label: '开票单数', value: '35', unit: '笔', icon: <svg viewBox="0 0 18 18" fill="none"><rect x="4" y="2" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6h4M7 9h4M7 12h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
];

interface InvoiceRecord {
  code: string;
  type: '销项发票' | '进项发票';
  party: string;
  amount: string;
  tax: string;
  date: string;
  status: 'pending' | 'issued' | 'received' | 'void';
  lineItems?: { name: string; spec: string; quantity: string; unitPrice: string; amount: string; taxRate: string }[];
  remark?: string;
}

const invoiceItems: InvoiceRecord[] = [
  { code: 'INV-2025-0042', type: '销项发票', party: '华茗堂茶庄', amount: '¥ 68,000', tax: '¥ 8,840', date: '2025-07-15', status: 'issued', lineItems: [{ name: '西湖龙井·明前特级', spec: '250g/罐', quantity: '80', unitPrice: '¥ 580', amount: '¥ 46,400', taxRate: '13%' }, { name: '正山小种·金骏眉', spec: '200g/盒', quantity: '50', unitPrice: '¥ 432', amount: '¥ 21,600', taxRate: '13%' }], remark: '7月销售开票' },
  { code: 'INV-2025-0041', type: '销项发票', party: '雅韵茶社', amount: '¥ 45,600', tax: '¥ 5,928', date: '2025-07-14', status: 'issued', lineItems: [{ name: '铁观音·清香型', spec: '250g/袋', quantity: '60', unitPrice: '¥ 380', amount: '¥ 22,800', taxRate: '13%' }, { name: '白毫银针·特级', spec: '100g/盒', quantity: '40', unitPrice: '¥ 570', amount: '¥ 22,800', taxRate: '13%' }] },
  { code: 'INV-2025-0040', type: '进项发票', party: '武夷山茶业有限公司', amount: '¥ 82,400', tax: '¥ 10,712', date: '2025-07-13', status: 'received', lineItems: [{ name: '大红袍·一级', spec: '500g/袋', quantity: '100', unitPrice: '¥ 420', amount: '¥ 42,000', taxRate: '13%' }, { name: '肉桂·特级', spec: '500g/袋', quantity: '80', unitPrice: '¥ 505', amount: '¥ 40,400', taxRate: '13%' }], remark: '7月采购收票' },
  { code: 'INV-2025-0039', type: '销项发票', party: '清心茶坊', amount: '¥ 22,400', tax: '¥ 2,912', date: '2025-07-18', status: 'pending', lineItems: [{ name: '碧螺春·特级', spec: '200g/罐', quantity: '40', unitPrice: '¥ 560', amount: '¥ 22,400', taxRate: '13%' }], remark: '待开具' },
  { code: 'INV-2025-0038', type: '进项发票', party: '杭州西湖茶叶有限公司', amount: '¥ 86,000', tax: '¥ 11,180', date: '2025-07-12', status: 'received', lineItems: [{ name: '西湖龙井·明前特级', spec: '500g/袋', quantity: '120', unitPrice: '¥ 520', amount: '¥ 62,400', taxRate: '13%' }, { name: '西湖龙井·雨前一级', spec: '500g/袋', quantity: '80', unitPrice: '¥ 295', amount: '¥ 23,600', taxRate: '13%' }] },
  { code: 'INV-2025-0037', type: '销项发票', party: '品茗轩', amount: '¥ 128,000', tax: '¥ 16,640', date: '2025-07-20', status: 'pending', lineItems: [{ name: '普洱茶·古树生饼', spec: '357g/饼', quantity: '200', unitPrice: '¥ 380', amount: '¥ 76,000', taxRate: '13%' }, { name: '普洱茶·熟饼', spec: '357g/饼', quantity: '150', unitPrice: '¥ 347', amount: '¥ 52,000', taxRate: '13%' }], remark: '大客户订单待开票' },
  { code: 'INV-2025-0036', type: '进项发票', party: '八马茶业股份有限公司', amount: '¥ 42,500', tax: '¥ 5,525', date: '2025-07-10', status: 'received', lineItems: [{ name: '铁观音·浓香型', spec: '250g/盒', quantity: '100', unitPrice: '¥ 425', amount: '¥ 42,500', taxRate: '13%' }] },
  { code: 'INV-2025-0035', type: '销项发票', party: '翠竹茶行', amount: '¥ 12,500', tax: '¥ 1,625', date: '2025-07-08', status: 'void', lineItems: [{ name: '黄山毛峰·一级', spec: '250g/袋', quantity: '50', unitPrice: '¥ 250', amount: '¥ 12,500', taxRate: '13%' }], remark: '客户退货，发票已作废' },
];

function invoiceStatusToVariant(status: string) {
  switch (status) {
    case 'issued': return 'success' as const;
    case 'received': return 'info' as const;
    case 'pending': return 'warning' as const;
    case 'void': return 'error' as const;
    default: return 'info' as const;
  }
}

function invoiceStatusLabel(status: string) {
  switch (status) {
    case 'issued': return '已开票';
    case 'received': return '已收票';
    case 'pending': return '待开票';
    case 'void': return '已作废';
    default: return status;
  }
}

export default function FinanceInvoice() {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  const handleView = (item: InvoiceRecord) => {
    setSelectedInvoice(item);
    setShowDetail(true);
  };

  return (
    <>
      <ContentHeader title="发票管理" breadcrumbs={['财务', '发票管理']} actions={<><Button variant="ghost">导出</Button><Button><PlusIcon />开具新发票</Button></>} />
      <div className="content-body">
        <div className="stat-cards">
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>
        <FilterBar>
          <FilterInput placeholder="搜索发票号、往来单位..." />
          <FilterSelect options={['全部类型', '销项发票', '进项发票']} />
          <FilterSelect options={['全部状态', '待开票', '已开票', '已收票', '已作废']} />
          <FilterSelect options={['全部时间', '今日', '本周', '本月', '近3月']} />
        </FilterBar>
        <Card>
          <Table
            headers={['发票号', '发票类型', '往来单位', '金额', '税额', '开票日期', '状态', '操作']}
            rows={invoiceItems.map((inv) => [
              <span className="mono">{inv.code}</span>,
              <StatusTag variant={inv.type === '销项发票' ? 'info' : 'success'} label={inv.type} />,
              inv.party,
              <span className="mono">{inv.amount}</span>,
              <span className="mono" style={{ color: 'var(--color-neutral-500)' }}>{inv.tax}</span>,
              <span className="mono">{inv.date}</span>,
              <StatusTag variant={invoiceStatusToVariant(inv.status)} label={invoiceStatusLabel(inv.status)} />,
              <div className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => handleView(inv)}>查看</Button>
                <Button size="sm" variant="ghost" onClick={() => handleView(inv)}>编辑</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      <DetailDrawer
        open={showDetail && !!selectedInvoice}
        onClose={() => setShowDetail(false)}
        badge="IV"
        title={selectedInvoice?.code}
        statusTag={selectedInvoice && <StatusTag variant={invoiceStatusToVariant(selectedInvoice.status)} label={invoiceStatusLabel(selectedInvoice.status)} />}
        subtitle={selectedInvoice && `${selectedInvoice.type} · ${selectedInvoice.party}`}
        mode="view"
      >
        {selectedInvoice && (
          <>
            <DrawerSection title="基本信息">
              <InfoGrid cols={3}>
                <InfoItem label="发票号" emph mono>{selectedInvoice.code}</InfoItem>
                <InfoItem label="发票类型">{selectedInvoice.type}</InfoItem>
                <InfoItem label="状态">{invoiceStatusLabel(selectedInvoice.status)}</InfoItem>
                <InfoItem label="往来单位" emph span={2}>{selectedInvoice.party}</InfoItem>
                <InfoItem label="开票日期" mono>{selectedInvoice.date}</InfoItem>
                <InfoItem label="金额" mono valueStyle={{ color: 'var(--color-module-current-base)', fontWeight: 'var(--font-semibold)' }}>{selectedInvoice.amount}</InfoItem>
                <InfoItem label="税额" mono valueStyle={{ color: 'var(--color-neutral-500)' }}>{selectedInvoice.tax}</InfoItem>
                <InfoItem label="备注" span={3}>{selectedInvoice.remark || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 && (
              <DrawerSection title="发票明细">
                <table className="detail-inline-table">
                  <thead>
                    <tr>
                      <th>品名</th>
                      <th>规格</th>
                      <th style={{ textAlign: 'right' }}>数量</th>
                      <th style={{ textAlign: 'right' }}>单价</th>
                      <th style={{ textAlign: 'right' }}>金额</th>
                      <th style={{ textAlign: 'right' }}>税率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.lineItems.map((item, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 'var(--font-medium)' }}>{item.name}</td>
                        <td style={{ color: 'var(--color-text-secondary)' }}>{item.spec}</td>
                        <td style={{ textAlign: 'right' }} className="mono">{item.quantity}</td>
                        <td style={{ textAlign: 'right' }} className="mono">{item.unitPrice}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'var(--font-medium)' }} className="mono">{item.amount}</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-text-tertiary)' }} className="mono">{item.taxRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
