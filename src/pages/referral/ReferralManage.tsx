import { useEffect, useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useReferralStore, REFERRAL_STATUS_LABELS, REFERRAL_BIZ_LABELS } from '../../stores/referralStore';
import { REFERRAL_SUCCESS_SCORES } from '../../stores/scoreStore';
import type { CustomerReferral, ReferralStatus } from '../../types';

const money = (n: number) => `¥${n.toLocaleString('en-US')}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FFF3E0', color: '#E65100' },
  contacting: { bg: '#E3F2FD', color: '#0F64B5' },
  confirmed: { bg: '#F3E5F5', color: '#7B1FA2' },
  succeeded: { bg: '#E8F5E9', color: '#01795D' },
  failed: { bg: '#ECEFF1', color: '#455A64' },
};

const statusPill = (status: string) => {
  const c = STATUS_COLORS[status] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
  return pill(c.bg, c.color, REFERRAL_STATUS_LABELS[status as keyof typeof REFERRAL_STATUS_LABELS] ?? status);
};

/** 管理后台 · 合作商 → 推介管理：全平台业务推介单跟进、入驻淡茶管理与各业务奖励规则设置 */
export default function ReferralManage() {
  const referrals = useReferralStore((s) => s.referrals);
  const rewardRules = useReferralStore((s) => s.rewardRules);
  const store = useReferralStore;

  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [followNote, setFollowNote] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const flash = (text: string) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const filtered = useMemo(() => referrals.filter((r) => {
    if (filterType && r.bizType !== filterType) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterSupplier && r.supplierName !== filterSupplier) return false;
    const kw = keyword.trim();
    return !kw || r.code.includes(kw) || r.title.includes(kw) || r.customerName.includes(kw) || r.supplierName.includes(kw);
  }), [referrals, filterType, filterStatus, filterSupplier, keyword]);

  const suppliers = useMemo(() => [...new Set(referrals.map((r) => r.supplierName))], [referrals]);

  const current = selectedId ? referrals.find((r) => r.id === selectedId) ?? null : null;

  const doAdvance = (o: CustomerReferral, status: Exclude<ReferralStatus, 'pending'>) => {
    const res = store.getState().advanceReferral(o.id, status);
    flash(res.msg);
    setTimeout(() => setMsg(''), 3000);
  };

  const doFollowUp = () => {
    if (!current || !followNote.trim()) return;
    store.getState().addFollowUp(current.id, followNote.trim());
    setFollowNote('');
  };

  const supplierNames = useMemo(() => [...new Set(referrals.map((r) => r.supplierName))], [referrals]);

  return (
    <>
      <ContentHeader title="推介管理" breadcrumbs={['合作商', '推介管理']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          合作商<strong>业务推介</strong>统一跟进入口：<strong>茶培训</strong>（审评师/茶艺师职业技能培训、兴趣爱好班）、<strong>茶活动</strong>（工会活动、客户茶会等）与
          <strong>入驻淡茶</strong>（推荐新合作商通过专属链接 / 二维码注册入驻，注册成功自动生成推介成功记录并按奖励规则加分）。
          培训 / 活动推介单接单跟进（客户未授权直联时须经合作商联系）→ 客户确认 → 推介成功登记收益发放；任一阶段可登记为推介失败。各业务奖励规则可在下方设置。
        </div>

        {msg && (
          <div style={{ padding: '8px 14px', background: '#E8F5E9', color: '#01795D', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{msg}</div>
        )}

        {/* 推介奖励规则设置（展示在合作商发起推介弹窗） */}
        <Card style={{ padding: 0, marginBottom: 'var(--space-4)' }}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setShowRules((v) => !v)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowRules((v) => !v); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer' }}
          >
            <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-md)' }}>推介奖励规则设置</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
              <span>培训 +{rewardRules.training.score} 分 · 活动 +{rewardRules.activity.score} 分 · 入驻 +{rewardRules.join.score} 分</span>
              <span style={{ transform: showRules ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
            </div>
          </div>
          {showRules && (
            <div style={{ padding: '4px 16px 16px', display: 'grid', gap: 'var(--space-3)' }}>
              {(['training', 'activity', 'join'] as const).map((biz) => {
                const rule = rewardRules[biz];
                return (
                  <div key={biz} style={{ display: 'grid', gridTemplateColumns: '88px 1fr 1.4fr', gap: 'var(--space-3)', alignItems: 'center', padding: '10px 12px', border: '1px solid var(--color-neutral-150)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>{REFERRAL_BIZ_LABELS[biz]}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>积分奖励</label>
                      <input
                        className="filter-input mono" type="number" min={0} step={1} style={{ width: 76 }}
                        value={rule.score}
                        onChange={(e) => store.getState().updateRewardRule(biz, { score: Number(e.target.value) || 0 })}
                      />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>分</span>
                      <span style={{ borderLeft: '1px solid var(--color-neutral-150)', height: 18, margin: '0 4px' }} />
                      <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>分润奖励</label>
                      <button
                        type="button"
                        className={`tab-card-simple${rule.profitType === 'fixed' ? ' active' : ''}`}
                        style={{ padding: '3px 10px', fontSize: 'var(--text-xs)' }}
                        onClick={() => store.getState().updateRewardRule(biz, { profitType: 'fixed' })}
                      >固定金额</button>
                      <button
                        type="button"
                        className={`tab-card-simple${rule.profitType === 'percent' ? ' active' : ''}`}
                        style={{ padding: '3px 10px', fontSize: 'var(--text-xs)' }}
                        onClick={() => store.getState().updateRewardRule(biz, { profitType: 'percent' })}
                      >成交百分比</button>
                      <input
                        className="filter-input mono" type="number" min={0} style={{ width: 86 }}
                        value={rule.profitValue}
                        onChange={(e) => store.getState().updateRewardRule(biz, { profitValue: Number(e.target.value) || 0 })}
                      />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{rule.profitType === 'fixed' ? '元' : '%'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', whiteSpace: 'nowrap' }}>其他奖励</label>
                      <input
                        className="filter-input" style={{ flex: 1 }}
                        placeholder="如新商扶持资源、礼品说明（可空）"
                        value={rule.otherReward}
                        onChange={(e) => store.getState().updateRewardRule(biz, { otherReward: e.target.value })}
                      />
                    </div>
                  </div>
                );
              })}
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', lineHeight: 1.7 }}>
                修改即时生效并展示在合作商工作台「新增业务推介」弹窗；分润奖励按固定金额 / 成交金额百分比二选一，成交百分比在成交后按实际金额结算。
              </div>
            </div>
          )}
        </Card>

        {/* 统计卡 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          {(() => {
            const pending = referrals.filter((r) => r.status === 'pending').length;
            const active = referrals.filter((r) => ['contacting', 'confirmed'].includes(r.status)).length;
            const succeeded = referrals.filter((r) => r.status === 'succeeded');
            const reward = succeeded.reduce((s, r) => s + r.rewardAmount, 0);
            return [
              { label: '待确认', value: String(pending) },
              { label: '跟进中 / 客户确认', value: String(active) },
              { label: '推介成功', value: String(succeeded.length) },
              { label: '累计应付收益', value: money(reward) },
            ].map((s) => (
              <div key={s.label} style={{ background: '#fff', border: '1px solid var(--color-neutral-150)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-module-current-base)', marginTop: 4 }}>{s.value}</div>
              </div>
            ));
          })()}
        </div>

        {/* 筛选 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
          <input className="filter-input" placeholder="搜索编号、项目、客户、合作商..." style={{ width: 240 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">全部业务类型</option>
            <option value="training">茶培训</option>
            <option value="activity">茶活动</option>
            <option value="join">入驻淡茶</option>
          </select>
          <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">全部状态</option>
            {Object.entries(REFERRAL_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="filter-select" value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}>
            <option value="">全部合作商</option>
            {supplierNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>共 {filtered.length} 条</span>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['序号', '编号', '合作商', '业务类型', '推介项目', '客户', '电话授权', '收益', '客户福利', '状态', '操作']}
            rows={filtered.map((r, idx) => [
              <span key="i" className="mono" style={{ color: 'var(--color-neutral-500)' }}>{idx + 1}</span>,
              <span key="c" className="cell-mono-emph">{r.code}</span>,
              <span key="s" style={{ fontSize: 'var(--text-sm)' }}>{r.supplierName}</span>,
              <span key="bt">{pill(r.bizType === 'training' ? '#E3F2FD' : r.bizType === 'activity' ? '#F3E5F5' : '#E8F5E9', r.bizType === 'training' ? '#0F64B5' : r.bizType === 'activity' ? '#7B1FA2' : '#01795D', REFERRAL_BIZ_LABELS[r.bizType])}</span>,
              <span key="t" className="cell-emph" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{r.title}</span>,
              <span key="cu">{r.customerName}</span>,
              <span key="ac">{pill(r.allowDirectCall ? '#E8F5E9' : 'var(--color-neutral-100)', r.allowDirectCall ? '#01795D' : 'var(--color-neutral-500)', r.allowDirectCall ? '允许直联' : '经合作商')}</span>,
              <span key="r" className="mono" style={{ fontWeight: 'var(--font-semibold)', color: '#01795D' }}>{r.bizType === 'join' ? `+${REFERRAL_SUCCESS_SCORES.join} 积分` : money(r.rewardAmount)}</span>,
              <span key="b" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={r.customerBenefit}>{r.customerBenefit}</span>,
              statusPill(r.status),
              <div key="act" className="row-actions">
                <Button size="sm" onClick={() => setSelectedId(r.id)}>跟进</Button>
              </div>,
            ])}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)' }}>暂无推介记录</div>
          )}
        </Card>
      </div>

      {/* 跟进抽屉 */}
      <DetailDrawer
        open={!!current}
        onClose={() => setSelectedId(null)}
        badge="TJ"
        title={current?.code ?? ''}
        statusTag={current ? statusPill(current.status) : null}
        subtitle={current ? `${REFERRAL_BIZ_LABELS[current.bizType]} · ${current.title} · ${current.supplierName}` : ''}
        hideFooter
        footer={<Button variant="ghost" onClick={() => setSelectedId(null)}>关闭</Button>}
      >
        {current && (
          <>
            <DrawerSection title="推介信息">
              <InfoGrid>
                <InfoItem label="推介编号" mono emph>{current.code}</InfoItem>
                <InfoItem label="推介合作商">{current.supplierName}</InfoItem>
                <InfoItem label="业务类型">{REFERRAL_BIZ_LABELS[current.bizType]}{current.trainingKind ? ` · ${current.trainingKind}` : ''}</InfoItem>
                <InfoItem label="推介项目" emph>{current.title}</InfoItem>
                <InfoItem label="推介客户" emph>{current.customerName}</InfoItem>
                <InfoItem label="客户电话" mono>{current.customerPhone}</InfoItem>
                <InfoItem label="电话授权">
                  {current.allowDirectCall
                    ? <span style={{ color: '#01795D', fontWeight: 500 }}>允许直联（{current.customerPhone}）</span>
                    : <span style={{ color: 'var(--color-neutral-500)' }}>须经合作商联系</span>}
                </InfoItem>
                <InfoItem label="推介收益" mono emph valueStyle={{ color: '#01795D' }}>
                  {current.bizType === 'join'
                    ? `+${rewardRules.join.score} 积分`
                    : current.rewardAmount > 0 ? money(current.rewardAmount) : `按成交 ${rewardRules[current.bizType].profitValue}%`}
                </InfoItem>
                <InfoItem label="客户福利" span={3}>{current.customerBenefit}</InfoItem>
                <InfoItem label="提交时间">{current.submitTime}</InfoItem>
                {current.successTime && <InfoItem label="成功时间">{current.successTime}</InfoItem>}
                <InfoItem label="备注" span={3}>{current.remark || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            {current.status !== 'succeeded' && current.status !== 'failed' && (
              <DrawerSection title="状态推进">
                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  {current.status === 'pending' && <Button onClick={() => doAdvance(current, 'contacting')}>接单跟进</Button>}
                  {current.status === 'contacting' && <Button onClick={() => doAdvance(current, 'confirmed')}>客户确认参与</Button>}
                  {(current.status === 'contacting' || current.status === 'confirmed') && (
                    <>
                      <Button onClick={() => doAdvance(current, 'succeeded')}>推介成功（登记收益）</Button>
                      <Button variant="danger" onClick={() => doAdvance(current, 'failed')}>推介失败</Button>
                    </>
                  )}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 8, lineHeight: 1.7 }}>
                  推介成功后登记收益发放（合作商累计收益 +{money(current.rewardAmount)}），客户福利同步生效；每次推进写入跟进记录。
                </div>
              </DrawerSection>
            )}

            <DrawerSection title={`跟进记录（${current.followUps.length} 条）`}>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <input
                    className="filter-input" style={{ flex: 1 }} placeholder="添加跟进说明（联系情况、客户反馈等）"
                    value={followNote} onChange={(e) => setFollowNote(e.target.value)}
                  />
                  <Button onClick={doFollowUp} disabled={!followNote.trim()}>添加记录</Button>
                </div>
              </div>
              {current.followUps.length === 0 ? (
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无跟进记录</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {current.followUps.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, fontSize: 'var(--text-sm)' }}>
                      <span className="mono" style={{ color: 'var(--color-neutral-400)', flexShrink: 0 }}>{f.time}</span>
                      <span style={{ fontWeight: 500, flexShrink: 0 }}>{f.operator}</span>
                      <span style={{ color: 'var(--color-neutral-700)' }}>{f.note}</span>
                    </div>
                  ))}
                </div>
              )}
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </>
  );
}
