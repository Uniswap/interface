# Limit Order 页面说明

## 背景

该目录用于承载新的独立 `Limit Order` 页面。

这次改动的目标不是继续复用项目内旧的 `/limit` 逻辑，而是接入合作方提供的 Orbs Spot React widget，并通过单独页面承载 `limit order` 能力。

合作方参考资料：

- skill: `https://github.com/orbs-network/spot-ui/tree/master/skills/spot-react-integration`
- example: `https://github.com/orbs-network/spot-ui/blob/master/apps/web/components/spot/spot-form.tsx`

## 这次改了什么

### 1. 新增独立页面

新增文件：

- `apps/web/src/pages/LimitOrder/index.tsx`

页面通过 `SpotProvider` 接入 `@orbs-network/spot-react`，并在本地组合了以下能力：

- 顶部交易 tab：`Swap / Stock / Limit Order`
- 输入币种选择
- 输出币种选择
- 限价输入
- 市场参考价格展示
- 下单按钮与执行状态展示
- 授权、wrap 交易跳转 explorer 链接

### 2. 新增独立路由

新增独立路由：

- `/limit-order`

这样做的原因：

- 避免和项目里原有 `/limit` 页面逻辑混在一起
- 让第三方 widget 的接入边界更清晰
- 便于后续单独维护、灰度和回滚

### 3. 交易入口改造

页面入口层面做了两类改动：

- `swap` 页面顶部 segmented control 增加 `Limit Order`
- 顶部导航 Trade 菜单增加 `Limit Order`

点击后统一跳转到：

- `/limit-order`

### 4. 依赖接入

接入的核心依赖：

- `@orbs-network/spot-react`
- `bignumber.js`
- `react-error-boundary`
- `zustand`

其中 `@orbs-network/spot-react` 已从 `latest` 固定为明确版本，避免供应链漂移。

## 页面实现思路

### 1. 沿用项目现有上下文

页面没有重新发明一套 token / chain / balance 状态，而是尽量复用现有基础设施：

- `MultichainContextProvider`
- `SwapAndLimitContextProvider`
- `PrefetchBalancesWrapper`
- `useInitialCurrencyState`
- `useRoutingAPITrade`
- `useCurrencyBalance`
- `useUSDPrice`

这样能保证：

- token 与链路初始化方式和现有交易页一致
- URL 初始化参数可复用
- 余额、价格、报价的来源保持统一

### 2. 用本地 UI 包住第三方 widget

虽然核心下单逻辑使用的是 Orbs Spot React，但页面外层 UI 仍由本项目控制，包括：

- 页面布局
- 输入输出币种面板
- 限价输入区
- 按钮文案
- 状态展示

这样做的好处：

- 风格更接近现有站点
- 保留本地交互控制权
- 后续做安全收敛更方便

### 3. Wallet 交互由本地注入

第三方 widget 并没有直接接管钱包，而是通过 `walletInteractions` 由本项目注入实际能力：

- `wrapNativeToken`
- `approveToken`
- `cancelOrder`
- `signOrder`
- `getAllowance`

这意味着最终链上操作仍然经过本地代码控制，而不是完全交给第三方包自由调用。

## 安全是怎么做的

第三方 widget 以 npm 依赖形式运行在主应用上下文中，因此不能把它当成 iframe 沙箱。当前安全策略的核心思路是：

- 固定依赖版本
- 收紧钱包能力边界
- 只允许预期 token / contract / chain 生效
- 收紧第三方网络出口范围

### 1. 固定第三方依赖版本

已经把：

- `@orbs-network/spot-react: latest`

改成固定版本：

- `@orbs-network/spot-react: 1.1.25`

这样可以避免以下问题：

- 不同机器重新安装依赖时拉到不同代码
- 上游发版后被动引入不可控变更
- 安全排查时无法准确对应实际运行版本

### 2. 使用 Orbs 官方配置做白名单

页面通过：

- `getConfig(Partners.Agent, chainId)`

读取当前链的 Orbs 配置，然后据此做本地白名单校验。

校验不是写死到页面里的随机地址，而是基于 Orbs 当前链配置动态约束：

- `repermit`
- `twapConfig.twapAddress`

### 3. 限制 approveToken

`approveToken` 现在只允许：

- 授权当前输入币种
- 授权给当前链 Orbs 配置中的 `repermit`

这样可以避免第三方 widget 借由本地钱包能力：

- 请求其他 token 的授权
- 请求授权给非预期 spender

### 4. 限制 getAllowance

`getAllowance` 也做了同样的约束，只允许：

- 查询当前输入币种
- 查询 Orbs `repermit` 的 allowance

这样可以避免第三方利用 allowance 查询探测不相关 token 授权情况。

### 5. 限制 cancelOrder

`cancelOrder` 只允许调用以下合约地址：

- `spotConfig.repermit`
- `spotConfig.twapConfig?.twapAddress`

这样可以避免 widget 通过本地注入的钱包能力去调用非预期合约的 `cancel` 方法。

### 6. 限制 signOrder

`signOrder` 增加了三层检查：

- 签名账户必须等于当前连接钱包
- `domain.verifyingContract` 必须等于 `spotConfig.repermit`
- `domain.chainId` 不能和当前连接网络不一致

这样可以避免：

- 让用户替别的账户签名
- 让用户给非预期合约签 EIP-712 数据
- 在错误链上发起签名

### 7. 原生币 wrap 仍走本地合约地址

`wrapNativeToken` 不接受第三方随意指定合约，而是只使用本项目已有的：

- `WRAPPED_NATIVE_CURRENCY[chainId]`

因此 wrap 路径仍然受本地代码控制。

### 8. 增加 Orbs 的 CSP connect-src 白名单

为了避免第三方 widget 或其依赖在页面上下文中随意向其他域名发请求，已在 Web CSP 的 `connect-src` 中只补充当前接入明确需要的 Orbs 生产域名：

- `https://order-sink-v2.orbs.network`
- `https://hub.orbs.network`
- `https://bi.orbs.network`

这 3 个域名分别用于：

- Orbs 订单创建与订单查询
- Orbs Hub / subgraph 查询
- Orbs BI 埋点

这样做的收益：

- 当前 widget 的预期请求可以正常放行
- 未来如果第三方依赖偷偷新增外联域名，会被浏览器直接拦截
- 出站请求边界更清晰，便于安全审计

当前没有额外放开：

- `order-sink-dev.orbs.network`
- `order-sink.orbs.network`

原因是当前页面实现并未显式启用 Orbs dev 环境，优先遵循最小权限原则。

## 当前边界

当前已经完成的是“钱包能力边界收紧”，但还不是完整的最终安全方案。

仍然需要注意：

- 第三方包依然运行在主应用 JS 上下文
- 该包内部仍会请求 Orbs 服务端接口
- 地址、订单、签名流程依然对第三方服务存在业务依赖
- CSP 只能限制“能连哪些域名”，不能替代本地钱包白名单校验

## 后续可继续加强的方向

建议下一步继续做：

- 对白名单拦截错误增加埋点或日志
- 如果后续合作方提供 Ring 专属 `partner`，再替换当前 `Partners.Agent`
- 如果上线前需要更强隔离，可评估 iframe / 独立域名 / proxy 方案

## 维护建议

后续如果修改本页面，优先检查以下几点：

- 是否仍然走独立路由 `/limit-order`
- 是否仍然通过本地 `walletInteractions` 控制钱包能力
- 是否仍然保留 token / spender / contract / chain 的白名单校验
- 是否仍然固定第三方依赖版本

如果后续要放开权限，请先重新评估供应链风险和钱包调用边界，不建议直接删除这些限制。
