/**
 * 采购 · 采购单结算（采购单维度结算状态视图）
 * 按采购单展示结算进度：待预付（先款后货）/ 待结算（签收后）/ 结算中 / 已结算；
 * 并展示该采购单关联的销售履约单的结算情况（所属销售结算单 / 履约单收款、开票状态）。
 * 采购结算单的新建在「采购 → 采购结算」页（生成采购结算单弹窗），确认对账在该页列表完成。
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { useSettlementStore, purchaseStatementOfPo, purchasePaidOfPo, statementOfOrder } from '../../stores/settlementStore';
import { useSupplierStore } from '../../stores/supplierStore';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { receiveStateOf, invoiceStateOf } from '../../utils/salesOrderFamily';

const money = (n: number) => `¥${n.toLocaleString()}`;

type Tab = 'prepaid' | 'pending' | 'settling' | 'closed';

/** 采购结算进度（派生）：待预付 / 待结算 / 结算中 / 已结算 */
function settleStageOf(
  poStage: 'none' | 'prepaid_open' | 'settling' | 'closed',
): '待预付' | '待结算' | '结算中' | '已结算' {
  if (poStage === 'prepaid_open') return '待预付';
  if (poStage === 'settling') return '结算中';
  if (poStage === 'closed') return '已结算';
  return '待结算';
}

/** 销售结算单阶段 */
function salesStageOf(s: { status: string } | undefined): string {
  if (!s) return '—';
  if (s.status === 'closed') return '已办结';
  if (s.status === 'disputed') return '有异议';
  if (s.status === 'confirmed') return '结算中';
  return '对账中';
}

export default function PurchaseOrderSettlement() {
  const navigate = useNavigate();
  const poDocs = usePurchaseStore((s) => s.docs);
  const purchaseStatements = useSettlementStore((s) => s.purchaseStatements);
  const salesStatements = useSettlementStore((s) => s.salesStatements);
  const orders = useOrderFlowStore((s) => s.orders);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const [tab, setTab] = useState<Tab>('pending');
  const [keyword, setKeyword] = useState('');

  /** 全部采购单（三种来源）的结算进度归类 */
  const rows = useMemo(() => poDocs.map((d) => {
    const st = purchaseStatementOfPo(purchaseStatements, d.id);
    const paid = purchasePaidOfPo(purchaseStatements, d.id);
    let stage: '待预付' | '待结算' | '结算中' | '已结算';
    if (st?.status === 'closed') stage = '已结算';
    else if (st && st.paymentStage === 'prepaid' && (st.prepaidAmount ?? 0) > 0 && st.payments.reduce((s, p) => s + p.amount, 0) >= (st.prepaidAmount ?? 0) - 0.001 && d.status !== 'delivered') stage = '待预付';
    else if (st) stage = '结算中';
    else if (d.status === 'confirmed' && d.deliveryMode === 'direct') stage = '待预付';
    else stage = '待结算';
    /** 关联的销售履约单及其结算情况（按履约单 ID 找订单 → 所属销售结算单 → 收款/开票状态） */
    const order = orders.find((o) => o.id === d.childOrderId);
    const salesStmt = order ? statementOfOrder(salesStatements, order.id) : undefined;
    return {
      po: d,
      stage,
      stmt: st,
      paid,
      salesLinked: order
        ? {
            code: order.code,
            stmtCode: salesStmt?.code ?? null,
            stage: salesStageOf(salesStmt),
            received: order ? receiveStateOf(order, poDocs.filter((x) => x.childOrderId === order.id)) : '未收款',
            invoiced: order ? invoiceStateOf(order) : '未开票',
          }
        : null,
    };
  }), [poDocs, purchaseStatements, salesStatements, orders]);

  const matchKw = (code: string, name: string) => (!keyword.trim() ? true : code.includes(keyword.trim()) || name.includes(keyword.trim()));

  const shown = rows.filter((r) => {
    if (!matchKw(r.po.code, r.po.supplierName)) return false;
    if (tab === 'prepaid') return r.stage === '待预付';
    if (tab === 'pending') return r.stage === '待结算';
    if (tab === 'settling') return r.stage === '结算中';
    return r.stage === '已结算';
  });

  const tabBtn = (key: Tab, label: string) => (
    <button key={key} className={`tab-card-simple${tab === key ? ' active' : ''}`} style={{ transition: 'none' }} onClick={() => setTab(key)}>
      {label}
      <span className="tab-card-simple-count">{rows.filter((r) => (key === 'prepaid' ? r.stage === '待预付' : key === 'pending' ? r.stage === '待结算' : key === 'settling' ? r.stage === '结算中' : r.stage === '已结算')).length} 单</span>
    </button>
  );

  return (
    <>
      <ContentHeader title="采购单结算" breadcrumbs={['采购', '采购管理', '采购单结算']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          按<strong>采购单维度</strong>展示结算进度（待预付 / 待结算 / 结算中 / 已结算）与<strong>关联销售履约单的结算情况</strong>
          （所属销售结算单及履约单收款、开票状态）。生成采购结算单请在「采购 → 采购结算」页点击「生成采购结算单」；
          <strong>采购单在采购结算单办结时置为已结算</strong>。
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          {tabBtn('prepaid', '待预付')}
          {tabBtn('pending', '待结算')}
          {tabBtn('settling', '结算中')}
          {tabBtn('closed', '已结算')}
          <input className="filter-input" placeholder="搜索采购单号、合作商..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 240 }} />
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="ghost" onClick={() => navigate('/purchase/purchase-statements')}>去采购结算 →</Button>
          </span>
        </div>

        <Card style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['采购单号', '合作商', '关联履约单', '履约单结算情况', '来源', '采购金额', '已付金额', '采购结算单', '结算进度'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8pt 10pt', borderBottom: '1px solid var(--color-neutral-100)', background: 'var(--color-neutral-50)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.po.id}>
                  <td className="mono" style={{ padding: '7pt 10pt', fontWeight: 500 }}>{r.po.code}</td>
                  <td style={{ padding: '7pt 10pt', fontSize: 'var(--text-sm)' }}>{r.po.supplierName}</td>
                  <td className="mono" style={{ padding: '7pt 10pt', fontSize: 'var(--text-sm)' }}>{r.po.childOrderCode}</td>
                  <td style={{ padding: '7pt 10pt', fontSize: 'var(--text-xs)', minWidth: 170 }}>
                    {r.salesLinked ? (
                      <>
                        <div className="mono" style={{ whiteSpace: 'nowrap' }}>
                          {r.salesLinked.stmtCode ?? '未纳入结算单'}
                          {r.salesLinked.stmtCode && <span style={{ color: 'var(--color-neutral-500)' }}>（{r.salesLinked.stage}）</span>}
                        </div>
                        <div style={{ color: 'var(--color-neutral-500)' }}>
                          履约单：{r.salesLinked.received} · {r.salesLinked.invoiced}
                        </div>
                      </>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '7pt 10pt', fontSize: 'var(--text-sm)' }}>{r.po.source === 'distribute' ? '合作商直发' : r.po.deliveryMode === 'direct' ? '以销定采·直发' : '以销定采·入库'}</td>
                  <td className="mono" style={{ padding: '7pt 10pt' }}>{money(r.po.amount)}</td>
                  <td className="mono" style={{ padding: '7pt 10pt', color: r.paid > 0 ? '#01795D' : 'var(--color-neutral-400)' }}>{money(r.paid)}</td>
                  <td className="mono" style={{ padding: '7pt 10pt', fontSize: 'var(--text-xs)' }}>{r.stmt ? `${r.stmt.code}${r.stmt.status !== 'closed' ? '（在途）' : ''}` : '—'}</td>
                  <td style={{ padding: '7pt 10pt' }}>
                    <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 'var(--text-xs)', fontWeight: 500, whiteSpace: 'nowrap', background: r.stage === '已结算' ? '#E8F5E9' : r.stage === '结算中' ? '#FBF3E2' : r.stage === '待预付' ? '#E3F2FD' : '#F5F5F5', color: r.stage === '已结算' ? '#01795D' : r.stage === '结算中' ? '#9A7A1C' : r.stage === '待预付' ? '#0F64B5' : 'var(--color-neutral-400)' }}>{r.stage}</span>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)' }}>当前分类下暂无采购单</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
