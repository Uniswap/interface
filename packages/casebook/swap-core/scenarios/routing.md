# Swap scenarios — Protocol routing (V2 / V3 / V4)

Routing across protocol versions and ERC20→ERC20 trades. Wrong routing can produce a
bad quote or a failed transaction. Wallet aliases: see `TEST_WALLETS.md`. Shared
defaults: `_defaults.yaml`.

---
id: swap-core-routing-v4
title: Swap routes through a V4 pool
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  Testlio "Swap with V4". Routing code lives in
  packages/uniswap/src/features/transactions/swap/services/ and utils/protocols.ts;
  no e2e automation exists for on-chain V4 route execution.
testlioRef: Swap with V4
# scope
protocol_version: v4
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
  - routing
wallets:
  - TW-SWAPCORE-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/services/
  - packages/uniswap/src/features/transactions/swap/utils/protocols.ts
automationRefs: []
---

> **high · v4 · e2e · release · gap** · chains: ethereum, unichain, base

**Given** a token pair whose best route is a V4 pool and V4 is enabled
**When** the user quotes and executes the swap
**Then** the trade routes through V4, the review reflects the V4 route, and the swap confirms with correct balances

---
id: swap-core-routing-v3
title: Swap routes through a V3 pool
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  Testlio "Swap with V3". No e2e automation exists for on-chain V3 route execution;
  protocol-preference filtering is unit-covered separately by
  swap-core-routing-protocol-preferences-unit
  (packages/uniswap/src/features/transactions/swap/utils/protocols.test.ts).
testlioRef: Swap with V3
# scope
protocol_version: v3
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
  - routing
wallets:
  - TW-SWAPCORE-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/services/
  - packages/uniswap/src/features/transactions/swap/utils/protocols.ts
automationRefs: []
---

> **high · v3 · e2e · release · gap** · chains: ethereum, unichain, base

**Given** a token pair whose best route is a V3 pool
**When** the user quotes and executes the swap
**Then** the trade routes through V3 and confirms with correct balances

---
id: swap-core-routing-protocol-preferences-unit
title: Protocol preference filtering selects the correct route protocols
# importance
priority: high
severity: medium
# provenance
source: existing-unit
sourceNote: >-
  packages/uniswap/src/features/transactions/swap/utils/protocols.test.ts ("protocols"
  describe: default protocol options, UniswapX enable/disable filtering, V4 retention,
  feature-flag hook path). Split out of the e2e-level V3 routing case so the
  automation badge reflects same-level coverage only.
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
  - routing
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/utils/protocols.ts
automationRefs:
  - path: packages/uniswap/src/features/transactions/swap/utils/protocols.test.ts
    testName: protocols
---

> **high · all · unit · pr-check · automated** · chains: ethereum

**Given** a set of user-selected protocol preferences and UniswapX/feature-flag states
**When** `filterProtocols` and the protocols-for-chain hook path run
**Then** the resulting protocol list keeps V2/V3/V4 as selected, includes UniswapX only when enabled and not user-toggled off, and defaults to UniswapX latest + V4 + V3 + V2

---
id: swap-core-routing-v2
title: Swap routes through a V2 pool
# importance
priority: high
severity: medium
# provenance
source: testlio
sourceNote: >-
  Testlio "Swap with V2". Routing code lives in
  packages/uniswap/src/features/transactions/swap/utils/protocols.ts; no e2e
  automation exists for on-chain V2 route execution.
testlioRef: Swap with V2
# scope
protocol_version: v2
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - routing
  - legacy
wallets:
  - TW-SWAPCORE-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/services/
  - packages/uniswap/src/features/transactions/swap/utils/protocols.ts
automationRefs: []
---

> **high · v2 · e2e · release · gap** · chains: ethereum

**Given** a token pair whose best route is a legacy V2 pool
**When** the user quotes and executes the swap
**Then** the trade routes through V2 and confirms with correct balances

---
id: swap-core-routing-erc20-to-erc20
title: ERC20-to-ERC20 swap (WETH -> WBTC)
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  Testlio "Swap WETH->WBTC". Quote/route code lives in
  packages/uniswap/src/features/transactions/swap/services/; no dedicated e2e
  automation exists for this pair.
testlioRef: Swap WETH->WBTC
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
  - routing
wallets:
  - TW-SWAPCORE-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/services/
  - packages/uniswap/src/features/transactions/swap/review/
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: ethereum

**Given** wallet `TW-SWAPCORE-01` holds WETH
**When** the user swaps WETH for WBTC and confirms
**Then** the route is quoted for the ERC20→ERC20 pair, any required approval/permit is handled, and both balances update on confirmation
