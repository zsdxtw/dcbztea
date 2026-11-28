/**
 * 生成销售结算单弹窗（销售 → 销售结算「生成销售结算单」）
 * 样式参照新建销售单弹窗（通栏标题栏 + 可滚动内容区 + 底部操作栏）。
 * 内容 = 淡茶发起对账（生成销售结算单）/ 客户发起对账（登记客户提供的对账单，含差异核对）。
 */
import { useMemo, useState } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { useSettlementStore, settleTargetOf, statementAmountOf, statementOfOrder } from '../../stores/settlementStore';

const money = (n: number) => `¥${n.toLocaleString()}`;

type Mode = 'dacha' | 'customer';

export default function SalesStatementCreateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const orders = useOrderFlowStore((s) => s.orders);
  const statements = useSettlementStore((s) => s.salesStatements);
  const store = useSettlementStore;
  const [msg, setMsg] = useState('');
  const [mode, setMode] = useState<Mode>('dacha');
  const [genTarget, setGenTarget] = useState('');
  const [genPeriod, setGenPeriod] = useState('');
  const [genPicked, setGenPicked] = useState<Set<string>>(new Set());
  const [custNo, setCustNo] = useState('');
  const [custAmount, setCustAmount] = useState('');

  /** 可纳入结算单的履约单：已确收、未取消、未在任何结算单中 */
  const eligibleOrders = useMemo(() => orders.filter((o) => (
    o.processStatus !== 'cancelled' && o.fulfillment?.stage === 'confirmed' && !statementOfOrder(statements, o.id)
  )), [orders, statements]);

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

  if (!open) return null;

  const submit = () => {
    if (!canSubmit) return;
    const pickedOrders = genOrders.filter((o) => genPicked.has(o.id));
    const customerType = pickedOrders[0]?.salesPath === 'via_platform' ? '平台客户' : (pickedOrders[0]?.customerType ?? '直营客户');
    const orderIds = [...genPicked];
    const res = mode === 'dacha'
      ? store.getState().generateSalesStatement({ settleTarget: genTarget, customerType, period: genPeriod, orderIds })
      : store.getState().registerCustomerStatement({
          settleTarget: genTarget, customerType, period: genPeriod, orderIds,
          customerStatementNo: custNo, customerAmount: Number(custAmount),
        });
    if (res.ok) { onClose(); return; }
    setMsg(res.msg);
  };

  return (
    <div className="category-dialog-overlay" onClick={onClose}>
      <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 1180, maxWidth: '94vw', height: '90vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 通栏标题栏（参照新建销售单弹窗） */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-neutral-200)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>生成销售结算单</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 2 }}>销售 / 销售结算 · 从已确收未对账的履约单生成；确认对账在本页列表进行</div>
          </div>
          <button className="drawer-close" onClick={onClose} title="关闭">
            <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* 可滚动内容区 */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 'var(--space-5) var(--space-6)' }}>
          <div style={{ marginBottom: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
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
          </Card>

          {groups.length === 0 && (
            <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-5)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无待对账履约单（履约单客户确收后自动进入待对账）。
            </div>
          )}
        </div>

        {/* 底部操作栏（参照新建销售单弹窗：左侧错误/摘要，右侧按钮） */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-6)', borderTop: '1px solid var(--color-neutral-100)', background: 'var(--color-neutral-0)', flexShrink: 0 }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 'var(--text-sm)' }}>
            {msg
              ? <span style={{ color: '#C62828' }}>{msg}</span>
              : genPicked.size > 0
                ? <span style={{ color: 'var(--color-neutral-500)' }}>
                    已选 {genPicked.size} 行 · 淡茶侧合计 <strong className="mono">{money(dachaAmount)}</strong>
                    {mode === 'customer' && (
                      <span style={{ marginLeft: 12, color: diff === 0 ? 'var(--color-neutral-500)' : diff > 0 ? '#01795D' : '#B26A00' }}>
                        客户金额 <strong className="mono">{money(Number(custAmount || 0))}</strong> · 差异 <strong className="mono">{diff >= 0 ? '+' : ''}{money(diff)}</strong>
                      </span>
                    )}
                  </span>
                : <span style={{ color: 'var(--color-neutral-400)' }}>请选择结算对象并勾选待对账履约单</span>}
          </span>
          <span style={{ display: 'flex', gap: 'var(--space-3)', flexShrink: 0 }}>
            <Button variant="ghost" onClick={onClose}>关闭</Button>
            <Button disabled={!canSubmit} onClick={submit}>
              {mode === 'dacha' ? '生成销售结算单' : '登记客户发起对账'}
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
}
