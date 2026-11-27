# 茶叶管理系统 - 项目规则

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

- 编码工具函数：`src/utils/productCode.ts`
- 品牌数据源（含编号）：`src/data/brands.tsx`
- 分类数据源：`src/data/productCategories.tsx`
- 商品数据：`src/data/teaProducts.tsx`

---

## 销售单编号规则

销售体系共 **4 类单据编号**，全部以销售单编号为根，逐层派生。

> **术语统一**：`销售单编号` = `销售单订单号` = `销售单号`（同一字段 `ExternalOrder.code`），界面与文档统一使用「销售单编号」。

### 编号格式

| 单据 | 格式 | 示例 |
|------|------|------|
| 销售单 | `SO-` + 年月日（6 位 YYMMDD）+ 4 位顺序号（从 0001 起） | `SO-2611150001` |
| 销售履约单 | 销售单编号 + `LY` + 2 位顺序号（从 01 起） | `SO-2611150001LY01` |
| 销售发货单 | 销售单编号 + `FH` + 2 位顺序号（从 01 起） | `SO-2611150001FH01` |
| 销售退货单 | 销售单编号 + `TH` + 2 位顺序号（从 01 起） | `SO-2611150001TH01` |

### 编号约束

1. **销售单序号**：按日从 `0001` 开始，同日新增销售单依次递增（跨日重新从 0001 起）
2. **履约单序号**：在同一销售单下从 `01` 起依次递增，一个销售单可拆出多个履约单
3. **发货单序号**：在同一销售单下从 `01` 起依次递增，且为**该销售单下各履约单的全部发货单按生成时间先后顺序全局编号**（不按履约单分别从 01 起）
4. **退货单序号**：销售履约单对应的退货单均挂在母销售单下统一编号，从 `01` 起依次递增
5. **层级关系**：一个销售单 → 多个销售履约单 → 每个履约单下多个销售发货单 / 销售退货单
6. **编号不可变**：已生成的单据编号不因后续拆单、分发、结算等操作改变

### 相关文件

- 编号工具函数：`src/utils/orderCodes.ts`（`genSalesOrderCode` / `genFulfillmentCode` / `nextShipmentCode` / `genReturnCode` / `soRootOf`）
- 订单分发 Store：`src/stores/orderFlowStore.ts`
- 采购/包裹 Store：`src/stores/purchaseStore.ts`
- 退货 Store：`src/stores/returnStore.ts`
- 新建销售单页：`src/pages/sales/OrderEntry.tsx`

---

## 销售履约规则

销售单分发完成后进入**销售履约环节**，按销售履约单（未拆分时为母销售单本身）跟踪。

### 状态体系（销售单状态与履约单状态分开）

**销售单**：订单状态（未处理 / 处理中 / 已办结 / 已取消）+ 分发进度 / 履约进度 / 结算进度三个聚合（按履约单维度，x/y 分母为有效履约单数）。
- 订单状态：尚未送分发、未生成履约单 → 未处理；其下全部履约单办结 → 已办结；全部取消 → 已取消；其余 → 处理中。

**履约单**：分发状态 / 履约状态 / 结算状态 / 订单进度四块。

| 状态块 | 取值 |
|--------|------|
| 分发状态 | 待分发、自营待接单、转派比单中、转派待接单、分发已完成 |
| 履约状态 | 待接单、已接单、运输中、已妥投、已确收 |
| 结算状态 | 收款（未收款/已收款）× 开票（未开票/已开票）组合展示，如「未收款·已开票」 |
| 订单进度 | 分发中、履约中、结算中、已办结、已取消 |

- 已取消不再出现在分发状态 / 履约状态中，只体现在订单进度（取消后订单进度＝已取消）。
- 订单进度判定优先级：已取消 → 已办结 → 结算中 → 分发中 → 履约中。
- 已确收履约单在「销售单管理 → 履约单结算」页发起对账结算（订单进度→结算中），登记收款 / 开票；收款+开票完成自动已办结，已收款未开票可手工办结。

### 履约状态链

`待接单` → `已接单` → `运输中` → `已妥投` → `已确收`

| 状态 | FulfillmentStage | 说明 |
|------|------------------|------|
| 待接单 | `pending_accept` | 已分发到自营 / 合作商，等待接单 |
| 已接单 | `accepted` | 自营或合作商已接单，进入备货/采购 |
| 运输中 | `shipping` | 已登记发货（自营分仓发货 / 合作商包裹） |
| 已妥投 | `transit` | 全部包裹物流妥投或客户签收 |
| 已确收 | `confirmed` | 客户确认收货（合作商链结算后置为该状态） |

### 履约五节点时间

| 字段 | 名称 | 写入时机 |
|------|------|----------|
| `arriveTime` | 来单时间 | 分发到自营 / 合作商（转派定案、选择自营路径、比单定标） |
| `acceptTime` | 接单时间 | 自营接单 / 合作商终端接单 |
| `shipTime` | 发货时间 | 自营分仓发货、到货出库、合作商发货登记 |
| `deliverTime` | 妥投时间 | 全部包裹妥投 / 合作商物流妥投、客户签收 |
| `confirmTime` | 确收时间 | 客户确认收货（合作商链为结算完成） |

### 待接单操作

| 端 | 操作 | 规则 |
|----|------|------|
| 管理后台 | 查看 / 取回 | 从自营或合作商主动取回；支持整体取回与部分取回 |
| 合作商工作台 | 查看 / 接单 / 退回 | 接单需弹窗确认；退回仅支持整单退回 |

**取回规则**：
1. **整体取回**：履约单编号不变，订单回到销售单分发（`pending`）
2. **部分取回**：按商品 + 数量取回，剩余部分沿用原履约单编号；取回部分按规则生成新的履约单编号（`母单号+LY+2位`）
3. **来源标签**：按原分发来源新增 `自营取回` / `指定取回` / `报备取回` / `比单取回`（`sourceTag`：`self_takeback` / `assign_takeback` / `report_takeback` / `compare_takeback`）
4. **退回规则**：合作商仅支持整单退回，退回后进入平台待分发，需重新分发

### 关键约束

1. **数据落位**：时间线存于 `ExternalOrder.fulfillment`（`FulfillmentTimeline`），`stage` 为当前履约状态
2. **动作驱动**：所有节点时间由订单流转动作写入，不允许页面直接改写
3. **三端一致**：管理后台销售单履约、合作商工作台订单管理、自营工作台订单管理使用同一套状态与时间口径（`src/utils/fulfillment.ts`）
4. **旧数据兜底**：无 `fulfillment` 的历史订单按 `processStatus` / `partnerStatus` 推导状态，时间显示 `—`

### 相关文件

- 履约状态与时间工具：`src/utils/fulfillment.ts`
- 流转写入：`src/stores/orderFlowStore.ts`
- 管理后台：`src/pages/sales/SalesFulfillment.tsx`、`src/pages/sales/SalesOrderDetail.tsx`
- 合作商工作台：`src/pages/partner/PartnerOrders.tsx`
- 自营工作台：`src/pages/selfop/SelfopOrders.tsx`、`src/components/selfop/SelfOrderDetailDrawer.tsx`

---

## 销售路径规则

### 一、三类角色

| 角色 | 分类 | 说明 | 代码定义 |
|------|------|------|----------|
| **淡茶半盏** | 平台方 | 运营主体，连接上下游，采购 + 销售 + 分发 + 结算 | 管理后台 |
| **合作商** | 供货/履约方 | 三类子类型（可多选） | `SupplierType = 'brand' \| 'supplier' \| 'service'` |
| ↳ 品牌商 | 品牌持有方 | 商品品牌的持有者。管理后台维护品牌商档案，淡茶半盏向品牌商发起采购。与供应商/服务商**互斥**（一个合作商不能同时是品牌商和供应商/服务商） | `types: ['brand']` |
| ↳ 供应商 | 差价模式供货方 | 给淡茶半盏供货的公司，一般是品牌的代理商、各地区茶叶门店。差价模式：供应商按约定价格卖给淡茶，淡茶自己决定售价 | `types: ['supplier']` + 合作模式 `coopMode: 'supplier'` |
| ↳ 服务商 | 扣点模式供货方 | 在当地组织客户营销、自行发货履约，但销售逻辑上还是**服务商销售给淡茶半盏**（即服务商先以某个价格把商品卖给淡茶），一般是品牌当地的代理商、茶叶门店或地推营销服务公司。扣点模式：淡茶的售价固定，服务商拿扣点 | `types: ['service']` + 合作模式 `coopMode: 'service'` |
| **客户** | 采购方 | 四类子类型 | `CustomerType = 'direct' \| 'channel' \| 'personal' \| 'platform' \| 'guest'` |
| ↳ 直营客户 | 直接服务的企业客户 | 淡茶半盏直接销售的企业客户。可以走**直接销售**（淡茶→直营客户）或**经平台销售**（淡茶→平台客户→直营客户） | `type: 'direct'` + `viaPlatform?: boolean` 标记是否有经平台销售 |
| ↳ 渠道客户 | 二次销售的企业客户 | 淡茶半盏销售给该客户，客户拿回去会二次销售 | `type: 'channel'` |
| ↳ 平台客户 | 集采平台 | 指经过他们销售给直营客户的一些平台（京东慧采、史泰博、易积通等）。淡茶半盏可以**直接销售给平台客户**，也可以**经平台销售给直营客户** | `type: 'platform'` |
| ↳ 个人客户 | 个人消费者 | 淡茶半盏直接销售给个人 | `type: 'personal'` |

### 二、买卖关系（核心资金流）

```
采购端（供货链路）：三类合作商 ──销售──▶ 淡茶半盏
  品牌商：淡茶向品牌商发起采购（品牌商可以只持有品牌，也可以兼做供应商）
  供应商：差价模式，淡茶按约定价采购后自己定价销售
  服务商：扣点模式，淡茶售价固定，服务商从售价中拿扣点

销售端（客户链路）：淡茶半盏 ──销售──▶ 四类客户
  直接销售：淡茶 → 直营客户 / 渠道客户 / 平台客户 / 个人客户
  经平台销售：淡茶 → 平台客户（中间层） → 直营客户（终端）
```

> **关键**：服务商在销售链中**不直接卖给客户**，而是先把商品卖给淡茶半盏，再由淡茶半盏卖给客户。服务商的"服务"是在履约端（营销、发货、组织客户），买卖关系还是服务商→淡茶→客户。

### 三、销售端路径编码

销售端有两种路径，用 `ExternalOrder.salesPath` 区分：

| salesPath | 含义 | 客户类型 | 说明 |
|-----------|------|----------|------|
| `direct` | 直接销售 | direct / channel / platform / personal | 淡茶半盏直接销售给客户，中间没有平台 |
| `via_platform` | 经平台销售 | direct（仅有 viaPlatform 标记的） | 淡茶半盏通过平台客户销售给直营客户。订单需同时填 `platformCustomerId`（中间平台）和 `customerName`（终端直营客户） |

> **注意**：`salesPath` 只描述销售端的路径，不描述履约端。履约端是自营还是分发由 `path: 'self' | 'distribute'` 决定。

### 四、典型流程（四个核心场景）

#### 流程 1：淡茶向品牌商采购 → 直接销售给四类客户

```
品牌商 ──采购──▶ 淡茶半盏 ──直接销售──▶ 直营客户 / 渠道客户 / 平台客户 / 个人客户
```

- 采购端：PurchaseOrder，合作商类型 `types: ['brand']`
- 销售端：ExternalOrder `salesPath: 'direct'`，`customerType: 'direct'|'channel'|'platform'|'personal'`
- 履约：`path: 'self'`（自营发货）或 `path: 'distribute'`（分发供应商履约）

#### 流程 2：淡茶向品牌商采购 → 经平台销售给直营客户

```
品牌商 ──采购──▶ 淡茶半盏 ──经平台销售──▶ 平台客户 ──平台采买──▶ 直营客户
```

- 采购端：同流程 1，向品牌商采购
- 销售端：ExternalOrder `salesPath: 'via_platform'`，`platformCustomerId` 填中间平台，`customerType: 'direct'`
- 销平台报价/实价：= 销售报价/实价 × (1 − 平台扣点)

#### 流程 3：服务商报备 → 人工匹配后转服务商履约

```
服务商 ──报备订单──▶ 淡茶半盏 ──人工匹配报备──▶ 服务商履约 ──卖给──▶ 淡茶半盏 ──卖给──▶ 客户
```

- 服务商在当地营销获得客户商机 → 合作商工作台报备（`PartnerOrderReportKind = 'self'` 有货源 或 `no_supply` 无货源）
- 淡茶审批报备 → 报备进入有效报备池，等待订单命中
- 分发方式：`transferKind: 'order-opportunity'`（商机报备）或 `'product'`（商品报备）或 `'region'`（区域报备）
- 履约：服务商接单 `coopMode: 'service'` 扣点模式，自行发货
- 销售端路径：服务商的报备订单可以是直接销售也可以是经平台销售，由客户类型决定

#### 流程 4：淡茶自营订单 → 分发履约

```
淡茶半盏 ──自营获得订单──▶ 分发（自营 / 指定 / 比单 / 报备）──▶ 服务商 / 供应商 履约
```

- 订单来源：手工录入 / 平台直连推送，`processStatus: 'pending'`
- 分发方式：
  - **自营**：`path: 'self'` → 分仓发货（SelfShipment）
  - **指定**：`distributeMode: 'assign'` → 指定服务商/供应商
  - **比单**：`distributeMode: 'compare'` → 合作商报价竞争，`comparing` → `distribute_pending`
  - **报备**：`transferSource: 'report'` → 人工匹配报备后直接转出报备合作商（无中间待确认状态）
- 履约承接方：服务商（`coopMode: 'service'`）或供应商（`coopMode: 'supplier'`）

### 五、分发状态机（履约端，与销售端 salesPath 正交）

```
pending 待处理（新录入/推送的订单，未决定履约路径）
  │
  ├── 自营路径 ──▶ self_pending ──▶ self_accepted ──▶ self_shipped ──▶ self_delivered ──▶ completed
  │                   自营待接单        自营已接单        自营发货          自营妥投           确认收货
  │
  ├── 分发路径 ──▶ distribute_pending ──▶ processed ──▶ completed
  │                   分发待接单（合作商接单）   已处理（发货/结算）
  │
  ├── 报备 ──▶ distribute_pending（人工勾选报备后直接转出，无中间状态）
  │
  └── 比单 ──▶ comparing ──▶ distribute_pending
               比单中
```

### 报备匹配规则（纯人工，无自动匹配）

1. **无自动匹配**：订单进入（手工录入 / 直连推送）不自动与报备比对，一律先进「销售单处理」等待人工处理
2. **无待确认状态**：不存在 `report_match_pending` 状态；报备匹配均为人工操作，确认后直接转出报备合作商（`distribute_pending` 转派待接单）
3. **入口**：
   - 销售单处理：行内「匹配报备」按钮 → 报备匹配弹窗人工勾选 → 整单生成履约单并转出
   - 履约单分发：分发弹窗「转派-报备」方向 → 报备匹配弹窗人工勾选 → 整单转出
4. **匹配弹窗**：展示全部已通过报备（订单 / 商品 / 地区，按优先级排序），「命中提示」列按 `reportStore.matchesReport` 规则计算仅作参考；可多选，确认后转给首家勾选报备的合作商，全部勾选记录为匹配信息
5. **无货源订单报备**（`orderKind: 'no_supply'`）：确认后订单退回待分发，由平台自营或转派供货商

### 六、代码中与销售路径相关的关键字段

| 字段 | 位置 | 含义 | 取值 |
|------|------|------|------|
| `SupplierItem.types` | `src/types/index.ts` | 合作商类型 | `['brand']` / `['supplier']` / `['service']`（不可 brand 与 supplier/service 共存） |
| `PartnerCoopMode` | `src/types/index.ts` | 合作模式（差价/扣点） | `'supplier'`（差价）/ `'service'`（扣点） |
| `ExternalOrder.salesPath` | `src/types/index.ts` | 销售端路径 | `'direct'` / `'via_platform'` |
| `ExternalOrder.path` | `src/types/index.ts` | 履约端路径 | `'self'`（自营）/ `'distribute'`（分发） |
| `ExternalOrder.processStatus` | `src/types/index.ts` | 分发状态机 | 见上节状态机 |
| `ExternalOrder.platformCustomerId` | `src/types/index.ts` | 中间平台客户 | 仅 `salesPath='via_platform'` 时有值 |
| `ExternalOrder.transferKind` | `src/types/index.ts` | 分发来源 | `'order-self'`/`'order-opportunity'`/`'product'`/`'region'`/`'assign'`/`'compare'` |
| `CustomerType` | `src/types/index.ts` | 客户类型 | `'direct'`/`'channel'`/`'personal'`/`'platform'`/`'guest'` |
| `viaPlatform` | 客户主数据 | 是否有经平台销售 | 仅 direct 客户有 |

### 七、相关文件

- 角色类型定义：`src/types/index.ts`（`SupplierType`、`PartnerCoopMode`、`CustomerType`、`ExternalOrder`）
- 合作商数据：`src/data/suppliers.tsx`
- 客户数据：`src/data/customers.tsx`
- 平台数据：`src/data/platforms.ts`
- 采购订单（分发投影）：`src/pages/purchase/PurchaseOrders.tsx`
- 销售单分发：`src/pages/sales/ExternalOrders.tsx`
- 新建销售单：`src/pages/sales/OrderEntry.tsx`
- 销售履约：`src/pages/sales/SalesFulfillment.tsx`
- 合作商订单：`src/pages/partner/PartnerOrders.tsx`
- 自营订单：`src/pages/selfop/SelfopOrders.tsx`

---

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

## 价格体系规则

整个项目的商品价格体系由 **基准价**、**渠道价**、**订单实价** 三层构成，另有经平台销售特有的销平台报价/实价。所有价格均以元为单位、数值类型。

### 价格类型定义

| 序号 | 价格名称 | 字段名 | 归属层级 | 说明 |
|------|----------|--------|----------|------|
| 1 | 市场价 | `marketPrice` | 基准价 | 品牌方制定的市场正常销售价，一般为零售价。存储于商品档案 `TeaProduct` |
| 2 | 京东价 | `jdPrice` | 基准价 | 京东自营旗舰店的销售价格。存储于商品档案 `TeaProduct` |
| 3 | 天猫价 | `tmallPrice` | 基准价 | 天猫旗舰店的销售价格。存储于商品档案 `TeaProduct` |
| 4 | 采购价 | `purchasePrice` | 渠道价 | 当前系统内与供应商商定的商品进货价格。按「商品 + 供应商」维度维护，存储于 `PurchasePriceRule` |
| 5 | 销售价 | `salesPrice` | 渠道价 | 当前系统内各商品标准的对外销售价。按「商品」维度维护，存储于商品档案 `TeaProduct.salesPrice` |
| 6 | VIP销售价 | `vipPrice` | 渠道价 | 针对不同客户设置的差异化销售价，关联具体客户。按「商品 + 客户」维度维护，存储于 `VipPriceRule`，一个商品可为多个客户设置不同 VIP 价 |
| 7 | 采购实价 | `actualPurchasePrice` | 订单实价 | 关联到具体采购订单的商品价格，记录采购下单时的实际采购价格。存储于采购订单明细 `PurchaseOrderItem` |
| 8 | 销售实价 | `actualSalesPrice` | 订单实价 | 关联到具体销售订单的商品价格，记录销售下单时的实际销售价格。存储于销售订单明细 `SalesOrderItem` |

### 销售报价统一规则（重要）

**销售报价**是淡茶平台给客户的报价，**直接销售和经平台销售统一使用同一销售报价**，不再区分两种报价。销售报价取客户维度的有效报价（单品价 > 品牌整体折扣 > 未配置）。

### 经平台销售的销平台价格

经平台销售模式下有两种给**平台**的价格（与给客户的价格区分）：

| 价格 | 定义 | 计算方式 |
|------|------|----------|
| 经平台销平台报价 | 经平台销售时淡茶给平台的报价 | 销售报价 ×（1 − 该客户经该平台的扣点） |
| 经平台销平台实价 | 经平台销售时淡茶给平台的实价 | 销售实价 ×（1 − 该客户经该平台的扣点） |

> 平台扣点数据来源：客户的 `platformCommissionRates` 字段（`customerItems`），按「客户 ID → 平台 ID → 扣点%」映射。

### 页面展示规则

| 页面 | 直接销售 | 经平台销售 |
|------|----------|------------|
| 新建销售单（`OrderEntry.tsx`） | 市场价 / 销售报价 / 数量 / 销售实价 / 小计 | 市场价 / 销售报价 / 数量 / 销售实价 / **销平台实价** / 小计（**不展示销平台报价**） |
| 销售单详情弹窗（`SalesOrderInfoModal.tsx`） | 市场价 / 销售报价 / 销售实价 / 小计 | 市场价 / 销售报价 / **销平台报价** / 销售实价 / **销平台实价** / 小计 |

### 取价工具函数（核心）

- `effectiveCustomerQuote(map, customerId, productId, products)` — 客户维度有效报价（单品价 > 品牌折扣），定义于 `src/stores/priceStore.ts`
- `calcPlatformNetPrice(price, commissionRate)` — 计算 price × (1 − 扣点)，定义于 `src/data/prices.tsx`
- **quoteOf() 统一**：`OrderEntry.tsx` 和 `SalesOrderInfoModal.tsx` 中的 `quoteOf()` 不再区分 `isVia`，一律调用 `effectiveCustomerQuote`

### 价格层级与取值优先级

```
基准价（商品档案）         渠道价（价格规则）           订单实价（订单明细）
marketPrice                purchasePrice               actualPurchasePrice
jdPrice                    salesPrice                  actualSalesPrice
tmallPrice                 vipPrice
```

**销售下单取价优先级**：VIP销售价（当前客户） > 销售价 > 市场价

**采购下单取价优先级**：采购价（当前供应商） > 市场价 × 采购折扣率

### 各价格维护入口

| 价格 | 维护入口 | 维度 |
|------|----------|------|
| 市场价 / 京东价 / 天猫价 | 商品 > 价格管理 > 市场价管理 Tab；商品档案编辑 | 商品 |
| 采购价 | 商品 > 价格管理 > 采购价管理 Tab；采购 > 采购报（调）价 | 商品 + 供应商 |
| 销售价 | 商品 > 价格管理 > 销售价管理 Tab | 商品 |
| VIP销售价 | 商品 > 价格管理 > VIP销售价 Tab；销售 > 报价管理 | 商品 + 客户 |
| 采购实价 | 采购 > 采购订单（新建/编辑订单时调整） | 采购订单 + 商品 |
| 销售实价 | 销售 > 销售订单（新建/编辑订单时调整） | 销售订单 + 商品 |

### 订单价格调整规则

1. **采购下单**：选择商品后自动带出该供应商的采购价作为默认单价，支持在订单内调整，调整后的价格记录为该订单的「采购实价」，不回写到采购价规则
2. **销售下单**：选择商品后按取价优先级自动带出默认单价（VIP价 > 销售价 > 市场价），支持在订单内调整，调整后的价格记录为该订单的「销售实价」，不回写到 VIP 价或销售价规则
3. **实价不可回写**：订单内的价格调整仅影响当前订单，不修改商品档案或价格规则中的基准价/渠道价
4. **实价留痕**：订单保存后，实价随订单明细永久保存，用于财务对账和利润分析

### 订单价格快照规则（重要）

1. **下单即固化**：订单创建的即刻，该订单的销售报价、销售实价、销平台实价、扣点比例（淡茶扣点、平台扣点）、采购价等价格数据按下单时点静态固定，写入订单（订单行）成为订单快照。
2. **后续调整不回写**：此后客户档案的淡茶扣点、平台扣点，以及价格规则（市场价 / 京东价 / 天猫价 / 销售价 / VIP 价 / 采购价）的任何调整，只影响其后新建的订单，不影响已创建订单的价格与结算金额。
3. **扣点比例口径**：扣点模式（服务商）采购价 = 销售实价 ×（1 − 扣点比例），扣点比例 = 淡茶扣点 + 平台扣点（仅经平台销售加平台扣点）；淡茶扣点为客户维度属性，不随供货合作商变化。
4. **与实价随单一致**：本规则是「实价随单」约束的扩展——快照覆盖的不只是订单内手工调整的实价，也包括按规则自动带出的报价与扣点比例。

### 关键约束

1. **基准价唯一**：市场价、京东价、天猫价、销售价均为商品级单一值，一个商品只有一条
2. **渠道价多维**：采购价按「商品+供应商」唯一，VIP销售价按「商品+客户」唯一
3. **实价随单**：采购实价/销售实价一旦订单创建即固化，订单内可改，订单外不可改
4. **价格联动展示**：采购下单时展示「市场价 / 采购价 / 实价」三列对比；销售下单时直接销售展示「市场价 / 销售报价 / 销售实价」，经平台销售额外展示销平台实价
5. **quoteOf 统一口径**：`OrderEntry.tsx` / `SalesOrderInfoModal.tsx` 中的 `quoteOf()` 不区分 `isVia`，一律取 `effectiveCustomerQuote`。不要再使用旧的 `effectivePlatformQuote` 作为销售报价来源
6. **下单即快照**：订单价格快照规则见上节——销售报价 / 销平台实价 / 扣点比例 / 采购价在下单时点固化，档案与规则的后续调整不回写已创建订单（销平台实价与扣点快照的落库实现见 `docs/销售单结算流程设计建议.md` 4.2-4）

### 相关文件

- 价格数据源：`src/data/prices.tsx`（采购价规则、VIP销售价规则、`calcPlatformNetPrice`）
- 价格 Store：`src/stores/priceStore.ts`（`effectiveCustomerQuote`、`effectivePlatformQuote`）
- 价格类型定义：`src/types/index.ts`（`PurchasePriceRule`、`VipPriceRule`、`PurchaseOrderItem`、`SalesOrderItem`）
- 商品档案：`src/data/teaProducts.tsx`（`marketPrice`、`jdPrice`、`tmallPrice`、`salesPrice`）
- 客户数据：`src/data/customers.tsx`（`platformCommissionRates` 平台扣点映射）
- 价格管理页面：`src/pages/product/ProductPrice.tsx`
- 新建销售单：`src/pages/sales/OrderEntry.tsx`
- 销售单信息弹窗：`src/components/business/SalesOrderInfoModal.tsx`

---

## 客户类型规则

本项目共有 **4 种客户类型**，全部在"客户管理"菜单下展示（游客客户类型已去除）。

| 序号 | 客户类型 | CustomerType | 编号前缀 | 说明 |
|------|----------|-------------|----------|------|
| 1 | 直营客户 | `direct` | KHZY | 企业客户，包括直接销售和经平台销售的客户 |
| 2 | 渠道客户 | `channel` | KHQD | 企业客户，非终端客户，采购后二次销售的客户 |
| 3 | 个人客户 | `personal` | KHGR | 个人客户，不区分采购后是个人消费还是二次销售；可转直营 |
| 4 | 平台客户 | `platform` | KHPT | 京东慧采、史泰博、易积通等集采平台客户 |

### 客户编号规则

编号格式：`前缀-顺序号(4位)`，如 `KHZY-0001`；各类型单独从 0001 开始编号，序号取「该类型现有最大序号 + 1」（删除不回收编号），新增时重名校验。

### 入合作池（原「入池 / 入客户池」）

- 仅直营客户可入合作池；管理后台「客户列表 → 详情抽屉 → 入合作池管理」维护（入合作池状态 / 入合作池范围 / 合作规则），列表滑动开关快捷开关；
- 合作商终端「客户池」按入合作池状态 + 范围（全国/省/市/区县）展示客户，实时联动。

### 客户扣点（原「淡茶扣点」）

- **客户扣点 = 针对某个客户的扣点比例（客户维度属性），与是否入合作池无关**；
- 维护与展示位置：客户列表 → 详情抽屉 → **结算开票 TAB**（0-100，可留空=未设置）；
- 用途：扣点模式（服务商）采购价 = 销售实价 ×（1 − 客户扣点 − 平台扣点〔仅经平台销售〕）；
- 平台扣点仍按「客户 × 平台」维度维护（客户详情-经平台销售），下单时快照固化。

### 相关文件

- 客户类型定义：`src/types/index.ts`（`CustomerType`）
- 客户数据源：`src/stores/customerStore.ts`（`customers`，全系统唯一数据源）
- 编号工具：`src/utils/customerCode.ts`
- 客户管理页面：`src/pages/sales/SalesCustomers.tsx`

---

## 订单销售场景与绩效（已下线，待补充）

原「6 种销售场景」流程与「主办人 / 对接人 / 带货人 / 拓客人 / 维护人 / 跟单人」角色概念已全部去除（含绩效的按场景/角色分账规则）。
销售路径规则见「销售路径规则」章节；订单与绩效的新口径确定后再在本文件补充。
