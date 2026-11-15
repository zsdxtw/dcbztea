/**
 * 销售单编号体系（全局统一，见项目规则「销售单编号规则」）
 *
 * 销售单（母单）：SO- + 年月日 YYMMDD（6 位）+ 4 位序号（0001 起，同日递增）
 *   例：SO-2611150001
 * 销售履约单：销售单编号 + LY + 2 位序号（01 起，一个销售单下依次递增）
 *   例：SO-2611150001LY01
 * 销售发货单：销售单编号 + FH + 2 位序号（01 起，该销售单下所有履约单的全部发货单
 *   按生成时间先后顺序依次编号）
 *   例：SO-2611150001FH01
 */

const pad = (n: number, len: number) => String(n).padStart(len, '0');

/** 编号中的日期键：YYMMDD（6 位，与订单 entryTime 同为 UTC 口径，保证同日一致） */
export const soDateKey = (d = new Date()): string =>
  `${String(d.getUTCFullYear()).slice(2)}${pad(d.getUTCMonth() + 1, 2)}${pad(d.getUTCDate(), 2)}`;

/** 由任意订单/发货单编号取母销售单编号（SO-2611150001LY01 / …FH02 → SO-2611150001） */
export const soRootOf = (code: string): string => code.replace(/(?:LY|FH)\d{2,}$/, '');

/** 从编号中解析出 4 位序号（非母销售单格式返回 0） */
const seqOf = (code: string, prefix: string): number => {
  if (!code.startsWith(prefix)) return 0;
  const n = Number(code.slice(prefix.length));
  return Number.isFinite(n) ? n : 0;
};

/** 生成销售单编号：SO- + YYMMDD + 4 位序号（同日已有编号最大值 + 1） */
export const genSalesOrderCode = (existingMotherCodes: string[], date = new Date()): string => {
  const dateKey = soDateKey(date);
  const prefix = `SO-${dateKey}`;
  const max = existingMotherCodes.reduce((m, c) => Math.max(m, seqOf(c, prefix)), 0);
  return `${prefix}${pad(max + 1, 4)}`;
};

/** 生成销售履约单编号：销售单编号 + LY + 2 位序号（该销售单下已有履约单最大值 + 1） */
export const genFulfillmentCode = (soCode: string, existingChildCodes: string[]): string => {
  const prefix = `${soCode}LY`;
  const max = existingChildCodes.reduce((m, c) => Math.max(m, seqOf(c, prefix)), 0);
  return `${prefix}${pad(max + 1, 2)}`;
};

/**
 * 生成销售发货单编号：销售单编号 + FH + 2 位序号
 * @param soCode 母销售单编号
 * @param existingShipmentNos 该销售单下所有履约单的全部发货单编号（跨履约单）
 */
export const genShipmentCode = (soCode: string, existingShipmentNos: string[]): string => {
  const root = soRootOf(soCode);
  const prefix = `${root}FH`;
  const max = existingShipmentNos.reduce((m, c) => Math.max(m, seqOf(c, prefix)), 0);
  return `${prefix}${pad(max + 1, 2)}`;
};

/**
 * 发货单全局序号登记表：保证同一销售单下自营包裹与采购包裹共用一套 FH 序号。
 * 生成前先并入调用方已知编号（跨 Store 视角），再取最大值 + 1。
 */
const shipmentSeq = new Map<string, number>();

const fhSeqOf = (no: string, root: string): number => {
  const prefix = `${root}FH`;
  return no.startsWith(prefix) ? Number(no.slice(prefix.length)) || 0 : 0;
};

/** 登记已知发货单号（种子数据 / 外部导入），同步该销售单最大序号 */
export const registerShipmentNo = (no: string): void => {
  const root = soRootOf(no);
  shipmentSeq.set(root, Math.max(shipmentSeq.get(root) ?? 0, fhSeqOf(no, root)));
};

/** 生成下一个发货单编号（跨履约单全局递增，自动并入已知编号） */
export const nextShipmentCode = (soCode: string, knownNos: string[] = []): string => {
  const root = soRootOf(soCode);
  let max = shipmentSeq.get(root) ?? 0;
  for (const no of knownNos) max = Math.max(max, fhSeqOf(no, root));
  const next = max + 1;
  shipmentSeq.set(root, next);
  return `${root}FH${pad(next, 2)}`;
};

/**
 * 生成销售退货单编号：销售单编号 + TH + 2 位序号（01 起，同一销售单下依次递增）
 * 销售履约单的退货单均挂在母销售单下统一编号。
 */
export const genReturnCode = (soCode: string, existingReturnCodes: string[]): string => {
  const root = soRootOf(soCode);
  const prefix = `${root}TH`;
  const max = existingReturnCodes.reduce((m, c) => {
    if (!c.startsWith(prefix)) return m;
    return Math.max(m, Number(c.slice(prefix.length)) || 0);
  }, 0);
  return `${prefix}${pad(max + 1, 2)}`;
};
