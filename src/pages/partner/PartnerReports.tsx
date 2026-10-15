import { useState, useMemo } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { PageHead, Pill, REPORT_STATUS_TONE, REPORT_TYPE_TONE } from './PartnerUI';
import { useReportStore } from '../../stores/reportStore';
import type { PartnerOrderReportKind, PartnerReport, PartnerReportType } from '../../types';
import {
  platformOrders, partnerProfile,
  PARTNER_REPORT_TYPE_LABELS, PARTNER_REPORT_STATUS_LABELS, PARTNER_ORDER_KIND_LABELS,
  REPORT_PRODUCT_OPTIONS, REPORT_REGION_OPTIONS, REPORT_CUSTOMER_OPTIONS, CUSTOMER_REPORT_OPTIONS,
} from '../../data/partner';

/** 报备类型 Tab 配置 */
const TYPE_TABS: { key: PartnerReportType | 'all'; label: string }[] = [
  { key: 'all', label: '全部报备' },
  { key: 'order', label: '订单报备' },
  { key: 'product', label: '商品报备' },
  { key: 'customer', label: '客户报备' },
];

/** 新增报备表单 */
interface ReportForm {
  type: PartnerReportType;
  /** 订单报备：自营 / 商机 */
  orderKind: PartnerOrderReportKind;
  /** 订单报备：关联的平台订单编号 */
  relatedOrderCode: string;
  /** 商品报备 */
  productName: string;
  region: string;
  customer: string;
  /** 客户报备 */
  targetCustomer: string;
  title: string;
  summary: string;
  amount: string;
}

const EMPTY_FORM: ReportForm = {
  type: 'order', orderKind: 'self', relatedOrderCode: '',
  productName: '', region: '全部地区', customer: '全部客户', targetCustomer: '',
  title: '', summary: '', amount: '',
};

/** 合作商报备管理：主动报备订单 / 商品 / 客户，提交至淡茶半盏管理台审批 */
export default function PartnerReports() {
  const reports = useReportStore((s) => s.reports);
  const submitReportAction = useReportStore((s) => s.submitReport);
  const [activeTab, setActiveTab] = useState<PartnerReportType | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<PartnerReport | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<ReportForm>(EMPTY_FORM);

  const filtered = useMemo(() => reports.filter(r => {
    if (activeTab !== 'all' && r.type !== activeTab) return false;
    if (keyword && !r.code.includes(keyword) && !r.title.includes(keyword) && !r.summary.includes(keyword)) return false;
    return true;
  }), [reports, activeTab, keyword]);

  const tabCount = (key: PartnerReportType | 'all') => key === 'all' ? reports.length : reports.filter(r => r.type === key).length;

  /* ── 表单联动 ── */

  const handleTypeChange = (type: PartnerReportType) => setForm(f => ({ ...f, type }));

  const handleOrderKindChange = (kind: PartnerOrderReportKind) => setForm(f => {
    const po = platformOrders.find(o => o.code === f.relatedOrderCode);
    return {
      ...f, orderKind: kind,
      title: po ? `${po.customerName}订单报备（${PARTNER_ORDER_KIND_LABELS[kind]}）` : f.title,
    };
  });

  const handleOrderSelect = (code: string) => setForm(f => {
    const po = platformOrders.find(o => o.code === code);
    return {
      ...f, relatedOrderCode: code,
      amount: po ? String(po.totalAmount) : '',
      title: po ? `${po.customerName}订单报备（${PARTNER_ORDER_KIND_LABELS[f.orderKind]}）` : f.title,
    };
  });

  const handleProductSelect = (name: string) => setForm(f => ({
    ...f, productName: name,
    title: name ? `${name}商品报备（${f.region} · ${f.customer}）` : '',
  }));

  const handleRegionSelect = (region: string) => setForm(f => ({
    ...f, region,
    title: f.productName ? `${f.productName}商品报备（${region} · ${f.customer}）` : f.title,
  }));

  const handleCustomerScopeSelect = (customer: string) => setForm(f => ({
    ...f, customer,
    title: f.productName ? `${f.productName}商品报备（${f.region} · ${customer}）` : f.title,
  }));

  const handleTargetCustomerSelect = (name: string) => setForm(f => ({
    ...f, targetCustomer: name,
    title: name ? `${name}客户报备` : '',
  }));

  /* ── 提交 ── */

  const canSubmit =
    form.title.trim() !== '' &&
    form.summary.trim() !== '' &&
    (form.type !== 'order' || form.relatedOrderCode !== '') &&
    (form.type !== 'product' || form.productName !== '') &&
    (form.type !== 'customer' || form.targetCustomer !== '');

  const submitReport = () => {
    if (!canSubmit) return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const report: PartnerReport = {
      id: `pr_${Date.now()}`,
      code: `BB${now.getFullYear()}${pad(now.getMonth() + 1)}${String(reports.length + 1).padStart(3, '0')}`,
      type: form.type,
      title: form.title.trim(),
      summary: form.summary.trim(),
      amount: form.type === 'order' && form.amount ? Number(form.amount) : undefined,
      status: 'pending',
      submitTime: `${dateStr} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
      partnerName: partnerProfile.name,
      ...(form.type === 'order' ? { orderKind: form.orderKind, relatedOrderCode: form.relatedOrderCode } : {}),
      ...(form.type === 'product' ? {
        productName: form.productName,
        productSpec: REPORT_PRODUCT_OPTIONS.find(p => p.name === form.productName)?.spec,
        region: form.region,
        customer: form.customer,
      } : {}),
      ...(form.type === 'customer' ? { targetCustomer: form.targetCustomer } : {}),
    };
    submitReportAction(report);
    setShowAdd(false);
    setForm(EMPTY_FORM);
  };

  const statusPill = (status: string) => (
    <Pill tone={REPORT_STATUS_TONE[status]}>{PARTNER_REPORT_STATUS_LABELS[status]}</Pill>
  );

  /** 报备对象摘要 */
  const targetText = (r: PartnerReport) => {
    if (r.type === 'order') return `订单 ${r.relatedOrderCode ?? '—'}`;
    if (r.type === 'product') return `${r.productName} · ${r.region} · ${r.customer}`;
    return r.targetCustomer ?? '—';
  };

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 订单"
        title="报备管理"
        desc="主动报备订单、商品与客户，提交后由淡茶半盏管理台审批。审批通过后：自营订单报备的订单转我方履约，商机订单报备的订单同步展示（平台进货发货），商品/客户报备命中的新订单自动转给我方。"
        actions={
          <Button onClick={() => { setForm(EMPTY_FORM); setShowAdd(true); }}>
            <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            新增报备
          </Button>
        }
      />

      {/* 报备类型 Tab */}
      <div className="pk-tabs">
        {TYPE_TABS.map(t => (
          <button
            key={t.key}
            className={`pk-tab${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            <span className="pk-tab-n">{tabCount(t.key)}</span>
          </button>
        ))}
      </div>

      {/* 工具栏 */}
      <div className="pk-toolbar">
        <input className="filter-input" placeholder="搜索报备编号、标题、内容..." value={keyword} onChange={e => setKeyword(e.target.value)} />
        <span className="pk-count">共 {filtered.length} 条</span>
      </div>

      <div className="pk-table-panel">
        <Table
          headers={['报备编号', '类型', '标题', '报备对象', '预计金额', '状态', '提交时间', '操作']}
          rows={filtered.map(r => [
            <span key="code" className="cell-mono-emph">{r.code}</span>,
            <div key="type" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Pill tone={REPORT_TYPE_TONE[r.type]}>{PARTNER_REPORT_TYPE_LABELS[r.type]}</Pill>
              {r.type === 'order' && <Pill tone={r.orderKind === 'self' ? 'green' : 'gray'}>{PARTNER_ORDER_KIND_LABELS[r.orderKind ?? 'self']}</Pill>}
            </div>,
            <span key="title" className="cell-emph">{r.title}</span>,
            <span key="target" style={{ fontSize: 13, color: 'var(--pk-ink2)' }}>{targetText(r)}</span>,
            r.amount != null
              ? <span key="amt" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>¥{r.amount.toLocaleString()}</span>
              : <span key="amt" style={{ color: 'var(--color-neutral-300)' }}>—</span>,
            statusPill(r.status),
            <span key="time" className="cell-muted">{r.submitTime}</span>,
            <div key="act" className="row-actions">
              <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>查看</Button>
            </div>,
          ])}
        />
      </div>

      {/* 报备详情抽屉 */}
      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        badge="BB"
        title={selected?.title ?? ''}
        statusTag={selected ? statusPill(selected.status) : null}
        subtitle={selected ? `${selected.code} · ${PARTNER_REPORT_TYPE_LABELS[selected.type]}${selected.type === 'order' ? `（${PARTNER_ORDER_KIND_LABELS[selected.orderKind ?? 'self']}）` : ''} · ${selected.submitTime}` : ''}
      >
        {selected && (
          <>
            <DrawerSection title="报备信息">
              <InfoGrid>
                <InfoItem label="报备编号" mono emph>{selected.code}</InfoItem>
                <InfoItem label="报备类型">{PARTNER_REPORT_TYPE_LABELS[selected.type]}</InfoItem>
                {selected.type === 'order' && <InfoItem label="报备模式">{PARTNER_ORDER_KIND_LABELS[selected.orderKind ?? 'self']}</InfoItem>}
                <InfoItem label="提交时间">{selected.submitTime}</InfoItem>
                <InfoItem label="报备状态">{PARTNER_REPORT_STATUS_LABELS[selected.status]}</InfoItem>
                {selected.amount != null && <InfoItem label="预计金额" mono>¥{selected.amount.toLocaleString()}</InfoItem>}
                {selected.reviewTime && <InfoItem label="审批时间">{selected.reviewTime}</InfoItem>}
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="报备对象">
              <InfoGrid>
                {selected.type === 'order' && (
                  <InfoItem label="关联订单编号" mono emph span={3}>{selected.relatedOrderCode}</InfoItem>
                )}
                {selected.type === 'product' && (
                  <>
                    <InfoItem label="报备商品" emph>{selected.productName}</InfoItem>
                    <InfoItem label="商品规格">{selected.productSpec}</InfoItem>
                    <InfoItem label="报备区域">{selected.region}</InfoItem>
                    <InfoItem label="报备客户范围" span={3}>{selected.customer}</InfoItem>
                  </>
                )}
                {selected.type === 'customer' && (
                  <InfoItem label="报备客户" emph span={3}>{selected.targetCustomer}</InfoItem>
                )}
                <InfoItem label="报备标题" span={3}>{selected.title}</InfoItem>
                <InfoItem label="报备内容" span={3}>{selected.summary}</InfoItem>
                <InfoItem label="审批意见" span={3}>{selected.reviewNote || '待审核'}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="流转说明">
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', lineHeight: 1.8 }}>
                {selected.status !== 'approved' && '报备提交后由淡茶半盏管理台（销售 > 报备管理）审批，审批结果将同步显示在此。'}
                {selected.status === 'approved' && selected.type === 'order' && selected.orderKind === 'self' && '已通过：关联订单已自动转入「订单管理」，由我方履约。'}
                {selected.status === 'approved' && selected.type === 'order' && selected.orderKind === 'opportunity' && '已通过：关联订单已同步至「订单管理」展示，由平台进货发货处理。'}
                {selected.status === 'approved' && selected.type === 'product' && '已通过：报备商品在报备区域与客户范围内命中的新订单，自动转入「订单管理」。'}
                {selected.status === 'approved' && selected.type === 'customer' && '已通过：报备客户的新订单自动转入「订单管理」。'}
              </div>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>

      {/* 新增报备弹窗 */}
      {showAdd && (
        <div className="category-dialog-overlay" onClick={() => setShowAdd(false)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ width: 560 }}>
            <div className="pk-dialog-title">新增报备</div>

            {/* 报备类型 */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>报备类型 *</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {(['order', 'product', 'customer'] as PartnerReportType[]).map(t => (
                  <button key={t} onClick={() => handleTypeChange(t)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: '9px', fontSize: 'var(--text-sm)', cursor: 'pointer',
                      border: `1px solid ${form.type === t ? 'var(--pk-accent)' : 'var(--pk-line)'}`,
                      background: form.type === t ? 'var(--pk-accent-soft)' : '#fff',
                      color: form.type === t ? 'var(--pk-accent-dark)' : 'var(--pk-ink2)',
                      fontWeight: form.type === t ? 600 : 400,
                    }}>{PARTNER_REPORT_TYPE_LABELS[t]}</button>
                ))}
              </div>
            </div>

            {/* 订单报备：模式 + 关联订单 */}
            {form.type === 'order' && (
              <>
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>报备模式 *</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {(['self', 'opportunity'] as PartnerOrderReportKind[]).map(k => (
                      <button key={k} onClick={() => handleOrderKindChange(k)}
                        style={{
                          flex: 1, padding: '9px 0', borderRadius: '9px', fontSize: 'var(--text-sm)', cursor: 'pointer',
                          border: `1px solid ${form.orderKind === k ? 'var(--pk-accent)' : 'var(--pk-line)'}`,
                          background: form.orderKind === k ? 'var(--pk-accent-soft)' : '#fff',
                          color: form.orderKind === k ? 'var(--pk-accent-dark)' : 'var(--pk-ink2)',
                          fontWeight: form.orderKind === k ? 600 : 400,
                        }}>
                        {PARTNER_ORDER_KIND_LABELS[k]}
                        <div style={{ fontSize: 11, fontWeight: 400, marginTop: 3, opacity: 0.75 }}>
                          {k === 'self' ? '订单转我方履约' : '平台进货发货'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>关联订单 *</label>
                  <select className="filter-select" value={form.relatedOrderCode} onChange={e => handleOrderSelect(e.target.value)} style={{ width: '100%' }}>
                    <option value="">请选择要报备的客户订单</option>
                    {platformOrders.map(po => (
                      <option key={po.id} value={po.code}>{po.code} · {po.customerName} · {po.items.map(it => it.productName).join('/')} · ¥{po.totalAmount.toLocaleString()}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* 商品报备：商品 + 区域 + 客户范围 */}
            {form.type === 'product' && (
              <>
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>报备商品 *</label>
                  <select className="filter-select" value={form.productName} onChange={e => handleProductSelect(e.target.value)} style={{ width: '100%' }}>
                    <option value="">请选择商品</option>
                    {REPORT_PRODUCT_OPTIONS.map(p => (
                      <option key={p.name} value={p.name}>{p.name}（{p.spec}）</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>报备区域 *</label>
                    <select className="filter-select" value={form.region} onChange={e => handleRegionSelect(e.target.value)} style={{ width: '100%' }}>
                      {REPORT_REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>报备客户 *</label>
                    <select className="filter-select" value={form.customer} onChange={e => handleCustomerScopeSelect(e.target.value)} style={{ width: '100%' }}>
                      {REPORT_CUSTOMER_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* 客户报备：客户 */}
            {form.type === 'customer' && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>报备客户 *</label>
                <select className="filter-select" value={form.targetCustomer} onChange={e => handleTargetCustomerSelect(e.target.value)} style={{ width: '100%' }}>
                  <option value="">请选择客户</option>
                  {CUSTOMER_REPORT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>标题 *</label>
              <input className="filter-input" placeholder="请输入报备标题" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} style={{ width: '100%' }} />
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>详细说明 *</label>
              <textarea className="filter-input" placeholder="请输入报备详细说明" value={form.summary}
                onChange={e => setForm({ ...form, summary: e.target.value })} style={{ width: '100%', minHeight: 90, resize: 'vertical', padding: '10px 12px' }} />
            </div>

            {form.type === 'order' && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>预计金额（元）</label>
                <input className="filter-input" type="number" placeholder="选择订单后自动带出" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })} style={{ width: '100%' }} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>取消</Button>
              <Button onClick={submitReport} disabled={!canSubmit}>提交报备</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
