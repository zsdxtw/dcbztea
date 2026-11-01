/**
 * 采购订单 Store（三单分离之 PO 实体）
 *
 * 生成：
 *  - 转派子单定案（报备确认/指定/抢单定案/比单定标/分拆定案）→ 自动生成 1 张直送 PO（合作商直发客户）
 *  - 自营「采购&发货」缺口以销定采 → 按模式生成直发/入库制 PO（销售单自营菜单）
 * 状态由订单分发侧动作驱动（接单→已确认；结算→已结算），发货登记在合作商终端完成：
 *  行内多次发货（同一商品分 N 批），每批生成一个包裹，物流信息三键关联 PO+子单+母单。
 */
import { create } from 'zustand';
import type {
  ExternalOrder, PurchaseDoc, PurchaseDocItem, PurchaseDocSource, ShipmentPackage,
} from '../types';
import { externalOrderSeeds } from '../data/externalOrders';
import { usePriceStore } from './priceStore';
import type { SupplyPlanLine } from '../types';
import { getStock } from '../data/stock';

const now = () => new Date().toISOString().slice(0, 10);
const nowMin = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

/** 采购口径单价：比单用中单价（由调用方传入），否则按供应商采购价规则（缺省销售实价 55%） */
const purchasePriceOf = (it: { productId: string; price: number }, supplierId: string): number => {
  const rule = usePriceStore.getState().purchaseRules.find((r) => r.productId === it.productId && r.supplierId === supplierId && r.status === 'active');
  return rule?.purchasePrice ?? Math.round(it.price * 0.55);
};

interface CreateInput {
  child: ExternalOrder;
  source: PurchaseDocSource;
  /** 仅生成指定商品子集（多源/库存混合时按供应商分组生成）；缺省整单 */
  itemSubset?: { productId: string; quantity: number }[];
  /** 指定口径单价（如比单中单价）；缺省按采购价规则 */
  priceOf?: (it: { productId: string; price: number; quantity: number }) => number;
  deliveryMode?: 'direct' | 'warehouse';
  /** 指定供应商（多源采购行级供应商覆盖） */
  supplierId?: string;
  supplierName?: string;
}

interface PurchaseState {
  docs: PurchaseDoc[];

  /** 由子销售订单生成采购单（转派 1:1 / 自营以销定采） */
  createFromChild: (input: CreateInput) => PurchaseDoc;
  findByChild: (childCode: string) => PurchaseDoc | undefined;

  /** 合作商接单 → 已确认 */
  confirmByChild: (childCode: string) => void;

  /** 发货登记（行内多次发货）：本次各商品发货数量 + 物流信息 → 生成包裹 */
  registerShipment: (childCode: string, input: { logisticsCompany: string; trackingNo: string; items: { productId: string; qty: number }[]; operator?: string }) => { ok: boolean; msg: string };
  /** 作废未签收包裹（回退行级已发数量） */
  voidPackage: (childCode: string, packageId: string) => { ok: boolean; msg: string };
  /** 签收单个包裹 */
  deliverPackage: (childCode: string, packageId: string) => void;
  /** 全部有效包裹签收（子单妥投） */
  deliverAllByChild: (childCode: string) => void;
  /** 结算（订单分发结算动作联动） */
  settleByChild: (childCode: string) => void;
  /** 入库制 PO 到货入库 */
  receiveByChild: (childCode: string) => void;
  /** 按子单查询其全部 PO（自营多源进度派生） */
  listByChildOrder: (childOrderId: string) => PurchaseDoc[];
}

/** 内部：包裹变更后重算 PO 状态 */
const refreshStatus = (doc: PurchaseDoc): PurchaseDoc => {
  const active = doc.packages.filter((p) => p.status !== 'void');
  const allShipped = doc.items.every((it) => it.shippedQty >= it.quantity);
  const anyShipped = doc.items.some((it) => it.shippedQty > 0);
  let status = doc.status;
  if (doc.status === 'pending') status = 'pending';
  else if (allShipped && active.every((p) => p.status === 'delivered')) status = 'delivered';
  else if (allShipped) status = 'fully_shipped';
  else if (anyShipped) status = 'partial_shipped';
  else status = 'confirmed';
  if (doc.status === 'settled') status = 'settled';
  return { ...doc, status };
};

/** 由种子订单派生初始 PO（转派直送 / 自营入库），并按子单履约状态设定初始包裹 */
function seedDocs(): PurchaseDoc[] {
  const docs: PurchaseDoc[] = [];
  let pkgSeq = 1;
  const mkPkg = (doc: PurchaseDoc, productId: string, productName: string, qty: number, company: string, prefix: number, delivered: boolean): ShipmentPackage => {
    const pkg: ShipmentPackage = {
      id: `pkg_seed_${pkgSeq}`, packageNo: `PKG-${String(pkgSeq).padStart(4, '0')}`,
      logisticsCompany: company, trackingNo: `${company.includes('顺丰') ? 'SF' : 'DB'}${7000000000 + prefix}`,
      shippedAt: `${doc.createTime} 09:30`,
      items: [{ productId, productName, qty }],
      status: delivered ? 'delivered' : 'shipped', operator: doc.supplierName,
    };
    pkgSeq += 1;
    return pkg;
  };
  for (const o of externalOrderSeeds) {
    if (o.path === 'distribute' && o.partnerId && o.partnerName
      && ['distribute_pending', 'processed', 'completed'].includes(o.processStatus)) {
      const winQuote = o.compare?.quotes.find((q) => q.supplierId === o.partnerId);
      const priceOf = o.transferSource === 'compare' && winQuote
        ? (it: { productId: string; price: number; quantity: number }) => {
          const totalAmt = Math.max(1, o.items.reduce((s, i) => s + i.price * i.quantity, 0));
          return Math.round((winQuote.amount * (it.price * it.quantity)) / totalAmt / Math.max(1, it.quantity));
        }
        : undefined;
      const doc = buildDoc(o, 'distribute', priceOf, 'direct', o.transferTime ?? o.entryTime);
      // 状态按子单履约状态映射 + 生成对应包裹
      if (o.processStatus === 'distribute_pending') {
        doc.status = 'pending';
      } else if (o.processStatus === 'completed') {
        doc.status = 'settled';
      } else {
        const ps = o.partnerStatus;
        if (ps === 'accepted') {
          doc.status = 'confirmed';
        } else if (ps === 'shipping') {
          // 演示行内多次发货：同一商品分 2 批
          doc.status = 'fully_shipped';
          for (const it of doc.items) {
            const q1 = Math.max(1, Math.floor(it.quantity * 0.6));
            const q2 = it.quantity - q1;
            it.shippedQty = it.quantity;
            doc.packages.push(mkPkg(doc, it.productId, it.productName, q1, '顺丰速运', pkgSeq * 13579, false));
            if (q2 > 0) doc.packages.push(mkPkg(doc, it.productId, it.productName, q2, '德邦物流', pkgSeq * 24681, false));
          }
        } else if (ps === 'delivered') {
          doc.status = 'delivered';
          for (const it of doc.items) {
            it.shippedQty = it.quantity;
            doc.packages.push(mkPkg(doc, it.productId, it.productName, it.quantity, '顺丰速运', pkgSeq * 13579, true));
          }
        } else {
          doc.status = 'pending';
        }
      }
      docs.push(doc);
    } else if (o.path === 'self' && o.selfPo
      && ['self_accepted', 'self_shipped', 'self_delivered', 'completed'].includes(o.processStatus)) {
      // 采购数量 = 订单数量 − 分仓直发数量；直发模式按妥投状态生成直发包裹
      const directMap = new Map<string, number>();
      for (const sh of o.selfShipments ?? []) {
        for (const it of sh.items) directMap.set(it.productId, (directMap.get(it.productId) ?? 0) + it.qty);
      }
      const remain = o.items
        .map((it) => ({ ...it, quantity: it.quantity - (directMap.get(it.productId) ?? 0) }))
        .filter((it) => it.quantity > 0);
      if (remain.length > 0) {
        const child = { ...o, items: remain };
        const doc = buildDoc(child, 'self', (it) => purchasePriceOf(it, o.selfPo!.supplierId), o.selfPo!.mode, o.selfPo!.purchaseDate);
        const delivered = o.processStatus === 'self_delivered' || o.processStatus === 'completed';
        if (o.selfPo!.mode === 'direct' && delivered) {
          // 供应商直发客户：包裹已投递（妥投/确认收货）
          doc.status = 'delivered';
          for (const it of doc.items) {
            it.shippedQty = it.quantity;
            doc.packages.push(mkPkg(doc, it.productId, it.productName, it.quantity, '顺丰速运', pkgSeq * 97531, true));
          }
        } else if (o.selfPo!.mode === 'warehouse') {
          // 入库制：轨迹含「到货入库」→ 已入库待出库；否则已确认（采购在途）
          doc.status = o.history.some((h) => h.action === '到货入库') ? 'received' : 'confirmed';
        } else {
          doc.status = 'confirmed';
        }
        docs.push(doc);
      }
    }
  }
  return docs;
}

/** 构造一张 PO（不含状态后处理） */
function buildDoc(child: ExternalOrder, source: PurchaseDocSource, priceOf: ((it: { productId: string; price: number; quantity: number }) => number) | undefined, deliveryMode: 'direct' | 'warehouse', createTime: string): PurchaseDoc {
  const items: PurchaseDocItem[] = child.items.map((it) => ({
    productId: it.productId, productName: it.productName, spec: it.spec,
    quantity: it.quantity, shippedQty: 0,
    price: priceOf ? priceOf(it) : purchasePriceOf(it, child.partnerId ?? ''),
  }));
  return {
    id: `po_${child.id}`,
    code: `CG-${child.code}`,
    source,
    deliveryMode,
    childOrderId: child.id,
    childOrderCode: child.code,
    motherCode: child.parentCode ?? child.code,
    supplierId: child.partnerId ?? child.selfPo?.supplierId ?? '',
    supplierName: child.partnerName ?? child.selfPo?.supplierName ?? '',
    items,
    amount: items.reduce((s, it) => s + it.price * it.quantity, 0),
    status: 'pending',
    createTime,
    packages: [],
  };
}

export const usePurchaseStore = create<PurchaseState>((set, get) => {
  const patchDoc = (childCode: string, fn: (d: PurchaseDoc) => PurchaseDoc) => {
    set((s) => ({ docs: s.docs.map((d) => (d.childOrderCode === childCode ? fn(d) : d)) }));
  };

  return {
    docs: seedDocs(),

    createFromChild: ({ child, source, priceOf, deliveryMode, itemSubset, supplierId, supplierName }) => {
      // 幂等：同一子单同一供应商不重复生成（多源时每供应商一张）
      const supplierKey = supplierId ?? child.partnerId ?? child.selfPo?.supplierId ?? '';
      const existed = get().docs.find((d) => d.childOrderCode === child.code && d.supplierId === supplierKey);
      if (existed) return existed;
      const doc = buildDoc(child, source, priceOf, deliveryMode ?? 'direct', now());
      let final = doc;
      if (itemSubset && itemSubset.length > 0) {
        const items = itemSubset
          .map((sub) => {
            const it = doc.items.find((x) => x.productId === sub.productId);
            return it ? { ...it, quantity: sub.quantity } : null;
          })
          .filter(Boolean) as PurchaseDocItem[];
        final = { ...doc, items, amount: items.reduce((s, it) => s + it.price * it.quantity, 0) };
      }
      if (supplierId && supplierName) {
        final = { ...final, supplierId, supplierName };
      }
      const withStatus: PurchaseDoc = { ...final, status: source === 'self' ? 'confirmed' : 'pending' };
      set((s) => ({ docs: [withStatus, ...s.docs] }));
      return withStatus;
    },

    findByChild: (childCode) => get().docs.find((d) => d.childOrderCode === childCode),

    confirmByChild: (childCode) => {
      patchDoc(childCode, (d) => (d.status === 'pending' ? { ...d, status: 'confirmed' } : d));
    },

    registerShipment: (childCode, input) => {
      const doc = get().docs.find((d) => d.childOrderCode === childCode);
      if (!doc) return { ok: false, msg: '采购单不存在' };
      if (!['confirmed', 'partial_shipped', 'fully_shipped', 'received'].includes(doc.status)) return { ok: false, msg: '采购单尚未确认接单，不能发货' };
      if (!input.logisticsCompany.trim() || !input.trackingNo.trim()) return { ok: false, msg: '请填写物流公司与物流单号' };
      const lines = input.items.filter((x) => x.qty > 0);
      if (lines.length === 0) return { ok: false, msg: '请填写本次发货数量' };
      for (const line of lines) {
        const it = doc.items.find((x) => x.productId === line.productId);
        if (!it) return { ok: false, msg: '商品不在采购单内' };
        if (line.qty > it.quantity - it.shippedQty) return { ok: false, msg: `${it.productName} 本次发货数量超出剩余可发（${it.quantity - it.shippedQty}）` };
      }
      const seq = doc.packages.length + 1;
      const pkg: ShipmentPackage = {
        id: `pkg_${Date.now()}`,
        packageNo: `PKG-${doc.code}-${String(seq).padStart(2, '0')}`,
        logisticsCompany: input.logisticsCompany.trim(),
        trackingNo: input.trackingNo.trim(),
        shippedAt: nowMin(),
        items: lines.map((l) => ({ productId: l.productId, productName: doc.items.find((x) => x.productId === l.productId)!.productName, qty: l.qty })),
        status: 'shipped',
        operator: input.operator,
      };
      patchDoc(childCode, (d) => {
        const items = d.items.map((it) => {
          const line = lines.find((l) => l.productId === it.productId);
          return line ? { ...it, shippedQty: it.shippedQty + line.qty } : it;
        });
        return refreshStatus({ ...d, items, packages: [...d.packages, pkg] });
      });
      return { ok: true, msg: `发货登记成功（${pkg.packageNo}），物流单号 ${pkg.trackingNo}` };
    },

    voidPackage: (childCode, packageId) => {
      const doc = get().docs.find((d) => d.childOrderCode === childCode);
      const pkg = doc?.packages.find((p) => p.id === packageId);
      if (!doc || !pkg) return { ok: false, msg: '包裹不存在' };
      if (pkg.status === 'delivered') return { ok: false, msg: '已签收包裹不可作废（请走退货流程）' };
      patchDoc(childCode, (d) => {
        const items = d.items.map((it) => {
          const line = pkg.items.find((x) => x.productId === it.productId);
          return line ? { ...it, shippedQty: Math.max(0, it.shippedQty - line.qty) } : it;
        });
        return refreshStatus({ ...d, items, packages: d.packages.map((p) => (p.id === packageId ? { ...p, status: 'void' as const } : p)) });
      });
      return { ok: true, msg: `包裹 ${pkg.packageNo} 已作废，可发数量已回退` };
    },

    deliverPackage: (childCode, packageId) => {
      patchDoc(childCode, (d) => refreshStatus({ ...d, packages: d.packages.map((p) => (p.id === packageId ? { ...p, status: 'delivered' as const } : p)) }));
    },

    deliverAllByChild: (childCode) => {
      patchDoc(childCode, (d) => refreshStatus({
        ...d,
        packages: d.packages.map((p) => (p.status === 'shipped' ? { ...p, status: 'delivered' as const } : p)),
      }));
    },

    settleByChild: (childCode) => {
      patchDoc(childCode, (d) => ({ ...d, status: 'settled' }));
    },

    /** 入库制 PO 到货入库（已确认/部分到货 → 已入库） */
    receiveByChild: (childCode) => {
      patchDoc(childCode, (d) => (d.deliveryMode === 'warehouse' && ['confirmed'].includes(d.status)
        ? { ...d, status: 'received' } : d));
    },

    listByChildOrder: (childOrderId) => get().docs.filter((d) => d.childOrderId === childOrderId),
  };
});


/** 由自营子单 + 库存台账生成默认供应方案行（库存优先直发，缺口为净需求） */
export function buildSupplyPlan(child: { items: { productId: string; productName: string; spec: string; quantity: number }[] }): SupplyPlanLine[] {
  return child.items.map((it) => {
    const stockQty = getStock(it.productId);
    const stockUseQty = Math.min(it.quantity, stockQty);
    return {
      productId: it.productId, productName: it.productName, spec: it.spec,
      orderQty: it.quantity, stockQty,
      netQty: it.quantity - stockUseQty,
      stockUseQty, purchaseQty: it.quantity - stockUseQty,
    };
  });
}
