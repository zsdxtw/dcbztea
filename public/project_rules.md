# 茶叶管理系统 - 项目规则

本项目规则分为**两大类**：

- **第一部分 · 页面样式与规范**：配色、标签样式、列表页/详情页等全局 UI 规范
- **第二部分 · 业务规则**：商品编码、价格体系、客户类型、销售场景、绩效等业务领域规则

---

# 第一部分 · 页面样式与规范

## 配色规则

### 模块主色调与辅色调

一级导航菜单选中时的配色为该模块的主色调，辅色调用于需要与主色调区分的强调场景（如删除按钮、分类标签等）。通过 `data-module` 属性切换 CSS 变量实现全局主题色联动。

| 模块 | ModuleKey | 主色调 | 色值 | 辅色调 | 色值 |
|------|-----------|--------|------|--------|------|
| 工作台 | dashboard | 深蓝 | <span style="display:inline-block;width:14px;height:14px;background:#023270;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#023270` | 粉红 | <span style="display:inline-block;width:14px;height:14px;background:#FD7A99;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#FD7A99` |
| 采购 | purchase | 玫红 | <span style="display:inline-block;width:14px;height:14px;background:#CB405D;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#CB405D` | 蓝 | <span style="display:inline-block;width:14px;height:14px;background:#0F64B5;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#0F64B5` |
| 销售 | sales | 蓝色 | <span style="display:inline-block;width:14px;height:14px;background:#0F64B5;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#0F64B5` | 玫红 | <span style="display:inline-block;width:14px;height:14px;background:#CB405D;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#CB405D` |
| 商品 | product | 翡翠绿 | <span style="display:inline-block;width:14px;height:14px;background:#01795D;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#01795D` | 橙色 | <span style="display:inline-block;width:14px;height:14px;background:#eb5c20;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#eb5c20` |
| 人员 | personnel | 紫罗兰 | <span style="display:inline-block;width:14px;height:14px;background:#9D73BD;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#9D73BD` | 鹅黄 | <span style="display:inline-block;width:14px;height:14px;background:#FDDE83;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#FDDE83` |
| 仓储 | inventory | 橙色 | <span style="display:inline-block;width:14px;height:14px;background:#eb5c20;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#eb5c20` | 翡翠绿 | <span style="display:inline-block;width:14px;height:14px;background:#01795D;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#01795D` |
| 财务 | finance | 深靛 | <span style="display:inline-block;width:14px;height:14px;background:#27254B;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#27254B` | 蓝灰 | <span style="display:inline-block;width:14px;height:14px;background:#7BA6D1;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#7BA6D1` |
| 统计 | statistics | 棕色 | <span style="display:inline-block;width:14px;height:14px;background:#5F4027;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#5F4027` | 浅橙 | <span style="display:inline-block;width:14px;height:14px;background:#FED6B8;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#FED6B8` |
| 系统 | settings | 灰色 | <span style="display:inline-block;width:14px;height:14px;background:#6B7280;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#6B7280` | — | — |

### 模块色阶体系

每个模块定义五级色阶，用于不同场景：

| 级别 | CSS 变量后缀 | 用途 |
|------|-------------|------|
| lightest | `-lightest` | 浅底背景、标签背景 |
| light | `-light` | 悬浮背景、次要高亮 |
| base | `-base` | 主色调，按钮、选中态、强调 |
| dark | `-dark` | 按钮悬浮态 |
| darkest | `-darkest` | 深色文字、极端强调 |

### 辅色调使用说明

- **工作台辅色** <span style="display:inline-block;width:12px;height:12px;background:#FD7A99;border-radius:2px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:2px"></span> `#FD7A99`：用于工作台模块下的强调操作
- **采购辅色** <span style="display:inline-block;width:12px;height:12px;background:#0F64B5;border-radius:2px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:2px"></span> `#0F64B5`：用于采购模块下的次要操作、链接等
- **销售辅色** <span style="display:inline-block;width:12px;height:12px;background:#CB405D;border-radius:2px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:2px"></span> `#CB405D`：用于销售模块下的删除按钮、平台方标签、金额等数据展示
- **商品辅色** <span style="display:inline-block;width:12px;height:12px;background:#eb5c20;border-radius:2px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:2px"></span> `#eb5c20`：用于商品模块下的删除按钮、警告操作
- **人员辅色** <span style="display:inline-block;width:12px;height:12px;background:#FDDE83;border-radius:2px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:2px"></span> `#FDDE83`：用于人员模块下的次要信息展示
- **仓储辅色** <span style="display:inline-block;width:12px;height:12px;background:#01795D;border-radius:2px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:2px"></span> `#01795D`：用于仓储模块下的翡翠绿强调
- **财务辅色** <span style="display:inline-block;width:12px;height:12px;background:#7BA6D1;border-radius:2px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:2px"></span> `#7BA6D1`：用于财务模块下的银行、账号等信息
- **统计辅色** <span style="display:inline-block;width:12px;height:12px;background:#FED6B8;border-radius:2px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:2px"></span> `#FED6B8`：用于统计模块下的浅橙强调

### 模块色切换机制

1. 根元素通过 `document.body.dataset.module = currentModule` 设置当前模块
2. CSS 通过 `[data-module="xxx"]` 选择器切换 `--color-module-current-*` 变量
3. 全局组件（按钮、标签、卡片等）使用 `var(--color-module-current-base)` 自动适配当前模块色
4. 辅色通过 `var(--color-module-{module}-secondary)` 和 `var(--color-module-{module}-secondary-light)` 使用

### 相关文件

- 色阶变量定义：`src/tokens/index.css`
- 模块配置：`src/data/modules.tsx`
- 模块切换逻辑：`src/App.tsx`
- 模块 Hook：`src/hooks/useModule.ts`

---

## 茶类标签样式

以"茶叶档案"菜单下"六大茶类"页面中的茶类标签为全局标准样式，所有涉及茶类分类展示的场景均使用 `<Tag category={TeaCategory} />` 组件。

### 标签规格

- 高度：24px
- 内边距：0 8px
- 圆角：4px（`var(--radius-sm)`）
- 字号：12px（`var(--text-xs)`）
- 字重：500（`var(--font-medium)`）
- 边框：1px solid

### 七大茶类配色

| 茶类 | TeaCategory | 背景色 | 文字色 | 边框色 |
|------|-------------|--------|--------|--------|
| 绿茶 | green | <span style="display:inline-block;width:14px;height:14px;background:#F0F6E4;border-radius:3px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:4px"></span> `#F0F6E4` | <span style="display:inline-block;width:14px;height:14px;background:#5C7A2A;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#5C7A2A` | <span style="display:inline-block;width:14px;height:14px;background:#D8E8C0;border-radius:3px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:4px"></span> `#D8E8C0` |
| 白茶 | white | <span style="display:inline-block;width:14px;height:14px;background:#F9F3E8;border-radius:3px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:4px"></span> `#F9F3E8` | <span style="display:inline-block;width:14px;height:14px;background:#9A8450;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#9A8450` | <span style="display:inline-block;width:14px;height:14px;background:#E8D8B8;border-radius:3px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:4px"></span> `#E8D8B8` |
| 黄茶 | yellow | <span style="display:inline-block;width:14px;height:14px;background:#FAF3E0;border-radius:3px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:4px"></span> `#FAF3E0` | <span style="display:inline-block;width:14px;height:14px;background:#8A7530;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#8A7530` | <span style="display:inline-block;width:14px;height:14px;background:#E8D8A0;border-radius:3px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:4px"></span> `#E8D8A0` |
| 青茶 | oolong | <span style="display:inline-block;width:14px;height:14px;background:#EFF2E8;border-radius:3px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:4px"></span> `#EFF2E8` | <span style="display:inline-block;width:14px;height:14px;background:#3E4A28;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#3E4A28` | <span style="display:inline-block;width:14px;height:14px;background:#C8D0B0;border-radius:3px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:4px"></span> `#C8D0B0` |
| 红茶 | red | <span style="display:inline-block;width:14px;height:14px;background:#F8ECEC;border-radius:3px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:4px"></span> `#F8ECEC` | <span style="display:inline-block;width:14px;height:14px;background:#7A2A28;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#7A2A28` | <span style="display:inline-block;width:14px;height:14px;background:#E0C0C0;border-radius:3px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:4px"></span> `#E0C0C0` |
| 黑茶 | dark | <span style="display:inline-block;width:14px;height:14px;background:#F0EBE6;border-radius:3px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:4px"></span> `#F0EBE6` | <span style="display:inline-block;width:14px;height:14px;background:#3A2E20;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#3A2E20` | <span style="display:inline-block;width:14px;height:14px;background:#D0C8B8;border-radius:3px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:4px"></span> `#D0C8B8` |
| 花草茶 | flower | <span style="display:inline-block;width:14px;height:14px;background:#FFF0F5;border-radius:3px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:4px"></span> `#FFF0F5` | <span style="display:inline-block;width:14px;height:14px;background:#B03070;border-radius:3px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-left:4px"></span> `#B03070` | <span style="display:inline-block;width:14px;height:14px;background:#F0C0D8;border-radius:3px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:4px"></span> `#F0C0D8` |

### CSS 类名映射

| 茶类 | CSS 类名 |
|------|---------|
| 绿茶 | `.tag-green` |
| 白茶 | `.tag-white` |
| 黄茶 | `.tag-yellow` |
| 青茶 | `.tag-oolong` |
| 红茶 | `.tag-red` |
| 黑茶 | `.tag-dark` |
| 花草茶 | `.tag-flower` |

### 使用规范

1. 所有茶类分类展示统一使用 `<Tag category={TeaCategory.XXX} />` 组件，不得自定义样式
2. 茶类标签颜色通过 CSS 变量 `--color-tea-{category}-bg/text/border` 控制
3. 新增茶类需同步更新：`Tag.tsx` 组件、`index.css` 色值变量、`teaCategories.ts` 数据源

### 相关文件

- 标签组件：`src/components/common/Tag.tsx`
- 色值变量：`src/tokens/index.css`（`--color-tea-*`）
- 茶类数据源：`src/data/teaCategories.ts`
- 六大茶类页面：`src/pages/product/ProductTeaCategory.tsx`

---

## 列表页、详情页统一规则

整个项目各模块的列表页与详情页（右侧抽拉）均遵循以下统一规范，确保排布规律、字体大小、整洁度一致。

### 一、列表页规则

#### 1.1 表格字体

| 内容类型 | 样式 | 说明 |
|----------|------|------|
| 编号、名称等需强调的字段 | `cell-emph`（`font-weight: var(--font-medium)` + 深色） | 等宽编号用 `cell-mono-emph` |
| 普通文本单元格 | 默认 `td`（`font-size: var(--text-base)` = 14px） | 次要信息（日期、备注）用 `cell-muted`（13px + 灰） |
| 金额/数量 | `.mono`（等宽 + medium） | 差异等带正负色值单独着色 |

#### 1.2 工具栏按钮

- **新增按钮**：`<Button>`（`variant="primary"`，模块主色调）+ 加号图标，文案如「新增员工」「新建盘点」。
- **删除按钮**：`<Button variant="danger">`（模块辅色调 `--color-module-current-secondary`）+ 垃圾桶图标。辅色过浅的模块（人员鹅黄、统计浅橙、设置）自动回退到语义错误色 `#CB405D`。
- 其它次级操作（导出、批量删除等）用 `variant="ghost"`。

#### 1.3 操作栏

- 列表末列固定为「操作」栏（`th` 标题文本「操作」）。
- 操作栏至少包含「查看」「编辑」两个按钮，按需追加「删除」。
- 按钮组用 `<RowActions>` 包裹（`.row-actions`），使用 `<Button size="sm" variant="ghost">`；删除按钮用 `<RowDeleteButton>`（辅色调 ghost）。
- 「查看」进入详情抽屉（只读），「编辑」进入编辑模式。

#### 1.4 表头列宽

- `<Table>` 组件已支持拖拽调节列宽：每个 `th` 右侧有 6px 拖拽把手，`mousedown` 后实时调整 `colWidths`，最小 40px。
- 列宽根据内容自适应初始宽度，用户可自由拖拽调节并保留。

#### 1.5 地区字段规范

- 列表中的地区字段统一展示为 **`省 / 市 / 区`** 三段斜杠分隔格式（参照人员-茶人管理列表的标准样式），如 `浙江 / 杭州市 / 西湖区`；直辖市为 `上海 / 上海市 / 浦东新区`。
- 省市区数据源统一使用 `src/data/regions.ts`（`REGIONS` / `PROVINCE_NAMES` / `getCities` / `getDistricts`），不得在各页面硬编码地区列表。
- 业务数据仅存省市（如订单的 `customerRegion`="浙江宁波"）时，区县可从收货地址解析补全；解析不到则降级只显示已有的段（`省 / 市`），不得显示空段。
- 详情抽屉中的地区字段同样使用该格式。

### 二、详情页（右侧抽拉）规则

#### 2.1 抽屉容器

- 统一使用 `<DetailDrawer>` 组件或等效 `.drawer-overlay` + `.drawer-panel` 结构。
- **宽度统一**：`width: 66.66vw`（视窗 2/3），`min-width: 1200px`，`max-width: 95vw`。
- 从右侧滑入（`slideInRight` 动画），点击遮罩关闭。

#### 2.2 标题栏（drawer-header）

- 左侧：徽标方块（`.drawer-header-badge`，40×40，模块主色 lightest 底 + base 字，显示编号前缀如 "PD"/"SO"）+ 主标题（编号/名称，`.drawer-title`）+ 状态标签（`<StatusTag>`）。
- 主标题下方：副标题（`.drawer-header-sub`，仓库 · 范围 等关键摘要）。
- 右侧：关闭按钮（`.drawer-close`，× 图标）。

#### 2.3 详细信息分类展示

- 主体（`.drawer-body`）按类别分区，每个类别用 `<DrawerSection title="...">`，标题采用 `.drawer-section-title`：
  - **标题前竖线**：3px 宽，模块主色调 `--color-module-current-base`，通过 `::before` 伪元素实现。
  - 标题下方有 1px 分隔线。
- 查看态字段用 `<InfoGrid>` + `<InfoItem>`（`.detail-info-grid`，默认 3 列，可选 2/4 列）：
  - 标签 `.drawer-label`（13px medium 灰）+ 值 `.detail-info-value`（13px 深色，强调值加 `emph`/`mono`）。
  - 长文本（备注、地址）用 `span={2|3}` 跨列。
- 内嵌明细表用 `.detail-inline-table`（带边框圆角，表头灰底）。

#### 2.4 底部按钮（drawer-footer）

- **查看态**：左对齐「关闭」(`ghost`) + 右对齐「编辑」(`primary`，模块主色调)。
- **编辑态**：「取消」(`ghost`) + 「保存」(`primary`)。
- 由 `<DetailDrawer>` 的 `mode` / `onEdit` / `onCancelEdit` / `onSave` 自动渲染；点击「编辑」切换为编辑模式，点击「关闭/取消」关闭抽屉。

### 三、编辑模式规则

- 点击详情页底部「编辑」按钮进入编辑模式，复用同一抽屉，内容布局参照查看页。
- 编辑表单行用 `<EditRow>` + `<EditField>`（`.drawer-edit-row` / `.drawer-edit-field`），输入控件复用 `.filter-input` / `.filter-select`。
- 必填字段标签后加「*」。工号、编号等自动生成字段用 `readonly`。
- 保存后回到查看态并刷新数据；取消则丢弃修改回到查看态。

### 四、分类/页面标签卡片

页面顶部的分类切换、Tab 选用统一的卡片样式：

- **不带介绍**：`.tab-card-simple`（紧凑型，2px 边框，激活态模块主色边框 + lightest 底）。含图标 + 名称 + 右侧数量。
- **带介绍**：`.tab-card-desc`（参考客户管理「直营客户」卡片：2px 边框、激活态主色边框 + 3% 主色底、左侧 32px 图标方块、标题 + 大号数量 + 下方 12px 灰色描述）。

### 五、排布与整洁度规范

参考人员模块「员工管理」编辑抽屉的排布标准：

- 字号层级：标题 `--text-lg`、分类标题 `--text-sm` semibold、字段标签 `--text-sm` medium、字段值 `--text-sm`。
- 表单行：同行字段用 `flex` 横排 + `gap: var(--space-4)`；上传/多选等整行字段用 `flex-direction: column`。
- 分区间距：分类标题 `margin-top: var(--space-5)`，首个分类标题贴顶。
- 输入控件高度统一 34-36px，圆角 `--radius-md`，聚焦态模块主色边框 + 3px light 光晕。

### 关键约束

1. **详情抽屉宽度全局统一**：所有详情/编辑抽屉均 2/3 视窗宽（min 1200px），不得各页自定义窄宽度。
2. **分类竖线颜色随模块**：`drawer-section-title::before` 使用 `--color-module-current-base`，切换模块自动变色。
3. **删除按钮辅色**：`btn-danger` 用 `--color-module-current-secondary`，浅辅色模块回退错误色。
4. **操作栏必备查看/编辑**：列表行操作至少「查看」「编辑」，删除按需追加且用辅色。
5. **表头可调宽**：所有列表表头支持拖拽调节列宽，初始按内容自适应。

### 相关文件

- 设计令牌与统一样式：`src/tokens/index.css`（`.drawer-panel`、`.drawer-section-title`、`.btn-danger`、`.cell-emph`、`.tab-card-*`、`.detail-info-grid`）
- 详情抽屉公共组件：`src/components/common/DetailDrawer.tsx`
- 表格组件（可调列宽）：`src/components/common/Table.tsx`
- 按钮组件（含 danger 变体）：`src/components/common/Button.tsx`
- 列表+详情参考页：`src/pages/inventory/InventoryCheck.tsx`、`src/pages/personnel/PersonnelEmployee.tsx`

---

# 第二部分 · 业务规则

## 商品编码规则

商品编号共计 **12 位**，格式如下：

```
一级分类(1位) + 二级分类(2位) + 品牌编号(3位) + 顺序号(5位) + 校验位(1位)
```

### 各段说明

| 段落 | 位数 | 说明 |
|------|------|------|
| 一级分类 | 1位 | 茶叶=1, 茶具=2, 茶周边=3, 其他=4 |
| 二级分类 | 2位 | 按分类管理中各一级分类下的顺序从01开始编号 |
| 品牌编号 | 3位 | 联动品牌管理中的品牌编号（原始3位编号，如001、010、027） |
| 顺序号 | 5位 | 每个品牌下从00001开始按建档顺序编号 |
| 校验位 | 1位 | 0-9随机数字 |

### 示例

- `101001000013` = 茶叶(1) + 绿茶(01) + 西湖牌(001) + 00001 + 3
- `102006000017` = 茶叶(1) + 红茶(02) + 正山堂(006) + 00001 + 7
- `103010000024` = 茶叶(1) + 青茶(03) + 八马(010) + 00002 + 4

### 关键约束

1. **品牌编号联动**：商品编号中的品牌编号部分直接使用品牌管理中的3位原始编号，不做截取
2. **编号不可变**：已建立的商品编号不因分类管理中的新增/删除而改变
3. **分类删除保护**：分类管理中，若某分类下存在商品则不允许删除该分类
4. **二级分类编号**：茶叶二级分类为 绿茶01、红茶02、青茶03，白茶04、黄茶05、黑茶06、花草茶07

### 相关文件

- 编号工具函数：`src/utils/productCode.ts`
- 品牌数据源（含编号）：`src/data/brands.tsx`
- 分类数据源：`src/data/productCategories.tsx`
- 商品数据：`src/data/teaProducts.tsx`

---

## 价格体系规则

价格体系由 **7 种价格** 构成，分为「基准价」「合作商/客户维度报价」「订单实价」三层。

### 价格类型定义

| 序号 | 价格名称 | 归属层级 | 说明 |
|------|----------|----------|------|
| 1 | 市场价 | 基准价 | 品牌方制定的市场正常销售价，一般为零售价 |
| 2 | 京东价 | 基准价 | 京东渠道的销售价格 |
| 3 | 天猫价 | 基准价 | 天猫渠道的销售价格 |
| 4 | 采购价 | 合作商报价 | 从合作商采购该商品的价格；**同一商品不同的合作商有不同的采购价**（即合作商报价），按「商品 + 合作商」维度维护 |
| 5 | 销售价 | 客户报价 | 淡茶半盏报给客户的价格；**同一商品不同的客户有不同的销售价**，按「商品 + 客户」维度维护 |
| 6 | 采购实价 | 订单实价 | 针对某个具体订单，该商品**实际采购**的价格，随订单明细保存 |
| 7 | 销售实价 | 订单实价 | 针对某个具体订单，该商品**实际销售**的价格，随订单明细保存 |

---

## 客户类型规则

本项目共有 **5 种客户类型**，其中前 4 种在"客户管理"菜单下展示，游客客户不在客户管理中展示。

| 序号 | 客户类型 | CustomerType | 编号前缀 | 说明 |
|------|----------|-------------|----------|------|
| 1 | 直营客户 | `direct` | VZY | 企业客户，包括直接销售和经平台销售的客户 |
| 2 | 渠道客户 | `channel` | VQD | 企业客户，非终端客户，采购后二次销售的客户 |
| 3 | 个人客户 | `personal` | VGR | 个人客户，不区分采购后是个人消费还是二次销售 |
| 4 | 平台客户 | `platform` | VPT | 京东慧采、史泰博、易积通等集采平台客户 |
| 5 | 游客客户 | `guest` | VYK | 未知客户具体情况的自来客户（不在客户管理中展示） |

### 客户编号规则

编号格式：`前缀-简称首字母-顺序号(4位)`，各类型单独从 0001 开始编号。

### 相关文件

- 客户类型定义：`src/types/index.ts`（`CustomerType`）
- 客户数据源：`src/data/customers.tsx`
- 编号工具：`src/utils/customerCode.ts`
- 客户管理页面：`src/pages/sales/SalesCustomers.tsx`

---

## 订单生成与分发规则

「订单分发」（销售 → 订单分发）是**销售订单的入口**：处理订单从生成到分发合作商或自营的全过程，明确订单由谁接单。销售订单分三个环节：**订单录入（生成）→ 订单分发 → 订单发货 → 订单结算**；分发指订单从三个入口（订单录入手工 / 平台直连推送 / 报备商机转入）进来后分派到具体主体处理；发货指从待接单到妥投确认收货；结算指从待结算到已结算。与管理后台、合作商终端共享同一分发数据源。

### 订单生成

1. **两个来源渠道**：`manual` 手工录入（录入弹窗）、`push` 平台直连推送；订单编号格式 `WB + 日期 + 3 位序号`（同日递增）。
2. **保存即匹配报备**：录入/直连推送保存时自动与**审批通过**的报备规则比对（复用报备匹配逻辑），命中即进入「报备-匹配待确认」状态。
3. 订单必填：平台单号、客户名称、客户区域、收货人；商品行按「销售实价」录入（匹配在库客户时按客户报价带出默认价，个人客户受等级最低价约束）。

### 状态机

| 状态 | 名称 | 说明 |
|------|------|------|
| `pending` | 分发-待处理 | 初始状态，等待分发；支持拆单 |
| `report_match_pending` | 报备-匹配待确认 | 保存时命中报备自动进入，人工确认后分发 |
| `self_pending` | 自营待接单 | 选转自营路径，等管理后台在「销售订单 → 分发订单」接单 |
| `grabbing` | 抢单中 | 按商品抢单进行中（限时） |
| `comparing` | 比单中 | 按商品公开报名中（限时） |
| `distribute_pending` | 转派待接单 | 已转出合作商，等终端接单 |
| `processed` | 分发-已完成 | 已接单执行中（自营执行链 / 合作商履约 accepted→shipping→delivered） |
| `completed` | 已完成 | 已结算（`processed` 与 `completed` 在列表/流程图归并展示为「分发-已完成」，子状态区分执行进度） |

### 分发方式（订单分发弹窗）

待处理订单点击「分发」打开独立处理弹窗（非详情页），五种方式：

| 方式 | 确认按钮 | 规则 |
|------|----------|------|
| 转自营 | 确认 | 进入自营待接单（辅色调标识） |
| 转派-指定 | 指定并转出 | 从合作商列表选择（含积分/履约率/地区），支持省/市/县筛选与名称搜索 |
| 转派-报备 | 匹配并转出 | 从审批通过的报备记录中勾选（可多选），转出报备合作商 |
| 转派-抢单 | 发起抢单 | 按商品先到先得，限时（时长在面板内设置），可限合作商地区 |
| 转派-比单 | 发起比单 | 按商品公开报名，设底价（折扣/具体价格），限时，可限合作商地区 |

抢单时长、比单报名时长与评分权重设置位于订单分发弹窗对应方式面板内（即时生效），不再单设分发设置弹窗。

### 报备匹配规则

1. **自动匹配**：订单保存时与审批通过的报备比对（订单报备按关联单号、商品报备按商品+区域+客户、客户报备按客户名），命中进入「报备-匹配待确认」，人工确认后分发给报备合作商。
2. **多对多**：一笔订单可对应**多条**报备（弹窗内 checkbox 多选，匹配信息全部记录，转出首家勾选报备的合作商）；一条报备可服务**多笔**订单（无排他）。
3. 分发路径口径：报备-匹配待确认状态订单的分发路径显示为**转派-报备**。

### 拆单规则

1. **手动拆单**：仅「分发-待处理」状态支持，按**商品 + 数量**拆出子订单；子订单编号 = 母订单编号 + `-1`、`-2`…（按已拆次数递增）；母订单保留剩余商品，不能拆出全部。
2. **展示**：拆单家族在列表各自独立展示；详情抽屉按「母订单 / 子订单 N」标签页切换，子订单显示母订单编号。
3. **自动分拆**（抢单/比单定案，见下）：母订单被替换为若干子订单，子订单 `parentCode` 指向母编号。

### 按商品抢单规则（转派-抢单）

1. 合作商在终端「抢单大厅」可对订单中的 **1 个或多个商品**抢单（勾选），按商品先到先得。
2. **已抢商品对其他合作商不再展示**；他人可继续抢剩余商品。
3. **全部商品被抢**：立即分拆定案——按中单合作商分组生成子订单（各转「转派待接单 · 转派-抢单」）。
4. **超时且部分被抢**：分拆定案，已被抢部分同上；**未抢商品合并生成子订单**退回「分发-待处理」，来源字段标注 **「抢单未成」** 标签。
5. **超时且无人抢**：整单退回分发-待处理，标注「抢单未成」。
6. 发起时可选定参与合作商的省/市/县地区范围，范围外合作商不可见。

### 按商品比单规则（转派-比单）

1. 合作商在终端可对订单中的 **1 个或多个商品**报名报价；报价默认带出其系统品牌折扣报价，不得低于底价（底价按**所选商品金额占比折算**）。
2. **定标规则：按商品维度，各商品由报名该商品的合作商中「积分排名第一」者中单**（积分取合作商积分台账总分）。
3. **分拆定案**：同一合作商中单多个商品的**合并生成一个子订单**（转转派待接单 · 转派-比单）；**无报名商品合并生成子订单**退回分发-待处理，来源标注 **「比单未成」** 标签。
4. 支持管理台在报名合作商中直接选定（转为指定转派）；截止后（或强制）在「比单管理」定标。
5. 发起时可选定参与地区范围。

### 履约与结算

1. **分发链**：转派待接单 → 合作商终端接单（accepted）→ 发货（shipping）→ 客户签收（delivered）→ 结算（settled，按时履约积分 +5 / 超时 -5，自动写入积分台账）→ 已完成。
2. **自营链**：自营待接单 → 管理后台「销售订单 → 分发订单」接单（填**跟单人** + 选**采购供应商**，生成采购单，以销定采）→ 到货入库 → 出库发货 → 客户签收 → 已完成。

### 重新分发

待接单（自营/分发）订单可「重新分发」退回分发-待处理重新选择路径；**已接单订单重新分发需二次确认**（弹窗分级警示，已发货/已签收特别提示），原有执行信息作废，报备匹配信息一并清除（不再自动按报备转派）。

### 相关文件

- 分发 Store（状态机/抢单/比单/拆单/分拆定案）：`src/stores/orderFlowStore.ts`
- 管理端页面（列表/订单分发弹窗/拆单/分页）：`src/pages/sales/ExternalOrders.tsx`
- 比单管理：`src/pages/sales/CompareManage.tsx`；销售订单分发订单 Tab：`src/pages/sales/SalesOrders.tsx`
- 合作商终端抢单大厅：`src/pages/partner/PartnerGrab.tsx`、订单履约：`src/pages/partner/PartnerOrders.tsx`
- 种子数据（含 48 条演示订单生成器）：`src/data/externalOrders.ts`
- 地区范围判定：`src/types/index.ts`（`RegionScope` / `partnerInRegion`）

---

## 订单销售场景规则

（内容待补充）

---

## 绩效计算规则

（内容待补充）
