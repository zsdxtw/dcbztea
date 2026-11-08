/**
 * 库存可用量（演示静态台账，ATP 供应方案净需求计算源）
 * 真实库存台账打通后由此替换（现存量 − 已预留量）
 */
export const STOCK_BY_PRODUCT: Record<string, number> = {
  p1: 60,   // 西湖龙井·明前特级
  p2: 120,  // 碧螺春·一级
  p5: 0,    // 金骏眉·特级（缺货，需采购）
  p7: 30,   // 武夷岩茶·水金龟
  p8: 10,   // 白毫银针·特级
  p12: 200, // 寿眉·2019年陈
  p13: 0,   // 凤凰单丛·蜜兰香（缺货）
  p14: 80,  // 铁观音·清香一级
  p20: 500, // 冷泡茶便携装
};

export const getStock = (productId: string): number => STOCK_BY_PRODUCT[productId] ?? 0;

/**
 * 分仓可用库存（自营「采购&发货」分仓发货源）
 * 仅自有独立仓（杭州总仓 / 武夷仓区 / 苏州分仓 / 福鼎分仓 / 云南总仓）；各仓合计与商品总可用量一致。
 */
export const WAREHOUSE_STOCK: Record<string, Record<string, number>> = {
  'wh-ind-01': { p1: 40, p2: 60, p12: 80, p14: 40, p20: 200 },        // 杭州总仓
  'wh-ind-02': { p7: 30, p12: 60 },                                    // 武夷仓区
  'wh-ind-03': { p1: 20, p2: 60, p14: 40 },                            // 苏州分仓
  'wh-ind-04': { p8: 10 },                                             // 福鼎分仓
  'wh-ind-05': { p12: 60, p20: 300 },                                  // 云南总仓
};

export const WAREHOUSE_NAMES: Record<string, string> = {
  'wh-ind-01': '杭州总仓',
  'wh-ind-02': '武夷仓区',
  'wh-ind-03': '苏州分仓',
  'wh-ind-04': '福鼎分仓',
  'wh-ind-05': '云南总仓',
};

/** 某商品有库存的仓库列表（数量 > 0，按仓库名排序） */
export function getWarehouseStock(productId: string): { warehouseId: string; warehouseName: string; qty: number }[] {
  return Object.entries(WAREHOUSE_STOCK)
    .map(([warehouseId, stocks]) => ({ warehouseId, warehouseName: WAREHOUSE_NAMES[warehouseId] ?? warehouseId, qty: stocks[productId] ?? 0 }))
    .filter((w) => w.qty > 0)
    .sort((a, b) => a.warehouseName.localeCompare(b.warehouseName));
}
