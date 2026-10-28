# LP scenarios — Create

New positions (V2/V3/V4). Shared defaults: `_defaults.yaml`.

---
id: lp-create-v4-full-range
title: Create V4 position with full range
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
testlioRef: LP - New Pool
# scope
protocol_version: v4
chains:
  - ethereum
  - unichain
  - base
platforms:
  - web
labels:
  - regression
  - smoke
  - create
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/CreatePosition/
  - apps/web/src/features/Liquidity/Create/
  - packages/uniswap/src/features/transactions/liquidity/
automationRefs:
  - path: apps/web/src/pages/CreatePosition/CreatePosition.anvil.e2e.test.ts
    testName: Create position > Create position with full range
  - path: apps/web/src/pages/CreatePosition/CreatePositionTxContext.test.ts
    testName: generateCreatePositionTxRequest
---

> **urgent · v4 · e2e · scheduled · automated** · chains: ethereum, unichain, base

**Given** the user is on `/positions/create` with a token pair selected (e.g., ETH/USDT)
**And** has sufficient balance for both tokens
**When** they click "Full range", enter a deposit amount, click "Review", then "Create"
**Then** the position is created on-chain, the success message "Created position" appears, and the user is redirected to `/positions`

---
id: lp-create-v4-custom-range
title: Create V4 position with custom price range
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
# scope
protocol_version: v4
chains:
  - ethereum
  - unichain
  - base
platforms:
  - web
labels:
  - regression
  - create
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/CreatePosition/
  - apps/web/src/features/Liquidity/Create/
automationRefs:
  - path: apps/web/src/pages/CreatePosition/CreatePosition.anvil.e2e.test.ts
    testName: Create position > Create position with custom range
---

> **urgent · v4 · e2e · scheduled · automated** · chains: ethereum, unichain, base

**Given** the user is on `/positions/create` with a token pair selected
**When** they adjust the price range using increment/decrement controls, enter a deposit amount, and submit
**Then** the position is created with the specified custom range and appears in the positions list

---
id: lp-create-v3-position
title: Create V3 position (full and custom range)
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
testlioRef: V3 LP - Liquidity Position
# scope
protocol_version: v3
chains:
  - ethereum
  - unichain
  - base
platforms:
  - web
labels:
  - regression
  - create
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/CreatePosition/
  - apps/web/src/features/Liquidity/Create/
automationRefs: []
---

> **urgent · v3 · e2e · release · manual** · chains: ethereum, unichain, base

**Given** the user is on the create position page with V3 selected
**And** has selected a token pair and fee tier
**When** they set a full range or custom range, enter deposit amounts, and submit
**Then** the V3 position is created, the NFT is minted, and the position appears in portfolio

---
id: lp-create-v2-position
title: Create V2 liquidity position
# importance
priority: high
severity: high
# provenance
source: existing-e2e
# scope
protocol_version: v2
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - create
  - legacy
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/CreatePosition/
  - apps/web/src/pages/AddLiquidity/
automationRefs:
  - path: apps/web/src/pages/CreatePosition/CreatePosition.anvil.e2e.test.ts
    testName: v2 zero liquidity > should create a position
---

> **high · v2 · e2e · release · automated** · chains: ethereum

**Given** the user navigates to V2 create position for WETH/USDT
**When** they enter amounts for both tokens and submit
**Then** LP tokens are minted and the V2 position appears in their portfolio

---
id: lp-create-v2-zero-liquidity
title: Create V2 position in pool with zero liquidity
# importance
priority: high
severity: urgent
# provenance
source: existing-e2e
# scope
protocol_version: v2
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - create
  - edge-case
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/CreatePosition/
automationRefs:
  - path: apps/web/src/pages/CreatePosition/CreatePosition.anvil.e2e.test.ts
    testName: v2 zero liquidity > should create a position
---

> **high · v2 · e2e · release · automated** · chains: ethereum

**Given** the user selects a V2 token pair where the pool exists but has zero reserves
**When** they set amounts for both tokens (effectively setting initial price) and submit
**Then** the pool is initialized with the provided ratio and a position is created

---
id: lp-create-v2-no-pair
title: Create V2 pair when none exists
# importance
priority: high
severity: high
# provenance
source: existing-e2e
# scope
protocol_version: v2
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - create
  - edge-case
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/CreatePosition/
automationRefs:
  - path: apps/web/src/pages/CreatePosition/CreatePosition.anvil.e2e.test.ts
    testName: v2 no pair > should create a pair
---

> **high · v2 · e2e · release · automated** · chains: ethereum

**Given** the user selects two tokens that have no existing V2 pair
**When** they navigate to the create page
**Then** the UI shows "Creating new pool" and the "Continue" button advances to the deposit step

---
id: lp-create-new-pool-deploys
title: Creating new liquidity pool deploys and initializes
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
testlioRef: LP - New Pool
# scope
protocol_version: v4
chains:
  - ethereum
  - unichain
  - base
platforms:
  - web
labels:
  - regression
  - create
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/CreatePosition/
  - packages/uniswap/src/features/transactions/liquidity/
automationRefs:
  - path: apps/web/src/pages/CreatePosition/CreatePosition.anvil.e2e.test.ts
    testName: Create position with full range
---

> **urgent · v4 · e2e · release · automated** · chains: ethereum, unichain, base

**Given** a user selects two tokens that don't have an existing V4 liquidity pool
**When** they set an initial price, configure range, deposit amounts, and submit
**Then** the pool is deployed, initialized with the provided price, and the user receives a position

---
id: lp-create-custom-fee-tier
title: Create position with custom fee tier
# importance
priority: high
severity: high
# provenance
source: existing-e2e
# scope
protocol_version: v4
chains:
  - ethereum
  - unichain
platforms:
  - web
labels:
  - regression
  - create
  - fee-tier
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/CreatePosition/
  - apps/web/src/features/Liquidity/Create/
automationRefs:
  - path: apps/web/src/pages/CreatePosition/CreatePosition.anvil.e2e.test.ts
    testName: Custom fee tier > should create a position with a custom fee tier
---

> **high · v4 · e2e · release · automated** · chains: ethereum, unichain

**Given** the user is creating a new position and clicks "More" then "Create new fee tier"
**When** they enter a custom fee (e.g., 3.1415%) and proceed through the flow
**Then** a new pool with the custom fee tier is created, showing "New tier" and "Creating new pool" labels

---
id: lp-create-dynamic-fee-tier
title: Create position with dynamic fee tier and hook
# importance
priority: high
severity: high
# provenance
source: existing-e2e
# scope
protocol_version: v4
chains:
  - ethereum
  - unichain
platforms:
  - web
labels:
  - regression
  - create
  - hooks
  - fee-tier
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/CreatePosition/
  - apps/web/src/features/Liquidity/Create/
automationRefs:
  - path: apps/web/src/pages/CreatePosition/CreatePosition.anvil.e2e.test.ts
    testName: Custom fee tier > should create a position with a dynamic fee tier
---

> **high · v4 · e2e · release · automated** · chains: ethereum, unichain

**Given** the user navigates to create with a hook address pre-filled in the URL
**When** they select "Dynamic fee", acknowledge the speedbump, and continue through hook modal
**Then** the position is created with the dynamic fee tier and hook attached

---
id: lp-create-approval-v4
title: Token approval flow during V4 position creation
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
# scope
protocol_version: v4
chains:
  - ethereum
  - unichain
  - base
platforms:
  - web
labels:
  - regression
  - create
  - approval
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/CreatePosition/
  - packages/uniswap/src/data/apiClients/liquidityService/
automationRefs:
  - path: apps/web/src/pages/CreatePosition/CreatePosition.anvil.e2e.test.ts
    testName: approval flow > should approve tokens and create a V4 position
---

> **urgent · v4 · e2e · scheduled · automated** · chains: ethereum, unichain, base

**Given** the user has tokens that require permit2 approval before creating a V4 position
**When** they submit the create transaction
**Then** the approval step shows "Approval pending", followed by "Sign message", and finally "Created position"

---
id: lp-create-permit2-already-set
title: Skip permit2 approval when allowance already set
# importance
priority: high
severity: high
# provenance
source: existing-e2e
# scope
protocol_version: v4
chains:
  - ethereum
  - unichain
  - base
platforms:
  - web
labels:
  - regression
  - create
  - approval
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/CreatePosition/
  - packages/uniswap/src/data/apiClients/liquidityService/
automationRefs:
  - path: apps/web/src/pages/CreatePosition/CreatePosition.anvil.e2e.test.ts
    testName: approval flow > should handle approval when permit2 allowance is already set
---

> **high · v4 · e2e · scheduled · automated** · chains: ethereum, unichain, base

**Given** the user's token already has permit2 allowance set
**When** they create a position
**Then** "Approval required" and "Signature required" are NOT shown, and the position is created directly

---
id: lp-create-error-recovery
title: Graceful error handling during create position review
# importance
priority: high
severity: high
# provenance
source: existing-e2e
# scope
protocol_version: v4
chains:
  - ethereum
  - unichain
  - base
platforms:
  - web
labels:
  - regression
  - create
  - error-handling
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/CreatePosition/
automationRefs:
  - path: apps/web/src/pages/CreatePosition/CreatePosition.anvil.e2e.test.ts
    testName: error handling > should gracefully handle errors during review
---

> **high · v4 · e2e · scheduled · automated** · chains: ethereum, unichain, base

**Given** the create position API returns a simulation error
**When** the user enters an amount and sees "Something went wrong" / "Request failed"
**Then** editing the amount clears the error and the "Review" button becomes available again

---
id: lp-create-dynamic-slippage-low
title: Low slippage warning on correlated pair (e.g., ETH/WEETH)
# importance
priority: high
severity: medium
# provenance
source: existing-e2e
# scope
protocol_version: v4
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - create
  - slippage
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/CreatePosition/
  - apps/web/src/features/Liquidity/Create/hooks/useLPSlippageValues.*
automationRefs:
  - path: apps/web/src/pages/CreatePosition/CreatePosition.anvil.e2e.test.ts
    testName: Dynamic slippage > shows low slippage warning for ETH/WEETH pool
---

> **high · v4 · e2e · release · automated** · chains: ethereum

**Given** the user is creating a position on a correlated pair (ETH/WEETH) with dynamic slippage enabled
**When** the backend returns a low slippage value (e.g., 0.01%)
**Then** the UI shows "Slippage automatically reduced" message

---
id: lp-create-dynamic-slippage-high
title: Very high slippage warning with cancel recovery
# importance
priority: urgent
severity: high
# provenance
source: existing-e2e
# scope
protocol_version: v4
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - create
  - slippage
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/CreatePosition/
  - apps/web/src/features/Liquidity/Create/hooks/useLPSlippageValues.*
automationRefs:
  - path: apps/web/src/pages/CreatePosition/CreatePosition.anvil.e2e.test.ts
    testName: Dynamic slippage > shows very high slippage warning when backend returns extreme value
---

> **urgent · v4 · e2e · scheduled · automated** · chains: ethereum

**Given** the backend returns an extreme slippage value (e.g., 25%)
**When** the user clicks "Review"
**Then** a "Very high slippage" warning appears
**And** clicking "Cancel" dismisses the warning and returns to the review-ready state

---
id: lp-create-tx-context-v4
title: CreatePositionTxContext produces correct tx request for V4
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
# scope
protocol_version: v4
chains:
  - ethereum
  - unichain
  - base
platforms:
  - web
labels:
  - regression
  - shared
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/pages/CreatePosition/CreatePositionTxContext.*
automationRefs:
  - path: apps/web/src/pages/CreatePosition/CreatePositionTxContext.test.ts
    testName: generateCreatePositionTxRequest
---

> **urgent · v4 · unit · pr-check · automated** · chains: ethereum, unichain, base

**Given** the user has filled in all create position inputs (amounts, range, protocol, fee tier)
**When** `generateCreatePositionTxRequest` is called
**Then** it returns a valid tx request with correct calldata, gas info, and approval data for V4

---
id: lp-create-fot-token-warning
title: Fee-on-transfer token shows warning during create
# importance
priority: high
severity: high
# provenance
source: uniswap
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - create
  - fot
  - edge-case
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/features/Liquidity/utils/hasLPFoTTransferError.*
  - apps/web/src/pages/CreatePosition/
automationRefs: []
---

> **high · all · unit · pr-check · gap** · chains: ethereum

**Given** the user selects a fee-on-transfer (FoT) token for creating a position
**When** `hasLPFoTTransferError` detects the token
**Then** an appropriate warning is shown and the user is prevented from proceeding (or warned) depending on protocol version

---
id: lp-create-insufficient-gas
title: Create position blocked when gas is insufficient
# importance
priority: high
severity: medium
# provenance
source: uniswap
# scope
protocol_version: all
chains:
  - ethereum
  - unichain
  - base
platforms:
  - web
labels:
  - regression
  - create
  - validation
  - edge-case
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/CreatePosition/
  - apps/web/src/pages/IncreaseLiquidity/
  - apps/web/src/pages/RemoveLiquidity/
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: ethereum, unichain, base

**Given** the user has sufficient tokens but insufficient native token for gas
**When** they attempt to create, increase, or remove liquidity
**Then** the submit button is disabled with an appropriate "Insufficient ETH for gas" message
