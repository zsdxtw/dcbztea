import { useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import StatusTag from '../../components/common/StatusTag';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import type { StatCardData } from '../../types';

const stats: StatCardData[] = [
  { label: '总余额', value: '2,568,300', unit: '¥', icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 14l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '银行存款', value: '2,156,800', unit: '¥', icon: <svg viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8h2M5 11h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { label: '现金', value: '12,500', unit: '¥', icon: <svg viewBox="0 0 18 18" fill="none"><rect x="4" y="2" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6h4M7 9h4M7 12h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { label: '其他', value: '399,000', unit: '¥', icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
];

interface AccountRecord {
  name: string;
  type: string;
  bank: string;
  accountNo: string;
  balance: string;
  status: 'active' | 'frozen';
  recentTransactions?: { date: string; description: string; amount: string; type: 'in' | 'out' }[];
}

const accountItems: AccountRecord[] = [
  {
    name: '工商银行基本户',
    type: '银行存款',
    bank: '中国工商银行杭州分行',
    accountNo: '1202 0200 1234 5678',
    balance: '¥ 1,256,800',
    status: 'active',
    recentTransactions: [
      { date: '2025-07-15', description: '华茗堂茶庄回款', amount: '¥ 68,000', type: 'in' },
      { date: '2025-07-14', description: '杭州西湖茶叶付款', amount: '¥ 86,000', type: 'out' },
      { date: '2025-07-12', description: '雅韵茶社回款', amount: '¥ 45,600', type: 'in' },
      { date: '2025-07-10', description: '福建正山堂付款', amount: '¥ 56,000', type: 'out' },
      { date: '2025-07-08', description: '品茗轩回款', amount: '¥ 38,000', type: 'in' },
    ],
  },
  {
    name: '建设银行一般户',
    type: '银行存款',
    bank: '中国建设银行杭州分行',
    accountNo: '3302 0100 9876 5432',
    balance: '¥ 580,000',
    status: 'active',
    recentTransactions: [
      { date: '2025-07-13', description: '八马茶业付款', amount: '¥ 42,500', type: 'out' },
      { date: '2025-07-11', description: '清心茶坊回款', amount: '¥ 22,400', type: 'in' },
      { date: '2025-07-09', description: '福鼎白茶厂付款', amount: '¥ 32,800', type: 'out' },
    ],
  },
  {
    name: '农业银行一般户',
    type: '银行存款',
    bank: '中国农业银行杭州分行',
    accountNo: '1302 0300 5678 1234',
    balance: '¥ 320,000',
    status: 'active',
    recentTransactions: [
      { date: '2025-07-15', description: '武夷山茶业付款', amount: '¥ 82,400', type: 'out' },
      { date: '2025-07-12', description: '翠竹茶行回款', amount: '¥ 12,500', type: 'in' },
    ],
  },
  {
    name: '中国银行一般户',
    type: '银行存款',
    bank: '中国银行杭州分行',
    accountNo: '5402 0400 4321 8765',
    balance: '¥ 0',
    status: 'frozen',
    recentTransactions: [],
  },
  {
    name: '现金账户',
    type: '现金',
    bank: '—',
    accountNo: '—',
    balance: '¥ 12,500',
    status: 'active',
    recentTransactions: [
      { date: '2025-07-15', description: '日常零星支出', amount: '¥ 500', type: 'out' },
      { date: '2025-07-14', description: '客户现金收款', amount: '¥ 2,000', type: 'in' },
    ],
  },
  {
    name: '支付宝账户',
    type: '其他',
    bank: '支付宝',
    accountNo: 'tea_erp@alipay.com',
    balance: '¥ 399,000',
    status: 'active',
    recentTransactions: [
      { date: '2025-07-15', description: '和风茶屋回款', amount: '¥ 96,800', type: 'in' },
      { date: '2025-07-14', description: '黄山毛峰付款', amount: '¥ 22,600', type: 'out' },
      { date: '2025-07-12', description: '茗香斋回款', amount: '¥ 38,600', type: 'in' },
    ],
  },
];

function accountTypeColor(type: string) {
  switch (type) {
    case '银行存款': return 'var(--color-module-current-base)';
    case '现金': return '#01795D';
    case '其他': return 'var(--color-module-finance-secondary)';
    default: return 'var(--color-neutral-400)';
  }
}

export default function FinanceBalance() {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountRecord | null>(null);

  const handleView = (item: AccountRecord) => {
    setSelectedAccount(item);
    setShowDetail(true);
  };

  return (
    <>
      <ContentHeader title="余额管理" breadcrumbs={['财务', '余额管理']} actions={<><Button variant="ghost">导出</Button><Button><PlusIcon />新增账户</Button></>} />
      <div className="content-body">
        <div className="stat-cards">
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>
        <Card>
          <Table
            headers={['账户名称', '账户类型', '开户行', '账号', '余额', '状态', '操作']}
            rows={accountItems.map((a) => [
              <span className="cell-emph">{a.name}</span>,
              <span style={{ padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: `${accountTypeColor(a.type)}12`, color: accountTypeColor(a.type), border: `1px solid ${accountTypeColor(a.type)}30` }}>{a.type}</span>,
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{a.bank}</span>,
              <span className="mono" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-module-finance-secondary)' }}>{a.accountNo}</span>,
              <span className="mono" style={{ fontWeight: 'var(--font-semibold)' }}>{a.balance}</span>,
              <StatusTag variant={a.status === 'active' ? 'success' : 'error'} label={a.status === 'active' ? '正常' : '冻结'} />,
              <div className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => handleView(a)}>查看</Button>
                <Button size="sm" variant="ghost" onClick={() => handleView(a)}>编辑</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      <DetailDrawer
        open={showDetail && !!selectedAccount}
        onClose={() => setShowDetail(false)}
        badge="BA"
        title={selectedAccount?.name}
        statusTag={selectedAccount && <StatusTag variant={selectedAccount.status === 'active' ? 'success' : 'error'} label={selectedAccount.status === 'active' ? '正常' : '冻结'} />}
        subtitle={selectedAccount && `${selectedAccount.type} · ${selectedAccount.bank}`}
        mode="view"
      >
        {selectedAccount && (
          <>
            <DrawerSection title="账户信息">
              <InfoGrid cols={3}>
                <InfoItem label="账户名称" emph>{selectedAccount.name}</InfoItem>
                <InfoItem label="账户类型">{selectedAccount.type}</InfoItem>
                <InfoItem label="状态">{selectedAccount.status === 'active' ? '正常' : '冻结'}</InfoItem>
                <InfoItem label="开户行" span={2}>{selectedAccount.bank}</InfoItem>
                <InfoItem label="账号" mono valueStyle={{ color: 'var(--color-module-finance-secondary)' }}>{selectedAccount.accountNo}</InfoItem>
                <InfoItem label="当前余额" span={3} mono valueStyle={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--color-module-current-base)' }}>{selectedAccount.balance}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="近期交易">
              {selectedAccount.recentTransactions && selectedAccount.recentTransactions.length > 0 ? (
                <table className="detail-inline-table">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>描述</th>
                      <th style={{ textAlign: 'right' }}>金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAccount.recentTransactions.map((tx, i) => (
                      <tr key={i}>
                        <td className="mono">{tx.date}</td>
                        <td style={{ fontWeight: 'var(--font-medium)' }}>{tx.description}</td>
                        <td style={{ textAlign: 'right' }} className="mono">
                          <span style={{ color: tx.type === 'in' ? '#2E7D32' : '#C62828', fontWeight: 'var(--font-semibold)' }}>
                            {tx.type === 'in' ? '+' : '-'}{tx.amount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 'var(--space-4)' }}>暂无交易记录</p>
              )}
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
