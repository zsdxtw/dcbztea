import { useMemo, useState, useEffect, type ReactNode } from 'react';
import { useCustomerStore, customerPlatformRate } from '../../stores/customerStore';
import { CUSTOMER_TYPE_LABELS } from '../../data/customers';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePriceStore, effectiveCustomerQuote } from '../../stores/priceStore';
import { calcPlatformNetPrice } from '../../data/prices';
import { productCategoryLabels } from '../../data/productCategories';
import { getSalesDefaultPrice, getPersonalMinPrice } from '../../data/prices';
import { PROVINCE_NAMES, getCityNames, getDistricts } from '../../data/regions';
import type { ExternalOrder, ExternalOrderItem } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const DIRECT_TYPES = ['直营客户', '渠道客户', '平台客户', '个人客户'];

interface CustomerOption { id: string; name: string; typeLabel: string; level: string; contactPerson: string; contactPhone: string; contactAddress: string }

const nowLocal = () => {
  const d = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

/**
 * 销售 · 新建销售单（手工录入类型的销售订单生成入口）
 * 首先选择销售路径：直接销售（路径1-4：直营/渠道/平台/个人客户）/ 经平台销售（路径5：淡茶→平台客户→直营客户）。
 * 客户匹配带出类型/联系人/默认价；保存后进入「销售单处理」，不自动匹配报备（报备转派由分发时人工勾选）。
 * embedded=true 时用于销售单列表的弹窗内嵌展示（不渲染页头与页容器）。
 */
export default function OrderEntry({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void }) {
  const customerItems = useCustomerStore((st) => st.customers);
  const platformItems = useCustomerStore((st) => st.platforms);
  const navigate = useNavigate();
  const store = useOrderFlowStore;
  const products = usePriceStore((s) => s.products);
  const customerQuotes = usePriceStore((s) => s.customerQuotes);

  /** 销售路径 */
  const [salesPath, setSalesPath] = useState<'direct' | 'via_platform'>('direct');
  /** 经平台销售:平台订单号(来源平台=平台客户,见 platformCustomerId) */
  const [externalOrderNo, setExternalOrderNo] = useState('');
  const [platformCustomerId, setPlatformCustomerId] = useState('');
  /** 客户侧信息 */
  const [customerOrderNo, setCustomerOrderNo] = useState('');
  const [customerOrderTime, setCustomerOrderTime] = useState(nowLocal());
  const [customerSearch, setCustomerSearch] = useState('');
  const [matchedCustomerId, setMatchedCustomerId] = useState('');
  const [customerType, setCustomerType] = useState('直营客户');
  /** 客户区域（省市县三级联动，参照合作商注册） */
  const [regionProv, setRegionProv] = useState('');
  const [regionCity, setRegionCity] = useState('');
  const [regionDist, setRegionDist] = useState('');
  const [receiver, setReceiver] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<ExternalOrderItem[]>([]);
  const [error, setError] = useState('');
  const [custDropOpen, setCustDropOpen] = useState(false);
  /** 商品选择：品牌筛选 + 名称搜索 */
  const [itemBrand, setItemBrand] = useState('');
  /** 商品分类筛选（一级分类，来源于分类管理） */
  const [itemCategory, setItemCategory] = useState('');
  /** 商品选择区分页 */
  const [pickerPage, setPickerPage] = useState(1);
  const PICKER_PAGE_SIZE = 12;
  const [itemSearch, setItemSearch] = useState('');
  /** 创建成功后展示的成功页数据 */
  const [createdOrder, setCreatedOrder] = useState<ExternalOrder | null>(null);

  const isVia = salesPath === 'via_platform';

  /** 全部客户(直接销售选择用) */
  const customerOptions: CustomerOption[] = useMemo(() => [
    ...customerItems.map((c) => ({ id: c.id, name: c.name, typeLabel: CUSTOMER_TYPE_LABELS[c.type], level: c.level || '—', contactPerson: c.contactPerson, contactPhone: c.contactPhone, contactAddress: c.contactAddress || c.region })),
    ...platformItems.map((p) => ({ id: p.id, name: p.name, typeLabel: '平台客户', level: '—', contactPerson: p.contactPerson, contactPhone: p.contactPhone, contactAddress: p.contactAddress })),
  ], []);

  /** 经平台销售的终端客户（有经平台标记的客户，携带真实客户类型标签） */
  const viaCustomerOptions: CustomerOption[] = useMemo(
    () => customerItems.filter((c) => c.viaPlatform).map((c) => ({ id: c.id, name: c.name, typeLabel: CUSTOMER_TYPE_LABELS[c.type], level: c.level || '—', contactPerson: c.contactPerson, contactPhone: c.contactPhone, contactAddress: c.contactAddress || c.region })),
    [],
  );
  /** 经平台销售下的客户类型选项：来源于有经平台销售客户的客户类型去重 */
  const VIA_TYPES = useMemo(
    () => [...new Set(viaCustomerOptions.map((c) => c.typeLabel))],
    [viaCustomerOptions],
  );

  /** 客户名称下拉：按当前所选客户类型过滤（直接销售=全部在库客户；经平台销售=有经平台标记的客户） */
  const searchPool = useMemo(
    () => (isVia ? viaCustomerOptions : customerOptions).filter((c) => c.typeLabel === customerType),
    [isVia, viaCustomerOptions, customerOptions, customerType],
  );

  const matchedCustomer = matchedCustomerId ? searchPool.find((c) => c.id === matchedCustomerId) ?? customerOptions.find((c) => c.id === matchedCustomerId) ?? null : null;
  /** 客户下拉列表：点击展开全部在库客户，输入即过滤（可手输搜索） */
  const customerSuggestions = useMemo(() => {
    const kw = customerSearch.trim();
    const list = kw ? searchPool.filter((c) => c.name.includes(kw)) : searchPool;
    return list.slice(0, 50);
  }, [customerSearch, searchPool]);

  const selectedPlatformCustomer = platformItems.find((p) => p.id === platformCustomerId) ?? null;

  /**
   * 销售报价（统一概念，直接销售/经平台销售均取客户维度报价）：
   * 取该客户有效报价（单品价>品牌折扣）；个人客户不提前报价。
   */
  const quoteOf = (productId: string): number | undefined => {
    if (!matchedCustomerId) return undefined;
    const cust = customerItems.find((c) => c.id === matchedCustomerId);
    if (cust?.type === 'personal') return undefined;
    return effectiveCustomerQuote(customerQuotes, matchedCustomerId, productId, products);
  };

  /** 经平台订单的销平台实价 = 销售实价 ×(1−扣点)；扣点取客户在所选平台配置的扣点 */
  const platformNetOf = (salesPrice: number): number | undefined => {
    if (!isVia || !platformCustomerId || !matchedCustomerId) return undefined;
    const cust = customerItems.find((c) => c.id === matchedCustomerId);
    const rate = cust?.platformCommissionRates?.[platformCustomerId] ?? '0%';
    return calcPlatformNetPrice(salesPrice, rate);
  };

  const defaultPriceOf = (productId: string): number => {
    const p = products.find((x) => x.id === productId);
    if (!p) return 0;
    // 默认销售实价 = 该客户销售报价 > VIP/销售默认价 > 销售价
    const q = quoteOf(productId);
    if (q !== undefined) return q;
    if (matchedCustomer) {
      const cust = customerItems.find((c) => c.id === matchedCustomer.id);
      if (cust) return getSalesDefaultPrice(p.id, cust.id).price;
    }
    return p.salesPrice;
  };

  /** 添加商品（已添加的不可重复添加） */
  /** 点击商品卡片：未添加→加入明细；已添加→从明细删除 */
  const toggleProduct = (productId: string) => {
    if (items.some((it) => it.productId === productId)) {
      removeProduct(productId);
      return;
    }
    addProduct(productId);
  };

  const addProduct = (productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p || items.some((it) => it.productId === productId)) return;
    setItems((prev) => [...prev, { productId: p.id, productName: p.name, spec: p.spec, quantity: 1, price: defaultPriceOf(p.id) }]);
  };

  const removeProduct = (productId: string) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  const minPriceWarning = (it: ExternalOrderItem): string => {
    if (!matchedCustomer) return '';
    const cust = customerItems.find((c) => c.id === matchedCustomer!.id);
    if (!cust || cust.type !== 'personal') return '';
    const min = getPersonalMinPrice(it.productId, cust.level || 'C级');
    if (min > 0 && it.price < min) return `低于该客户等级（${cust.level}）最低价 ${money(min)}`;
    return '';
  };

  const entryTotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const hasMinPriceWarning = items.some((it) => minPriceWarning(it));

  /** 商品所属一级分类（兼容两类数据：茶叶 categories=["绿茶-西湖龙井"] 一段式、非茶 ["茶具","茶壶","紫砂壶"] 三段式） */
const L1_OF_L2: Record<string, string> = {
  '绿茶': '茶叶', '红茶': '茶叶', '青茶': '茶叶', '白茶': '茶叶', '黄茶': '茶叶', '黑茶': '茶叶', '花草茶': '茶叶',
  '茶壶': '茶具', '茶杯': '茶具', '茶盘茶台': '茶具', '茶道配件': '茶具',
  '茶食品': '茶周边', '礼盒套装': '茶周边', '茶叶罐/包装': '茶周边',
  '泡茶水': '其他', '茶书茶画': '其他', '茶香/香道': '其他',
};
const l1OfProduct = (p: { category: string; categories?: string[] }): string =>
  L1_OF_L2[p.category.split('-')[0]] ?? p.categories?.[0] ?? '';

/** 商品选择列表：一级分类 + 品牌 + 名称过滤(仅上架商品;报品与否不影响销售开单可选商品) */
  const pickerProducts = useMemo(() => {
    const kw = itemSearch.trim();
    return products.filter((p) => p.shelfStatus === 'on' && (!itemCategory || l1OfProduct(p) === itemCategory) && (!itemBrand || p.brand === itemBrand) && (!kw || p.name.includes(kw)));
  }, [products, itemCategory, itemBrand, itemSearch]);
  const pickerTotalPages = Math.max(1, Math.ceil(pickerProducts.length / PICKER_PAGE_SIZE));
  const pagedPickerProducts = pickerProducts.slice((pickerPage - 1) * PICKER_PAGE_SIZE, pickerPage * PICKER_PAGE_SIZE);
  useEffect(() => { setPickerPage(1); }, [itemCategory, itemBrand, itemSearch]);
  /** 品牌下拉选项：联动所选分类（全部品牌=全部商品的品牌；选了分类=该分类下的品牌） */
  const pickerBrands = useMemo(
    () => [...new Set(products.filter((p) => p.shelfStatus === 'on' && (!itemCategory || l1OfProduct(p) === itemCategory)).map((p) => p.brand))],
    [products, itemCategory],
  );

  const selectCustomer = (c: CustomerOption) => {
    setMatchedCustomerId(c.id);
    setCustomerSearch(c.name);
    setCustomerType(c.typeLabel);
    // 展示客户联系人和联系电话作为参考，但不自动填入收货信息（收货人/收货电话按实际收货方手动输入）
  };

  const changeCustomerType = (t: string) => {
    setCustomerType(t);
    setCustomerSearch(''); setMatchedCustomerId('');
    setError('');
  };

  const switchPath = (path: 'direct' | 'via_platform') => {
    // 切换路径后类型不在可用选项中时重置为首项
    const pool = path === 'via_platform' ? [...new Set(customerItems.filter((c) => c.viaPlatform).map((c) => CUSTOMER_TYPE_LABELS[c.type]))] : DIRECT_TYPES;
    setCustomerType((t) => (pool.includes(t) ? t : pool[0] ?? t));
    setSalesPath(path);
    setPlatformCustomerId('');
    setExternalOrderNo('');
    setCustomerSearch(''); setMatchedCustomerId('');
    setCustomerType('直营客户');
    setError('');
  };

  const resetForm = () => {
    setPlatformCustomerId(''); setExternalOrderNo(''); setCustomerOrderNo('');
    setCustomerOrderTime(nowLocal());
    setCustomerSearch(''); setMatchedCustomerId(''); setRegionProv(''); setRegionCity(''); setRegionDist('');
    setReceiver(''); setReceiverPhone(''); setReceiverAddress(''); setRemark(''); setItems([]); setError('');
  };

  const saveOrder = () => {
    if (isVia && (!externalOrderNo.trim() || !platformCustomerId)) {
      setError('经平台销售：来源平台（平台客户）、平台订单号为必填');
      return;
    }
    if (!customerSearch.trim() || !regionProv.trim() || !receiver.trim() || !receiverPhone.trim()) {
      setError('客户名称、客户区域（省份）、收货人、收货电话为必填');
      return;
    }
    if (items.length === 0 || items.some((it) => it.quantity <= 0)) {
      setError('请至少录入一条商品行，且数量大于 0');
      return;
    }
    if (hasMinPriceWarning) {
      setError('存在低于客户等级最低价的销售实价，请调整后再保存');
      return;
    }
    const order = store.getState().addExternalOrder({
      salesPath,
      externalOrderNo: isVia ? externalOrderNo.trim() : undefined,
      platformCustomerId: isVia ? platformCustomerId : undefined,
      platformCustomerName: isVia ? (selectedPlatformCustomer?.name ?? '') : undefined,
      // 订单价格快照规则：平台扣点下单即固化（销平台报价/实价随单不再随档案扣点调整变化）
      platformRateSnapshot: isVia ? customerPlatformRate(customerSearch.trim(), platformCustomerId) : undefined,
      customerOrderTime: customerOrderTime || undefined,
      customerOrderNo: customerOrderNo.trim() || undefined,
      // 客户档案关联：按名称精确匹配档案时回填编号（销售单按客户编号关联客户）
      customerId: customerItems.find((c) => c.name === customerSearch.trim())?.id,
      customerCode: customerItems.find((c) => c.name === customerSearch.trim())?.customerCode,
      customerName: customerSearch.trim(),
      customerType,
      customerRegion: [regionProv, regionCity, regionDist].filter(Boolean).join(''),
      items,
      receiver: receiver.trim(),
      receiverPhone: receiverPhone.trim() || '—',
      receiverAddress: receiverAddress.trim() || '—',
      remark: remark.trim() || undefined,
      operator: '运营人员',
      sourceChannel: 'manual',
    });
    resetForm();
    setCreatedOrder(order);
  };

  const label = (text: string, required?: boolean) => (
    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>
      {text}{required && <span style={{ color: '#CB405D', marginLeft: 2 }}>*</span>}
    </label>
  );

  /* ── 创建成功弹窗：展示销售单编号与关键信息，可直接去分发 ── */
  const createdSummary: { label: string; value: ReactNode; mono?: boolean; span?: boolean }[] = createdOrder ? [
    { label: '客户名称', value: createdOrder.customerName },
    { label: '客户类型', value: createdOrder.customerType },
    { label: '销售路径', value: createdOrder.salesPath === 'via_platform' ? '经平台销售' : '直接销售' },
    { label: '订单金额', value: money(createdOrder.totalAmount), mono: true },
    { label: '商品种数', value: `${createdOrder.items.length} 种` },
    { label: '下单时间', value: createdOrder.entryTime, mono: true },
    { label: '收货人', value: createdOrder.receiver },
    { label: '收货电话', value: createdOrder.receiverPhone, mono: true },
    ...(createdOrder.externalOrderNo ? [{ label: '平台订单号', value: createdOrder.externalOrderNo, mono: true }] : []),
    ...(createdOrder.customerOrderNo ? [{ label: '客户侧单号', value: createdOrder.customerOrderNo, mono: true }] : []),
    { label: '收货地址', value: createdOrder.receiverAddress, span: true },
  ] : [];

  /** 表单最低宽度：宽度不足时整体横向滚动（经平台销售多一列「销平台实价」） */
  const formMinWidth = isVia ? 1140 : 1020;

  /** 表单主体：独立页面与销售单列表弹窗共用 */
  const formContent = (
    <>
      <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
        新建销售单用于创建<strong>手工录入</strong>类型的销售订单（三个入口：<strong>本页手工录入</strong> / <strong>平台直连推送</strong> / <strong>报备商机转入</strong>）。
        首先选择<strong>销售路径</strong>：直接销售（直营 / 渠道 / 平台 / 个人客户）或经平台销售（淡茶 → 平台客户 → 直营客户）；
        保存后进入「销售单处理」；订单进入不自动匹配报备，如需报备转派请在分发弹窗中人工匹配。
      </div>

        <Card title="订单信息">
          {/* 销售路径选择 */}
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>销售路径 *</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <button
              className="tab-card-simple eop-mode-card"
              style={{
                flexDirection: 'column', alignItems: 'flex-start', gap: 3, textAlign: 'left', padding: 'var(--space-3) var(--space-4)', transition: 'none',
                ...(salesPath === 'direct' ? { borderColor: 'var(--color-module-current-base)', background: 'var(--color-module-current-lightest)' } : {}),
              }}
              onClick={() => switchPath('direct')}
            >
              <strong style={salesPath === 'direct' ? { color: 'var(--color-module-current-base)' } : undefined}>直接销售</strong>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', whiteSpace: 'normal', lineHeight: 1.5 }}>
                淡茶半盏直接销售给：直营客户 / 渠道客户 / 平台客户 / 个人客户
              </span>
            </button>
            <button
              className="tab-card-simple eop-mode-card"
              style={{
                flexDirection: 'column', alignItems: 'flex-start', gap: 3, textAlign: 'left', padding: 'var(--space-3) var(--space-4)', transition: 'none',
                ...(isVia ? { borderColor: 'var(--color-module-current-base)', background: 'var(--color-module-current-lightest)' } : {}),
              }}
              onClick={() => switchPath('via_platform')}
            >
              <strong style={isVia ? { color: 'var(--color-module-current-base)' } : undefined}>经平台销售</strong>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', whiteSpace: 'normal', lineHeight: 1.5 }}>
                淡茶半盏销售经平台客户销售给直营客户（来源平台即平台客户）
              </span>
            </button>
          </div>

          {/* 经平台销售:来源平台（下拉取自全部平台客户）/ 平台订单号 */}
          {isVia && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
              <div>
                {label('来源平台（平台客户）', true)}
                <select className="filter-input" value={platformCustomerId} onChange={(e) => { setPlatformCustomerId(e.target.value); setError(''); }} style={{ width: '100%' }}>
                  <option value="">选择平台客户</option>
                  {platformItems.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                {label('平台订单号', true)}
                <input className="filter-input" placeholder="平台给淡茶半盏的订单号" value={externalOrderNo} onChange={(e) => { setExternalOrderNo(e.target.value); setError(''); }} style={{ width: '100%' }} />
              </div>
            </div>
          )}

          {/* 客户类型 + 客户名称 同一行 */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div style={{ width: 190, flexShrink: 0 }}>
              {label('客户类型', true)}
              <select className="filter-input" value={customerType} onChange={(e) => changeCustomerType(e.target.value)} style={{ width: '100%' }}>
                {(isVia ? VIA_TYPES : DIRECT_TYPES).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex: 1.4, minWidth: 0, position: 'relative' }}>
            {label('客户名称', true)}
            <div style={{ position: 'relative' }}>
              <input
                className="filter-input" placeholder={isVia ? '点击选择经平台客户，或输入名称搜索' : '点击选择客户，或输入名称搜索'} style={{ width: '100%', paddingRight: 56 }}
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setMatchedCustomerId(''); setError(''); setCustDropOpen(true); }}
                onFocus={() => setCustDropOpen(true)} onClick={() => setCustDropOpen(true)}
                onBlur={() => { window.setTimeout(() => setCustDropOpen(false), 150); }}
              />
              {/* 清除已选 */}
              {matchedCustomer && (
                <button
                  type="button" title="清除已选客户"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setMatchedCustomerId(''); setCustomerSearch(''); }}
                  style={{ position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-neutral-400)', fontSize: 15, lineHeight: 1, padding: 0 }}
                >×</button>
              )}
              {/* 下拉箭头 */}
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: `translateY(-50%) rotate(${custDropOpen ? 180 : 0}deg)`, transition: 'transform .15s', pointerEvents: 'none', color: 'var(--color-neutral-400)' }}>
                <svg viewBox="0 0 16 16" fill="none" style={{ width: 13, height: 13 }}><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              {/* 下拉列表：全部在库客户（输入过滤），滚动选择 */}
              {custDropOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, maxHeight: 260, overflowY: 'auto', background: '#fff', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)', zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <div style={{ padding: '6px 12px', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', borderBottom: '1px solid var(--color-neutral-100)', position: 'sticky', top: 0, background: '#fff' }}>
                    {isVia ? '在库经平台客户' : '在库客户'} 共 {searchPool.length} 家{customerSearch.trim() ? ` · 匹配 ${customerSuggestions.length} 家` : ''}
                  </div>
                  {customerSuggestions.length === 0 && (
                    <div style={{ padding: '12px', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)', textAlign: 'center' }}>未找到匹配客户（可换关键词或直接使用该名称）</div>
                  )}
                  {customerSuggestions.map((c) => (
                    <div
                      key={c.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { selectCustomer(c); setCustDropOpen(false); }}
                      style={{
                        padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 12,
                        background: matchedCustomer?.id === c.id ? 'var(--color-module-current-lightest)' : undefined,
                      }}
                      onMouseEnter={(e) => { if (matchedCustomer?.id !== c.id) e.currentTarget.style.background = 'var(--color-neutral-50)'; }}
                      onMouseLeave={(e) => { if (matchedCustomer?.id !== c.id) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span>{c.name}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>{c.typeLabel} · {c.level}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {matchedCustomer && (
              <div style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                <span>联系人：{matchedCustomer.contactPerson || '—'}{matchedCustomer.contactPhone ? `（${matchedCustomer.contactPhone}）` : ''}</span>
                <span>等级：{matchedCustomer.level}</span>
              </div>
            )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {label('客户侧订单号')}
              <input className="filter-input" placeholder="客户侧订单号" value={customerOrderNo} onChange={(e) => setCustomerOrderNo(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {label('客户下单时间')}
              <input className="filter-input" type="datetime-local" value={customerOrderTime} onChange={(e) => setCustomerOrderTime(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>

          {/* 收货人 / 收货电话（客户名称下一行；收货电话必输） */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div>
              {label('收货人', true)}
              <input className="filter-input" placeholder="收货人姓名" value={receiver} onChange={(e) => { setReceiver(e.target.value); setError(''); }} style={{ width: '100%' }} />
            </div>
            <div>
              {label('收货电话', true)}
              <input className="filter-input" placeholder="收货电话" value={receiverPhone} onChange={(e) => { setReceiverPhone(e.target.value); setError(''); }} style={{ width: '100%' }} />
            </div>
          </div>

          {/* 收货地址（字段名样式同收货人）：三联下拉 + 详细地址 同一行 */}
          <div style={{ marginBottom: 'var(--space-3)' }}>
            {label('收货地址', true)}
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <select className="filter-input" value={regionProv} onChange={(e) => { setRegionProv(e.target.value); setRegionCity(''); setRegionDist(''); setError(''); }} style={{ width: 100, flexShrink: 0 }} title="省份">
                <option value="">省份</option>
                {PROVINCE_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select className="filter-input" disabled={!regionProv} value={regionCity} onChange={(e) => { setRegionCity(e.target.value); setRegionDist(''); setError(''); }} style={{ width: 100, flexShrink: 0 }} title="地市">
                <option value="">地市</option>
                {regionProv && getCityNames(regionProv).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="filter-input" disabled={!regionCity} value={regionDist} onChange={(e) => { setRegionDist(e.target.value); setError(''); }} style={{ width: 100, flexShrink: 0 }} title="区县">
                <option value="">区县</option>
                {regionProv && regionCity && getDistricts(regionProv, regionCity).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <input className="filter-input" placeholder="详细地址（街道、门牌号）" value={receiverAddress} onChange={(e) => { setReceiverAddress(e.target.value); setError(''); }} style={{ flex: 1, minWidth: 0 }} />
            </div>
          </div>

          {/* 备注（多行） */}
          <div>
            {label('备注')}
            <textarea
              className="filter-input" placeholder="订单备注（平台要求、客户要求等）"
              value={remark} onChange={(e) => setRemark(e.target.value)}
              style={{ width: '100%', minHeight: 64, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
            />
          </div>
        </Card>

        <Card title="商品明细" style={{ marginTop: 'var(--space-4)' }}>
          {/* 添加商品：品牌筛选 + 名称搜索 → 商品卡片（首图），点击即添加 */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>添加商品：</span>
            <select className="filter-select" value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} style={{ width: 130 }} title="按一级分类筛选">
              <option value="">全部分类</option>
              {Object.values(productCategoryLabels).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="filter-select" value={itemBrand} onChange={(e) => setItemBrand(e.target.value)} style={{ width: 160 }}>
              <option value="">全部品牌</option>
              {pickerBrands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <input className="filter-input" placeholder="搜索商品名称..." value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} style={{ width: 200 }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>共 {pickerProducts.length} 款</span>
          </div>
          {pickerProducts.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', padding: 2 }}>
              {pagedPickerProducts.map((p) => {
                const added = items.some((it) => it.productId === p.id);
                const img = p.mainImages?.[0];
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    title={added ? '已添加，点击从明细中删除' : '点击添加到订单'}
                    style={{
                      display: 'flex', gap: 10, alignItems: 'center', textAlign: 'left', cursor: 'pointer',
                      padding: 8, borderRadius: 'var(--radius-md)', border: `1px solid ${added ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
                      background: added ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
                    }}
                  >
                    {img ? (
                      <img src={img} alt={p.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0, border: '1px solid var(--color-neutral-100)' }} />
                    ) : (
                      <span style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--color-neutral-100)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--color-neutral-400)' }}>无图</span>
                    )}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                      <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.brand} · {p.spec}</span>
                      <span className="mono" style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-module-current-base)' }}>{money(defaultPriceOf(p.id))}{added ? ' · 已添加' : ''}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {pickerTotalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <button type="button" disabled={pickerPage <= 1} onClick={() => setPickerPage(pickerPage - 1)}
                style={{ minWidth: 26, height: 26, borderRadius: 6, cursor: pickerPage <= 1 ? 'not-allowed' : 'pointer', border: '1px solid var(--color-neutral-200)', background: 'var(--color-neutral-0)', color: 'var(--color-neutral-600)', fontSize: 12, padding: '0 8px', opacity: pickerPage <= 1 ? 0.5 : 1 }}>上一页</button>
              {Array.from({ length: pickerTotalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" onClick={() => setPickerPage(n)}
                  style={{
                    minWidth: 26, height: 26, padding: '0 6px', borderRadius: 6, cursor: 'pointer',
                    border: `1px solid ${pickerPage === n ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
                    background: pickerPage === n ? 'var(--color-module-current-base)' : 'var(--color-neutral-0)',
                    color: pickerPage === n ? '#fff' : 'var(--color-neutral-600)',
                    fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-family-mono)',
                  }}>{n}</button>
              ))}
              <button type="button" disabled={pickerPage >= pickerTotalPages} onClick={() => setPickerPage(pickerPage + 1)}
                style={{ minWidth: 26, height: 26, borderRadius: 6, cursor: pickerPage >= pickerTotalPages ? 'not-allowed' : 'pointer', border: '1px solid var(--color-neutral-200)', background: 'var(--color-neutral-0)', color: 'var(--color-neutral-600)', fontSize: 12, padding: '0 8px', opacity: pickerPage >= pickerTotalPages ? 0.5 : 1 }}>下一页</button>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginLeft: 8 }}>共 {pickerProducts.length} 款 · 第 {pickerPage} / {pickerTotalPages} 页</span>
            </div>
          )}
          {/* 已选商品列表：列宽按容器压缩，不再出现左右滚动条 */}
          <table className="detail-inline-table order-entry-items" style={{ tableLayout: 'fixed' }}>
              <thead><tr><th style={{ width: 46 }}>序号</th><th style={{ width: 50 }}>图片</th><th>商品名称</th><th style={{ width: 72 }}>品牌</th><th style={{ width: 72 }}>规格</th><th style={{ width: 92 }}>市场价</th><th style={{ width: 90 }}>销售报价</th><th style={{ width: 68 }}>数量</th><th style={{ width: 90 }}>销售实价</th>{isVia && <th style={{ width: 90 }}>销平台实价</th>}<th style={{ width: 88, textAlign: 'right' }}>小计</th><th style={{ width: 58 }} /></tr></thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={isVia ? 10 : 9} style={{ textAlign: 'center', color: 'var(--color-neutral-400)', padding: 'var(--space-3)' }}>尚未添加商品，点击上方商品卡片即可添加（可按品牌筛选或搜索）</td></tr>
                )}
                {items.map((it, idx) => {
                  const warn = minPriceWarning(it);
                  const p = products.find((x) => x.id === it.productId);
                  const img = p?.mainImages?.[0];
                  return (
                    <tr key={it.productId}>
                      <td className="mono" style={{ color: 'var(--color-neutral-400)' }}>{idx + 1}</td>
                      <td>{img ? <img src={img} alt={it.productName} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-100)' }} /> : <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--color-neutral-100)', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--color-neutral-400)' }}>无图</span>}</td>
                      <td>
                        <div style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</div>
                        {warn && <div style={{ fontSize: 'var(--text-xs)', color: '#CB405D' }}>⚠ {warn}</div>}
                      </td>
                      <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p?.brand ?? ''}>{p?.brand ?? '—'}</td>
                      <td style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={it.spec}>{it.spec}</td>
                      <td>
                        <div className="mono" style={{ fontSize: 'var(--text-sm)' }}>{p ? money(p.marketPrice) : '—'}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`京东价：${p?.jdPrice ?? '—'} / 天猫价：${p?.tmallPrice ?? '—'}`}>京东 {p?.jdPrice ?? '—'} / 天猫 {p?.tmallPrice ?? '—'}</div>
                      </td>
                      <td>
                        {(() => {
                          const q = quoteOf(it.productId);
                          return q !== undefined
                            ? <span className="mono" style={{ color: 'var(--color-module-current-base)', fontWeight: 'var(--font-semibold)' }}>{money(q)}</span>
                            : <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>—（未配置报价）</span>;
                        })()}
                      </td>
                      <td><input className="filter-input mono" type="number" min={1} value={it.quantity} onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value) } : x)))} style={{ width: '100%', boxSizing: 'border-box' }} /></td>
                      <td><input className="filter-input mono" type="number" min={0} value={it.price} onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, price: Number(e.target.value) } : x)))} style={{ width: '100%', boxSizing: 'border-box', borderColor: warn ? '#CB405D' : undefined }} /></td>
                      {isVia && (() => {
                        const pn = platformNetOf(it.price);
                        return (
                          <td>
                            {pn !== undefined
                              ? <span className="mono" style={{ color: '#CB405D', fontWeight: 'var(--font-semibold)' }}>{money(pn)}</span>
                              : <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>选择平台和客户后计算</span>}
                          </td>
                        );
                      })()}
                      <td className="mono" style={{ textAlign: 'right', fontWeight: 'var(--font-medium)' }}>{money(it.price * it.quantity)}</td>
                      <td><Button size="sm" variant="ghost" onClick={() => removeProduct(it.productId)}>删除</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          <div style={{ fontSize: 'var(--text-sm)', textAlign: 'right', borderTop: '1px solid var(--color-neutral-100)', paddingTop: 'var(--space-3)' }}>
            合计：<strong className="mono" style={{ color: 'var(--color-module-current-base)', fontSize: 'var(--text-md)' }}>{money(entryTotal)}</strong>
          </div>
        </Card>
    </>
  );

  /** 底部操作栏：与分发弹窗一致（左侧信息、右侧按钮），贴在弹窗最下方（非悬浮） */
  const formFooter = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        padding: embedded ? 'var(--space-3) var(--space-6)' : 'var(--space-4) 0',
        borderTop: '1px solid var(--color-neutral-100)',
        background: 'var(--color-neutral-0)',
        flexShrink: 0,
      }}
    >
      <span style={{ flex: 1, minWidth: 0, fontSize: 'var(--text-sm)', color: '#C62828' }}>{error}</span>
      <span style={{ display: 'flex', gap: 'var(--space-3)', flexShrink: 0 }}>
        {embedded && onClose && <Button variant="ghost" onClick={onClose}>关闭</Button>}
        <Button variant="ghost" className="btn-secondary-fill" onClick={resetForm}>重置</Button>
        <Button onClick={saveOrder}>创建订单</Button>
      </span>
    </div>
  );

  return (
    <>
      {embedded ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          {/* 中间内容整体横向滚动：宽度不足时保持表单最低宽度并出现底部横向滚动条 */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 'var(--space-5) var(--space-6)' }}>
            <div style={{ minWidth: formMinWidth }}>{formContent}</div>
          </div>
          {formFooter}
        </div>
      ) : (
        <>
          <ContentHeader title="新建销售单" breadcrumbs={['销售', '销售单管理', '新建销售单']} />
          <div className="content-body" style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: formMinWidth }}>{formContent}{formFooter}</div>
          </div>
        </>
      )}

      {/* ── 创建成功弹窗（不跳页，留在当前页） ── */}
      {createdOrder && (
        <div className="category-dialog-overlay" onClick={() => setCreatedOrder(null)}>
          <div className="category-dialog" style={{ width: 560, padding: 0, overflowX: 'hidden', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-7) var(--space-6) var(--space-5)' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', background: 'var(--color-module-current-lightest)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-3)',
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-module-current-base)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>销售单创建成功</div>
              <div className="mono" style={{ fontSize: 21, fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)', marginTop: 'var(--space-2)', letterSpacing: '0.02em' }}>
                {createdOrder.code}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginTop: 'var(--space-2)', textAlign: 'center', lineHeight: 1.7 }}>
                已进入「销售单处理」，送去分发后生成履约单并进入「履约单分发-待分发」
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-neutral-200)', padding: 'var(--space-5) var(--space-6)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-4) var(--space-5)' }}>
                {createdSummary.map((f) => (
                  <div key={f.label} style={{ gridColumn: f.span ? '1 / -1' : undefined, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 3 }}>{f.label}</div>
                    <div className={f.mono ? 'mono' : undefined} style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', wordBreak: 'break-all' }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', padding: 'var(--space-4) var(--space-6) var(--space-5)' }}>
              <Button variant="ghost" onClick={() => setCreatedOrder(null)}>继续新建</Button>
              {embedded && onClose && (
                <Button variant="ghost" onClick={() => { setCreatedOrder(null); onClose(); }}>完成</Button>
              )}
              <Button onClick={() => { setCreatedOrder(null); onClose?.(); navigate('/sales/sales-order-processing'); }}>去销售单处理</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
