/**
 * 合作商积分 Store（管理端 ↔ 合作商终端共享）
 * 台账流水累积四维积分；比单评分读取汇总（reportStore / orderFlowStore 在关键动作时写入台账）
 */
import { create } from 'zustand';
import type { PartnerScoreEntry, PartnerScoreSummary } from '../types';
import { scoreBases, scoreEntries } from '../data/partnerScores';

const now = () => new Date().toISOString().slice(0, 10);

interface ScoreState {
  /** 积分台账流水 */
  entries: PartnerScoreEntry[];
  /** 写入积分流水（正数加分 / 负数扣分） */
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

export const useScoreStore = create<ScoreState>((set) => ({
  entries: scoreEntries,

  addEntry: (input) =>
    set((s) => ({
      entries: [
        {
          id: `se_${Date.now()}`,
          time: now(),
          ...input,
        },
        ...s.entries,
      ],
    })),
}));

/* ── 汇总工具 ── */

/** 计算合作商积分汇总（期初分 + 台账四维累加） */
export function getScoreSummary(
  entries: PartnerScoreEntry[],
  supplierId: string,
  supplierName: string,
): PartnerScoreSummary {
  const mine = entries.filter((e) => e.supplierId === supplierId);
  const sum = (dim: PartnerScoreEntry['dimension']) =>
    mine.filter((e) => e.dimension === dim).reduce((acc, e) => acc + e.delta, 0);
  const visit = sum('visit');
  const report = sum('report');
  const fulfillment = sum('fulfillment');
  const penalty = sum('penalty');
  const base = scoreBases[supplierId]?.base ?? 60;
  return {
    supplierId,
    supplierName,
    visit,
    report,
    fulfillment,
    penalty,
    total: base + visit + report + fulfillment + penalty,
    ontimeRate: scoreBases[supplierId]?.ontimeRate ?? 88,
  };
}
