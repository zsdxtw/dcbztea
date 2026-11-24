/**
 * 合作商退货管理 Store（合作商终端处理客户退货；管理后台后续可接入同一数据源）
 * P6 退货冲减：退款完成时同步冲减客户对账单应收（未办结对账单）；预付客户退款回钱包余额。
 */
import { create } from 'zustand';
import type { PartnerReturn, PartnerReturnStatus } from '../types';
import { genReturnCode, soRootOf } from '../utils/orderCodes';
import { useSettlementStore } from './settlementStore';
import { customerItems } from '../data/customers';

const now = () => new Date().toISOString().slice(0, 10);

interface ReturnState {
  /** 全部退货单（按合作商维度过滤展示） */
  returns: PartnerReturn[];
  /** 合作商登记客户退货 */
  addReturn: (input: {
    supplierId: string;
    supplierName: string;
    sourceOrderCode: string;
    customerName: string;
    reason: string;
    items: { productName: string; spec: string; price: number; quantity: number }[];
    refundAmount: number;
    solution: 'refund' | 'exchange';
  }) => PartnerReturn;
  /** 状态推进：受理 / 拒绝 / 客户寄回 / 确认收货 / 完成处理 */
  setStatus: (id: string, status: PartnerReturnStatus, note?: string) => void;
  /** 删除（仅待受理可删） */
  removeReturn: (id: string) => void;
}

/** 演示种子：云茶供应链（11）三张不同状态 + 八马（3）一张 */
const seedReturns: PartnerReturn[] = [
  {
    id: 'rt_seed_1', code: 'SO-2610210001TH01',
    supplierId: '11', supplierName: '杭州云茶供应链管理有限公司',
    sourceOrderCode: 'SO-2610210001', customerName: '南京翠竹茶行',
    items: [{ productName: '碧螺春·一级', spec: '100g/袋', price: 328, quantity: 3 }],
    reason: '客户反馈茶叶受潮，包装破损（运输挤压）',
    solution: 'refund', refundAmount: 984,
    status: 'pending', applyTime: '2026-11-08',
    history: [
      { time: '2026-11-08', action: '客户申请退货', detail: '南京翠竹茶行 · SO-2610210001 · 碧螺春×3' },
    ],
  },
  {
    id: 'rt_seed_2', code: 'SO-2610199038TH01',
    supplierId: '11', supplierName: '杭州云茶供应链管理有限公司',
    sourceOrderCode: 'SO-2610199038', customerName: '湖畔茶叙',
    items: [{ productName: '铁观音·清香一级', spec: '250g/罐', price: 208, quantity: 5 }],
    reason: '口味不符，客户希望换货为浓香型',
    solution: 'exchange', refundAmount: 1040,
    status: 'shipped', applyTime: '2026-11-05', acceptTime: '2026-11-06',
    history: [
      { time: '2026-11-05', action: '客户申请退货', detail: '湖畔茶叙 · SO-2610199038 · 铁观音×5' },
      { time: '2026-11-06', action: '已受理', detail: '换货处理 · 通知客户寄回原商品' },
      { time: '2026-11-08', action: '客户已寄回', detail: '顺丰速运 SF1390****8823' },
    ],
  },
  {
    id: 'rt_seed_3', code: 'SO-2609120001TH01',
    supplierId: '11', supplierName: '杭州云茶供应链管理有限公司',
    sourceOrderCode: 'SO-2609120001', customerName: '清心茶坊',
    items: [{ productName: '白毫银针·特级', spec: '50g/罐', price: 768, quantity: 2 }],
    reason: '临期商品，客户拒收',
    solution: 'refund', refundAmount: 1536,
    status: 'received', applyTime: '2026-10-28', acceptTime: '2026-10-29',
    history: [
      { time: '2026-10-28', action: '客户申请退货', detail: '清心茶坊 · SO-2609120001 · 白毫银针×2' },
      { time: '2026-10-29', action: '已受理', detail: '退款处理 · 待收货确认' },
      { time: '2026-11-02', action: '客户已寄回', detail: '德邦物流 DB6720****1109' },
      { time: '2026-11-03', action: '已收货', detail: '质检确认：包装完好，商品未拆封 · 待退款' },
    ],
  },
  {
    id: 'rt_seed_4', code: 'SO-2610129031TH01',
    supplierId: '3', supplierName: '八马茶业股份有限公司',
    sourceOrderCode: 'SO-2610129031LY01', customerName: '星城茶座',
    items: [{ productName: '铁观音·清香一级', spec: '250g/罐', price: 208, quantity: 2 }],
    reason: '多发商品，退回多余数量',
    solution: 'refund', refundAmount: 416,
    status: 'completed', applyTime: '2026-10-20', acceptTime: '2026-10-21', finishTime: '2026-10-26',
    history: [
      { time: '2026-10-20', action: '客户申请退货', detail: '星城茶座 · SO-2610129031LY01 · 铁观音×2' },
      { time: '2026-10-21', action: '已受理', detail: '退款处理' },
      { time: '2026-10-24', action: '已收货', detail: '质检通过' },
      { time: '2026-10-26', action: '退款完成', detail: '原路退回 ¥416' },
    ],
  },
];

export const useReturnStore = create<ReturnState>((set, get) => ({
  returns: seedReturns,

  addReturn: (input) => {
    const { returns } = get();
    const item: PartnerReturn = {
      id: `rt_${Date.now()}`,
      code: genReturnCode(input.sourceOrderCode, returns.map((r) => r.code)),
      ...input,
      status: 'pending',
      applyTime: now(),
      history: [{ time: now(), action: '登记客户退货', detail: `${input.customerName} · ${input.sourceOrderCode} · ${input.items[0]?.productName ?? ''}×${input.items[0]?.quantity ?? 0}` }],
    };
    set({ returns: [item, ...returns] });
    return item;
  },

  setStatus: (id, status, note) => {
    const target = get().returns.find((r) => r.id === id);
    set({
      returns: get().returns.map((r) => {
        if (r.id !== id) return r;
        const actionLabels: Record<PartnerReturnStatus, string> = {
          pending: '待受理', accepted: '已受理', rejected: '已拒绝',
          shipped: '客户已寄回', received: '已收货', completed: '完成处理',
        };
        return {
          ...r,
          status,
          acceptTime: status === 'accepted' ? now() : r.acceptTime,
          finishTime: status === 'completed' || status === 'rejected' ? now() : r.finishTime,
          history: [...r.history, { time: now(), action: actionLabels[status], detail: note }],
        };
      }),
    });
    /* P6 退货冲减（仅退款类退货）：客户对账单应收冲减；预付客户退款回钱包余额 */
    if (target && status === 'completed' && target.solution === 'refund') {
      const settle = useSettlementStore.getState();
      const root = soRootOf(target.sourceOrderCode);
      const stmt = settle.statements.find((s) => s.lines.some(
        (l) => l.orderCode === target.sourceOrderCode || l.orderCode === root,
      ));
      if (stmt && stmt.status !== 'closed') {
        settle.adjustStatement(stmt.id, {
          amount: Math.min(target.refundAmount, stmt.amount),
          reason: `退货退款（${target.code} · ${target.customerName}）`,
          refCode: target.code,
        });
      }
      // 预付客户（档案结算方式=预付）退款回钱包余额
      const isPrepaid = customerItems.find((c) => c.name === target.customerName)?.settlementMethod === '预付';
      if (isPrepaid) settle.walletRefund(target.customerName, target.refundAmount, target.code, `退货退款回钱包（${target.code}）`);
    }
  },

  removeReturn: (id) => set({ returns: get().returns.filter((r) => r.id !== id) }),
}));
