# Swap scenarios — Swap-flow warnings & gates

Swap-side gates that must block or warn before a transaction is built: blocked tokens,
swap protection (private RPC), and balance warnings. Token-safety warning depth (FOT,
malicious, honeypot, geo) lives in the `token_protection` area; these cases cover only
the swap-flow surface. Wallet aliases: see `TEST_WALLETS.md`. Shared defaults:
`_defaults.yaml`.

---
id: swap-core-warning-blocked-token
title: Blocked token cannot be swapped
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
sourceNote: >-
  packages/uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getTokenBlockedWarning.test.ts.
  Also backed by Testlio "Blocked Token".
testlioRef: Blocked Token
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
  - blocked-token
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getTokenBlockedWarning.ts
  - packages/uniswap/src/features/transactions/swap/form/
automationRefs:
  - path: packages/uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getTokenBlockedWarning.test.ts
    testName: getTokenBlockedWarning
---

> **urgent · all · unit · pr-check · automated** · chains: ethereum

**Given** the user selects a token that is on the block list
**When** the swap form evaluates warnings (`getTokenBlockedWarning`)
**Then** a blocking warning is returned, the review/confirm CTA is disabled, and no transaction can be built for the blocked token

---
id: swap-core-warning-insufficient-balance
title: Insufficient balance disables the swap CTA
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: >-
  packages/uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getBalanceWarning.test.ts.
  The CTA-disable surface lives in
  packages/uniswap/src/features/transactions/swap/components/SwapFormButton/ (its
  useIsSwapButtonDisabled.test.ts covers the permissioned-pool branch, not the
  balance branch, so it is not cited as automation here). No Testlio counterpart.
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
  - validation
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getBalanceWarning.ts
  - packages/uniswap/src/features/transactions/swap/components/SwapFormButton/
automationRefs:
  - path: packages/uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getBalanceWarning.test.ts
    testName: getBalanceWarning
---

> **high · all · unit · pr-check · automated** · chains: ethereum

**Given** the user enters an input amount greater than their token balance
**When** the swap form evaluates balance warnings
**Then** an "Insufficient balance" warning is shown and the swap button is disabled

---
id: swap-core-protection-private-rpc
title: Swap protection (private RPC) routes the transaction when enabled
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  Testlio "Swap Protection - Extension". Protection wiring lives in
  apps/extension/src/app/features/swap/ and
  packages/wallet/src/features/transactions/swap/. Verifying private-RPC submission
  requires network-level observation, so not automatable in the current harness.
testlioRef: Swap Protection - Extension
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - extension
  - mobile
labels:
  - regression
  - swap
  - protection
wallets:
  - TW-SWAPCORE-01
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/swap/
  - packages/wallet/src/features/transactions/swap/
automationRefs: []
---

> **high · all · e2e · release · manual** · chains: ethereum

**Given** swap protection is enabled in settings with wallet `TW-SWAPCORE-01` connected
**When** the user executes a swap
**Then** the transaction is submitted through the protected (private) RPC path and confirms normally, with the protection state reflected in the UI
