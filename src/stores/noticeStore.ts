/**
 * 合作商通知公告 Store（管理端 ↔ 合作商终端共享）
 * 管理端「合作商 → 通知公告」发布与管理；合作商工作台「通知公告」板块实时展示已发布内容
 */
import { create } from 'zustand';
import type { PartnerNotice } from '../types';
import { noticeSeeds } from '../data/partnerNotices';

const now = () => new Date().toISOString().slice(0, 10);
const genCode = (n: number) => `TZGG-${String(n).padStart(4, '0')}`;

interface NoticeState {
  /** 全部通知公告（含草稿/已撤回，合作商终端只取已发布） */
  notices: PartnerNotice[];
  /** 新增公告（默认草稿） */
  addNotice: (input: { title: string; content: string; level: PartnerNotice['level']; pinned: boolean; publisher: string }) => PartnerNotice;
  /** 编辑公告（编号/发布时间不变） */
  updateNotice: (id: string, patch: Partial<Pick<PartnerNotice, 'title' | 'content' | 'level' | 'pinned'>>) => void;
  /** 发布 / 撤回 */
  setNoticeStatus: (id: string, status: PartnerNotice['status']) => void;
  /** 置顶切换（仅已发布可置顶） */
  togglePin: (id: string) => void;
  /** 删除 */
  removeNotice: (id: string) => void;
}

export const useNoticeStore = create<NoticeState>((set, get) => ({
  notices: noticeSeeds,

  addNotice: (input) => {
    const { notices } = get();
    const notice: PartnerNotice = {
      id: `nt_${Date.now()}`,
      code: genCode(notices.length + 1),
      title: input.title,
      content: input.content,
      level: input.level,
      pinned: false,
      status: 'draft',
      publisher: input.publisher,
      createTime: now(),
    };
    set({ notices: [notice, ...notices] });
    return notice;
  },

  updateNotice: (id, patch) => set({
    notices: get().notices.map((n) => (n.id === id ? { ...n, ...patch } : n)),
  }),

  setNoticeStatus: (id, status) => set({
    notices: get().notices.map((n) =>
      n.id === id
        ? { ...n, status, publishTime: status === 'published' ? (n.publishTime ?? now()) : n.publishTime, pinned: status === 'published' ? n.pinned : false }
        : n,
    ),
  }),

  togglePin: (id) => set({
    notices: get().notices.map((n) => (n.id === id && n.status === 'published' ? { ...n, pinned: !n.pinned } : n)),
  }),

  removeNotice: (id) => set({
    notices: get().notices.filter((n) => n.id !== id),
  }),
}));

/** 已发布公告列表（置顶优先，再按发布时间倒序）— 合作商工作台展示用 */
export function getPublishedNotices(notices: PartnerNotice[]): PartnerNotice[] {
  return notices
    .filter((n) => n.status === 'published')
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.publishTime ?? '').localeCompare(a.publishTime ?? ''));
}
