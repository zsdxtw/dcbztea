import { useEffect, useMemo, useState } from 'react';
import { useCustomerStore } from '../../stores/customerStore';
import QRCode from 'qrcode';
import { PageHead, Pill } from './PartnerUI';
import { getPartnerAuth } from './PartnerLayout';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useReferralStore, REFERRAL_STATUS_LABELS, REFERRAL_BIZ_LABELS, TRAINING_KIND_OPTIONS } from '../../stores/referralStore';
import type { CustomerReferral, ReferralBizType, ReferralRewardRule } from '../../types';
import './partner.css';

const money = (n: number) => `¥${n.toLocaleString()}`;

/** 分润奖励文案 */
const profitText = (rule: ReferralRewardRule) =>
  rule.profitType === 'fixed' ? `固定 ¥${rule.profitValue.toLocaleString()}` : `成交金额 ${rule.profitValue}%`;

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

/** 合作商终端 · 业务推介：向平台推介客户参加茶培训 / 茶活动，或推荐新合作商入驻淡茶 */
export default function PartnerReferrals() {
  const customerItems = useCustomerStore((st) => st.customers);
  const auth = getPartnerAuth();
  const referrals = useReferralStore((s) => s.referrals);
  const rewardRules = useReferralStore((s) => s.rewardRules);
  const store = useReferralStore;

  const [tab, setTab] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [tick, setTick] = useState(Date.now());

  /** 新增推介表单 */
  const [bizType, setBizType] = useState<ReferralBizType>('training');
  const [trainingKind, setTrainingKind] = useState<string>('茶艺师');
  const [title, setTitle] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [allowDirectCall, setAllowDirectCall] = useState(true);
  const [customerBenefit, setCustomerBenefit] = useState('');
  const [remark, setRemark] = useState('');
  const [formErr, setFormErr] = useState('');

  /** 推荐注册链接 + 二维码（入驻淡茶） */
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const partnerName = auth?.name ?? '合作商';
  const partnerId = auth?.supplierId ?? '';

  /** 专属推荐注册链接：其他用户点击 / 扫码直接进入合作商注册页，注册成功自动认定为您推介 */
  const refLink = useMemo(
    () => `${window.location.origin}/partner/register?ref=${partnerId}`,
    [partnerId],
  );
  const qrLink = useMemo(() => `${refLink}&src=q`, [refLink]);

  useEffect(() => {
    QRCode.toDataURL(qrLink, { width: 240, margin: 1, color: { dark: '#01332A', light: '#FFFFFF' } })
      .then(setQrUrl)
      .catch(() => setQrUrl(''));
  }, [qrLink]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = refLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mine = useMemo(() => referrals.filter((r) => r.supplierId === auth?.supplierId), [referrals, auth]);

  const filtered = useMemo(() => mine.filter((r) => {
    if (tab && r.status !== tab) return false;
    const kw = keyword.trim();
    return !kw || r.code.includes(kw) || r.title.includes(kw) || r.customerName.includes(kw);
  }), [mine, tab, keyword]);

  const countOf = (key: string) => (key === '' ? mine.length : mine.filter((r) => r.status === key).length);

  const stats = useMemo(() => {
    const succeeded = mine.filter((r) => r.status === 'succeeded');
    const reward = succeeded.reduce((s, r) => s + r.rewardAmount, 0);
    return { total: mine.length, active: mine.filter((r) => ['pending', 'contacting', 'confirmed'].includes(r.status)).length, success: succeeded.length, reward };
  }, [mine]);

  const current = selectedId ? mine.find((r) => r.id === selectedId) ?? null : null;

  const STATUS_TABS = ['', 'pending', 'contacting', 'confirmed', 'succeeded', 'failed'];

  const resetForm = () => {
    setBizType('training'); setTrainingKind('茶艺师'); setTitle(''); setCustomerName(''); setContactPerson(''); setCustomerPhone('');
    setAllowDirectCall(true); setCustomerBenefit(''); setRemark(''); setFormErr('');
  };

  const confirmSubmit = () => {
    if (bizType === 'join') {
      if (!customerName.trim() || !contactPerson.trim() || !customerPhone.trim()) {
        setFormErr('客户名称、联系人与联系方式为必填');
        return;
      }
      const order = store.getState().submitReferral({
        supplierId: partnerId,
        supplierName: partnerName,
        bizType: 'join',
        title: `入驻推介 · ${customerName.trim()}`,
        customerName: customerName.trim(),
        contactPerson: contactPerson.trim(),
        customerPhone: customerPhone.trim(),
        allowDirectCall,
        rewardAmount: 0,
        customerBenefit: `新合作商注册入驻淡茶半盏平台，推介成功积分 +${rewardRules.join.score}`,
        remark: remark.trim() || undefined,
      });
      setCreating(false);
      resetForm();
      setSelectedId(order.id);
      return;
    }
    if (!title.trim() || !customerName.trim() || !customerPhone.trim() || !customerBenefit.trim()) {
      setFormErr('项目名称、客户、联系电话与客户福利为必填');
      return;
    }
    // 分润奖励由平台规则设定：固定金额直接入账；百分比在成交后按比例结算（记录先按 0 登记）
    const amt = rewardRules[bizType].profitType === 'fixed' ? rewardRules[bizType].profitValue : 0;
    const finalTitle = bizType === 'training' ? `${trainingKind} · ${title.trim() || '职业技能培训'}` : title.trim();
    const order = store.getState().submitReferral({
      supplierId: partnerId,
      supplierName: partnerName,
      bizType,
      trainingKind: bizType === 'training' ? (trainingKind as CustomerReferral['trainingKind']) : undefined,
      title: finalTitle,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      allowDirectCall,
      rewardAmount: amt,
      customerBenefit: customerBenefit.trim(),
      remark: remark.trim() || undefined,
    });
    setCreating(false);
    resetForm();
    setSelectedId(order.id);
  };

  if (!auth) {
    return (
      <div className="pk-page">
        <PageHead eyebrow="合作商终端" title="客户推介" desc="请先登录合作商终端后使用客户推介。" />
      </div>
    );
  }

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 业务推介"
        title="业务推介"
        desc="向平台推介客户参加茶培训（审评师/茶艺师职业技能培训、兴趣爱好班）、茶活动（工会活动、客户茶会等），或通过专属链接 / 二维码推荐新合作商入驻淡茶。各业务的积分奖励、分润奖励与其他奖励以平台「奖励规则」为准，推介成功自动计入积分。"
      />

      {/* 统计卡 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: '推介总数', value: String(stats.total), sub: '全部推介单' },
          { label: '进行中', value: String(stats.active), sub: '待确认 / 跟进中 / 客户确认' },
          { label: '推介成功', value: String(stats.success), sub: '已结算收益' },
          { label: '累计收益', value: money(stats.reward), sub: '推介成功收益合计' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--pk-line)' }}>
            <div style={{ fontSize: 12, color: 'var(--pk-ink3)' }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#01795D', margin: '4px 0 2px' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--pk-ink3)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* 推荐注册（入驻淡茶）：专属链接 + 二维码 */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--pk-line)', padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 18, alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>推荐注册 · 入驻淡茶 <span style={{ fontSize: 12, fontWeight: 500, color: '#B45309' }}>推介成功 +{rewardRules.join.score} 积分</span></div>
          <div style={{ fontSize: 12, color: 'var(--pk-ink3)', lineHeight: 1.7, marginBottom: 8 }}>
            将您的专属链接或二维码分享给意向门店，对方点击 / 扫码将直接进入合作商注册页；注册成功自动认定为您的推介，并在客户推介列表生成 1 条推介成功记录。
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <code className="mono" style={{ flex: 1, minWidth: 200, maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '7px 12px', background: 'var(--pk-accent-soft)', borderRadius: 8, fontSize: 12.5, color: '#01795D' }}>{refLink}</code>
            <Button size="sm" onClick={copyLink}>{copied ? '已复制 ✓' : '复制链接'}</Button>
          </div>
        </div>
        {qrUrl && <img src={qrUrl} alt="推荐注册二维码" style={{ width: 104, height: 104, borderRadius: 10, border: '1px solid var(--pk-line)', flexShrink: 0 }} />}
      </div>

      {/* 状态 Tab + 新增 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        {STATUS_TABS.map((key) => (
          <button key={key || 'all'} type="button" className={`tab-card-simple${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>
            {key === '' ? '全部' : REFERRAL_STATUS_LABELS[key as keyof typeof REFERRAL_STATUS_LABELS]}
            <span className="tab-card-simple-count">{countOf(key)}</span>
          </button>
        ))}
        <span style={{ marginLeft: 'auto' }}>
          <Button onClick={() => setCreating(true)}>+ 新增推介</Button>
        </span>
      </div>
      <div className="pk-toolbar" style={{ marginBottom: 14 }}>
        <input className="filter-input" placeholder="搜索编号、项目、客户..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </div>

      {/* 列表 */}
      <div className="pk-table-panel">
        <table>
          <thead>
            <tr>
              <th>序号</th><th>编号</th><th>业务类型</th><th>推介项目</th><th>客户</th><th>电话授权</th><th>推介成功收益</th><th>客户福利</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, idx) => (
              <tr key={r.id}>
                <td className="mono" style={{ color: 'var(--pk-ink3)' }}>{idx + 1}</td>
                <td className="cell-mono-emph">{r.code}</td>
                <td><Pill tone={r.bizType === 'training' ? 'blue' : r.bizType === 'activity' ? 'purple' : 'green'}>{REFERRAL_BIZ_LABELS[r.bizType]}</Pill></td>
                <td className="cell-emph" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</td>
                <td>{r.customerName}</td>
                <td>
                  <Pill tone={r.allowDirectCall ? 'green' : 'gray'}>{r.allowDirectCall ? '允许直联' : '经合作商'}</Pill>
                </td>
                <td className="mono" style={{ fontWeight: 600, color: '#01795D' }}>
                  {r.bizType === 'join'
                    ? `+${rewardRules.join.score} 积分`
                    : r.rewardAmount > 0 ? money(r.rewardAmount) : `按成交 ${rewardRules[r.bizType].profitValue}%`}
                </td>
                <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.customerBenefit}>{r.customerBenefit}</td>
                <td>{statusPill(r.status)}</td>
                <td>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedId(r.id)}>查看</Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--pk-ink3)', padding: '28px 0' }}>暂无推介记录，点击右上角「+ 新增推介」发起。</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > 0 && (
        <Pagination total={filtered.length} page={1} pageSize={filtered.length} onPage={() => {}} onPageSize={() => {}} label="条推介" />
      )}

      {/* 详情抽屉 */}
      <DetailDrawer
        open={!!current}
        onClose={() => setSelectedId(null)}
        badge="TJ"
        title={current?.code ?? ''}
        statusTag={current ? statusPill(current.status) : null}
        subtitle={current ? `${REFERRAL_BIZ_LABELS[current.bizType]} · ${current.title} · 提交于 ${current.submitTime}` : ''}
        hideFooter
        footer={<Button variant="ghost" onClick={() => setSelectedId(null)}>关闭</Button>}
      >
        {current && (
          <>
            <DrawerSection title="推介信息">
              <InfoGrid>
                <InfoItem label="推介编号" mono emph>{current.code}</InfoItem>
                <InfoItem label="业务类型">{REFERRAL_BIZ_LABELS[current.bizType]}{current.trainingKind ? ` · ${current.trainingKind}` : ''}</InfoItem>
                <InfoItem label="推介项目" emph>{current.title}</InfoItem>
                <InfoItem label="推介客户" emph>{current.customerName}</InfoItem>
                {current.contactPerson && <InfoItem label="联系人">{current.contactPerson}</InfoItem>}
                <InfoItem label="客户电话" mono>{current.customerPhone}</InfoItem>
                <InfoItem label="电话授权">
                  {current.allowDirectCall
                    ? <span style={{ color: '#01795D', fontWeight: 500 }}>允许平台直接电话联系</span>
                    : <span style={{ color: 'var(--color-neutral-500)' }}>不允许直联 · 须经合作商联系</span>}
                </InfoItem>
                <InfoItem label="推介成功收益" mono emph valueStyle={{ color: '#01795D' }}>
                  {current.bizType === 'join'
                    ? `+${rewardRules.join.score} 积分`
                    : current.rewardAmount > 0 ? money(current.rewardAmount) : `按成交 ${rewardRules[current.bizType].profitValue}%`}
                </InfoItem>
                <InfoItem label="客户福利" span={2}>{current.customerBenefit}</InfoItem>
                <InfoItem label="提交时间">{current.submitTime}</InfoItem>
                {current.successTime && <InfoItem label="成功时间">{current.successTime}</InfoItem>}
                <InfoItem label="备注" span={3}>{current.remark || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title={`跟进记录（${current.followUps.length} 条）`}>
              {current.followUps.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--pk-ink3)' }}>平台尚未跟进，待推介管理接单后更新。</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {current.followUps.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                      <span className="mono" style={{ color: 'var(--pk-ink3)', flexShrink: 0 }}>{f.time}</span>
                      <span style={{ fontWeight: 500, flexShrink: 0 }}>{f.operator}</span>
                      <span style={{ color: 'var(--pk-ink2)' }}>{f.note}</span>
                    </div>
                  ))}
                </div>
              )}
            </DrawerSection>
          </>
        )}
      </DetailDrawer>

      {/* 新增推介弹窗 */}
      {creating && (
        <div className="category-dialog-overlay" onClick={() => setCreating(false)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 800, maxWidth: '94vw' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 4 }}>新增业务推介</h3>
            <div style={{ fontSize: 12, color: 'var(--pk-ink3)', marginBottom: 14, lineHeight: 1.7 }}>
              {bizType === 'join'
                ? '推荐新的合作商注册入驻淡茶半盏平台：填写意向门店信息提交推介，或将您的专属链接 / 二维码直接分享给对方，注册成功自动认定为您的推介，积分 +3。'
                : '向平台推介客户参加茶培训或茶活动。推介成功后您将获得推介收益与积分，客户同步享受推介福利；平台跟进联系方式以您的授权为准。'}
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              {([
                ['training', '茶培训', `成功 +${rewardRules.training.score} 积分`],
                ['activity', '茶活动', `成功 +${rewardRules.activity.score} 积分`],
                ['join', '入驻淡茶', `成功 +${rewardRules.join.score} 积分`],
              ] as [ReferralBizType, string, string][]).map(([v, label, hint]) => (
                <button key={v} type="button" onClick={() => setBizType(v)}
                  style={{
                    flex: 1, textAlign: 'left', padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${bizType === v ? 'var(--pk-accent)' : 'var(--pk-line)'}`,
                    background: bizType === v ? 'var(--pk-accent-soft)' : '#fff',
                  }}>
                  <strong style={{ fontSize: 13.5, color: bizType === v ? '#01795D' : 'var(--pk-ink)' }}>{label}</strong>
                  <div style={{ fontSize: 11, color: 'var(--pk-ink3)', marginTop: 2 }}>{hint}</div>
                </button>
              ))}
            </div>

            {/* 平台奖励规则（管理后台「推介管理 · 奖励规则」设置） */}
            <div style={{ padding: '9px 12px', background: 'var(--pk-accent-soft)', borderRadius: 10, fontSize: 12.5, color: '#01795D', lineHeight: 1.7, marginBottom: 12 }}>
              <strong>推介奖励（平台统一规则）</strong>：积分奖励 +{rewardRules[bizType].score} 分 · 分润奖励：{profitText(rewardRules[bizType])}{rewardRules[bizType].otherReward ? ` · 其他奖励：${rewardRules[bizType].otherReward}` : ''}
            </div>

            {bizType === 'join' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px', marginBottom: 12 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>客户名称（门店名）*</label>
                    <input className="filter-input" style={{ width: '100%' }} placeholder="如：祥源茶浦东店" value={customerName} onChange={(e) => { setCustomerName(e.target.value); setFormErr(''); }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>联系人 *</label>
                    <input className="filter-input" style={{ width: '100%' }} placeholder="门店业务联系人" value={contactPerson} onChange={(e) => { setContactPerson(e.target.value); setFormErr(''); }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>联系方式 *</label>
                    <input className="filter-input mono" style={{ width: '100%' }} placeholder="手机或微信" value={customerPhone} onChange={(e) => { setCustomerPhone(e.target.value); setFormErr(''); }} />
                  </div>
                </div>
                <div style={{ padding: '10px 14px', background: 'var(--pk-accent-soft)', borderRadius: 10, fontSize: 12.5, color: '#01795D', lineHeight: 1.7, marginBottom: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <strong>您的专属推荐注册链接</strong>（对方点击 / 扫码进入注册页，注册成功自动认定为您推介）：
                    <div className="mono" style={{ marginTop: 4, wordBreak: 'break-all' }}>{refLink}</div>
                  </div>
                  {qrUrl && <img src={qrUrl} alt="推荐注册二维码" style={{ width: 76, height: 76, borderRadius: 8, border: '1px solid var(--pk-line)', flexShrink: 0 }} />}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px', marginBottom: 12 }}>
                  {bizType === 'training' && (
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>培训项目 *</label>
                      <select className="filter-select" style={{ width: '100%' }} value={trainingKind} onChange={(e) => setTrainingKind(e.target.value)}>
                        {TRAINING_KIND_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                  )}
                  <div style={{ gridColumn: bizType === 'training' ? 'span 1' : 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{bizType === 'training' ? '推介说明 *' : '活动名称 *'}</label>
                    <input className="filter-input" style={{ width: '100%' }} placeholder={bizType === 'training' ? '如：门店店员技能提升' : '如：客户公司工会春季茶会'} value={title} onChange={(e) => { setTitle(e.target.value); setFormErr(''); }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>推介客户 *</label>
                    <select className="filter-select" style={{ width: '100%' }} value={customerName} onChange={(e) => { setCustomerName(e.target.value); setFormErr(''); }}>
                      <option value="">请选择客户（客户池）</option>
                      {customerItems.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>客户电话 *</label>
                    <input className="filter-input mono" style={{ width: '100%' }} placeholder="客户联系电话" value={customerPhone} onChange={(e) => { setCustomerPhone(e.target.value); setFormErr(''); }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>客户福利 *</label>
                    <input className="filter-input" style={{ width: '100%' }} placeholder="如：首期课程 8 折 / 免费体验一场" value={customerBenefit} onChange={(e) => { setCustomerBenefit(e.target.value); setFormErr(''); }} />
                  </div>
                </div>
              </>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginBottom: 10 }}>
              <input type="checkbox" checked={allowDirectCall} onChange={(e) => setAllowDirectCall(e.target.checked)} style={{ accentColor: '#01795D' }} />
              允许淡茶平台直接电话联系{bizType === 'join' ? '该门店' : '客户'}（不勾选则平台须经您联系）
            </label>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>备注</label>
              <input className="filter-input" style={{ width: '100%' }} placeholder="客户意向说明等（选填）" value={remark} onChange={(e) => setRemark(e.target.value)} />
            </div>

            {formErr && (
              <div style={{ padding: '8px 12px', background: '#FFEBEE', color: '#C62828', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 10 }}>{formErr}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setCreating(false)}>关闭</Button>
              <Button onClick={confirmSubmit}>提交推介</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
