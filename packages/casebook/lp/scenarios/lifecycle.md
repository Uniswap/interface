# LP scenarios — Lifecycle

End-to-end LP flows: full round trips, add/remove journeys, and the tx-steps / service / saga orchestration that spans create, increase, and remove. Shared defaults: `_defaults.yaml`.

---
id: lp-lifecycle-full-round-trip
title: 'Full position lifecycle: create → increase → remove → verify closed'
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
testlioRef: Claim Fees / Remove LP / Add LP / WC Create & WC Swap
# scope
protocol_version: v4
chains:
  - unichain
platforms:
  - web
labels:
  - regression
  - lifecycle
  - smoke
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/CreatePosition/
  - apps/web/src/pages/IncreaseLiquidity/
  - apps/web/src/pages/RemoveLiquidity/
  - apps/web/src/pages/Positions/
automationRefs: []
---

> **urgent · v4 · e2e · release · gap** · chains: unichain

**Given** a fresh test wallet on Unichain with ETH and USDC
**When** the user creates a V4 position, increases it, then removes 100%
**Then** at each step the position state is correct: created → increased liquidity → closed, with tokens returned to wallet

---
id: lp-tx-steps-generation
title: LP transaction steps are generated correctly for all protocol versions
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
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
  - tx-steps
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/liquidity/steps/
automationRefs:
  - path: packages/uniswap/src/features/transactions/liquidity/steps/generateLPTransactionSteps.test.ts
    testName: generateLPTransactionSteps
---

> **urgent · all · unit · pr-check · automated** · chains: ethereum, unichain, base

**Given** a create, increase, or decrease liquidity action is initiated
**When** the transaction steps are generated
**Then** the correct sequence of steps (approve → permit → submit → confirm) is produced for the protocol version

---
id: lp-liquidity-service-client
title: LiquidityService API client handles requests and normalizes responses
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
  - api-client
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/data/apiClients/liquidityService/
automationRefs: []
---

> **urgent · all · unit · pr-check · gap** · chains: ethereum, unichain, base

**Given** any LP action (create, increase, decrease) calls the Liquidity Service
**When** the API returns approval data, permit data, or calldata
**Then** `normalizeApprovalResponse` correctly parses the response and `useCheckLPApprovalQuery` / `useCreatePositionQuery` return valid typed results

---
id: lp-liquidity-saga
title: Liquidity saga orchestrates full LP transaction lifecycle
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
  - saga
# execution
automatable: true
testLevel: integration
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/state/sagas/liquidity/
automationRefs: []
---

> **urgent · all · integration · pr-check · gap** · chains: ethereum, unichain, base

**Given** the user confirms an LP action (create, increase, or decrease)
**When** the liquidity saga dispatches
**Then** it orchestrates approvals → permit signing → tx submission → on-chain confirmation in the correct order, handling failures at each step

---
id: lp-add-remove-p2-chains
title: Add and remove liquidity on secondary chains
# importance
priority: medium
severity: medium
# provenance
source: testlio
testlioRef: Soneium Chain - LP
# scope
protocol_version: all
chains:
  - arbitrum
  - optimism
  - polygon
  - bnb
  - avalanche
  - celo
  - blast
  - zora
  - zksync
  - soneium
  - worldchain
  - monad
platforms:
  - web
labels:
  - regression
  - chains
  - p2-expansion
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

> **medium · all · e2e · release · gap** · chains: 12 networks

**Given** the user is on a P2 chain (Arbitrum, Optimism, Polygon, etc.)
**When** they create, increase, or remove liquidity
**Then** the flows complete identically to the P0/P1 chains (Ethereum, Unichain, Base)

---
id: lp-add-remove-hooked-pool
title: Add and remove liquidity on V4 hooked pool
# importance
priority: high
severity: high
# provenance
source: testlio
testlioRef: Hooked pools - Unichain
# scope
protocol_version: v4
chains:
  - unichain
  - ethereum
platforms:
  - web
labels:
  - regression
  - hooks
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

> **high · v4 · e2e · release · gap** · chains: unichain, ethereum

**Given** the user interacts with a V4 pool that has a hook attached (e.g., EzETH/ETH on Unichain)
**When** they add or remove liquidity
**Then** the hook executes correctly, the transaction completes, and the position reflects the expected state

---
id: lp-add-remove-embedded-wallet
title: Add and remove liquidity with embedded (passkey) wallet
# importance
priority: high
severity: high
# provenance
source: testlio
testlioRef: Embedded Wallet
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
  - embedded-wallet
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/CreatePosition/
  - apps/web/src/pages/IncreaseLiquidity/
  - apps/web/src/pages/RemoveLiquidity/
automationRefs: []
---

> **high · all · e2e · release · manual** · chains: ethereum, unichain, base

**Given** the user is connected via an embedded (passkey) wallet
**When** they perform add or remove liquidity flows
**Then** the passkey signing flow completes, the transaction is submitted, and the position updates correctly
