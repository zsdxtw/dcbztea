import { useState, useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Tag from '../../components/common/Tag';
import StatusTag from '../../components/common/StatusTag';
import FilterBar from '../../components/business/FilterBar';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { TeaCategory, QuotationStatus } from '../../types';
import type { StatusVariant } from '../../types';
import { PRICE_CUSTOMERS, vipPriceRules, getVipPrice, getSalesDefaultPrice } from '../../data/prices';
import { teaProducts } from '../../data/teaProducts';

/* ── 工具函数：从 category 字符串提取茶类枚举 ── */
function nameToTeaCategory(name: string): TeaCategory | undefined {
  const map: Record<string, TeaCategory> = {
    '绿茶': TeaCategory.GREEN, '红茶': TeaCategory.RED, '青茶': TeaCategory.OOLONG,
    '白茶': TeaCategory.WHITE, '黄茶': TeaCategory.YELLOW, '黑茶': TeaCategory.DARK,
    '花草茶': TeaCategory.FLOWER,
  };
  return map[name];
}

/* ── 报价状态映射 ── */
function quotationStatusToVariant(status: QuotationStatus): StatusVariant {
  switch (status) {
    case QuotationStatus.PENDING_REPLY: return 'warning';
    case QuotationStatus.QUOTED: return 'info';
    case QuotationStatus.EXPIRED: return 'error';
    case QuotationStatus.CONVERTED: return 'success';
    default: return 'info';
  }
}

function quotationStatusLabel(status: QuotationStatus): string {
  switch (status) {
    case QuotationStatus.PENDING_REPLY: return '待回复';
    case QuotationStatus.QUOTED: return '已报价';
    case QuotationStatus.EXPIRED: return '已过期';
    case QuotationStatus.CONVERTED: return '已转化';
    default: return status;
  }
}

/* ── 价格来源标签 ── */
function priceSourceLabel(source: 'vip' | 'sales' | 'market'): string {
  switch (source) {
    case 'vip': return 'VIP价';
    case 'sales': return '销售价';
    case 'market': return '市场价';
  }
}

function priceSourceStyle(source: 'vip' | 'sales' | 'market') {
  switch (source) {
    case 'vip': return { bg: '#F3E8FF', color: '#7C3AED', border: '#D8B4FE' };
    case 'sales': return { bg: '#DBEAFE', color: '#1565C0', border: '#93C5FD' };
    case 'market': return { bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' };
  }
}

/* ── 格式化金额（千分位） ── */
function formatAmount(value: number): string {
  return value.toLocaleString('zh-CN');
}

/* ── 报价记录接口 ── */
interface SalesQuotation {
  id: string;
  quotationCode: string;
  customerId: string;
  customer: string;
  productId: string;
  product: string;
  teaCategory: TeaCategory;
  grade: string;
  marketPrice: number;
  salesPrice: number;
  vipPrice: number | null;
  priceSource: 'vip' | 'sales' | 'market';
  unitPrice: number;
  quantity: number;
  amount: number;
  validFrom: string;
  validUntil: string;
  status: QuotationStatus;
  remark: string;
}

/* ── 生成初始报价数据（联动价格体系） ── */
function createInitialQuotations(): SalesQuotation[] {
  const seeds: { productId: string; customerId: string; quantity: number; validFrom: string; validUntil: string; status: QuotationStatus; remark: string }[] = [
    { productId: '1', customerId: 'c1', quantity: 50, validFrom: '2026-06-01', validUntil: '2026-07-15', status: QuotationStatus.PENDING_REPLY, remark: '春茶批量询价' },
    { productId: '7', customerId: 'c2', quantity: 30, validFrom: '2026-06-01', validUntil: '2026-07-20', status: QuotationStatus.QUOTED, remark: '高端礼品茶询价' },
    { productId: '11', customerId: 'c3', quantity: 80, validFrom: '2026-05-01', validUntil: '2026-06-15', status: QuotationStatus.EXPIRED, remark: '企业采购询价，已过期' },
    { productId: '13', customerId: 'c4', quantity: 20, validFrom: '2026-06-10', validUntil: '2026-07-25', status: QuotationStatus.CONVERTED, remark: '白茶收藏询价，已转订单' },
    { productId: '16', customerId: 'c5', quantity: 15, validFrom: '2026-06-05', validUntil: '2026-07-22', status: QuotationStatus.QUOTED, remark: '黄茶礼盒询价' },
    { productId: '18', customerId: 'c6', quantity: 100, validFrom: '2026-06-01', validUntil: '2026-07-18', status: QuotationStatus.PENDING_REPLY, remark: '普洱批量采购询价' },
    { productId: '21', customerId: 'c7', quantity: 60, validFrom: '2026-06-08', validUntil: '2026-07-16', status: QuotationStatus.QUOTED, remark: '茉莉花茶直播带货询价' },
    { productId: '10', customerId: 'c8', quantity: 40, validFrom: '2026-06-03', validUntil: '2026-07-28', status: QuotationStatus.PENDING_REPLY, remark: '大红袍岩茶询价' },
  ];
  return seeds.map((s, i) => {
    const product = teaProducts.find(p => p.id === s.productId)!;
    const customer = PRICE_CUSTOMERS.find(c => c.id === s.customerId)!;
    const vipRule = getVipPrice(s.productId, s.customerId);
    const { price, source } = getSalesDefaultPrice(s.productId, s.customerId);
    return {
      id: String(i + 1),
      quotationCode: `QT2026060${i + 1}`,
      customerId: customer.id,
      customer: customer.name,
      productId: product.id,
      product: product.name,
      teaCategory: nameToTeaCategory(product.category.split('-')[0]) ?? TeaCategory.GREEN,
      grade: product.grade,
      marketPrice: product.marketPrice,
      salesPrice: product.salesPrice,
      vipPrice: vipRule ? vipRule.vipPrice : null,
      priceSource: source,
      unitPrice: price,
      quantity: s.quantity,
      amount: price * s.quantity,
      validFrom: s.validFrom,
      validUntil: s.validUntil,
      status: s.status,
      remark: s.remark,
    };
  });
}

/* ── 新建报价表单状态 ── */
interface QuotationForm {
  customerId: string;
  productId: string;
  defaultPrice: number;
  priceSource: 'vip' | 'sales' | 'market';
  unitPrice: string;
  quantity: string;
  validUntil: string;
  remark: string;
}

const EMPTY_FORM: QuotationForm = {
  customerId: '', productId: '', defaultPrice: 0, priceSource: 'market',
  unitPrice: '', quantity: '', validUntil: '', remark: '',
};

/* ── 筛选选项 ── */
const STATUS_OPTIONS = ['全部状态', '待回复', '已报价', '已过期', '已转化'];
const CATEGORY_OPTIONS = ['全部茶类', '绿茶', '白茶', '黄茶', '青茶', '红茶', '黑茶', '花草茶'];
const CUSTOMER_OPTIONS = ['全部客户', ...PRICE_CUSTOMERS.map(c => c.name)];

/** 报价管理页面 */
export default function SalesQuotations() {
  const [quotations, setQuotations] = useState<SalesQuotation[]>(createInitialQuotations);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showFormDrawer, setShowFormDrawer] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<SalesQuotation | null>(null);
  const [form, setForm] = useState<QuotationForm>(EMPTY_FORM);

  /* ── 筛选状态 ── */
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部状态');
  const [categoryFilter, setCategoryFilter] = useState('全部茶类');
  const [customerFilter, setCustomerFilter] = useState('全部客户');

  /* ── 统计数据（动态计算） ── */
  const stats = useMemo(() => {
    const pendingReply = quotations.filter(q => q.status === QuotationStatus.PENDING_REPLY).length;
    const quoted = quotations.filter(q => q.status === QuotationStatus.QUOTED).length;
    const expired = quotations.filter(q => q.status === QuotationStatus.EXPIRED).length;
    const converted = quotations.filter(q => q.status === QuotationStatus.CONVERTED).length;
    const total = quotations.length;
    const conversionRate = total > 0 ? (converted / total * 100) : 0;
    return { pendingReply, quoted, expired, conversionRate };
  }, [quotations]);

  /* ── 筛选后的报价列表 ── */
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        if (!q.quotationCode.toLowerCase().includes(kw) &&
            !q.customer.toLowerCase().includes(kw) &&
            !q.product.toLowerCase().includes(kw)) return false;
      }
      if (statusFilter !== '全部状态' && quotationStatusLabel(q.status) !== statusFilter) return false;
      if (customerFilter !== '全部客户' && q.customer !== customerFilter) return false;
      if (categoryFilter !== '全部茶类') {
        const teaLabelMap: Record<TeaCategory, string> = {
          [TeaCategory.GREEN]: '绿茶', [TeaCategory.RED]: '红茶', [TeaCategory.OOLONG]: '青茶',
          [TeaCategory.WHITE]: '白茶', [TeaCategory.YELLOW]: '黄茶', [TeaCategory.DARK]: '黑茶',
          [TeaCategory.FLOWER]: '花草茶',
        };
        if (teaLabelMap[q.teaCategory] !== categoryFilter) return false;
      }
      return true;
    });
  }, [quotations, searchKeyword, statusFilter, categoryFilter, customerFilter]);

  const handleView = (quotation: SalesQuotation) => {
    setSelectedQuotation(quotation);
    setShowDetailDrawer(true);
  };

  const handleCloseDetailDrawer = () => {
    setShowDetailDrawer(false);
    setSelectedQuotation(null);
  };

  const handleOpenForm = () => {
    setForm(EMPTY_FORM);
    setShowFormDrawer(true);
  };

  const handleCloseForm = () => {
    setShowFormDrawer(false);
    setForm(EMPTY_FORM);
  };

  /** 选择商品+客户后自动带出价格（VIP价 > 销售价 > 市场价） */
  const handleProductCustomerChange = (next: Partial<QuotationForm>) => {
    const merged = { ...form, ...next };
    if (merged.productId && merged.customerId) {
      const { price, source } = getSalesDefaultPrice(merged.productId, merged.customerId);
      merged.defaultPrice = price;
      merged.priceSource = source;
      merged.unitPrice = String(price);
    } else {
      merged.defaultPrice = 0;
      merged.priceSource = 'market';
      merged.unitPrice = '';
    }
    setForm(merged);
  };

  /** 提交新建报价 */
  const handleSubmitForm = () => {
    if (!form.customerId || !form.productId || !form.unitPrice || !form.quantity) return;
    const customer = PRICE_CUSTOMERS.find(c => c.id === form.customerId);
    const product = teaProducts.find(p => p.id === form.productId);
    if (!customer || !product) return;

    const unitPrice = Number(form.unitPrice);
    const quantity = Number(form.quantity);
    const vipRule = getVipPrice(form.productId, form.customerId);
    const today = new Date().toISOString().slice(0, 10);
    const newId = String(quotations.length + 1);
    const newCode = `QT202606${String(quotations.length + 9).padStart(3, '0')}`;

    const newQuotation: SalesQuotation = {
      id: newId,
      quotationCode: newCode,
      customerId: customer.id,
      customer: customer.name,
      productId: product.id,
      product: product.name,
      teaCategory: nameToTeaCategory(product.category.split('-')[0]) ?? TeaCategory.GREEN,
      grade: product.grade,
      marketPrice: product.marketPrice,
      salesPrice: product.salesPrice,
      vipPrice: vipRule ? vipRule.vipPrice : null,
      priceSource: form.priceSource,
      unitPrice,
      quantity,
      amount: unitPrice * quantity,
      validFrom: today,
      validUntil: form.validUntil || '2026-12-31',
      status: QuotationStatus.PENDING_REPLY,
      remark: form.remark,
    };
    setQuotations([newQuotation, ...quotations]);
    handleCloseForm();
  };

  const formAmount = (Number(form.unitPrice) || 0) * (Number(form.quantity) || 0);
  const canSubmit = form.customerId && form.productId && form.unitPrice && form.quantity;

  return (
    <>
      <ContentHeader
        title="报价管理"
        breadcrumbs={['销售', '报价管理']}
        actions={<Button onClick={handleOpenForm}><PlusIcon />新建报价</Button>}
      />
      <div className="content-body">
        {/* 统计卡片 */}
        <div className="stat-cards">
          <StatCard data={{
            label: '待回复', value: String(stats.pendingReply), unit: '单',
            icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
          }} />
          <StatCard data={{
            label: '已报价', value: String(stats.quoted), unit: '单',
            icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="2" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M6 6h6M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
          }} />
          <StatCard data={{
            label: '已过期', value: String(stats.expired), unit: '单',
            icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M6 6l6 6M12 6l-6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
          }} />
          <StatCard data={{
            label: '转化率', value: stats.conversionRate.toFixed(1), unit: '%',
            icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 14l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
          }} />
        </div>

        {/* 筛选栏 */}
        <FilterBar>
          <input className="filter-input" placeholder="搜索报价单号、客户、商品..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} />
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select className="filter-select" value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
            {CUSTOMER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </FilterBar>

        {/* 报价列表 */}
        <Card>
          <Table
            headers={['报价单号', '客户', '商品', '茶类', '品级', '价格来源', '单价(元)', '数量', '金额(元)', '有效期', '状态', '操作']}
            rows={filteredQuotations.map((q) => {
              const ps = priceSourceStyle(q.priceSource);
              return [
                <span className="mono">{q.quotationCode}</span>,
                q.customer,
                q.product,
                <Tag category={q.teaCategory} />,
                q.grade,
                <span style={{
                  padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-medium)', background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`,
                }}>{priceSourceLabel(q.priceSource)}</span>,
                <span className="mono">{formatAmount(q.unitPrice)}</span>,
                <span className="mono">{q.quantity}</span>,
                <span className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{formatAmount(q.amount)}</span>,
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{q.validUntil}</span>,
                <StatusTag variant={quotationStatusToVariant(q.status)} label={quotationStatusLabel(q.status)} />,
                <div className="row-actions">
                  <Button size="sm" variant="ghost" onClick={() => handleView(q)}>查看</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleView(q)}>编辑</Button>
                </div>,
              ];
            })}
          />
        </Card>
      </div>

      {/* 报价详情抽屉 */}
      <DetailDrawer
        open={showDetailDrawer && !!selectedQuotation}
        onClose={handleCloseDetailDrawer}
        badge="SV"
        title={selectedQuotation?.quotationCode}
        statusTag={selectedQuotation && <StatusTag variant={quotationStatusToVariant(selectedQuotation.status)} label={quotationStatusLabel(selectedQuotation.status)} />}
        subtitle={selectedQuotation && `${selectedQuotation.customer} · ${selectedQuotation.validFrom} ~ ${selectedQuotation.validUntil}`}
        mode="view"
      >
        {selectedQuotation && (
          <>
            <DrawerSection title="客户信息">
              <InfoGrid cols={3}>
                <InfoItem label="客户名称" emph>{selectedQuotation.customer}</InfoItem>
                <InfoItem label="报价单号" emph mono>{selectedQuotation.quotationCode}</InfoItem>
                <InfoItem label="有效期起">{selectedQuotation.validFrom}</InfoItem>
                <InfoItem label="有效期止">{selectedQuotation.validUntil}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="报价详情">
              <InfoGrid cols={3}>
                <InfoItem label="商品名称" emph>{selectedQuotation.product}</InfoItem>
                <InfoItem label="茶类"><Tag category={selectedQuotation.teaCategory} /></InfoItem>
                <InfoItem label="品级">{selectedQuotation.grade}</InfoItem>
                <InfoItem label="价格来源">
                  {(() => {
                    const ps = priceSourceStyle(selectedQuotation.priceSource);
                    return (
                      <span style={{
                        padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--font-medium)', background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`,
                      }}>{priceSourceLabel(selectedQuotation.priceSource)}</span>
                    );
                  })()}
                </InfoItem>
                <InfoItem label="报价单价" mono>¥{formatAmount(selectedQuotation.unitPrice)}</InfoItem>
                <InfoItem label="数量" mono>{selectedQuotation.quantity}</InfoItem>
                <InfoItem label="金额" mono valueStyle={{ color: 'var(--color-module-current-base)', fontWeight: 'var(--font-bold)' }}>¥{formatAmount(selectedQuotation.amount)}</InfoItem>
                <InfoItem label="状态"><StatusTag variant={quotationStatusToVariant(selectedQuotation.status)} label={quotationStatusLabel(selectedQuotation.status)} /></InfoItem>
                <InfoItem label="备注" span={3}>{selectedQuotation.remark || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="价格对比">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {(() => {
                  const rows: { label: string; price: number; isCurrent?: boolean; isQuote?: boolean }[] = [
                    { label: '市场价', price: selectedQuotation.marketPrice },
                    { label: '标准销售价', price: selectedQuotation.salesPrice },
                  ];
                  if (selectedQuotation.vipPrice !== null) {
                    rows.push({ label: 'VIP价', price: selectedQuotation.vipPrice });
                  }
                  rows.push({ label: '本次报价', price: selectedQuotation.unitPrice, isQuote: true });
                  return rows.map((row, i) => {
                    const discount = row.label !== '市场价' && selectedQuotation.marketPrice > 0
                      ? ((row.price - selectedQuotation.marketPrice) / selectedQuotation.marketPrice * 100).toFixed(1)
                      : null;
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                        padding: 'var(--space-3)',
                        background: row.isQuote ? 'var(--color-module-current-lightest)' : 'var(--color-bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        border: row.isQuote ? '1px solid var(--color-module-current-light)' : '1px solid transparent',
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 'var(--radius-md)',
                          background: row.isQuote ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)',
                          color: row.isQuote ? '#fff' : 'var(--color-text-tertiary)',
                          flexShrink: 0,
                        }}>{i + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>{row.label}</span>
                            <span className="mono" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: row.isQuote ? 'var(--color-module-current-base)' : 'var(--color-text-primary)' }}>¥{formatAmount(row.price)}</span>
                            {discount !== null && (
                              <span className="mono" style={{ fontSize: 'var(--text-xs)', color: Number(discount) > 0 ? '#CB405D' : Number(discount) < 0 ? '#01795D' : 'var(--color-text-tertiary)' }}>
                                {Number(discount) > 0 ? '+' : ''}{discount}%
                              </span>
                            )}
                            {row.isQuote && (
                              <span style={{ padding: '0 6px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', background: 'var(--color-module-current-lightest)', color: 'var(--color-module-current-base)', fontWeight: 'var(--font-medium)' }}>报价</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>

      {/* 新建报价抽屉 */}
      {showFormDrawer && (
        <div className="drawer-overlay" onClick={handleCloseForm}>
          <div className="drawer-panel" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-title">新建报价</span>
              <button className="drawer-close" onClick={handleCloseForm}>
                <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div className="drawer-body">
              {/* 客户与商品选择 */}
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">客户 <span style={{ color: '#eb5c20' }}>*</span></label>
                  <select className="detail-select" value={form.customerId} onChange={(e) => handleProductCustomerChange({ customerId: e.target.value })}>
                    <option value="">请选择客户</option>
                    {PRICE_CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}（{c.type}）</option>)}
                  </select>
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">商品 <span style={{ color: '#eb5c20' }}>*</span></label>
                  <select className="detail-select" value={form.productId} onChange={(e) => handleProductCustomerChange({ productId: e.target.value })}>
                    <option value="">请选择商品</option>
                    {teaProducts.map(p => <option key={p.id} value={p.id}>{p.name}（{p.brand}）</option>)}
                  </select>
                </div>
              </div>

              {/* 价格来源与默认价 */}
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">默认价格（自动带出）</label>
                  <input className="detail-input" value={form.defaultPrice ? `¥${formatAmount(form.defaultPrice)}` : ''} readOnly placeholder="选择商品和客户后自动带出" style={{ background: 'var(--color-neutral-100)', color: 'var(--color-text-secondary)' }} />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">价格来源</label>
                  <div style={{ height: 34, display: 'flex', alignItems: 'center' }}>
                    {form.productId && form.customerId ? (
                      (() => {
                        const ps = priceSourceStyle(form.priceSource);
                        return (
                          <span style={{
                            padding: '2px 10px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)',
                            fontWeight: 'var(--font-medium)', background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`,
                          }}>{priceSourceLabel(form.priceSource)}</span>
                        );
                      })()
                    ) : (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>选择后显示</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 报价单价与数量 */}
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">报价单价 <span style={{ color: '#eb5c20' }}>*</span></label>
                  <input className="detail-input" type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} placeholder="请输入报价单价" />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">数量 <span style={{ color: '#eb5c20' }}>*</span></label>
                  <input className="detail-input" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="请输入数量" />
                </div>
              </div>

              {/* 金额与有效期 */}
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">金额（自动计算）</label>
                  <input className="detail-input" value={formAmount ? `¥${formatAmount(formAmount)}` : ''} readOnly placeholder="自动计算" style={{ background: 'var(--color-neutral-100)', color: 'var(--color-module-current-base)', fontWeight: 'var(--font-bold)' }} />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">有效期止</label>
                  <input className="detail-input" type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
                </div>
              </div>

              {/* 备注 */}
              <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">备注</label>
                  <textarea className="detail-textarea" value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} placeholder="请输入备注信息" rows={3} />
                </div>
              </div>

              {/* 价格体系联动提示 */}
              {form.productId && form.customerId && (
                <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-module-current-light)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  {(() => {
                    const product = teaProducts.find(p => p.id === form.productId);
                    const vipRule = getVipPrice(form.productId, form.customerId);
                    if (!product) return null;
                    return (
                      <>
                        <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--color-module-current-base)', marginBottom: 'var(--space-1)' }}>价格体系联动</div>
                        <div>市场价：¥{formatAmount(product.marketPrice)}　|　销售价：¥{formatAmount(product.salesPrice)}　|　VIP价：{vipRule ? `¥${formatAmount(vipRule.vipPrice)}` : '未建立VIP规则'}</div>
                        <div style={{ marginTop: 2 }}>取价优先级：VIP价 &gt; 销售价 &gt; 市场价，当前取价来源：{priceSourceLabel(form.priceSource)}</div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="drawer-footer">
              <Button variant="ghost" onClick={handleCloseForm}>取消</Button>
              <Button onClick={handleSubmitForm} disabled={!canSubmit}>提交报价</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
