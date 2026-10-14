import { useState, useMemo } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { PageHead, Pill, SETTLE_STATUS_TONE } from './PartnerUI';
import type { PartnerSettlement } from '../../types';
import { partnerSettlements } from '../../data/partner';

const STATUS_LABELS: Record<string, string> = { unsettled: '待结算', pending: '结算中', settled: '已结算' };

/** 合作商结算页：发货订单的结算单管理 */
export default function PartnerSettlement() {
  const [settlements] = useState<PartnerSettlement[]>(partnerSettlements);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<PartnerSettlement | null>(null);

  const filtered = useMemo(() => settlements.filter(s => {
    if (filterStatus && s.status !== filterStatus) return false;
    return true;
  }), [settlements, filterStatus]);

  // 汇总
  const totalSettle = settlements.filter(s => s.status !== 'settled').reduce((sum, s) => sum + s.settleAmount, 0);
  const settledAmount = settlements.filter(s => s.status === 'settled').reduce((sum, s) => sum + s.settleAmount, 0);

  const statusPill = (status: string) => (
    <Pill tone={SETTLE_STATUS_TONE[status]}>{STATUS_LABELS[status]}</Pill>
  );

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 结算"
        title="结算"
        desc="发货订单按月汇总结算，应结金额 = 订单金额 − 扣除费用（平台服务费按 5% 计提），款项汇入合作商结算银行账户。"
      />

      {/* 汇总统计带 */}
      <div className="pk-stats cols-3">
        <div className="pk-stat accent">
          <div className="pk-stat-label">待结算金额</div>
          <div className="pk-stat-value">{totalSettle.toLocaleString()}<small>元</small></div>
          <div className="pk-stat-sub">含待结算与结算中</div>
        </div>
        <div className="pk-stat">
          <div className="pk-stat-label">已结算金额</div>
          <div className="pk-stat-value">{settledAmount.toLocaleString()}<small>元</small></div>
          <div className="pk-stat-sub">历史累计到账</div>
        </div>
        <div className="pk-stat">
          <div className="pk-stat-label">结算单数</div>
          <div className="pk-stat-value">{settlements.length}<small>张</small></div>
          <div className="pk-stat-sub">待处理 {settlements.filter(s => s.status !== 'settled').length} 张</div>
        </div>
      </div>

      {/* 筛选 */}
      <div className="pk-toolbar">
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">全部状态</option>
          <option value="unsettled">待结算</option>
          <option value="pending">结算中</option>
          <option value="settled">已结算</option>
        </select>
        <span className="pk-count">共 {filtered.length} 张结算单</span>
      </div>

      <div className="pk-table-panel">
        <Table
          headers={['结算单号', '结算周期', '订单数', '订单金额', '扣除费用', '应结金额', '结算方式', '状态', '操作']}
          rows={filtered.map(s => [
            <span key="code" className="cell-mono-emph">{s.code}</span>,
            <span key="period" className="cell-emph">{s.period}</span>,
            <span key="cnt" className="mono">{s.orderCount} 单</span>,
            <span key="oa" className="mono">¥{s.orderAmount.toLocaleString()}</span>,
            <span key="ded" className="mono" style={{ color: '#C13A54' }}>-¥{s.deduction.toLocaleString()}</span>,
            <span key="sa" className="mono" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--pk-accent)' }}>¥{s.settleAmount.toLocaleString()}</span>,
            <span key="m">{s.method}</span>,
            statusPill(s.status),
            <div key="act" className="row-actions">
              <Button size="sm" variant="ghost" onClick={() => setSelected(s)}>查看</Button>
            </div>,
          ])}
        />
      </div>

      {/* 结算单详情抽屉 */}
      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        badge="JS"
        title={selected?.code ?? ''}
        statusTag={selected ? statusPill(selected.status) : null}
        subtitle={selected ? `结算周期 ${selected.period} · ${selected.orderCount} 笔订单` : ''}
      >
        {selected && (
          <>
            <DrawerSection title="结算信息">
              <InfoGrid>
                <InfoItem label="结算单号" mono emph>{selected.code}</InfoItem>
                <InfoItem label="结算周期">{selected.period}</InfoItem>
                <InfoItem label="结算方式">{selected.method}</InfoItem>
                <InfoItem label="订单数" mono>{selected.orderCount} 单</InfoItem>
                <InfoItem label="订单金额" mono>¥{selected.orderAmount.toLocaleString()}</InfoItem>
                <InfoItem label="扣除费用" mono valueStyle={{ color: '#C13A54' }}>-¥{selected.deduction.toLocaleString()}</InfoItem>
                <InfoItem label="应结金额" mono emph valueStyle={{ color: 'var(--color-module-current-base)' }}>¥{selected.settleAmount.toLocaleString()}</InfoItem>
                <InfoItem label="创建时间">{selected.createTime}</InfoItem>
                <InfoItem label="结算时间">{selected.settleTime || '—'}</InfoItem>
              </InfoGrid>
              <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                应结金额 = 订单金额 − 扣除费用（平台服务费按 5% 计提），款项汇入合作商结算银行账户
              </div>
            </DrawerSection>

            <DrawerSection title={`关联订单（${selected.orders.length} 笔）`}>
              <table className="detail-inline-table">
                <thead>
                  <tr><th>序号</th><th>订单编号</th></tr>
                </thead>
                <tbody>
                  {selected.orders.map((code, i) => (
                    <tr key={code}>
                      <td className="mono">{i + 1}</td>
                      <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </div>
  );
}
