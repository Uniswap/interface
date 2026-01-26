Uniswap V3 前端配池流程与调试指南 (全范围模式)
文档版本: 2.1
适用场景: HashKey Chain (Mainnet & Testnet) V3 流动性添加，强制用户进行全范围 (Full Range) 流动性添加
核心合约: NonfungiblePositionManager
实施状态: ✅ 已完成

## 概述
本文档描述 HashKey Chain 上 Uniswap V3 流动性添加的特殊实现。为简化用户体验和降低风险，HashKey Chain 上的 V3 流动性添加**强制使用全范围模式**，隐藏价格区间选择功能。
 uniswap sdk 不支持 hashkey chain，不要使用 isBackendSupportedChainId 这类型错误！！！
### 适用链
- **HashKey Chain Mainnet** (Chain ID: 177)
- **HashKey Chain Testnet** (Chain ID: 133)


Trading API 授权检查 本项目不支持，
1. useTokenAllowance - 基础链上授权检查
位置：apps/web/src/hooks/useTokenAllowance.ts
功能：
使用 useReadContract 直接查询链上 ERC20 合约的 allowance 方法
不依赖任何 API，纯链上查询
支持自动刷新（当授权交易确认后）
export function useTokenAllowance({ token, owner, spender }: {  token?: Token  owner?: string  // 用户地址  spender?: string  // 授权给谁（比如 Position Manager）}): {  tokenAllowance?: CurrencyAmount<Token>  isSyncing: boolean}
2. usePermit2Allowance - Permit2 授权检查
位置：apps/web/src/hooks/usePermit2Allowance.ts
功能：
检查 Permit2 合约的授权
内部使用 useTokenAllowance 检查基础 ERC20 授权
3. getApproveInfo - Gas 估算中的授权检查
位置：apps/web/src/state/routing/gas.ts
功能：
使用合约的 callStatic.allowance 方法检查授权
用于估算授权交易的 gas 费用

### 核心特性
1. **仅支持 Uniswap V3**（不支持 V4）
   - HashKey Chain 上的流动性添加功能**仅支持 V3 协议**
   - V4 协议相关代码已从 HashKey Chain 支持中移除
   - 所有 V4 相关的 hooks、配置和逻辑都不适用于 HashKey Chain
2. 自动强制全范围流动性模式
3. 隐藏价格区间选择 UI
4. 新建池子时需要用户输入初始价格
5. 支持所有 V3 费率等级 (0.01%, 0.05%, 0.3%, 1%)
6. **默认费率等级：0.3%（最常用，适合主流代币对）**
7. **链上交易构建**：对于 HashKey Chain，不使用 Trading API，直接在链上构建交易
   - 使用 `NonfungiblePositionManager.multicall` 方法
   - 包含 `createAndInitializePoolIfNecessary` 和 `mint` 两个步骤

### 关键技术说明

#### 1. SDK 使用情况（重要 - 必读）

⚠️ **关键信息**：本项目**正在迁移**到 HashKey 自定义 SDK

**当前状态**：
- **目标 SDK**：`@hkdex-tmp/universal_router_sdk` (1.0.3) - HashKey 团队维护的自定义 SDK
- **当前状态**：部分功能还在使用官方 SDK，**正在逐步替换中**
- **原因**：官方 SDK 不支持 HashKey Chain，需要使用自定义版本

**已安装的 SDK 包**：

**🔴 HashKey 自定义 SDK（核心 - 必须使用）：**
- **@hkdex-tmp/universal_router_sdk**: 1.0.3
- **用途**：应该用于**所有功能**（Swap、流动性添加、路由、价格计算等）
- **优先级**：⭐⭐⭐⭐⭐ **最高优先级**
- **原因**：
  - HashKey 团队专门为 HashKey Chain 定制和维护
  - 包含 HashKey Chain 的所有合约地址
  - 已修复官方 SDK 在 HashKey Chain 上的兼容性问题
  - 针对 HashKey Chain 的特殊需求优化

**官方 Uniswap SDK（临时使用 - 计划替换）：**
- **@uniswap/sdk-core**: 7.9.0 - 核心类型（Token、Currency）
- **@uniswap/v3-sdk**: 3.25.2 - V3 逻辑（Pool、Position、Tick）
- **@uniswap/v2-sdk**: 4.15.2
- **@uniswap/v4-sdk**: 1.21.2
- **@uniswap/router-sdk**: 2.0.2 - V3SwapRouter
- **状态**：部分功能还在使用，**正在逐步替换为 @hkdex-tmp/universal_router_sdk**

**当前迁移状态**：
| 功能 | 当前使用的 SDK | 目标 SDK | 状态 | 说明 |
|------|--------------|---------|------|------|
| Swap 交易 | `@hkdex-tmp/universal_router_sdk` | `@hkdex-tmp/universal_router_sdk` | ✅ 已完成 | - |
| V3 流动性添加 | `@uniswap/v3-sdk` | `@hkdex-tmp/universal_router_sdk` | ⏳ 待迁移 | 还没来得及更换 |
| Pool 计算 | `@uniswap/v3-sdk` | `@hkdex-tmp/universal_router_sdk` | ⏳ 待迁移 | 还没来得及更换 |
| 价格计算 | `@uniswap/v3-sdk` | `@hkdex-tmp/universal_router_sdk` | ⏳ 待迁移 | 还没来得及更换 |
| 合约地址 | 手动配置 `v3Addresses.ts` | `@hkdex-tmp/universal_router_sdk` | ⏳ 待迁移 | 还没来得及更换 |

**🔴 核心开发原则（必须遵守）**：

**规则 1：遇到问题时，第一反应是检查 `@hkdex-tmp/universal_router_sdk`**
- 官方 SDK 报错？→ 检查 `@hkdex-tmp/universal_router_sdk`
- 缺少合约地址？→ 检查 `@hkdex-tmp/universal_router_sdk`
- 功能不支持？→ 检查 `@hkdex-tmp/universal_router_sdk`
- 计算结果异常？→ 检查 `@hkdex-tmp/universal_router_sdk`

**规则 2：SDK 选择优先级**
```
1️⃣ @hkdex-tmp/universal_router_sdk (1.0.3) ⭐ 最高优先级
   ↓ 如果确认该 SDK 没有所需功能
2️⃣ 官方 @uniswap/*-sdk（临时方案）
   ↓ 如果都不行
3️⃣ 自行实现
```

**规则 3：不要假设官方 SDK 可用**
- ❌ 错误：直接使用 `@uniswap/v3-sdk` 认为它支持 HashKey Chain
- ✅ 正确：先检查 `@hkdex-tmp/universal_router_sdk` 是否有对应功能

**当前项目状态**：
- ✅ `@hkdex-tmp/universal_router_sdk` 已安装在项目中
- ⏳ 正在逐步迁移，还有很多功能使用官方 SDK
- 📝 本次流动性添加实现使用了官方 SDK（临时方案，后续需迁移）

#### 2. HashKey Chain V3 合约部署

HashKey Chain 上部署了**自己的 Uniswap V3 合约克隆**，合约地址与官方 Ethereum 部署不同：

**Testnet (Chain ID: 133) 和 Mainnet (Chain ID: 177) 合约地址：**
- **V3 Factory**: `0x2dC2c21D1049F786C535bF9d45F999dB5474f3A0`
- **NonfungiblePositionManager**: `0x3c8816a838966b8b0927546A1630113F612B1553` ⭐ **核心合约**
- **SwapRouter02**: `0x46cBccE3c74E95d1761435d52B0b9Abc9e2FEAC0`
- **QuoterV2**: `0x9576241e23629cF8ad3d8ad7b12993935b24fA9d`
- **Multicall2**: `0x47F625Ec29637445AA1570d7008Cf78692CdA096`
- **TickLens**: `0x73942976823088508a2C6c8055DF71107DB1d8db`
- **V3Migrator**: `0x0bb37eD33c163c46DEef0F6D14d262D0bc57B130`
- **V3Staker**: `0xF5A3fD7A48c574cB07fE79f679bb4DcC6EcA1205`
- **NFT Descriptor Library**: `0x04618B09C4bfa69768D07bA7479c19F40Aed06Ac`
- **NFT Descriptor**: `0x6EF5d83eC912C12F1b1c5ACBD6C565120aB6EC5c`
- **Descriptor Proxy**: `0x47438E3ee7B305fC7fd0e2cC3633002e65fFeaec`

**说明**：
- 这些合约是 Uniswap V3 的标准部署克隆，但地址不同于官方 Ethereum 部署
- 使用官方 SDK (@uniswap/v3-sdk) 可以与这些合约交互
- **需要在代码中手动配置这些地址**（官方 SDK 默认不包含 HashKey Chain）
- 配置位置：`packages/uniswap/src/constants/v3Addresses.ts`
- 如果官方 SDK 不支持某些功能，检查 `@hkdex-tmp/universal_router_sdk` 是否提供

#### 3. 后端 API 支持情况

**关键问题**：Uniswap 官方后端不支持 HashKey Chain

**表现**：
- `backendSupported: false` (在 chainInfo 配置中)
- REST API 查询池子信息返回 **404 错误**
- GraphQL API 不认识 HashKey Chain
- Trading API 不支持 HashKey Chain 的报价

**影响范围**：
1. **池子查询**：`useGetPoolsByTokens` 返回 404
2. **价格数据**：无法获取历史价格和图表数据
3. **TVL 数据**：无法显示池子的总锁仓量
4. **交易路由**：Trading API 无法提供最优路由

**解决方案**：
- ✅ 使用本地 SDK 直接计算（不依赖后端）
- ✅ 检测 `backendSupported: false` 时，自动启用"创建新池子"模式
- ✅ 使用链上 RPC 调用代替后端 API
- ⚠️ 缺少图表和历史数据（可接受的降级体验）

**🔴 重要：自定义网关地址配置**

本项目使用**自定义的 Uniswap Gateway DNS 地址**，而非官方默认地址：

**环境变量配置**：
- **变量名**：`REACT_APP_UNISWAP_GATEWAY_DNS`
- **自定义地址**：`https://zy95c64c3c.execute-api.ap-southeast-1.amazonaws.com/prod/v2`
- **配置文件位置**：`apps/web/.env`

**⚠️ 关键说明**：
- 这是**HashKey 团队自定义部署的网关服务**，专门为 HashKey Chain 优化
- 与官方 Uniswap Gateway 不同，这是独立的 AWS API Gateway 部署
- 该地址用于前端与后端服务的通信，包括池子查询、价格数据等
- **不要使用官方默认地址**，必须使用此自定义地址
- 如果修改此地址，需要确保新的网关服务支持 HashKey Chain 的相关功能

**配置示例**：
```bash
# apps/web/.env
REACT_APP_UNISWAP_GATEWAY_DNS=https://zy95c64c3c.execute-api.ap-southeast-1.amazonaws.com/prod/v2
```

#### 4. 初始价格设置的关键问题

**问题现象**：
- 初始价格输入框没有显示
- 用户无法设置新池子的初始价格
- 导致数量计算异常（如 100 TT1 = 0.000000000000004799 WHSK）

**根本原因**：
```typescript
// useDerivedPositionInfo.tsx
const creatingPoolOrPair = poolDataIsFetched && !poolOrPair
```

**问题分析**：
- `poolDataIsFetched`: 依赖后端 API 查询完成
- 当后端返回 404 时，React Query 可能永远不会将 `isFetched` 设为 true
- 或者查询被禁用（`enabled: false`），导致 `poolDataIsFetched = false`
- 最终 `creatingPoolOrPair = false`，导致 `<InitialPriceInput />` 不显示

**问题定位**：
- 文件：`apps/web/src/components/Liquidity/Create/hooks/useDerivedPositionInfo.tsx`
- 第 299 行：`const creatingPoolOrPair = poolDataIsFetched && !poolOrPair`
- 当后端返回 404 时，`poolDataIsFetched` 可能为 `false`，导致 `creatingPoolOrPair = false`
- 结果：`<InitialPriceInput />` 组件不渲染

**需要修复**：
- ⚠️ **待确认正确的修复方案**
- 需要处理 HashKey Chain 后端不支持的情况
- 确保初始价格输入框能正确显示
- 修复时需要考虑：
  1. 如何检测后端不支持的情况
  2. 如何正确设置 `creatingPoolOrPair` 标志
  3. 不要破坏现有逻辑

#### 5. 当前实现的技术债务与后续优化

**⚠️ 重要提醒**：本次流动性添加功能使用了**临时技术方案**

**临时方案详情**：
- 使用官方 `@uniswap/v3-sdk` 进行 Pool 计算、价格计算、Tick 处理
- 使用官方 `@uniswap/sdk-core` 提供基础类型
- 手动配置 HashKey Chain 的 V3 合约地址（`v3Addresses.ts`）
- 手动处理后端不支持的情况（`backendSupported: false`）

**为什么使用临时方案**：
- ⏰ 时间紧急，还没来得及完全迁移到 `@hkdex-tmp/universal_router_sdk`
- ✅ 官方 SDK 的核心计算逻辑是通用的，可以工作
- ⚠️ 但需要手动配置很多 HashKey Chain 特定的参数

**技术债务清单**：
1. [ ] **初始价格输入框不显示**：需要修复 `creatingPoolOrPair` 逻辑
2. [ ] **合约地址配置**：应该从 `@hkdex-tmp/universal_router_sdk` 获取，而非手动配置
3. [ ] **Pool 计算逻辑**：检查自定义 SDK 是否有优化版本
4. [ ] **价格计算**：检查是否有 HashKey Chain 特定的处理
5. [ ] **后端 fallback**：自定义 SDK 可能已经处理了后端不支持的情况

**后续优化步骤**：
1. 检查 `@hkdex-tmp/universal_router_sdk` 的完整 API 和类型定义
2. 确认是否包含流动性相关的功能和合约地址
3. 逐步替换官方 SDK 的使用
4. 移除手动配置（如果 SDK 已包含）
5. 全面测试确保兼容性

**开发检查清单（每次实现新功能时）**：
- [ ] ⭐ 第一步：搜索 `@hkdex-tmp/universal_router_sdk` 的源码
- [ ] 检查该 SDK 的 TypeScript 类型定义和导出
- [ ] 如果没有所需功能，再考虑官方 SDK
- [ ] 记录选择的 SDK 和原因
- [ ] 标记是否为技术债务（需要后续优化）

## 实施细节

### 1. 代码修改文件

#### 1.1 `/apps/web/src/state/mint/v3/utils.ts`
添加全范围模式相关工具函数：
- `FULL_RANGE_TICKS`: 各费率等级的全范围 Tick 常量
- `getFullRangeConfig(feeTier)`: 获取特定费率的全范围配置
- `sortTokens(tokenA, tokenB)`: Token 地址排序
- `isFullRangeModeChain(chainId)`: 判断链是否需要强制全范围模式

#### 1.2 `/apps/web/src/components/Liquidity/Create/RangeSelectionStep.tsx`
修改价格区间选择组件：
- 检测 HashKey Chain，自动启用全范围模式
- 隐藏全范围/自定义范围切换控件
- 隐藏价格区间图表和输入框
- 保留初始价格输入（新建池子时）

### 2. 核心流程图解
在开始写代码前，请确保逻辑遵循以下数据流。这一步最容易出问题的就是 Token 排序 导致的 价格倒置。

```mermaid
graph TD
    Start[用户输入: Token A, Token B, 费率 Fee, 初始价格 P] --> Sort{地址排序 check};
    
    Sort -- Token A < Token B --> Normal[顺序正常: token0=A, token1=B];
    Sort -- Token A > Token B --> Flip[顺序颠倒: token0=B, token1=A];
    
    Normal --> CalcPrice[使用价格 P 计算 sqrtPriceX96];
    Flip --> CalcPriceInvert[使用 1/P 计算 sqrtPriceX96];
    
    CalcPrice --> Ticks[读取全范围 Ticks 常量];
    CalcPriceInvert --> Ticks;
    
    Ticks --> CalcAmount[根据 P 和 输入数量A, 自动计算数量B];
    
    CalcAmount --> Slippage[计算滑点 amountMin (例如 95%)];
    
    Slippage --> Construct[构造 Multicall 数据];
    Construct --> Tx[发送交易 -> PositionManager];
```
2. 关键数据准备 (Step-by-Step)
2.1 Token 排序 (最重要)
Uniswap V3 强制要求 token0 地址必须小于 token1。

TypeScript
const isTokenA0 = tokenA.address.toLowerCase() < tokenB.address.toLowerCase();
const token0 = isTokenA0 ? tokenA : tokenB;
const token1 = isTokenA0 ? tokenB : tokenA;

// 价格处理
const realPrice = isTokenA0 ? userInputPrice : (1 / userInputPrice);
2.2 获取全范围 Ticks (Hardcoded)
不要在运行时动态计算，直接使用根据 tickSpacing 预计算好的“最大整数倍对齐值”，防止 Revert。

费率 (Fee Tier)	Spacing	Min Tick (tickLower)	Max Tick (tickUpper)
0.01% (100)	1	-887272	887272
0.05% (500)	10	-887270	887270
0.3% (3000)	60	-887220	887220
1% (10000)	200	-887200	887200
2.3 初始价格编码
使用 SDK 将人类可读的价格转换为链上格式。

TypeScript
import { encodeSqrtRatioX96 } from '@uniswap/v3-sdk';

// 注意：这里需要处理 Decimals 精度差
// 建议使用 SDK 的 Price 对象或 JSBI 进行预处理
const sqrtPriceX96 = encodeSqrtRatioX96(amount1, amount0); 
3. 合约交互参数构建
我们需要向 NonfungiblePositionManager 发送一个 multicall 交易，包含两步：初始化池子 和 添加流动性。

步骤 A: createAndInitializePoolIfNecessary
如果池子已存在，此步骤会自动跳过（不消耗 Gas），但这保证了你的交易总是安全的。

token0: token0.address

token1: token1.address

fee: 3000 (对应 0.3%)

sqrtPriceX96: (上一步计算的值)

步骤 B: mint (添加流动性)
token0: token0.address

token1: token1.address

fee: 3000

tickLower: (从 2.2 表格中获取的常量)

tickUpper: (从 2.2 表格中获取的常量)

amount0Desired: 用户输入的 token0 数量

amount1Desired: 用户输入的 token1 数量 (全范围模式下，必须两边都存)

amount0Min: amount0Desired * 0.95 (5% 滑点保护，新建池建议放宽一点)

amount1Min: amount1Desired * 0.95

recipient: 用户钱包地址

deadline: Math.floor(Date.now() / 1000) + 60 * 20

4. 调试与排错清单 (Debugging Checklist)
如果你的交易失败 (Revert) 或模拟执行报错，请按以下顺序检查：

🔴 错误 1: Transaction reverted: T / Tick
现象: 提示 Tick 无效或越界。

原因: 传入的 tickLower 或 tickUpper 不是 tickSpacing 的整数倍。

检查: 确认你是否正确读取了表格中的值。例如 0.3% 的池子，千万不要传 -887272，必须传 -887220。

🔴 错误 2: STF / TransferHelper: TRANSFER_FROM_FAILED
现象: 经典的转账失败。

原因: 用户没有授权 (Approve) 代币给 NonfungiblePositionManager。

检查:

检查 Allowance 是否足够。

如果是原生代币 (ETH/BNB)，需检查是否正确转换为了 WETH/WBNB (V3 Manager 只收 ERC20)。

检查用户钱包余额是否足够支付 amountDesired。

🔴 错误 3: 价格极其离谱 (如 1 ETH = 0.0005 USDC)
现象: 池子建成了，但价格是倒过来的。

原因: Token 没有排序。

检查: 打印 token0 和 token1 的地址。如果 token0 是 USDC (地址小) 而 token1 是 ETH (地址大)，你的价格计算公式必须是 1 / 2000 而不是 2000。

🔴 错误 4: Gas Estimation Failed (Gas 预估失败)
原因 A: 池子虽然没显示，但在链上可能已经被别人建了（且价格和你设定的偏差巨大）。

原因 B: amountMin 设置得太高。对于新建池，如果计算精度有微小误差，过高的 min 会导致交易失败。调试时可先设为 0 试试。

🔴 错误 5: Trading API does not support creating LP positions on HashKey Chain
现象: 提示 Trading API 不支持 HashKey Chain。

原因: HashKey Chain 不支持 Trading API，需要使用链上交易构建。

解决方案: 
- 代码已自动处理：对于 HashKey Chain，系统会自动在链上构建交易
- 使用 `NonfungiblePositionManager.multicall` 方法
- 包含 `createAndInitializePoolIfNecessary` 和 `mint` 两个步骤
- 确保协议版本是 V3（不是 V4）

🔴 错误 6: HashKey Chain only supports V3 protocol
现象: 提示 HashKey Chain 只支持 V3 协议。

原因: 尝试使用 V4 协议创建流动性，但 HashKey Chain 不支持 V4。

解决方案:
- 确保 `protocolVersion` 是 `ProtocolVersion.V3`
- 检查 `positionState.protocolVersion` 是否正确设置为 V3
- 移除所有 V4 相关的配置和代码

---

## 7. HashKey Chain 链上交易构建实现

### 7.1 概述

对于 HashKey Chain，由于 Trading API 不支持，我们直接在链上构建交易，而不是调用 Trading API。

### 7.2 实现位置

**核心文件：**
- `/packages/uniswap/src/features/transactions/liquidity/steps/increasePosition.ts`
  - `createCreatePositionAsyncStep` 函数
  - 检测 HashKey Chain
  - 构建链上交易

**调用位置：**
- `/apps/web/src/pages/CreatePosition/CreatePositionTxContext.tsx`
  - `generateCreatePositionTxRequest` 函数
  - 禁用 Trading API 查询
  - 传递 `createPositionRequestArgs` 给异步步骤

### 7.3 交易构建流程

1. **检测 HashKey Chain**
   ```typescript
   const chainId = createPositionRequestArgs.chainId as number
   const isHashKeyChain = chainId === UniverseChainId.HashKey || chainId === UniverseChainId.HashKeyTestnet
   ```

2. **验证协议版本**
   ```typescript
   const protocol = createPositionRequestArgs.protocol
   if (protocol !== TradingApi.ProtocolItems.V3) {
     throw new Error(`HashKey Chain only supports V3 protocol, got ${protocol}`)
   }
   ```

3. **获取 Position Manager 地址**
   ```typescript
   const positionManagerAddress = getV3PositionManagerAddress(chainId)
   ```

4. **构建 multicall 数据**
   ```typescript
   const multicallData: string[] = []
   
   // 步骤 1: 创建并初始化池子（如果需要）
   if (initialPrice) {
     multicallData.push(
       NFPMInterface.encodeFunctionData('createAndInitializePoolIfNecessary', [
         token0,
         token1,
         fee,
         initialPrice, // sqrtPriceX96
       ])
     )
   }
   
   // 步骤 2: 添加流动性
   multicallData.push(
     NFPMInterface.encodeFunctionData('mint', [
       {
         token0,
         token1,
         fee,
         tickLower,
         tickUpper,
         amount0Desired,
         amount1Desired,
         amount0Min,
         amount1Min,
         recipient: walletAddress,
         deadline,
       },
     ])
   )
   ```

5. **构建交易请求**
   ```typescript
   const txRequest: ValidatedTransactionRequest = {
     to: positionManagerAddress,
     data: NFPMInterface.encodeFunctionData('multicall', [multicallData]),
     value: '0x0',
     chainId,
   }
   ```

### 7.4 关键参数说明

- **token0, token1**: 代币地址（已排序，token0 < token1）
- **fee**: 费率等级（如 500 表示 0.05%，3000 表示 0.3%）
- **initialPrice**: 初始价格（sqrtPriceX96 格式），仅在创建新池子时需要
- **tickLower, tickUpper**: 价格区间（全范围模式下使用预定义的常量值）
- **amount0Desired, amount1Desired**: 期望的代币数量
- **amount0Min, amount1Min**: 最小代币数量（考虑滑点保护）
- **recipient**: 接收 NFT 的地址（用户钱包地址）
- **deadline**: 交易截止时间（Unix 时间戳，通常设置为当前时间 + 20 分钟）

### 7.5 与 Trading API 的区别

| 特性 | Trading API | HashKey Chain 链上构建 |
|------|------------|----------------------|
| 协议支持 | V2, V3, V4 | 仅 V3 |
| 交易构建 | 后端 API | 前端链上构建 |
| 依赖 | Trading API 服务 | 仅需链上合约 |
| 授权检查 | Trading API | 链上检查（`useOnChainLpApproval`）|
| 错误处理 | API 错误消息 | 链上交易错误 |

5. 工具函数 (Utils)
复制此代码块到你的项目中：

TypeScript
import { FeeAmount } from '@uniswap/v3-sdk'

// 全范围 Tick 常量表
export const FULL_RANGE_TICKS = {
  [FeeAmount.LOWEST]: { min: -887272, max: 887272 },   // 0.01%
  [FeeAmount.LOW]:    { min: -887270, max: 887270 },   // 0.05%
  [FeeAmount.MEDIUM]: { min: -887220, max: 887220 },   // 0.3%
  [FeeAmount.HIGH]:   { min: -887200, max: 887200 },   // 1%
}

/**
 * 获取全范围配置
 * @param feeTier 费率枚举值 (e.g. 3000)
 */
export function getFullRangeConfig(feeTier: FeeAmount) {
    const config = FULL_RANGE_TICKS[feeTier];
    if (!config) {
        throw new Error(`Unsupported fee tier: ${feeTier}`);
    }
    return config;
}

/**
 * 简单的 Token 排序检查
 */
export function sortTokens(tokenA: string, tokenB: string) {
    return tokenA.toLowerCase() < tokenB.toLowerCase() 
        ? [tokenA, tokenB] 
        : [tokenB, tokenA];
}

6. 实施完成说明

本 PRD 已完成代码实施，具体修改如下：

6.1 修改的文件

**核心功能文件：**

1. `/apps/web/src/state/mint/v3/utils.ts`
   - ✅ 添加 FULL_RANGE_TICKS 常量（支持所有费率等级）
   - ✅ 添加 getFullRangeConfig() 工具函数
   - ✅ 添加 sortTokens() Token 地址排序函数
   - ✅ 添加 isFullRangeModeChain() 检测 HashKey Chain 的函数

2. `/apps/web/src/components/Liquidity/Create/RangeSelectionStep.tsx`
   - ✅ 检测当前链是否为 HashKey Chain (ID: 133 或 177)
   - ✅ 自动强制启用全范围模式（设置 fullRange: true）
   - ✅ 隐藏"Set Range"标题和说明
   - ✅ 隐藏全范围/自定义范围切换控件（SegmentedControl）
   - ✅ 隐藏价格区间图表（LiquidityRangeInput / D3LiquidityRangeInput）
   - ✅ 隐藏价格区间输入框（RangeAmountInput）
   - ✅ 保留初始价格输入（新建池子时必需）

3. `/apps/web/src/components/Liquidity/Create/hooks/useLiquidityUrlState.ts`
   - ✅ 修改 `currencyA` parser 的默认值
   - ✅ 从空字符串 `''` 改为 `NATIVE_CHAIN_ID`
   - ✅ 当用户访问 `/positions/create/v3` 时
   - ✅ URL 自动添加 `?currencyA=NATIVE`
   - ✅ HSK 自动被选中为 Token A

4. `/apps/web/src/pages/CreatePosition/CreatePosition.tsx`
   - ✅ 添加 fallback 逻辑确保 tokenA 有值
   - ✅ 使用 `initialInputs.tokenA ?? initialInputs.defaultInitialToken`
   - ✅ 监听 initialInputs 变化并更新 currencyInputs
   - ✅ 确保 HSK 始终作为默认 Token A 显示

**默认链配置文件：**

5. `/packages/uniswap/src/features/chains/utils.ts`
   - ✅ 修改 `getDefaultChainId()` 函数
   - ✅ 测试模式默认链：HashKeyTestnet (133)
   - ✅ 正式模式默认链：HashKey (177)
   - ✅ 不再使用 Ethereum 或 Sepolia 作为默认链

**Token 配置文件：**

6. `/packages/uniswap/src/constants/tokens.ts`
   - ✅ 添加 HashKey Chain 和 HashKey Testnet 的导入
   - ✅ 在 `WRAPPED_NATIVE_CURRENCY` 中添加 WHSK 配置
   - ✅ HashKey Mainnet (177): WHSK at `0xCA8aAceEC5Db1e91B9Ed3a344bA026c4a2B3ebF6`
   - ✅ HashKey Testnet (133): WHSK at `0xCA8aAceEC5Db1e91B9Ed3a344bA026c4a2B3ebF6`
   - ✅ 解决 "Unsupported chain ID" 错误

7. `/apps/web/src/components/Liquidity/Create/types.ts` & `useLiquidityUrlState.ts`
   - ✅ **设置默认费率等级为 0.3%（MEDIUM）**
   - ✅ 修改 `DEFAULT_POSITION_STATE.fee` 从 `undefined` 为 `DEFAULT_FEE_DATA`
   - ✅ 在 `useLiquidityUrlState` 中返回 `fee ?? DEFAULT_FEE_DATA`
   - ✅ 提升用户体验：用户无需手动选择费率即可继续
   - ✅ 0.3% 是 Uniswap V3 最常用的费率，适合大多数代币对

8. `/packages/uniswap/src/features/chains/evm/info/hashkey.ts`
   - ✅ **禁用 V4 支持**：设置 `supportsV4: false`
   - ✅ HashKey Chain 仅支持 V3，不支持 V4
   - ✅ Mainnet 和 Testnet 都已更新

9. `/apps/web/src/components/Liquidity/DepositInputForm.tsx`
   - ✅ **修复自定义代币显示问题**
   - ✅ 手动构造 `CurrencyInfo` 对象，不依赖后端 API
   - ✅ 使用 `currencyId()` 函数正确处理代币地址
   - ✅ 解决 "Select token" 按钮问题

10. `/apps/web/src/components/Liquidity/utils/getPoolIdOrAddressFromCreatePositionInfo.ts`
    - ✅ **添加防御性检查**
    - ✅ 当 Factory 地址未配置时返回 undefined
    - ✅ 避免创建新池子时的地址错误
    - ✅ 使用 `getV3FactoryAddress()` 支持自定义链

11. `/packages/uniswap/src/constants/v3Addresses.ts` **(新文件)**
    - ✅ **配置 HashKey Chain 的 V3 合约地址**
    - ✅ V3 Factory: `0x2dC2c21D1049F786C535bF9d45F999dB5474f3A0`
    - ✅ NonfungiblePositionManager: `0x3c8816a838966b8b0927546A1630113F612B1553`
    - ✅ SwapRouter02: `0x46cBccE3c74E95d1761435d52B0b9Abc9e2FEAC0`
    - ✅ QuoterV2: `0x9576241e23629cF8ad3d8ad7b12993935b24fA9d`
    - ✅ Multicall2: `0x47F625Ec29637445AA1570d7008Cf78692CdA096`
    - ✅ 支持 Mainnet (177) 和 Testnet (133)

12. `/apps/web/src/pages/CreatePosition/CreatePositionTxContext.tsx`
    - ✅ **修复 V3/V4 hooks 字段问题**
    - ✅ 仅在 V4 时添加 hooks 字段
    - ✅ V3 不支持 hooks，移除该字段避免 API 错误
    - ✅ 添加 fee 必填验证，确保不会传递 undefined
    - ✅ **移除 V4 支持**：HashKey Chain 仅支持 V3，所有 V4 相关代码已移除
    - ✅ **过滤 V4Pool**：从 `poolOrPair` 中过滤掉 V4Pool，只保留 V3Pool 或 Pair
    - ✅ **禁用 Trading API 查询**：对于 HashKey Chain，禁用 `useCreateLpPositionCalldataQuery`
    - ✅ **支持链上交易构建**：当 `txRequest` 为 undefined 时，使用异步步骤在链上构建交易

13. `/packages/uniswap/src/features/transactions/liquidity/steps/increasePosition.ts`
    - ✅ **添加 HashKey Chain 链上交易构建支持**
    - ✅ 检测 HashKey Chain，如果检测到则构建链上交易而非调用 Trading API
    - ✅ **仅支持 V3 协议**：如果协议不是 V3，抛出错误
    - ✅ 使用 `NonfungiblePositionManager.multicall` 构建交易
    - ✅ 包含 `createAndInitializePoolIfNecessary`（如果需要创建池子）
    - ✅ 包含 `mint`（添加流动性）
    - ✅ 正确处理 `amount0Desired`、`amount1Desired`、`amount0Min`、`amount1Min`
    - ✅ 计算 deadline（20 分钟）

14. `/apps/web/src/components/Liquidity/Create/types.ts`
    - ✅ **修改默认协议版本**：从 V4 改为 V3
    - ✅ 确保 HashKey Chain 默认使用 V3
    - ✅ 与链配置保持一致（HashKey Chain 不支持 V4）

15. `/packages/uniswap/src/features/transactions/liquidity/utils.ts`
    - ✅ **修复错误消息显示问题**
    - ✅ 修复 "id: undefined" 错误消息
    - ✅ 只有当 `requestId` 存在时才在错误消息中包含 id

**实现方式说明：**

本实现采用**修改默认链配置**的方式，而非修改各个页面的链接。这样做的好处：
- ✅ 保持原有的链接形式（`/positions/create/v3`）
- ✅ 所有入口点自动生效，无需逐一修改
- ✅ URL 参数自动带上 HashKey Chain 相关信息
- ✅ 符合系统架构设计，集中管理默认配置

6.2 用户体验

在 HashKey Chain 上添加 V3 流动性时：
1. ✅ 用户选择 Token A 和 Token B（默认 Token A 为 HSK 原生代币）
2. ✅ 用户选择费率等级（**默认为 0.3%**，也可选择 0.01%, 0.05%, 1%）
3. ✅ 如果是新建池子，用户需要输入初始价格
4. ✅ 系统自动使用全范围模式，无需用户选择价格区间
5. ✅ 用户输入存款数量
6. ✅ 确认并提交交易

6.3 技术要点

- 全范围 Tick 值已预先计算并硬编码，避免运行时计算错误
- Token 自动按地址排序，确保 token0 < token1
- 初始价格会根据 Token 排序自动调整（必要时取倒数）
- **HashKey Chain 仅支持 V3 协议**，不支持 V4
- **链上交易构建**：对于 HashKey Chain，不使用 Trading API，直接在链上构建交易
  - 使用 `NonfungiblePositionManager.multicall` 方法
  - 包含 `createAndInitializePoolIfNecessary`（如果需要创建池子）和 `mint`（添加流动性）两个步骤
  - 正确处理滑点保护（slippage tolerance）
  - 自动计算 deadline（20 分钟）
- **默认费率等级为 0.3%**，这是 Uniswap V3 中最常用且最平衡的费率选择
- 用户仍可手动选择其他费率等级（0.01%, 0.05%, 1%），保留灵活性
- **链上授权检查**：使用 `useOnChainLpApproval` hook 进行链上授权检查，不依赖 Trading API

6.4 环境配置与默认链设置

**测试/开发环境：**
- 默认链：HashKey Testnet (Chain ID: 133)
- Testnet Mode 开启

**生产环境：**
- 默认链：HashKey Mainnet (Chain ID: 177)
- Testnet Mode 关闭

**其他链：**
- 不受影响，保持原有的价格区间选择功能
- 用户可以手动切换到其他链

---

6.5 默认链配置实现

**核心修改：**

在 `/packages/uniswap/src/features/chains/utils.ts` 中修改 `getDefaultChainId()` 函数：

```typescript
function getDefaultChainId({
  platform,
  isTestnetModeEnabled,
}: {
  platform?: Platform
  isTestnetModeEnabled: boolean
}): UniverseChainId {
  if (platform === Platform.SVM) {
    return UniverseChainId.Solana
  }

  // 默认使用 HashKey Chain
  // 开发/测试环境：HashKey Testnet (133)
  // 生产环境：HashKey Mainnet (177)
  return isTestnetModeEnabled ? UniverseChainId.HashKeyTestnet : UniverseChainId.HashKey
}
```

**生效范围：**

所有使用 `useEnabledChains()` hook 的地方都会自动使用 HashKey Chain 作为默认链：
1. ✅ 导航栏 "Pool > Create Position" (`/positions/create/v3`)
2. ✅ Positions 页面的 "New" 按钮
3. ✅ 空状态页面的 "New Position" 按钮
4. ✅ 所有其他创建流动性的入口
5. ✅ URL 自动生成正确的 chain 参数
6. ✅ 默认选择 HSK 原生代币

**URL 效果：**

用户访问 `/positions/create/v3` 时：
- 测试环境自动应用：`chain=hashkey_testnet`, `currencyA=NATIVE`
- 生产环境自动应用：`chain=hashkey`, `currencyA=NATIVE`

**环境切换方式：**

通过应用的 Testnet Mode 开关控制：
- Testnet Mode ON → HashKey Testnet (133)
- Testnet Mode OFF → HashKey Mainnet (177)