# Bridging scenarios — Cross-chain swap (chained actions)

Different-token cross-chain swaps (e.g. USDC on mainnet -> USDT on another chain),
executed as a chained-action plan (swap -> bridge -> swap) behind the
`enable_chained_actions` flag, plus the plan-level slippage compounding that governs
the safety of those multi-step routes. Shared defaults: `_defaults.yaml`.

---
id: bridging-crosschain-swap-happy-path
title: Cross-chain swap of different tokens completes across the swap/bridge/swap plan
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "CrossChain Swap - extension / mobile" and Testlio web "Crosschain
  swaps" (USDC mainnet -> USDT/other on a different chain; guided swap+bridge+swap steps,
  destination balance received); (c) plan orchestration in
  packages/uniswap/src/features/transactions/swap/plan/planSaga.ts. Manual until an e2e
  exists; pr-check is the target frequency once automated.
testlioRef: CrossChain Swap - extension / mobile
# scope
protocol_version: all
chains:
  - ethereum
  - arbitrum
  - optimism
  - base
  - zora
  - zksync
  - unichain
  - soneium
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - bridging
  - crosschain
  - chained-actions
  - smoke
wallets:
  - TW-BRIDGING-02
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/plan/
  - packages/uniswap/src/features/bridging/
  - apps/web/src/pages/Swap/
automationRefs: []
---

> **urgent · all · e2e · release · gap** · chains: ethereum, arbitrum, optimism, base, zora, zksync, unichain, soneium

**Given** test wallet TW-BRIDGING-02 (funded USDC/DAI/WETH on mainnet) is connected with the `enable_chained_actions` flag enabled
**When** the user selects Ethereum mainnet as the source chain and a different destination chain, then chooses a differing token pair (e.g. USDC on mainnet -> USDT on Base), enters a valid amount, initiates the cross-chain swap, and confirms the transaction
**Then** the user is guided through the swap -> bridge -> swap steps with a clear status for each phase, and the swapped token is received on the destination chain in the correct amount

---
id: bridging-crosschain-swap-single-activity-item
title: Cross-chain swap is recorded as a single activity item
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  (b) Testlio web "Crosschain swaps" step "Each crosschain swap appears as a single
  transaction item in the activity screen, not as multiple transactions".
testlioRef: Crosschain swaps
# scope
protocol_version: all
chains:
  - ethereum
  - arbitrum
  - base
  - unichain
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - bridging
  - crosschain
  - activity
wallets:
  - TW-BRIDGING-02
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/plan/
  - packages/uniswap/src/features/activity/
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: ethereum, arbitrum, base, unichain

**Given** the user has completed a cross-chain swap that internally executed multiple on-chain steps (swap, bridge, swap)
**When** they open the activity screen
**Then** the cross-chain swap is displayed as one activity item, not as multiple separate transactions

---
id: bridging-crosschain-swap-progress-status
title: Cross-chain swap surfaces real-time progress for each plan step
# importance
priority: high
severity: medium
# provenance
source: testlio
sourceNote: >-
  (b) Testlio web "Crosschain swaps" step "Application displays real-time progress for
  each swap, including bridging and token swaps as required"; Testlio wallet "CrossChain
  Swap" step "receives clear status updates for each phase".
testlioRef: CrossChain Swap - extension / mobile
# scope
protocol_version: all
chains:
  - ethereum
  - arbitrum
  - optimism
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - bridging
  - crosschain
  - review
wallets:
  - TW-BRIDGING-02
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/plan/planWatcherSaga.ts
  - packages/uniswap/src/features/transactions/swap/plan/watchPlanStepSaga.ts
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: ethereum, arbitrum, optimism

**Given** a cross-chain swap plan is executing (swap -> bridge -> swap)
**When** each step of the plan progresses on-chain
**Then** the UI shows real-time progress for each phase (including the bridging step and the token-swap steps) with per-step status updates, and a completion notification when the whole plan finishes

---
id: bridging-delegation-batched-crosschain-swap
title: Delegated smart wallet completes a batched cross-network swap from mainnet
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Delegation + Batched Cross Network Swap on Mainnet Ethereum" —
  cross-chain portion only (the delegation-setup portion belongs to the smart_wallet
  area); (c) smart-wallet delegation in packages/uniswap/src/features/smartWallet/ and
  plan orchestration in packages/uniswap/src/features/transactions/swap/plan/.
testlioRef: Delegation + Batched Cross Network Swap on Mainnet Ethereum
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - mobile
  - extension
labels:
  - regression
  - bridging
  - crosschain
  - chained-actions
  - smart-wallet
wallets:
  - TW-BRIDGING-03
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/smartWallet/
  - packages/uniswap/src/features/transactions/swap/plan/
  - packages/uniswap/src/features/bridging/
automationRefs: []
---

> **high · all · e2e · release · manual** · chains: ethereum

**Given** test wallet TW-BRIDGING-03 has smart-wallet (EIP-7702) delegation enabled and is funded on mainnet Ethereum, with the `enable_chained_actions` flag enabled
**When** the user initiates a cross-network swap from mainnet whose approval and swap steps are batched under the delegated smart wallet, and confirms
**Then** the batched steps execute as a single confirmation on the source chain, the cross-chain plan (bridge + destination swap) completes, and the output token is received on the destination chain with the plan shown as one activity item

---
id: bridging-plan-compound-slippage-tolerance
title: Chained-action plan compounds per-step slippage correctly
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
sourceNote: >-
  (a) packages/uniswap/src/features/transactions/swap/plan/slippage.test.ts —
  getPlanCompoundSlippageTolerance / calculatePlanCompoundSlippage suites, incl.
  "handles real-world chained action scenario" (CLASSIC -> BRIDGE -> CLASSIC).
# scope
protocol_version: all
chains:
  - ethereum
  - arbitrum
  - base
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - bridging
  - crosschain
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
    testName: slippage > getPlanCompoundSlippageTolerance > handles real-world chained action scenario
  - path: packages/uniswap/src/features/transactions/swap/plan/slippage.test.ts
    testName: slippage > calculatePlanCompoundSlippage > calculates compound slippage for three values
---

> **urgent · all · unit · pr-check · automated** · chains: ethereum, arbitrum, base

**Given** a chained-action plan whose steps carry individual slippage tolerances (e.g. a CLASSIC 0.5% swap and a CLASSIC 0.25% swap)
**When** `getPlanCompoundSlippageTolerance` / `calculatePlanCompoundSlippage` is computed over the plan steps
**Then** the compounded plan-level slippage is returned (0.5% and 0.25% compound to ~0.74875%), never a naive sum, so the aggregate tolerance shown/enforced for the cross-chain route is correct

---
id: bridging-plan-bridge-step-excluded-from-slippage
title: Bridge and non-swap steps are excluded from plan slippage compounding
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: >-
  (a) packages/uniswap/src/features/transactions/swap/plan/slippage.test.ts —
  "returns undefined when no steps have slippage" and "skips steps without slippage in
  compound calculation" (BRIDGE / APPROVAL_TXN / WRAP steps carry no slippage).
# scope
protocol_version: all
chains:
  - ethereum
  - arbitrum
  - base
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - bridging
  - crosschain
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
    testName: slippage > getPlanCompoundSlippageTolerance > skips steps without slippage in compound calculation
  - path: packages/uniswap/src/features/transactions/swap/plan/slippage.test.ts
    testName: slippage > getPlanCompoundSlippageTolerance > returns undefined when no steps have slippage
---

> **high · all · unit · pr-check · automated** · chains: ethereum, arbitrum, base

**Given** a plan whose steps include BRIDGE / APPROVAL_TXN / WRAP steps that carry no slippage tolerance
**When** the plan compound slippage is calculated
**Then** the no-slippage steps are skipped (only the swap steps contribute), and a plan with no slippage-bearing steps returns undefined rather than zero or an error
