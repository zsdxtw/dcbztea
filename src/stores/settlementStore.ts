/**
 * 结算中心 Store（财务 ↔ 销售 ↔ 采购共享，采销分离 · 两单制）
 *
 * 设计见 docs/销售单结算流程设计建议.md（2026-11-28 修订二）。
 * 全系统两张一级结算单，对账与结算是单据的两个阶段：
 *
 * - 销售结算单（JSXS-…，明细行 = 履约单，应收）：
 *   生成（淡茶发起 / 登记客户发起对账）→ 确认对账（业务，销售菜单）→
 *   开票登记、收款登记（财务，发票 / 收款管理）→ 办结。确认后金额锁定。
 * - 客户预存余额（客户维度预付账户）：预收款登记入余额，收款可选余额支付。
 * - 采购结算单（JSCG-…，明细行 = 采购单，应付）：
 *   生成（签收后付款 / 先款后货预付）→ 确认对账（合作商终端在线确认，或后台代确认——
 *   覆盖未开终端的品牌商等合作商与线下已确认场景）→ 收票、付款（财务，发票 / 付款管理）→ 办结。
 *   办结时才将明细采购单置为已结算（发货前预付到位只置预付状态）。
 * - 采销分离：两条线互不触发；采购结算单仅引用履约单号作对照与积分判定。
 */
import { create } from 'zustand';
import { useCustomerStore, orderPlatformRate } from './customerStore';
import type {
  ExternalOrder, PurchaseIncomingInvoice, PurchasePayment, PurchaseStatement, PurchaseStatementLine,
  ReceiptMethod, SalesStatement, StatementLine, StatementSource,
} from '../types';
import { externalOrderSeeds } from '../data/externalOrders';
import { useOrderFlowStore } from './orderFlowStore';
import { usePurchaseStore } from './purchaseStore';

const today = () => new Date().toISOString().slice(0, 10);
const nowStamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
const OPERATOR = '管理员';

/* ── 派生助手 ── */

/** 结算对象：直接销售＝客户本人；经平台销售＝平台客户 */
export function settleTargetOf(o: { salesPath?: string; platformCustomerName?: string; customerName: string }): string {
  return o.salesPath === 'via_platform' ? (o.platformCustomerName ?? o.customerName) : o.customerName;
}

/** 销售结算单计入金额：直接销售＝订单金额；经平台销售＝销平台实价（订单金额 ×（1 − 平台扣点快照）） */
export function statementAmountOf(o: { totalAmount: number; salesPath?: string; platformRateSnapshot?: number }): number {
  const rate = orderPlatformRate(o as never);
  return rate > 0 ? Math.round(o.totalAmount * (1 - rate / 100)) : o.totalAmount;
}

/** 结算净额 = 结算金额 − 退货冲减 */
export function netOf(s: SalesStatement): number {
  return s.amount - s.adjustments.reduce((acc, a) => acc + a.amount, 0);
}
export function invoicedOf(s: SalesStatement): number {
  return s.invoices.reduce((acc, i) => acc + i.amount, 0);
}
export function receivedOf(s: SalesStatement): number {
  return s.receipts.reduce((acc, r) => acc + r.amount, 0);
}

/** 履约单所在销售结算单（任意状态） */
export function statementOfOrder(statements: SalesStatement[], orderId: string): SalesStatement | undefined {
  return statements.find((s) => s.lines.some((l) => l.orderId === orderId));
}

/** 采购单已付金额（按采购结算单付款 FIFO 分摊到行） */
export function purchasePaidOfPo(statements: PurchaseStatement[], poId: string): number {
  let paid = 0;
  for (const st of statements) {
    const idx = st.lines.findIndex((l) => l.poId === poId);
    if (idx < 0) continue;
    const line = st.lines[idx];
    const before = st.lines.slice(0, idx).reduce((acc, l) => acc + l.amount, 0);
    const paidSum = st.payments.reduce((acc, p) => acc + p.amount, 0);
    // 先款后货：预付款计入发货前应付额度；签收后付款按行分摊
    const prepaidCover = st.paymentStage === 'prepaid' ? Math.min(st.prepaidAmount ?? 0, paidSum) : 0;
    const pool = paidSum - before;
    paid += Math.max(0, Math.min(line.amount, pool));
    if (st.status === 'closed') paid = Math.max(paid, line.amount);
    else if (prepaidCover > 0 && idx === 0) paid = Math.max(paid, Math.min(line.amount, prepaidCover));
  }
  return paid;
}

/** 采购单所在采购结算单 */
export function purchaseStatementOfPo(statements: PurchaseStatement[], poId: string): PurchaseStatement | undefined {
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

/** 销售结算单种子：从已确收未回款的种子订单按结算对象归纳生成（演示部分开票 + 部分收款 + 客户发起对账） */
function seedSalesStatements(): SalesStatement[] {
  const confirmed = externalOrderSeeds.filter(
    (o) => o.processStatus !== 'cancelled' && o.fulfillment?.stage === 'confirmed' && !o.settled,
  );
  const groups = new Map<string, typeof confirmed>();
  for (const o of confirmed) {
    const key = settleTargetOf(o);
    groups.set(key, [...(groups.get(key) ?? []), o]);
  }
  const out: SalesStatement[] = [];
  let seq = 1;
  const mkLine = (o: typeof confirmed[0]): StatementLine => ({ orderId: o.id, orderCode: o.code, amount: statementAmountOf(o) });
  for (const [target, list] of groups) {
    if (out.length >= 2) break;
    const lines = list.slice(0, 2).map(mkLine);
    const amount = lines.reduce((s, l) => s + l.amount, 0);
    const stmt: SalesStatement = {
      id: `stmt_seed_${seq}`,
      code: `JSXS-20261123-${String(seq).padStart(2, '0')}`,
      source: seq === 2 ? 'customer' : 'dacha',
      settleTarget: target,
      customerType: list[0].salesPath === 'via_platform' ? '平台客户' : list[0].customerType,
      period: '2026-11-01 ~ 2026-11-23（手工生成 · 账期参考）',
      lines,
      amount,
      customerStatementNo: seq === 2 ? 'PF-AR-2026-118' : undefined,
      customerAmount: seq === 2 ? amount - 200 : undefined,
      adjustments: [],
      invoices: [],
      receipts: [],
      status: 'pending',
      createdBy: OPERATOR,
      confirmedBy: seq === 1 ? OPERATOR : undefined,
      confirmedAt: seq === 1 ? '2026-11-23 15:00' : undefined,
      createdAt: '2026-11-23 10:00',
      ops: [
        { time: '2026-11-23 10:00', operator: OPERATOR, action: '生成销售结算单', detail: `${lines.length} 行 · ¥${amount.toLocaleString()}` },
        ...(seq === 1 ? [{ time: '2026-11-23 15:00', operator: OPERATOR, action: '确认对账', detail: '对账阶段完成，金额锁定' }] : []),
      ],
    };
    if (seq === 1) {
      // 演示：已确认 + 部分开票（首张发票覆盖第一行）+ 部分收款（30%）
      stmt.status = 'confirmed';
      const first = lines[0];
      stmt.invoices = [{ id: 'inv_seed_1', invoiceNo: 'FP-02611723', amount: first.amount, date: '2026-11-23', remark: '增值税专用发票' }];
      stmt.receipts = [{ id: 'rc_seed_1', amount: Math.round(amount * 0.3), date: '2026-11-24', method: 'bank', remark: '首批货款（部分收款）' }];
      stmt.ops.push({ time: '2026-11-24 09:20', operator: OPERATOR, action: '开票登记', detail: `FP-02611723 · ¥${first.amount.toLocaleString()}` });
      stmt.ops.push({ time: '2026-11-24 10:05', operator: OPERATOR, action: '收款登记', detail: `部分收款 ¥${Math.round(amount * 0.3).toLocaleString()}` });
    }
    if (seq === 2) {
      stmt.status = 'confirmed';
      stmt.confirmedBy = OPERATOR;
      stmt.confirmedAt = '2026-11-24 11:00';
      stmt.ops.push({ time: '2026-11-24 11:00', operator: OPERATOR, action: '确认对账（客户发起对账）', detail: '差异调整后核对通过' });
    }
    out.push(stmt);
    seq += 1;
  }
  return out;
}

/** 客户预存余额种子：预付客户预存余额 */
function seedWallets() {
  const mk = (customerId: string, customerName: string, amount: number, time: string) => ({
    customerId,
    customerName,
    balance: amount,
    txns: [{ id: `wt_${customerId}`, time, type: 'recharge' as const, amount, balanceAfter: amount, note: '预付款充值' }],
  });
  return [
    mk('c3', '品茗轩', 50000, '2026-11-05 09:30'),
    mk('c5', '云顶茶舍', 20000, '2026-11-12 14:10'),
  ];
}

/** 采购结算单种子：合作商直发已签收 + 先款后货示例（覆盖有终端 / 无终端两种确认方式） */
function seedPurchaseStatements(): PurchaseStatement[] {
  const docs = usePurchaseStore.getState().docs.filter((d) => d.source === 'distribute');
  const first = docs[0];
  if (!first) return [];
  const list = docs.filter((d) => d.supplierId === first.supplierId).slice(0, 2);
  const lines: PurchaseStatementLine[] = list.map((d) => ({ poId: d.id, poCode: d.code, orderCode: d.childOrderCode, amount: d.amount }));
  const amount = lines.reduce((s, l) => s + l.amount, 0);
  const out: PurchaseStatement[] = [{
    id: 'pstmt_seed_1',
    code: `JSCG-20261120-01`,
    supplierId: first.supplierId,
    supplierName: first.supplierName,
    hasTerminal: true,
    period: '2026-11 上半月（手工生成 · 账期参考）',
    lines,
    amount,
    paymentStage: 'after_receipt',
    invoices: [{ id: 'pinv_seed_1', invoiceNo: 'JP-20261001', amount, date: '2026-11-20' }],
    payments: [{ id: 'ppay_seed_1', amount, date: '2026-11-22', account: '招商银行基本户', remark: '按结算单全额付款核销' }],
    status: 'closed',
    createdBy: OPERATOR,
    confirmedBy: first.supplierName,
    confirmedAt: '2026-11-21 10:00',
    createdAt: '2026-11-20 09:00',
    closedAt: '2026-11-22 16:00',
    ops: [
      { time: '2026-11-20 09:00', operator: OPERATOR, action: '生成采购结算单', detail: `${lines.length} 张采购单 · ¥${amount.toLocaleString()}` },
      { time: '2026-11-21 10:00', operator: first.supplierName, action: '确认对账', detail: '合作商终端在线确认' },
      { time: '2026-11-20 11:00', operator: OPERATOR, action: '收票登记', detail: 'JP-20261001' },
      { time: '2026-11-22 16:00', operator: OPERATOR, action: '付款核销', detail: `全额 ¥${amount.toLocaleString()} → 采购单已结算` },
    ],
  }];
  // 先款后货示例：品牌商合作商（无终端）＋ 付款节点=发货前
  const brand = usePurchaseStore.getState().docs.find((d) => d.supplierName.includes('品牌'));
  const bDoc = brand ?? docs.find((d) => d.id !== first.id);
  if (bDoc) {
    out.push({
      id: 'pstmt_seed_2',
      code: 'JSCG-20261125-01',
      supplierId: bDoc.supplierId,
      supplierName: bDoc.supplierName,
      hasTerminal: false,
      period: '先款后货（发货前预付）',
      lines: [{ poId: bDoc.id, poCode: bDoc.code, orderCode: bDoc.childOrderCode, amount: bDoc.amount }],
      amount: bDoc.amount,
      paymentStage: 'prepaid',
      prepaidAmount: bDoc.amount,
      invoices: [],
      payments: [{ id: 'ppay_seed_2', amount: bDoc.amount, date: '2026-11-25', account: '招商银行基本户', remark: '发货前全额预付' }],
      status: 'confirmed',
      createdBy: OPERATOR,
      confirmedBy: '管理员（后台代确认 · 未开终端）',
      confirmedAt: '2026-11-25 10:30',
      createdAt: '2026-11-25 10:00',
      ops: [
        { time: '2026-11-25 10:00', operator: OPERATOR, action: '生成采购结算单（先款后货）', detail: `发货前应付 ¥${bDoc.amount.toLocaleString()}` },
        { time: '2026-11-25 10:30', operator: '管理员（后台代确认）', action: '确认对账', detail: '未开合作商终端，后台代确认' },
        { time: '2026-11-25 11:00', operator: OPERATOR, action: '付款登记（预付）', detail: `预付款 ¥${bDoc.amount.toLocaleString()} 已到账，可发货` },
      ],
    });
  }
  return out;
}

interface OkResult { ok: boolean; msg: string }

/** 操作记录条目 */
const op = (action: string, detail?: string) => ({ time: nowStamp(), operator: OPERATOR, action, detail });

interface SettlementState {
  /** 销售结算单（应收一级单据） */
  salesStatements: SalesStatement[];
  /** 客户预存余额 */
  wallets: { customerId: string; customerName: string; balance: number; txns: { id: string; time: string; type: 'recharge' | 'consume' | 'refund'; amount: number; balanceAfter: number; refCode?: string; note?: string }[] }[];
  /** 采购结算单（应付一级单据） */
  purchaseStatements: PurchaseStatement[];

  /* ── 销售结算单：生成在销售·履约单结算，确认在销售·销售结算 ── */
  generateSalesStatement: (input: { settleTarget: string; customerType: string; period: string; orderIds: string[] }) => { ok: boolean; msg: string; code?: string };
  registerCustomerStatement: (input: { settleTarget: string; customerType: string; period: string; orderIds: string[]; customerStatementNo: string; customerAmount: number }) => { ok: boolean; msg: string; code?: string };
  confirmSalesStatement: (id: string) => OkResult;
  disputeSalesStatement: (id: string, reason: string) => OkResult;
  adjustSalesStatement: (id: string, input: { amount: number; reason: string; refCode?: string }) => OkResult;
  /** 开票登记（财务 · 发票管理）：对已确认销售结算单，部分开票多张累计覆盖 */
  registerSalesInvoice: (id: string, input: { invoiceNo: string; amount: number; date: string; remark?: string }) => OkResult;
  /** 收款登记（财务 · 收款管理）：对已确认销售结算单，部分收款多笔核销；预存客户可选余额支付 */
  registerSalesReceipt: (id: string, input: { amount: number; date: string; method: ReceiptMethod; remark?: string }) => OkResult;
  closeSalesStatement: (id: string) => OkResult;
  /** 第三期：办结后退货提醒（已办结结算单发生退货时的待处理标记） */
  markClosedStatementReturn: (id: string, notice: string) => void;

  /* ── 客户预存余额：登记在财务·收款管理 ── */
  walletRecharge: (customerName: string, amount: number, note?: string) => OkResult;
  walletRefund: (customerName: string, amount: number, refCode?: string, note?: string) => OkResult;

  /* ── 采购结算单：生成在采购·采购单结算，确认在合作商终端 / 采购·采购结算 ── */
  generatePurchaseStatement: (input: { supplierId: string; supplierName: string; hasTerminal: boolean; poIds: string[]; period: string; paymentStage: 'prepaid' | 'after_receipt'; prepaidRatio?: number }) => { ok: boolean; msg: string; code?: string };
  confirmPurchaseStatement: (id: string, operator?: string) => OkResult;
  disputePurchaseStatement: (id: string, reason: string) => OkResult;
  registerIncomingInvoice: (id: string, input: { invoiceNo: string; amount: number; date: string }) => OkResult;
  registerPurchasePayment: (id: string, input: { amount: number; date: string; account?: string; remark?: string }) => OkResult;
}

export const useSettlementStore = create<SettlementState>((set, get) => {
  /** 销售结算单办结判定：收款 + 开票均覆盖净额 → closed */
  const autoCloseSales = (s: SalesStatement): SalesStatement => {
    const net = netOf(s);
    if (s.status !== 'closed' && invoicedOf(s) >= net && receivedOf(s) >= net) {
      return { ...s, status: 'closed', closedAt: nowStamp(), ops: [...s.ops, op('自动办结', '开票与收款均覆盖结算净额')] };
    }
    return s;
  };

  return {
    salesStatements: seedSalesStatements(),
    wallets: seedWallets(),
    purchaseStatements: seedPurchaseStatements(),

    /* ═══ 销售结算单 ═══ */
    generateSalesStatement: ({ settleTarget, customerType, period, orderIds }) => {
      const orders = useOrderFlowStore.getState().orders;
      const picked = orderIds.map((id) => orders.find((o) => o.id === id)).filter(Boolean) as ExternalOrder[];
      if (picked.length === 0) return { ok: false, msg: '请至少勾选 1 张已确收履约单' };
      const invalid = picked.find((o) => o.processStatus === 'cancelled' || o.fulfillment?.stage !== 'confirmed');
      if (invalid) return { ok: false, msg: `履约单 ${invalid.code} 未确收或已取消，不能纳入结算单` };
      const used = get().salesStatements.flatMap((s) => s.lines.map((l) => l.orderId));
      const dup = picked.find((o) => used.includes(o.id));
      if (dup) return { ok: false, msg: `履约单 ${dup.code} 已在销售结算单中，不能重复纳入` };
      const lines: StatementLine[] = picked.map((o) => ({ orderId: o.id, orderCode: o.code, amount: statementAmountOf(o) }));
      const amount = lines.reduce((s, l) => s + l.amount, 0);
      const code = nextCode('JSXS', get().salesStatements.map((s) => s.code));
      const stmt: SalesStatement = {
        id: `stmt_${Date.now()}`,
        code,
        source: 'dacha',
        settleTarget,
        customerType,
        period: period.trim() || '手工生成（账期参考）',
        lines,
        amount,
        adjustments: [],
        invoices: [],
        receipts: [],
        status: 'pending',
        createdBy: OPERATOR,
        createdAt: nowStamp(),
        ops: [op('生成销售结算单（淡茶发起）', `${lines.length} 行 · ¥${amount.toLocaleString()}`)],
      };
      set((s) => ({ salesStatements: [stmt, ...s.salesStatements] }));
      return { ok: true, msg: `销售结算单 ${code} 已生成（待确认），共 ${lines.length} 行 · ¥${amount.toLocaleString()}`, code };
    },

    registerCustomerStatement: ({ settleTarget, customerType, period, orderIds, customerStatementNo, customerAmount }) => {
      const orders = useOrderFlowStore.getState().orders;
      const picked = orderIds.map((id) => orders.find((o) => o.id === id)).filter(Boolean) as ExternalOrder[];
      if (picked.length === 0) return { ok: false, msg: '请至少勾选 1 张已确收履约单' };
      const invalid = picked.find((o) => o.processStatus === 'cancelled' || o.fulfillment?.stage !== 'confirmed');
      if (invalid) return { ok: false, msg: `履约单 ${invalid.code} 未确收或已取消，不能纳入结算单` };
      if (!customerStatementNo.trim()) return { ok: false, msg: '请填写客户对账单号' };
      if (!(customerAmount > 0)) return { ok: false, msg: '请填写客户对账金额' };
      const used = get().salesStatements.flatMap((s) => s.lines.map((l) => l.orderId));
      const dup = picked.find((o) => used.includes(o.id));
      if (dup) return { ok: false, msg: `履约单 ${dup.code} 已在销售结算单中，不能重复纳入` };
      const lines: StatementLine[] = picked.map((o) => ({ orderId: o.id, orderCode: o.code, amount: statementAmountOf(o) }));
      const amount = lines.reduce((s, l) => s + l.amount, 0);
      const diff = customerAmount - amount;
      const code = nextCode('JSXS', get().salesStatements.map((s) => s.code));
      const stmt: SalesStatement = {
        id: `stmt_${Date.now()}`,
        code,
        source: 'customer',
        settleTarget,
        customerType,
        period: period.trim() || '客户发起对账（账期参考）',
        lines,
        amount,
        customerStatementNo: customerStatementNo.trim(),
        customerAmount,
        adjustments: [],
        invoices: [],
        receipts: [],
        status: 'pending',
        createdBy: OPERATOR,
        createdAt: nowStamp(),
        ops: [
          op('登记客户发起对账', `客户对账单号 ${customerStatementNo.trim()} · 客户金额 ¥${customerAmount.toLocaleString()}`),
          op('差异核对', `淡茶侧 ¥${amount.toLocaleString()} · 差异 ${diff >= 0 ? '+' : ''}¥${diff.toLocaleString()}${diff !== 0 ? '（差异调整待确认）' : '（无差异）'}`),
        ],
      };
      set((s) => ({ salesStatements: [stmt, ...s.salesStatements] }));
      return { ok: true, msg: `销售结算单 ${code} 已登记（客户发起对账 · 待确认）${diff !== 0 ? `，差异 ${diff >= 0 ? '+' : ''}¥${diff.toLocaleString()} 待调整` : ''}`, code };
    },

    confirmSalesStatement: (id) => {
      const stmt = get().salesStatements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '结算单不存在' };
      if (stmt.status === 'closed') return { ok: false, msg: '结算单已办结' };
      if (stmt.status === 'confirmed') return { ok: false, msg: '结算单已确认，金额已锁定' };
      set((s) => ({
        salesStatements: s.salesStatements.map((x) => (x.id === id
          ? { ...x, status: 'confirmed' as const, confirmedBy: OPERATOR, confirmedAt: nowStamp(), disputeReason: undefined, ops: [...x.ops, op('确认对账', '对账阶段完成，金额锁定 → 进入结算阶段')] }
          : x)),
      }));
      // 回写履约单：确认对账 → 订单进度＝结算中
      const flow = useOrderFlowStore.getState();
      stmt.lines.forEach((l) => flow.startSettlement(l.orderId));
      return { ok: true, msg: `销售结算单 ${stmt.code} 已确认，金额锁定，其下履约单订单进度进入结算中` };
    },

    disputeSalesStatement: (id, reason) => {
      const stmt = get().salesStatements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '结算单不存在' };
      if (!reason.trim()) return { ok: false, msg: '请填写异议原因' };
      if (stmt.status === 'closed') return { ok: false, msg: '结算单已办结' };
      if (stmt.status === 'confirmed') return { ok: false, msg: '已确认的结算单金额锁定，如有调整请走退货冲减' };
      set((s) => ({ salesStatements: s.salesStatements.map((x) => (x.id === id ? { ...x, status: 'disputed' as const, disputeReason: reason.trim(), ops: [...x.ops, op('登记异议', reason.trim())] } : x)) }));
      return { ok: true, msg: `销售结算单 ${stmt.code} 已标记有异议，调整后重新确认` };
    },

    adjustSalesStatement: (id, { amount, reason, refCode }) => {
      const stmt = get().salesStatements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '结算单不存在' };
      if (stmt.status === 'closed') return { ok: false, msg: '结算单已办结，退货冲减请开红字发票后另行处理' };
      if (stmt.status === 'confirmed') return { ok: false, msg: '已确认的结算单金额锁定，不能调整（走退货冲减）' };
      if (!(amount > 0)) return { ok: false, msg: '冲减金额须大于 0' };
      const netAfter = netOf(stmt) - amount;
      if (netAfter < 0) return { ok: false, msg: '冲减后净额不能为负' };
      if (receivedOf(stmt) > netAfter + 0.001) return { ok: false, msg: '冲减金额超过已收金额，请先与客户确认退款' };
      const adj = { id: `adj_${Date.now()}`, amount, date: today(), reason: reason.trim(), refCode };
      set((s) => ({ salesStatements: s.salesStatements.map((x) => (x.id === id ? { ...x, adjustments: [...x.adjustments, adj], ops: [...x.ops, op('差异调整 / 冲减', `${reason.trim()} · -¥${amount.toLocaleString()}`)] } : x)) }));
      set((s2) => ({ salesStatements: s2.salesStatements.map((x) => autoCloseSales(x)) }));
      return { ok: true, msg: `冲减 ¥${amount.toLocaleString()} 已登记，结算净额调整为 ¥${(netOf(get().salesStatements.find((x) => x.id === id)!)).toLocaleString()}` };
    },

    closeSalesStatement: (id) => {
      const stmt = get().salesStatements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '结算单不存在' };
      if (stmt.status === 'closed') return { ok: false, msg: '结算单已办结' };
      if (receivedOf(stmt) < netOf(stmt) - 0.001) return { ok: false, msg: '仅收款全部到位的结算单可手工办结（已收款未开票场景）' };
      set((s) => ({ salesStatements: s.salesStatements.map((x) => (x.id === id ? { ...x, status: 'closed' as const, closedAt: nowStamp(), ops: [...x.ops, op('手工办结', '已收款未开票场景')] } : x)) }));
      return { ok: true, msg: `销售结算单 ${stmt.code} 已手工办结（已收款未开票）` };
    },

    /** 第三期：办结后退货提醒——已办结结算单发生退货时的待处理标记 */
    markClosedStatementReturn: (id, notice) => {
      set((s) => ({
        salesStatements: s.salesStatements.map((x) => (x.id === id
          ? { ...x, closedReturnNotice: notice, ops: [...x.ops, op('办结后退货提醒', notice)] }
          : x)),
      }));
    },

    /** 开票登记（财务 · 发票管理）：部分开票，多张发票累计覆盖；行核销回写履约单开票状态 */
    registerSalesInvoice: (id, { invoiceNo, amount, date, remark }) => {
      const stmt = get().salesStatements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '结算单不存在' };
      if (stmt.status !== 'confirmed') return { ok: false, msg: '仅已确认的销售结算单可开票（先对账确认）' };
      const net = netOf(stmt);
      const invoiced = invoicedOf(stmt);
      if (!(amount > 0)) return { ok: false, msg: '开票金额须大于 0' };
      if (invoiced + amount > net + 0.001) return { ok: false, msg: `开票金额超出未开票余额（剩余 ¥${(net - invoiced).toLocaleString()}）` };
      if (!invoiceNo.trim()) return { ok: false, msg: '请填写发票号' };
      const invoice = { id: `inv_${Date.now()}`, invoiceNo: invoiceNo.trim(), amount, date, remark };
      set((s) => ({ salesStatements: s.salesStatements.map((x) => (x.id === id ? { ...x, invoices: [...x.invoices, invoice], ops: [...x.ops, op('开票登记', `${invoice.invoiceNo} · ¥${amount.toLocaleString()}`)] } : x)) }));
      // 行核销 FIFO 回写履约单开票状态
      const fresh = get().salesStatements.find((x) => x.id === id)!;
      const before = coverageByLine(stmt.lines, stmt.invoices);
      const after = coverageByLine(fresh.lines, fresh.invoices);
      const flow = useOrderFlowStore.getState();
      fresh.lines.forEach((l, i) => {
        if (after[i] >= l.amount && before[i] < l.amount) flow.registerInvoice(l.orderId, 'full');
        else if (after[i] > 0 && before[i] === 0) flow.registerInvoice(l.orderId, 'partial');
      });
      set((s2) => ({ salesStatements: s2.salesStatements.map((x) => autoCloseSales(x)) }));
      const done = get().salesStatements.find((x) => x.id === id)!;
      return { ok: true, msg: done.status === 'closed' ? `发票 ${invoice.invoiceNo} 已登记，开票收款齐备 → 已办结` : `发票 ${invoice.invoiceNo} 已登记（累计开票 ¥${invoicedOf(done).toLocaleString()} / ¥${netOf(done).toLocaleString()}）` };
    },

    /** 收款登记（财务 · 收款管理）：部分收款多笔核销；预存客户可选余额支付；行核销回写履约单收款状态 */
    registerSalesReceipt: (id, { amount, date, method, remark }) => {
      const stmt = get().salesStatements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '结算单不存在' };
      if (stmt.status !== 'confirmed') return { ok: false, msg: '仅已确认的销售结算单可收款（先对账确认）' };
      const net = netOf(stmt);
      const received = receivedOf(stmt);
      if (!(amount > 0)) return { ok: false, msg: '收款金额须大于 0' };
      if (received + amount > net + 0.001) return { ok: false, msg: `收款金额超出未收余额（剩余 ¥${(net - received).toLocaleString()}）` };
      // 预存余额支付：核销扣减客户预存余额
      if (method === 'wallet') {
        const wallet = get().wallets.find((w) => w.customerName === stmt.settleTarget);
        if (!wallet) return { ok: false, msg: `结算对象 ${stmt.settleTarget} 暂无预存账户` };
        if (wallet.balance < amount) return { ok: false, msg: `预存余额不足（余额 ¥${wallet.balance.toLocaleString()}）` };
        set((s) => ({
          wallets: s.wallets.map((w) => (w.customerName === stmt.settleTarget
            ? { ...w, balance: w.balance - amount, txns: [{ id: `wt_${Date.now()}`, time: nowStamp(), type: 'consume' as const, amount, balanceAfter: w.balance - amount, refCode: stmt.code, note: '销售结算单收款 · 预存余额支付' }, ...w.txns] }
            : w)),
        }));
      }
      const receipt = { id: `rc_${Date.now()}`, amount, date, method, remark };
      set((s) => ({ salesStatements: s.salesStatements.map((x) => (x.id === id ? { ...x, receipts: [...x.receipts, receipt], ops: [...x.ops, op('收款登记', `¥${amount.toLocaleString()}${method === 'wallet' ? '（预存余额支付）' : ''}`)] } : x)) }));
      // 行核销 FIFO 回写履约单收款状态
      const fresh = get().salesStatements.find((x) => x.id === id)!;
      const before = coverageByLine(stmt.lines, stmt.receipts);
      const after = coverageByLine(fresh.lines, fresh.receipts);
      const flow = useOrderFlowStore.getState();
      fresh.lines.forEach((l, i) => {
        if (after[i] >= l.amount && before[i] < l.amount) flow.settleOrder(l.orderId, { onTime: true });
      });
      set((s2) => ({ salesStatements: s2.salesStatements.map((x) => autoCloseSales(x)) }));
      const done = get().salesStatements.find((x) => x.id === id)!;
      const methodNote = method === 'wallet' ? '（预存余额支付）' : '';
      return { ok: true, msg: done.status === 'closed' ? `收款已登记${methodNote}，开票收款齐备 → 已办结` : `收款已登记${methodNote}（累计收款 ¥${receivedOf(done).toLocaleString()} / ¥${netOf(done).toLocaleString()}）` };
    },

    /* ═══ 客户预存余额 ═══ */
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
      return { ok: true, msg: `${customerName} 预存余额登记 ¥${amount.toLocaleString()} 成功` };
    },

    walletRefund: (customerName, amount, refCode, note) => {
      if (!(amount > 0)) return { ok: false, msg: '退款金额须大于 0' };
      const wallet = get().wallets.find((w) => w.customerName === customerName);
      if (!wallet || wallet.balance < amount) return { ok: false, msg: '预存余额不足' };
      set((s) => ({
        wallets: s.wallets.map((w) => (w.customerName === customerName
          ? { ...w, balance: w.balance - amount, txns: [{ id: `wt_${Date.now()}`, time: nowStamp(), type: 'refund' as const, amount, balanceAfter: w.balance - amount, refCode, note: note ?? '退货退款回预存余额' }, ...w.txns] }
          : w)),
      }));
      return { ok: true, msg: `已退款 ¥${amount.toLocaleString()} 至 ${customerName} 预存余额` };
    },

    /* ═══ 采购结算单 ═══ */
    generatePurchaseStatement: ({ supplierId, supplierName, hasTerminal, poIds, period, paymentStage, prepaidRatio = 100 }) => {
      const docs = usePurchaseStore.getState().docs;
      const picked = poIds.map((id) => docs.find((d) => d.id === id)).filter(Boolean) as typeof docs;
      if (picked.length === 0) return { ok: false, msg: '请至少勾选 1 张采购单' };
      const used = get().purchaseStatements.flatMap((s) => s.lines.map((l) => l.poId));
      const dup = picked.find((d) => used.includes(d.id));
      if (dup) return { ok: false, msg: `采购单 ${dup.code} 已在采购结算单中，不能重复纳入` };
      const lines: PurchaseStatementLine[] = picked.map((d) => ({ poId: d.id, poCode: d.code, orderCode: d.childOrderCode, amount: d.amount }));
      const amount = lines.reduce((s, l) => s + l.amount, 0);
      const prepaidAmount = paymentStage === 'prepaid' ? Math.round(amount * prepaidRatio / 100) : undefined;
      const code = nextCode('JSCG', get().purchaseStatements.map((s) => s.code));
      const stageLabel = paymentStage === 'prepaid' ? `先款后货（发货前应付 ¥${(prepaidAmount ?? 0).toLocaleString()}）` : '签收后付款';
      const stmt: PurchaseStatement = {
        id: `pstmt_${Date.now()}`,
        code,
        supplierId,
        supplierName,
        hasTerminal,
        period: period.trim() || (paymentStage === 'prepaid' ? '先款后货（账期参考）' : '手工生成（账期参考）'),
        lines,
        amount,
        paymentStage,
        prepaidAmount,
        invoices: [],
        payments: [],
        status: 'pending',
        createdBy: OPERATOR,
        createdAt: nowStamp(),
        ops: [op(`生成采购结算单（${stageLabel}）`, `${lines.length} 张采购单 · ¥${amount.toLocaleString()}`)],
      };
      set((s) => ({ purchaseStatements: [stmt, ...s.purchaseStatements] }));
      return { ok: true, msg: `采购结算单 ${code} 已生成（待确认 · ${stageLabel}），共 ${lines.length} 张采购单 · ¥${amount.toLocaleString()}`, code };
    },

    confirmPurchaseStatement: (id, operator) => {
      const stmt = get().purchaseStatements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '结算单不存在' };
      if (stmt.status === 'closed') return { ok: false, msg: '结算单已办结' };
      if (stmt.status === 'confirmed') return { ok: false, msg: '结算单已确认，金额已锁定' };
      const by = operator ?? (stmt.hasTerminal ? stmt.supplierName : '管理员（后台代确认）');
      set((s) => ({
        purchaseStatements: s.purchaseStatements.map((x) => (x.id === id
          ? { ...x, status: 'confirmed' as const, confirmedBy: by, confirmedAt: nowStamp(), disputeReason: undefined, ops: [...x.ops, { time: nowStamp(), operator: by, action: '确认对账', detail: stmt.hasTerminal ? '合作商终端在线确认' : '管理后台代确认（未开合作商终端）' }] }
          : x)),
      }));
      return { ok: true, msg: `采购结算单 ${stmt.code} 已确认（${by}），金额锁定${stmt.paymentStage === 'prepaid' ? '，可登记发货前预付款' : '，可登记收票与付款'}` };
    },

    disputePurchaseStatement: (id, reason) => {
      const stmt = get().purchaseStatements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '结算单不存在' };
      if (!reason.trim()) return { ok: false, msg: '请填写异议原因' };
      if (stmt.status === 'closed') return { ok: false, msg: '结算单已办结' };
      if (stmt.status === 'confirmed') return { ok: false, msg: '已确认的结算单金额锁定，如有调整请走采购退货冲减' };
      set((s) => ({ purchaseStatements: s.purchaseStatements.map((x) => (x.id === id ? { ...x, status: 'disputed' as const, disputeReason: reason.trim(), ops: [...x.ops, op('登记异议', reason.trim())] } : x)) }));
      return { ok: true, msg: `采购结算单 ${stmt.code} 已标记有异议` };
    },

    registerIncomingInvoice: (id, { invoiceNo, amount, date }) => {
      const stmt = get().purchaseStatements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '结算单不存在' };
      if (stmt.status !== 'confirmed') return { ok: false, msg: '仅已确认的结算单可收票（先对账确认）' };
      if (!invoiceNo.trim()) return { ok: false, msg: '请填写发票号' };
      if (!(amount > 0)) return { ok: false, msg: '发票金额须大于 0' };
      const inv: PurchaseIncomingInvoice = { id: `pinv_${Date.now()}`, invoiceNo: invoiceNo.trim(), amount, date };
      set((s) => ({ purchaseStatements: s.purchaseStatements.map((x) => (x.id === id ? { ...x, invoices: [...x.invoices, inv], ops: [...x.ops, op('收票登记', `${inv.invoiceNo} · ¥${amount.toLocaleString()}`)] } : x)) }));
      return { ok: true, msg: `进项发票 ${inv.invoiceNo} 已登记` };
    },

    registerPurchasePayment: (id, { amount, date, account, remark }) => {
      const stmt = get().purchaseStatements.find((s) => s.id === id);
      if (!stmt) return { ok: false, msg: '结算单不存在' };
      if (stmt.status !== 'confirmed') return { ok: false, msg: '仅已确认的结算单可付款（先对账确认）' };
      const paid = stmt.payments.reduce((acc, p) => acc + p.amount, 0);
      if (!(amount > 0)) return { ok: false, msg: '付款金额须大于 0' };
      const cap = stmt.paymentStage === 'prepaid' ? (stmt.prepaidAmount ?? stmt.amount) : stmt.amount;
      const stage = stmt.paymentStage === 'prepaid' && paid < cap - 0.001 ? '预付款' : '付款';
      if (stage === '预付款' && amount > cap + 0.001) return { ok: false, msg: `预付款超出发货前应付额度（¥${cap.toLocaleString()}）` };
      if (paid + amount > stmt.amount + 0.001) return { ok: false, msg: `付款金额超出未付余额（剩余 ¥${(stmt.amount - paid).toLocaleString()}）` };
      const pay: PurchasePayment = { id: `ppay_${Date.now()}`, amount, date, account, remark: remark ?? (stage === '预付款' ? '发货前预付款' : undefined) };
      // 先款后货预付款到账 → 采购单置预付状态；签收后（或尾款补齐）→ 办结并置已结算
      const isPrepaidStage = stage === '预付款';
      set((s) => ({
        purchaseStatements: s.purchaseStatements.map((x) => (x.id === id
          ? { ...x, payments: [...x.payments, pay], ops: [...x.ops, op(`${stage}登记`, `¥${amount.toLocaleString()}${account ? ' · ' + account : ''}`)] }
          : x)),
      }));
      const fresh = get().purchaseStatements.find((x) => x.id === id)!;
      const poStore = usePurchaseStore.getState();
      const paidAll = fresh.payments.reduce((acc, p) => acc + p.amount, 0) >= fresh.amount - 0.001;
      let closed = false;
      if (stmt.paymentStage === 'after_receipt' || (stmt.paymentStage === 'prepaid' && paidAll)) {
        // 签收后付款：行付清即置已结算；先款后货：办结（全部付清）时置已结算
        const before = coverageByLine(fresh.lines, stmt.payments);
        const after = coverageByLine(fresh.lines, fresh.payments);
        fresh.lines.forEach((l, i) => {
          if (after[i] >= l.amount && before[i] < l.amount) poStore.settleByChild(l.orderCode);
        });
      }
      if (stmt.paymentStage === 'prepaid' && paidAll) {
        set((s2) => ({ purchaseStatements: s2.purchaseStatements.map((x) => (x.id === id ? { ...x, status: 'closed' as const, closedAt: nowStamp(), ops: [...x.ops, op('自动办结', '预付款全额到位 → 采购单已结算')] } : x)) }));
        closed = true;
      } else if (stmt.paymentStage === 'after_receipt' && paidAll) {
        set((s2) => ({ purchaseStatements: s2.purchaseStatements.map((x) => (x.id === id ? { ...x, status: 'closed' as const, closedAt: nowStamp(), ops: [...x.ops, op('自动办结', '付款全部到位 → 采购单已结算')] } : x)) }));
        closed = true;
      }
      const label = closed ? `${stage} ¥${amount.toLocaleString()} 已核销，结算单 ${stmt.code} → 已办结（采购单已结算）` : `${stage} ¥${amount.toLocaleString()} 已登记${account ? '（' + account + '）' : ''}（累计 ¥${(paid + amount).toLocaleString()} / ¥${stmt.amount.toLocaleString()}）${isPrepaidStage ? ' → 预付款已到账，可发货' : ''}`;
      return { ok: true, msg: label };
    },
  };
});
