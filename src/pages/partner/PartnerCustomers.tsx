import { useState, useMemo } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { PageHead, Pill } from './PartnerUI';
import { customerItems, CUSTOMER_TYPE_LABELS } from '../../data/customers';
import { useCustomerStore } from '../../stores/customerStore';
import { usePriceStore, effectiveCustomerQuote } from '../../stores/priceStore';
import { PROVINCE_NAMES, getCities, getDistricts } from '../../data/regions';
import type { CustomerItem, CustomerPoolConfig } from '../../types';
import './partner.css';

/** 入池范围摘要（全国 / 全省 / 全市 / 区县 列表） */
function poolScopeText(cfg: CustomerPoolConfig): string {
  if (cfg.nationwide) return '全国';
  const parts = [
    ...cfg.provinces.map((p) => `${p}（全省）`),
    ...cfg.cities.map((c) => c.split('/').slice(1).join(' ') + '（全市）'),
    ...cfg.districts.map((d) => d.split('/').slice(1).join(' ')),
  ];
  return parts.length > 0 ? parts.join('、') : '未设置';
}

/** 合作商客户池：管理后台入池（入池=是 + 地区范围命中）的客户在此展示 */
export default function PartnerCustomers() {
  const poolConfigs = useCustomerStore((s) => s.poolConfigs);
  const [keyword, setKeyword] = useState('');
  /** 地区筛选（先选地区：命中入池范围的客户才展示；未选=全部入池客户） */
  const [selProv, setSelProv] = useState('');
  const [selCity, setSelCity] = useState('');
  const [selDist, setSelDist] = useState('');
  const [selected, setSelected] = useState<CustomerItem | null>(null);

  /* 报品过滤：合作商选择该客户后，只能看到该客户报品=是的商品 */
  const customerQuotes = usePriceStore((s) => s.customerQuotes);
  const storeProducts = usePriceStore((s) => s.products);

  const pooled = useMemo(() => customerItems.filter((c) => {
    const cfg = poolConfigs[c.id];
    if (!cfg?.enabled) return false;
    // 已选地区：需命中入池范围（全国 / 选中省 / 选中市 / 选中区县）
    if (selProv) {
      if (cfg.nationwide) return true;
      if (cfg.provinces.includes(selProv)) return true;
      if (selCity && cfg.cities.includes(`${selProv}/${selCity}`)) return true;
      if (selCity && selDist && cfg.districts.includes(`${selProv}/${selCity}/${selDist}`)) return true;
      return false;
    }
    return true;
  }), [poolConfigs, selProv, selCity, selDist]);

  const filtered = useMemo(() => pooled.filter((c) => {
    const kw = keyword.trim();
    if (kw && !c.name.includes(kw) && !(c.shortName ?? '').includes(kw) && !c.contactPerson.includes(kw)) return false;
    return true;
  }), [pooled, keyword]);

  /** 可下单商品：该客户报品=是的商品 + 直销报价（来自报品报（调）价） */
  const orderableProducts = (c: CustomerItem) => storeProducts.filter((p) => {
    const cfg = customerQuotes[c.id];
    if (!cfg) return p.shelfStatus === 'on';
    const q = cfg.products[p.id];
    const reported = p.shelfStatus === 'on' && (q ? q.reported !== false : true);
    return reported;
  });

  const statusPill = (c: CustomerItem) => (
    <Pill tone={c.status === 'active' ? 'green' : 'amber'}>{c.status === 'active' ? '合作中' : '已暂停'}</Pill>
  );

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 客户池"
        title="客户池"
        desc="平台开放给贵司营销的客户池：先选择地区，展示入池范围覆盖该地区且入池状态为「是」的客户及其可下单商品（商品与报价由平台报品报（调）价统一设置）。"
      />

      {/* 筛选：地区（省/市/县级联）+ 搜索 */}
      <div className="pk-toolbar">
        <select className="filter-select" value={selProv} onChange={(e) => { setSelProv(e.target.value); setSelCity(''); setSelDist(''); }}>
          <option value="">全部地区（省）</option>
          {PROVINCE_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="filter-select" disabled={!selProv} value={selCity} onChange={(e) => { setSelCity(e.target.value); setSelDist(''); }}>
          <option value="">全部市</option>
          {selProv ? getCities(selProv).map((c) => <option key={c.name} value={c.name}>{c.name}</option>) : null}
        </select>
        <select className="filter-select" disabled={!selCity} value={selDist} onChange={(e) => setSelDist(e.target.value)}>
          <option value="">全部区县</option>
          {selProv && selCity ? getDistricts(selProv, selCity).map((d) => <option key={d} value={d}>{d}</option>) : null}
        </select>
        <input className="filter-input" placeholder="搜索客户名称、联系人..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <span className="pk-count">
          共 {filtered.length} 家客户{selProv ? ` · ${[selProv, selCity, selDist].filter(Boolean).join(' ')}` : '（未选地区，显示全部入池客户）'}
        </span>
      </div>

      <div className="pk-table-panel">
        <Table
          headers={['客户名称', '客户类型', '等级', '地区', '联系人', '联系电话', '可下单商品', '入池范围', '状态', '操作']}
          rows={filtered.map((c) => [
            <span key="name" className="cell-emph">{c.shortName || c.name}</span>,
            <span key="type">{CUSTOMER_TYPE_LABELS[c.type]}</span>,
            <span key="lv" className="mono">{c.level}</span>,
            <span key="region">{[c.province, c.city, c.district].filter(Boolean).join(' / ')}</span>,
            <span key="cp">{c.contactPerson}</span>,
            <span key="phone" className="mono cell-muted">{c.contactPhone}</span>,
            <span key="prods" className="mono">{orderableProducts(c).length} 款</span>,
            <span key="scope" style={{ fontSize: 12, color: 'var(--pk-ink3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={poolScopeText(poolConfigs[c.id])}>{poolScopeText(poolConfigs[c.id])}</span>,
            statusPill(c),
            <div key="act" className="row-actions">
              <Button size="sm" variant="ghost" onClick={() => setSelected(c)}>查看</Button>
            </div>,
          ])}
        />
        {filtered.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--pk-ink3)', fontSize: 13 }}>
            {selProv ? '所选地区暂无入池客户：仅展示入池范围覆盖该地区且入池状态为「是」的客户。' : '暂无入池客户，请等待平台开放客户入池。'}
          </div>
        )}
      </div>

      {/* 客户详情抽屉（含可下单商品表） */}
      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        badge="PC"
        title={selected?.name ?? ''}
        statusTag={selected ? statusPill(selected) : null}
        subtitle={selected ? `${CUSTOMER_TYPE_LABELS[selected.type]} · ${[selected.province, selected.city, selected.district].filter(Boolean).join(' / ')} · 合作起始 ${selected.cooperationDate}` : ''}
      >
        {selected && (
          <>
            <DrawerSection title="合作规则">
              {(() => {
                const rule = poolConfigs[selected.id]?.coopRule;
                const rows: [string, string | undefined][] = [
                  ['客户要求', rule?.requirements],
                  ['下单流程', rule?.orderProcess],
                  ['结算规则', rule?.settlement],
                ];
                const hasRule = rows.some(([, text]) => text);
                return (
                  <>
                    {hasRule ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                        {rows.map(([label, text]) => (
                          <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <span style={{ flexShrink: 0, fontSize: 12, color: 'var(--pk-ink3)', paddingTop: 2, minWidth: 52 }}>{label}</span>
                            <span style={{ flex: 1, fontSize: 13, color: 'var(--pk-ink2)', lineHeight: 1.8 }}>{text || '—'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--pk-ink3)', lineHeight: 1.7 }}>
                        平台暂未设置该客户的合作规则，合作前请与平台运营确认客户要求、下单流程与结算方式。
                      </div>
                    )}
                    <div style={{ marginTop: 10, fontSize: 12, color: 'var(--pk-ink3)', lineHeight: 1.7 }}>
                      合作规则由淡茶半盏平台设置与维护（客户要求 / 下单流程 / 结算规则），如有疑问请联系平台运营。
                    </div>
                  </>
                );
              })()}
            </DrawerSection>

            <DrawerSection title={`可下单商品（${orderableProducts(selected).length} 款）`}>
              {orderableProducts(selected).length === 0 ? (
                <div style={{ padding: '12px 0', fontSize: 13, color: 'var(--pk-ink3)', textAlign: 'center' }}>暂无可下单商品</div>
              ) : (
                <table className="detail-inline-table">
                  <thead>
                    <tr><th>商品名称</th><th>规格</th><th>品牌</th><th>市场价</th><th>客户报价</th></tr>
                  </thead>
                  <tbody>
                    {orderableProducts(selected).map((p) => {
                      const quote = effectiveCustomerQuote(customerQuotes, selected.id, p.id, storeProducts);
                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 'var(--font-medium)' }}>{p.name}</td>
                          <td>{p.spec}</td>
                          <td>{p.brand}</td>
                          <td className="mono">¥{p.marketPrice.toLocaleString()}</td>
                          <td className="mono" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)' }}>
                            {quote !== undefined ? `¥${quote.toLocaleString()}` : `¥${p.marketPrice.toLocaleString()}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
                可下单商品与客户报价由平台「报品报（调）价」统一设置（未单独报价的商品按市场价），如有疑问请联系平台运营。
              </div>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </div>
  );
}
