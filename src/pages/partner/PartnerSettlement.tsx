import { useState, useMemo } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { PageHead, Pill, SETTLE_STATUS_TONE } from './PartnerUI';
import { getPartnerAuth } from './PartnerLayout';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { useSupplierStore } from '../../stores/supplierStore';
import { TRANSFER_SOURCE_LABELS } from '../../data/externalOrders';
import type { PartnerSettlement } from '../../types';
import { partnerSettlements, PARTNER_ORDER_STATUS_LABELS } from '../../data/partner';

const STATUS_LABELS: Record<string, string> = { unsettled: '待结算', pending: '结算中', settled: '已结算' };

/** 合作商结算页：发货订单的结算单管理 + 订单处理流转订单结算进度 */
export default function PartnerSettlement() {
  const [settlements] = useState<PartnerSettlement[]>(partnerSettlements);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<PartnerSettlement | null>(null);

  /** 订单处理流转中心转入我名下的订单（报备 / 指定 / 抢单 / 比单） */
  const auth = getPartnerAuth();
  const suppliers = useSupplierStore((s) => s.suppliers);
  const flowVersion = useOrderFlowStore((s) => s.orders);
  const flowOrders = useMemo(() => {
    const myId = auth?.supplierId ?? suppliers.find((s) => s.terminal.enabled && s.terminal.username === auth?.username)?.id;
    return myId
      ? flowVersion.filter((o) => o.partnerId === myId && ['processed', 'completed'].includes(o.processStatus))
      : [];
  }, [flowVersion, suppliers, auth?.supplierId, auth?.username]);
  const flowUnsettled = flowOrders.filter((o) => o.partnerStatus === 'delivered');
  const flowDoing = flowOrders.filter((o) => o.partnerStatus === 'accepted' || o.partnerStatus === 'shipping');
  const flowSettled = flowOrders.filter((o) => o.partnerStatus === 'settled');

  const filtered = useMemo(() => settlements.filter(s => {
    if (filterStatus && s.status !== filterStatus) return false;
    return true;
  }), [settlements, filterStatus]);

  // 汇总（结算单 + 流转订单实时数据）
  const totalSettle = settlements.filter(s => s.status !== 'settled').reduce((sum, s) => sum + s.settleAmount, 0)
    + flowUnsettled.reduce((sum, o) => sum + o.totalAmount, 0);
  const settledAmount = settlements.filter(s => s.status === 'settled').reduce((sum, s) => sum + s.settleAmount, 0)
    + flowSettled.reduce((sum, o) => sum + o.totalAmount, 0);

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
          <div className="pk-stat-sub">含结算单与流转订单（已签收 {flowUnsettled.length} 单）</div>
        </div>
        <div className="pk-stat">
          <div className="pk-stat-label">已结算金额</div>
          <div className="pk-stat-value">{settledAmount.toLocaleString()}<small>元</small></div>
          <div className="pk-stat-sub">历史累计到账 · 含流转订单 {flowSettled.length} 单</div>
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

      {/* 订单处理 · 流转订单结算进度（实时数据） */}
      <div className="pk-panel">
        <div className="pk-panel-head">
          <span className="pk-panel-title">订单处理 · 流转订单结算</span>
          <span style={{ fontSize: 12, color: 'var(--pk-ink3)' }}>报备 / 指定 / 抢单 / 比单中单的订单，履约签收后进入结算</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '0 22px 14px' }}>
          <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: '#FFF3E0', color: '#E65100' }}>
            待结算 {flowUnsettled.length} 单 · ¥{flowUnsettled.reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}
          </span>
          <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: 'var(--color-neutral-100, #F1F3F5)', color: 'var(--pk-ink2)' }}>
            履约中 {flowDoing.length} 单
          </span>
          <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: '#E8F5E9', color: '#01795D' }}>
            已结算 {flowSettled.length} 单 · ¥{flowSettled.reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}
          </span>
        </div>
        {flowOrders.length > 0 ? (
          <div style={{ padding: '0 22px 18px' }}>
            <Table
              headers={['订单编号', '客户', '订单金额', '转入来源', '履约状态', '结算状态']}
              rows={flowOrders.map(o => [
                <span key="c" className="cell-mono-emph">{o.code}</span>,
                <span key="cu" className="cell-emph">{o.customerName}</span>,
                <span key="a" className="mono" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--pk-accent)' }}>¥{o.totalAmount.toLocaleString()}</span>,
                <span key="src">{o.transferSource ? TRANSFER_SOURCE_LABELS[o.transferSource] : '—'}</span>,
                <span key="st">{PARTNER_ORDER_STATUS_LABELS[o.partnerStatus ?? 'pending']}</span>,
                o.partnerStatus === 'settled'
                  ? <Pill key="set" tone="green">已结算 · {o.settleOnTime === false ? '超时 -5 分' : '按时 +5 分'}</Pill>
                  : o.partnerStatus === 'delivered'
                    ? <Pill key="set" tone="amber">待结算</Pill>
                    : <Pill key="set" tone="gray">履约中</Pill>,
              ])}
            />
          </div>
        ) : (
          <div style={{ padding: '6px 22px 20px', fontSize: 13, color: 'var(--pk-ink3)' }}>
            暂无流转订单。在抢单大厅抢单、比单报名中单或收到平台指定分发后，订单履约与结算进度会显示在这里。
          </div>
        )}
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
