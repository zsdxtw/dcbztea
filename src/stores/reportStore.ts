import { create } from 'zustand';
import type { PartnerOrder, PartnerReport, PlatformOrder } from '../types';
import { partnerReports, platformOrders } from '../data/partner';
import { useScoreStore } from './scoreStore';

/* ── 报备匹配逻辑 ──────────────────────────────────────────────
 * 订单报备：按关联订单编号命中
 * 商品报备：商品 + 区域（含全部地区）+ 客户范围（含全部客户）命中
 * 客户报备：按客户名称命中
 * ──────────────────────────────────────────────────────────── */

/** 报备优先级：订单报备(0) > 商品报备(1) > 地区报备(2) */
export function reportPriority(r: PartnerReport): number {
  return r.type === 'order' ? 0 : r.type === 'product' ? 1 : 2;
}

/** 地区路径命中：'全国' | '省' | '省/市' | '省/市/县'（城市兼容"南京/南京市"写法） */
function pathMatch(region: string, path: string): boolean {
  if (path === '全国') return true;
  const segs = path.split('/');
  if (!region.includes(segs[0])) return false;
  if (segs[1] && !region.includes(segs[1].replace(/市$/, ''))) return false;
  if (segs[2] && !region.includes(segs[2])) return false;
  return true;
}

/** 地区命中：报备地区（复选路径）任一命中即通过；未设置地区视为不限 */
function regionMatch(order: PlatformOrder, r: PartnerReport): boolean {
  if (!r.regions?.length) return true;
  const region = order.customerRegion ?? '';
  return r.regions.some((p) => pathMatch(region, p));
}

/** 报备是否在有效期内（validUntil 含当日） */
export function reportActive(r: PartnerReport): boolean {
  if (!r.validUntil) return true;
  return r.validUntil >= new Date().toISOString().slice(0, 10);
}

/** 客户命中（customerName 为 "全部客户" 或未填时表示不限） */
function customerMatch(order: PlatformOrder, r: PartnerReport): boolean {
  return !r.customerName || r.customerName === '全部客户' || order.customerName === r.customerName;
}

/**
 * 判断平台订单是否命中报备规则（按优先级：订单报备 > 商品报备 > 地区报备）
 * - 订单报备：客户 +（收件电话 / 下单商品 / 内部下单编号 任一强特征）命中，地区同时校验
 * - 商品报备：客户 + 订单含报备商品（多选）+ 地区（全国或省市县命中）
 * - 地区报备：客户 + 地区命中（含服务商未经营品牌）
 */
export function matchesReport(order: PlatformOrder, report: PartnerReport): boolean {
  if (!reportActive(report)) return false;
  if (!customerMatch(order, report)) return false;
  if (report.type === 'order') {
    if (!regionMatch(order, report)) return false;
    // 强特征匹配：收件电话 / 下单商品（多选） / 内部下单编号（任一命中即认为同一笔单）
    if (report.contactPhone && order.receiverPhone && order.receiverPhone.includes(report.contactPhone)) return true;
    if (report.productNames?.length && order.items.some((it) => report.productNames!.includes(it.productName))) return true;
    if (report.internalOrderNo && order.code === report.internalOrderNo) return true;
    return false;
  }
  if (report.type === 'product') {
    if (!report.productNames?.length) return false;
    if (!order.items.some((it) => report.productNames!.includes(it.productName))) return false;
    return regionMatch(order, report);
  }
  // region 地区报备
  return regionMatch(order, report);
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
          ? report.orderKind === 'no_supply'
            ? 'order-opportunity'
            : 'order-self'
          : report.type === 'product'
            ? 'product'
            : 'region';
      used.add(po.id);
      result.push({
        ...po,
        id: `transfer_${po.id}`,
        // 无货源报备订单由平台自营/转派供货商履约，合作商仅同步查看
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

  reviewReport: (id, status, note) => {
    // 报备审批通过 → 合作商积分台账「报备情况」+5
    if (status === 'approved') {
      const target = partnerReports.find((r) => r.id === id);
      if (target) {
        useScoreStore.getState().addEntry({
          supplierId: '11',
          supplierName: target.partnerName,
          dimension: 'report',
          delta: 5,
          reason: `报备审批通过（${target.code}）`,
          refCode: target.code,
          operator: '管理员',
        });
      }
    }
    set((s) => ({
      reports: s.reports.map((r) =>
        r.id === id ? { ...r, status, reviewNote: note, reviewTime: formatNow() } : r,
      ),
    }));
  },
}));
