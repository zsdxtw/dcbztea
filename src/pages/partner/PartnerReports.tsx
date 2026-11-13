import { useState, useMemo, useEffect } from 'react';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { PageHead, Pill, REPORT_STATUS_TONE, REPORT_TYPE_TONE } from './PartnerUI';
import { getPartnerAuth } from './PartnerLayout';
import { useReportStore, reportActive } from '../../stores/reportStore';
import { useSupplierStore } from '../../stores/supplierStore';
import { useCustomerStore } from '../../stores/customerStore';
import { usePriceStore } from '../../stores/priceStore';
import { customerItems } from '../../data/customers';
import { teaProducts } from '../../data/teaProducts';
import { PROVINCE_NAMES, getCities, getDistricts } from '../../data/regions';
import type { PartnerOrderReportKind, PartnerReport, PartnerReportType } from '../../types';
import { PARTNER_REPORT_TYPE_LABELS, PARTNER_REPORT_STATUS_LABELS, PARTNER_ORDER_KIND_LABELS } from '../../data/partner';
import './partner.css';

const money = (n: number) => `¥${n.toLocaleString()}`;
const today = () => new Date().toISOString().slice(0, 10);

/** 报备类型 Tab */
const TYPE_TABS: { key: PartnerReportType | 'all'; label: string }[] = [
  { key: 'all', label: '全部报备' },
  { key: 'order', label: '订单报备' },
  { key: 'product', label: '商品报备' },
  { key: 'region', label: '地区报备' },
];

/** 地区路径文本 */
const regionsText = (r: PartnerReport) => r.regions?.length ? r.regions.join('、') : '不限地区';

/** 地区复选树展开状态 */
interface TreeOpen {
  prov?: string;
  city?: string;
}

/**
 * 商品卡片选择器（参照新建销售单商品明细设计：品牌筛选 + 搜索 + 商品卡片网格，多选无数量）。
 * 每页固定 3 列 × 2 行（6 个商品），页码翻页；选中商品在下方以 15×15 正方形缩略图展示。
 */
function ProductPicker({ products, selected, onToggle }: {
  products: { id: string; name: string; spec: string; brand: string; marketPrice: number; mainImages?: string[] }[];
  selected: string[];
  onToggle: (name: string) => void;
}) {
  const [brand, setBrand] = useState('');
  const [kw, setKw] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6; // 3 列 × 2 行
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))], [products]);
  const list = useMemo(() => products.filter((p) => (!brand || p.brand === brand) && (!kw || p.name.includes(kw))), [products, brand, kw]);
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const paged = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [brand, kw]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const pageBtn = (n: number) => (
    <button key={n} type="button" onClick={() => setPage(n)}
      style={{
        minWidth: 24, height: 24, padding: '0 5px', borderRadius: 6, cursor: 'pointer',
        border: `1px solid ${page === n ? '#01795D' : 'var(--color-neutral-200)'}`,
        background: page === n ? '#01795D' : 'var(--color-neutral-0)',
        color: page === n ? '#fff' : 'var(--color-neutral-600)',
        fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-family-mono)',
      }}>{n}</button>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--pk-ink3)' }}>选择商品：</span>
        <select className="filter-select" value={brand} onChange={(e) => setBrand(e.target.value)} style={{ width: 150, height: 30, fontSize: 13 }}>
          <option value="">全部品牌</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <input className="filter-input" placeholder="搜索商品名称..." value={kw} onChange={(e) => setKw(e.target.value)} style={{ width: 170, height: 30, fontSize: 13 }} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--pk-ink3)' }}>共 {list.length} 款 · 已选 {selected.length} 款</span>
      </div>
      {list.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--pk-ink3)', padding: '10px 0' }}>当前筛选条件下暂无商品</div>
      ) : (
        <>
          {/* 商品卡片：固定 3 列（每页 6 个 = 2 行），无滚动条 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {paged.map((p) => {
              const on = selected.includes(p.name);
              const img = p.mainImages?.[0];
              return (
                <button key={p.id} type="button" onClick={() => onToggle(p.name)}
                  style={{
                    display: 'flex', gap: 8, alignItems: 'center', textAlign: 'left', cursor: 'pointer',
                    padding: 8, borderRadius: 'var(--radius-md)',
                    border: `1px solid ${on ? '#01795D' : 'var(--color-neutral-200)'}`,
                    background: on ? '#E6F2ED' : 'var(--color-neutral-0)',
                  }}>
                  {img ? (
                    <img src={img} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0, border: '1px solid var(--color-neutral-100)' }} />
                  ) : (
                    <span style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--color-neutral-100)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--color-neutral-400)' }}>无图</span>
                  )}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 'var(--font-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--color-neutral-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.brand} · {p.spec}</span>
                    <span className="mono" style={{ display: 'block', fontSize: 11, color: on ? '#01795D' : 'var(--color-neutral-400)' }}>{money(p.marketPrice)}{on ? ' · 已选' : ''}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {/* 分页页码 */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}
                style={{ minWidth: 24, height: 24, borderRadius: 6, cursor: page <= 1 ? 'not-allowed' : 'pointer', border: '1px solid var(--color-neutral-200)', background: 'var(--color-neutral-0)', color: 'var(--color-neutral-600)', fontSize: 12, padding: '0 6px', opacity: page <= 1 ? 0.5 : 1 }}>上一页</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => pageBtn(n))}
              <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                style={{ minWidth: 24, height: 24, borderRadius: 6, cursor: page >= totalPages ? 'not-allowed' : 'pointer', border: '1px solid var(--color-neutral-200)', background: 'var(--color-neutral-0)', color: 'var(--color-neutral-600)', fontSize: 12, padding: '0 6px', opacity: page >= totalPages ? 0.5 : 1 }}>下一页</button>
            </div>
          )}
        </>
      )}
      {/* 已选商品缩略图（20×20 正方形，点击取消选择） */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--pk-ink3)' }}>已选（{selected.length}，点击缩略图取消）：</span>
          {selected.map((name) => {
            const prod = products.find((p) => p.name === name);
            const img = prod?.mainImages?.[0];
            return img ? (
              <img key={name} src={img} title={`${name}（点击取消选择）`} alt={name} onClick={() => onToggle(name)}
                style={{ width: 20, height: 20, borderRadius: 3, objectFit: 'cover', border: '1px solid var(--color-neutral-200)', cursor: 'pointer' }} />
            ) : (
              <span key={name} title={`${name}（点击取消选择）`} onClick={() => onToggle(name)}
                style={{ width: 20, height: 20, borderRadius: 3, background: 'var(--color-neutral-200)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 9, color: 'var(--color-neutral-500)' }}>无图</span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** 表单草稿 */
interface ReportForm {
  customerName: string;
  type: PartnerReportType;
  orderKind: PartnerOrderReportKind;
  expectOrderDate: string;
  /** 订单报备下单地区（单选：'' 未选 / '全国' / '省' / '省/市' / '省/市/县'） */
  orderRegion: string;
  orderProv: string;
  orderCity: string;
  orderDist: string;
  contactName: string;
  contactPhone: string;
  productNames: string[];
  sku: string;
  internalOrderNo: string;
  /** 商品/地区报备地区复选 */
  regions: string[];
  validUntil: string;
  summary: string;
  amount: string;
}

const EMPTY_FORM: ReportForm = {
  customerName: '', type: 'order', orderKind: 'self',
  expectOrderDate: '', orderRegion: '', orderProv: '', orderCity: '', orderDist: '',
  contactName: '', contactPhone: '', productNames: [], sku: '', internalOrderNo: '',
  regions: [], validUntil: '', summary: '', amount: '',
};

/** 报备管理：先选客户（仅入客户池客户）→ 订单/商品/地区三类报备（含有效日期） */
export default function PartnerReports() {
  const reports = useReportStore((s) => s.reports);
  const submitReportAction = useReportStore((s) => s.submitReport);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const poolConfigs = useCustomerStore((s) => s.poolConfigs);
  const customerQuotes = usePriceStore((s) => s.customerQuotes);
  const storeProducts = usePriceStore((s) => s.products);

  const partner = useMemo(() => {
    const auth = getPartnerAuth();
    return auth?.supplierId
      ? suppliers.find((s) => s.id === auth.supplierId)
      : suppliers.find((s) => s.terminal.enabled && s.terminal.username === auth?.username);
  }, [suppliers]);
  /** 入客户池的客户（新增报备只展示这些客户） */
  const poolCustomers = useMemo(() => customerItems.filter((c) => poolConfigs[c.id]?.enabled), [poolConfigs]);



  const [activeTab, setActiveTab] = useState<PartnerReportType | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<PartnerReport | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<ReportForm>(EMPTY_FORM);
  const [formErr, setFormErr] = useState('');
  /** 地区树展开 */
  const [treeOpen, setTreeOpen] = useState<TreeOpen>({});

  /** 当前所选客户报品=是的商品（订单报备可选商品） */
  const form_customer = useMemo(() => customerItems.find((c) => c.name === form.customerName), [form.customerName]);
  const customerProducts = useMemo(() => {
    if (!form_customer) return [];
    const cfg = customerQuotes[form_customer.id];
    return storeProducts.filter((p) => {
      if (p.shelfStatus !== 'on') return false;
      const q = cfg?.products[p.id];
      return q ? q.reported !== false : true;
    });
  }, [form_customer, customerQuotes, storeProducts]);

  /** 合作商经营品牌下的商品（商品报备可选商品） */
  const myBrandProducts = useMemo(() => {
    const brands = partner?.mainBrands ?? [];
    return storeProducts.filter((p) => brands.includes(p.brand) && p.shelfStatus === 'on');
  }, [partner, storeProducts]);



  const filtered = useMemo(() => reports.filter(r => {
    if (activeTab !== 'all' && r.type !== activeTab) return false;
    if (keyword && !r.code.includes(keyword) && !r.title.includes(keyword) && !r.summary.includes(keyword)) return false;
    return true;
  }), [reports, activeTab, keyword]);
  const pagedRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [keyword, pageSize, activeTab]);

  const tabCount = (key: PartnerReportType | 'all') => key === 'all' ? reports.length : reports.filter(r => r.type === key).length;

  /* ── 校验 ── */
  const validate = (): string | null => {
    if (!form.customerName) return '请先选择要报备的客户（仅展示入客户池的客户）';
    if (!form.validUntil) return '请选择报备有效日期（结束日期）';
    if (!form.summary.trim()) return '请输入报备说明';
    if (form.type === 'order') {
      if (!form.expectOrderDate) return '请选择预计下单日期';
      if (!form.orderProv || !form.orderCity) return '请选择下单地区（至少选择到地市）';
      if (!form.contactName.trim()) return '请输入下单\\收件人';
      if (!form.contactPhone.trim()) return '请输入下单\\收件电话';
    }
    if (form.type === 'product') {
      if (form.productNames.length === 0) return '请至少选择一个报备商品（限您经营的品牌）';
      if (form.regions.length === 0) return '请选择报备地区（支持全国 / 省 / 市 / 县，可复选）';
    }
    if (form.type === 'region') {
      if (form.regions.length === 0) return '请选择报备地区（支持全国 / 省 / 市 / 县，可复选）';
    }
    return null;
  };

  const submitReport = () => {
    const err = validate();
    if (err) { setFormErr(err); return; }
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const regions = form.type === 'order'
      ? (form.orderRegion ? [form.orderRegion] : [])
      : form.regions;
    const kindText = form.type === 'order' ? `（${PARTNER_ORDER_KIND_LABELS[form.orderKind]}）` : '';
    const regionPreview = regions.join('、');
    const title =
      form.type === 'order' ? `${form.customerName}订单报备${kindText}`
        : form.type === 'product' ? `${form.customerName}商品报备（${regionPreview}）`
          : `${form.customerName}地区报备（${regionPreview}）`;
    const report: PartnerReport = {
      id: `pr_${Date.now()}`,
      code: `BB${now.getFullYear()}${pad(now.getMonth() + 1)}${String(reports.length + 1).padStart(3, '0')}`,
      type: form.type,
      title,
      summary: form.summary.trim(),
      amount: form.type === 'order' && form.amount ? Number(form.amount) : undefined,
      status: 'pending',
      submitTime: `${dateStr} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
      partnerName: partner?.name ?? '',
      customerName: form.customerName,
      validUntil: form.validUntil,
      ...(form.type === 'order' ? {
        orderKind: form.orderKind,
        expectOrderDate: form.expectOrderDate,
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        productNames: form.productNames.length > 0 ? form.productNames : undefined,
        sku: form.sku.trim() || undefined,
        internalOrderNo: form.internalOrderNo.trim() || undefined,
      } : {}),
      regions,
    };
    submitReportAction(report);
    setShowAdd(false);
    setForm(EMPTY_FORM);
    setFormErr('');
    setTreeOpen({});
  };

  const statusPill = (status: string) => <Pill tone={REPORT_STATUS_TONE[status]}>{PARTNER_REPORT_STATUS_LABELS[status]}</Pill>;
  const expired = (r: PartnerReport) => r.status === 'approved' && !reportActive(r);

  const targetText = (r: PartnerReport) => {
    if (r.type === 'order') return `${r.customerName ?? '—'} · ${r.expectOrderDate ?? '—'} 下单 · ${r.contactPhone ?? '—'}`;
    if (r.type === 'product') return `${r.productNames?.join('、') ?? '—'} · ${regionsText(r)}`;
    return regionsText(r);
  };

  /* ── 地区复选树操作（商品/地区报备） ── */
  const toggleRegion = (path: string) => setForm((f) => ({ ...f, regions: f.regions.includes(path) ? f.regions.filter((x) => x !== path) : [...f.regions, path] }));
  /** 某路径是否被更上层覆盖（选了省则市/县禁用） */
  const covered = (path: string) => {
    if (path === '全国') return false;
    if (form.regions.includes('全国')) return true;
    const segs = path.split('/');
    // 父路径命中（省或省/市）
    if (segs.length >= 1 && form.regions.includes(segs[0])) return true;
    if (segs.length >= 2 && form.regions.includes(`${segs[0]}/${segs[1]}`)) return true;
    return false;
  };
  const regionChecked = (path: string) => form.regions.includes(path);

  /* ── 订单报备单地区 ── */
  const orderCityOpts = form.orderProv ? getCities(form.orderProv).map((c) => c.name) : [];
  const orderDistOpts = form.orderProv && form.orderCity ? getDistricts(form.orderProv, form.orderCity) : [];
  const setOrderRegion = (f: ReportForm): ReportForm => {
    const path = f.orderDist ? `${f.orderProv}/${f.orderCity}/${f.orderDist}`
      : f.orderCity ? `${f.orderProv}/${f.orderCity}`
        : f.orderProv ? f.orderProv
          : '';
    return { ...f, orderRegion: path };
  };

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 报备"
        title="报备管理"
        desc="先选择要报备的客户（仅入客户池客户），再按三类报备：订单报备（有货源=我方供货 / 无货源=平台自营或转派供货商）、商品报备（限您经营的品牌）、地区报备（该客户某地区全部订单，含未经营品牌）。匹配优先级：订单报备 > 商品报备 > 地区报备；报备均在有效日期（含当日）内生效。"
      />

      {/* 报备类型 Tab */}
      <div className="pk-tabs">
        {TYPE_TABS.map(t => (
          <button key={t.key} className={`pk-tab${activeTab === t.key ? ' active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
            <span className="pk-tab-n">{tabCount(t.key)}</span>
          </button>
        ))}
      </div>

      <div className="pk-panel">
        <div className="pk-panel-head" style={{ flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' }}>
          <input className="filter-input" placeholder="搜索报备编号、标题、内容..." value={keyword} onChange={e => setKeyword(e.target.value)} style={{ width: 220, height: 32, fontSize: 13 }} />
          <Button style={{ marginLeft: 'auto' }} onClick={() => { setForm(EMPTY_FORM); setFormErr(''); setTreeOpen({}); setShowAdd(true); }}>
            <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            新增报备
          </Button>
        </div>
        <div className="pk-panel-body">
        <div className="pk-table-panel" style={{ margin: 0 }}>
          <table>
            <thead>
              <tr>
                <th>序号</th><th>报备编号</th><th>类型</th><th>标题</th><th>报备客户</th>
                <th>报备对象</th><th>有效日期</th><th>预计金额</th><th>状态</th><th>提交时间</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((r, idx) => (
                <tr key={r.id}>
                  <td className="mono" style={{ color: 'var(--pk-ink3)' }}>{(page - 1) * pageSize + idx + 1}</td>
                  <td className="cell-mono-emph">{r.code}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Pill tone={REPORT_TYPE_TONE[r.type]}>{PARTNER_REPORT_TYPE_LABELS[r.type]}</Pill>
                      {r.type === 'order' && <Pill tone={r.orderKind === 'self' ? 'green' : 'gray'}>{PARTNER_ORDER_KIND_LABELS[r.orderKind ?? 'self']}</Pill>}
                    </div>
                  </td>
                  <td className="cell-emph">{r.title}</td>
                  <td>{r.customerName ?? '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--pk-ink2)' }}>{targetText(r)}</td>
                  <td className="mono" style={{ color: expired(r) ? '#C62828' : 'var(--pk-ink2)', fontSize: 12 }}>{r.validUntil ?? '长期'}</td>
                  <td>
                    {r.amount != null
                      ? <span className="mono" style={{ fontWeight: 'var(--font-medium)' }}>¥{r.amount.toLocaleString()}</span>
                      : <span style={{ color: 'var(--color-neutral-300)' }}>—</span>}
                  </td>
                  <td>{expired(r) ? <Pill tone="red">已失效</Pill> : statusPill(r.status)}</td>
                  <td className="cell-muted">{r.submitTime}</td>
                  <td>
                    <div className="row-actions">
                      <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>查看</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--pk-ink3)', padding: '28px 0' }}>暂无报备</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {(filtered.length > 0) && (
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} label="条报备" />
        )}
        </div>
      </div>

      {/* 详情抽屉 */}
      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        badge="BB"
        title={selected?.title ?? ''}
        statusTag={selected ? (expired(selected) ? <Pill tone="red">已失效</Pill> : statusPill(selected.status)) : null}
        subtitle={selected ? `${selected.code} · ${PARTNER_REPORT_TYPE_LABELS[selected.type]}${selected.type === 'order' ? `（${PARTNER_ORDER_KIND_LABELS[selected.orderKind ?? 'self']}）` : ''} · ${selected.submitTime}` : ''}
        hideFooter
        footer={<Button variant="ghost" onClick={() => setSelected(null)}>关闭</Button>}
      >
        {selected && (
          <>
            <DrawerSection title="报备信息">
              <InfoGrid>
                <InfoItem label="报备编号" mono emph>{selected.code}</InfoItem>
                <InfoItem label="报备类型">{PARTNER_REPORT_TYPE_LABELS[selected.type]}</InfoItem>
                <InfoItem label="报备客户" emph>{selected.customerName ?? '—'}</InfoItem>
                {selected.type === 'order' && <InfoItem label="货源模式">{PARTNER_ORDER_KIND_LABELS[selected.orderKind ?? 'self']}</InfoItem>}
                <InfoItem label="有效日期" mono>{selected.validUntil ? `${selected.validUntil}（含当日）` : '长期'}</InfoItem>
                <InfoItem label="报备状态">{expired(selected) ? '已失效' : PARTNER_REPORT_STATUS_LABELS[selected.status]}</InfoItem>
                {selected.amount != null && <InfoItem label="预计金额" mono>¥{selected.amount.toLocaleString()}</InfoItem>}
                {selected.reviewTime && <InfoItem label="审批时间">{selected.reviewTime}</InfoItem>}
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="报备对象">
              <InfoGrid>
                {selected.type === 'order' && (
                  <>
                    <InfoItem label="预计下单日期">{selected.expectOrderDate ?? '—'}</InfoItem>
                    <InfoItem label="下单地区">{regionsText(selected)}</InfoItem>
                    <InfoItem label="下单\收件人">{selected.contactName ?? '—'}</InfoItem>
                    <InfoItem label="下单\收件电话" mono>{selected.contactPhone ?? '—'}</InfoItem>
                    <InfoItem label="下单商品（多选）" span={3}>{selected.productNames?.length ? selected.productNames.join('、') : '—（未填）'}</InfoItem>
                    <InfoItem label="内部 SKU" mono>{selected.sku ?? '—（未填）'}</InfoItem>
                    <InfoItem label="内部下单编号" mono>{selected.internalOrderNo ?? '—（未填）'}</InfoItem>
                  </>
                )}
                {selected.type === 'product' && (
                  <>
                    <InfoItem label="报备商品（多选）" emph span={3}>{selected.productNames?.join('、') ?? '—'}</InfoItem>
                    <InfoItem label="报备地区（复选）" span={3}>{regionsText(selected)}</InfoItem>
                  </>
                )}
                {selected.type === 'region' && (
                  <>
                    <InfoItem label="报备地区（复选）" span={3}>{regionsText(selected)}</InfoItem>
                    <InfoItem label="品牌范围" span={3}>该客户该地区全部订单（含我方未经营品牌）</InfoItem>
                  </>
                )}
                <InfoItem label="报备说明" span={3}>{selected.summary}</InfoItem>
                <InfoItem label="审批意见" span={3}>{selected.reviewNote || '待审核'}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="匹配与转派说明">
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', lineHeight: 1.8 }}>
                匹配优先级：<strong>订单报备 &gt; 商品报备 &gt; 地区报备</strong>；报备在<strong>有效日期（含当日）</strong>内参与匹配，过期自动失效。
                {selected.status === 'approved' && selected.type === 'order' && selected.orderKind === 'self' && !expired(selected) && ' 已通过：命中的订单自动转入「订单管理」由我方履约。'}
                {selected.status === 'approved' && selected.type === 'order' && selected.orderKind === 'no_supply' && !expired(selected) && ' 已通过：命中的订单由平台自营或转派供货商（可指定 / 可比单）履约，本终端同步可见。'}
                {selected.type === 'product' && selected.status === 'approved' && !expired(selected) && ' 已通过：该客户在报备地区内命中报备商品的新订单自动匹配转给我方。'}
                {selected.type === 'region' && selected.status === 'approved' && !expired(selected) && ' 已通过：该客户在报备地区内的新订单（含未经营品牌）自动匹配转给我方。'}
                {expired(selected) && ' 该报备已超过有效日期，自动失效，不再参与订单匹配。'}
              </div>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>

      {/* 新增报备弹窗 */}
      {showAdd && (
        <div className="category-dialog-overlay" onClick={() => setShowAdd(false)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ width: 860, maxWidth: '94vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
            <div className="pk-dialog-title">新增报备</div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>

              {/* 第一行：报备客户 + 有效日期 并排 */}
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div style={{ flex: 1.4 }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>报备客户 *（仅入客户池的客户）</label>
                  <select className="filter-select" value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} style={{ width: '100%' }}>
                    <option value="">请选择要报备的客户</option>
                    {poolCustomers.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}（{c.region} · {c.level}）</option>
                    ))}
                  </select>
                  {poolCustomers.length === 0 && <div style={{ fontSize: 12, color: '#B26A00', marginTop: 6 }}>暂无入客户池的客户，请等待平台将客户入池。</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>有效日期（结束日，含当日）*</label>
                  <input className="filter-input" type="date" min={today()} value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} style={{ width: '100%' }} />
                </div>
              </div>

              {/* 报备类型 */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>报备类型 *</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {(['order', 'product', 'region'] as PartnerReportType[]).map(t => (
                    <button key={t} type="button" onClick={() => {
                      // 切换类型：仅保留 报备客户 与 有效日期，其余字段（含已选商品/地区）全部重置
                      setForm((f) => ({ ...EMPTY_FORM, customerName: f.customerName, validUntil: f.validUntil, type: t }));
                      setFormErr('');
                      setTreeOpen({});
                    }}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 'var(--text-sm)', cursor: 'pointer',
                        border: `1px solid ${form.type === t ? 'var(--pk-accent)' : 'var(--pk-line)'}`,
                        background: form.type === t ? 'var(--pk-accent-soft)' : '#fff',
                        color: form.type === t ? 'var(--pk-accent-dark)' : 'var(--pk-ink2)',
                        fontWeight: form.type === t ? 600 : 400,
                      }}>{PARTNER_REPORT_TYPE_LABELS[t]}</button>
                  ))}
                </div>
              </div>

              {/* 预计下单日期（仅订单报备，移至下单\收件人一行） */}

              {/* ── 订单报备 ── */}
              {form.type === 'order' && (
                <>
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>货源模式 *</label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      {([['self', '有货源', '合作商自己供货，命中订单转我方履约'], ['no_supply', '无货源', '淡茶半盏自营或转派供货商（可指定、可比单）']] as const).map(([k, label, desc]) => (
                        <button key={k} type="button" onClick={() => setForm((f) => ({ ...f, orderKind: k }))}
                          style={{
                            flex: 1, padding: '9px 10px', borderRadius: 9, fontSize: 'var(--text-sm)', cursor: 'pointer', textAlign: 'left',
                            border: `1px solid ${form.orderKind === k ? 'var(--pk-accent)' : 'var(--pk-line)'}`,
                            background: form.orderKind === k ? 'var(--pk-accent-soft)' : '#fff',
                            color: form.orderKind === k ? 'var(--pk-accent-dark)' : 'var(--pk-ink2)',
                            fontWeight: form.orderKind === k ? 600 : 400,
                          }}>
                          {label}
                          <div style={{ fontSize: 11, fontWeight: 400, marginTop: 3, opacity: 0.75 }}>{desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 下单地区（省/市/县三联，至少选到地市） */}
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>下单地区 *（至少选择到地市）</label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <select className="filter-select" value={form.orderProv} onChange={(e) => setForm((f) => setOrderRegion({ ...f, orderProv: e.target.value, orderCity: '', orderDist: '' }))} style={{ flex: 1 }}>
                        <option value="">省份</option>
                        {PROVINCE_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <select className="filter-select" disabled={!form.orderProv} value={form.orderCity} onChange={(e) => setForm((f) => setOrderRegion({ ...f, orderCity: e.target.value, orderDist: '' }))} style={{ flex: 1 }}>
                        <option value="">地市</option>
                        {orderCityOpts.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select className="filter-select" disabled={!form.orderCity} value={form.orderDist} onChange={(e) => setForm((f) => setOrderRegion({ ...f, orderDist: e.target.value }))} style={{ flex: 1 }}>
                        <option value="">区县（可选）</option>
                        {orderDistOpts.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    {form.orderRegion && <div style={{ fontSize: 12, color: 'var(--pk-ink3)', marginTop: 4 }}>当前报备地区：{form.orderRegion}</div>}
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>下单\收件人 *</label>
                      <input className="filter-input" placeholder="如 林掌柜" value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>下单\收件电话 *</label>
                      <input className="filter-input mono" placeholder="如 138****6677" value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>预计下单日期 *</label>
                      <input className="filter-input" type="date" value={form.expectOrderDate} onChange={(e) => setForm((f) => ({ ...f, expectOrderDate: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                  </div>

                  {/* 下单商品：客户报品商品，品牌→商品卡片多选（参照新建销售单） */}
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>下单商品（非必输，多选；展示该客户报品=是的商品）</label>
                    <ProductPicker
                      products={customerProducts}
                      selected={form.productNames}
                      onToggle={(name) => setForm((f) => ({ ...f, productNames: f.productNames.includes(name) ? f.productNames.filter((x) => x !== name) : [...f.productNames, name] }))}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>内部 SKU（非必输）</label>
                      <input className="filter-input mono" placeholder="贵司内部 SKU" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>内部下单编号（非必输）</label>
                      <input className="filter-input mono" placeholder="贵司内部订单号" value={form.internalOrderNo} onChange={(e) => setForm((f) => ({ ...f, internalOrderNo: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>预计金额（元）</label>
                      <input className="filter-input mono" type="number" min={0} placeholder="可稍后补充" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                  </div>
                </>
              )}

              {/* ── 商品报备 ── */}
              {form.type === 'product' && (
                <>
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>报备商品 *（多选，仅显示您经营的品牌{partner?.mainBrands?.length ? `：${partner.mainBrands.join('、')}` : ''}）</label>
                    <ProductPicker
                      products={myBrandProducts}
                      selected={form.productNames}
                      onToggle={(name) => setForm((f) => ({ ...f, productNames: f.productNames.includes(name) ? f.productNames.filter((x) => x !== name) : [...f.productNames, name] }))}
                    />
                  </div>

                  {/* 报备地区（复选树） */}
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>报备地区 *（可复选：多个省 / 市 / 县，或全国）</label>
                    <RegionTree form={form} setForm={setForm} treeOpen={treeOpen} setTreeOpen={setTreeOpen} toggleRegion={toggleRegion} covered={covered} regionChecked={regionChecked} />
                  </div>
                </>
              )}

              {/* ── 地区报备 ── */}
              {form.type === 'region' && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <div style={{ padding: '10px 12px', background: '#FFF8E1', borderRadius: 9, fontSize: 12.5, color: '#B26A00', lineHeight: 1.7, marginBottom: 'var(--space-3)' }}>
                    地区报备：该客户在所选地区的<strong>全部订单</strong>都将报备匹配给贵司，其中既有贵司经营的品牌，也有未经营的品牌（未经营品牌可协同其他供货商履约）。
                  </div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>报备地区 *（可复选：多个省 / 市 / 县，或全国）</label>
                  <RegionTree form={form} setForm={setForm} treeOpen={treeOpen} setTreeOpen={setTreeOpen} toggleRegion={toggleRegion} covered={covered} regionChecked={regionChecked} />
                </div>
              )}

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>报备说明 *</label>
                <textarea className="filter-input" placeholder="请输入报备说明（客户背景、沟通情况等）" value={form.summary}
                  onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} style={{ width: '100%', minHeight: 70, resize: 'vertical', padding: '10px 12px' }} />
              </div>

              {formErr && <div style={{ fontSize: 'var(--text-sm)', color: '#C62828', marginBottom: 'var(--space-3)' }}>{formErr}</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', flexShrink: 0, marginTop: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>取消</Button>
              <Button onClick={submitReport}>提交报备</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 地区复选树（全国 + 省/市/县三级，勾选上级后下级禁用） */
function RegionTree({ treeOpen, setTreeOpen, toggleRegion, covered, regionChecked }: {
  form: ReportForm;
  setForm: React.Dispatch<React.SetStateAction<ReportForm>>;
  treeOpen: TreeOpen;
  setTreeOpen: React.Dispatch<React.SetStateAction<TreeOpen>>;
  toggleRegion: (path: string) => void;
  covered: (path: string) => boolean;
  regionChecked: (path: string) => boolean;
}) {
  return (
    <div style={{ border: '1px solid var(--pk-line)', borderRadius: 10, maxHeight: 300, overflowY: 'auto' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--pk-line)', background: regionChecked('全国') ? 'var(--pk-accent-soft)' : 'transparent', cursor: 'pointer' }}>
        <input type="checkbox" checked={regionChecked('全国')} onChange={() => toggleRegion('全国')} />
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>全国（全部地区）</span>
      </label>
      {PROVINCE_NAMES.map((pv) => {
        const provOpen = treeOpen.prov === pv;
        const cities = getCities(pv);
        return (
          <div key={pv} style={{ borderBottom: '1px solid var(--color-neutral-100)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: provOpen ? 'var(--color-neutral-50)' : 'transparent' }}>
              <button type="button" onClick={() => setTreeOpen((t) => ({ ...t, prov: provOpen ? '' : pv, city: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-400)', display: 'inline-flex', padding: 0, width: 14 }} title={provOpen ? '收起' : '展开市/县'}>
                <svg viewBox="0 0 16 16" fill="none" style={{ width: 11, height: 11, transform: provOpen ? 'rotate(90deg)' : 'none' }}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', flex: 1 }}>
                <input type="checkbox" checked={regionChecked(pv)} disabled={covered(pv) && !regionChecked(pv)} onChange={() => toggleRegion(pv)} />
                {pv}（全省）
              </label>
            </div>
            {provOpen && (
              <div style={{ background: 'var(--color-neutral-50)', padding: '2px 0 6px' }}>
                {cities.map((ct) => {
                  const cityPath = `${pv}/${ct.name}`;
                  const cityOpen = treeOpen.city === cityPath;
                  const districts = getDistricts(pv, ct.name);
                  return (
                    <div key={cityPath}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 32px' }}>
                        <button type="button" onClick={() => setTreeOpen((t) => ({ ...t, city: cityOpen ? '' : cityPath }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-400)', display: 'inline-flex', padding: 0, width: 12 }} title="展开区县">
                          <svg viewBox="0 0 16 16" fill="none" style={{ width: 10, height: 10, transform: cityOpen ? 'rotate(90deg)' : 'none' }}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, cursor: 'pointer', flex: 1 }}>
                          <input type="checkbox" checked={regionChecked(cityPath)} disabled={covered(cityPath) && !regionChecked(cityPath)} onChange={() => toggleRegion(cityPath)} />
                          {ct.name}（全市）
                        </label>
                      </div>
                      {cityOpen && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '2px 12px 6px 52px' }}>
                          {districts.map((dt) => {
                            const distPath = `${cityPath}/${dt}`;
                            return (
                              <label key={distPath} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', color: regionChecked(distPath) ? 'var(--pk-accent-dark)' : 'inherit', fontWeight: regionChecked(distPath) ? 600 : 400 }}>
                                <input type="checkbox" checked={regionChecked(distPath)} disabled={covered(distPath) && !regionChecked(distPath)} onChange={() => toggleRegion(distPath)} />
                                {dt}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
