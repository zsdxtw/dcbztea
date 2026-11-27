/**
 * 结算中心 Store（财务 ↔ 销售共享）
 *
 * 职责（见 docs/销售单结算流程设计建议.md）：
 * - 客户对账单（应收一级单据）：手工生成（账期仅参考）→ 客户确认 → 部分开票（多张发票累计覆盖）
 *   → 部分收款（多笔到账逐步核销，预付客户可选钱包余额支付）→ 核销回写履约单 → 已办结。
 *   履约单的收款 / 开票状态由对账单按明细行核销回写（对账单确认 → 订单进度＝结算中）。
 * - 客户钱包余额（客户维度预付账户）：预付充值入余额，对账收款可选钱包余额支付（核销扣减）。
 * - 合作商对账单（应付一级单据）：按合作商汇总已确收采购单 → 合作商确认 → 收票 → 付款核销；
 *   付款核销完成才置采购单已结算（购销背对背：付款不以客户回款为前提）。
 * - 退货冲减：对账单退货调整减少应收净额；预付客户退款回钱包余额。
 */
import { create } from 'zustand';
import { useCustomerStore, orderPlatformRate } from './customerStore';
import type {
  CustomerStatement, CustomerWallet, PartnerStatement, ReceiptMethod,
  StatementLine, ExternalOrder,
} from '../types';
import { externalOrderSeeds } from '../data/externalOrders';
import { useOrderFlowStore } from './orderFlowStore';
import { usePurchaseStore } from './purchaseStore';

const today = () => new Date().toISOString().slice(0, 10);
const nowStamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

/* ── 派生助手 ── */

/** 结算对象：直接销售＝客户本人；经平台销售＝平台客户 */
export function settleTargetOf(o: ExternalOrder): string {
  return o.salesPath === 'via_platform' ? (o.platformCustomerName ?? o.customerName) : o.customerName;
}

/** 对账单计入金额：直接销售＝订单金额；经平台销售＝销平台实价（订单金额 ×（1 − 平台扣点快照）），
 *  平台扣点取订单下单快照（订单价格快照规则，缺省回退客户档案现值——旧数据兜底） */
export function statementAmountOf(o: ExternalOrder): number {
  const rate = orderPlatformRate(o);
  return rate > 0 ? Math.round(o.totalAmount * (1 - rate / 100)) : o.totalAmount;
}

/** 对账单净额 = 对账金额 − 退货冲减 */
export function netOf(s: CustomerStatement): number {
  return s.amount - s.adjustments.reduce((acc, a) => acc + a.amount, 0);
}
export function invoicedOf(s: CustomerStatement): number {
  return s.invoices.reduce((acc, i) => acc + i.amount, 0);
}
export function receivedOf(s: CustomerStatement): number {
  return s.receipts.reduce((acc, r) => acc + r.amount, 0);
}

/** 履约单所在客户对账单（任意状态） */
export function statementOfOrder(statements: CustomerStatement[], orderId: string): CustomerStatement | undefined {
  return statements.find((s) => s.lines.some((l) => l.orderId === orderId));
}

/** 采购单已付金额（按合作商对账单付款 FIFO 分摊到行） */
export function partnerPaidOfPo(statements: PartnerStatement[], poId: string): number {
  let paid = 0;
  for (const st of statements) {
    const line = st.lines.find((l) => l.poId === poId);
    if (!line) continue;
    const before = st.lines.slice(0, st.lines.indexOf(line)).reduce((acc, l) => acc + l.amount, 0);
    let pool = st.payments.reduce((acc, p) => acc + p.amount, 0) - before;
    paid += Math.max(0, Math.min(line.amount, pool));
    if (st.status === 'closed') paid = Math.max(paid, line.amount);
  }
  return paid;
}

/** 采购单所在合作商对账单 */
export function partnerStatementOfPo(statements: PartnerStatement[], poId: string): PartnerStatement | undefined {
  return statements.find((s) => s.lines.some((l) => l.poId === poId));
}

/* ── 单号 ── */
const dateKey = () => today().replace(/-/g, '');
const nextCode = (prefix: string, existing: string[]): string => {
  const seq = existing.filter((c) => c.startsWith(`${prefix}-${dateKey()}`)).length + 1;
  return `${prefix}-${dateKey()}-${String(seq).padStart(2, '0')}`;
};

/* ── 明细行核销：按 FIFO 把金额分摊到行，返回每行累计覆盖金额 ── */
function coverageByLine<T extends { amount: number }>(lines: T[], entries: { amount: number }[]): number[] {
  let pool = entries.reduce((acc, e) => acc + e.amount, 0);
  return lines.map((l) => {
    const take = Math.max(0, Math.min(l.amount, pool));
    pool -= take;
    return take;
  });
}

/* ── 种子 ─ */

/** 客户对账单种子：从已确收未回款的种子订单按结算对象归纳生成（演示部分开票 + 部分收款） */
function seedStatements(): CustomerStatement[] {
  const confirmed = externalOrderSeeds.filter(
    (o) => o.processStatus !== 'cancelled' && o.fulfillment?.stage === 'confirmed' && !o.settled,
  );
  const groups = new Map<string, ExternalOrder[]>();
  for (const o of confirmed) {
    const key = settleTargetOf(o);
    groups.set(key, [...(groups.get(key) ?? []), o]);
  }
  const out: CustomerStatement[] = [];
  let seq = 1;
  const mkLine = (o: ExternalOrder): StatementLine => ({ orderId: o.id, orderCode: o.code, amount: statementAmountOf(o) });
  for (const [target, list] of groups) {
    if (out.length >= 2) break;
    const lines = list.slice(0, 2).map(mkLine);
    const amount = lines.reduce((s, l) => s + l.amount, 0);
    const stmt: CustomerStatement = {
      id: `stmt_seed_${seq}`,
      code: `DZ-S-20261123-${String(seq).padStart(2, '0')}`,
      settleTarget: target,
      customerType: list[0].salesPath === 'via_platform' ? '平台客户' : list[0].customerType,
      period: '2026-11-01 ~ 2026-11-23（手工生成 · 账期参考）',
      lines,
      amount,
      adjustments: [],
      invoices: [],
      receipts: [],
      status: 'pending',
      createdAt: '2026-11-23 10:00',
    };
    if (seq === 1) {
      // 演示：已确认 + 部分开票（首张发票覆盖第一行）+ 部分收款（30%）
      stmt.status = 'confirmed';
      const first = lines[0];
      stmt.invoices = [{ id: 'inv_seed_1', invoiceNo: 'FP-02611723', amount: first.amount, date: '2026-11-23', remark: '增值税专用发票' }];
      stmt.receipts = [{ id: 'rc_seed_1', amount: Math.round(amount * 0.3), date: '2026-11-24', method: 'bank', remark: '首批货款（部分收款）' }];
    }
    out.push(stmt);
    seq += 1;
  }
  return out;
}

/** 客户钱包种子：预付客户预存余额 */
function seedWallets(): CustomerWallet[] {
  const mk = (customerId: string, customerName: string, amount: number, time: string): CustomerWallet => ({
    customerId,
    customerName,
    balance: amount,
    txns: [{ id: `wt_${customerId}`, time, type: 'recharge', amount, balanceAfter: amount, note: '预付款充值' }],
  });
  return [
    mk('c3', '品茗轩', 50000, '2026-11-05 09:30'),
    mk('c5', '云顶茶舍', 20000, '2026-11-12 14:10'),
  ];
}

/** 合作商对账单种子：把已结算（付款完成）的直送采购单归纳为已办结对账单（取首家合作商） */
function seedPartnerStatements(): PartnerStatement[] {
  const docs = usePurchaseStore.getState().docs.filter((d) => d.source === 'distribute' && d.status === 'settled');
  const first = docs[0];
  if (!first) return [];
  const list = docs.filter((d) => d.supplierId === first.supplierId).slice(0, 2);
  const lines = list.map((d) => ({ poId: d.id, poCode: d.code, orderCode: d.childOrderCode, amount: d.amount }));
  const amount = lines.reduce((s, l) => s + l.amount, 0);
  return [{
    id: 'pstmt_seed_1',
    code: 'DZ-P-20261120-01',
    supplierId: first.supplierId,
    supplierName: first.supplierName,
    period: '2026-11 上半月（手工生成 · 账期参考）',
    lines,
    amount,
    invoices: [{ id: 'pinv_seed_1', invoiceNo: 'JP-20261001', amount, date: '2026-11-20' }],
    payments: [{ id: 'ppay_seed_1', amount, date: '2026-11-22', account: '招商银行基本户', remark: '按对账单全额付款核销' }],
    status: 'closed',
    createdAt: '2026-11-20 09:00',
    closedAt: '2026-11-22 16:00',
  }];
}

interface OkResult { ok: boolean; msg: string }

interface SettlementState {
  statements: CustomerStatement[];
  wallets: CustomerWallet[];
  partnerStatements: PartnerStatement[];

  /* ── 客户对账单 ── */
  generateStatement: (input: { settleTarget: string; customerType: string; period: string; orderIds: string[] }) => OkResult;
  confirmStatement: (id: string) => OkResult;
  disputeStatement: (id: string, reason: string) => OkResult;
  registerStatementInvoice: (id: string, input: { invoiceNo: string; amount: number; date: string; remark?: string }) => OkResult;
  registerStatementReceipt: (id: string, input: { amount: number; date: string; method: ReceiptMethod; remark?: string }) => OkResult;
  adjustStatement: (id: string, input: { amount: number; reason: string; refCode?: string }) => OkResult;
  closeStatement: (id: string) => OkResult;

  /* ── 客户钱包 ── */
  walletRecharge: (customerName: string, amount: number, note?: string) => OkResult;
  walletRefund: (customerName: string, amount: number, refCode?: string, note?: string) => OkResult;

  /* ── 合作商对账单 ── */
  generatePartnerStatement: (input: { supplierId: string; supplierName: string; poIds: string[]; period: string }) => OkResult;
  confirmPartnerStatement: (id: string) => OkResult;
  disputePartnerStatement: (id: string, reason: string) => OkResult;
  registerIncomingInvoice: (id: string, input: { invoiceNo: string; amount: number; date: string }) => OkResult;
  registerPartnerPayment: (id: string, input: { amount: number; date: string; account?: string; remark?: string }) => OkResult;
}

export const useSettlementStore = create<SettlementState>((set, get) => {
  /** 客户对账单回写：办结判定（收款 + 开票均覆盖净额 → closed） */
  const autoClose = (s: CustomerStatement): CustomerStatement => {
    const net = netOf(s);
    if (s.status !== 'closed' && invoicedOf(s) >= net && receivedOf(s) >= net) {
      return { ...s, status: 'closed', closedAt: nowStamp() };
    }
    return s;
  };

  return {
    statements: seedStatements(),
    wallets: seedWallets(),
    partnerStatements: seedPartnerStatements(),

    /* ═══ 客户对账单 ═══ */
    generateStatement: ({ settleTarget, customerType, period, orderIds }) => {
      const orders = useOrderFlowStore.getState().orders;
      const picked = orderIds.map((id) => orders.find((o) => o.id === id)).filter(Boolean) as ExternalOrder[];
      if (picked.length === 0) return { ok: false, msg: '请至少勾选 1 张已确收履约单' };
      const invalid = picked.find((o) => o.processStatus === 'cancelled' || o.fulfillment?.stage !== 'confirmed');
      if (invalid) return { ok: false, msg: `履约单 ${invalid.code} 未确收或已取消，不能纳入对账单` };
      const used = get().statements.flatMap((s) => s.lines.map((l) => l.orderId));
      const dup = picked.find((o) => used.includes(o.id));
      if (dup) return { ok: false, msg: `履约单 ${dup.code} 已在对账单中，不能重复纳入` };
      const lines = picked.map((o) => ({ orderId: o.id, orderCode: o.code, amount: statementAmountOf(o) }));
      const stmt: CustomerStatement = {
        id: `stmt_${Date.now()}`,
        code: nextCode('DZ-S', get().statements.map((s) => s.code)),
        settleTarget,
        customerType,
        period: period.trim() || '手工生成（账期参考）',
        lines,
        amount: lines.reduce((s, l) => s + l.amount, 0),
        adjustments: [],
        invoices: [],
        receipts: [],
        status: 'pending',
        createdAt: nowStamp(),
      };
      set((s) => ({ statements: [stmt, ...s.statements] }));
      return { ok: true, msg: `对账单 ${stmt.code} 已生成（待对账），共 ${lines.length} 行 · ¥${stmt.amount.toLocaleString()}` };
    },

    confirmStatement: (id) => {
      const stmt = get().statements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '对账单不存在' };
      if (stmt.status === 'closed') return { ok: false, msg: '对账单已办结' };
      set((s) => ({ statements: s.statements.map((x) => (x.id === id ? { ...x, status: 'confirmed', disputeReason: undefined } : x)) }));
      // 回写履约单：确认对账 → 订单进度＝结算中（发起对账结算）
      const flow = useOrderFlowStore.getState();
      stmt.lines.forEach((l) => flow.startSettlement(l.orderId));
      return { ok: true, msg: `对账单 ${stmt.code} 已确认，其下履约单订单进度进入结算中` };
    },

    disputeStatement: (id, reason) => {
      const stmt = get().statements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '对账单不存在' };
      if (!reason.trim()) return { ok: false, msg: '请填写异议原因' };
      if (stmt.status === 'closed') return { ok: false, msg: '对账单已办结' };
      set((s) => ({ statements: s.statements.map((x) => (x.id === id ? { ...x, status: 'disputed', disputeReason: reason.trim() } : x)) }));
      return { ok: true, msg: `对账单 ${stmt.code} 已标记有异议，可调整后重新确认` };
    },

    registerStatementInvoice: (id, { invoiceNo, amount, date, remark }) => {
      const stmt = get().statements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '对账单不存在' };
      if (stmt.status !== 'confirmed') return { ok: false, msg: '仅已确认的对账单可登记开票（先对账确认）' };
      const net = netOf(stmt);
      const invoiced = invoicedOf(stmt);
      if (!(amount > 0)) return { ok: false, msg: '开票金额须大于 0' };
      if (invoiced + amount > net + 0.001) return { ok: false, msg: `开票金额超出未开票余额（剩余 ¥${(net - invoiced).toLocaleString()}）` };
      if (!invoiceNo.trim()) return { ok: false, msg: '请填写发票号' };
      const invoice = { id: `inv_${Date.now()}`, invoiceNo: invoiceNo.trim(), amount, date, remark };
      set((s) => ({ statements: s.statements.map((x) => (x.id === id ? { ...x, invoices: [...x.invoices, invoice] } : x)) }));
      // 明细行 FIFO 核销 → 回写履约单开票状态（部分开票 → partial；行覆盖完成 → invoiced）
      const fresh = get().statements.find((x) => x.id === id)!;
      const before = coverageByLine(stmt.lines, stmt.invoices);
      const after = coverageByLine(fresh.lines, fresh.invoices);
      const flow = useOrderFlowStore.getState();
      fresh.lines.forEach((l, i) => {
        const was = before[i];
        const now = after[i];
        if (now >= l.amount && was < l.amount) flow.registerInvoice(l.orderId, 'full');
        else if (now > 0 && was === 0) flow.registerInvoice(l.orderId, 'partial');
      });
      set((s2) => ({ statements: s2.statements.map((x) => autoClose(x)) }));
      const done = get().statements.find((x) => x.id === id)!;
      return { ok: true, msg: done.status === 'closed' ? `发票 ${invoice.invoiceNo} 已登记，对账单开票收款齐备 → 已办结` : `发票 ${invoice.invoiceNo} 已登记（累计开票 ¥${invoicedOf(done).toLocaleString()} / ¥${netOf(done).toLocaleString()}）` };
    },

    registerStatementReceipt: (id, { amount, date, method, remark }) => {
      const stmt = get().statements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '对账单不存在' };
      if (stmt.status !== 'confirmed') return { ok: false, msg: '仅已确认的对账单可登记收款（先对账确认）' };
      const net = netOf(stmt);
      const received = receivedOf(stmt);
      if (!(amount > 0)) return { ok: false, msg: '收款金额须大于 0' };
      if (received + amount > net + 0.001) return { ok: false, msg: `收款金额超出未收余额（剩余 ¥${(net - received).toLocaleString()}）` };
      // 钱包余额支付：核销扣减客户钱包
      if (method === 'wallet') {
        const wallet = get().wallets.find((w) => w.customerName === stmt.settleTarget);
        if (!wallet) return { ok: false, msg: `结算对象 ${stmt.settleTarget} 暂无钱包账户` };
        if (wallet.balance < amount) return { ok: false, msg: `钱包余额不足（余额 ¥${wallet.balance.toLocaleString()}）` };
        set((s) => ({
          wallets: s.wallets.map((w) => (w.customerName === stmt.settleTarget
            ? {
                ...w,
                balance: w.balance - amount,
                txns: [{ id: `wt_${Date.now()}`, time: nowStamp(), type: 'consume' as const, amount, balanceAfter: w.balance - amount, refCode: stmt.code, note: '对账单收款 · 钱包余额支付' }, ...w.txns],
              }
            : w)),
        }));
      }
      const receipt = { id: `rc_${Date.now()}`, amount, date, method, remark };
      set((s) => ({ statements: s.statements.map((x) => (x.id === id ? { ...x, receipts: [...x.receipts, receipt] } : x)) }));
      // 明细行 FIFO 核销 → 回写履约单收款（行覆盖完成 → 登记客户回款）
      const fresh = get().statements.find((x) => x.id === id)!;
      const before = coverageByLine(stmt.lines, stmt.receipts);
      const after = coverageByLine(fresh.lines, fresh.receipts);
      const flow = useOrderFlowStore.getState();
      fresh.lines.forEach((l, i) => {
        if (after[i] >= l.amount && before[i] < l.amount) flow.settleOrder(l.orderId, { onTime: true });
      });
      set((s2) => ({ statements: s2.statements.map((x) => autoClose(x)) }));
      const done = get().statements.find((x) => x.id === id)!;
      const methodNote = method === 'wallet' ? '（钱包余额支付）' : '';
      return { ok: true, msg: done.status === 'closed' ? `收款已登记${methodNote}，对账单开票收款齐备 → 已办结` : `收款已登记${methodNote}（累计收款 ¥${receivedOf(done).toLocaleString()} / ¥${netOf(done).toLocaleString()}）` };
    },

    adjustStatement: (id, { amount, reason, refCode }) => {
      const stmt = get().statements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '对账单不存在' };
      if (stmt.status === 'closed') return { ok: false, msg: '对账单已办结，退货冲减请开红字发票后另行处理' };
      if (!(amount > 0)) return { ok: false, msg: '冲减金额须大于 0' };
      const netAfter = netOf(stmt) - amount;
      if (netAfter < 0) return { ok: false, msg: '冲减后净额不能为负' };
      if (receivedOf(stmt) > netAfter + 0.001) return { ok: false, msg: '冲减金额超过已收金额，请先与客户确认退款' };
      const adj = { id: `adj_${Date.now()}`, amount, date: today(), reason: reason.trim(), refCode };
      set((s) => ({ statements: s.statements.map((x) => (x.id === id ? { ...x, adjustments: [...x.adjustments, adj] } : x)) }));
      set((s2) => ({ statements: s2.statements.map((x) => autoClose(x)) }));
      return { ok: true, msg: `退货冲减 ¥${amount.toLocaleString()} 已登记，对账净额调整为 ¥${(netOf(get().statements.find((x) => x.id === id)!)).toLocaleString()}` };
    },

    closeStatement: (id) => {
      const stmt = get().statements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '对账单不存在' };
      if (stmt.status === 'closed') return { ok: false, msg: '对账单已办结' };
      if (receivedOf(stmt) < netOf(stmt) - 0.001) return { ok: false, msg: '仅收款全部到位的对账单可手工办结（已收款未开票场景）' };
      set((s) => ({ statements: s.statements.map((x) => (x.id === id ? { ...x, status: 'closed', closedAt: nowStamp() } : x)) }));
      return { ok: true, msg: `对账单 ${stmt.code} 已手工办结（已收款未开票）` };
    },

    /* ═══ 客户钱包 ═══ */
    walletRecharge: (customerName, amount, note) => {
      if (!(amount > 0)) return { ok: false, msg: '充值金额须大于 0' };
      const cust = useCustomerStore.getState().customers.find((c) => c.name === customerName);
      set((s) => {
        const exist = s.wallets.find((w) => w.customerName === customerName);
        if (exist) {
          return {
            wallets: s.wallets.map((w) => (w.customerName === customerName
              ? { ...w, balance: w.balance + amount, txns: [{ id: `wt_${Date.now()}`, time: nowStamp(), type: 'recharge' as const, amount, balanceAfter: w.balance + amount, note: note ?? '预付款充值' }, ...w.txns] }
              : w)),
          };
        }
        return {
          wallets: [...s.wallets, {
            customerId: cust?.id ?? '', customerName, balance: amount,
            txns: [{ id: `wt_${Date.now()}`, time: nowStamp(), type: 'recharge' as const, amount, balanceAfter: amount, note: note ?? '预付款充值' }],
          }],
        };
      });
      return { ok: true, msg: `${customerName} 钱包充值 ¥${amount.toLocaleString()} 成功` };
    },

    walletRefund: (customerName, amount, refCode, note) => {
      if (!(amount > 0)) return { ok: false, msg: '退款金额须大于 0' };
      const wallet = get().wallets.find((w) => w.customerName === customerName);
      if (!wallet || wallet.balance < amount) return { ok: false, msg: '钱包余额不足' };
      set((s) => ({
        wallets: s.wallets.map((w) => (w.customerName === customerName
          ? { ...w, balance: w.balance - amount, txns: [{ id: `wt_${Date.now()}`, time: nowStamp(), type: 'refund' as const, amount, balanceAfter: w.balance - amount, refCode, note: note ?? '退货退款回钱包' }, ...w.txns] }
          : w)),
      }));
      return { ok: true, msg: `已退款 ¥${amount.toLocaleString()} 至 ${customerName} 钱包余额` };
    },

    /* ═══ 合作商对账单 ═══ */
    generatePartnerStatement: ({ supplierId, supplierName, poIds, period }) => {
      const docs = usePurchaseStore.getState().docs;
      const picked = poIds.map((id) => docs.find((d) => d.id === id)).filter(Boolean) as typeof docs;
      if (picked.length === 0) return { ok: false, msg: '请至少勾选 1 张已签收采购单' };
      const used = get().partnerStatements.flatMap((s) => s.lines.map((l) => l.poId));
      const dup = picked.find((d) => used.includes(d.id));
      if (dup) return { ok: false, msg: `采购单 ${dup.code} 已在对账单中，不能重复纳入` };
      const lines = picked.map((d) => ({ poId: d.id, poCode: d.code, orderCode: d.childOrderCode, amount: d.amount }));
      const stmt: PartnerStatement = {
        id: `pstmt_${Date.now()}`,
        code: nextCode('DZ-P', get().partnerStatements.map((s) => s.code)),
        supplierId,
        supplierName,
        period: period.trim() || '手工生成（账期参考）',
        lines,
        amount: lines.reduce((s, l) => s + l.amount, 0),
        invoices: [],
        payments: [],
        status: 'pending',
        createdAt: nowStamp(),
      };
      set((s) => ({ partnerStatements: [stmt, ...s.partnerStatements] }));
      return { ok: true, msg: `合作商对账单 ${stmt.code} 已生成（待确认），共 ${lines.length} 张采购单 · ¥${stmt.amount.toLocaleString()}` };
    },

    confirmPartnerStatement: (id) => {
      const stmt = get().partnerStatements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '对账单不存在' };
      if (stmt.status === 'closed') return { ok: false, msg: '对账单已办结' };
      set((s) => ({ partnerStatements: s.partnerStatements.map((x) => (x.id === id ? { ...x, status: 'confirmed', disputeReason: undefined } : x)) }));
      return { ok: true, msg: `合作商对账单 ${stmt.code} 已确认，可登记进项发票与付款` };
    },

    disputePartnerStatement: (id, reason) => {
      const stmt = get().partnerStatements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '对账单不存在' };
      if (!reason.trim()) return { ok: false, msg: '请填写异议原因' };
      if (stmt.status === 'closed') return { ok: false, msg: '对账单已办结' };
      set((s) => ({ partnerStatements: s.partnerStatements.map((x) => (x.id === id ? { ...x, status: 'disputed', disputeReason: reason.trim() } : x)) }));
      return { ok: true, msg: `对账单 ${stmt.code} 已标记有异议` };
    },

    registerIncomingInvoice: (id, { invoiceNo, amount, date }) => {
      const stmt = get().partnerStatements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '对账单不存在' };
      if (stmt.status !== 'confirmed') return { ok: false, msg: '仅已确认的对账单可收票' };
      if (!invoiceNo.trim()) return { ok: false, msg: '请填写发票号' };
      if (!(amount > 0)) return { ok: false, msg: '发票金额须大于 0' };
      const inv = { id: `pinv_${Date.now()}`, invoiceNo: invoiceNo.trim(), amount, date };
      set((s) => ({ partnerStatements: s.partnerStatements.map((x) => (x.id === id ? { ...x, invoices: [...x.invoices, inv] } : x)) }));
      return { ok: true, msg: `进项发票 ${inv.invoiceNo} 已登记` };
    },

    registerPartnerPayment: (id, { amount, date, account, remark }) => {
      const stmt = get().partnerStatements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '对账单不存在' };
      if (stmt.status !== 'confirmed') return { ok: false, msg: '仅已确认的对账单可付款核销（先确认对账）' };
      const paid = stmt.payments.reduce((acc, p) => acc + p.amount, 0);
      if (!(amount > 0)) return { ok: false, msg: '付款金额须大于 0' };
      if (paid + amount > stmt.amount + 0.001) return { ok: false, msg: `付款金额超出未付余额（剩余 ¥${(stmt.amount - paid).toLocaleString()}）` };
      const pay = { id: `ppay_${Date.now()}`, amount, date, account, remark };
      set((s) => ({ partnerStatements: s.partnerStatements.map((x) => (x.id === id ? { ...x, payments: [...x.payments, pay] } : x)) }));
      // 付款 FIFO 分摊到采购单行：行付清 → 置采购单已结算（购销背对背的应付侧落库点）
      const fresh = get().partnerStatements.find((x) => x.id === id)!;
      const before = coverageByLine(fresh.lines, stmt.payments);
      const after = coverageByLine(fresh.lines, fresh.payments);
      const poStore = usePurchaseStore.getState();
      fresh.lines.forEach((l, i) => {
        if (after[i] >= l.amount && before[i] < l.amount) poStore.settleByChild(l.orderCode);
      });
      let closed = false;
      if (fresh.payments.reduce((acc, p) => acc + p.amount, 0) >= stmt.amount - 0.001) {
        set((s) => ({ partnerStatements: s.partnerStatements.map((x) => (x.id === id ? { ...x, status: 'closed', closedAt: nowStamp() } : x)) }));
        closed = true;
      }
      return { ok: true, msg: closed ? `付款 ¥${amount.toLocaleString()} 已核销，对账单 ${stmt.code} 付款完成 → 已办结（关联采购单已结算）` : `付款 ¥${amount.toLocaleString()} 已核销（累计 ¥${(paid + amount).toLocaleString()} / ¥${stmt.amount.toLocaleString()}）` };
    },
  };
});
