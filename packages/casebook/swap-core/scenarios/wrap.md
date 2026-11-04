# Swap scenarios — Wrap / Unwrap

Native <-> wrapped token conversion, which bypasses routing and must move balances 1:1.
Wallet aliases: see `TEST_WALLETS.md`. Shared defaults: `_defaults.yaml`.

---
id: swap-core-wrap-native-eth
title: Wrap native ETH to WETH bypasses routing 1:1
# importance
priority: urgent
severity: high
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Swap/Wrap.anvil.e2e.test.ts ("should wrap ETH"). Also backed
  by Testlio "Wraping and Un-Wrapping" (title copied verbatim, including the source
  typo).
testlioRef: Wraping and Un-Wrapping
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
  - wrap
  - native-eth
wallets:
  - TW-SWAPCORE-04
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/form/
  - packages/uniswap/src/features/transactions/swap/steps/
  - apps/web/src/pages/Swap/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/Wrap.anvil.e2e.test.ts
    testName: Wrap > should wrap ETH
---

> **urgent · all · e2e · scheduled · automated** · chains: ethereum, unichain, base

**Given** wallet `TW-SWAPCORE-04` holds native ETH, with ETH selected as input and WETH as output
**When** the user enters an amount and confirms
**Then** the CTA reads "Wrap" (not "Swap"), no routing quote is requested, and the WETH balance increases by exactly the wrapped amount (1:1, minus gas on the native side)

---
id: swap-core-unwrap-weth
title: Unwrap WETH to native ETH bypasses routing 1:1
# importance
priority: urgent
severity: high
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Swap/Wrap.anvil.e2e.test.ts ("should unwrap WETH"). Also
  backed by Testlio "Wraping and Un-Wrapping" (title copied verbatim, including the
  source typo).
testlioRef: Wraping and Un-Wrapping
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
  - wrap
  - native-eth
wallets:
  - TW-SWAPCORE-04
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/form/
  - packages/uniswap/src/features/transactions/swap/steps/
  - apps/web/src/pages/Swap/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/Wrap.anvil.e2e.test.ts
    testName: Wrap > should unwrap WETH
---

> **urgent · all · e2e · scheduled · automated** · chains: ethereum, unichain, base

**Given** wallet `TW-SWAPCORE-04` holds WETH, with WETH selected as input and native ETH as output
**When** the user enters an amount and confirms
**Then** the CTA reads "Unwrap", no routing quote is requested, and the native ETH balance increases by exactly the unwrapped amount (1:1, minus gas)
