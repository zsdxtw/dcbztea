import { useState, useMemo, useEffect, type ReactNode } from 'react';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { PageHead, Pill, ORDER_STATUS_TONE } from './PartnerUI';
import { getPartnerAuth } from './PartnerLayout';
import { useReportStore, getTransferredOrders } from '../../stores/reportStore';
import { useOrderFlowStore, getPartnerFlowOrders, getPartnerSystemQuote } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { useSupplierStore } from '../../stores/supplierStore';
import { PROVINCE_NAMES, getCities, getDistricts } from '../../data/regions';
import Pagination from '../../components/common/Pagination';
import type { PartnerOrder, PartnerOrderStatus } from '../../types';
import {
  partnerOrders as initialOrders,
  PARTNER_DELIVERY_LABELS,
  PARTNER_COOP_LABELS,
  PARTNER_ORDER_STATUS_LABELS,
  PARTNER_TRANSFER_KIND_LABELS,
} from '../../data/partner';

const money = (n: number) => `¥${n.toLocaleString()}`;

/** 转入类型 → 来源类型标签（指定转入 / 报备转入 / 比单转入） */
const SOURCE_TYPE_LABELS: Record<string, string> = {
  assign: '指定转入',
  'order-self': '报备转入',
  product: '报备转入',
  customer: '报备转入',
  compare: '比单转入',
  'order-opportunity': '商机报备转入',
};

/** 来源类型 → 药丸色调 */
const SOURCE_TONE: Record<string, 'green' | 'gray' | 'purple' | 'amber' | 'blue'> = {
  assign: 'blue',
  'order-self': 'green',
  product: 'green',
  customer: 'green',
  compare: 'purple',
  'order-opportunity': 'gray',
};

/** 订单状态 Tab（已发货 TAB 含 发货中 / 妥投 两态） */
const STATUS_TABS: { key: PartnerOrderStatus | ''; label: string; icon: ReactNode }[] = [
  { key: '', label: '全部状态', icon: <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><rect x="3.5" y="4.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6.5 8h7M6.5 11.5h4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { key: 'pending', label: '待接单', icon: <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M10 6v4l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { key: 'accepted', label: '已接单', icon: <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { key: 'shipping', label: '已发货', icon: <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><path d="M3 6.5h9V14H3zM12 9.5h3l2 3V14h-5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><circle cx="6.5" cy="15.5" r="1.6" stroke="currentColor" strokeWidth="1.3"/><circle cx="14.5" cy="15.5" r="1.6" stroke="currentColor" strokeWidth="1.3"/></svg> },
  { key: 'delivered', label: '已签收', icon: <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><path d="M10 3l7 3v8l-7 3-7-3V6l7-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 10.5l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { key: 'settled', label: '已结算', icon: <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M8 7l2 3 2-3M10 10v4.5M7.8 11h4.4M7.8 13h4.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { key: 'rejected', label: '已驳回', icon: <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
];

/** 状态药丸（已发货 TAB 内区分 发货中 / 妥投） */
const statusPillOf = (status: PartnerOrderStatus) => (
  <Pill tone={ORDER_STATUS_TONE[status]}>{PARTNER_ORDER_STATUS_LABELS[status]}</Pill>
);

/** 倒计时（比单截止） */
const countdownOf = (deadline: number, tick: number) => {
  const remain = deadline - tick;
  if (remain <= 0) return '已截止';
  const m = Math.floor(remain / 60000);
  const s = Math.floor((remain % 60000) / 1000);
  return `${m} 分 ${String(s).padStart(2, '0')} 秒`;
};

/** 比单报名弹窗状态 */
interface SignUpDialogState {
  order: PartnerOrder;
  sel: string[];
  amount: string;
}

/** 发货弹窗状态 */
interface ShipDialogState {
  order: PartnerOrder;
  mode: 'self' | 'logistics';
  company: string;
  trackingNo: string;
  qty: Record<string, string>;
  err: string;
}

/** 比单管理弹窗：查询/管理参加过（报名或中单）的比单订单 */
function CompareMgmtDialog({ orders, onClose }: { orders: PartnerOrder[]; onClose: () => void }) {
  return (
    <div className="category-dialog-overlay" onClick={onClose}>
      <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 860, maxWidth: '94vw', maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 6 }}>比单管理</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)' }}>
          我报名过或中单的全部比单订单：查看报名报价、中单结果与履约进度。
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <table className="detail-inline-table" style={{ margin: 0 }}>
            <thead>
              <tr><th>订单编号</th><th>客户</th><th>商品</th><th>我的报价</th><th>当前状态</th><th>结果</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const won = o.transferKind === 'compare' && (o.status !== 'pending');
                const result = won ? <Pill tone="green">已中单</Pill>
                  : o.status === 'pending' ? <Pill tone="amber">比单中</Pill>
                    : <Pill tone="gray">未中单</Pill>;
                return (
                  <tr key={o.id}>
                    <td className="cell-mono-emph">{o.code}</td>
                    <td>{o.customerName}</td>
                    <td style={{ fontSize: 'var(--text-sm)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.items.map((it) => `${it.productName}×${it.quantity}`).join('、')}</td>
                    <td className="mono">{o.compareMyQuote ? money(o.compareMyQuote) : '—'}</td>
                    <td>{statusPillOf(o.status)}</td>
                    <td>{result}</td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-neutral-400)', padding: 'var(--space-4)' }}>暂未参加过比单（在待接单中对比单订单点击「报名」参与）</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)', flexShrink: 0 }}>
          <Button variant="ghost" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  );
}

/** 比单报名弹窗（参照比单大厅报名流程：商品勾选 + 报价，底价校验由 store 完成） */
function SignUpDialog({ state, tick, myId, myName, onClose, onDone }: {
  state: SignUpDialogState;
  tick: number;
  myId: string;
  myName: string;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [sel, setSel] = useState<string[]>(state.sel);
  const [amount, setAmount] = useState(state.amount);
  const [err, setErr] = useState('');
  const o = state.order;
  const selItems = o.items.filter((it) => sel.includes(it.productName));
  const submit = () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) { setErr('请输入有效的报名报价'); return; }
    if (sel.length === 0) { setErr('请选择要报名的商品'); return; }
    const res = useOrderFlowStore.getState().signUpCompare(o.id.replace('ext_', ''), myId, myName, amt, sel);
    if (!res.ok) { setErr(res.msg); return; }
    onDone(res.msg);
    onClose();
  };
  return (
    <div className="category-dialog-overlay" onClick={onClose}>
      <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 680, maxWidth: '94vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 4 }}>比单报名 · {o.code}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
          客户 {o.customerName} · 订单金额 {money(o.totalAmount)}
          {o.compareFloorNote && <span style={{ color: '#B26A00' }}> · {o.compareFloorNote}</span>}
          {o.compareDeadline && <> · 距截止 <strong className="mono" style={{ color: '#B26A00' }}>{countdownOf(o.compareDeadline, tick)}</strong></>}
          {o.compareQuoteCount !== undefined && <> · 已报名 <strong>{o.compareQuoteCount}</strong> 家</>}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <table className="detail-inline-table" style={{ margin: 0 }}>
            <thead><tr><th style={{ width: 40 }}></th><th>商品名称</th><th>规格</th><th>数量</th><th>单价</th><th>小计</th></tr></thead>
            <tbody>
              {o.items.map((it) => (
                <tr key={it.productName}>
                  <td><input type="checkbox" checked={sel.includes(it.productName)} onChange={() => setSel((f) => (f.includes(it.productName) ? f.filter((x) => x !== it.productName) : [...f, it.productName]))} /></td>
                  <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                  <td>{it.spec}</td>
                  <td className="mono">{it.quantity}</td>
                  <td className="mono">{money(it.price)}</td>
                  <td className="mono">{money(it.price * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>报名报价（元） *</span>
            <input className="filter-input mono" type="number" min={0} placeholder="不低于底价" style={{ width: 150 }} value={amount} onChange={(e) => { setAmount(e.target.value.replace(/[^\d.]/g, '')); setErr(''); }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>已选 {selItems.length} 种商品 · 定标按「报价 + 积分」综合评分</span>
          </div>
          {err && <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)', color: '#C62828' }}>{err}</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexShrink: 0 }}>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={submit}>提交报名</Button>
        </div>
      </div>
    </div>
  );
}

/** 发货弹窗：发货方式（自行配送 / 物流公司+单号）+ 按商品拆单发货（单商品可分多批、按数量拆分） */
function ShipDialog({ state, onClose, onDone }: {
  state: ShipDialogState;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [mode, setMode] = useState<'self' | 'logistics'>(state.mode);
  const [company, setCompany] = useState(state.company);
  const [trackingNo, setTrackingNo] = useState(state.trackingNo);
  const [qty, setQty] = useState<Record<string, string>>(state.qty);
  const [err, setErr] = useState('');
  const o = state.order;
  const flowId = o.id.replace('ext_', '');
  const doc = usePurchaseStore.getState().docs.find((d) => d.childOrderCode === o.code);
  const hasDoc = !!doc && ['confirmed', 'partial_shipped', 'fully_shipped'].includes(doc.status);

  const submit = () => {
    if (mode === 'logistics' && (!company.trim() || !trackingNo.trim())) { setErr('请填写物流公司与物流单号'); return; }
    const items = hasDoc
      ? doc!.items.map((it) => ({ productId: it.productId, qty: Number(qty[it.productId] ?? 0) })).filter((x) => x.qty > 0)
      : [];
    if (hasDoc && items.length === 0) {
      if (mode === 'self') {
        // 自行配送未填数量：默认整单全部发货
        doc!.items.forEach((it) => {
          const remain = it.quantity - it.shippedQty;
          if (remain > 0) items.push({ productId: it.productId, qty: remain });
        });
      } else {
        setErr('请至少填写一种商品的本次发货数量'); return;
      }
    }
    if (hasDoc && items.some((x) => { const it = doc!.items.find((i) => i.productId === x.productId)!; return x.qty > it.quantity - it.shippedQty; })) {
      setErr('发货数量不能超过剩余可发数量'); return;
    }
    if (hasDoc) {
      const res = usePurchaseStore.getState().registerShipment(o.code, {
        logisticsCompany: mode === 'self' ? '自行配送' : company.trim(),
        trackingNo: mode === 'self' ? '自送无单号' : trackingNo.trim(),
        items,
        operator: getPartnerAuth()?.name,
      });
      if (!res.ok) { setErr(res.msg); return; }
    }
    // 推进销售订单状态：已接单 → 发货中（比单中单订单底层 partnerStatus 未写入，直接推进）
    const flowOrder = useOrderFlowStore.getState().orders.find((x) => x.id === flowId);
    if (flowOrder && (flowOrder.partnerStatus === 'accepted' || !flowOrder.partnerStatus)) {
      useOrderFlowStore.getState().advancePartner(flowId, 'shipping');
    }
    onDone(mode === 'self' ? '已登记自行配送发货' : `已发货：${company.trim()} ${trackingNo.trim()}${items.length > 0 ? `（${items.length} 种商品）` : ''}`);
    onClose();
  };

  return (
    <div className="category-dialog-overlay" onClick={onClose}>
      <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 640, maxWidth: '94vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 4 }}>发货 · {o.code}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)' }}>
          客户 {o.customerName} · 收货 {o.receiver}（{o.receiverPhone}）· {o.receiverAddress}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {/* 发货方式 */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            {([['self', '自行配送', '合作商自行送货上门，无需物流单号'], ['logistics', '物流公司', '填写物流公司与物流单号']] as const).map(([m, label, desc]) => (
              <label key={m} style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', border: `1px solid ${mode === m ? '#01795D' : 'var(--color-neutral-200)'}`, background: mode === m ? '#E6F2ED' : 'transparent' }}>
                <input type="radio" name="ship-mode" checked={mode === m} onChange={() => setMode(m)} style={{ marginTop: 3 }} />
                <span>
                  <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{label}</span>
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 2 }}>{desc}</span>
                </span>
              </label>
            ))}
          </div>
          {mode === 'logistics' && (
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 4 }}>物流公司 *</label>
                <input className="filter-input" placeholder="如 顺丰速运" style={{ width: 160 }} value={company} onChange={(e) => { setCompany(e.target.value); setErr(''); }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 4 }}>物流单号 *</label>
                <input className="filter-input mono" placeholder="物流单号" style={{ width: 200 }} value={trackingNo} onChange={(e) => { setTrackingNo(e.target.value); setErr(''); }} />
              </div>
            </div>
          )}
          {/* 按商品拆单发货（有采购单关联时） */}
          {hasDoc ? (
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 6 }}>本次发货数量（支持拆单：同一商品可分多批发货）</div>
              <table className="detail-inline-table" style={{ margin: 0 }}>
                <thead><tr><th>商品名称</th><th>数量</th><th>已发</th><th>剩余</th><th>本次发货</th></tr></thead>
                <tbody>
                  {doc!.items.map((it) => {
                    const remain = it.quantity - it.shippedQty;
                    return (
                      <tr key={it.productId}>
                        <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                        <td className="mono">{it.quantity}</td>
                        <td className="mono">{it.shippedQty}</td>
                        <td className="mono" style={{ color: remain > 0 ? '#9A7A1C' : 'var(--color-neutral-400)' }}>{remain}</td>
                        <td>
                          <input
                            className="filter-input mono" type="number" min={0} max={remain} disabled={remain <= 0}
                            placeholder={remain > 0 ? String(remain) : '—'}
                            value={qty[it.productId] ?? ''}
                            onChange={(e) => { setQty((f) => ({ ...f, [it.productId]: e.target.value })); setErr(''); }}
                            style={{ width: 90 }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {doc!.packages.filter((x) => x.status !== 'void').length > 0 && (
                <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
                  已有 {doc!.packages.filter((x) => x.status !== 'void').length} 个包裹发货；剩余数量可在下一次继续发货。
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', lineHeight: 1.7 }}>
              该订单无采购单商品明细关联，确认后将直接标记为已发货（发货中）。
            </div>
          )}
          {err && <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: '#C62828' }}>{err}</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexShrink: 0 }}>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={submit}>{mode === 'self' ? '确认自行配送' : '确认发货'}</Button>
        </div>
      </div>
    </div>
  );
}

/** 合作商订单管理：平台转派订单 + 报备转入订单 + 分发转入（指定/报备/比单报名） */
export default function PartnerOrders() {
  const reports = useReportStore((s) => s.reports);
  /** 报备规则自动转入的订单（商机订单由平台履约） */
  const transferred = useMemo(() => getTransferredOrders(reports), [reports]);
  /** 外部订单分发中心转入的订单（按当前登录合作商过滤） */
  const flowOrdersVersion = useOrderFlowStore((s) => s.orders);
  const compareVersion = useOrderFlowStore((s) => s.settings);
  const suppliers = useSupplierStore((s) => s.suppliers);
  /** 每秒 tick：比单截止倒计时 + 截止后自动抽走 */
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const flowOrders = useMemo(() => {
    const auth = getPartnerAuth();
    const myId = auth?.supplierId ?? suppliers.find((s) => s.terminal.enabled && s.terminal.username === auth?.username)?.id;
    return myId ? getPartnerFlowOrders(myId) : [];
    // tick 依赖：比单订单截止后自动从待接单抽走（每秒刷新计算）
  }, [flowOrdersVersion, suppliers, compareVersion, tick]);

  /** 平台转派的手动订单 */
  const [manualOrders, setManualOrders] = useState<PartnerOrder[]>(initialOrders);
  /** 转入订单的状态覆盖（接单/发货等操作仅存于本次会话） */
  const [transferOverrides, setTransferOverrides] = useState<Record<string, PartnerOrderStatus>>({});
  const [keyword, setKeyword] = useState('');
  const [filterDelivery, setFilterDelivery] = useState('');
  const [filterCoop, setFilterCoop] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  /** 全部状态下的附加筛选：客户 / 收件地区（省/市/县三联）/ 下单日期范围 */
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterProv, setFilterProv] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterDist, setFilterDist] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  /** 分页 */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<PartnerOrder | null>(null);
  /** 弹窗：比单报名 / 比单管理 / 发货 */
  const [signUpOf, setSignUpOf] = useState<SignUpDialogState | null>(null);
  const [compareMgmtOpen, setCompareMgmtOpen] = useState(false);
  const [shipOf, setShipOf] = useState<ShipDialogState | null>(null);
  const [msg, setMsg] = useState('');
  const flash = (text: string) => { setMsg(text); setTimeout(() => setMsg(''), 3500); };

  const allOrders = useMemo(() => [
    ...flowOrders,
    ...transferred.map((t) => (transferOverrides[t.id] ? { ...t, status: transferOverrides[t.id]! } : t)),
    ...manualOrders,
  ], [flowOrders, transferred, transferOverrides, manualOrders]);

  /** 应用搜索/配送/合作模式筛选（不含状态）后的订单：供状态 Tab 计数与状态过滤复用 */
  /** 客户下拉选项（当前状态下订单客户去重） */
  const customerOptions = useMemo(() => {
    const scope = allOrders.filter(o => {
      if (filterDelivery && o.deliveryMode !== filterDelivery) return false;
      if (filterCoop && o.coopMode !== filterCoop) return false;
      return true;
    });
    return [...new Set(scope.map((o) => o.customerName))];
  }, [allOrders, filterDelivery, filterCoop]);

  const baseOrders = useMemo(() => allOrders.filter(o => {
    if (keyword && !o.code.includes(keyword) && !o.customerName.includes(keyword) && !o.receiver.includes(keyword)) return false;
    if (filterDelivery && o.deliveryMode !== filterDelivery) return false;
    if (filterCoop && o.coopMode !== filterCoop) return false;
    if (filterCustomer && o.customerName !== filterCustomer) return false;
    // 收件地区三联（省市县，兼容"南京/南京市"写法）
    if (filterProv) {
      const region = o.customerRegion ?? '';
      if (!region.includes(filterProv)) return false;
      if (filterCity && !region.includes(filterCity.replace(/市$/, ''))) return false;
      if (filterDist && !region.includes(filterDist) && !(o.receiverAddress ?? '').includes(filterDist)) return false;
    }
    // 下单日期范围（含当日）
    if (dateFrom && o.orderDate < dateFrom) return false;
    if (dateTo && o.orderDate > dateTo) return false;
    return true;
  }), [allOrders, keyword, filterDelivery, filterCoop, filterCustomer, filterProv, filterCity, filterDist, dateFrom, dateTo]);

  /** 各状态 Tab 的订单数（已发货 = 发货中 + 妥投 两态） */
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    STATUS_TABS.forEach(t => {
      c[t.key] = t.key === '' ? baseOrders.length
        : t.key === 'shipping' ? baseOrders.filter(o => o.status === 'shipping' || o.status === 'transit').length
          : baseOrders.filter(o => o.status === t.key).length;
    });
    return c;
  }, [baseOrders]);

  const filtered = useMemo(
    () => (filterStatus === 'shipping'
      ? baseOrders.filter(o => o.status === 'shipping' || o.status === 'transit')
      : filterStatus ? baseOrders.filter(o => o.status === filterStatus) : baseOrders),
    [baseOrders, filterStatus],
  );
  const pagedRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [keyword, filterDelivery, filterCoop, filterStatus, pageSize, filterCustomer, filterProv, filterCity, filterDist, dateFrom, dateTo]);

  const transferCount = transferred.length;
  /** 当前登录合作商 ID / 名称（比单报名用） */
  const myId = useMemo(() => {
    const auth = getPartnerAuth();
    return auth?.supplierId ?? suppliers.find((s) => s.terminal.enabled && s.terminal.username === auth?.username)?.id ?? '';
  }, [suppliers]);
  const myName = useMemo(() => suppliers.find((s) => s.id === myId)?.name ?? '', [suppliers, myId]);

  /** 我参加过的比单订单（报名过或中单）—— 比单管理弹窗数据 */
  const myCompareOrders = useMemo(() => allOrders.filter((o) =>
    (o.transferKind === 'compare' && (o.compareSigned || o.status !== 'pending' || o.status === 'pending' && o.compareSigned)) ||
    (o.compareMyQuote !== undefined),
  ), [allOrders]);

  const updateStatus = (id: string, status: PartnerOrderStatus) => {
    if (id.startsWith('ext_')) {
      // 外部订单分发中心转入的订单：状态回写 orderFlowStore（结算自动写积分台账）
      useOrderFlowStore.getState().advancePartner(id.replace('ext_', ''), status, { onTime: true });
    } else if (id.startsWith('transfer_')) {
      setTransferOverrides((prev) => ({ ...prev, [id]: status }));
    } else {
      setManualOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    }
    setSelected((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
  };

  const statusPill = (status: PartnerOrderStatus) => statusPillOf(status);

  /** 操作按钮（待接单/已接单/已发货/妥投） */
  const rowActions = (o: PartnerOrder) => {
    const platformHandled = o.transferKind === 'order-opportunity';
    if (platformHandled) return null;
    if (o.status === 'pending') {
      if (o.transferKind === 'compare') {
        // 比单订单：操作是报名（已报名展示比单中标记）
        return (
          <>
            {o.compareSigned ? (
              <>
                <span style={{ fontSize: 'var(--text-xs)', color: '#B26A00', fontWeight: 500 }}>已报名{ o.compareMyQuote ? ` ${money(o.compareMyQuote)}` : ''}</span>
                <Button size="sm" variant="ghost" onClick={() => setSignUpOf({ order: o, sel: o.items.map((it) => it.productName), amount: String(o.compareMyQuote ?? '') })}>查看报名</Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setSignUpOf({ order: o, sel: o.items.map((it) => it.productName), amount: String(getPartnerSystemQuote(myId, o.items.map((it) => ({ productId: '', productName: it.productName, spec: it.spec, quantity: it.quantity, price: it.price }))) || '') })}>报名</Button>
            )}
          </>
        );
      }
      return <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, 'accepted')}>接单</Button>;
    }
    if (o.status === 'accepted') {
      return (
        <>
          <Button size="sm" onClick={() => setShipOf({ order: o, mode: 'logistics', company: '', trackingNo: '', qty: {}, err: '' })}>发货</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(o)}>查看</Button>
        </>
      );
    }
    if (o.status === 'shipping') {
      return (
        <>
          <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, 'transit')}>确认妥投</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(o)}>查看</Button>
        </>
      );
    }
    if (o.status === 'transit') {
      return (
        <>
          <Button size="sm" onClick={() => updateStatus(o.id, 'delivered')}>确认签收</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(o)}>查看</Button>
        </>
      );
    }
    return <Button size="sm" variant="ghost" onClick={() => setSelected(o)}>查看</Button>;
  };

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 订单"
        title="订单管理"
        desc="订单来源：指定转入 / 报备转入 / 比单转入（进行中的比单订单在待接单点击「报名」参与，中单后进入已接单）。配送方式：直送订单（合作商直发客户）与入仓订单（先入合作仓再发）；合作模式：差价模式（供应商）与扣点模式（服务商）。已发货含 发货中 / 妥投 两态，妥投后确认签收。"
      />

      {/* 订单状态 Tab 卡片 */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        {STATUS_TABS.map(t => (
          <button key={t.key || 'all'} className={`tab-card-simple${filterStatus === t.key ? ' active' : ''}`} onClick={() => setFilterStatus(t.key)}>
            {t.icon}
            {t.label}
            <span className="tab-card-simple-count">{statusCounts[t.key] ?? 0} 单</span>
          </button>
        ))}
      </div>

      {/* 筛选 + 比单管理 */}
      {msg && <div style={{ marginBottom: 'var(--space-3)', padding: '8px 14px', background: '#E8F5E9', color: '#01795D', borderRadius: 10, fontSize: 13, fontWeight: 500 }}>{msg}</div>}

      <div className="pk-panel">
        <div className="pk-panel-head" style={{ flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' }}>
          <input className="filter-input" placeholder="搜索订单号、客户、收货人..." value={keyword} onChange={e => setKeyword(e.target.value)} style={{ width: 190, height: 32, fontSize: 13 }} />
          <span style={{ fontSize: 13, color: 'var(--pk-ink2)', fontWeight: 500 }}>配送方式：</span>
          <select className="filter-select" value={filterDelivery} onChange={e => setFilterDelivery(e.target.value)} style={{ height: 32, fontSize: 13 }}>
            <option value="">全部</option>
            <option value="direct">直送订单</option>
            <option value="warehouse">入仓订单</option>
          </select>
          <span style={{ fontSize: 13, color: 'var(--pk-ink2)', fontWeight: 500 }}>合作模式：</span>
          <select className="filter-select" value={filterCoop} onChange={e => setFilterCoop(e.target.value)} style={{ height: 32, fontSize: 13 }}>
            <option value="">全部</option>
            <option value="supplier">差价模式</option>
            <option value="service">扣点模式</option>
          </select>
          {filterStatus === '' && (
            <>
              <span style={{ fontSize: 13, color: 'var(--pk-ink2)', fontWeight: 500 }}>客户：</span>
              <select className="filter-select" value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} style={{ height: 32, fontSize: 13, maxWidth: 170 }}>
                <option value="">全部</option>
                {customerOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{ fontSize: 13, color: 'var(--pk-ink2)', fontWeight: 500 }}>收件地区：</span>
              <select className="filter-select" value={filterProv} onChange={e => { setFilterProv(e.target.value); setFilterCity(''); setFilterDist(''); }} style={{ height: 32, fontSize: 13 }}>
                <option value="">省份</option>
                {PROVINCE_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select className="filter-select" disabled={!filterProv} value={filterCity} onChange={e => { setFilterCity(e.target.value); setFilterDist(''); }} style={{ height: 32, fontSize: 13 }}>
                <option value="">地市</option>
                {(filterProv ? getCities(filterProv).map((c) => c.name) : []).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="filter-select" disabled={!filterCity} value={filterDist} onChange={e => setFilterDist(e.target.value)} style={{ height: 32, fontSize: 13 }}>
                <option value="">区县</option>
                {(filterProv && filterCity ? getDistricts(filterProv, filterCity) : []).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <span style={{ fontSize: 13, color: 'var(--pk-ink2)', fontWeight: 500 }}>下单日期：</span>
              <input className="filter-input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ height: 32, fontSize: 13 }} title="开始日期（含当日）" />
              <span style={{ fontSize: 12, color: 'var(--pk-ink3)' }}>至</span>
              <input className="filter-input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ height: 32, fontSize: 13 }} title="结束日期（含当日）" />
            </>
          )}
          <Button style={{ marginLeft: 'auto' }} onClick={() => setCompareMgmtOpen(true)}>比单管理</Button>
        </div>
        <div className="pk-panel-body">
        <div className="pk-table-panel" style={{ margin: 0 }}>
        <table>
          <thead>
            <tr>
              <th>序号</th><th>订单编号</th><th>客户</th><th>商品数</th><th>总金额</th>
              <th>收件人</th><th>收件电话</th><th>收件地区</th>
              <th>配送方式</th><th>合作模式</th><th>来源类型</th><th>状态</th><th>下单日期</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((o, idx) => {
              /** 商机报备订单：平台履约，合作商不可操作 */
              const platformHandled = o.transferKind === 'order-opportunity';
              return (
                <tr key={o.id}>
                  <td className="mono" style={{ color: 'var(--pk-ink3)' }}>{(page - 1) * pageSize + idx + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                      <span className="cell-mono-emph">{o.code}</span>
                      {platformHandled && <Pill tone="blue">平台履约</Pill>}
                    </div>
                  </td>
                  <td className="cell-emph">{o.customerName}</td>
                  <td className="mono">{o.items.length} 种</td>
                  <td className="mono" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--pk-accent)' }}>{money(o.totalAmount)}</td>
                  <td>{o.receiver}</td>
                  <td className="mono" style={{ fontSize: 13 }}>{o.receiverPhone}</td>
                  <td style={{ fontSize: 13 }}>{o.customerRegion ?? '—'}</td>
                  <td><Pill tone={o.deliveryMode === 'direct' ? 'green' : 'blue'}>{PARTNER_DELIVERY_LABELS[o.deliveryMode]}</Pill></td>
                  <td><Pill tone={o.coopMode === 'supplier' ? 'amber' : 'purple'}>{PARTNER_COOP_LABELS[o.coopMode]}</Pill></td>
                  <td>{o.transferKind ? <Pill tone={SOURCE_TONE[o.transferKind]}>{SOURCE_TYPE_LABELS[o.transferKind]}</Pill> : <span style={{ color: 'var(--pk-ink3)' }}>—</span>}</td>
                  {/* 状态：待接单的比单已报名订单展示「待接单-比单中」 */}
                  <td>
                    {o.status === 'pending' && o.compareSigned
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Pill tone="amber">待接单</Pill><span style={{ color: 'var(--pk-ink3)', fontSize: 12 }}>-</span><Pill tone="purple">比单中</Pill></span>
                      : statusPill(o.status)}
                  </td>
                  <td className="cell-muted">{o.orderDate}</td>
                  <td><div className="row-actions">{rowActions(o)}</div></td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={14} style={{ textAlign: 'center', color: 'var(--pk-ink3)', padding: '28px 0' }}>暂无订单</td></tr>
            )}
          </tbody>
        </table>
        </div>
        {(filtered.length > 0) && (
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} label="单订单" />
        )}
        </div>
      </div>

      {/* 订单详情抽屉 */}
      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        badge="PO"
        title={selected?.code ?? ''}
        statusTag={selected ? (selected.status === 'pending' && selected.compareSigned ? <><Pill tone="amber">待接单</Pill><Pill tone="purple">比单中</Pill></> : statusPill(selected.status)) : null}
        subtitle={selected ? `${selected.customerName}（${selected.customerType}）· ${PARTNER_DELIVERY_LABELS[selected.deliveryMode]} · ${PARTNER_COOP_LABELS[selected.coopMode]}${selected.transferKind ? ` · ${SOURCE_TYPE_LABELS[selected.transferKind]}` : ''}` : ''}
        hideFooter
        footer={
          selected && (
            <>
              <Button variant="ghost" onClick={() => setSelected(null)}>关闭</Button>
              {selected.transferKind !== 'order-opportunity' && selected.status === 'pending' && !selected.compareSigned && selected.transferKind !== 'compare' && <Button onClick={() => updateStatus(selected.id, 'accepted')}>接单</Button>}
              {selected.status === 'accepted' && <Button onClick={() => setShipOf({ order: selected, mode: 'logistics', company: '', trackingNo: '', qty: {}, err: '' })}>发货</Button>}
              {selected.status === 'shipping' && <Button onClick={() => updateStatus(selected.id, 'transit')}>确认妥投</Button>}
              {selected.status === 'transit' && <Button onClick={() => updateStatus(selected.id, 'delivered')}>确认签收</Button>}
            </>
          )
        }
      >
        {selected && (
          <>
            <DrawerSection title="订单信息">
              <InfoGrid>
                <InfoItem label="订单编号" mono emph>{selected.code}</InfoItem>
                <InfoItem label="客户名称">{selected.customerName}</InfoItem>
                <InfoItem label="客户类型">{selected.customerType}</InfoItem>
                <InfoItem label="配送方式">{PARTNER_DELIVERY_LABELS[selected.deliveryMode]}</InfoItem>
                <InfoItem label="合作模式">{PARTNER_COOP_LABELS[selected.coopMode]}</InfoItem>
                <InfoItem label="来源类型">{selected.transferKind ? SOURCE_TYPE_LABELS[selected.transferKind] : '—'}</InfoItem>
                <InfoItem label="订单状态">{selected.status === 'pending' && selected.compareSigned ? '待接单-比单中' : PARTNER_ORDER_STATUS_LABELS[selected.status]}</InfoItem>
                <InfoItem label="下单日期">{selected.orderDate}</InfoItem>
                <InfoItem label="预计发货">{selected.expectedShipDate}</InfoItem>
                <InfoItem label="总金额" mono emph valueStyle={{ color: 'var(--color-module-current-base)' }}>{money(selected.totalAmount)}</InfoItem>
                {selected.compareFloorNote && <InfoItem label="比单底价" span={3}>{selected.compareFloorNote}</InfoItem>}
                {selected.sourceReport && (
                  <InfoItem label="转入来源" span={3}>
                    {PARTNER_TRANSFER_KIND_LABELS[selected.transferKind ?? 'product']}
                    {' '}（报备编号 <span className="mono">{selected.sourceReport}</span>，审批通过后自动转入）
                  </InfoItem>
                )}
                {selected.transferKind === 'order-opportunity' && (
                  <InfoItem label="履约方式" span={3}>商机报备订单，由平台进货发货处理，本终端仅同步展示、无需履约</InfoItem>
                )}
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title={`商品明细（${selected.items.length} 种）`}>
              <table className="detail-inline-table">
                <thead>
                  <tr><th>商品名称</th><th>规格</th><th>数量</th><th>单价</th><th>小计</th></tr>
                </thead>
                <tbody>
                  {selected.items.map((it, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                      <td>{it.spec}</td>
                      <td className="mono">{it.quantity}</td>
                      <td className="mono">{money(it.price)}</td>
                      <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(it.quantity * it.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DrawerSection>

            {/* ── 发货台账（采购单包裹：多次发货/拆单发货记录，同步采购单与销售订单） ── */}
            {(() => {
              if (selected.transferKind === 'order-opportunity') return null;
              const doc = usePurchaseStore.getState().docs.find((d) => d.childOrderCode === selected.code);
              if (!doc || doc.packages.filter((x) => x.status !== 'void').length === 0) return null;
              const activePkgs = doc.packages.filter((x) => x.status !== 'void');
              return (
                <DrawerSection title={`发货台账（${activePkgs.length} 个包裹 · 采购单 ${doc.code}）`}>
                  <table className="detail-inline-table">
                    <thead><tr><th>包裹号</th><th>物流公司 / 单号</th><th>本次发货</th><th>发货时间</th><th>状态</th></tr></thead>
                    <tbody>
                      {activePkgs.map((pkg) => (
                        <tr key={pkg.id}>
                          <td className="mono">{pkg.packageNo}</td>
                          <td>{pkg.logisticsCompany} · <span className="mono">{pkg.trackingNo}</span></td>
                          <td style={{ fontSize: 'var(--text-sm)' }}>{pkg.items.map((x) => `${x.productName}×${x.qty}`).join('、')}</td>
                          <td className="mono">{pkg.shippedAt}</td>
                          <td>{pkg.status === 'delivered' ? <Pill tone="green">已签收</Pill> : <Pill tone="blue">已发货</Pill>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DrawerSection>
              );
            })()}

            <DrawerSection title="收货信息">
              <InfoGrid>
                <InfoItem label="收货人">{selected.receiver}</InfoItem>
                <InfoItem label="联系电话" mono>{selected.receiverPhone}</InfoItem>
                <InfoItem label="收货地址" span={3}>{selected.receiverAddress}</InfoItem>
                <InfoItem label="备注" span={3}>{selected.remark || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>

      {/* 弹窗：比单报名 / 比单管理 / 发货 */}
      {signUpOf && <SignUpDialog state={signUpOf} tick={tick} myId={myId} myName={myName} onClose={() => setSignUpOf(null)} onDone={flash} />}
      {compareMgmtOpen && <CompareMgmtDialog orders={myCompareOrders} onClose={() => setCompareMgmtOpen(false)} />}
      {shipOf && <ShipDialog state={shipOf} onClose={() => setShipOf(null)} onDone={flash} />}
    </div>
  );
}
