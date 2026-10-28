import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePriceStore } from '../../stores/priceStore';
import { customerItems, CUSTOMER_TYPE_LABELS } from '../../data/customers';
import { platformItems } from '../../data/platforms';
import { getSalesDefaultPrice, getPersonalMinPrice } from '../../data/prices';
import type { ExternalOrderItem, ExternalPlatform } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const PLATFORM_OPTIONS: { value: ExternalPlatform; label: string }[] = [
  { value: 'tmall', label: '天猫' }, { value: 'jd', label: '京东' }, { value: 'douyin', label: '抖音' },
  { value: 'pdd', label: '拼多多' }, { value: 'other', label: '其他平台' },
];

interface CustomerOption { id: string; name: string; typeLabel: string; level: string; contactPerson: string; contactPhone: string; contactAddress: string }

/**
 * 销售 · 订单录入（销售订单生成入口之一：手工录入）
 * 与订单分发页的录入弹窗同源逻辑：客户匹配带出类型/联系人/默认价，保存即匹配报备。
 */
export default function OrderEntry() {
  const navigate = useNavigate();
  const store = useOrderFlowStore;
  const products = usePriceStore((s) => s.products);

  const [platform, setPlatform] = useState<ExternalPlatform>('tmall');
  const [externalOrderNo, setExternalOrderNo] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [matchedCustomerId, setMatchedCustomerId] = useState('');
  const [customerType, setCustomerType] = useState('直营客户');
  const [customerRegion, setCustomerRegion] = useState('');
  const [receiver, setReceiver] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<ExternalOrderItem[]>([]);
  const [error, setError] = useState('');
  const [savedTip, setSavedTip] = useState('');

  const customerOptions: CustomerOption[] = useMemo(() => [
    ...customerItems.map((c) => ({ id: c.id, name: c.name, typeLabel: CUSTOMER_TYPE_LABELS[c.type], level: c.level || '—', contactPerson: c.contactPerson, contactPhone: c.contactPhone, contactAddress: c.contactAddress || c.region })),
    ...platformItems.map((p) => ({ id: p.id, name: p.name, typeLabel: '平台客户', level: '—', contactPerson: p.contactPerson, contactPhone: p.contactPhone, contactAddress: p.contactAddress })),
  ], []);

  const matchedCustomer = matchedCustomerId ? customerOptions.find((c) => c.id === matchedCustomerId) ?? null : null;
  const customerSuggestions = useMemo(() => {
    if (!customerSearch || matchedCustomer) return [];
    return customerOptions.filter((c) => c.name.includes(customerSearch)).slice(0, 6);
  }, [customerSearch, matchedCustomer, customerOptions]);

  const defaultPriceOf = (productId: string): number => {
    const p = products.find((x) => x.id === productId);
    if (!p) return 0;
    if (matchedCustomer) {
      const cust = customerItems.find((c) => c.id === matchedCustomer.id);
      if (cust) return getSalesDefaultPrice(p.id, cust.id).price;
    }
    return p.salesPrice;
  };

  const addItemRow = () => {
    const p = products[0];
    if (!p) return;
    setItems((prev) => [...prev, { productId: p.id, productName: p.name, spec: p.spec, quantity: 1, price: defaultPriceOf(p.id) }]);
  };

  const setItemProduct = (idx: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, productId, productName: p.name, spec: p.spec, price: defaultPriceOf(productId) } : it)));
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

  const selectCustomer = (c: CustomerOption) => {
    setMatchedCustomerId(c.id);
    setCustomerSearch(c.name);
    setCustomerType(c.typeLabel);
    if (c.contactPerson && !receiver) setReceiver(c.contactPerson);
    if (c.contactPhone && !receiverPhone) setReceiverPhone(c.contactPhone);
  };

  const resetForm = () => {
    setExternalOrderNo(''); setCustomerSearch(''); setMatchedCustomerId(''); setCustomerRegion('');
    setReceiver(''); setReceiverPhone(''); setReceiverAddress(''); setRemark(''); setItems([]); setError('');
  };

  const saveOrder = () => {
    if (!externalOrderNo.trim() || !customerSearch.trim() || !customerRegion.trim() || !receiver.trim()) {
      setError('平台单号、客户名称、客户区域、收货人为必填');
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
      platform,
      externalOrderNo: externalOrderNo.trim(),
      customerName: customerSearch.trim(),
      customerType,
      customerRegion: customerRegion.trim(),
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
      ? `订单 ${order.code} 已保存并命中报备，进入「报备-匹配待确认」，3 秒后跳转订单分发…`
      : `订单 ${order.code} 已保存，进入「分发-待处理」，3 秒后跳转订单分发…`);
    setTimeout(() => { setSavedTip(''); navigate('/sales/order-distribute'); }, 3000);
  };

  const label = (text: string, required?: boolean) => (
    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>
      {text}{required && <span style={{ color: '#CB405D', marginLeft: 2 }}>*</span>}
    </label>
  );

  return (
    <>
      <ContentHeader title="订单录入" breadcrumbs={['销售', '订单录入']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          订单录入是销售订单生成的入口之一（三个入口：<strong>本页手工录入</strong> / <strong>平台直连推送</strong> / <strong>报备商机转入</strong>）。
          客户名称支持从<strong>客户管理</strong>匹配（带出类型/联系人并按客户报价带出默认价）；
          保存时自动与审批通过的报备比对，命中则进入「报备-匹配待确认」，人工确认后转派报备合作商。
        </div>

        {savedTip && (
          <div style={{ padding: '10px 14px', background: '#E8F5E9', color: '#01795D', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{savedTip}</div>
        )}

        <Card title="订单信息">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div>
              {label('来源平台', true)}
              <select className="filter-input" value={platform} onChange={(e) => setPlatform(e.target.value as ExternalPlatform)} style={{ width: '100%' }}>
                {PLATFORM_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              {label('平台原始单号', true)}
              <input className="filter-input" placeholder="如 TM-88213907" value={externalOrderNo} onChange={(e) => { setExternalOrderNo(e.target.value); setError(''); }} style={{ width: '100%' }} />
            </div>
            <div>
              {label('客户类型')}
              <select className="filter-input" value={customerType} onChange={(e) => setCustomerType(e.target.value)} style={{ width: '100%' }}>
                {['直营客户', '渠道客户', '平台客户', '个人客户', '带货客户'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
            {label('客户名称（输入可搜索在库客户）', true)}
            <input
              className="filter-input" placeholder="输入客户名称，支持搜索客户管理中的在库客户" style={{ width: '100%' }}
              value={customerSearch}
              onChange={(e) => { setCustomerSearch(e.target.value); setMatchedCustomerId(''); setError(''); }}
            />
            {customerSuggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: 220, overflowY: 'auto', background: '#fff', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                {customerSuggestions.map((c) => (
                  <div key={c.id} style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }} onClick={() => selectCustomer(c)}>
                    <span>{c.name}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{c.typeLabel} · {c.level}</span>
                  </div>
                ))}
              </div>
            )}
            {matchedCustomer && (
              <div style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                <span>✓ 已匹配在库客户</span>
                <span>联系人：{matchedCustomer.contactPerson}</span>
                <span>等级：{matchedCustomer.level}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div>
              {label('客户区域', true)}
              <input className="filter-input" placeholder="如 江苏南京" value={customerRegion} onChange={(e) => { setCustomerRegion(e.target.value); setError(''); }} style={{ width: '100%' }} />
            </div>
            <div>
              {label('收货人', true)}
              <input className="filter-input" placeholder="收货人姓名" value={receiver} onChange={(e) => { setReceiver(e.target.value); setError(''); }} style={{ width: '100%' }} />
            </div>
            <div>
              {label('收货地址')}
              <input className="filter-input" placeholder="省市区 + 详细地址" value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              {label('联系电话')}
              <input className="filter-input" placeholder="联系电话" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>
        </Card>

        <Card title="商品明细" style={{ marginTop: 'var(--space-4)' }} headerRight={<Button size="sm" variant="ghost" onClick={addItemRow}>+ 添加商品行</Button>}>
          {items.length === 0 && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)', padding: 'var(--space-2) 0' }}>尚未添加商品行，点击右上「添加商品行」开始录入</div>}
          {items.map((it, idx) => {
            const warn = minPriceWarning(it);
            return (
              <div key={idx} style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 0.8fr 1fr auto', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <select className="filter-input" value={it.productId} onChange={(e) => setItemProduct(idx, e.target.value)} style={{ width: '100%' }}>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}（{p.spec}）</option>)}
                  </select>
                  <input className="filter-input mono" type="number" min={1} placeholder="数量" value={it.quantity} onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value) } : x)))} style={{ width: '100%' }} />
                  <input className="filter-input mono" type="number" min={0} placeholder="销售实价" value={it.price} onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, price: Number(e.target.value) } : x)))} style={{ width: '100%', borderColor: warn ? '#CB405D' : undefined }} />
                  <Button size="sm" variant="ghost" onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}>删除</Button>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: warn ? '#CB405D' : 'var(--color-neutral-400)', marginTop: 2, paddingLeft: 2 }}>
                  {warn ? `⚠ ${warn}` : ''}
                </div>
              </div>
            );
          })}
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
