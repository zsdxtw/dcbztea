import { useState, useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import type { PartnerSettlement } from '../../types';
import { partnerSettlements } from '../../data/partner';

const STATUS_LABELS: Record<string, string> = { unsettled: '待结算', pending: '结算中', settled: '已结算' };
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  unsettled: { bg: '#FFF3E0', color: '#E65100' },
  pending: { bg: '#E3F2FD', color: '#0F64B5' },
  settled: { bg: '#E8F5E9', color: '#01795D' },
};

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

  return (
    <>
      <ContentHeader title="结算" breadcrumbs={['合作商终端', '结算']} />
      <div className="content-body">
        {/* 汇总卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
          {[
            { label: '待结算金额', value: `¥${totalSettle.toLocaleString()}`, desc: '含待结算与结算中', color: '#E65100' },
            { label: '已结算金额', value: `¥${settledAmount.toLocaleString()}`, desc: '历史累计到账', color: '#01795D' },
            { label: '结算单数', value: String(settlements.length), desc: `待处理 ${settlements.filter(s => s.status !== 'settled').length} 单`, color: 'var(--color-neutral-800)' },
          ].map(item => (
            <div key={item.label} style={{ padding: 'var(--space-5)', border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-lg)', background: 'var(--color-neutral-0)' }}>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)' }}>{item.label}</div>
              <div style={{ fontSize: 26, fontWeight: 'var(--font-bold)', color: item.color, marginBottom: 4 }}>{item.value}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* 筛选 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">全部状态</option>
            <option value="unsettled">待结算</option>
            <option value="pending">结算中</option>
            <option value="settled">已结算</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>共 {filtered.length} 张结算单</span>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['结算单号', '结算周期', '订单数', '订单金额', '扣除费用', '应结金额', '结算方式', '状态', '操作']}
            rows={filtered.map(s => [
              <span key="code" className="cell-mono-emph">{s.code}</span>,
              <span key="period" className="cell-emph">{s.period}</span>,
              <span key="cnt" className="mono">{s.orderCount} 单</span>,
              <span key="oa" className="mono">¥{s.orderAmount.toLocaleString()}</span>,
              <span key="ded" className="mono" style={{ color: '#C62828' }}>-¥{s.deduction.toLocaleString()}</span>,
              <span key="sa" className="mono" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)' }}>¥{s.settleAmount.toLocaleString()}</span>,
              <span key="m">{s.method}</span>,
              <span key="st" style={{
                padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                background: STATUS_STYLE[s.status].bg, color: STATUS_STYLE[s.status].color,
              }}>{STATUS_LABELS[s.status]}</span>,
              <div key="act" className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => setSelected(s)}>查看</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      {/* 结算单详情抽屉 */}
      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        badge="JS"
        title={selected?.code ?? ''}
        statusTag={selected ? (
          <span style={{
            padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
            background: STATUS_STYLE[selected.status].bg, color: STATUS_STYLE[selected.status].color,
          }}>{STATUS_LABELS[selected.status]}</span>
        ) : null}
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
                <InfoItem label="扣除费用" mono valueStyle={{ color: '#C62828' }}>-¥{selected.deduction.toLocaleString()}</InfoItem>
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
    </>
  );
}
