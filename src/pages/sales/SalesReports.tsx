import { useState, useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useReportStore, getReportMatchedOrders } from '../../stores/reportStore';
import type { PartnerReport } from '../../types';
import { PARTNER_REPORT_TYPE_LABELS, PARTNER_ORDER_KIND_LABELS } from '../../data/partner';

const STATUS_LABELS: Record<string, string> = { pending: '待审批', approved: '已通过', rejected: '已驳回' };
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FFF3E0', color: '#E65100' },
  approved: { bg: '#E8F5E9', color: '#01795D' },
  rejected: { bg: '#FFEBEE', color: '#C62828' },
};
const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  order: { bg: '#E3F2FD', color: '#0F64B5' },
  product: { bg: '#FFF8E1', color: '#B8860B' },
  customer: { bg: '#F3E5F5', color: '#7B1FA2' },
};

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/** 管理台-销售-报备管理：审批合作商终端提交的报备（订单 / 商品 / 客户） */
export default function SalesReports() {
  const reports = useReportStore((s) => s.reports);
  const reviewReport = useReportStore((s) => s.reviewReport);
  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<PartnerReport | null>(null);
  const [reviewing, setReviewing] = useState<PartnerReport | null>(null);
  const [note, setNote] = useState('');
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');

  const filtered = useMemo(() => reports.filter((r) => {
    if (filterType && r.type !== filterType) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (keyword && !r.code.includes(keyword) && !r.title.includes(keyword) && !r.partnerName.includes(keyword)) return false;
    return true;
  }), [reports, keyword, filterType, filterStatus]);

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  const statusTag = (status: string) => pill(STATUS_STYLE[status].bg, STATUS_STYLE[status].color, STATUS_LABELS[status]);

  /** 报备对象摘要（列表展示） */
  const targetText = (r: PartnerReport) => {
    if (r.type === 'order') return `订单 ${r.relatedOrderCode ?? '—'}`;
    if (r.type === 'product') return `${r.productName} · ${r.region} · ${r.customer}`;
    return r.targetCustomer ?? '—';
  };

  /** 打开审批弹窗 */
  const openReview = (r: PartnerReport, action: 'approved' | 'rejected') => {
    setReviewing(r);
    setReviewAction(action);
    setNote(action === 'approved' ? '同意报备，命中订单将自动转入合作商名下' : '');
  };

  /** 确认审批 */
  const confirmReview = () => {
    if (!reviewing) return;
    reviewReport(reviewing.id, reviewAction, note.trim() || (reviewAction === 'approved' ? '同意报备' : '驳回报备'));
    if (selected && selected.id === reviewing.id) {
      setSelected({ ...selected, status: reviewAction, reviewNote: note, reviewTime: '刚刚' });
    }
    setReviewing(null);
    setNote('');
  };

  return (
    <>
      <ContentHeader title="报备管理" breadcrumbs={['采购', '合作商管理', '报备管理']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          审批合作商终端提交的报备。<strong>订单报备</strong>（自营）：通过后关联订单自动转该合作商履约；<strong>订单报备</strong>（商机）：通过后订单同步至合作商展示、由平台进货发货；<strong>商品报备</strong>：通过后命中的新订单自动转给合作商；<strong>客户报备</strong>：通过后该客户新订单自动转给合作商。
        </div>

        {/* 筛选 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <input className="filter-input" placeholder="搜索报备编号、标题、合作商..." value={keyword} onChange={e => setKeyword(e.target.value)} />
          <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">全部类型</option>
            <option value="order">订单报备</option>
            <option value="product">商品报备</option>
            <option value="customer">客户报备</option>
          </select>
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">全部状态</option>
            <option value="pending">待审批</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
            共 {filtered.length} 条 · 待审批 <strong style={{ color: '#E65100' }}>{pendingCount}</strong> 条
          </span>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['报备编号', '类型', '合作商', '标题', '报备对象', '预计金额', '状态', '提交时间', '操作']}
            rows={filtered.map(r => [
              <span key="code" className="cell-mono-emph">{r.code}</span>,
              <div key="type" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {pill(TYPE_STYLE[r.type].bg, TYPE_STYLE[r.type].color, PARTNER_REPORT_TYPE_LABELS[r.type])}
                {r.type === 'order' && pill('#E0F2F1', '#00695C', PARTNER_ORDER_KIND_LABELS[r.orderKind ?? 'self'])}
              </div>,
              <span key="pn" className="cell-emph">{r.partnerName}</span>,
              <span key="title">{r.title}</span>,
              <span key="target" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{targetText(r)}</span>,
              r.amount != null
                ? <span key="amt" className="mono">¥{r.amount.toLocaleString()}</span>
                : <span key="amt" style={{ color: 'var(--color-neutral-300)' }}>—</span>,
              statusTag(r.status),
              <span key="time" className="cell-muted">{r.submitTime}</span>,
              <div key="act" className="row-actions">
                {r.status === 'pending' ? (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => openReview(r, 'rejected')}>驳回</Button>
                    <Button size="sm" onClick={() => openReview(r, 'approved')}>审批通过</Button>
                  </>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>查看</Button>
                )}
              </div>,
            ])}
          />
        </Card>
      </div>

      {/* 报备详情抽屉 */}
      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        badge="BB"
        title={selected?.code ?? ''}
        statusTag={selected ? statusTag(selected.status) : null}
        subtitle={selected ? `${selected.partnerName} · ${PARTNER_REPORT_TYPE_LABELS[selected.type]}${selected.type === 'order' ? `（${PARTNER_ORDER_KIND_LABELS[selected.orderKind ?? 'self']}）` : ''} · ${selected.submitTime}` : ''}
        hideFooter
        footer={
          selected && (
            <>
              <Button variant="ghost" onClick={() => setSelected(null)}>关闭</Button>
              {selected.status === 'pending' && (
                <>
                  <Button variant="danger" onClick={() => openReview(selected, 'rejected')}>驳回</Button>
                  <Button onClick={() => openReview(selected, 'approved')}>审批通过</Button>
                </>
              )}
            </>
          )
        }
      >
        {selected && (() => {
          const matched = getReportMatchedOrders(selected);
          return (
            <>
              <DrawerSection title="报备信息">
                <InfoGrid>
                  <InfoItem label="报备编号" mono emph>{selected.code}</InfoItem>
                  <InfoItem label="报备类型">{PARTNER_REPORT_TYPE_LABELS[selected.type]}</InfoItem>
                  {selected.type === 'order' && <InfoItem label="报备模式">{PARTNER_ORDER_KIND_LABELS[selected.orderKind ?? 'self']}</InfoItem>}
                  <InfoItem label="发起合作商" span={2}>{selected.partnerName}</InfoItem>
                  <InfoItem label="提交时间">{selected.submitTime}</InfoItem>
                  <InfoItem label="审批状态">{STATUS_LABELS[selected.status]}</InfoItem>
                  {selected.amount != null && <InfoItem label="预计金额" mono>¥{selected.amount.toLocaleString()}</InfoItem>}
                  <InfoItem label="审批时间">{selected.reviewTime || '—'}</InfoItem>
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
                </InfoGrid>
              </DrawerSection>

              <DrawerSection title={`命中平台订单（${matched.length} 笔）`}>
                {matched.length > 0 ? (
                  <table className="detail-inline-table">
                    <thead>
                      <tr><th>订单编号</th><th>客户</th><th>区域</th><th>商品</th><th>金额</th></tr>
                    </thead>
                    <tbody>
                      {matched.map(mo => (
                        <tr key={mo.id}>
                          <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{mo.code}</td>
                          <td>{mo.customerName}（{mo.customerType}）</td>
                          <td>{mo.customerRegion}</td>
                          <td>{mo.items.map(it => `${it.productName}×${it.quantity}`).join('、')}</td>
                          <td className="mono">¥{mo.totalAmount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
                    当前暂无命中的平台订单，审批通过后新订单命中规则时将自动转给该合作商
                  </div>
                )}
                <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
                  {selected.type === 'order' && selected.orderKind === 'self' && '自营报备：审批通过后，命中订单自动转入该合作商名下，由合作商履约。'}
                  {selected.type === 'order' && selected.orderKind === 'opportunity' && '商机报备：审批通过后，命中订单同步至合作商终端展示，由平台进货发货处理。'}
                  {selected.type === 'product' && '商品报备：审批通过后，报备商品在报备区域与客户范围内的新订单自动转给该合作商履约。'}
                  {selected.type === 'customer' && '客户报备：审批通过后，该客户新订单自动转给该合作商履约。'}
                </div>
              </DrawerSection>

              <DrawerSection title="审批记录">
                <InfoGrid>
                  <InfoItem label="审批状态">{STATUS_LABELS[selected.status]}</InfoItem>
                  <InfoItem label="审批时间">{selected.reviewTime || '—'}</InfoItem>
                  <InfoItem label="审批意见" span={3}>{selected.reviewNote || '待审批'}</InfoItem>
                </InfoGrid>
              </DrawerSection>
            </>
          );
        })()}
      </DetailDrawer>

      {/* 审批弹窗 */}
      {reviewing && (
        <div className="category-dialog-overlay" onClick={() => setReviewing(null)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ width: 480 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
              {reviewAction === 'approved' ? '审批通过' : '驳回报备'}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              {reviewing.code} · {reviewing.title}
              {reviewAction === 'approved' ? '，确认通过该报备？' : '，确认驳回该报备？'}
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>审批意见</label>
              <textarea className="filter-input" placeholder="请输入审批意见" value={note}
                onChange={e => setNote(e.target.value)} style={{ width: '100%', minHeight: 80, resize: 'vertical', padding: '10px 12px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setReviewing(null)}>取消</Button>
              <Button variant={reviewAction === 'approved' ? 'primary' : 'danger'} onClick={confirmReview}>
                确定{reviewAction === 'approved' ? '通过' : '驳回'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
