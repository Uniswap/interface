# LP scenarios — Increase

Add liquidity to existing positions. Shared defaults: `_defaults.yaml`.

---
id: lp-increase-v4-happy-path
title: Increase liquidity on existing V4 position
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
testlioRef: LP - Existing Pool
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
  - increase
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/IncreaseLiquidity/
  - packages/uniswap/src/features/transactions/liquidity/
automationRefs:
  - path: apps/web/src/pages/IncreaseLiquidity/IncreaseLiquidity.anvil.e2e.test.ts
    testName: Increase liquidity > should increase liquidity of a position
---

> **urgent · v4 · e2e · scheduled · automated** · chains: ethereum, unichain, base

**Given** the user has an existing V4 position and navigates to its detail page
**When** they click "Add liquidity", enter an amount, click "Review", then "Confirm"
**Then** the position's liquidity increases and "Approved" confirmation appears

---
id: lp-increase-v4-approval
title: Approve and increase liquidity on V4 position
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
  - increase
  - approval
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/IncreaseLiquidity/
  - packages/uniswap/src/data/apiClients/liquidityService/
automationRefs:
  - path: apps/web/src/pages/IncreaseLiquidity/IncreaseLiquidity.anvil.e2e.test.ts
    testName: approval flow > should approve and increase liquidity on a V4 position
---

> **urgent · v4 · e2e · scheduled · automated** · chains: ethereum, unichain, base

**Given** the user's tokens require approval before increasing a V4 position
**When** they submit the increase transaction
**Then** the approval step completes and "Approved" is shown

---
id: lp-increase-v3-approval
title: Approve and increase liquidity on V3 position
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
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
  - increase
  - approval
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/IncreaseLiquidity/
  - packages/uniswap/src/data/apiClients/liquidityService/
automationRefs:
  - path: apps/web/src/pages/IncreaseLiquidity/IncreaseLiquidity.anvil.e2e.test.ts
    testName: approval flow > should approve and increase liquidity on a V3 position
---

> **urgent · v3 · e2e · scheduled · automated** · chains: ethereum, unichain, base

**Given** the user has an existing V3 position at `/positions/v3/ethereum/<tokenId>`
**When** they click "Add liquidity", enter an amount, review and confirm
**Then** the approval completes and "Approved" is shown

---
id: lp-increase-permit2-already-set
title: Skip permit2 approval on increase when allowance already set
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
  - increase
  - approval
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/IncreaseLiquidity/
  - packages/uniswap/src/data/apiClients/liquidityService/
automationRefs:
  - path: apps/web/src/pages/IncreaseLiquidity/IncreaseLiquidity.anvil.e2e.test.ts
    testName: approval flow > should skip permit2 approval when allowance already set
---

> **high · v4 · e2e · scheduled · automated** · chains: ethereum, unichain, base

**Given** the user's token already has permit2 allowance set
**When** they increase liquidity on a V4 position
**Then** "Approval required" and "Signature required" are NOT shown, and the increase proceeds directly

---
id: lp-increase-error-recovery
title: Graceful error handling during increase liquidity review
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
  - increase
  - error-handling
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/IncreaseLiquidity/
automationRefs:
  - path: apps/web/src/pages/IncreaseLiquidity/IncreaseLiquidity.anvil.e2e.test.ts
    testName: error handling > should gracefully handle errors during review
---

> **high · v4 · e2e · scheduled · automated** · chains: ethereum, unichain, base

**Given** the increase liquidity API returns an error after the user confirms
**When** "Something went wrong" / "Request failed" appears
**Then** editing the amount clears the error and the "Review" button becomes available again

---
id: lp-increase-v2-add-back
title: Add liquidity back to V2 position after partial removal
# importance
priority: high
severity: high
# provenance
source: testlio
testlioRef: Add LP
# scope
protocol_version: v2
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - increase
  - legacy
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/AddLiquidity/
  - apps/web/src/pages/IncreaseLiquidity/
automationRefs: []
---

> **high · v2 · e2e · release · gap** · chains: ethereum

**Given** a V2 position has had liquidity partially removed
**When** the user navigates to add liquidity and deposits tokens back
**Then** the LP token balance increases and the position reflects the added liquidity

---
id: lp-increase-native-eth
title: Increase position with native ETH (wrap to WETH)
# importance
priority: urgent
severity: urgent
# provenance
source: uniswap
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
  - increase
  - native-eth
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/IncreaseLiquidity/
  - apps/web/src/features/Liquidity/Create/
automationRefs: []
---

> **urgent · v4 · e2e · release · gap** · chains: ethereum, unichain, base

**Given** the user has an ETH/USDT position and selects native ETH as the deposit token
**When** they enter an amount and confirm the increase
**Then** the ETH is wrapped to WETH during the transaction and the position liquidity increases correctly

---
id: lp-increase-insufficient-balance
title: Increase blocked when balance is insufficient
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
  - increase
  - validation
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/pages/IncreaseLiquidity/
  - apps/web/src/features/Liquidity/Create/hooks/useDepositInfo.*
automationRefs: []
---

> **high · all · unit · pr-check · gap** · chains: ethereum, unichain, base

**Given** the user has less token balance than the entered deposit amount
**When** they try to proceed
**Then** the "Review" button is disabled with an "Insufficient balance" message

---
id: lp-increase-tx-context
title: IncreaseLiquidityTxContext produces correct tx request
# importance
priority: urgent
severity: urgent
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
  - shared
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/pages/IncreaseLiquidity/IncreaseLiquidityTxContext.*
automationRefs: []
---

> **urgent · all · unit · pr-check · gap** · chains: ethereum, unichain, base

**Given** the user has filled in increase liquidity inputs on an existing position
**When** the TxContext processes the inputs
**Then** it returns correct gas estimates, approval/permit data, and a valid increase calldata
