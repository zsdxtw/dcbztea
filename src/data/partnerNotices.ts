/**
 * 合作商通知公告演示种子（管理端发布 ↔ 合作商工作台展示）
 */
import type { PartnerNotice } from '../types';

export const noticeSeeds: PartnerNotice[] = [
  {
    id: 'nt_seed_1',
    code: 'TZGG-0001',
    title: '2026 年秋茶采购季合作商供货质量要求',
    content: [
      '各位合作商：',
      '2026 年秋茶采购季即将开启，为保障平台商品品质，请各供货合作商注意以下要求：',
      '1. 秋茶新货需提供当季检测报告（农残、重金属指标），随首批货同步寄送；',
      '2. 供货价如有调整，请提前 7 个工作日在终端「报价管理」中提交调价，未提交仍按原报价执行；',
      '3. 直发订单请严格按约定的发货时效出库，超时将影响履约积分。',
      '感谢各位的支持与配合。',
    ].join('\n'),
    level: 'important',
    pinned: true,
    status: 'published',
    publishTime: '2026-10-28',
    publisher: '运营部-陈工作台',
    createTime: '2026-10-27',
  },
  {
    id: 'nt_seed_2',
    code: 'TZGG-0002',
    title: '合作商终端 11 月系统升级公告',
    content: [
      '为提升使用体验，合作商工作台将于 2026 年 11 月 15 日 22:00 - 24:00 进行系统升级。',
      '升级期间终端暂不可登录，请提前安排好接单、报价与报备等操作。',
      '升级内容包括：比单大厅体验优化、报价管理新增是否供货开关、结算账单明细增强。',
    ].join('\n'),
    level: 'normal',
    pinned: false,
    status: 'published',
    publishTime: '2026-11-05',
    publisher: '平台运营',
    createTime: '2026-11-04',
  },
  {
    id: 'nt_seed_3',
    code: 'TZGG-0003',
    title: '关于比单报名规范与底价规则的补充说明',
    content: [
      '近期发现部分比单报名报价明显低于底价，现补充说明：',
      '1. 报名报价不得低于发起比单时设定的底价（按折扣或具体价格），低于底价的报名无效；',
      '2. 底价按所选商品金额占比折算，请报名前仔细核对；',
      '3. 定标按「报价 + 积分」综合评分，积分取合作商积分台账总分。',
    ].join('\n'),
    level: 'normal',
    pinned: false,
    status: 'published',
    publishTime: '2026-11-08',
    publisher: '平台运营',
    createTime: '2026-11-07',
  },
  {
    id: 'nt_seed_4',
    code: 'TZGG-0004',
    title: '双十二备货建议（草稿）',
    content: '双十二大促临近，建议各合作商提前 15 天备货，重点关注礼盒装与口粮茶规格……',
    level: 'normal',
    pinned: false,
    status: 'draft',
    publisher: '运营部-陈工作台',
    createTime: '2026-11-09',
  },
];
