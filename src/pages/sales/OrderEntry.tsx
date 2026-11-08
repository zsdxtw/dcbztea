import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePriceStore, effectiveCustomerQuote, effectivePlatformQuote } from '../../stores/priceStore';
import { calcPlatformNetPrice } from '../../data/prices';
import { customerItems, CUSTOMER_TYPE_LABELS } from '../../data/customers';
import { platformItems } from '../../data/platforms';
import { getSalesDefaultPrice, getPersonalMinPrice } from '../../data/prices';
import { PROVINCE_NAMES, getCityNames, getDistricts } from '../../data/regions';
import type { ExternalOrderItem } from '../../types';

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
 * 客户匹配带出类型/联系人/默认价，保存即匹配报备。
 */
export default function OrderEntry() {
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
  const [itemSearch, setItemSearch] = useState('');
  const [savedTip, setSavedTip] = useState('');

  const isVia = salesPath === 'via_platform';

  /** 全部客户(直接销售选择用) */
  const customerOptions: CustomerOption[] = useMemo(() => [
    ...customerItems.map((c) => ({ id: c.id, name: c.name, typeLabel: CUSTOMER_TYPE_LABELS[c.type], level: c.level || '—', contactPerson: c.contactPerson, contactPhone: c.contactPhone, contactAddress: c.contactAddress || c.region })),
    ...platformItems.map((p) => ({ id: p.id, name: p.name, typeLabel: '平台客户', level: '—', contactPerson: p.contactPerson, contactPhone: p.contactPhone, contactAddress: p.contactAddress })),
  ], []);

  /** 终端直营客户(经平台销售的终端客户选择用) */
  const directCustomerOptions: CustomerOption[] = useMemo(
    () => customerItems.filter((c) => c.type === 'direct').map((c) => ({ id: c.id, name: c.name, typeLabel: '直营客户', level: c.level || '—', contactPerson: c.contactPerson, contactPhone: c.contactPhone, contactAddress: c.contactAddress || c.region })),
    [],
  );

  /** 客户名称下拉:直接销售仅展示当前所选客户类型的客户;经平台销售仅展示直营客户 */
  const searchPool = useMemo(
    () => (isVia ? directCustomerOptions : customerOptions.filter((c) => c.typeLabel === customerType)),
    [isVia, directCustomerOptions, customerOptions, customerType],
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
   * 销售报价取值（价格体系第三层，来自报品报（调）价）：
   * 个人客户不提前报价；经平台单取所选平台客户的「经平台报价」（自动=客户报价×(1−扣点)）；其余取该客户有效报价（单品价>品牌折扣）。
   */
  const quoteOf = (productId: string): number | undefined => {
    if (!matchedCustomerId) return undefined;
    const cust = customerItems.find((c) => c.id === matchedCustomerId);
    if (cust?.type === 'personal') return undefined;
    if (isVia) {
      if (!platformCustomerId) return undefined;
      const rate = cust?.platformCommissionRates?.[platformCustomerId] ?? '0%';
      return effectivePlatformQuote(customerQuotes, matchedCustomerId, productId, platformCustomerId, products, rate);
    }
    return effectiveCustomerQuote(customerQuotes, matchedCustomerId, productId, products);
  };

  /** 经平台订单的销售给平台价 = 销售实价 ×(1−扣点)；扣点取客户在所选平台配置的扣点 */
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

  /** 商品选择列表：品牌 + 名称过滤(仅上架商品;报品与否不影响销售开单可选商品) */
  const pickerProducts = useMemo(() => {
    const kw = itemSearch.trim();
    return products.filter((p) => p.shelfStatus === 'on' && (!itemBrand || p.brand === itemBrand) && (!kw || p.name.includes(kw))).slice(0, 24);
  }, [products, itemBrand, itemSearch]);

  const selectCustomer = (c: CustomerOption) => {
    setMatchedCustomerId(c.id);
    setCustomerSearch(c.name);
    if (!isVia) setCustomerType(c.typeLabel);
    if (c.contactPerson && !receiver) setReceiver(c.contactPerson);
    if (c.contactPhone && !receiverPhone) setReceiverPhone(c.contactPhone);
  };

  const changeCustomerType = (t: string) => {
    setCustomerType(t);
    setCustomerSearch(''); setMatchedCustomerId('');
    setError('');
  };

  const switchPath = (path: 'direct' | 'via_platform') => {
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
      setError('客户名称、客户区域（省份）、收货人、联系电话为必填');
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
      customerOrderTime: customerOrderTime || undefined,
      customerOrderNo: customerOrderNo.trim() || undefined,
      customerName: customerSearch.trim(),
      customerType: isVia ? '直营客户' : customerType,
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
    setSavedTip(order.processStatus === 'report_match_pending'
      ? `销售单 ${order.code} 已保存并命中报备，进入「报备-匹配待确认」，3 秒后跳转销售单分发…`
      : `销售单 ${order.code} 已保存，进入「分发-待处理」，3 秒后跳转销售单分发…`);
    setTimeout(() => { setSavedTip(''); navigate('/sales/order-distribute'); }, 3000);
  };

  const label = (text: string, required?: boolean) => (
    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>
      {text}{required && <span style={{ color: '#CB405D', marginLeft: 2 }}>*</span>}
    </label>
  );

  return (
    <>
      <ContentHeader title="新建销售单" breadcrumbs={['销售', '销售单管理', '新建销售单']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          新建销售单用于创建<strong>手工录入</strong>类型的销售订单（三个入口：<strong>本页手工录入</strong> / <strong>平台直连推送</strong> / <strong>报备商机转入</strong>）。
          首先选择<strong>销售路径</strong>：直接销售（直营 / 渠道 / 平台 / 个人客户）或经平台销售（淡茶 → 平台客户 → 直营客户）；
          保存时自动与审批通过的报备比对，命中则进入「报备-匹配待确认」，人工确认后转派报备合作商。
        </div>

        {savedTip && (
          <div style={{ padding: '10px 14px', background: '#E8F5E9', color: '#01795D', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{savedTip}</div>
        )}

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

          {/* 客户类型(仅直接销售)+ 客户侧订单号 + 客户下单时间 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            {!isVia && (
              <div>
                {label('客户类型', true)}
                <select className="filter-input" value={customerType} onChange={(e) => changeCustomerType(e.target.value)} style={{ width: '100%' }}>
                  {DIRECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
            <div>
              {label('客户侧订单号（客户下单渠道的单号，非必输）')}
              <input className="filter-input" placeholder="客户侧订单号" value={customerOrderNo} onChange={(e) => setCustomerOrderNo(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              {label('客户下单时间')}
              <input className="filter-input" type="datetime-local" value={customerOrderTime} onChange={(e) => setCustomerOrderTime(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>

          {/* 客户名称(直接销售=各类型客户;经平台销售=终端直营客户)：可搜索下拉（点击展开全部在库客户，输入即过滤） */}
          <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
            {label('客户名称（经平台销售为终端直营客户；下拉选择在库客户，可输入搜索）', true)}
            <div style={{ position: 'relative' }}>
              <input
                className="filter-input" placeholder={isVia ? '点击选择终端直营客户，或输入名称搜索' : '点击选择客户，或输入名称搜索'} style={{ width: '100%', paddingRight: 56 }}
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
                  onClick={() => { setMatchedCustomerId(''); setCustomerSearch(''); setCustomerType(isVia ? '直营客户' : customerType); }}
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
                    {isVia ? '在库直营客户' : '在库客户'} 共 {searchPool.length} 家{customerSearch.trim() ? ` · 匹配 ${customerSuggestions.length} 家` : ''}
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
                <span>✓ 已匹配在库客户</span>
                <span>联系人：{matchedCustomer.contactPerson}</span>
                <span>等级：{matchedCustomer.level}</span>
              </div>
            )}
          </div>

          {/* 收货人 / 联系电话（客户名称下一行；联系电话必输） */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div>
              {label('收货人', true)}
              <input className="filter-input" placeholder="收货人姓名" value={receiver} onChange={(e) => { setReceiver(e.target.value); setError(''); }} style={{ width: '100%' }} />
            </div>
            <div>
              {label('联系电话', true)}
              <input className="filter-input" placeholder="联系电话" value={receiverPhone} onChange={(e) => { setReceiverPhone(e.target.value); setError(''); }} style={{ width: '100%' }} />
            </div>
          </div>

          {/* 收货地址：省 / 地市 / 区县 三级联动（参照合作商注册）+ 详细地址（灰只读省市区框在前） */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', alignItems: 'end' }}>
            <div style={{ paddingBottom: 8 }}>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--color-module-current-lightest)', color: 'var(--color-module-current-base)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', whiteSpace: 'nowrap' }}>收货地址</span>
            </div>
            <div>
              {label('省份', true)}
              <select className="filter-input" value={regionProv} onChange={(e) => { setRegionProv(e.target.value); setRegionCity(''); setRegionDist(''); setError(''); }} style={{ width: '100%' }}>
                <option value="">请选择</option>
                {PROVINCE_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              {label('地市', true)}
              <select className="filter-input" disabled={!regionProv} value={regionCity} onChange={(e) => { setRegionCity(e.target.value); setRegionDist(''); setError(''); }} style={{ width: '100%' }}>
                <option value="">请选择</option>
                {regionProv && getCityNames(regionProv).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              {label('区县', true)}
              <select className="filter-input" disabled={!regionCity} value={regionDist} onChange={(e) => { setRegionDist(e.target.value); setError(''); }} style={{ width: '100%' }}>
                <option value="">请选择</option>
                {regionProv && regionCity && getDistricts(regionProv, regionCity).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 2fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', alignItems: 'end' }}>
            <div style={{ paddingBottom: 8 }} />
            <div>
              {label('收货详细地址', true)}
              <input
                className="filter-input" readOnly title="根据所选择的省 / 地市 / 区县自动生成"
                placeholder="省 / 地市 / 区县"
                value={[regionProv, regionCity, regionDist].filter(Boolean).join(' / ')}
                style={{ width: '100%', background: '#F1F5F2', color: '#57625C', cursor: 'not-allowed' }}
              />
            </div>
            <div>
              {label('详细地址', true)}
              <input className="filter-input" placeholder="街道、门牌号" value={receiverAddress} onChange={(e) => { setReceiverAddress(e.target.value); setError(''); }} style={{ width: '100%' }} />
            </div>
          </div>
        </Card>

        <Card title="商品明细" style={{ marginTop: 'var(--space-4)' }}>
          {/* 添加商品：品牌筛选 + 名称搜索 → 商品卡片（首图），点击即添加 */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>添加商品：</span>
            <select className="filter-select" value={itemBrand} onChange={(e) => setItemBrand(e.target.value)} style={{ width: 160 }}>
              <option value="">全部品牌</option>
              {[...new Set(products.map((p) => p.brand))].map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <input className="filter-input" placeholder="搜索商品名称..." value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} style={{ width: 200 }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>共 {pickerProducts.length} 款</span>
          </div>
          {pickerProducts.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', maxHeight: 260, overflowY: 'auto', padding: 2 }}>
              {pickerProducts.map((p) => {
                const added = items.some((it) => it.productId === p.id);
                const img = p.mainImages?.[0];
                return (
                  <button
                    key={p.id}
                    disabled={added}
                    onClick={() => addProduct(p.id)}
                    title={added ? '已添加' : '点击添加到订单'}
                    style={{
                      display: 'flex', gap: 10, alignItems: 'center', textAlign: 'left', cursor: added ? 'not-allowed' : 'pointer',
                      padding: 8, borderRadius: 'var(--radius-md)', border: `1px solid ${added ? 'var(--color-neutral-100)' : 'var(--color-neutral-200)'}`,
                      background: added ? 'var(--color-bg-tertiary)' : 'var(--color-neutral-0)', opacity: added ? 0.6 : 1,
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

          {/* 已选商品列表：首图 + 数量 + 销售实价 + 删除 */}
          {items.length === 0 ? (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)', padding: 'var(--space-2) 0' }}>尚未添加商品，点击上方商品卡片即可添加（可按品牌筛选或搜索）</div>
          ) : (
            <table className="detail-inline-table">
              <thead><tr><th style={{ width: 60 }}>首图</th><th>商品 / 规格 / 品牌</th><th style={{ width: 130 }}>市场价</th><th style={{ width: 120 }}>销售报价</th><th style={{ width: 90 }}>数量</th><th style={{ width: 110 }}>销售实价</th>{isVia && <th style={{ width: 120 }}>销售给平台价</th>}<th style={{ width: 110, textAlign: 'right' }}>小计</th><th style={{ width: 60 }} /></tr></thead>
              <tbody>
                {items.map((it, idx) => {
                  const warn = minPriceWarning(it);
                  const p = products.find((x) => x.id === it.productId);
                  const img = p?.mainImages?.[0];
                  return (
                    <tr key={it.productId}>
                      <td>{img ? <img src={img} alt={it.productName} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-100)' }} /> : <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--color-neutral-100)', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--color-neutral-400)' }}>无图</span>}</td>
                      <td>
                        <div style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{it.spec} · {p?.brand ?? '—'}</div>
                        {warn && <div style={{ fontSize: 'var(--text-xs)', color: '#CB405D' }}>⚠ {warn}</div>}
                      </td>
                      <td>
                        <div className="mono" style={{ fontSize: 'var(--text-sm)' }}>{p ? money(p.marketPrice) : '—'}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>京东价：{p?.jdPrice ?? '—'} / 天猫价：{p?.tmallPrice ?? '—'}</div>
                      </td>
                      <td>
                        {(() => {
                          const q = quoteOf(it.productId);
                          return q !== undefined
                            ? <span className="mono" style={{ color: 'var(--color-module-current-base)', fontWeight: 'var(--font-semibold)' }}>{money(q)}{isVia ? <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 400, color: 'var(--color-neutral-400)' }}>经平台报价</span> : null}</span>
                            : <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>—（未配置报价）</span>;
                        })()}
                      </td>
                      <td><input className="filter-input mono" type="number" min={1} value={it.quantity} onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value) } : x)))} style={{ width: '100%' }} /></td>
                      <td><input className="filter-input mono" type="number" min={0} value={it.price} onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, price: Number(e.target.value) } : x)))} style={{ width: '100%', borderColor: warn ? '#CB405D' : undefined }} /></td>
                      {isVia && (() => {
                        const pn = platformNetOf(it.price);
                        return (
                          <td>
                            {pn !== undefined
                              ? <span className="mono" style={{ color: '#CB405D', fontWeight: 'var(--font-semibold)' }}>{money(pn)}</span>
                              : <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>选择平台客户后计算</span>}
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
          )}
          <div style={{ fontSize: 'var(--text-sm)', textAlign: 'right', borderTop: '1px solid var(--color-neutral-100)', paddingTop: 'var(--space-3)' }}>
            合计：<strong className="mono" style={{ color: 'var(--color-module-current-base)', fontSize: 'var(--text-md)' }}>{money(entryTotal)}</strong>
          </div>
        </Card>

        <Card title="备注" style={{ marginTop: 'var(--space-4)' }}>
          <input className="filter-input" placeholder="订单备注（平台要求、客户要求等）" value={remark} onChange={(e) => setRemark(e.target.value)} style={{ width: '100%' }} />
          {error && (
            <div style={{ padding: '8px 12px', background: '#FFEBEE', color: '#C62828', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-3)' }}>{error}</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Button variant="ghost" onClick={resetForm}>重置</Button>
            <Button onClick={saveOrder}>保存订单并匹配报备</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
