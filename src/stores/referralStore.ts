/**
 * 客户推介 Store（合作商终端 ↔ 管理后台共享）
 * 合作商向平台推介客户参加茶培训 / 茶活动；状态机：
 * pending 待确认 → contacting 跟进中 → confirmed 客户确认 → succeeded 推介成功（登记收益）/ failed 推介失败
 */
import { create } from 'zustand';
import type { CustomerReferral, ReferralBizType, ReferralFollowUp, ReferralRewardRule, ReferralStatus, ReferralTrainingKind } from '../types';

const nowStamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** 生成推介编号：TJ-0001 顺序生成 */
const genReferralCode = (items: CustomerReferral[]): string =>
  `TJ-${String(items.length + 1).padStart(4, '0')}`;

/** 推荐项目种子（演示：覆盖全部状态） */
const seedReferrals: CustomerReferral[] = [
  {
    id: 'ref_1', code: 'TJ-0001',
    supplierId: '11', supplierName: '杭州云茶供应链管理有限公司',
    bizType: 'training', trainingKind: '茶艺师', title: '茶艺师职业技能培训（中级）',
    customerName: '华茗堂茶庄', customerPhone: '010-8234****',
    allowDirectCall: true, rewardAmount: 800, customerBenefit: '首期课程 8 折，赠送茶艺器具一套',
    remark: '客户采购部张明华有意向提升门店服务水平',
    status: 'succeeded', submitTime: '2026-10-20 10:30',
    successTime: '2026-11-10 16:00',
    followUps: [
      { time: '2026-10-20 14:00', operator: '管理员', note: '已接单，电话联系客户确认报名意向' },
      { time: '2026-10-25 09:30', operator: '管理员', note: '客户确认参加中级茶艺师班，约定 11 月开课' },
      { time: '2026-11-10 16:00', operator: '管理员', note: '客户完成缴费开课，推介成功，收益 ¥800 登记发放' },
    ],
  },
  {
    id: 'ref_2', code: 'TJ-0002',
    supplierId: '11', supplierName: '杭州云茶供应链管理有限公司',
    bizType: 'activity', title: '中秋客户品鉴茶会',
    customerName: '清心茶坊', customerPhone: '0571-8612****',
    allowDirectCall: false, rewardAmount: 500, customerBenefit: '免费参与一场品鉴会并获伴手礼',
    remark: '客户中秋 want 组织会员活动，意向强烈',
    status: 'contacting', submitTime: '2026-11-12 09:00',
    followUps: [
      { time: '2026-11-12 15:00', operator: '管理员', note: '已接单；客户未授权直联，经合作商李雅芳转达活动信息' },
    ],
  },
  {
    id: 'ref_3', code: 'TJ-0003',
    supplierId: '11', supplierName: '杭州云茶供应链管理有限公司',
    bizType: 'training', trainingKind: '审评师高级', title: '高级评茶员职业技能培训',
    customerName: '浦发银行工会', customerPhone: '021-5888****',
    allowDirectCall: true, rewardAmount: 1200, customerBenefit: '团体报名 3 人 9 折，赠送审评杯具',
    status: 'pending', submitTime: '2026-11-14 11:20',
    followUps: [],
  },
  {
    id: 'ref_4', code: 'TJ-0004',
    supplierId: '11', supplierName: '杭州云茶供应链管理有限公司',
    bizType: 'activity', title: '春季客户踏青茶会',
    customerName: '品茗轩', customerPhone: '136****3345',
    allowDirectCall: true, rewardAmount: 400, customerBenefit: '免费参加并赠春茶体验装',
    status: 'confirmed', submitTime: '2026-11-05 16:40',
    followUps: [
      { time: '2026-11-06 10:00', operator: '管理员', note: '电话联系客户，确认 4 月初参加踏青茶会' },
    ],
  },
  {
    id: 'ref_5', code: 'TJ-0005',
    supplierId: '11', supplierName: '杭州云茶供应链管理有限公司',
    bizType: 'training', trainingKind: '兴趣爱好班', title: '茶文化兴趣爱好周末班',
    customerName: '茗香阁直播', customerPhone: '137****0912',
    allowDirectCall: false, rewardAmount: 300, customerBenefit: '首次体验课免费',
    status: 'failed', submitTime: '2026-10-28 14:00',
    followUps: [
      { time: '2026-10-29 11:00', operator: '管理员', note: '经合作商联系客户，客户近期无培训计划' },
      { time: '2026-11-02 17:00', operator: '管理员', note: '客户明确暂不参与，推介关闭' },
    ],
  },
];

export interface SubmitReferralInput {
  supplierId: string;
  supplierName: string;
  bizType: ReferralBizType;
  trainingKind?: ReferralTrainingKind;
  title: string;
  customerName: string;
  /** 被推介客户联系人（bizType=join 时填写） */
  contactPerson?: string;
  customerPhone: string;
  allowDirectCall: boolean;
  rewardAmount: number;
  customerBenefit: string;
  remark?: string;
}

/** 推介奖励规则种子（管理后台「推介管理」可调整，展示于合作商发起推介弹窗） */
const seedRewardRules: Record<ReferralBizType, ReferralRewardRule> = {
  training: { score: 1, profitType: 'fixed', profitValue: 800, otherReward: '客户获赠茶艺器具一套（平台统一福利）' },
  activity: { score: 1, profitType: 'percent', profitValue: 5, otherReward: '' },
  join: { score: 3, profitType: 'fixed', profitValue: 0, otherReward: '优先获得平台新商入驻扶持资源' },
};

interface ReferralState {
  referrals: CustomerReferral[];
  /** 各推介业务的奖励规则（积分奖励 / 分润奖励 / 其他奖励），管理后台可设置 */
  rewardRules: Record<ReferralBizType, ReferralRewardRule>;

  /** 合作商终端：提交客户推介 */
  submitReferral: (input: SubmitReferralInput) => CustomerReferral;
  /** 管理后台：设置某推介业务的奖励规则 */
  updateRewardRule: (bizType: ReferralBizType, patch: Partial<ReferralRewardRule>) => void;
  /** 推荐注册归因：新合作商通过专属链接 / 二维码完成注册时，自动为推荐人生成 1 条推介成功的入驻淡茶记录（积分管理随之按奖励规则加分） */
  addJoinSuccessReferral: (input: { supplierId: string; supplierName: string; customerName: string; contactPerson?: string; customerPhone?: string; channel: 'link' | 'qrcode' }) => CustomerReferral;
  /** 管理后台：状态推进（pending → contacting → confirmed → succeeded/failed；failed 可从任意未成功状态进入） */
  advanceReferral: (id: string, status: Exclude<ReferralStatus, 'pending'>, operator?: string) => { ok: boolean; msg: string };
  /** 管理后台：添加跟进记录 */
  addFollowUp: (id: string, note: string, operator?: string) => void;
}

export const useReferralStore = create<ReferralState>((set, get) => ({
  referrals: seedReferrals,
  rewardRules: seedRewardRules,

  /** 管理后台：设置某推介业务的奖励规则 */
  updateRewardRule: (bizType, patch) =>
    set((s) => ({
      rewardRules: { ...s.rewardRules, [bizType]: { ...s.rewardRules[bizType], ...patch } },
    })),

  submitReferral: (input) => {
    const referrals = get().referrals;
    const order: CustomerReferral = {
      id: `ref_${Date.now()}`,
      code: genReferralCode(referrals),
      ...input,
      status: 'pending',
      submitTime: nowStamp(),
      followUps: [],
    };
    set({ referrals: [order, ...referrals] });
    return order;
  },

  addJoinSuccessReferral: (input) => {
    const referrals = get().referrals;
    const stamp = nowStamp();
    const joinScore = get().rewardRules.join.score;
    const order: CustomerReferral = {
      id: `ref_${Date.now()}`,
      code: genReferralCode(referrals),
      supplierId: input.supplierId,
      supplierName: input.supplierName,
      bizType: 'join',
      title: `入驻淡茶 · ${input.customerName}`,
      customerName: input.customerName,
      contactPerson: input.contactPerson,
      customerPhone: input.customerPhone ?? '—',
      allowDirectCall: true,
      rewardAmount: get().rewardRules.join.profitType === 'fixed' ? get().rewardRules.join.profitValue : 0,
      customerBenefit: `新合作商注册入驻淡茶半盏平台，推介成功积分 +${joinScore}`,
      status: 'succeeded',
      submitTime: stamp,
      successTime: stamp,
      followUps: [
        { time: stamp, operator: '系统', note: `通过推荐注册${input.channel === 'qrcode' ? '二维码' : '链接'}完成注册，自动认定为您推介，积分 +${joinScore}` },
      ],
    };
    set({ referrals: [order, ...referrals] });
    return order;
  },

  advanceReferral: (id, status, operator = '管理员') => {
    const order = get().referrals.find((r) => r.id === id);
    if (!order) return { ok: false, msg: '推介单不存在' };
    if (order.status === 'succeeded' || order.status === 'failed') return { ok: false, msg: '该推介已关闭，不可再推进' };
    const actionLabels: Partial<Record<ReferralStatus, string>> = {
      contacting: '接单跟进',
      confirmed: '客户确认参与',
      succeeded: '推介成功，收益登记发放',
      failed: '推介失败',
    };
    set((s) => ({
      referrals: s.referrals.map((r) => {
        if (r.id !== id) return r;
        const followUp: ReferralFollowUp = { time: nowStamp(), operator, note: actionLabels[status] ?? '状态推进' };
        return {
          ...r,
          status,
          ...(status === 'succeeded' ? { successTime: nowStamp() } : {}),
          followUps: [...r.followUps, followUp],
        };
      }),
    }));
    return { ok: true, msg: actionLabels[status] ?? '已推进' };
  },

  addFollowUp: (id, note, operator = '管理员') => {
    if (!note.trim()) return;
    set((s) => ({
      referrals: s.referrals.map((r) =>
        r.id === id ? { ...r, followUps: [...r.followUps, { time: nowStamp(), operator, note: note.trim() }] } : r,
      ),
    }));
  },
}));

/** 推介状态中文标签 */
export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  pending: '待确认',
  contacting: '跟进中',
  confirmed: '客户确认',
  succeeded: '推介成功',
  failed: '推介失败',
};

/** 推介业务类型中文标签 */
export const REFERRAL_BIZ_LABELS: Record<ReferralBizType, string> = {
  training: '茶培训',
  activity: '茶活动',
  join: '入驻淡茶',
};

/** 培训项目选项（茶培训类型下拉用） */
export const TRAINING_KIND_OPTIONS: ReferralTrainingKind[] = ['审评师初级', '审评师中级', '审评师高级', '茶艺师', '兴趣爱好班'];
