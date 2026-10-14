import { useState, useMemo } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { PageHead, Pill, REPORT_STATUS_TONE, REPORT_TYPE_TONE } from './PartnerUI';
import type { PartnerReport, PartnerReportType } from '../../types';
import { partnerReports as initialReports, PARTNER_REPORT_TYPE_LABELS, PARTNER_REPORT_STATUS_LABELS } from '../../data/partner';

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
  title: string;
  summary: string;
  amount: string;
}

const EMPTY_FORM: ReportForm = { type: 'order', title: '', summary: '', amount: '' };

/** 合作商报备管理：主动报备订单 / 商品 / 客户，等待淡茶半盏审核 */
export default function PartnerReports() {
  const [reports, setReports] = useState<PartnerReport[]>(initialReports);
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

  const submitReport = () => {
    if (!form.title.trim() || !form.summary.trim()) return;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const newReport: PartnerReport = {
      id: `pr_${Date.now()}`,
      code: `BB${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(reports.length + 1).padStart(3, '0')}`,
      type: form.type,
      title: form.title.trim(),
      summary: form.summary.trim(),
      amount: form.type === 'order' && form.amount ? Number(form.amount) : undefined,
      status: 'pending',
      submitTime: `${dateStr} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    };
    setReports(prev => [newReport, ...prev]);
    setShowAdd(false);
    setForm(EMPTY_FORM);
  };

  const statusPill = (status: string) => (
    <Pill tone={REPORT_STATUS_TONE[status]}>{PARTNER_REPORT_STATUS_LABELS[status]}</Pill>
  );

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 订单"
        title="报备管理"
        desc="主动报备意向订单、新商品与新客户，由淡茶半盏审核确认后纳入合作体系。"
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
          headers={['报备编号', '类型', '标题', '预计金额', '状态', '提交时间', '操作']}
          rows={filtered.map(r => [
            <span key="code" className="cell-mono-emph">{r.code}</span>,
            <Pill key="type" tone={REPORT_TYPE_TONE[r.type]}>{PARTNER_REPORT_TYPE_LABELS[r.type]}</Pill>,
            <span key="title" className="cell-emph">{r.title}</span>,
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
        subtitle={selected ? `${selected.code} · ${PARTNER_REPORT_TYPE_LABELS[selected.type]}` : ''}
      >
        {selected && (
          <DrawerSection title="报备内容">
            <InfoGrid>
              <InfoItem label="报备编号" mono emph>{selected.code}</InfoItem>
              <InfoItem label="报备类型">{PARTNER_REPORT_TYPE_LABELS[selected.type]}</InfoItem>
              <InfoItem label="提交时间">{selected.submitTime}</InfoItem>
              <InfoItem label="报备状态">{PARTNER_REPORT_STATUS_LABELS[selected.status]}</InfoItem>
              {selected.amount != null && <InfoItem label="预计金额" mono>¥{selected.amount.toLocaleString()}</InfoItem>}
              <InfoItem label="报备标题" span={3}>{selected.title}</InfoItem>
              <InfoItem label="报备内容" span={3}>{selected.summary}</InfoItem>
              <InfoItem label="审核意见" span={3}>{selected.reviewNote || '待审核'}</InfoItem>
            </InfoGrid>
          </DrawerSection>
        )}
      </DetailDrawer>

      {/* 新增报备弹窗 */}
      {showAdd && (
        <div className="category-dialog-overlay" onClick={() => setShowAdd(false)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ width: 520 }}>
            <div className="pk-dialog-title">新增报备</div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>报备类型 *</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {(['order', 'product', 'customer'] as PartnerReportType[]).map(t => (
                  <button key={t} onClick={() => setForm({ ...form, type: t })}
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

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>标题 *</label>
              <input className="filter-input" placeholder={form.type === 'order' ? '如：XX客户中秋团购订单报备' : form.type === 'product' ? '如：武夷岩茶·水金龟报备' : '如：XX茶行客户报备'}
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ width: '100%' }} />
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>
                详细说明 *{form.type === 'order' ? '（商品、数量、预计下单时间）' : form.type === 'product' ? '（产地、工艺、定价建议）' : '（经营情况、联系方式、合作意向）'}
              </label>
              <textarea className="filter-input" placeholder="请输入报备详细说明" value={form.summary}
                onChange={e => setForm({ ...form, summary: e.target.value })} style={{ width: '100%', minHeight: 100, resize: 'vertical', padding: '10px 12px' }} />
            </div>

            {form.type === 'order' && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>预计金额（元）</label>
                <input className="filter-input" type="number" placeholder="请输入预计订单金额" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })} style={{ width: '100%' }} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>取消</Button>
              <Button onClick={submitReport} disabled={!form.title.trim() || !form.summary.trim()}>提交报备</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
