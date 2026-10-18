import { useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Tag from '../../components/common/Tag';
import StatusTag from '../../components/common/StatusTag';
import FilterBar, { FilterInput, FilterSelect } from '../../components/business/FilterBar';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { TeaCategory } from '../../types';
import type { StatCardData } from '../../types';
import { PRICE_SUPPLIERS, purchasePriceRules, getPurchasePrice } from '../../data/prices';
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
type PricingStatus = 'pending' | 'confirmed' | 'rejected' | 'expired';

function pricingStatusToVariant(status: PricingStatus) {
  switch (status) {
    case 'confirmed': return 'success' as const;
    case 'pending': return 'warning' as const;
    case 'rejected': return 'error' as const;
    case 'expired': return 'default' as const;
  }
}

function pricingStatusLabel(status: PricingStatus) {
  switch (status) {
    case 'pending': return '待确认';
    case 'confirmed': return '已确认';
    case 'rejected': return '已驳回';
    case 'expired': return '已过期';
  }
}

/* ── 报价类型 ── */
type PricingType = 'first' | 'adjust' | 'renew';

const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  first: '首次报价',
  adjust: '价格调整',
  renew: '到期续价',
};

/* ── Mock 数据 ── */
interface PricingRecord {
  id: string;
  code: string;
  supplier: string;
  supplierId?: string;
  productId?: string;
  product: string;
  teaCategory: TeaCategory;
  originalPrice: number;
  quotedPrice: number;
  unit: string;
  type: PricingType;
  validFrom: string;
  validTo: string;
  status: PricingStatus;
  contactPerson: string;
  contactPhone: string;
  remark: string;
  history: { date: string; price: number; note: string }[];
}

const initialRecords: PricingRecord[] = [
  {
    id: '1', code: 'BJ202606001', supplier: '西湖牌', product: '明前龙井', teaCategory: TeaCategory.GREEN,
    originalPrice: 580, quotedPrice: 560, unit: '元/50g', type: 'adjust',
    validFrom: '2026-06-01', validTo: '2026-08-31', status: 'pending',
    contactPerson: '陈经理', contactPhone: '0571-87654321', remark: '新茶季调价，产量增加',
    history: [
      { date: '2025-09-01', price: 580, note: '秋茶报价' },
      { date: '2026-03-15', price: 600, note: '春茶首报' },
      { date: '2026-06-01', price: 560, note: '夏茶调价' },
    ],
  },
  {
    id: '2', code: 'BJ202606002', supplier: '正山堂', product: '金骏眉', teaCategory: TeaCategory.RED,
    originalPrice: 1200, quotedPrice: 1180, unit: '元/50g', type: 'adjust',
    validFrom: '2026-06-01', validTo: '2026-12-31', status: 'confirmed',
    contactPerson: '江总', contactPhone: '0599-5234567', remark: '长期合作优惠',
    history: [
      { date: '2025-06-01', price: 1200, note: '年度报价' },
      { date: '2026-06-01', price: 1180, note: '续约调价' },
    ],
  },
  {
    id: '3', code: 'BJ202606003', supplier: '八马', product: '铁观音', teaCategory: TeaCategory.OOLONG,
    originalPrice: 320, quotedPrice: 320, unit: '元/50g', type: 'renew',
    validFrom: '2026-07-01', validTo: '2027-06-30', status: 'pending',
    contactPerson: '王经理', contactPhone: '0595-2345678', remark: '到期续价，维持原价',
    history: [
      { date: '2025-07-01', price: 320, note: '年度报价' },
      { date: '2026-07-01', price: 320, note: '续价不变' },
    ],
  },
  {
    id: '4', code: 'BJ202606004', supplier: '白牡丹', product: '白毫银针', teaCategory: TeaCategory.WHITE,
    originalPrice: 860, quotedPrice: 890, unit: '元/50g', type: 'adjust',
    validFrom: '2026-06-15', validTo: '2026-12-15', status: 'pending',
    contactPerson: '林总', contactPhone: '0593-5678901', remark: '原料成本上涨',
    history: [
      { date: '2025-06-01', price: 860, note: '年度报价' },
      { date: '2026-06-15', price: 890, note: '成本上调' },
    ],
  },
  {
    id: '5', code: 'BJ202606005', supplier: '君山银针', product: '君山银针', teaCategory: TeaCategory.YELLOW,
    originalPrice: 750, quotedPrice: 720, unit: '元/50g', type: 'first',
    validFrom: '2026-06-10', validTo: '2026-09-10', status: 'confirmed',
    contactPerson: '张经理', contactPhone: '0730-8234567', remark: '首次合作报价',
    history: [
      { date: '2026-06-10', price: 720, note: '首次报价' },
    ],
  },
  {
    id: '6', code: 'BJ202606006', supplier: '白沙溪', product: '天茯茶', teaCategory: TeaCategory.DARK,
    originalPrice: 280, quotedPrice: 265, unit: '元/片', type: 'adjust',
    validFrom: '2026-05-01', validTo: '2026-10-31', status: 'confirmed',
    contactPerson: '刘总', contactPhone: '0737-7234567', remark: '批量采购优惠',
    history: [
      { date: '2025-05-01', price: 280, note: '年度报价' },
      { date: '2026-05-01', price: 265, note: '批量调价' },
    ],
  },
  {
    id: '7', code: 'BJ202606007', supplier: '艺福堂', product: '玫瑰花茶', teaCategory: TeaCategory.FLOWER,
    originalPrice: 128, quotedPrice: 135, unit: '元/50g', type: 'adjust',
    validFrom: '2026-06-01', validTo: '2026-11-30', status: 'rejected',
    contactPerson: '李经理', contactPhone: '0571-8345678', remark: '花材成本上涨，调价过高',
    history: [
      { date: '2025-06-01', price: 128, note: '年度报价' },
      { date: '2026-06-01', price: 135, note: '成本上调' },
    ],
  },
  {
    id: '8', code: 'BJ202606008', supplier: '西湖牌', product: '雨前龙井', teaCategory: TeaCategory.GREEN,
    originalPrice: 380, quotedPrice: 365, unit: '元/50g', type: 'renew',
    validFrom: '2026-07-01', validTo: '2027-06-30', status: 'pending',
    contactPerson: '陈经理', contactPhone: '0571-87654321', remark: '到期续价，小幅下调',
    history: [
      { date: '2025-07-01', price: 380, note: '年度报价' },
      { date: '2026-07-01', price: 365, note: '续价下调' },
    ],
  },
  {
    id: '9', code: 'BJ202606009', supplier: '凤山', product: '凤凰单丛', teaCategory: TeaCategory.OOLONG,
    originalPrice: 450, quotedPrice: 450, unit: '元/50g', type: 'first',
    validFrom: '2026-06-20', validTo: '2026-12-20', status: 'expired',
    contactPerson: '黄经理', contactPhone: '0768-2345678', remark: '报价已过期未确认',
    history: [
      { date: '2026-01-15', price: 450, note: '首次报价' },
    ],
  },
  {
    id: '10', code: 'BJ202606010', supplier: '正山堂', product: '正山小种', teaCategory: TeaCategory.RED,
    originalPrice: 420, quotedPrice: 398, unit: '元/50g', type: 'adjust',
    validFrom: '2026-06-01', validTo: '2026-12-31', status: 'pending',
    contactPerson: '江总', contactPhone: '0599-5234567', remark: '长期合作下调',
    history: [
      { date: '2025-06-01', price: 420, note: '年度报价' },
      { date: '2026-06-01', price: 398, note: '合作优惠' },
    ],
  },
];

/* ── 统计数据 ── */
const stats: StatCardData[] = [
  {
    label: '报价单数', value: '35', unit: '单',
    trend: { direction: 'up', value: '+3', label: '单' },
    icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 9h12M7 5V3h4v2" stroke="currentColor" strokeWidth="1.3"/></svg>,
  },
  {
    label: '待确认', value: '8', unit: '单',
    trend: { direction: 'up', value: '需及时处理' },
    icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    label: '本月调价', value: '12', unit: '项',
    trend: { direction: 'down', value: '2', label: '项' },
    icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 14l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    label: '平均调幅', value: '-2.3', unit: '%',
    trend: { direction: 'down', value: '0.5', label: '%' },
    icon: <svg viewBox="0 0 18 18" fill="none"><path d="M9 2l2.5 5 5.5.8-4 3.9.9 5.5L9 14.7 5.1 17.2l.9-5.5-4-3.9L7.5 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  },
];

/* ── 供应商列表（用于筛选） ── */
const suppliers = ['全部供应商', ...Array.from(new Set(initialRecords.map(r => r.supplier)))];

/* ── 新建报价表单状态 ── */
interface PricingForm {
  supplierId: string;
  productId: string;
  originalPrice: number;
  quotedPrice: string;
  type: PricingType;
  validFrom: string;
  validTo: string;
  contactPerson: string;
  contactPhone: string;
  remark: string;
}

const EMPTY_FORM: PricingForm = {
  supplierId: '', productId: '', originalPrice: 0, quotedPrice: '',
  type: 'first', validFrom: '', validTo: '',
  contactPerson: '', contactPhone: '', remark: '',
};

/** 采购报（调）价页面 */
export default function PurchasePricing() {
  const [records, setRecords] = useState<PricingRecord[]>(initialRecords);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showFormDrawer, setShowFormDrawer] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PricingRecord | null>(null);
  const [form, setForm] = useState<PricingForm>(EMPTY_FORM);

  const handleView = (record: PricingRecord) => {
    setSelectedRecord(record);
    setShowDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setSelectedRecord(null);
  };

  const handleOpenForm = () => {
    setForm(EMPTY_FORM);
    setShowFormDrawer(true);
  };

  const handleCloseForm = () => {
    setShowFormDrawer(false);
    setForm(EMPTY_FORM);
  };

  /** 选择商品+供应商后自动带出当前采购价 */
  const handleProductSupplierChange = (next: Partial<PricingForm>) => {
    const merged = { ...form, ...next };
    if (merged.productId && merged.supplierId) {
      const rule = getPurchasePrice(merged.productId, merged.supplierId);
      if (rule) {
        merged.originalPrice = rule.purchasePrice;
      } else {
        // 未找到采购价规则时，按市场价 × 55% 作为参考默认值
        const product = teaProducts.find(p => p.id === merged.productId);
        merged.originalPrice = product ? Math.round(product.marketPrice * 0.55) : 0;
      }
    } else {
      merged.originalPrice = 0;
    }
    setForm(merged);
  };

  /** 计算调幅 */
  const calcAdjustment = (original: number, quoted: number) => {
    if (original === 0) return 0;
    const diff = ((quoted - original) / original * 100).toFixed(1);
    return Number(diff);
  };

  /** 提交新建报价 */
  const handleSubmitForm = () => {
    if (!form.supplierId || !form.productId || !form.quotedPrice) return;
    const supplier = PRICE_SUPPLIERS.find(s => s.id === form.supplierId);
    const product = teaProducts.find(p => p.id === form.productId);
    if (!supplier || !product) return;

    const quotedPrice = Number(form.quotedPrice);
    const teaCategory = nameToTeaCategory(product.category.split('-')[0]) ?? TeaCategory.GREEN;
    const today = new Date().toISOString().slice(0, 10);
    const newId = String(records.length + 1);
    const newCode = `BJ202606${String(records.length + 11).padStart(3, '0')}`;

    const newRecord: PricingRecord = {
      id: newId,
      code: newCode,
      supplier: supplier.name,
      supplierId: supplier.id,
      productId: product.id,
      product: product.name,
      teaCategory,
      originalPrice: form.originalPrice,
      quotedPrice,
      unit: `元/${product.packageUnit}`,
      type: form.type,
      validFrom: form.validFrom || today,
      validTo: form.validTo || '2026-12-31',
      status: 'pending',
      contactPerson: form.contactPerson,
      contactPhone: form.contactPhone,
      remark: form.remark,
      history: [
        { date: today, price: quotedPrice, note: PRICING_TYPE_LABELS[form.type] },
      ],
    };
    setRecords([newRecord, ...records]);
    handleCloseForm();
  };

  /** 确认报价：更新状态并联动采购价规则（演示用 console.log） */
  const handleConfirmQuote = (record: PricingRecord) => {
    setRecords(records.map(r => r.id === record.id ? { ...r, status: 'confirmed' } : r));
    console.log('[采购价规则更新] 报价已确认，同步更新采购价规则：', {
      productId: record.productId,
      supplierId: record.supplierId,
      productName: record.product,
      supplierName: record.supplier,
      旧采购价: record.originalPrice,
      新采购价: record.quotedPrice,
      validFrom: record.validFrom,
      validTo: record.validTo,
      报价单号: record.code,
    });
    handleCloseDrawer();
  };

  /** 驳回报价 */
  const handleRejectQuote = (record: PricingRecord) => {
    setRecords(records.map(r => r.id === record.id ? { ...r, status: 'rejected' } : r));
    handleCloseDrawer();
  };

  const formAdjustment = calcAdjustment(form.originalPrice, Number(form.quotedPrice) || 0);
  const canSubmit = form.supplierId && form.productId && form.quotedPrice;

  return (
    <>
      <ContentHeader
        title="采购报（调）价"
        breadcrumbs={['采购', '采购报（调）价']}
        actions={<Button onClick={handleOpenForm}><PlusIcon />新增报价</Button>}
      />
      <div className="content-body">
        <div className="stat-cards">
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>

        <FilterBar>
          <FilterInput placeholder="搜索报价单号、供应商、商品..." />
          <FilterSelect options={['全部类型', '首次报价', '价格调整', '到期续价']} />
          <FilterSelect options={['全部状态', '待确认', '已确认', '已驳回', '已过期']} />
          <FilterSelect options={suppliers} />
        </FilterBar>

        <Card>
          <Table
            headers={['报价单号', '供应商', '商品', '茶类', '原价', '报价', '调幅', '报价类型', '有效期', '状态', '操作']}
            rows={records.map((r) => {
              const adj = calcAdjustment(r.originalPrice, r.quotedPrice);
              return [
                <span className="mono">{r.code}</span>,
                r.supplier,
                r.product,
                <Tag category={r.teaCategory} />,
                <span className="mono">¥{r.originalPrice}</span>,
                <span className="mono">¥{r.quotedPrice}</span>,
                <span className="mono" style={{ color: adj > 0 ? '#CB405D' : adj < 0 ? '#01795D' : 'var(--color-text-secondary)' }}>
                  {adj > 0 ? '+' : ''}{adj}%
                </span>,
                <span style={{
                  padding: '1px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-medium)',
                  background: r.type === 'first' ? '#E3F2FD' : r.type === 'adjust' ? '#FFF3E0' : '#E8F5E9',
                  color: r.type === 'first' ? '#1565C0' : r.type === 'adjust' ? '#E65100' : '#2E7D32',
                  border: `1px solid ${r.type === 'first' ? '#90CAF9' : r.type === 'adjust' ? '#FFCC80' : '#A5D6A7'}`,
                }}>
                  {PRICING_TYPE_LABELS[r.type]}
                </span>,
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  {r.validFrom} ~ {r.validTo}
                </span>,
                <StatusTag variant={pricingStatusToVariant(r.status)} label={pricingStatusLabel(r.status)} />,
                <div className="row-actions">
                  <Button size="sm" variant="ghost" onClick={() => handleView(r)}>查看</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleView(r)}>编辑</Button>
                </div>,
              ];
            })}
          />
        </Card>
      </div>

      {/* 报价详情抽屉 */}
      <DetailDrawer
        open={showDrawer && !!selectedRecord}
        onClose={handleCloseDrawer}
        badge="PR"
        title={selectedRecord?.code}
        statusTag={selectedRecord && <StatusTag variant={pricingStatusToVariant(selectedRecord.status)} label={pricingStatusLabel(selectedRecord.status)} />}
        subtitle={selectedRecord && `${selectedRecord.supplier} · ${selectedRecord.product}`}
        mode="view"
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseDrawer}>关闭</Button>
            {selectedRecord?.status === 'pending' && (
              <>
                <Button style={{ background: '#CB405D', borderColor: '#CB405D' }} onClick={() => handleRejectQuote(selectedRecord)}>驳回</Button>
                <Button onClick={() => handleConfirmQuote(selectedRecord)}>确认报价</Button>
              </>
            )}
          </>
        }
      >
        {selectedRecord && (
          <>
            <DrawerSection title="基本信息">
              <InfoGrid cols={3}>
                <InfoItem label="报价单号" emph mono>{selectedRecord.code}</InfoItem>
                <InfoItem label="供应商" emph>{selectedRecord.supplier}</InfoItem>
                <InfoItem label="联系人">{selectedRecord.contactPerson}</InfoItem>
                <InfoItem label="联系电话">{selectedRecord.contactPhone}</InfoItem>
                <InfoItem label="备注" span={3}>{selectedRecord.remark || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="报价信息">
              <InfoGrid cols={3}>
                <InfoItem label="商品名称" emph>{selectedRecord.product}</InfoItem>
                <InfoItem label="茶类"><Tag category={selectedRecord.teaCategory} /></InfoItem>
                <InfoItem label="报价类型">
                  <span style={{
                    padding: '1px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-medium)',
                    background: selectedRecord.type === 'first' ? '#E3F2FD' : selectedRecord.type === 'adjust' ? '#FFF3E0' : '#E8F5E9',
                    color: selectedRecord.type === 'first' ? '#1565C0' : selectedRecord.type === 'adjust' ? '#E65100' : '#2E7D32',
                    border: `1px solid ${selectedRecord.type === 'first' ? '#90CAF9' : selectedRecord.type === 'adjust' ? '#FFCC80' : '#A5D6A7'}`,
                  }}>
                    {PRICING_TYPE_LABELS[selectedRecord.type]}
                  </span>
                </InfoItem>
                <InfoItem label="原价" mono>¥{selectedRecord.originalPrice}/{selectedRecord.unit.replace('元/', '')}</InfoItem>
                <InfoItem label="报价" mono>¥{selectedRecord.quotedPrice}/{selectedRecord.unit.replace('元/', '')}</InfoItem>
                {(() => {
                  const adj = calcAdjustment(selectedRecord.originalPrice, selectedRecord.quotedPrice);
                  return (
                    <InfoItem label="调幅" mono valueStyle={{ color: adj > 0 ? '#CB405D' : adj < 0 ? '#01795D' : 'var(--color-text-secondary)', fontWeight: 'var(--font-bold)' }}>
                      {adj > 0 ? '+' : ''}{adj}%
                    </InfoItem>
                  );
                })()}
                <InfoItem label="有效期起">{selectedRecord.validFrom}</InfoItem>
                <InfoItem label="有效期止">{selectedRecord.validTo}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="价格历史对比">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {selectedRecord.history.map((h, i) => {
                  const prevPrice = i > 0 ? selectedRecord.history[i - 1].price : null;
                  const diff = prevPrice !== null ? ((h.price - prevPrice) / prevPrice * 100).toFixed(1) : null;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                      padding: 'var(--space-3)', background: i === selectedRecord.history.length - 1 ? 'var(--color-module-current-lightest)' : 'var(--color-bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      border: i === selectedRecord.history.length - 1 ? '1px solid var(--color-module-current-light)' : '1px solid transparent',
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 'var(--radius-md)',
                        background: i === selectedRecord.history.length - 1 ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)',
                        color: i === selectedRecord.history.length - 1 ? '#fff' : 'var(--color-text-tertiary)',
                        flexShrink: 0,
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }} className="mono">¥{h.price}</span>
                          {diff !== null && (
                            <span className="mono" style={{ fontSize: 'var(--text-xs)', color: Number(diff) > 0 ? '#CB405D' : Number(diff) < 0 ? '#01795D' : 'var(--color-text-tertiary)' }}>
                              {Number(diff) > 0 ? '+' : ''}{diff}%
                            </span>
                          )}
                          {i === selectedRecord.history.length - 1 && (
                            <span style={{ padding: '0 6px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', background: 'var(--color-module-current-lightest)', color: 'var(--color-module-current-base)', fontWeight: 'var(--font-medium)' }}>最新</span>
                          )}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>{h.date} · {h.note}</div>
                      </div>
                    </div>
                  );
                })}
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
              <span className="drawer-title">新增报价</span>
              <button className="drawer-close" onClick={handleCloseForm}>
                <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div className="drawer-body">
              {/* 供应商与商品选择 */}
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">供应商 <span style={{ color: '#eb5c20' }}>*</span></label>
                  <select className="detail-select" value={form.supplierId} onChange={(e) => handleProductSupplierChange({ supplierId: e.target.value })}>
                    <option value="">请选择供应商</option>
                    {PRICE_SUPPLIERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">商品 <span style={{ color: '#eb5c20' }}>*</span></label>
                  <select className="detail-select" value={form.productId} onChange={(e) => handleProductSupplierChange({ productId: e.target.value })}>
                    <option value="">请选择商品</option>
                    {teaProducts.map(p => <option key={p.id} value={p.id}>{p.name}（{p.brand}）</option>)}
                  </select>
                </div>
              </div>

              {/* 价格信息 */}
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">原价（当前采购价）</label>
                  <input className="detail-input" value={form.originalPrice ? `¥${form.originalPrice}` : ''} readOnly placeholder="选择商品和供应商后自动带出" style={{ background: 'var(--color-neutral-100)', color: 'var(--color-text-secondary)' }} />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">报价 <span style={{ color: '#eb5c20' }}>*</span></label>
                  <input className="detail-input" type="number" value={form.quotedPrice} onChange={(e) => setForm({ ...form, quotedPrice: e.target.value })} placeholder="请输入报价金额" />
                </div>
              </div>

              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">调幅</label>
                  <input className="detail-input" value={form.originalPrice && form.quotedPrice ? `${formAdjustment > 0 ? '+' : ''}${formAdjustment}%` : ''} readOnly placeholder="自动计算" style={{ background: 'var(--color-neutral-100)', color: formAdjustment > 0 ? '#CB405D' : formAdjustment < 0 ? '#01795D' : 'var(--color-text-secondary)' }} />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">报价类型</label>
                  <select className="detail-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PricingType })}>
                    <option value="first">首次报价</option>
                    <option value="adjust">价格调整</option>
                    <option value="renew">到期续价</option>
                  </select>
                </div>
              </div>

              {/* 有效期 */}
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">有效期起</label>
                  <input className="detail-input" type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">有效期止</label>
                  <input className="detail-input" type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} />
                </div>
              </div>

              {/* 联系人信息 */}
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">联系人</label>
                  <input className="detail-input" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="请输入联系人" />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">联系电话</label>
                  <input className="detail-input" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="请输入联系电话" />
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
              {form.productId && form.supplierId && (
                <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-module-current-light)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  {(() => {
                    const rule = getPurchasePrice(form.productId, form.supplierId);
                    const product = teaProducts.find(p => p.id === form.productId);
                    if (!product) return null;
                    return (
                      <>
                        <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--color-module-current-base)', marginBottom: 'var(--space-1)' }}>价格体系联动</div>
                        <div>市场价：¥{product.marketPrice}　|　当前采购价：¥{form.originalPrice}　|　采购折扣率：{rule ? `${rule.discountRate}%` : '未建立规则'}</div>
                        <div style={{ marginTop: 2 }}>确认报价后将同步更新采购价规则（演示模式：控制台输出）</div>
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
