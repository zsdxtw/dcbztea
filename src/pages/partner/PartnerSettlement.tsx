/**
 * 合作商终端 · 结算
 * 数据源 = 合作商对账单（管理后台「财务 → 合作商结算」生成）：
 * 待确认 → 确认对账 → 平台收票 / 付款核销 → 已办结（付款完成 = 采购单已结算）。
 * 实时面板按采购单金额口径（购销背对背的应付侧），不再使用客户售价。
 */
import { useMemo, useState } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { PageHead, Pill } from './PartnerUI';
import { getPartnerAuth } from './PartnerLayout';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { useSettlementStore } from '../../stores/settlementStore';
import { useSupplierStore } from '../../stores/supplierStore';
import { TRANSFER_SOURCE_LABELS } from '../../data/externalOrders';
import { PARTNER_ORDER_STATUS_LABELS } from '../../data/partner';
import type { PartnerStatement } from '../../types';

const PS_STATUS_LABELS: Record<string, string> = { pending: '待确认', confirmed: '对账中', disputed: '有异议', closed: '已办结' };
const PS_STATUS_TONE: Record<string, 'amber' | 'purple' | 'red' | 'green' | 'gray'> = {
  pending: 'amber', confirmed: 'purple', disputed: 'red', closed: 'green',
};

/** 合作商结算页：对账单管理（确认）+ 我名下分发订单的结算进度（采购单口径） */
export default function PartnerSettlement() {
  const auth = getPartnerAuth();
  const suppliers = useSupplierStore((s) => s.suppliers);
  const orders = useOrderFlowStore((s) => s.orders);
  const poDocs = usePurchaseStore((s) => s.docs);
  const statements = useSettlementStore((s) => s.partnerStatements);
  const store = useSettlementStore;
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<PartnerStatement | null>(null);
  const [msg, setMsg] = useState('');

  const myId = auth?.supplierId ?? suppliers.find((s) => s.terminal.enabled && s.terminal.username === auth?.username)?.id ?? '';
  const myName = suppliers.find((s) => s.id === myId)?.name ?? '';

  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 3600); };

  /** 我名下的对账单 */
  const myStatements = useMemo(() => statements.filter((s) => s.supplierId === myId), [statements, myId]);
  const filtered = filterStatus ? myStatements.filter((s) => s.status === filterStatus) : myStatements;

  /** 我名下分发订单（实时进度；金额按采购单口径） */
  const flowOrders = useMemo(() => (
    myId ? orders.filter((o) => o.partnerId === myId && o.processStatus === 'processed') : []
  ), [orders, myId]);
  const posOf = (orderId: string) => poDocs.filter((d) => d.childOrderId === orderId && d.source === 'distribute');
  const payableOf = (orderId: string, fallback: number) => {
    const pos = posOf(orderId);
    return pos.length > 0 ? pos.reduce((s, d) => s + d.amount, 0) : fallback;
  };

  /** 待对账（已签收未入对账单）采购单 */
  const eligiblePos = poDocs.filter((d) => (
    d.supplierId === myId && d.source === 'distribute' && d.status === 'delivered'
    && !statements.some((st) => st.lines.some((l) => l.poId === d.id))
  ));

  const flowDoing = flowOrders.filter((o) => ['pending', 'accepted', 'shipping', 'transit'].includes(o.partnerStatus ?? ''));
  const flowPaid = flowOrders.filter((o) => posOf(o.id).length > 0 && posOf(o.id).every((d) => d.status === 'settled'));

  /** 汇总（对账单口径：待付 = 在途对账单未付余额 + 未入对账单的已签收采购单） */
  const openUnpaid = myStatements
    .filter((s) => s.status !== 'closed')
    .reduce((sum, s) => sum + Math.max(0, s.amount - s.payments.reduce((acc, p) => acc + p.amount, 0)), 0);
  const eligibleAmount = eligiblePos.reduce((sum, d) => sum + d.amount, 0);
  const totalSettle = openUnpaid + eligibleAmount;
  const settledAmount = myStatements.filter((s) => s.status === 'closed').reduce((sum, s) => sum + s.amount, 0);

  const confirmStatement = (id: string) => {
    const res = store.getState().confirmPartnerStatement(id);
    flash(res.msg);
  };

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 结算"
        title="结算"
        desc="按对账单结算：平台按对账周期汇总你名下已签收的采购单（应付 = 采购单金额），你在线确认后平台收票并按账期付款核销；付款完成即结算完成。"
      />

      {msg && (
        <div style={{ margin: '0 0 14px', padding: '10px 14px', borderRadius: 10, fontSize: 13, background: '#E8F5E9', color: '#01795D' }}>{msg}</div>
      )}

      {/* 汇总统计带 */}
      <div className="pk-stats cols-3">
        <div className="pk-stat accent">
          <div className="pk-stat-label">待结算金额</div>
          <div className="pk-stat-value">{totalSettle.toLocaleString()}<small>元</small></div>
          <div className="pk-stat-sub">在途对账单未付 {(openUnpaid).toLocaleString()} 元 · 待对账 {eligiblePos.length} 张采购单</div>
        </div>
        <div className="pk-stat">
          <div className="pk-stat-label">已结算金额</div>
          <div className="pk-stat-value">{settledAmount.toLocaleString()}<small>元</small></div>
          <div className="pk-stat-sub">已办结对账单累计（付款完成 · 采购单已结算）</div>
        </div>
        <div className="pk-stat">
          <div className="pk-stat-label">对账单数</div>
          <div className="pk-stat-value">{myStatements.length}<small>张</small></div>
          <div className="pk-stat-sub">待确认 {myStatements.filter((s) => s.status === 'pending').length} 张</div>
        </div>
      </div>

      {/* 筛选 */}
      <div className="pk-toolbar">
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">全部状态</option>
          <option value="pending">待确认</option>
          <option value="confirmed">对账中</option>
          <option value="disputed">有异议</option>
          <option value="closed">已办结</option>
        </select>
        <span className="pk-count">共 {filtered.length} 张对账单</span>
      </div>

      <div className="pk-table-panel">
        <Table
          headers={['对账单号', '账期', '采购单数', '应付金额', '已付款', '未付余额', '状态', '操作']}
          rows={filtered.map((s) => {
            const paid = s.payments.reduce((acc, p) => acc + p.amount, 0);
            return [
              <span key="code" className="cell-mono-emph">{s.code}</span>,
              <span key="period" className="cell-emph">{s.period}</span>,
              <span key="cnt" className="mono">{s.lines.length} 张</span>,
              <span key="oa" className="mono">¥{s.amount.toLocaleString()}</span>,
              <span key="pd" className="mono" style={{ color: '#01795D' }}>¥{paid.toLocaleString()}</span>,
              <span key="ub" className="mono" style={{ fontWeight: 'var(--font-semibold)', color: s.amount - paid > 0 ? '#B26A00' : 'var(--pk-accent)' }}>¥{Math.max(0, s.amount - paid).toLocaleString()}</span>,
              <Pill key="st" tone={PS_STATUS_TONE[s.status]}>{PS_STATUS_LABELS[s.status]}</Pill>,
              <div key="act" className="row-actions">
                {s.status === 'pending' && <Button size="sm" onClick={() => confirmStatement(s.id)}>确认对账</Button>}
                <Button size="sm" variant="ghost" onClick={() => setSelected(s)}>查看</Button>
              </div>,
            ];
          })}
        />
        {filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--pk-ink3)' }}>
            暂无对账单。平台按对账周期汇总你名下已签收采购单后，对账单会显示在这里，请及时确认。
          </div>
        )}
      </div>

      {/* 订单分发 · 我名下订单结算进度（采购单口径） */}
      <div className="pk-panel">
        <div className="pk-panel-head">
          <span className="pk-panel-title">订单分发 · 分发订单结算</span>
          <span style={{ fontSize: 12, color: 'var(--pk-ink3)' }}>报备 / 指定 / 比单中单的订单，客户签收后进入平台待对账，付款核销完成即结算</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '0 22px 14px' }}>
          <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: '#FFF3E0', color: '#E65100' }}>
            待对账 {eligiblePos.length} 张 · ¥{eligibleAmount.toLocaleString()}
          </span>
          <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: 'var(--color-neutral-100, #F1F3F5)', color: 'var(--pk-ink2)' }}>
            履约中 {flowDoing.length} 单
          </span>
          <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: '#E8F5E9', color: '#01795D' }}>
            已结算 {flowPaid.length} 单 · ¥{flowPaid.reduce((s, o) => s + payableOf(o.id, o.totalAmount), 0).toLocaleString()}
          </span>
        </div>
        {flowOrders.length > 0 ? (
          <div style={{ padding: '0 22px 18px' }}>
            <Table
              headers={['销售单编号', '客户', '应付金额（采购口径）', '转入来源', '履约状态', '结算状态']}
              rows={flowOrders.map((o) => {
                const pos = posOf(o.id);
                const paid = pos.length > 0 && pos.every((d) => d.status === 'settled');
                return [
                  <span key="c" className="cell-mono-emph">{o.code}</span>,
                  <span key="cu" className="cell-emph">{o.customerName}</span>,
                  <span key="a" className="mono" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--pk-accent)' }}>¥{payableOf(o.id, o.totalAmount).toLocaleString()}</span>,
                  <span key="src">{o.transferSource ? TRANSFER_SOURCE_LABELS[o.transferSource] : '—'}</span>,
                  <span key="st">{PARTNER_ORDER_STATUS_LABELS[o.partnerStatus ?? 'pending']}</span>,
                  paid
                    ? <Pill key="set" tone="green">已结算（付款核销完成）</Pill>
                    : pos.some((d) => d.status === 'delivered' || d.status === 'settled') || o.partnerStatus === 'confirmed'
                      ? <Pill key="set" tone="amber">待对账 / 对账中</Pill>
                      : <Pill key="set" tone="gray">履约中</Pill>,
                ];
              })}
            />
          </div>
        ) : (
          <div style={{ padding: '6px 22px 20px', fontSize: 13, color: 'var(--pk-ink3)' }}>
            暂无分发订单。在比单大厅报名中单或收到平台指定转派后，订单履约与结算进度会显示在这里。
          </div>
        )}
      </div>

      {/* 对账单详情抽屉 */}
      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        badge="DZ"
        title={selected?.code ?? ''}
        statusTag={selected ? <Pill tone={PS_STATUS_TONE[selected.status]}>{PS_STATUS_LABELS[selected.status]}</Pill> : null}
        subtitle={selected ? `${selected.period} · ${selected.lines.length} 张采购单` : ''}
        footer={selected && selected.status === 'pending' ? (
          <>
            <Button variant="ghost" onClick={() => setSelected(null)}>关闭</Button>
            <Button onClick={() => confirmStatement(selected.id)}>确认对账</Button>
          </>
        ) : <Button variant="ghost" onClick={() => setSelected(null)}>关闭</Button>}
      >
        {selected && (
          <>
            <DrawerSection title="对账信息">
              <InfoGrid>
                <InfoItem label="对账单号" mono emph>{selected.code}</InfoItem>
                <InfoItem label="账期">{selected.period}</InfoItem>
                <InfoItem label="应付金额" mono emph>¥{selected.amount.toLocaleString()}</InfoItem>
                <InfoItem label="已付款" mono>¥{selected.payments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}</InfoItem>
                <InfoItem label="状态">{PS_STATUS_LABELS[selected.status]}</InfoItem>
                <InfoItem label="创建时间">{selected.createdAt}</InfoItem>
                {selected.disputeReason && <InfoItem label="异议原因" span={2}>{selected.disputeReason}</InfoItem>}
              </InfoGrid>
              <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                应付金额 = 采购单金额合计（购销背对背的应付侧）；平台付款核销完成后，关联采购单置为已结算（结算完成）。
              </div>
            </DrawerSection>

            <DrawerSection title={`采购单明细（${selected.lines.length} 张）`}>
              <table className="detail-inline-table">
                <thead>
                  <tr><th>采购单号</th><th>关联履约单</th><th>金额</th></tr>
                </thead>
                <tbody>
                  {selected.lines.map((l) => (
                    <tr key={l.poId}>
                      <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{l.poCode}</td>
                      <td className="mono">{l.orderCode}</td>
                      <td className="mono">¥{l.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DrawerSection>

            {selected.payments.length > 0 && (
              <DrawerSection title={`付款记录（${selected.payments.length}）`}>
                <table className="detail-inline-table">
                  <thead><tr><th>日期</th><th>金额</th><th>账户</th><th>备注</th></tr></thead>
                  <tbody>
                    {selected.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="mono">{p.date}</td>
                        <td className="mono">¥{p.amount.toLocaleString()}</td>
                        <td>{p.account || '—'}</td>
                        <td className="cell-muted">{p.remark || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DrawerSection>
            )}
          </>
        )}
      </DetailDrawer>
    </div>
  );
}
