/**
 * 销售 · 履约单结算（销售结算单生成页）
 * 只负责生成：淡茶发起（生成销售结算单）与客户发起对账（登记客户提供的对账单，含差异核对）。
 * 确认对账在「销售 → 销售结算」；开票 / 收款在财务。设计见 docs/销售单结算流程设计建议.md 第五节。
 */
import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { useSettlementStore, settleTargetOf, statementAmountOf, statementOfOrder } from '../../stores/settlementStore';

const money = (n: number) => `¥${n.toLocaleString()}`;

type Mode = 'dacha' | 'customer';

export default function SalesSettlement() {
  const navigate = useNavigate();
  const orders = useOrderFlowStore((s) => s.orders);
  const statements = useSettlementStore((s) => s.salesStatements);
  const store = useSettlementStore;
  const [msg, setMsg] = useState('');
  const [mode, setMode] = useState<Mode>('dacha');
  const [genTarget, setGenTarget] = useState('');
  const [genPeriod, setGenPeriod] = useState('');
  const [genPicked, setGenPicked] = useState<Set<string>>(new Set());
  /** 客户发起对账 */
  const [custNo, setCustNo] = useState('');
  const [custAmount, setCustAmount] = useState('');

  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 5000); };

  /** 可纳入结算单的履约单：已确收、未取消、未在任何结算单中 */
  const eligibleOrders = useMemo(() => orders.filter((o) => (
    o.processStatus !== 'cancelled' && o.fulfillment?.stage === 'confirmed' && !statementOfOrder(statements, o.id)
  )), [orders, statements]);

  /** 按结算对象分组 */
  const groups = useMemo(() => {
    const map = new Map<string, typeof eligibleOrders>();
    for (const o of eligibleOrders) {
      const k = settleTargetOf(o);
      map.set(k, [...(map.get(k) ?? []), o]);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [eligibleOrders]);

  const genOrders = genTarget ? (groups.find(([k]) => k === genTarget)?.[1] ?? []) : [];
  const dachaAmount = genOrders.filter((o) => genPicked.has(o.id)).reduce((s, o) => s + statementAmountOf(o), 0);
  const diff = Number(custAmount || 0) - dachaAmount;
  const canSubmit = genTarget && genPicked.size > 0 && (mode === 'dacha' || (custNo.trim() && Number(custAmount) > 0));

  const submit = () => {
    if (!canSubmit) return;
    const customerType = genOrders.find((o) => genPicked.has(o.id))?.salesPath === 'via_platform' ? '平台客户' : (genOrders.find((o) => genPicked.has(o.id))?.customerType ?? '直营客户');
    const orderIds = [...genPicked];
    const res = mode === 'dacha'
      ? store.getState().generateSalesStatement({ settleTarget: genTarget, customerType, period: genPeriod, orderIds })
      : store.getState().registerCustomerStatement({
          settleTarget: genTarget, customerType, period: genPeriod, orderIds,
          customerStatementNo: custNo, customerAmount: Number(custAmount),
        });
    flash(res.msg);
    if (res.ok) {
      setGenOpenFalse();
      // 生成后跳到销售结算确认对账
      navigate('/sales/sales-settlement-confirm');
    }
  };
  const setGenOpenFalse = () => { setGenTarget(''); setGenPeriod(''); setGenPicked(new Set()); setCustNo(''); setCustAmount(''); };

  return (
    <>
      <ContentHeader title="履约单结算" breadcrumbs={['销售', '销售单管理', '履约单结算']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          本页只负责<strong>生成销售结算单</strong>（对账阶段）：从<strong>已确收未对账</strong>的履约单中按结算对象勾选生成，
          或登记<strong>客户发起对账</strong>（客户提供对账单，含差异核对）。生成后到「销售 → 销售结算」确认对账；
          确认后的开票、收款在财务菜单完成。
        </div>

        {msg && (
          <div style={{ marginBottom: 'var(--space-3)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: '#E8F5E9', color: '#01795D' }}>{msg}</div>
        )}

        <div style={{ marginBottom: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>结算单来源：</span>
          <button className={`tab-card-simple${mode === 'dacha' ? ' active' : ''}`} style={{ transition: 'none' }} onClick={() => { setMode('dacha'); setGenPicked(new Set()); }}>淡茶发起对账</button>
          <button className={`tab-card-simple${mode === 'customer' ? ' active' : ''}`} style={{ transition: 'none' }} onClick={() => { setMode('customer'); setGenPicked(new Set()); }}>客户发起对账（客户提供对账单）</button>
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>待对账履约单 {eligibleOrders.length} 张（{groups.length} 个结算对象）</span>
        </div>

        <Card style={{ padding: 0 }}>
          <div style={{ padding: '10px 14px', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--color-neutral-100)' }}>
            <select style={{ minWidth: 240 }} value={genTarget} onChange={(e) => { setGenTarget(e.target.value); setGenPicked(new Set()); }} className="filter-select" disabled={groups.length === 0}>
              <option value="">选择结算对象（{groups.length} 个待对账）</option>
              {groups.map(([k, list]) => <option key={k} value={k}>{k}（{list.length} 单）</option>)}
            </select>
            <input className="filter-input" placeholder="账期说明（如 2026-11 月结，仅作参考）" value={genPeriod} onChange={(e) => setGenPeriod(e.target.value)} style={{ width: 260 }} />
            {mode === 'customer' && (
              <>
                <input className="filter-input mono" placeholder="客户对账单号 *" value={custNo} onChange={(e) => setCustNo(e.target.value)} style={{ width: 170 }} />
                <input className="filter-input mono" type="number" placeholder="客户对账金额 *" value={custAmount} onChange={(e) => setCustAmount(e.target.value)} style={{ width: 140 }} />
              </>
            )}
          </div>
          {genTarget && genOrders.length > 0 && (
            <div style={{ padding: '0 14px 6px' }}>
              <table className="detail-inline-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>纳入</th><th>履约单号</th><th>客户</th><th>计入金额</th>
                    {mode === 'customer' && <th>差异说明</th>}
                  </tr>
                </thead>
                <tbody>
                  {genOrders.map((o) => {
                    const amt = statementAmountOf(o);
                    const checked = genPicked.has(o.id);
                    return (
                      <tr key={o.id}>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={checked} onChange={() => setGenPicked((prev) => { const n = new Set(prev); if (n.has(o.id)) n.delete(o.id); else n.add(o.id); return n; })} />
                        </td>
                        <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{o.code}</td>
                        <td style={{ fontSize: 'var(--text-sm)' }}>{o.customerName}</td>
                        <td className="mono">{money(amt)}{o.salesPath === 'via_platform' ? '（销平台实价）' : ''}</td>
                        {mode === 'customer' && (
                          <td style={{ fontSize: 'var(--text-xs)', color: checked ? (diff === 0 ? 'var(--color-neutral-400)' : diff > 0 ? '#01795D' : '#B26A00') : 'var(--color-neutral-300)' }}>
                            {checked ? (diff === 0 ? '无差异' : `客户金额较淡茶侧 ${diff > 0 ? '+' : ''}${money(diff)}`) : '—'}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-neutral-100)' }}>
            <span style={{ fontSize: 'var(--text-sm)' }}>
              已选 {genPicked.size} 行 · 淡茶侧合计 <strong className="mono">{money(dachaAmount)}</strong>
              {mode === 'customer' && genPicked.size > 0 && (
                <span style={{ marginLeft: 12, color: diff === 0 ? 'var(--color-neutral-500)' : diff > 0 ? '#01795D' : '#B26A00' }}>
                  客户金额 <strong className="mono">{money(Number(custAmount || 0))}</strong> · 差异 <strong className="mono">{diff >= 0 ? '+' : ''}{money(diff)}</strong>
                  {diff !== 0 && '（生成后可录差异调整）'}
                </span>
              )}
            </span>
            <Button disabled={!canSubmit} onClick={submit}>
              {mode === 'dacha' ? '生成销售结算单' : '登记客户发起对账'}
            </Button>
          </div>
        </Card>

        {groups.length === 0 && (
          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
            暂无待对账履约单（履约单客户确收后自动进入待对账）。
          </div>
        )}
      </div>
    </>
  );
}
