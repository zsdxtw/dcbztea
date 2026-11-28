/**
 * 财务 · 余额管理（淡茶半盏收付款银行账户）
 * 数据源 = settlementStore.companyAccounts（共享）：收款管理的收款账户、付款管理的付款账户
 * 下拉选择本列表；收付款登记中手动填写的新账户自动回写本页。
 */
import { useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import StatusTag from '../../components/common/StatusTag';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useSettlementStore } from '../../stores/settlementStore';
import type { CompanyBankAccount } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

function accountTypeColor(type: string) {
  switch (type) {
    case '银行存款': return 'var(--color-module-current-base)';
    case '现金': return '#01795D';
    case '其他': return 'var(--color-module-finance-secondary)';
    default: return 'var(--color-neutral-400)';
  }
}

export default function FinanceBalance() {
  const accounts = useSettlementStore((s) => s.companyAccounts);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CompanyBankAccount | null>(null);

  const handleView = (item: CompanyBankAccount) => {
    setSelectedAccount(item);
    setShowDetail(true);
  };

  const totalBalance = accounts.reduce((s, a) => s + (a.balance ?? 0), 0);

  return (
    <>
      <ContentHeader title="余额管理" breadcrumbs={['财务', '余额管理']} actions={<><Button variant="ghost">导出</Button><Button><svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14, marginRight: 4 }}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>新增账户</Button></>} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          淡茶半盏收付款银行账户台账（共享数据源）：收款管理「收款账户」、付款管理「付款账户」下拉选择本列表账户；
          收付款登记中手动填写的新账户自动回写本页。账户合计 <strong className="mono">{money(totalBalance)}</strong> · 共 {accounts.length} 个账户。
        </div>
        <Card>
          <Table
            headers={['账户名称', '账户类型', '开户行', '账号', '余额', '状态', '操作']}
            rows={accounts.map((a) => [
              <span className="cell-emph">{a.name}</span>,
              <span style={{ padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: `${accountTypeColor(a.type)}12`, color: accountTypeColor(a.type), border: `1px solid ${accountTypeColor(a.type)}30` }}>{a.type}</span>,
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{a.bankName}</span>,
              <span className="mono" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-module-finance-secondary)' }}>{a.accountNo}</span>,
              <span className="mono" style={{ fontWeight: 'var(--font-semibold)' }}>{money(a.balance ?? 0)}</span>,
              <StatusTag variant={a.status === 'frozen' ? 'error' : 'success'} label={a.status === 'frozen' ? '冻结' : '正常'} />,
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
        statusTag={selectedAccount && <StatusTag variant={selectedAccount.status === 'frozen' ? 'error' : 'success'} label={selectedAccount.status === 'frozen' ? '冻结' : '正常'} />}
        subtitle={selectedAccount && `${selectedAccount.type} · ${selectedAccount.bankName}`}
        mode="view"
      >
        {selectedAccount && (
          <>
            <DrawerSection title="账户信息">
              <InfoGrid cols={3}>
                <InfoItem label="账户名称" emph>{selectedAccount.name}</InfoItem>
                <InfoItem label="账户类型">{selectedAccount.type}</InfoItem>
                <InfoItem label="状态">{selectedAccount.status === 'frozen' ? '冻结' : '正常'}</InfoItem>
                <InfoItem label="开户行" span={2}>{selectedAccount.bankName}</InfoItem>
                <InfoItem label="账号" mono valueStyle={{ color: 'var(--color-module-finance-secondary)' }}>{selectedAccount.accountNo}</InfoItem>
                <InfoItem label="当前余额" span={3} mono valueStyle={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--color-module-current-base)' }}>{money(selectedAccount.balance ?? 0)}</InfoItem>
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
                            {tx.type === 'in' ? '+' : '-'}{money(tx.amount)}
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
