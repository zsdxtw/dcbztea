import { useState, useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useSupplierStore } from '../../stores/supplierStore';
import type { SupplierApproval } from '../../types';
import { SUPPLIER_TYPE_LABELS, TAX_TYPE_LABELS, SETTLEMENT_METHOD_LABELS } from '../../data/suppliers';

const STATUS_LABELS: Record<string, string> = { pending: '待审批', approved: '已通过', rejected: '已驳回' };
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FFF3E0', color: '#E65100' },
  approved: { bg: '#E8F5E9', color: '#01795D' },
  rejected: { bg: '#FFEBEE', color: '#C62828' },
};
const TYPE_LABELS: Record<string, string> = { register: '注册申请', modify: '信息修改' };

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

const FILTERS = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待审批' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
] as const;

/** 审批详情抽屉 Tab 键（与供应商详情抽屉 Tab 化保持一致） */
type ApprovalTabKey = 'approval' | 'basic' | 'qualification' | 'warehouse' | 'store' | 'finance' | 'terminal';

/** 管理台-采购-供应商管理-注册审批：审批合作商终端提交的注册与信息修改申请 */
export default function PurchaseSupplierApprovals() {
  const approvals = useSupplierStore(s => s.approvals);
  const reviewApproval = useSupplierStore(s => s.reviewApproval);
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<SupplierApproval | null>(null);
  const [approvalTab, setApprovalTab] = useState<ApprovalTabKey>('approval');
  /** 审批弹窗：action + 意见 */
  const [reviewing, setReviewing] = useState<{ approval: SupplierApproval; action: 'approved' | 'rejected' } | null>(null);
  const [note, setNote] = useState('');

  const filtered = useMemo(() => approvals.filter(a => {
    if (filterStatus && a.status !== filterStatus) return false;
    if (keyword && !a.code.includes(keyword) && !a.payload.name.includes(keyword) && !a.applicant.includes(keyword)) return false;
    return true;
  }), [approvals, keyword, filterStatus]);

  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const statusTag = (s: string) => pill(STATUS_STYLE[s].bg, STATUS_STYLE[s].color, STATUS_LABELS[s]);

  const openReview = (a: SupplierApproval, action: 'approved' | 'rejected') => {
    setReviewing({ approval: a, action });
    setNote(action === 'approved' ? '资质齐全，同意生效' : '');
  };

  const confirmReview = () => {
    if (!reviewing) return;
    reviewApproval(reviewing.approval.id, reviewing.action, '管理员', note.trim() || (reviewing.action === 'approved' ? '同意' : '驳回'));
    if (selected && selected.id === reviewing.approval.id) {
      setSelected({ ...selected, status: reviewing.action, reviewTime: new Date().toISOString().slice(0, 10), reviewer: '管理员', reviewNote: note });
    }
    setReviewing(null);
    setNote('');
  };

  /** 选填区块为空时的占位提示（注册时未提交，审批通过后可由合作商终端维护） */
  const emptySection = (title: string) => (
    <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', border: '2px dashed var(--color-border-primary)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>{title}</div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', lineHeight: 1.7 }}>该部分为选填内容，未随本申请提交；<br />审批通过后合作商可登录终端在「合作商信息」中维护更新。</div>
    </div>
  );

  /** 申请档案是否存在（注册申请在提交时名称必填，无名称视为无档案） */
  const hasPayload = (a: SupplierApproval) => a.type === 'modify' || !!a.payload.name;

  return (
    <>
      <ContentHeader title="注册审批" breadcrumbs={['采购', '供应商管理', '注册审批']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          审批合作商终端提交的申请。<strong>注册申请</strong>：通过后自动创建供应商档案（渠道来源=终端注册）并开通终端账号；<strong>信息修改申请</strong>：通过后覆盖对应供应商档案。当前待审批 <strong style={{ color: 'var(--color-module-current-base)' }}>{pendingCount}</strong> 条。
        </div>

        {/* 状态筛选 */}
        <div className="filter-bar">
          <div className="segmented">
            {FILTERS.map(f => {
              const count = f.key === '' ? approvals.length : approvals.filter(a => a.status === f.key).length;
              return (
                <button key={f.key} className={`segment-item${filterStatus === f.key ? ' active' : ''}`} onClick={() => setFilterStatus(f.key)}>
                  {f.label}{count > 0 && ` ${count}`}
                </button>
              );
            })}
          </div>
          <input className="filter-input" placeholder="搜索审批编号 / 供应商 / 申请人" value={keyword} onChange={e => setKeyword(e.target.value)} />
        </div>

        <Table
          headers={['审批编号', '类型', '供应商名称', '申请人', '申请说明', '提交时间', '状态', '操作']}
          rows={filtered.map(a => [
            <span key="code" className="cell-mono-emph">{a.code}</span>,
            <span key="type">{pill(a.type === 'register' ? '#E3F2FD' : '#F3E5F5', a.type === 'register' ? '#0F64B5' : '#7B1FA2', TYPE_LABELS[a.type])}</span>,
            <span key="name" className="cell-emph">{a.type === 'register' && !a.payload.name ? '—' : a.payload.name}</span>,
            <span key="applicant" className="mono">{a.applicant}</span>,
            <span key="note" className="cell-muted">{a.applyNote || '—'}</span>,
            <span key="time" className="cell-muted">{a.submitTime}</span>,
            statusTag(a.status),
            <div key="actions" className="row-actions">
              <Button size="sm" variant="ghost" onClick={() => { setSelected(a); setApprovalTab('approval'); }}>查看</Button>
              {a.status === 'pending' && (
                <>
                  <Button size="sm" variant="ghost" style={{ color: 'var(--color-semantic-success, #01795D)' }} onClick={() => openReview(a, 'approved')}>通过</Button>
                  <Button size="sm" variant="ghost" style={{ color: 'var(--color-semantic-error)' }} onClick={() => openReview(a, 'rejected')}>驳回</Button>
                </>
              )}
            </div>,
          ])}
        />

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>暂无审批记录</div>
        )}
      </div>

      {/* 审批详情抽屉 */}
      {selected && (
        <DetailDrawer
          open
          mode="view"
          onClose={() => setSelected(null)}
          badge="SP"
          title={selected.type === 'register' && !selected.payload.name ? selected.code : selected.payload.name}
          subtitle={`${TYPE_LABELS[selected.type]} · 申请人 ${selected.applicant} · 提交于 ${selected.submitTime}`}
          statusTag={statusTag(selected.status)}
        >
          {/* Tab 栏：分区标题标签化展示于抽屉顶部（与供应商详情抽屉一致） */}
          <div className="drawer-tab-bar">
            <button type="button" className={`drawer-tab${approvalTab === 'approval' ? ' active' : ''}`} onClick={() => setApprovalTab('approval')}>审批信息</button>
            {hasPayload(selected) && ([
              ['basic', '基本信息'],
              ['qualification', '资质文件'],
              ['warehouse', '仓库信息'],
              ['store', '门店信息'],
              ['finance', '财务信息'],
              ['terminal', '终端账号'],
            ] as [ApprovalTabKey, string][]).map(([key, label]) => (
              <button key={key} type="button" className={`drawer-tab${approvalTab === key ? ' active' : ''}`} onClick={() => setApprovalTab(key)}>
                {label}
                {key === 'qualification' && <span className="drawer-tab-count">{selected.payload.qualificationFiles?.length ?? 0}</span>}
                {key === 'warehouse' && <span className="drawer-tab-count">{selected.payload.warehouses?.length ?? 0}</span>}
                {key === 'store' && <span className="drawer-tab-count">{selected.payload.stores?.length ?? 0}</span>}
                {key === 'terminal' && selected.payload.terminal?.enabled && <span className="drawer-tab-count">已开通</span>}
              </button>
            ))}
          </div>
          <div className="drawer-tab-contents">
            {/* 审批信息 */}
            {approvalTab === 'approval' && (
              <>
                <InfoGrid>
                  <InfoItem label="审批编号" mono emph>{selected.code}</InfoItem>
                  <InfoItem label="申请类型">{TYPE_LABELS[selected.type]}</InfoItem>
                  <InfoItem label="申请人" mono>{selected.applicant}</InfoItem>
                  <InfoItem label="提交时间">{selected.submitTime}</InfoItem>
                  <InfoItem label="审批状态">{statusTag(selected.status)}</InfoItem>
                  <InfoItem label="审批时间">{selected.reviewTime ?? '—'}</InfoItem>
                  <InfoItem label="申请说明" span={2}>{selected.applyNote || '—'}</InfoItem>
                  <InfoItem label="审批人">{selected.reviewer ?? '—'}</InfoItem>
                  <InfoItem label="审批意见" span={3}>{selected.reviewNote || '—'}</InfoItem>
                </InfoGrid>
                {selected.type === 'modify' && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-3)', lineHeight: 1.7 }}>
                    以上为该合作商提交的修改后完整档案，审批通过后将覆盖对应供应商的现有档案；档案详情可在上方标签页中查看。
                  </div>
                )}
              </>
            )}
            {hasPayload(selected) && approvalTab === 'basic' && (
              <InfoGrid>
                <InfoItem label="供应商名称" emph>{selected.payload.name}</InfoItem>
                <InfoItem label="供应商类型">{SUPPLIER_TYPE_LABELS[selected.payload.type] ?? selected.payload.type}</InfoItem>
                <InfoItem label="统一社会信用代码" mono>{selected.payload.unifiedCreditCode}</InfoItem>
                <InfoItem label="法定代表人">{selected.payload.legalRepresentative}</InfoItem>
                <InfoItem label="联系人">{selected.payload.contactPerson}</InfoItem>
                <InfoItem label="联系电话" mono>{selected.payload.contactPhone}</InfoItem>
                <InfoItem label="注册地址" span={3}>{[selected.payload.registeredProvince, selected.payload.registeredCity, selected.payload.registeredDistrict, selected.payload.registeredAddress].filter(Boolean).join(' ') || '—'}</InfoItem>
                <InfoItem label="经营范围" span={3}>{selected.payload.businessScope || '—'}</InfoItem>
              </InfoGrid>
            )}
            {hasPayload(selected) && approvalTab === 'qualification' && (
              (selected.payload.qualificationFiles?.length ?? 0) > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {selected.payload.qualificationFiles!.map((f, i) => (
                    <div key={`${f}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
                      <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14, color: 'var(--color-module-current-base)' }}><path d="M4 1.5h5.5L13 5v9.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-12a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              ) : emptySection('未提交资质文件')
            )}
            {hasPayload(selected) && approvalTab === 'warehouse' && (
              (selected.payload.warehouses?.length ?? 0) > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {selected.payload.warehouses!.map(w => (
                    <div key={w.id} style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
                      <span style={{ fontWeight: 'var(--font-medium)' }}>{w.name}</span>
                      <span style={{ color: 'var(--color-text-tertiary)', marginLeft: 'var(--space-2)' }}>{[w.province, w.city, w.district].filter(Boolean).join(' ')} {w.address}</span>
                    </div>
                  ))}
                </div>
              ) : emptySection('未提交仓库信息')
            )}
            {hasPayload(selected) && approvalTab === 'store' && (
              (selected.payload.stores?.length ?? 0) > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {selected.payload.stores!.map(st => (
                    <div key={st.id} style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
                      <span style={{ fontWeight: 'var(--font-medium)' }}>{st.name}</span>
                      <span className="mono" style={{ marginLeft: 'var(--space-2)', color: 'var(--color-text-tertiary)' }}>{st.area}㎡</span>
                      <span style={{ color: 'var(--color-text-tertiary)', marginLeft: 'var(--space-2)' }}>{[st.province, st.city, st.district].filter(Boolean).join(' ')} {st.address}</span>
                    </div>
                  ))}
                </div>
              ) : emptySection('未提交门店信息')
            )}
            {hasPayload(selected) && approvalTab === 'finance' && (
              selected.payload.bankAccount?.accountNo ? (
                <InfoGrid>
                  <InfoItem label="开户银行">{selected.payload.bankAccount.bankName}</InfoItem>
                  <InfoItem label="银行账号" mono>{selected.payload.bankAccount.accountNo}</InfoItem>
                  <InfoItem label="户名">{selected.payload.bankAccount.accountName}</InfoItem>
                  <InfoItem label="结算方式">{SETTLEMENT_METHOD_LABELS[selected.payload.settlementMethod] ?? selected.payload.settlementMethod}</InfoItem>
                  <InfoItem label="税务类型">{TAX_TYPE_LABELS[selected.payload.taxType] ?? selected.payload.taxType}</InfoItem>
                  <InfoItem label="税号" mono>{selected.payload.invoiceInfo?.taxNo || '—'}</InfoItem>
                </InfoGrid>
              ) : emptySection('未提交财务信息')
            )}
            {hasPayload(selected) && approvalTab === 'terminal' && (
              <InfoGrid>
                <InfoItem label="终端状态">{selected.payload.terminal?.enabled ? pill('#E8F5E9', '#01795D', '已开通') : pill('#F5F5F5', '#999', '未开通')}</InfoItem>
                <InfoItem label="登录账号" mono emph>{selected.payload.terminal?.username || '—'}</InfoItem>
                <InfoItem label="账号状态">{selected.payload.terminal?.status === 'active' ? '启用' : '停用'}</InfoItem>
              </InfoGrid>
            )}
          </div>
        </DetailDrawer>
      )}

      {/* 通过/驳回确认弹窗 */}
      {reviewing && (
        <div className="category-dialog-overlay" onClick={() => setReviewing(null)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ width: 440 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
              {reviewing.action === 'approved' ? '同意申请' : '驳回申请'}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              {reviewing.approval.code} · {reviewing.approval.payload.name || '注册申请'}
              {reviewing.action === 'approved'
                ? (reviewing.approval.type === 'register' ? '，确认通过？通过后将自动创建供应商档案并开通终端账号。' : '，确认通过？通过后将覆盖该供应商的现有档案。')
                : '，确认驳回？驳回后该申请不生效，合作商可在终端重新提交。'}
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>审批意见</label>
              <textarea className="filter-input" placeholder="请输入审批意见（选填）" value={note}
                onChange={e => setNote(e.target.value)} style={{ width: '100%', minHeight: 70, resize: 'vertical', padding: '10px 12px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setReviewing(null)}>取消</Button>
              <Button variant={reviewing.action === 'approved' ? 'primary' : 'danger'} onClick={confirmReview}>
                确认{reviewing.action === 'approved' ? '通过' : '驳回'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
