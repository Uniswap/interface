# Swap scenarios — Core

Core swap flows: exact-input quoting and execution, token-direction switching, and
native wrap/unwrap. Shared defaults: `_defaults.yaml`.

---
id: swap-core-exact-input-happy-path
title: Exact-input swap completes and updates balances
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
testlioRef: Swap - Core
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
  - swap
  - smoke
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/form/
  - packages/uniswap/src/features/transactions/swap/review/
  - packages/uniswap/src/features/transactions/swap/services/
  - apps/web/src/pages/Swap/
automationRefs: []
---

> **urgent · all · e2e · release · gap** · chains: ethereum, unichain, base

**Given** a connected wallet with a token balance on a supported chain
**When** the user enters an exact input amount and confirms the swap in the review screen
**Then** a quote is fetched, the transaction is submitted and confirmed on-chain, the "Swapped" notification appears, and both token balances update to reflect the trade

---
id: swap-core-reverse-token-direction
title: Reversing token direction swaps input/output and refetches the quote
# importance
priority: high
severity: high
# provenance
source: testlio
testlioRef: Swap - Core
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
  - swap
  - form
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/form/
  - packages/uniswap/src/features/transactions/swap/state/
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: ethereum, unichain, base

**Given** the user has selected an input and output token with an entered amount
**When** they click the reverse (switch) control between the token fields
**Then** the input and output tokens swap positions, the entered amount moves to the new input field, and a fresh quote is fetched for the reversed direction

---
id: swap-core-wrap-unwrap-native
title: Wrap and unwrap native token bypasses routing
# importance
priority: high
severity: high
# provenance
source: uniswap
testlioRef: Swap - Core
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
  - swap
  - wrap
  - native-eth
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/form/
  - packages/uniswap/src/features/transactions/swap/steps/
  - apps/web/src/pages/Swap/
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: ethereum, unichain, base

**Given** the user selects native ETH as input and WETH as output (or the reverse)
**When** they enter an amount and confirm the action
**Then** the UI shows "Wrap"/"Unwrap" instead of "Swap", no routing quote is requested, and the wrapped/unwrapped balance updates 1:1 after the transaction confirms
