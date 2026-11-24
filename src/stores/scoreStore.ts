/**
 * 合作商积分 Store（管理后台 ↔ 合作商终端共享）
 *
 * 积分构成（六维）：
 * 1. 基础积分（派生）：注册审批成功 +1；每维护 1 个门店 +0.5 封顶 5；每主营品牌 +0.5 封顶 3；每报价一个商品 +0.1 封顶 5
 * 2. 经营积分（派生）：每结算完成 1 单 +0.2 不封顶；经营结算总金额每 1 万 +0.2 不封顶
 * 3. 报备积分（派生）：订单报备审批通过 +0.1；订单报备转入并接单 +0.1；商品/地区报备本身不加分，但基于其转入的订单按结算金额每 1 万 +0.1（额外于经营积分）
 * 4. 推介积分（派生）：茶培训 / 茶活动推介成功各 +1；入驻淡茶（推荐新合作商注册入驻）成功 +3
 * 5. 申报积分（台账）：合作商主动申报（客户拜访 / 活动组织 / 其他，可传凭证图），平台评估给分；入驻推介的积分由「业务推介 · 入驻淡茶」推介成功自动计入（见第 4 维）
 * 6. 扣分规则（台账 + 派生）：人工违规扣分；接单后第 4 天起每延迟 1 天发货自动扣 0.1 分（接单当天/第 2/3 天发货不扣，未发货订单累计扣至当日）
 * 比单评分取「经营+报备+推介+申报−扣分规则」等动态合计。
 */
import { create } from 'zustand';
import type { MarketingClaim, MarketingClaimType, PartnerScoreEntry, PartnerScoreSummary, ScoreDimension, SupplierItem } from '../types';
import { scoreBases } from '../data/partnerScores';

const now = () => new Date().toISOString().slice(0, 10);
const nowStamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** 台账种子（积分申报评估与处罚示例） */
const seedEntries: PartnerScoreEntry[] = [
  { id: 'se_m_1', supplierId: '11', supplierName: '杭州云茶供应链管理有限公司', dimension: 'marketing', delta: 2, reason: '积分申报评估通过（客户拜访 · 苏州吴门茶事）', time: '2026-11-10', refCode: 'SB-0002', operator: '管理员' },
  { id: 'se_3_1', supplierId: '3', supplierName: '八马茶业股份有限公司', dimension: 'penalty', delta: -10, reason: '客户投诉包装破损（已赔付）', time: '2026-09-15', operator: '管理员' },
  { id: 'se_11_1', supplierId: '11', supplierName: '杭州云茶供应链管理有限公司', dimension: 'penalty', delta: -10, reason: '客户投诉迟发未提前报备', time: '2026-09-19', operator: '管理员' },
];

/** 积分申报种子（1 待评估 + 1 已通过） */
const seedClaims: MarketingClaim[] = [
  {
    id: 'sb_2', code: 'SB-0002', supplierId: '11', supplierName: '杭州云茶供应链管理有限公司',
    claimType: 'visit',
    title: '客户线下拜访（苏州吴门茶事）', description: '赴苏州拜访客户吴门茶事主理人，洽谈春季供货计划与茶培训推介，客户意向积极。',
    status: 'approved', score: 2, submitTime: '2026-11-08 10:20', reviewTime: '2026-11-10 09:00', reviewer: '管理员', reviewNote: '拜访记录完整，评估 +2 分',
  },
  {
    id: 'sb_1', code: 'SB-0001', supplierId: '3', supplierName: '八马茶业股份有限公司',
    claimType: 'visit',
    title: '客户线下拜访（北京马连道茶城）', description: '拜访马连道茶城三家门店客户，收集秋季采购需求。',
    status: 'pending', submitTime: '2026-11-14 16:00',
  },
];

interface ReferralState {
  marketingClaims: MarketingClaim[];
  entries: PartnerScoreEntry[];
  /** 合作商终端：提交积分申报（类型 + 标题 + 描述 + 凭证图片） */
  submitMarketingClaim: (input: { supplierId: string; supplierName: string; claimType: MarketingClaim['claimType']; title: string; description: string; images?: string[] }) => MarketingClaim;
  /** 管理后台：评估申报（通过给分 / 驳回） */
  reviewMarketingClaim: (id: string, status: 'approved' | 'rejected', score: number | undefined, reviewer: string, reviewNote?: string) => { ok: boolean; msg: string };
  addEntry: (input: {
    supplierId: string;
    supplierName: string;
    dimension: PartnerScoreEntry['dimension'];
    delta: number;
    reason: string;
    refCode?: string;
    operator?: string;
  }) => void;
}

export const useScoreStore = create<ReferralState>((set, get) => ({
  marketingClaims: seedClaims,
  entries: seedEntries,

  submitMarketingClaim: (input) => {
    const claim: MarketingClaim = {
      id: `sb_${Date.now()}`,
      code: `SB-${String(getNextClaimSeq(get().marketingClaims)).padStart(4, '0')}`,
      status: 'pending',
      submitTime: nowStamp(),
      ...input,
    };
    set((s) => ({ marketingClaims: [claim, ...s.marketingClaims] }));
    return claim;
  },

  reviewMarketingClaim: (id, status, score, reviewer, reviewNote) => {
    const claim = get().marketingClaims.find((c) => c.id === id);
    if (!claim) return { ok: false, msg: '申报不存在' };
    if (claim.status !== 'pending') return { ok: false, msg: '该申报已评估' };
    if (status === 'approved' && (!Number.isFinite(score) || (score as number) <= 0)) {
      return { ok: false, msg: '通过时须填写大于 0 的评估分值' };
    }
    set((s) => ({
      marketingClaims: s.marketingClaims.map((c) => (c.id === id ? { ...c, status, score: status === 'approved' ? score : undefined, reviewTime: nowStamp(), reviewer, reviewNote } : c)),
      entries: [
        ...(status === 'approved'
          ? [{ id: `se_${Date.now()}`, supplierId: claim.supplierId, supplierName: claim.supplierName, dimension: 'marketing' as const, delta: score as number, reason: `积分申报评估通过（${MARKETING_CLAIM_TYPE_LABELS[claim.claimType] ?? '其他'} · ${claim.title}）`, time: now(), refCode: claim.code, operator: reviewer }]
          : []),
        ...s.entries,
      ],
    }));
    return { ok: true, msg: status === 'approved' ? `评估通过，+${score} 分已入台账` : '已驳回' };
  },

  addEntry: (input) =>
    set((s) => ({
      entries: [
        { id: `se_${Date.now()}`, time: now(), ...input },
        ...s.entries,
      ],
    })),
}));

function getNextClaimSeq(claims: MarketingClaim[]): number {
  const max = claims.reduce((m, c) => Math.max(m, Number(c.code.replace('SB-', '')) || 0), 0);
  return max + 1;
}

/* ── 积分计算器（六维派生 + 台账汇总） ── */

/** 积分计算上下文（调用方传入各 store 数据切片） */
export interface ScoreContext {
  /** 合作商档案（基础积分派生：门店/主营品牌） */
  supplier?: SupplierItem;
  /** 该合作商名下的订单流转单（经营积分：结算单量与金额；报备积分：按有效报备类型区分加分；处罚：发货延迟扣分）
   *  settled=客户回款到位（订单级收款完成）；paid=合作商付款完成（采购单已结算）——业务确认 F：两者齐备才计经营/报备结算积分 */
  orders?: {
    partnerId?: string;
    transferSource?: string;
    /** 转出后履约状态（接单及之后计入转单加分） */
    partnerStatus?: string;
    /** 客户回款到位（应收侧：订单收款核销完成） */
    settled?: boolean;
    /** 合作商付款完成（应付侧：采购单已结算） */
    paid?: boolean;
    /** 报备命中列表（首个 = 转出依据，reportType 区分订单报备与商品/地区报备） */
    reportMatches?: { reportType?: string; partnerId?: string }[];
    /** 处理轨迹（发货延迟扣分：取「合作商接单 / 合作商发货」时间） */
    history?: { time: string; action: string; detail?: string }[];
    totalAmount: number;
  }[];
  /** 该合作商的报备记录（报备积分：订单报备审批通过数） */
  reports?: { partnerName?: string; type?: string; status?: string }[];
  /** 该合作商的推介（推介积分：按奖励规则配置的积分值加分） */
  referrals?: { supplierId?: string; bizType?: string; status?: string }[];
  /** 各推介业务的积分奖励（来自推介管理奖励规则配置；缺省用默认 REFERRAL_SUCCESS_SCORES） */
  referralScores?: { training?: number; activity?: number; join?: number };
  /** 该合作商报价覆盖的商品数（基础积分：每报价一个商品 +0.1） */
  quotedProductCount?: number;
  /** 该合作商积分台账 */
  entries: PartnerScoreEntry[];
}

const clamp = (v: number, cap?: number) => cap === undefined ? v : Math.min(v, cap);
const round1 = (v: number) => Math.round(v * 10) / 10;

/** 计算单个合作商的六维积分汇总 */
export function computeScore(ctx: ScoreContext): PartnerScoreSummary & { entries: PartnerScoreEntry[] } {
  const sid = ctx.supplier?.id ?? (ctx.entries[0]?.supplierId ?? '');
  const name = ctx.supplier?.name ?? (ctx.entries[0]?.supplierName ?? '');
  const mine = ctx.entries.filter((e) => e.supplierId === sid);
  const sum = (dim: PartnerScoreEntry['dimension']) => mine.filter((e) => e.dimension === dim).reduce((acc, e) => acc + e.delta, 0);

  /* 基础积分（派生） */
  const stores = ctx.supplier?.stores?.length ?? 0;
  const brands = ctx.supplier?.mainBrands?.length ?? 0;
  const quoted = ctx.quotedProductCount ?? 0;
  const basic = round1(
    1
    + clamp(stores * 0.5, 5)
    + clamp(brands * 0.5, 3)
    + clamp(quoted * 0.1, 5),
  );

  /* 经营积分（派生）：「结算完成」= 合作商付款完成（采购单已结算）且客户回款到位（订单收款核销完成）；
     部分收款 / 仅付款未回款的订单不计入，不按金额比例预计算（业务确认 F） */
  const mineOrders = (ctx.orders ?? []).filter((o) => o.partnerId === sid);
  const settled = mineOrders.filter((o) => o.settled === true && o.paid === true);
  const operation = round1(settled.length * 0.2 + Math.floor(settled.reduce((s, o) => s + o.totalAmount, 0) / 10000) * 0.2);

  /* 报备积分（派生）：
     - 订单报备：审批通过 +0.1；基于该报备转入并接单再 +0.1
     - 商品报备 / 地区报备：报备成功本身不加分，但基于其转入的订单按结算金额每 1 万 +0.1（额外于经营积分的正常加分） */
  const reports = ctx.reports ?? [];
  const approvedOrderReports = reports.filter((r) => r.partnerName === name && r.type === 'order' && r.status === 'approved').length;
  // 报备转出的有效依据 = 首个命中报备（匹配列表按 订单报备 > 商品报备 > 地区报备 优先级排序）
  const effReportType = (o: NonNullable<ScoreContext['orders']>[number]): string =>
    o.reportMatches?.find((m) => m.partnerId === sid)?.reportType ?? o.reportMatches?.[0]?.reportType ?? 'order';
  const isAccepted = (o: NonNullable<ScoreContext['orders']>[number]) =>
    !!o.partnerStatus && !['pending', 'rejected'].includes(o.partnerStatus);
  const reportOrders = mineOrders.filter((o) => o.transferSource === 'report');
  const orderReportTransfers = reportOrders.filter((o) => effReportType(o) === 'order' && isAccepted(o));
  const prReportSettled = reportOrders.filter((o) => effReportType(o) !== 'order' && o.settled === true && o.paid === true);
  const report = round1(
    approvedOrderReports * 0.1
    + orderReportTransfers.length * 0.1
    + Math.floor(prReportSettled.reduce((s, o) => s + o.totalAmount, 0) / 10000) * 0.1,
  );

  /* 推介积分（派生）：按推介管理奖励规则配置的积分值（培训 / 活动各 +1、入驻淡茶 +3） */
  const refs = (ctx.referrals ?? []).filter((r) => r.supplierId === sid && r.status === 'succeeded');
  const rScores = {
    training: ctx.referralScores?.training ?? REFERRAL_SUCCESS_SCORES.training,
    activity: ctx.referralScores?.activity ?? REFERRAL_SUCCESS_SCORES.activity,
    join: ctx.referralScores?.join ?? REFERRAL_SUCCESS_SCORES.join,
  };
  const referral = round1(
    refs.filter((r) => r.bizType === 'training').length * rScores.training
    + refs.filter((r) => r.bizType === 'activity').length * rScores.activity
    + refs.filter((r) => r.bizType === 'join').length * rScores.join,
  );

  const marketing = sum('marketing');

  /* 处罚 = 台账人工扣分 + 发货延迟自动扣分（派生）
     规则：接单后第 4 天起每延迟 1 天发货扣 0.1 分（接单当天、第 2 天、第 3 天发货都不扣，即延迟 ≤2 天不扣）；
     已接单未发货的订单按接单日期累计扣至当日 */
  const ledgerPenalty = sum('penalty');
  const dayDiff = (a: string, b: string) => {
    const ta = new Date(a.slice(0, 10).replace(/-/g, '/')).getTime();
    const tb = new Date(b.slice(0, 10).replace(/-/g, '/')).getTime();
    return Number.isFinite(ta) && Number.isFinite(tb) ? Math.round((tb - ta) / 86400000) : 0;
  };
  const lateShipDeduction = round1(mineOrders.reduce((acc, o) => {
    const accept = o.history?.find((e) => e.action === '合作商接单')?.time;
    if (!accept) return acc;
    const ship = o.history?.find((e) => e.action === '合作商发货')?.time
      ?? (o.partnerStatus === 'accepted' ? now() : undefined);
    if (!ship) return acc;
    return acc + Math.max(0, dayDiff(accept, ship) - 2) * 0.1;
  }, 0));
  const penalty = round1(ledgerPenalty - lateShipDeduction);
  const base = scoreBases[sid]?.base ?? 60;
  const total = round1(base + basic + operation + report + referral + marketing + penalty);

  return {
    supplierId: sid,
    supplierName: name,
    basic,
    operation,
    report,
    referral,
    marketing,
    penalty,
    total,
    ontimeRate: scoreBases[sid]?.ontimeRate ?? 88,
    entries: mine,
    lateShipDeduction,
  };
}

/** 兼容便捷入口：对象参数（ctx 字段均可选，传入越全计算越准） */
export function getScoreSummary(input: {
  entries: PartnerScoreEntry[];
  supplierId: string;
  supplierName: string;
  supplier?: SupplierItem;
  orders?: {
    partnerId?: string;
    transferSource?: string;
    partnerStatus?: string;
    settled?: boolean;
    paid?: boolean;
    reportMatches?: { reportType?: string; partnerId?: string }[];
    history?: { time: string; action: string; detail?: string }[];
    totalAmount: number;
  }[];
  reports?: { partnerName?: string; type?: string; status?: string }[];
  referrals?: { supplierId?: string; bizType?: string; status?: string }[];
  referralScores?: { training?: number; activity?: number; join?: number };
  quotedProductCount?: number;
}): PartnerScoreSummary {
  const { entries, supplierId, supplierName, supplier, orders, reports, referrals, referralScores, quotedProductCount } = input;
  const r = computeScore({ entries, supplier: supplier ?? ({ id: supplierId, name: supplierName } as SupplierItem), orders, reports, referrals, referralScores, quotedProductCount });
  const { entries: _e, ...summary } = r;
  return summary;
}

/** 积分维度中文标签 */
export const SCORE_DIMENSION_LABELS: Record<ScoreDimension, string> = {
  basic: '基础积分',
  operation: '经营积分',
  report: '报备积分',
  referral: '推介积分',
  marketing: '申报积分',
  penalty: '扣分规则',
};

/** 推介成功积分：茶培训 / 茶活动各 +1，入驻淡茶（推介新合作商注册入驻）+3 */
export const REFERRAL_SUCCESS_SCORES: Record<'training' | 'activity' | 'join', number> = {
  training: 1,
  activity: 1,
  join: 3,
};

/** 积分申报类型中文标签（入驻推介不在申报类型中：其积分由「业务推介 · 入驻淡茶」推介成功自动计入） */
export const MARKETING_CLAIM_TYPE_LABELS: Record<MarketingClaimType, string> = {
  visit: '客户拜访',
  event: '活动组织',
  other: '其他',
};

/** 积分规则说明（页面展示用；推介积分按奖励规则配置动态生成） */
export const buildScoreRules = (referralScores?: { training?: number; activity?: number; join?: number }): { dimension: string; rule: string; source: string }[] => {
  const s = {
    training: referralScores?.training ?? REFERRAL_SUCCESS_SCORES.training,
    activity: referralScores?.activity ?? REFERRAL_SUCCESS_SCORES.activity,
    join: referralScores?.join ?? REFERRAL_SUCCESS_SCORES.join,
  };
  return [
    { dimension: '基础积分', rule: '注册审批成功 +1；每维护 1 个门店 +0.5（封顶 5 分）；每 1 个主营品牌 +0.5（封顶 3 分）；每报价 1 个商品 +0.1（封顶 5 分）', source: '自动计算（合作商档案 / 供货报价）' },
    { dimension: '经营积分', rule: '每「结算完成」1 单 +0.2（不封顶）；结算总金额每 1 万 +0.2（不封顶）。结算完成 = 合作商付款完成（采购单已结算）且客户回款到位（订单收款核销完成）；部分收款不计比例积分', source: '自动计算（合作商付款 + 客户回款双门槛）' },
    { dimension: '报备积分', rule: '订单报备审批通过 +0.1；订单报备转入并接单再 +0.1；商品报备、地区报备报备成功不加分，但基于报备转入的订单按结算金额每 1 万额外 +0.1（在经营积分正常加分之外）', source: '自动计算（报备审批 / 报备转单）' },
    { dimension: '推介积分', rule: `每成功推介 1 个茶培训或茶活动 +${s.training} 分；每成功推介 1 个入驻淡茶（推荐新合作商通过专属链接 / 二维码注册入驻）+${s.join} 分`, source: '自动计算（业务推介 / 推荐注册成功）' },
    { dimension: '申报积分', rule: '主动发起积分申报（客户拜访 / 活动组织 / 其他），描述事项并可上传凭证图片，提交后由淡茶半盏评估给分；入驻推介的积分不在申报中，由「业务推介」入驻淡茶推介成功自动计入', source: '积分管理页 · 积分申报' },
    { dimension: '扣分规则', rule: '客户投诉 / 违规行为按情节扣分（人工登记）；发货延迟自动扣分：接单后第 4 天起每延迟 1 天发货扣 0.1 分（接单当天、第 2 天、第 3 天发货都不扣，已接单未发货的订单累计扣至当日）', source: '人工登记 + 自动计算（订单履约）' },
  ];
};
