import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHead, Pill } from './PartnerUI';
import { getPartnerAuth } from './PartnerLayout';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import { useScoreStore, computeScore, buildScoreRules, MARKETING_CLAIM_TYPE_LABELS } from '../../stores/scoreStore';
import { useSupplierStore } from '../../stores/supplierStore';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { receiveStateOf } from '../../utils/salesOrderFamily';
import { useReportStore } from '../../stores/reportStore';
import { useReferralStore } from '../../stores/referralStore';
import { SCORE_DIMENSION_LABELS } from '../../stores/scoreStore';
import type { MarketingClaim, MarketingClaimType, ScoreDimension } from '../../types';
import './partner.css';

const dimColor = (d: ScoreDimension) => {
  switch (d) {
    case 'operation': return '#0F64B5';
    case 'report': return '#7B1FA2';
    case 'referral': return '#01795D';
    case 'marketing': return '#B45309';
    case 'penalty': return '#C62828';
    default: return 'var(--pk-ink3)';
  }
};

/** 申报类型选项（含提示语） */
const CLAIM_TYPE_OPTIONS: [MarketingClaimType, string, string][] = [
  ['visit', '客户拜访', '线下拜访客户、洽谈合作'],
  ['event', '活动组织', '组织茶会 / 品鉴 / 培训活动'],
  ['other', '其他', '其他值得激励的营销事项'],
];

/** 各类型下的事项描述占位提醒 */
const CLAIM_TYPE_DESC_PLACEHOLDER: Record<MarketingClaimType, string> = {
  visit: '拜访对象 / 活动内容 / 成效等',
  event: '活动主题 / 时间地点 / 参与人数 / 成效等',
  other: '事项内容 / 成效等',
};

/** 申报进展三步条：已提交 → 评估中 → 已出结果 */
function ClaimStepBar({ claim }: { claim: MarketingClaim }) {
  const steps = ['已提交', '评估中', '已出结果'];
  const stateOf = (i: number): 'done' | 'active' | 'todo' => {
    if (claim.status !== 'pending') return i <= 1 ? 'done' : 'done';
    return i === 0 ? 'done' : i === 1 ? 'active' : 'todo';
  };
  const dotStyle = (s: 'done' | 'active' | 'todo') =>
    s === 'done'
      ? { width: 8, height: 8, borderRadius: '50%', background: '#01795D' }
      : s === 'active'
        ? { width: 8, height: 8, borderRadius: '50%', background: '#fff', border: '2px solid #B45309' }
        : { width: 8, height: 8, borderRadius: '50%', background: 'var(--pk-line)' };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {steps.map((label, i) => (
        <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <span style={{ width: 14, height: 1, background: claim.status !== 'pending' || i === 1 ? '#01795D' : 'var(--pk-line)' }} />}
          <span style={dotStyle(stateOf(i))} />
          <span style={{ fontSize: 11, color: 'var(--pk-ink3)' }}>{label}</span>
        </span>
      ))}
    </div>
  );
}

/** 合作商终端 · 积分管理：六维积分构成查询、规则说明、积分申报（弹窗）与申报进展、明细台账 */
export default function PartnerScores() {
  const auth = getPartnerAuth();
  const suppliers = useSupplierStore((s) => s.suppliers);
  const orders = useOrderFlowStore((s) => s.orders);
  const poDocs = usePurchaseStore((s) => s.docs);
  const reports = useReportStore((s) => s.reports);
  const referrals = useReferralStore((s) => s.referrals);
  const entries = useScoreStore((s) => s.entries);
  const marketingClaims = useScoreStore((s) => s.marketingClaims);
  const rewardRules = useReferralStore((s) => s.rewardRules);
  const scoreStore = useScoreStore;
  const supplierStore = useSupplierStore;

  const [claimTab, setClaimTab] = useState<'rules' | 'claims' | 'ledger'>('rules');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* 积分申报弹窗 */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [claimType, setClaimType] = useState<MarketingClaimType>('visit');
  const [claimTitle, setClaimTitle] = useState('');
  const [claimDesc, setClaimDesc] = useState('');
  const [claimImages, setClaimImages] = useState<string[]>([]);
  const [claimErr, setClaimErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [claimMsg, setClaimMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { setPage(1); }, [claimTab]);

  if (!auth) {
    return (
      <div className="pk-page">
        <PageHead eyebrow="合作商终端" title="积分管理" desc="请先登录合作商终端后查询积分。" />
      </div>
    );
  }

  const partner = auth?.supplierId
    ? suppliers.find((s) => s.id === auth.supplierId)
    : suppliers.find((s) => s.terminal.enabled && s.terminal.username === auth.username);
  const myId = partner?.id ?? '';
  const myName = partner?.name ?? '';

  const summary = computeScore({
    entries,
    supplier: partner,
    /* P7/F：经营积分取数 = 客户回款到位 + 合作商付款完成（采购单已结算）双门槛 */
    orders: orders.filter((o) => o.partnerId === myId).map((o) => {
      const pos = poDocs.filter((d) => d.childOrderId === o.id && d.source === 'distribute');
      return {
        ...o,
        settled: receiveStateOf(o, poDocs.filter((d) => d.childOrderId === o.id)) === '已收款',
        paid: pos.length > 0 && pos.every((d) => d.status === 'settled'),
      };
    }),
    reports: reports.filter((r) => r.partnerName === myName),
    referrals: referrals.filter((r) => r.supplierId === myId),
    referralScores: {
      training: rewardRules.training.score,
      activity: rewardRules.activity.score,
      join: rewardRules.join.score,
    },
    quotedProductCount: (() => {
      const setting = supplierStore.getState().quoteSettings[myId];
      if (!setting) return 0;
      return new Set([
        ...Object.keys(setting.productOverrides ?? {}),
        ...Object.keys(setting.supplyProducts ?? {}).filter((k) => setting.supplyProducts?.[k]),
      ]).size;
    })(),
  });

  const myEntries = useMemo(() => entries.filter((e) => e.supplierId === myId), [entries, myId]);
  const myClaims = useMemo(() => marketingClaims.filter((c) => c.supplierId === myId), [marketingClaims, myId]);
  const ledgerPages = Math.max(1, Math.ceil(myEntries.length / pageSize));
  const pagedEntries = myEntries.slice((page - 1) * pageSize, page * pageSize);

  /** 选择凭证图片（累计最多 5 张，转 data URL） */
  const pickImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = 5 - claimImages.length;
    if (room <= 0) { setClaimErr('最多上传 5 张图片'); return; }
    Array.from(files).slice(0, room).forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => setClaimImages((prev) => (prev.length >= 5 ? prev : [...prev, String(reader.result)]));
      reader.readAsDataURL(f);
    });
    setClaimErr('');
  };

  const openDialog = () => {
    setClaimType('visit'); setClaimTitle(''); setClaimDesc(''); setClaimImages([]); setClaimErr('');
    setDialogOpen(true);
  };

  const submitClaim = () => {
    if (!claimTitle.trim() || !claimDesc.trim()) {
      setClaimErr('申报标题与事项描述为必填');
      return;
    }
    const claim = scoreStore.getState().submitMarketingClaim({
      supplierId: myId,
      supplierName: myName,
      claimType,
      title: claimTitle.trim(),
      description: claimDesc.trim(),
      images: claimImages.length > 0 ? claimImages : undefined,
    });
    setDialogOpen(false);
    setClaimTab('claims');
    setClaimMsg({ ok: true, text: `申报已提交（${claim.code}），待淡茶半盏评估给分` });
    setTimeout(() => setClaimMsg(null), 4000);
  };

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 积分管理"
        title="积分管理"
        desc="查询六维积分构成与明细台账；申报积分（客户拜访 / 门店推介 / 活动组织等）可主动发起积分申报，可上传凭证图片，提交后由淡茶半盏评估给分。积分总分参与比单评分。"
      />

      {claimMsg && (
        <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14, background: claimMsg.ok ? '#E8F5E9' : '#FFEBEE', color: claimMsg.ok ? '#01795D' : '#C62828', fontWeight: 500 }}>
          {claimMsg.text}
        </div>
      )}

      {/* 六维统计卡 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: '基础积分', v: summary.basic, hint: '注册/门店/品牌/报价' },
          { label: '经营积分', v: summary.operation, hint: '结算单量与金额' },
          { label: '报备积分', v: summary.report, hint: '报备与转单' },
          { label: '推介积分', v: summary.referral, hint: '培训/活动/入驻推介' },
          { label: '申报积分', v: summary.marketing, hint: '主动申报评估' },
          { label: '扣分规则', v: summary.penalty, hint: '违规/延迟发货扣分' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--pk-line)' }}>
            <div style={{ fontSize: 12, color: 'var(--pk-ink3)' }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.label === '扣分规则' ? (s.v < 0 ? '#C62828' : 'var(--pk-ink3)') : '#01795D', margin: '4px 0 2px' }}>{s.v}</div>
            <div style={{ fontSize: 11, color: 'var(--pk-ink3)' }}>{s.hint}</div>
          </div>
        ))}
      </div>

      {/* 总分条 */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--pk-line)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>积分总分</span>
        <span style={{ fontSize: 26, fontWeight: 700, color: '#01795D' }}>{summary.total}</span>
        <span style={{ fontSize: 12, color: 'var(--pk-ink3)' }}>= 期初分 {Math.round((summary.total - summary.basic - summary.operation - summary.report - summary.referral - summary.marketing - summary.penalty) * 10) / 10} + 六维合计 · 履约率 {summary.ontimeRate}% · 参与比单评分</span>
      </div>

      {/* Tab 行 + 积分申报按钮 */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <button type="button" className={`tab-card-simple${claimTab === 'rules' ? ' active' : ''}`} onClick={() => setClaimTab('rules')}>积分规则</button>
        <button type="button" className={`tab-card-simple${claimTab === 'claims' ? ' active' : ''}`} onClick={() => setClaimTab('claims')}>申报管理 <span className="tab-card-simple-count">{myClaims.length}</span></button>
        <button type="button" className={`tab-card-simple${claimTab === 'ledger' ? ' active' : ''}`} onClick={() => setClaimTab('ledger')}>积分台账 <span className="tab-card-simple-count">{myEntries.length}</span></button>
        <div style={{ marginLeft: 'auto' }}>
          <Button onClick={openDialog}>积分申报</Button>
        </div>
      </div>

      {/* 积分规则 */}
      {claimTab === 'rules' && (
        <div className="pk-table-panel">
          <table>
            <thead><tr><th>维度</th><th>规则</th><th>来源</th></tr></thead>
            <tbody>
              {buildScoreRules({
                training: rewardRules.training.score,
                activity: rewardRules.activity.score,
                join: rewardRules.join.score,
              }).map((r) => (
                <tr key={r.dimension}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.dimension}</td>
                  <td>{r.rule}</td>
                  <td style={{ color: 'var(--pk-ink3)' }}>{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 申报管理（已申报进展） */}
      {claimTab === 'claims' && (
        <div className="pk-table-panel">
          <table>
            <thead><tr><th>编号</th><th>类型</th><th>事项标题</th><th>凭证</th><th>提交时间</th><th>申报进展</th></tr></thead>
            <tbody>
              {myClaims.map((c) => (
                <tr key={c.id}>
                  <td className="mono">{c.code}</td>
                  <td><Pill tone="green">{MARKETING_CLAIM_TYPE_LABELS[c.claimType] ?? '其他'}</Pill></td>
                  <td className="cell-emph">{c.title}</td>
                  <td>
                    {c.images?.length
                      ? <div style={{ display: 'flex', gap: 4 }}>
                          {c.images.map((src, i) => (
                            <img key={i} src={src} alt={`凭证${i + 1}`} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--pk-line)' }} />
                          ))}
                        </div>
                      : <span style={{ color: 'var(--pk-ink3)', fontSize: 12 }}>—</span>}
                  </td>
                  <td className="mono">{c.submitTime}</td>
                  <td>
                    <ClaimStepBar claim={c} />
                    {c.status === 'approved' && <div style={{ fontSize: 12, color: '#01795D', fontWeight: 600, marginTop: 4 }}>评估通过 +{c.score} 分{c.reviewNote ? ` · ${c.reviewNote}` : ''}</div>}
                    {c.status === 'rejected' && <div style={{ fontSize: 12, color: '#C62828', fontWeight: 600, marginTop: 4 }}>已驳回{c.reviewNote ? ` · ${c.reviewNote}` : ''}</div>}
                  </td>
                </tr>
              ))}
              {myClaims.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--pk-ink3)', padding: '24px 0' }}>暂无申报记录，点击右上角「积分申报」发起申报</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 积分台账 */}
      {claimTab === 'ledger' && (
        <>
          <div className="pk-table-panel">
            <table>
              <thead><tr><th>时间</th><th>维度</th><th>分值</th><th>原因</th><th>关联单号</th></tr></thead>
              <tbody>
                {pagedEntries.map((e) => (
                  <tr key={e.id}>
                    <td className="mono">{e.time}</td>
                    <td>{SCORE_DIMENSION_LABELS[e.dimension as ScoreDimension] ?? e.dimension}</td>
                    <td className="mono" style={{ color: e.delta > 0 ? '#01795D' : '#C62828', fontWeight: 600 }}>{e.delta > 0 ? `+${e.delta}` : e.delta}</td>
                    <td>{e.reason}</td>
                    <td className="mono">{e.refCode ?? '—'}</td>
                  </tr>
                ))}
                {pagedEntries.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--pk-ink3)', padding: '24px 0' }}>暂无台账流水</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {myEntries.length > 0 && (
            <Pagination total={myEntries.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} label="条台账" />
          )}
        </>
      )}

      {/* 积分申报弹窗 */}
      {dialogOpen && (
        <div className="category-dialog-overlay" onClick={() => setDialogOpen(false)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 800, maxWidth: '94vw' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 4 }}>积分申报</h3>
            <div style={{ fontSize: 12, color: 'var(--pk-ink3)', marginBottom: 14, lineHeight: 1.7 }}>
              客户线下拜访、市场推广等活动可主动申报积分，描述事项并可上传凭证图片（非必输），提交后由淡茶半盏评估给分。
            </div>

            {/* 申报类型 */}
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>申报类型 *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
              {CLAIM_TYPE_OPTIONS.map(([v, label, hint]) => (
                <button key={v} type="button" onClick={() => setClaimType(v)}
                  style={{
                    textAlign: 'left', padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${claimType === v ? 'var(--pk-accent)' : 'var(--pk-line)'}`,
                    background: claimType === v ? 'var(--pk-accent-soft)' : '#fff',
                  }}>
                  <strong style={{ fontSize: 13, color: claimType === v ? '#01795D' : 'var(--pk-ink)' }}>{label}</strong>
                  <div style={{ fontSize: 11, color: 'var(--pk-ink3)', marginTop: 2 }}>{hint}</div>
                </button>
              ))}
            </div>

            {/* 申报标题 */}
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>申报标题 *</label>
            <input className="filter-input" style={{ width: '100%', marginBottom: 12 }} placeholder="如：客户线下拜访（福州茶都市场）" value={claimTitle} onChange={(e) => { setClaimTitle(e.target.value); setClaimErr(''); }} />

            {/* 事项描述 */}
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>事项描述 *</label>
            <textarea
              style={{ width: '100%', minHeight: 88, padding: '9px 12px', borderRadius: 10, border: '1px solid var(--pk-line)', fontSize: 13, lineHeight: 1.7, resize: 'vertical', marginBottom: 12, outline: 'none', fontFamily: 'inherit' }}
              placeholder={CLAIM_TYPE_DESC_PLACEHOLDER[claimType]}
              value={claimDesc}
              onChange={(e) => { setClaimDesc(e.target.value); setClaimErr(''); }}
            />

            {/* 凭证图片（非必输，最多 5 张） */}
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
              上传图片 <span style={{ fontWeight: 400, color: 'var(--pk-ink3)' }}>（非必输，最多 5 张，已传 {claimImages.length}/5）</span>
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: claimErr ? 10 : 14 }}>
              {claimImages.map((src, i) => (
                <div key={i} style={{ position: 'relative', width: 64, height: 64 }}>
                  <img src={src} alt={`凭证${i + 1}`} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--pk-line)' }} />
                  <button
                    type="button"
                    onClick={() => setClaimImages((prev) => prev.filter((_, idx) => idx !== i))}
                    style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', border: 'none', background: '#C62828', color: '#fff', fontSize: 11, lineHeight: '18px', cursor: 'pointer', padding: 0 }}
                    aria-label="移除图片"
                  >×</button>
                </div>
              ))}
              {claimImages.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{ width: 64, height: 64, borderRadius: 8, border: '1px dashed var(--pk-line)', background: '#fff', color: 'var(--pk-ink3)', fontSize: 11, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span>
                  <span>上传图片</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => { pickImages(e.target.files); e.target.value = ''; }} />
            </div>

            {claimErr && (
              <div style={{ padding: '8px 12px', background: '#FFEBEE', color: '#C62828', borderRadius: 10, fontSize: 12.5, marginBottom: 12 }}>{claimErr}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>关闭</Button>
              <Button onClick={submitClaim}>提交申报</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
