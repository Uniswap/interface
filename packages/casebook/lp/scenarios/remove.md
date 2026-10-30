# LP scenarios — Remove

Decrease or close positions. Shared defaults: `_defaults.yaml`.

---
id: lp-remove-v4-decrease-50
title: Decrease 50% of V4 position liquidity
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
testlioRef: Remove LP
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
  - remove
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/RemoveLiquidity/
  - packages/uniswap/src/features/transactions/liquidity/
automationRefs:
  - path: apps/web/src/pages/RemoveLiquidity/RemoveLiquidity.anvil.e2e.test.ts
    testName: Remove liquidity > should decrease liquidity of a position
---

> **urgent · v4 · e2e · scheduled · automated** · chains: ethereum, unichain, base

**Given** the user has an active V4 position and navigates to its detail page
**When** they click "Remove liquidity", select 50%, click "Review", then "Confirm"
**Then** 50% of the liquidity is removed, the expected token amounts are shown (e.g., "1.000 USDT"), and the position remains with 50% liquidity

---
id: lp-remove-v4-25-percent
title: Decrease 25% of V4 position liquidity
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
testlioRef: Remove LP
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
  - remove
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/RemoveLiquidity/
automationRefs: []
---

> **urgent · v4 · e2e · release · gap** · chains: ethereum, unichain, base

**Given** the user has an active V4 position
**When** they remove 25% of the liquidity
**Then** 25% of the underlying tokens are returned to the wallet and the position retains 75% liquidity

---
id: lp-remove-v4-75-percent
title: Decrease 75% of V4 position liquidity
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
testlioRef: Remove LP
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
  - remove
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/RemoveLiquidity/
automationRefs: []
---

> **urgent · v4 · e2e · release · gap** · chains: ethereum, unichain, base

**Given** the user has an active V4 position
**When** they remove 75% of the liquidity
**Then** 75% of the underlying tokens are returned to the wallet and the position retains 25% liquidity

---
id: lp-remove-v4-max
title: Remove 100% (Max) of V4 position liquidity
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
testlioRef: Remove LP
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
  - remove
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/RemoveLiquidity/
automationRefs: []
---

> **urgent · v4 · e2e · release · gap** · chains: ethereum, unichain, base

**Given** the user has an active V4 position
**When** they select "Max" (100%) removal and confirm the transaction
**Then** all underlying tokens are returned to the wallet, the position is closed, and it moves to the "Closed" positions list

---
id: lp-remove-v3-position
title: Remove liquidity from V3 position
# importance
priority: urgent
severity: urgent
# provenance
source: uniswap
testlioRef: New Changes in LP Positions for V3 and V4
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
  - remove
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/RemoveLiquidity/
  - packages/uniswap/src/features/transactions/liquidity/
automationRefs: []
---

> **urgent · v3 · e2e · release · gap** · chains: ethereum, unichain, base

**Given** the user has an active V3 position
**When** they navigate to the position detail page, click "Remove liquidity", select a percentage, and confirm
**Then** the specified portion of liquidity is removed, tokens are returned, and the NFT burn (if 100%) or update is confirmed

---
id: lp-remove-v2-position
title: Remove liquidity from V2 position
# importance
priority: high
severity: urgent
# provenance
source: uniswap
# scope
protocol_version: v2
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - remove
  - legacy
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/RemoveLiquidity/
automationRefs: []
---

> **high · v2 · e2e · release · gap** · chains: ethereum

**Given** the user has a V2 liquidity position with LP tokens
**When** they initiate removal and approve the LP token spend
**Then** the LP tokens are burned and the underlying token pair is returned to the wallet

---
id: lp-remove-native-eth-unwrap
title: Remove liquidity with native ETH unwrap
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
  - remove
  - native-eth
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/RemoveLiquidity/
  - apps/web/src/pages/RemoveLiquidity/RemoveLiquidityModalContext.*
automationRefs: []
---

> **urgent · v4 · e2e · release · gap** · chains: ethereum, unichain, base

**Given** the user has an ETH/USDT position and the "Receive as WETH" toggle is OFF (default: unwrap)
**When** they remove liquidity
**Then** they receive native ETH (not WETH) plus USDT in their wallet

---
id: lp-remove-receive-as-weth
title: Remove liquidity keeping WETH (no unwrap)
# importance
priority: high
severity: medium
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
  - remove
  - native-eth
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/RemoveLiquidity/
  - apps/web/src/pages/RemoveLiquidity/RemoveLiquidityModalContext.*
automationRefs: []
---

> **high · v4 · e2e · release · gap** · chains: ethereum, unichain, base

**Given** the user has an ETH/USDT position and toggles "Receive as WETH" ON
**When** they remove liquidity
**Then** they receive WETH (not native ETH) plus USDT in their wallet

---
id: lp-remove-slider-custom-percent
title: Remove custom percentage via slider input
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
  - remove
  - ux
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/RemoveLiquidity/RemoveLiquidityForm.*
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: ethereum, unichain, base

**Given** the user is on the remove liquidity form
**When** they use the slider or type a custom percentage (e.g., 37%)
**Then** the expected output amounts update proportionally and the "Review" button is enabled

---
id: lp-remove-review-displays-amounts
title: Remove review screen displays correct token amounts
# importance
priority: urgent
severity: high
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
  - remove
  - review
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/pages/RemoveLiquidity/RemoveLiquidityReview.*
automationRefs: []
---

> **urgent · all · unit · pr-check · gap** · chains: ethereum, unichain, base

**Given** the user has selected a removal percentage and clicks "Review"
**When** the review modal opens
**Then** it displays the correct expected token amounts, fee information, and the position details match the selected percentage

---
id: lp-remove-error-tx-failure
title: Remove liquidity handles transaction failure gracefully
# importance
priority: high
severity: high
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
  - remove
  - error-handling
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/RemoveLiquidity/
  - apps/web/src/state/sagas/liquidity/
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: ethereum, unichain, base

**Given** the user confirms a remove liquidity transaction but it reverts on-chain
**When** the failure is detected
**Then** an error message is shown, the position state is unchanged, and the user can retry

---
id: lp-remove-tx-context
title: RemoveLiquidityTxContext produces correct tx request
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
  - apps/web/src/pages/RemoveLiquidity/RemoveLiquidityTxContext.*
  - apps/web/src/pages/RemoveLiquidity/hooks/useRemoveLiquidityTxAndGasInfo.*
automationRefs: []
---

> **urgent · all · unit · pr-check · gap** · chains: ethereum, unichain, base

**Given** the user has selected a removal percentage for a position
**When** the RemoveLiquidityTxContext processes the inputs
**Then** it returns correct gas estimates, approval data, and valid decrease calldata for the protocol version
