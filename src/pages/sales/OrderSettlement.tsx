import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { TRANSFER_SOURCE_LABELS } from '../../data/externalOrders';
import type { StatCardData, ExternalOrder } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/**
 * 销售 · 订单结算（销售订单第三环节）
 * 转派类订单妥投后进入待结算，结算完成（按时 +5 / 超时 -5 积分）进入已结算。
 * 自营订单无合作商结算环节，不在本页范围。
 */
export default function OrderSettlement() {
  const orders = useOrderFlowStore((s) => s.orders);
  const store = useOrderFlowStore;
  const [tab, setTab] = useState<'pending' | 'settled'>('pending');
  const [detail, setDetail] = useState<ExternalOrder | null>(null);

  /** 结算环节订单：转派类，已签收（待结算）与已结算 */
  const settleOrders = useMemo(() => orders.filter((o) => o.path === 'distribute' && o.partnerName && (
    (o.processStatus === 'processed' && o.partnerStatus === 'delivered')
    || o.processStatus === 'completed'
  )), [orders]);

  const pendingList = useMemo(() => settleOrders.filter((o) => o.processStatus === 'processed' && o.partnerStatus === 'delivered'), [settleOrders]);
  const settledList = useMemo(() => settleOrders.filter((o) => o.processStatus === 'completed'), [settleOrders]);
  const list = tab === 'pending' ? pendingList : settledList;

  const pendingAmount = pendingList.reduce((s, o) => s + o.totalAmount, 0);
  const settledAmount = settledList.reduce((s, o) => s + o.totalAmount, 0);
  const ontimeCount = settledList.filter((o) => o.settleOnTime !== false).length;
  const ontimeRate = settledList.length > 0 ? Math.round((ontimeCount / settledList.length) * 100) : 100;

  const stats: StatCardData[] = [
    { label: '待结算', value: String(pendingList.length), unit: '单', trend: { direction: 'down', value: money(pendingAmount) }, icon: <svg viewBox="0 0 18 18" fill="none"><rect x="2.5" y="4.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5.5 8h7M5.5 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
    { label: '已结算金额', value: settledAmount.toLocaleString(), unit: '¥', trend: { direction: 'up', value: `${settledList.length} 单` }, icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6l2 3 2-3M9 9v4M7.5 10.5h3M7.5 12.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: '按时履约率', value: String(ontimeRate), unit: '%', trend: { direction: ontimeRate >= 90 ? 'up' : 'down', value: '按时结算 +5 积分' }, icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 14l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  ];

  return (
    <>
      <ContentHeader title="订单结算" breadcrumbs={['销售', '订单结算']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          订单结算是销售订单第三环节：转派类订单<strong>妥投确认收货</strong>后进入<strong>待结算</strong>，结算完成进入<strong>已结算</strong>。
          按时履约结算积分 <strong>+5</strong>、超时发货结算积分 <strong>-5</strong>（自动写入合作商积分台账，影响比单排名）；结算金额同步合作商终端「结算」页。
          自营订单无合作商结算环节，不在本页范围。
        </div>

        <div className="stat-cards">{stats.map((s, i) => <StatCard key={i} data={s} />)}</div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', marginTop: 'var(--space-4)' }}>
          <button className={`tab-card-simple${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>
            待结算
            <span className="tab-card-simple-count">{pendingList.length} 单</span>
          </button>
          <button className={`tab-card-simple${tab === 'settled' ? ' active' : ''}`} onClick={() => setTab('settled')}>
            已结算
            <span className="tab-card-simple-count">{settledList.length} 单</span>
          </button>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['订单编号', '合作商', '客户', '来源', '金额', '签收/结算状态', '操作']}
            rows={list.map((o) => [
              <span key="c" className="cell-mono-emph">{o.code}</span>,
              <span key="sp" className="cell-emph">{o.partnerName}</span>,
              <span key="cu" style={{ fontSize: 'var(--text-sm)' }}>{o.customerName}</span>,
              <span key="src" style={{ fontSize: 'var(--text-sm)' }}>{TRANSFER_SOURCE_LABELS[o.transferSource ?? ''] ?? '—'}</span>,
              <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(o.totalAmount)}</span>,
              tab === 'pending'
                ? pill('#FBF3E2', '#9A7A1C', '已妥投 · 待结算')
                : o.settleOnTime === false
                  ? pill('#FBEDEF', '#C13A54', '已结算 · 超时 -5 分')
                  : pill('#E9F4EF', '#01795D', '已结算 · 按时 +5 分'),
              <div key="act" className="row-actions" style={{ whiteSpace: 'nowrap' }}>
                {tab === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => store.getState().advancePartner(o.id, 'settled', { onTime: true })}>结算（按时 · +5）</Button>
                    <Button size="sm" variant="danger" onClick={() => store.getState().advancePartner(o.id, 'settled', { onTime: false })}>结算（超时 · -5）</Button>
                  </>
                )}
                <Button size="sm" variant="ghost" onClick={() => setDetail(o)}>查看</Button>
              </div>,
            ])}
          />
          {list.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              {tab === 'pending' ? '暂无待结算订单。转派订单在「订单发货」确认收货（妥投）后进入本页。' : '暂无已结算订单。'}
            </div>
          )}
        </Card>
      </div>

      {/* 结算详情抽屉（只读） */}
      <DetailDrawer
        open={!!detail}
        onClose={() => setDetail(null)}
        badge="JS"
        title={detail?.code ?? ''}
        statusTag={detail && (detail.processStatus === 'completed'
          ? (detail.settleOnTime === false ? pill('#FBEDEF', '#C13A54', '已结算 · 超时 -5 分') : pill('#E9F4EF', '#01795D', '已结算 · 按时 +5 分'))
          : pill('#FBF3E2', '#9A7A1C', '已妥投 · 待结算'))}
        subtitle={detail ? `${detail.partnerName} · ${detail.customerName} · ${money(detail.totalAmount)}` : ''}
        hideFooter
        footer={<Button variant="ghost" onClick={() => setDetail(null)}>关闭</Button>}
      >
        {detail && (
          <>
            <DrawerSection title="结算信息">
              <InfoGrid>
                <InfoItem label="订单编号" mono emph>{detail.code}</InfoItem>
                <InfoItem label="合作商">{detail.partnerName}</InfoItem>
                <InfoItem label="客户">{detail.customerName}</InfoItem>
                <InfoItem label="来源">{TRANSFER_SOURCE_LABELS[detail.transferSource ?? ''] ?? '—'}</InfoItem>
                <InfoItem label="订单金额" mono emph valueStyle={{ color: 'var(--color-module-current-base)' }}>{money(detail.totalAmount)}</InfoItem>
                <InfoItem label="履约状态">{detail.partnerStatus === 'delivered' ? '已妥投待结算' : '已结算'}</InfoItem>
                {detail.processStatus === 'completed' && (
                  <InfoItem label="结算履约">{detail.settleOnTime === false ? '超时发货 · 积分 -5' : '按时履约 · 积分 +5'}</InfoItem>
                )}
              </InfoGrid>
            </DrawerSection>
            <DrawerSection title={`商品（${detail.items.length} 种）`}>
              <table className="detail-inline-table">
                <thead><tr><th>商品名称</th><th>规格</th><th>数量</th><th>销售实价</th></tr></thead>
                <tbody>
                  {detail.items.map((it, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                      <td>{it.spec}</td>
                      <td className="mono">{it.quantity}</td>
                      <td className="mono">{money(it.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DrawerSection>
            <DrawerSection title="处理轨迹">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {detail.history.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                    <span className="mono" style={{ color: 'var(--color-neutral-400)', flexShrink: 0 }}>{h.time}</span>
                    <span style={{ fontWeight: 'var(--font-medium)', flexShrink: 0 }}>{h.action}</span>
                    {h.detail && <span style={{ color: 'var(--color-neutral-500)' }}>{h.detail}</span>}
                  </div>
                ))}
              </div>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </>
  );
}
