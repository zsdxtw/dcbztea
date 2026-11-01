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
