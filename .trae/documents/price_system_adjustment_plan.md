# 价格体系调整实施计划

## 需求澄清

用户对管理后台价格体系做以下调整：

| 价格名称 | 定义 | 计算方式 |
|----------|------|----------|
| 销售报价 | 给客户的报价（直接销售/经平台销售统一概念） | 取客户维度有效报价（单品价 > 品牌折扣） |
| 销售实价 | 订单下的具体销售价，唯一 | 用户输入/调整 |
| 经平台销平台报价（新增） | 经平台销售时淡茶给平台的报价 | 销售报价 × (1 − 该客户经该平台的扣点) |
| 经平台销平台实价（已有，位置调整） | 经平台销售时淡茶给平台的实价 | 销售实价 × (1 − 该客户经该平台的扣点) |

核心变化：
1. **quoteOf() 统一**：不再区分 isVia 取不同报价，一律取 `effectiveCustomerQuote`（客户维度的销售报价）
2. **经平台模式下多一列**：新增"经平台销平台报价"列（= 销售报价 × (1−扣点)），在"销售报价"和"销售实价"之间
3. **经平台销平台实价列**：从销售实价之后保留，位置不变但语义更清晰
4. **直接销售模式下**：维持原样（市场价 / 销售报价 / 数量 / 销售实价 / 小计）

## 仓库研究结论

### 关键文件

| 文件 | 职责 |
|------|------|
| `src/pages/sales/OrderEntry.tsx` | 新建销售单，含 `quoteOf()` / `platformNetOf()` 取价函数、已选商品明细表头/渲染 |
| `src/components/business/SalesOrderInfoModal.tsx` | 销售单信息弹窗，含相同的取价逻辑和商品明细展示 |
| `src/stores/priceStore.ts` | 价格 store，含 `effectiveCustomerQuote()` / `effectivePlatformQuote()` |
| `src/data/prices.tsx` | 含 `calcPlatformNetPrice(price, rate)` 辅助函数 |

### 现有 quoteOf() 逻辑（需改）

```tsx
// OrderEntry.tsx L111-121 — 旧逻辑
const quoteOf = (productId: string): number | undefined => {
  if (!matchedCustomerId) return undefined;
  const cust = customerItems.find((c) => c.id === matchedCustomerId);
  if (cust?.type === 'personal') return undefined;
  if (isVia) {
    // 旧：经平台 → 取 effectivePlatformQuote（平台专属手设价）
    if (!platformCustomerId) return undefined;
    const rate = cust?.platformCommissionRates?.[platformCustomerId] ?? '0%';
    return effectivePlatformQuote(customerQuotes, matchedCustomerId, productId, platformCustomerId, products, rate);
  }
  return effectiveCustomerQuote(customerQuotes, matchedCustomerId, productId, products);
};
```

### 现有 platformNetOf() 逻辑（保留，仅重命名语义）

```tsx
// OrderEntry.tsx L124-129 — 销平台实价，保留公式不变
const platformNetOf = (salesPrice: number): number | undefined => {
  if (!isVia || !platformCustomerId || !matchedCustomerId) return undefined;
  const cust = customerItems.find((c) => c.id === matchedCustomerId);
  const rate = cust?.platformCommissionRates?.[platformCustomerId] ?? '0%';
  return calcPlatformNetPrice(salesPrice, rate);
};
```

## 实施步骤

### Step 1: 修改 OrderEntry.tsx

1. **quoteOf() 简化**：移除 `if (isVia)` 分支，统一返回 `effectiveCustomerQuote(customerQuotes, matchedCustomerId, productId, products)`
2. **新增 platformQuoteOf()**（销平台报价）：= quoteOf() × (1 − 扣点)，复用 calcPlatformNetPrice
3. **表头新增一列**：经平台模式下，销售报价(120px)后插入"经平台销平台报价"(120px)，原经平台销平台实价列保留
4. **tbody 渲染新增**：在销售报价 td 后增加销平台报价 td
5. **表头 colspan 调整**：isVia 时提示行 colSpan 从 10 改为 11

### Step 2: 修改 SalesOrderInfoModal.tsx

1. **quoteOf() 简化**：同上，移除 isVia 分支，统一取 effectiveCustomerQuote
2. **新增 platformQuoteOf()**：= quoteOf(o, productId) × (1 − 扣点)
3. **表头新增一列**：经平台订单下，销售报价后插入"经平台销平台报价"
4. **tbody 渲染新增**：对应位置增加销平台报价 td

### Step 3: 类型检查

运行 `npx tsc --noEmit` 确保无类型错误。

## 依赖与注意

- **effectivePlatformQuote 函数**：本次不再用于 quoteOf，但其他地方可能仍有引用（如价格管理页面的平台报价配置），**不要删除或修改**
- **calcPlatformNetPrice**：继续复用，不需要新工具函数
- **customer.platformCommissionRates**：已存在的数据结构，客户 → 平台 → 扣点映射，直接使用
- **表头宽度**：新增列宽 120px，与销售报价、销平台实价一致

## 验证

1. tsc --noEmit 通过
2. dev server 无编译错误
3. 浏览器打开新建销售单，选择经平台销售路径：
   - 市场价 / 销售报价 / **经平台销平台报价** / 数量 / 销售实价 / **经平台销平台实价** / 小计 ✓
   - 销平台报价 = 销售报价 × (1 − 扣点) ✓
   - 销平台实价 = 销售实价 × (1 − 扣点) ✓
4. 浏览器打开直接销售路径：
   - 市场价 / 销售报价 / 数量 / 销售实价 / 小计 ✓（无经平台相关列）
5. 打开已有销售单的 SalesOrderInfoModal，商品明细同上

## 风险

- **其他页面是否有类似的 quoteOf 区分逻辑**：已搜索确认仅 OrderEntry 和 SalesOrderInfoModal 两处有此逻辑。价格管理页面的 effectivePlatformQuote 使用保留不变。
- **数据一致性**：quoteOf 函数现在不依赖 platformCustomerId，所以在用户还没选平台时也能正确返回销售报价（客户维度），更符合统一口径。
