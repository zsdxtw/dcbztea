import { create } from 'zustand';
import type { PartnerOrder, PartnerReport, PlatformOrder } from '../types';
import { partnerReports, platformOrders } from '../data/partner';

/* ── 报备匹配逻辑 ──────────────────────────────────────────────
 * 订单报备：按关联订单编号命中
 * 商品报备：商品 + 区域（含全部地区）+ 客户范围（含全部客户）命中
 * 客户报备：按客户名称命中
 * ──────────────────────────────────────────────────────────── */

/** 判断平台订单是否命中报备规则 */
function matchesReport(order: PlatformOrder, report: PartnerReport): boolean {
  if (report.type === 'order') {
    return order.code === report.relatedOrderCode;
  }
  if (report.type === 'product') {
    return (
      !!report.productName &&
      order.items.some((it) => it.productName === report.productName) &&
      (report.region === '全部地区' || order.customerRegion.includes(report.region ?? '')) &&
      (report.customer === '全部客户' || order.customerName === report.customer)
    );
  }
  if (report.type === 'customer') {
    return order.customerName === report.targetCustomer;
  }
  return false;
}

/** 获取报备当前命中的平台订单（管理台审批参考） */
export function getReportMatchedOrders(report: PartnerReport): PlatformOrder[] {
  return platformOrders.filter((po) => matchesReport(po, report));
}

/** 根据审批通过的报备规则，计算自动转入合作商名下的订单 */
export function getTransferredOrders(reports: PartnerReport[]): PartnerOrder[] {
  const approved = reports.filter((r) => r.status === 'approved');
  const used = new Set<string>();
  const result: PartnerOrder[] = [];
  for (const report of approved) {
    for (const po of platformOrders) {
      if (used.has(po.id) || !matchesReport(po, report)) continue;
      const transferKind: NonNullable<PartnerOrder['transferKind']> =
        report.type === 'order'
          ? report.orderKind === 'opportunity'
            ? 'order-opportunity'
            : 'order-self'
          : report.type === 'product'
            ? 'product'
            : 'customer';
      used.add(po.id);
      result.push({
        ...po,
        id: `transfer_${po.id}`,
        // 商机报备订单由平台进货发货，合作商仅同步查看
        status: transferKind === 'order-opportunity' ? 'shipping' : 'pending',
        sourceReport: report.code,
        transferKind,
      });
    }
  }
  return result;
}

/* ── 共享报备 Store（管理台审批 / 合作商终端提交，同一运行时互通） ── */

interface ReportState {
  reports: PartnerReport[];
  /** 合作商终端提交报备（进入管理台待审批） */
  submitReport: (report: PartnerReport) => void;
  /** 管理台审批报备 */
  reviewReport: (id: string, status: 'approved' | 'rejected', note: string) => void;
}

const formatNow = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

export const useReportStore = create<ReportState>((set) => ({
  reports: partnerReports,

  submitReport: (report) =>
    set((s) => ({ reports: [report, ...s.reports] })),

  reviewReport: (id, status, note) =>
    set((s) => ({
      reports: s.reports.map((r) =>
        r.id === id ? { ...r, status, reviewNote: note, reviewTime: formatNow() } : r,
      ),
    })),
}));
