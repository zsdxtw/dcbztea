/** 积分档位（期初分 + 履约率，比单评分用）——基础/经营/报备/推介为派生计算，台账见 scoreStore */
import type { PartnerScoreBase } from '../types';

/** 期初分与履约率（键=供应商 ID） */
export const scoreBases: Record<string, PartnerScoreBase> = {
  '3': { base: 70, ontimeRate: 95 },
  '5': { base: 60, ontimeRate: 88 },
  '8': { base: 66, ontimeRate: 92 },
  '10': { base: 58, ontimeRate: 85 },
  '11': { base: 62, ontimeRate: 90 },
};
