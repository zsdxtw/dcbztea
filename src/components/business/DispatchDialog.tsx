import { useEffect, useMemo, useState } from 'react';
import Button from '../common/Button';
import SplitDraftBuilder, { type DraftFulfillment, REMAINDER_DRAFT_ID } from './SplitDraftBuilder';
import { ReportMatchPicker } from './ReportMatchDialog';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePriceStore } from '../../stores/priceStore';
import { useSupplierStore } from '../../stores/supplierStore';
import { useScoreStore, getScoreSummary } from '../../stores/scoreStore';
import { PROVINCE_NAMES, getCities, getDistricts, regionTextOf } from '../../data/regions';
import { getStock, getWarehouseStock } from '../../data/stock';
import type { ExternalOrder, ExternalOrderItem, RegionScope, SupplierItem } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;
const PAGE_SIZE = 10;

type Direction = 'self' | 'report' | 'compare' | 'assign';
type CompareTypeScope = 'both' | 'service' | 'supplier';
type CoopMode = 'supplier' | 'service';

/** 单个履约单 TAB 的分发配置（确认后暂存，全部 TAB 配置完统一落库） */
interface TabConfig {
  direction: Direction;
  supplierId?: string;
  supplierMode?: CoopMode;
  compareTypeScope?: CompareTypeScope;
  compareMode?: CoopMode;
  floorType?: 'discount' | 'price';
  floorValue?: string;
  scope?: { province?: string; city?: string; district?: string };
  /** 报备匹配：人工勾选的报备编号（可多选，转给首家勾选报备的合作商） */
  reportCodes?: string[];
}

interface Props {
  /** 分发对象：销售单处理=销售单；履约单分发=销售履约单 */
  order: ExternalOrder | null;
  /** sales：分发后由销售单生成 1..n 张履约单；fulfillment：在原履约单下拆出 1..n 张履约单 */
  mode: 'sales' | 'fulfillment';
  onClose: () => void;
  /** 分发完成提示（页面顶部 flash） */
  onDone: (msg: string) => void;
  /** 先去拆单（履约单分发模式）：关闭分发弹窗并打开拆单弹窗 */
  onGoSplit?: () => void;
}

const partnerTypeLabel = (s: SupplierItem) =>
  (['brand', 'service', 'supplier'] as const)
    .filter((t) => s.types.includes(t))
    .map((t) => (t === 'brand' ? '品牌商' : t === 'service' ? '服务商' : '供应商'))
    .join(' / ');

/**
 * 共用分发弹窗，下方四方向「自营（淡茶半盏）/ 转派-报备 / 转派-比单 / 转派-指定」：
 * - sales：上方可先拆单预生成履约单 TAB（剩余部分以虚线 TAB 排在末尾），每个 TAB 可「预确定」分发方式（锁定该 TAB），
 *   点击「确认拆单并分发」生成全部履约单：已预确定的同步分发，未预确定的进入待分发；
 * - fulfillment：不展示拆单与预确定，仅对当前履约单整单选择方向并分发。
 */
export default function DispatchDialog({ order, mode, onClose, onDone, onGoSplit }: Props) {
  const products = usePriceStore((s) => s.products);
  const purchaseRules = usePriceStore((s) => s.purchaseRules);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const scoreEntries = useScoreStore((s) => s.entries);
  const settings = useOrderFlowStore((s) => s.settings);
  const store = useOrderFlowStore;

  const [drafts, setDrafts] = useState<DraftFulfillment[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  /** 已确定分发方式的 TAB id */
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);
  /** 各 TAB 的分发配置 */
  const [configs, setConfigs] = useState<Record<string, TabConfig>>({});
  const [notice, setNotice] = useState('');
  const [noticeOk, setNoticeOk] = useState(false);

  /** 当前选中 TAB 的编辑态 */
  const [direction, setDirection] = useState<Direction>('self');
  const [supplierId, setSupplierId] = useState('');
  const [supplierMode, setSupplierMode] = useState<'' | CoopMode>('');
  const [compareTypeScope, setCompareTypeScope] = useState<CompareTypeScope>('both');
  const [compareMode, setCompareMode] = useState<'' | CoopMode>('');
  const [floorType, setFloorType] = useState<'discount' | 'price'>('discount');
  const [floorValue, setFloorValue] = useState('88');
  const [scopeProv, setScopeProv] = useState('');
  const [scopeCity, setScopeCity] = useState('');
  const [scopeDist, setScopeDist] = useState('');

  /** 指定：列表筛选项（不属于单张 TAB 配置） */
  const [supplierProv, setSupplierProv] = useState('');
  const [supplierCity, setSupplierCity] = useState('');
  const [supplierDist, setSupplierDist] = useState('');
  const [supplierKw, setSupplierKw] = useState('');
  const [supplierBrand, setSupplierBrand] = useState('');
  const [supplierType, setSupplierType] = useState<'' | 'brand' | 'service' | 'supplier'>('');
  const [supplierPage, setSupplierPage] = useState(1);

  const loadCfg = (c?: TabConfig) => {
    setDirection(c?.direction ?? 'self');
    setSupplierId(c?.supplierId ?? '');
    setSupplierMode(c?.supplierMode ?? '');
    setCompareTypeScope(c?.compareTypeScope ?? 'both');
    setCompareMode(c?.compareMode ?? '');
    setFloorType(c?.floorType ?? 'discount');
    setFloorValue(c?.floorValue ?? '88');
    setScopeProv(c?.scope?.province ?? '');
    setScopeCity(c?.scope?.city ?? '');
    setScopeDist(c?.scope?.district ?? '');
  };

  /** 重置：清空拆单草稿与全部分发配置，恢复为未拆分的整单状态 */
  const resetAll = () => {
    setDrafts([]);
    setSelected(REMAINDER_DRAFT_ID);
    setConfirmedIds([]);
    setConfigs({});
    setNoticeOk(true);
    setNotice('已重置，拆单与分发配置已清空');
    loadCfg(undefined);
    setSupplierProv(''); setSupplierCity(''); setSupplierDist(''); setSupplierKw('');
    setSupplierBrand(''); setSupplierType(''); setSupplierPage(1);
  };

  /* 每次打开新的分发对象时重置 */
  useEffect(() => {
    setDrafts([]);
    setSelected(REMAINDER_DRAFT_ID);
    setConfirmedIds([]);
    setConfigs({});
    setNotice('');
    setNoticeOk(false);
    loadCfg(undefined);
    setSupplierProv(''); setSupplierCity(''); setSupplierDist(''); setSupplierKw('');
    setSupplierBrand(''); setSupplierType(''); setSupplierPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  /** 未拆出的剩余数量（作为末尾虚线 TAB） */
  const remainderItems = useMemo(() => {
    if (!order) return [];
    return order.items
      .map((it) => {
        const used = drafts.reduce((s, d) => s
          + d.items.filter((x) => x.productId === it.productId).reduce((a, x) => a + x.quantity, 0), 0);
        return { ...it, quantity: it.quantity - used };
      })
      .filter((it) => it.quantity > 0);
  }, [order, drafts]);

  /** 全部可分发 TAB：已拆出的履约单 + 末尾剩余部分 */
  const tabs = useMemo(() => {
    const list = drafts.map((d, i) => ({
      id: d.id,
      label: `履约单${String(i + 1).padStart(2, '0')}`,
      items: d.items,
    }));
    if (remainderItems.length > 0) {
      list.push({
        id: REMAINDER_DRAFT_ID,
        label: drafts.length === 0 ? (mode === 'fulfillment' ? '当前履约单' : '整单（剩余）') : '剩余部分',
        items: remainderItems,
      });
    }
    return list;
  }, [drafts, remainderItems, mode]);

  const selectedKey = selected && tabs.some((t) => t.id === selected) ? selected : (tabs[0]?.id ?? null);
  const currentTab = tabs.find((t) => t.id === selectedKey);
  const unitItems: ExternalOrderItem[] = currentTab?.items ?? order?.items ?? [];

  const labelOf = (id: string) => tabs.find((t) => t.id === id)?.label ?? '当前履约单';

  /** 选中 TAB 的商品变更后，若原选中已不存在则回落到末尾 TAB */
  useEffect(() => {
    if (!order) return;
    if (selected && !tabs.some((t) => t.id === selected)) {
      const fallback = tabs[tabs.length - 1]?.id ?? null;
      setSelected(fallback);
      loadCfg(fallback ? configs[fallback] : undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, tabs, selected]);

  /* 转去自营：库存 / 采购缺口 / 采购价区间 */
  const selfPlan = useMemo(() => unitItems.map((it) => {
    const stock = getStock(it.productId);
    const wh = getWarehouseStock(it.productId);
    const need = Math.max(0, it.quantity - stock);
    const rules = purchaseRules.filter((r) => r.productId === it.productId && r.status === 'active');
    const prices = rules.map((r) => r.purchasePrice);
    const p = products.find((x) => x.id === it.productId) ?? products.find((x) => x.name === it.productName);
    const low = prices.length ? Math.min(...prices) : Math.round((p?.marketPrice ?? it.price) * 0.5);
    const high = prices.length ? Math.max(...prices) : Math.round((p?.marketPrice ?? it.price) * 0.6);
    return { it, stock, wh, need, low, high };
  }), [unitItems, purchaseRules, products]);

  /* ── 指定：合作商筛选（列表筛选，不属于单张 TAB 配置） ── */
  const brandOptions = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort(),
    [products],
  );
  const filteredSuppliers = useMemo(() => suppliers.filter((s) => {
    if (s.status !== 'active') return false;
    if (supplierProv && s.registeredProvince !== supplierProv && s.contactProvince !== supplierProv) return false;
    if (supplierCity && s.registeredCity !== supplierCity && s.contactCity !== supplierCity) return false;
    if (supplierDist && s.registeredDistrict !== supplierDist && s.contactDistrict !== supplierDist) return false;
    if (supplierKw && !s.name.includes(supplierKw)) return false;
    if (supplierBrand && !(s.mainBrands ?? []).includes(supplierBrand)) return false;
    if (supplierType && !s.types.includes(supplierType)) return false;
    return true;
  }), [suppliers, supplierProv, supplierCity, supplierDist, supplierKw, supplierBrand, supplierType]);
  const supplierPages = Math.max(1, Math.ceil(filteredSuppliers.length / PAGE_SIZE));
  const pagedSuppliers = filteredSuppliers.slice((supplierPage - 1) * PAGE_SIZE, supplierPage * PAGE_SIZE);
  useEffect(() => { setSupplierPage(1); }, [supplierProv, supplierCity, supplierDist, supplierKw, supplierBrand, supplierType]);

  const supplierCityOpts = supplierProv ? getCities(supplierProv).map((c) => c.name) : [];
  const supplierDistOpts = supplierProv && supplierCity ? getDistricts(supplierProv, supplierCity) : [];
  const scopeCityOpts = scopeProv ? getCities(scopeProv).map((c) => c.name) : [];
  const scopeDistOpts = scopeProv && scopeCity ? getDistricts(scopeProv, scopeCity) : [];

  const scoreOf = (s: SupplierItem) => getScoreSummary({ entries: scoreEntries, supplierId: s.id, supplierName: s.name });

  const workingCfg = (): TabConfig => ({
    direction,
    supplierId: supplierId || undefined,
    supplierMode: (supplierMode || undefined) as CoopMode | undefined,
    compareTypeScope,
    compareMode: (compareMode || undefined) as CoopMode | undefined,
    floorType,
    floorValue,
    scope: { province: scopeProv || undefined, city: scopeCity || undefined, district: scopeDist || undefined },
  });

  /** 切换 TAB：暂存未预确定 TAB 的编辑态，载入目标 TAB 的已选配置 */
  const selectTab = (id: string | null) => {
    if (!id) { setSelected(null); return; }
    if (selectedKey && id !== selectedKey && !confirmedIds.includes(selectedKey)) {
      const next = { ...configs, [selectedKey]: workingCfg() };
      setConfigs(next);
      setSelected(id);
      loadCfg(next[id]);
    } else {
      setSelected(id);
      if (id !== selectedKey) loadCfg(configs[id]);
    }
    setNotice('');
  };

  /** 单张 TAB 配置校验 */
  const validate = (): string => {
    if (direction === 'assign') {
      if (!supplierMode) return '请选择本单合作模式（差价 / 扣点）';
      if (!supplierId) return '请选择合作商';
    }
    if (direction === 'compare') {
      if (!compareMode) return '请选择本单合作模式（差价 / 扣点）';
      if (!(Number(floorValue) > 0)) return '请填写有效底价';
    }
    return '';
  };

  /** 执行单张履约单的分发；返回失败提示（成功为空串） */
  const applyOne = (targetId: string, cfg?: TabConfig): string => {
    if (!cfg) return '缺少分发配置';
    if (cfg.direction === 'self') {
      store.getState().chooseSelfPath(targetId);
      return '';
    }
    if (cfg.direction === 'assign') {
      const s = suppliers.find((x) => x.id === cfg.supplierId);
      if (!s) return '合作商不存在或已停用';
      store.getState().assignPartner(targetId, s.id, s.name, cfg.supplierMode);
      return '';
    }
    if (cfg.direction === 'compare') {
      const v = Number(cfg.floorValue);
      if (!(v > 0)) return '底价无效';
      const scope = cfg.compareTypeScope ?? 'both';
      const partnerTypes = scope === 'both' ? ['service', 'supplier'] as const : [scope] as const;
      const region: RegionScope | undefined = cfg.scope && (cfg.scope.province || cfg.scope.city || cfg.scope.district)
        ? cfg.scope
        : undefined;
      const r = store.getState().startCompare(targetId, { type: cfg.floorType ?? 'discount', value: v }, region, {
        partnerTypes: [...partnerTypes],
        coopMode: cfg.compareMode,
      });
      return r.ok ? '' : r.msg;
    }
    const r = store.getState().matchReportManual(targetId, cfg.reportCodes ?? []);
    return r.ok ? '' : r.msg;
  };

  /** 快速拆单：按品牌 / 按商品整单分组，直接生成对应数量的预生成 TAB */
  const quickSplit = (by: 'brand' | 'product') => {
    if (!order) return;
    const groups = new Map<string, ExternalOrderItem[]>();
    for (const it of order.items) {
      const p = products.find((x) => x.id === it.productId) ?? products.find((x) => x.name === it.productName);
      const key = by === 'brand' ? (p?.brand ?? '其他') : it.productName;
      groups.set(key, [...(groups.get(key) ?? []), { ...it }]);
    }
    const next: DraftFulfillment[] = [...groups.entries()].map(([, its], i) => ({
      id: `draft_q_${Date.now()}_${i}`,
      items: its,
    }));
    setDrafts(next);
    setSelected(next[0]?.id ?? null);
    /* 重新生成 TAB 后，原有预确定全部失效 */
    if (confirmedIds.length > 0) {
      setConfirmedIds([]);
      setConfigs({});
      setNoticeOk(true);
      setNotice('已按' + (by === 'brand' ? '品牌' : '商品') + '重新拆单，原预确定的分发方式已清空');
    } else {
      setNotice('');
    }
  };

  /** 预确定当前 TAB 的分发方式：TAB 锁定（实心圆、不可删除）；不预确定也可确认拆单 */
  const preConfirm = () => {
    if (!selectedKey) { setNoticeOk(false); setNotice('请先生成或选择履约单 TAB'); return; }
    const err = validate();
    if (err) { setNoticeOk(false); setNotice(err); return; }
    setConfigs((c) => ({ ...c, [selectedKey]: workingCfg() }));
    setConfirmedIds((ids) => (ids.includes(selectedKey) ? ids : [...ids, selectedKey]));
    setNoticeOk(true);
    setNotice(`已预确定「${labelOf(selectedKey)}」的分发方式`);
  };

  /** 预确定当前 TAB：报备方向需先勾选报备记录，其他方向按当前选择校验 */
  const handlePreConfirm = () => {
    if (!selectedKey) { setNoticeOk(false); setNotice('请先生成或选择履约单 TAB'); return; }
    if (direction === 'report') {
      const codes = configs[selectedKey]?.reportCodes ?? [];
      if (codes.length === 0) { setNoticeOk(false); setNotice('请先勾选要匹配的报备记录'); return; }
      setConfigs((c) => ({ ...c, [selectedKey]: { direction: 'report' as const, reportCodes: codes } }));
      setConfirmedIds((ids) => (ids.includes(selectedKey) ? ids : [...ids, selectedKey]));
      setNoticeOk(true);
      setNotice(`已预确定「${labelOf(selectedKey)}」的分发方式（${codes.length} 条报备）`);
      return;
    }
    preConfirm();
  };

  /** 报备勾选变化：暂存勾选的报备编号（是否锁定由「预确定」决定） */
  const handleReportCodesChange = (codes: string[]) => {
    if (!selectedKey) return;
    setConfigs((c) => ({ ...c, [selectedKey]: { ...(c[selectedKey] ?? workingCfg()), direction: 'report' as const, reportCodes: codes } }));
    setNotice('');
  };

  /** 销售单处理：生成全部履约单；已预确定分发方式的同步分发，其余进入待分发 */
  const commitSales = () => {
    const o = order;
    if (!o) return;
    const cfgOf = (tabId: string) => (confirmedIds.includes(tabId) ? configs[tabId] : undefined);

    /* 未拆单：销售单本身作为一张履约单 */
    if (drafts.length === 0) {
      const r = store.getState().dispatchSalesOrder(o.id);
      if (!r.ok) { setNoticeOk(false); setNotice(r.msg); return; }
      const cfg = cfgOf(REMAINDER_DRAFT_ID);
      if (cfg) {
        const err = applyOne(o.id, cfg);
        if (err) { setNoticeOk(false); setNotice(`「${labelOf(REMAINDER_DRAFT_ID)}」分发失败：${err}`); return; }
        onDone('已整单分发（该销售单即一张履约单）');
      } else {
        onDone(`已生成 1 张履约单（${o.code}LY01），进入待分发`);
      }
      onClose();
      return;
    }

    const groups = drafts.map((d) => d.items);
    const res = store.getState().splitSalesOrderToFulfillments(o.id, groups);
    if (!res.ok || !res.created?.length) { setNoticeOk(false); setNotice(res.msg); return; }

    const orderedIds = [...drafts.map((d) => d.id), ...(remainderItems.length > 0 ? [REMAINDER_DRAFT_ID] : [])];
    let dispatched = 0;
    for (let i = 0; i < res.created.length; i += 1) {
      const tabId = orderedIds[i];
      const cfg = tabId ? cfgOf(tabId) : undefined;
      if (!cfg) continue;
      const err = applyOne(res.created[i].id, cfg);
      if (err) { setNoticeOk(false); setNotice(`「${labelOf(tabId)}」分发失败：${err}`); return; }
      dispatched += 1;
    }
    const pending = res.created.length - dispatched;
    onDone(`已生成 ${res.created.length} 张履约单，${dispatched} 张已分发${pending > 0 ? `，${pending} 张进入待分发` : ''}`);
    onClose();
  };

  const primaryLabel = mode === 'sales' ? '确认拆单并分发' : '确认分发';

  const handlePrimary = () => {
    if (mode === 'sales') { commitSales(); return; }
    if (direction === 'report') {
      const codes = configs[REMAINDER_DRAFT_ID]?.reportCodes ?? [];
      if (codes.length === 0) { setNoticeOk(false); setNotice('请先勾选要匹配的报备记录'); return; }
      const err = applyOne(order!.id, { direction: 'report', reportCodes: codes });
      if (err) { setNoticeOk(false); setNotice(err); return; }
      onDone('已完成当前履约单分发（报备转出）');
      onClose();
      return;
    }
    const err = validate();
    if (err) { setNoticeOk(false); setNotice(err); return; }
    const err2 = applyOne(order!.id, workingCfg());
    if (err2) { setNoticeOk(false); setNotice(err2); return; }
    onDone('已完成当前履约单分发');
    onClose();
  };

  if (!order) return null;

  return (
    <>
      <div className="category-dialog-overlay" onClick={onClose}>
        <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 980, maxWidth: '94vw', height: '90vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4) var(--space-5) var(--space-3)', borderBottom: '1px solid var(--color-neutral-100)', flexShrink: 0 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>分发 · {order.code}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginTop: 2 }}>
              {order.customerName} · {regionTextOf(order.customerRegion, order.receiverAddress)} · {money(order.totalAmount)} · 当前分发单元：
              <strong> {currentTab?.label ?? '整单'}</strong>
              <span style={{ marginLeft: 8 }}>{mode === 'sales' ? '已预确定' : '已确定'} {confirmedIds.length} / {tabs.length} 张</span>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--space-4) var(--space-5)' }}>
            {mode === 'sales' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>拆单（可选；每个 TAB 可分别确定分发方式）</div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>快速拆单：</span>
                    <Button size="sm" onClick={() => quickSplit('brand')}>按品牌拆单</Button>
                    <Button size="sm" onClick={() => quickSplit('product')}>按商品拆单</Button>
                  </span>
                </div>
                <SplitDraftBuilder
                  compact
                  items={order.items}
                  drafts={drafts}
                  onChange={(next) => { setDrafts(next); setNotice(''); }}
                  selectedId={selectedKey}
                  onSelect={selectTab}
                  remainderTab
                  configuredIds={confirmedIds}
                  hideQuickSplit
                />
                <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
                  {drafts.length === 0
                    ? `未拆出履约单 TAB：确认后整个销售单作为一张履约单（${order.code}LY01）；未预确定分发方式的进入待分发。`
                    : '剩余部分以虚线 TAB 排在末尾，可与其他 TAB 分别预确定分发方式；未预确定的履约单确认后进入待分发。'}
                </div>
              </>
            ) : (
              <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', lineHeight: 1.8 }}>
                本次分发针对整个履约单 <strong>{order.code}</strong>（{order.items.reduce((s, it) => s + it.quantity, 0)} 份商品，共 {order.items.length} 个商品）。
                如需拆分后再分发，请先关闭本弹窗，使用该履约单的「拆单」功能拆出履约单，再分别分发。
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
              {([
                ['self', '自营（淡茶半盏）'],
                ['report', '转派-报备'],
                ['compare', '转派-比单'],
                ['assign', '转派-指定'],
              ] as const).map(([k, label]) => (
                <button key={k} className={`tab-card-simple${direction === k ? ' active' : ''}`} onClick={() => setDirection(k)} style={{ padding: '5px 28px', minWidth: 132, justifyContent: 'center' }}>
                  {label}
                </button>
              ))}
            </div>

            {direction === 'self' && (
              <div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)', lineHeight: 1.7 }}>
                  自营仓优先发货，库存不足部分按以销定采生成采购需求。
                </div>
                <table className="detail-inline-table">
                  <thead><tr><th>商品名称</th><th>订单数量</th><th>当前库存</th><th>仓库分布</th><th>需采购</th><th>采购价区间</th></tr></thead>
                  <tbody>
                    {selfPlan.map((r) => (
                      <tr key={r.it.productId}>
                        <td style={{ fontWeight: 'var(--font-medium)' }}>{r.it.productName}</td>
                        <td className="mono">{r.it.quantity}</td>
                        <td className="mono" style={{ color: r.stock > 0 ? '#01795D' : '#C62828' }}>{r.stock}</td>
                        <td style={{ fontSize: 'var(--text-sm)' }}>{r.wh.length ? r.wh.map((w) => `${w.warehouseName} ${w.qty}`).join(' / ') : '—'}</td>
                        <td className="mono" style={{ color: r.need > 0 ? '#B26A00' : 'var(--color-neutral-400)' }}>{r.need}</td>
                        <td className="mono">{money(r.low)} - {money(r.high)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {direction === 'assign' && (
              <div>
                {/* 第一行：本单合作模式（必选） */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>
                    本单合作模式 <span style={{ color: '#C62828' }}>*</span>
                  </span>
                  <select className="filter-select" value={supplierMode} onChange={(e) => setSupplierMode(e.target.value as typeof supplierMode)} style={{ minWidth: 160 }}>
                    <option value="">请选择合作模式</option>
                    <option value="supplier">差价模式</option>
                    <option value="service">扣点模式</option>
                  </select>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>该订单与本单合作商的合作模式（必选）</span>
                </div>
                {/* 第二行：列表筛选项 */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
                  <select className="filter-select" value={supplierProv} onChange={(e) => { setSupplierProv(e.target.value); setSupplierCity(''); setSupplierDist(''); }}>
                    <option value="">全部省份</option>
                    {PROVINCE_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select className="filter-select" disabled={!supplierProv} value={supplierCity} onChange={(e) => { setSupplierCity(e.target.value); setSupplierDist(''); }}>
                    <option value="">全部城市</option>
                    {supplierCityOpts.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="filter-select" disabled={!supplierCity} value={supplierDist} onChange={(e) => setSupplierDist(e.target.value)}>
                    <option value="">全部区县</option>
                    {supplierDistOpts.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select className="filter-select" value={supplierBrand} onChange={(e) => setSupplierBrand(e.target.value)}>
                    <option value="">全部主营品牌</option>
                    {brandOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <select className="filter-select" value={supplierType} onChange={(e) => setSupplierType(e.target.value as typeof supplierType)}>
                    <option value="">全部类型</option>
                    <option value="brand">品牌商</option>
                    <option value="service">服务商</option>
                    <option value="supplier">供应商</option>
                  </select>
                  <input className="filter-input" placeholder="搜索合作商名称..." value={supplierKw} onChange={(e) => setSupplierKw(e.target.value)} style={{ width: 160 }} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', alignSelf: 'center' }}>共 {filteredSuppliers.length} 家</span>
                </div>
                <table className="detail-inline-table">
                  <thead><tr><th></th><th>合作商</th><th>类型</th><th>主营品牌</th><th>积分</th><th>履约率</th><th>地区</th></tr></thead>
                  <tbody>
                    {pagedSuppliers.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-neutral-400)', padding: 'var(--space-3)' }}>当前筛选条件下暂无合作商</td></tr>}
                    {pagedSuppliers.map((s) => {
                      const sc = scoreOf(s);
                      return (
                        <tr key={s.id}>
                          <td><input type="radio" name="dispatch-supplier" checked={supplierId === s.id} onChange={() => setSupplierId(s.id)} /></td>
                          <td style={{ fontWeight: 'var(--font-medium)' }}>{s.name}</td>
                          <td style={{ fontSize: 'var(--text-sm)' }}>{partnerTypeLabel(s)}</td>
                          <td style={{ fontSize: 'var(--text-sm)' }}>{(s.mainBrands ?? []).join('、') || '—'}</td>
                          <td className="mono">{sc.total}</td>
                          <td className="mono">{sc.ontimeRate}%</td>
                          <td style={{ fontSize: 'var(--text-sm)' }}>{[s.registeredProvince, s.registeredCity, s.registeredDistrict].filter(Boolean).join(' / ') || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredSuppliers.length > PAGE_SIZE && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                    <Button size="sm" variant="ghost" disabled={supplierPage <= 1} onClick={() => setSupplierPage(supplierPage - 1)}>上一页</Button>
                    <span className="mono">{supplierPage} / {supplierPages}</span>
                    <Button size="sm" variant="ghost" disabled={supplierPage >= supplierPages} onClick={() => setSupplierPage(supplierPage + 1)}>下一页</Button>
                  </div>
                )}
              </div>
            )}

            {direction === 'compare' && (
              <div>
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <label className="drawer-label">合作商类型</label>
                    <select className="filter-select" value={compareTypeScope} onChange={(e) => setCompareTypeScope(e.target.value as CompareTypeScope)}>
                      <option value="both">服务商 + 供应商</option>
                      <option value="service">仅服务商</option>
                      <option value="supplier">仅供应商</option>
                    </select>
                  </div>
                  <div>
                    <label className="drawer-label">本单合作模式 <span style={{ color: '#C62828' }}>*</span></label>
                    <select className="filter-select" value={compareMode} onChange={(e) => setCompareMode(e.target.value as typeof compareMode)}>
                      <option value="">请选择合作模式</option>
                      <option value="supplier">差价模式</option>
                      <option value="service">扣点模式</option>
                    </select>
                  </div>
                  <div>
                    <label className="drawer-label">底价方式</label>
                    <select className="filter-select" value={floorType} onChange={(e) => setFloorType(e.target.value as 'discount' | 'price')}>
                      <option value="discount">按折扣</option>
                      <option value="price">按具体价格</option>
                    </select>
                  </div>
                  <div>
                    <label className="drawer-label">{floorType === 'discount' ? '最低折扣（%）' : '最低价格（元）'}</label>
                    <input className="filter-input mono" type="number" min={1} value={floorValue} onChange={(e) => setFloorValue(e.target.value)} style={{ width: 140 }} />
                  </div>
                  <div>
                    <label className="drawer-label">报名时长（分钟）</label>
                    <input
                      className="filter-input mono" type="number" min={1} value={settings.compareMinutes}
                      onChange={(e) => store.getState().updateSettings({ compareMinutes: Math.max(1, Number(e.target.value) || 30) })}
                      style={{ width: 120 }}
                    />
                  </div>
                  <div>
                    <label className="drawer-label">评分权重（报价 / 积分）</label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <input
                        className="filter-input mono" type="number" min={0} max={10} value={settings.compareWeights.quote}
                        onChange={(e) => store.getState().updateSettings({
                          compareWeights: { ...settings.compareWeights, quote: Math.max(0, Number(e.target.value) || 0) },
                        })}
                        style={{ width: 80 }}
                      />
                      <input
                        className="filter-input mono" type="number" min={0} max={10} value={settings.compareWeights.score}
                        onChange={(e) => store.getState().updateSettings({
                          compareWeights: { ...settings.compareWeights, score: Math.max(0, Number(e.target.value) || 0) },
                        })}
                        style={{ width: 80 }}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', flex: 1, minWidth: 200 }}>
                    评分 = 报价 {settings.compareWeights.quote}0% + 积分 {settings.compareWeights.score}0%，调整后立即生效。
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>参与地区：</span>
                  <select className="filter-select" value={scopeProv} onChange={(e) => { setScopeProv(e.target.value); setScopeCity(''); setScopeDist(''); }}>
                    <option value="">全部省份</option>
                    {PROVINCE_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select className="filter-select" disabled={!scopeProv} value={scopeCity} onChange={(e) => { setScopeCity(e.target.value); setScopeDist(''); }}>
                    <option value="">全部城市</option>
                    {scopeCityOpts.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="filter-select" disabled={!scopeCity} value={scopeDist} onChange={(e) => setScopeDist(e.target.value)}>
                    <option value="">全部区县</option>
                    {scopeDistOpts.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            )}

            {direction === 'report' && (
              <div>
                <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', lineHeight: 1.8, marginBottom: 'var(--space-3)' }}>
                  报备匹配由<strong>人工处理</strong>：下方直接展示全部已通过的报备记录（订单报备 / 商品报备 / 地区报备），请人工勾选命中的报备。
                  {mode === 'sales'
                    ? '勾选报备后点击「预确定」锁定该履约单 TAB；确认拆单时同步转出报备合作商。'
                    : '点击底部「确认分发」后整单直接转出至所选报备合作商。'}
                  无货源订单报备确认后订单退回待分发，由平台自营或转派供货商。
                </div>
                <ReportMatchPicker
                  order={order}
                  items={unitItems}
                  checked={configs[selectedKey ?? REMAINDER_DRAFT_ID]?.reportCodes ?? []}
                  onCheckedChange={handleReportCodesChange}
                />
              </div>
            )}

            {/* 预确定当前履约单的分发方式（履约单分发场景不展示） */}
            {mode === 'sales' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
                  预确定后「{currentTab?.label ?? '当前履约单'}」TAB 将锁定不可删除；也可不预确定，确认拆单后该履约单进入待分发
                </span>
                <Button onClick={handlePreConfirm}>预确定</Button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-5)', borderTop: '1px solid var(--color-neutral-100)', flexShrink: 0 }}>
            <span style={{ fontSize: 'var(--text-sm)', color: noticeOk ? '#01795D' : '#C62828' }}>{notice}</span>
            <span style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={onClose}>关闭</Button>
              {mode === 'sales' && (
                <Button variant="ghost" className="btn-secondary-fill" onClick={resetAll}>重置</Button>
              )}
              <Button onClick={handlePrimary}>
                {primaryLabel}
              </Button>
              {mode === 'fulfillment' && (
                <Button onClick={() => { onClose(); onGoSplit?.(); }}>先去拆单</Button>
              )}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
