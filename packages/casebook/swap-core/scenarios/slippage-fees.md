# Swap scenarios — Slippage, fees, FOT & sponsored

Slippage tolerance, swap fees, fee-on-transfer (FOT) tokens, sponsored/gasless swaps,
Flashblocks, and testnet swaps. Amount/slippage correctness can cause fund loss, so
those cases are urgent. Wallet aliases: see `TEST_WALLETS.md`. Shared defaults:
`_defaults.yaml`.

---
id: swap-core-slippage-manual-adjustment
title: Manual slippage adjustment is applied to the quote and review
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  Testlio "Manual Slippage Adjustment". This cross-platform case also covers the
  extension Testlio variants "Swap - Normal Slippage Buy - Extension" and
  "Swap - Slippage 1% Sell - Extension" (buy at default and sell at 1% manual
  slippage on extension). Slippage code:
  packages/uniswap/src/features/transactions/swap/plan/slippage.ts.
testlioRef: Manual Slippage Adjustment
# scope
protocol_version: all
chains:
  - ethereum
  - unichain
  - base
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - slippage
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/plan/
  - packages/uniswap/src/features/transactions/swap/form/
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: ethereum, unichain, base

**Given** the user opens swap settings and switches slippage from auto to a manual value (e.g. 1%)
**When** they return to the form and open the review screen
**Then** the entered tolerance is reflected in the review's minimum-received / maximum-sent line and is used to build the transaction

---
id: swap-core-slippage-tolerance-calc-unit
title: Compound slippage tolerance is computed correctly
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
sourceNote: >-
  packages/uniswap/src/features/transactions/swap/plan/slippage.test.ts
  (getPlanCompoundSlippageTolerance and calculatePlanCompoundSlippage describes).
  Unit companion of the manual Testlio slippage coverage mapped on
  swap-core-slippage-manual-adjustment.
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - slippage
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/plan/slippage.ts
automationRefs:
  - path: packages/uniswap/src/features/transactions/swap/plan/slippage.test.ts
    testName: slippage > getPlanCompoundSlippageTolerance
  - path: packages/uniswap/src/features/transactions/swap/plan/slippage.test.ts
    testName: slippage > calculatePlanCompoundSlippage
---

> **urgent · all · unit · pr-check · automated** · chains: ethereum

**Given** a multi-step plan with per-step slippage inputs
**When** `getPlanCompoundSlippageTolerance` / `calculatePlanCompoundSlippage` runs
**Then** the compounded tolerance matches the expected value so the built transaction cannot silently under-protect the user

---
id: swap-core-fot-buy-normal-slippage
title: FOT token buy applies correct fee-adjusted amount at normal slippage
# importance
priority: urgent
severity: high
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts ("should be able to swap token
  with FOT warning via TDP"). Also backed by Testlio "Swap FOT - Normal Slippage
  (Buy)".
testlioRef: Swap FOT - Normal Slippage (Buy)
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - fot
wallets:
  - TW-SWAPCORE-05
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/form/
  - packages/uniswap/src/features/transactions/swap/review/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts
    testName: Swap > should be able to swap token with FOT warning via TDP
---

> **urgent · all · e2e · release · automated** · chains: ethereum

**Given** wallet `TW-SWAPCORE-05` buys a fee-on-transfer token at the default (normal) slippage
**When** the user confirms the swap
**Then** a fee-on-transfer warning is shown, the quote accounts for the transfer fee, and the received amount matches the fee-adjusted expectation

---
id: swap-core-fot-sell-one-percent-slippage
title: FOT token sell at 1% slippage executes with fee-adjusted output
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  Testlio "Swap FOT - Slippage with 1 % (Sell)". Slippage/plan code:
  packages/uniswap/src/features/transactions/swap/plan/. No sell-side FOT e2e
  automation exists.
testlioRef: Swap FOT - Slippage with 1 % (Sell)
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - fot
  - slippage
wallets:
  - TW-SWAPCORE-05
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/form/
  - packages/uniswap/src/features/transactions/swap/plan/
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: ethereum

**Given** wallet `TW-SWAPCORE-05` sells a fee-on-transfer token with slippage set to 1%
**When** the user confirms the swap
**Then** the trade uses the 1% tolerance, the FOT fee is reflected in the output, and the transaction confirms without a revert

---
id: swap-core-fot-unibot-bullet
title: FOT swap between Unibot and Bullet applies both transfer fees correctly
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  Testlio "Swap FOT - Unibot with Bullet" (wallet CSV). Distinct FOT scenario from the
  buy/sell slippage variants: both legs involve fee-on-transfer tokens. No e2e
  automation exists for this pair.
testlioRef: Swap FOT - Unibot with Bullet
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - fot
wallets:
  - TW-SWAPCORE-05
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/form/
  - packages/uniswap/src/features/transactions/swap/review/
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: ethereum

**Given** wallet `TW-SWAPCORE-05` holds Unibot (a fee-on-transfer token)
**When** the user swaps Unibot for Bullet (also fee-on-transfer) and confirms
**Then** fee-on-transfer warnings are shown for the affected side(s), the quote accounts for the transfer fees on both legs, and the swap confirms with the fee-adjusted amounts reflected in the final balances

---
id: swap-core-fees-displayed-on-fee-routes
title: Swap fee is shown and applied on fee-bearing routes
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Swap/Fees.anvil.e2e.test.ts ("swaps ETH for USDC exact-in
  with swap fee") and Fees.e2e.test.ts ("should not display fee on swaps without
  fees"). No Testlio counterpart.
# scope
protocol_version: all
chains:
  - ethereum
  - base
platforms:
  - web
labels:
  - regression
  - swap
  - fees
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/types/getTradingApiSwapFee.ts
  - apps/web/src/pages/Swap/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/Fees.anvil.e2e.test.ts
    testName: Fees > swaps ETH for USDC exact-in with swap fee
  - path: apps/web/src/pages/Swap/Swap/Fees.e2e.test.ts
    testName: Fees > should not display fee on swaps without fees
---

> **high · all · e2e · scheduled · automated** · chains: ethereum, base

**Given** a route that carries a Uniswap swap fee (and, separately, one that does not)
**When** the user reviews and executes an exact-in ETH→USDC swap
**Then** the fee line is displayed and applied when a fee exists, and no fee line is shown when the route has no fee

---
id: swap-core-sponsored-gasless
title: Sponsored (gasless) swap executes without charging native gas
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: >-
  Testlio "Sponsored swaps". The load-bearing e2e assertion (native balance not
  debited for gas via the sponsored path) is not automated anywhere; sponsorship
  validation/resolution is unit-covered separately by
  swap-core-sponsorship-validation-unit
  (validateSwapTxContext.sponsorship.test.ts, resolveSponsorshipInfo.test.ts).
testlioRef: Sponsored swaps
# scope
protocol_version: all
chains:
  - base
  - unichain
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - sponsored
wallets:
  - TW-SWAPCORE-07
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/review/SwapReviewScreen/resolveSponsorshipInfo.ts
  - packages/uniswap/src/features/transactions/swap/types/
automationRefs: []
---

> **urgent · all · e2e · release · gap** · chains: base, unichain

**Given** a sponsorship-eligible wallet `TW-SWAPCORE-07` and a sponsored-swap route
**When** the user reviews and confirms the swap
**Then** the review indicates the gas is sponsored, the transaction is submitted through the sponsored path, and native balance is not debited for gas

---
id: swap-core-sponsorship-validation-unit
title: Sponsorship delivery is validated and resolved for the review screen
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: >-
  packages/uniswap/src/features/transactions/swap/types/validateSwapTxContext.sponsorship.test.ts
  and
  packages/uniswap/src/features/transactions/swap/review/SwapReviewScreen/resolveSponsorshipInfo.test.ts.
  Unit companion of the e2e-level swap-core-sponsored-gasless gap case.
# scope
protocol_version: all
chains:
  - base
  - unichain
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - sponsored
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/types/
  - packages/uniswap/src/features/transactions/swap/review/SwapReviewScreen/resolveSponsorshipInfo.ts
automationRefs:
  - path: packages/uniswap/src/features/transactions/swap/types/validateSwapTxContext.sponsorship.test.ts
    testName: "validateSwapTxContext — sponsorship delivery"
  - path: packages/uniswap/src/features/transactions/swap/review/SwapReviewScreen/resolveSponsorshipInfo.test.ts
    testName: resolveSponsorshipInfo
---

> **high · all · unit · pr-check · automated** · chains: base, unichain

**Given** swap transaction contexts with and without valid sponsorship data
**When** `validateSwapTxContext` (sponsorship delivery) and `resolveSponsorshipInfo` run
**Then** sponsored contexts validate only when the sponsorship payload is well-formed, and the resolved sponsorship info drives the correct gas-sponsored display state for the review screen

---
id: swap-core-flashblocks-fast-confirm
title: Flashblocks swap confirms via the fast-confirmation path
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  Testlio "Swap - Flashblocks". Confirmation handling lives in
  apps/web/src/state/sagas/transactions/. Requires a live Flashblocks-enabled chain,
  so not automatable in the current harness.
testlioRef: Swap - Flashblocks
# scope
protocol_version: all
chains:
  - base
  - unichain
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - flashblocks
wallets:
  - TW-SWAPCORE-07
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/state/sagas/transactions/
  - packages/uniswap/src/features/transactions/swap/review/
automationRefs: []
---

> **high · all · e2e · release · manual** · chains: base, unichain

**Given** a chain with Flashblocks enabled and `TW-SWAPCORE-07` connected
**When** the user executes a swap
**Then** the transaction is confirmed via the Flashblocks fast path, the "Swapped" state is reached faster than a full block, and the final balances are correct

---
id: swap-core-testnet-mode
title: Testnet swap executes end-to-end in testnet mode
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  Testlio "Testnet Swaps". Swap flow code:
  packages/uniswap/src/features/transactions/swap/. Requires testnet-mode toggling
  and live testnet infrastructure, so not automatable in the current harness.
testlioRef: Testnet Swaps
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - testnet
wallets:
  - TW-SWAPCORE-06
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/form/
  - apps/web/src/pages/Swap/
automationRefs: []
---

> **medium · all · e2e · release · manual** · chains: ethereum

**Given** testnet mode is enabled with wallet `TW-SWAPCORE-06` on a testnet
**When** the user performs a swap on a testnet token pair
**Then** the swap completes against testnet infrastructure, testnet chains/tokens are the only ones offered, and balances update on the testnet
