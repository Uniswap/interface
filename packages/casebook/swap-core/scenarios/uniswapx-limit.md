# Swap scenarios — UniswapX & limit orders

UniswapX (off-chain signed) orders and the `limit`-labelled limit-order subset folded
into swap.core. Cancel/expiry correctness prevents stuck or duplicated orders. Wallet
aliases: see `TEST_WALLETS.md`. Shared defaults: `_defaults.yaml`.

---
id: swap-core-uniswapx-signed-order
title: UniswapX swap places and fills a signed order (WETH input)
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Swap/UniswapX.anvil.e2e.test.ts ("can swap using uniswapX
  with WETH as input"). No Testlio counterpart.
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - swap
  - uniswapx
wallets:
  - TW-SWAPCORE-04
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/review/
  - apps/web/src/state/sagas/transactions/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/UniswapX.anvil.e2e.test.ts
    testName: UniswapX > can swap using uniswapX with WETH as input
---

> **urgent · all · e2e · scheduled · automated** · chains: ethereum

**Given** wallet `TW-SWAPCORE-04` with WETH and UniswapX enabled
**When** the user confirms a UniswapX swap
**Then** an off-chain order is signed and submitted, the order fills, and balances update to reflect the trade

---
id: swap-core-uniswapx-cancel-pending
title: Pending UniswapX order can be cancelled
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Swap/UniswapX.anvil.e2e.test.ts ("cancels a pending
  uniswapx order"). A Testlio title "Cancel Tx UniswapX" was previously cited but is
  not in the blueprint's Testlio lists and could not be verified against the CSV, so
  it is omitted.
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - swap
  - uniswapx
  - cancel
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/review/
  - apps/web/src/state/sagas/transactions/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/UniswapX.anvil.e2e.test.ts
    testName: UniswapX > cancels a pending uniswapx order
---

> **urgent · all · e2e · scheduled · automated** · chains: ethereum

**Given** a pending (unfilled) UniswapX order exists
**When** the user cancels it
**Then** the order transitions to cancelled, no fill occurs afterward, and the user's funds are not spent

---
id: swap-core-uniswapx-order-expiry
title: Expired UniswapX order shows the error view
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Swap/UniswapX.anvil.e2e.test.ts ("renders error view if
  uniswapx order expires"). No Testlio counterpart.
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - swap
  - uniswapx
  - error-handling
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/review/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/UniswapX.anvil.e2e.test.ts
    testName: UniswapX > renders error view if uniswapx order expires
---

> **high · all · e2e · scheduled · automated** · chains: ethereum

**Given** a UniswapX order that is not filled before its deadline
**When** the order expires
**Then** the error view is rendered and the user is not charged for an unfilled order

---
id: swap-core-uniswapx-dedupe-orders
title: Remote and local UniswapX orders are de-duplicated
# importance
priority: high
severity: medium
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Swap/UniswapX.anvil.e2e.test.ts ("deduplicates remote vs
  local uniswapx orders"). No Testlio counterpart.
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - swap
  - uniswapx
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/review/
  - apps/web/src/state/sagas/transactions/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/UniswapX.anvil.e2e.test.ts
    testName: UniswapX > deduplicates remote vs local uniswapx orders
---

> **high · all · e2e · scheduled · automated** · chains: ethereum

**Given** the same UniswapX order is present both locally (optimistic) and from the remote activity feed
**When** the activity list renders
**Then** the order is shown once (de-duplicated), never as two separate entries

---
id: swap-core-limit-order-wrap-first-step
title: Limit order on native ETH wraps to WETH as its first step
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Limit/LimitWrap.anvil.e2e.test.ts ("wraps ETH to WETH as
  the first step of a limit order"). Also backed by Testlio "Limit Orders on Uniswap
  Web".
testlioRef: Limit Orders on Uniswap Web
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - swap
  - limit
wallets:
  - TW-SWAPCORE-04
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Swap/Limit/
  - packages/uniswap/src/features/transactions/swap/steps/
automationRefs:
  - path: apps/web/src/pages/Swap/Limit/LimitWrap.anvil.e2e.test.ts
    testName: Limit order WETH wrap > wraps ETH to WETH as the first step of a limit order
---

> **high · all · e2e · release · automated** · chains: ethereum

**Given** the user sets up a limit order with native ETH as input (UniswapX limits trade WETH, not native ETH)
**When** they confirm the limit order
**Then** a WETH wrap is executed as the first step, minting the WETH on-chain before the order is placed

---
id: swap-core-limit-order-token-approval
title: Limit order on an ERC20 input approves the token to Permit2 first
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Limit/LimitApprove.anvil.e2e.test.ts ("approves USDT to
  Permit2 as the first step of a limit order"). Also backed by Testlio "Limit Orders
  on Uniswap Web".
testlioRef: Limit Orders on Uniswap Web
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - swap
  - limit
  - approval
wallets:
  - TW-SWAPCORE-03
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Swap/Limit/
  - packages/uniswap/src/features/transactions/swap/steps/
automationRefs:
  - path: apps/web/src/pages/Swap/Limit/LimitApprove.anvil.e2e.test.ts
    testName: Limit order token approval > approves USDT to Permit2 as the first step of a limit order
---

> **high · all · e2e · release · automated** · chains: ethereum

**Given** the user sets up a limit order with an ERC20 input (USDT) that has no Permit2 approval
**When** they confirm the limit order
**Then** a one-time ERC20→Permit2 approval is executed as the first step before the order can be signed and placed

---
id: swap-core-limit-place-and-cancel
title: Limit order can be placed at a chosen price, appears in open orders, and can be cancelled
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  Testlio "Limit Orders on Uniswap Web". The core place/cancel journey has no e2e
  automation; components of it are unit-covered by
  apps/web/src/pages/Swap/Limit/OpenLimitOrdersButton.test.tsx,
  LimitExpirySection.test.tsx, LimitOrderDetails.test.tsx, and
  apps/web/src/components/AccountDrawer/MiniPortfolio/Activity/cancel/cancel.test.ts
  ("useCancelMultipleOrdersCallback").
testlioRef: Limit Orders on Uniswap Web
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - swap
  - limit
  - cancel
wallets:
  - TW-SWAPCORE-04
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Swap/Limit/
  - apps/web/src/components/AccountDrawer/MiniPortfolio/Activity/cancel/
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: ethereum

**Given** wallet `TW-SWAPCORE-04` holds WETH on the web app's Limit tab
**When** the user sets a limit price away from market, selects an expiry, places the order, opens the open-orders view, and then cancels the order
**Then** the order is signed and appears as open with the chosen price and expiry, the cancellation submits on-chain, the order transitions to cancelled without filling, and no funds beyond cancellation gas are spent
