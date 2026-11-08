import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { TRANSFER_SOURCE_LABELS } from '../../data/externalOrders';
import type {} from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/**
 * 财务 · 合作商结算（承接原 销售·订单结算）
 * 两个视角：① 按合作商汇总（采购单数/金额/已签收/应付/已付）→ 生成周期结算单；
 * ② 待结算订单（妥投后）逐单结算（按时 +5 / 超时 -5 积分，联动合作商终端「结算」页）。
 */
export default function FinancePartnerSettlement() {
  const orders = useOrderFlowStore((s) => s.orders);
  const purchaseDocs = usePurchaseStore((s) => s.docs);
  const store = useOrderFlowStore;
  const [view, setView] = useState<'partner' | 'pending' | 'settled'>('partner');
  const [statedPartners, setStatedPartners] = useState<Set<string>>(new Set());

  /** 转派结算口径：已签收（待结算）与已结算 */
  const settleOrders = useMemo(() => orders.filter((o) => o.path === 'distribute' && o.partnerName && (
    (o.processStatus === 'processed' && o.partnerStatus === 'delivered')
    || o.processStatus === 'completed'
  )), [orders]);

  const pendingList = settleOrders.filter((o) => o.processStatus === 'processed' && o.partnerStatus === 'delivered');
  const settledList = settleOrders.filter((o) => o.processStatus === 'completed');

  /** 按合作商汇总（转派 PO 口径） */
  const partnerRows = useMemo(() => {
    const map = new Map<string, { name: string; poCount: number; amount: number; signed: number; payable: number; paid: number }>();
    for (const d of purchaseDocs.filter((x) => x.source === 'distribute')) {
      const cur = map.get(d.supplierId) ?? { name: d.supplierName, poCount: 0, amount: 0, signed: 0, payable: 0, paid: 0 };
      cur.poCount += 1;
      cur.amount += d.amount;
      const deliveredQty = d.packages.filter((x) => x.status === 'delivered').length;
      if (deliveredQty > 0 || d.status === 'delivered' || d.status === 'settled') cur.signed += 1;
      if (['delivered', 'settled'].includes(d.status)) cur.payable += d.amount;
      if (d.status === 'settled') cur.paid += d.amount;
      map.set(d.supplierId, cur);
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount);
  }, [purchaseDocs]);

  const pendingAmount = pendingList.reduce((s, o) => s + o.totalAmount, 0);
  const settledAmount = settledList.reduce((s, o) => s + o.totalAmount, 0);
  const ontimeCount = settledList.filter((o) => o.settleOnTime !== false).length;
  const ontimeRate = settledList.length > 0 ? Math.round((ontimeCount / settledList.length) * 100) : 100;


  const list = view === 'pending' ? pendingList : view === 'settled' ? settledList : [];

  return (
    <>
      <ContentHeader title="合作商结算" breadcrumbs={['财务', '对账结算', '合作商结算']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          合作商作为平台供应商的<strong>采购结算</strong>：按合作商汇总直发采购（已签收 → 应付 → 已付）生成周期结算单；
          妥投订单<strong>逐单结算</strong>（按时 +5 / 超时 -5 积分，写入合作商积分台账并同步合作商工作台「结算」页）。
          自营订单无合作商结算环节（见「经营利润」）。
        </div>


        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
          {([['partner', '按合作商汇总'], ['pending', `待结算 ${pendingList.length}`], ['settled', `已结算 ${settledList.length}`]] as const).map(([k, label]) => (
            <button key={k} className={`tab-card-simple${view === k ? ' active' : ''}`} onClick={() => setView(k as typeof view)}>
              {label}
            </button>
          ))}
        </div>

        {view === 'partner' ? (
          <Card style={{ padding: 0 }}>
            <Table
              headers={['合作商', '采购单数', '采购总额', '已签收', '应付金额（已签收口径）', '已付金额', '未付金额', '结算单', '操作']}
              rows={partnerRows.map((r) => {
                const stated = statedPartners.has(r.name);
                return [
                  <span key="n" className="cell-emph">{r.name}</span>,
                  <span key="c" className="mono">{r.poCount}</span>,
                  <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(r.amount)}</span>,
                  <span key="s" className="mono">{r.signed}</span>,
                  <span key="p" className="mono" style={{ color: '#B26A00' }}>{money(r.payable)}</span>,
                  <span key="pa" className="mono" style={{ color: '#01795D' }}>{money(r.paid)}</span>,
                  <span key="u" className="mono">{money(r.payable - r.paid)}</span>,
                  stated
                    ? pill('#E9F4EF', '#01795D', 'ST-202611 已生成')
                    : pill('#F5F5F5', '#9E9E9E', '未生成'),
                  <div key="act" className="row-actions">
                    {!stated ? (
                      <Button size="sm" onClick={() => setStatedPartners((prev) => new Set([...prev, r.name]))}>生成结算单</Button>
                    ) : (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>双方确认中（演示）</span>
                    )}
                  </div>,
                ];
              })}
            />
          </Card>
        ) : (
          <Card style={{ padding: 0 }}>
            <Table
              headers={['订单编号', '合作商', '客户', '来源', '金额', '签收/结算状态', '操作']}
              rows={list.map((o) => [
                <span key="c" className="cell-mono-emph">{o.code}</span>,
                <span key="sp" className="cell-emph">{o.partnerName}</span>,
                <span key="cu" style={{ fontSize: 'var(--text-sm)' }}>{o.customerName}</span>,
                <span key="src" style={{ fontSize: 'var(--text-sm)' }}>{TRANSFER_SOURCE_LABELS[o.transferSource ?? ''] ?? '—'}</span>,
                <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(o.totalAmount)}</span>,
                view === 'pending'
                  ? pill('#FBF3E2', '#9A7A1C', '已妥投 · 待结算')
                  : o.settleOnTime === false
                    ? pill('#FBEDEF', '#C13A54', '已结算 · 超时 -5 分')
                    : pill('#E9F4EF', '#01795D', '已结算 · 按时 +5 分'),
                <div key="act" className="row-actions" style={{ whiteSpace: 'nowrap' }}>
                  {view === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => store.getState().advancePartner(o.id, 'settled', { onTime: true })}>结算（按时 · +5）</Button>
                      <Button size="sm" variant="danger" onClick={() => store.getState().advancePartner(o.id, 'settled', { onTime: false })}>结算（超时 · -5）</Button>
                    </>
                  )}
                </div>,
              ])}
            />
            {list.length === 0 && (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
                {view === 'pending' ? '暂无待结算订单（转派订单妥投后进入待结算）' : '暂无已结算订单'}
              </div>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
