import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useSupplierStore } from '../../stores/supplierStore';
import { useScoreStore, computeScore, getScoreSummary, SCORE_DIMENSION_LABELS, buildScoreRules, MARKETING_CLAIM_TYPE_LABELS } from '../../stores/scoreStore';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { useReportStore } from '../../stores/reportStore';
import { useReferralStore } from '../../stores/referralStore';
import type { ScoreDimension } from '../../types';

const DIMENSIONS: ScoreDimension[] = ['operation', 'report', 'referral', 'marketing', 'penalty'];

const dimColor = (d: ScoreDimension) => {
  switch (d) {
    case 'operation': return '#0F64B5';
    case 'report': return '#7B1FA2';
    case 'referral': return '#01795D';
    case 'marketing': return '#B45309';
    case 'penalty': return '#C62828';
    default: return 'var(--color-neutral-500)';
  }
};

/** 采购&仓储 · 合作商积分：六维积分构成（派生+台账）、营销申报评估、明细台账与处罚登记 */
export default function CooperationScores() {
  const suppliers = useSupplierStore((s) => s.suppliers);
  const orders = useOrderFlowStore((s) => s.orders);
  const reports = useReportStore((s) => s.reports);
  const referrals = useReferralStore((s) => s.referrals);
  const entries = useScoreStore((s) => s.entries);
  const marketingClaims = useScoreStore((s) => s.marketingClaims);
  const rewardRules = useReferralStore((s) => s.rewardRules);
  const scoreStore = useScoreStore;
  const supplierStore = useSupplierStore;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [claimTab, setClaimTab] = useState<'pending' | 'done'>('pending');

  /** 评估弹窗 */
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewScore, setReviewScore] = useState('2');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewErr, setReviewErr] = useState('');

  /** 处罚登记 */
  const [adjusting, setAdjusting] = useState(false);
  const [delta, setDelta] = useState('-10');
  const [reason, setReason] = useState('');
  const [adjustError, setAdjustError] = useState('');

  const quotedCountOf = (sid: string) => {
    const setting = supplierStore.getState().quoteSettings[sid];
    if (!setting) return 0;
    return new Set([
      ...Object.keys(setting.productOverrides ?? {}),
      ...Object.keys(setting.supplyProducts ?? {}).filter((k) => setting.supplyProducts?.[k]),
    ]).size;
  };

  const scored = useMemo(
    () =>
      suppliers
        .filter((s) => s.status === 'active' || entries.some((e) => e.supplierId === s.id))
        .map((s) => computeScore({
          entries,
          supplier: s,
          orders: orders.filter((o) => o.partnerId === s.id),
          reports: reports.filter((r) => r.partnerName === s.name),
          referrals: referrals.filter((r) => r.supplierId === s.id),
          referralScores: {
            training: rewardRules.training.score,
            activity: rewardRules.activity.score,
            join: rewardRules.join.score,
          },
          quotedProductCount: quotedCountOf(s.id),
        }))
        .sort((a, b) => b.total - a.total),
    [suppliers, orders, reports, referrals, entries, supplierStore],
  );

  const filtered = useMemo(
    () => scored.filter((s) => !keyword || s.supplierName.includes(keyword)),
    [scored, keyword],
  );

  const current = selectedId ? scored.find((s) => s.supplierId === selectedId) ?? null : null;
  const currentEntries = useMemo(
    () => (selectedId ? entries.filter((e) => e.supplierId === selectedId) : []),
    [entries, selectedId],
  );

  const pendingClaims = useMemo(() => marketingClaims.filter((c) => c.status === 'pending'), [marketingClaims]);
  const doneClaims = useMemo(() => marketingClaims.filter((c) => c.status !== 'pending'), [marketingClaims]);

  /** 处罚登记 */
  const confirmAdjust = () => {
    if (!current) return;
    const d = Number(delta);
    if (!Number.isFinite(d) || d === 0) {
      setAdjustError('分值必须为非 0 数字（正数加分 / 负数扣分）');
      return;
    }
    if (!reason.trim()) {
      setAdjustError('请填写登记原因');
      return;
    }
    scoreStore.getState().addEntry({
      supplierId: current.supplierId,
      supplierName: current.supplierName,
      dimension: 'penalty',
      delta: d,
      reason: reason.trim(),
      operator: '管理员',
    });
    setAdjusting(false);
    setReason('');
    setAdjustError('');
  };

  /** 申报评估 */
  const confirmReview = (claimId: string, approve: boolean) => {
    const score = Number(reviewScore);
    if (approve && (!Number.isFinite(score) || score <= 0)) {
      setReviewErr('通过时须填写大于 0 的评估分值');
      return;
    }
    const res = scoreStore.getState().reviewMarketingClaim(
      claimId,
      approve ? 'approved' : 'rejected',
      approve ? score : undefined,
      '管理员',
      reviewNote.trim() || undefined,
    );
    if (!res.ok) { setReviewErr(res.msg); return; }
    setReviewing(null);
    setReviewNote('');
    setReviewErr('');
  };

  return (
    <>
      <ContentHeader title="合作商积分" breadcrumbs={['合作商', '合作商积分']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          积分由<strong>基础 / 经营 / 报备 / 推介</strong>四个自动计算维度、<strong>申报积分</strong>（合作商主动申报、平台评估给分）与<strong>扣分规则</strong>构成；总分 = 期初分 + 各维合计。
          比单评分取经营 / 报备 / 推介 / 营销等动态合计，规则见下方明细抽屉中的积分规则表。
        </div>

        {/* 积分规则 */}
        <Card style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>积分规则</div>
          <Table
            headers={['维度', '规则', '来源']}
            rows={buildScoreRules({
              training: rewardRules.training.score,
              activity: rewardRules.activity.score,
              join: rewardRules.join.score,
            }).map((r) => [
              <span key="d" style={{ fontWeight: 'var(--font-medium)' }}>{r.dimension}</span>,
              <span key="a" style={{ fontSize: 'var(--text-sm)' }}>{r.rule}</span>,
              <span key="h" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>{r.source}</span>,
            ])}
          />
        </Card>

        {/* 积分申报（评估） */}
        <Card style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <div style={{ fontWeight: 'var(--font-semibold)' }}>申报积分评估</div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button size="sm" variant={claimTab === 'pending' ? 'primary' : 'ghost'} onClick={() => setClaimTab('pending')}>待评估 {pendingClaims.length}</Button>
              <Button size="sm" variant={claimTab === 'done' ? 'primary' : 'ghost'} onClick={() => setClaimTab('done')}>已处理 {doneClaims.length}</Button>
            </div>
          </div>
          <Table
            headers={['编号', '合作商', '申报类型', '事项标题', '事项描述', '凭证', '提交时间', claimTab === 'pending' ? '操作' : '评估结果']}
            rows={(claimTab === 'pending' ? pendingClaims : doneClaims).map((c) => [
              <span key="c" className="cell-mono-emph">{c.code}</span>,
              <span key="s" className="cell-emph">{c.supplierName}</span>,
              <span key="ct" style={{ whiteSpace: 'nowrap' }}>{MARKETING_CLAIM_TYPE_LABELS[c.claimType] ?? '其他'}</span>,
              <span key="t" className="cell-emph">{c.title}</span>,
              <span key="d" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={c.description}>{c.description}</span>,
              <span key="img">
                {c.images?.length
                  ? <div style={{ display: 'flex', gap: 4 }}>
                      {c.images.map((src, i) => (
                        <img key={i} src={src} alt={`凭证${i + 1}`} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--color-neutral-200)' }} />
                      ))}
                    </div>
                  : <span style={{ color: 'var(--color-neutral-400)', fontSize: 'var(--text-xs)' }}>—</span>}
              </span>,
              <span key="tm" className="mono" style={{ whiteSpace: 'nowrap' }}>{c.submitTime}</span>,
              claimTab === 'pending'
                ? <Button key="a" size="sm" onClick={() => { setReviewing(c.id); setReviewScore('2'); setReviewNote(''); setReviewErr(''); }}>评估</Button>
                : <span key="r" style={{ fontSize: 'var(--text-xs)' }}>
                    {c.status === 'approved'
                      ? <span style={{ color: '#01795D', fontWeight: 600 }}>通过 +{c.score} 分</span>
                      : <span style={{ color: 'var(--color-neutral-500)' }}>已驳回</span>}
                    {c.reviewNote ? <span style={{ display: 'block', color: 'var(--color-neutral-400)' }}>{c.reviewNote}</span> : null}
                  </span>,
            ])}
          />
          {claimTab === 'pending' && pendingClaims.length === 0 && (
            <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)' }}>暂无待评估申报</div>
          )}
        </Card>

        {/* 积分构成榜 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <input className="filter-input" placeholder="搜索合作商名称..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>共 {filtered.length} 家合作商</span>
        </div>
        <Card style={{ padding: 0 }}>
          <Table
            headers={['排名', '合作商', '总分', '基础', '经营', '报备', '推介', '申报', '扣分规则', '履约率', '操作']}
            rows={filtered.map((s, i) => [
              <span key="r" className="mono" style={{ fontWeight: 'var(--font-semibold)' }}>#{i + 1}</span>,
              <span key="n" className="cell-emph">{s.supplierName}</span>,
              <span key="t" className="mono" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)', fontSize: 'var(--text-md)' }}>{s.total}</span>,
              <span key="b" className="mono">{s.basic}</span>,
              <span key="o" className="mono">{s.operation}</span>,
              <span key="rp" className="mono">{s.report}</span>,
              <span key="rf" className="mono">{s.referral}</span>,
              <span key="mk" className="mono" style={{ color: '#B45309' }}>{s.marketing}</span>,
              <span key="p" className="mono" style={{ color: s.penalty < 0 ? '#C62828' : 'var(--color-neutral-400)' }}>{s.penalty}</span>,
              <span key="ot" className="mono">{s.ontimeRate}%</span>,
              <div key="act" className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => { setSelectedId(s.supplierId); setAdjusting(false); }}>台账</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      {/* 台账抽屉 */}
      <DetailDrawer
        open={!!current}
        onClose={() => setSelectedId(null)}
        badge="JF"
        title={current?.supplierName ?? ''}
        subtitle={current ? `积分总分 ${current.total} · 履约率 ${current.ontimeRate}%` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedId(null)}>关闭</Button>
            {current && <Button onClick={() => { setAdjusting(true); setAdjustError(''); }}>处罚登记</Button>}
          </>
        }
      >
        {current && (
          <>
            <DrawerSection title="六维汇总">
              <InfoGrid>
                <InfoItem label="期初分（快照）">{Math.round((current.total - current.basic - current.operation - current.report - current.referral - current.marketing - current.penalty) * 10) / 10}</InfoItem>
                <InfoItem label="基础积分（派生）" mono>{current.basic}</InfoItem>
                <InfoItem label="经营积分（派生）" mono>{current.operation}</InfoItem>
                <InfoItem label="报备积分（派生）" mono>{current.report}</InfoItem>
                <InfoItem label="推介积分（派生）" mono>{current.referral}</InfoItem>
                <InfoItem label="申报积分（台账）" mono>{current.marketing}</InfoItem>
                <InfoItem label="扣分规则（人工+延迟）" mono valueStyle={{ color: '#C62828' }}>{current.penalty}</InfoItem>
                {!!current.lateShipDeduction && <InfoItem label="其中：发货延迟扣分（自动）" mono valueStyle={{ color: '#C62828' }}>{current.lateShipDeduction}</InfoItem>}
                <InfoItem label="总分" mono emph>{current.total}</InfoItem>
                <InfoItem label="履约率" mono>{current.ontimeRate}%</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title={`台账流水（${currentEntries.length} 条）`}>
              <table className="detail-inline-table">
                <thead><tr><th>时间</th><th>维度</th><th>分值</th><th>原因</th><th>关联单号</th></tr></thead>
                <tbody>
                  {currentEntries.map((e) => (
                    <tr key={e.id}>
                      <td className="mono">{e.time}</td>
                      <td>{SCORE_DIMENSION_LABELS[e.dimension] ?? e.dimension}</td>
                      <td className="mono" style={{ color: e.delta > 0 ? '#01795D' : '#C62828', fontWeight: 'var(--font-semibold)' }}>{e.delta > 0 ? `+${e.delta}` : e.delta}</td>
                      <td>{e.reason}</td>
                      <td className="mono">{e.refCode ?? '—'}</td>
                    </tr>
                  ))}
                  {currentEntries.length === 0 && (
                    <tr><td colSpan={5} style={{ color: 'var(--color-neutral-400)', textAlign: 'center', padding: 'var(--space-4)' }}>暂无流水</td></tr>
                  )}
                </tbody>
              </table>
            </DrawerSection>

            {adjusting && (
              <DrawerSection title="处罚登记 / 手动调分">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <label className="drawer-label">分值（负数=扣分）</label>
                    <input className="filter-input mono" value={delta} onChange={(e) => { setDelta(e.target.value); setAdjustError(''); }} style={{ width: '100%' }} />
                  </div>
                </div>
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="drawer-label">原因 *</label>
                  <input className="filter-input" placeholder="如：客户投诉发货破损" value={reason} onChange={(e) => { setReason(e.target.value); setAdjustError(''); }} style={{ width: '100%' }} />
                </div>
                {adjustError && <div style={{ padding: '8px 12px', background: '#FFEBEE', color: '#C62828', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{adjustError}</div>}
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <Button variant="ghost" onClick={() => setAdjusting(false)}>关闭</Button>
                  <Button onClick={confirmAdjust}>确认入账</Button>
                </div>
              </DrawerSection>
            )}
          </>
        )}
      </DetailDrawer>

      {/* 积分申报评估弹窗 */}
      {reviewing && (() => {
        const claim = marketingClaims.find((c) => c.id === reviewing);
        if (!claim) return null;
        return (
          <div className="category-dialog-overlay" onClick={() => setReviewing(null)}>
            <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 520, maxWidth: '94vw' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 4 }}>积分申报评估</h3>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)' }}>
                {claim.code} · {claim.supplierName} · {MARKETING_CLAIM_TYPE_LABELS[claim.claimType] ?? '其他'} · 提交于 {claim.submitTime}
              </div>

              <DrawerSection title="申报事项">
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 6 }}>{claim.title}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', lineHeight: 1.7 }}>{claim.description}</div>
                {claim.images?.length ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'var(--space-3)' }}>
                    {claim.images.map((src, i) => (
                      <img key={i} src={src} alt={`凭证${i + 1}`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--color-neutral-200)' }} />
                    ))}
                  </div>
                ) : null}
              </DrawerSection>

              <DrawerSection title="评估给分">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <label className="drawer-label" style={{ margin: 0 }}>评估分值 *</label>
                  <input
                    className="filter-input mono" type="number" min={0.1} step={0.1} style={{ width: 120 }}
                    placeholder="大于 0"
                    value={reviewScore}
                    onChange={(e) => { setReviewScore(e.target.value); setReviewErr(''); }}
                  />
                </div>
                <div>
                  <label className="drawer-label">评估意见</label>
                  <input
                    className="filter-input"
                    placeholder="如：拜访记录完整，评估通过"
                    value={reviewNote}
                    onChange={(e) => { setReviewNote(e.target.value); setReviewErr(''); }}
                    style={{ width: '100%' }}
                  />
                </div>
                {reviewErr && (
                  <div style={{ padding: '8px 12px', background: '#FFEBEE', color: '#C62828', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-3)' }}>{reviewErr}</div>
                )}
              </DrawerSection>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
                <Button variant="ghost" onClick={() => setReviewing(null)}>关闭</Button>
                <Button variant="ghost" onClick={() => confirmReview(claim.id, false)}>驳回</Button>
                <Button onClick={() => confirmReview(claim.id, true)}>通过并入账</Button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
