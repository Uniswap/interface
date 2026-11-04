# Swap scenarios — Approvals & allowance

ERC20→Permit2 approvals and Permit2 permit signatures. Failure here can strand funds
in an approval or produce a wrong/failed transaction, so most cases are urgent. Wallet
aliases: see `TEST_WALLETS.md`. Shared defaults: `_defaults.yaml`.

---
id: swap-core-allowance-zero-approve-erc20
title: Swap requests ERC20 approve when Permit2 has no token allowance
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts ("swaps with existing permit2
  approval and missing token approval"). Also backed by Testlio "Swap with 0 approve
  allowance on DAI Token".
testlioRef: Swap with 0 approve allowance on DAI Token
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
  - approval
wallets:
  - TW-SWAPCORE-02
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/review/
  - packages/uniswap/src/features/transactions/swap/steps/
  - packages/wallet/src/features/transactions/swap/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts
    testName: Swap > permit2 > swaps with existing permit2 approval and missing token approval
---

> **urgent · all · e2e · scheduled · automated** · chains: ethereum

**Given** wallet `TW-SWAPCORE-02` holds DAI with zero ERC20→Permit2 approve allowance
**When** the user swaps DAI and confirms in the review screen
**Then** an "Approve" step is shown and submitted before the swap step, the approval confirms on-chain, and the swap then executes successfully with balances updated

---
id: swap-core-allowance-zero-permit-signature
title: Swap prompts a Permit2 signature when no permit allowance exists
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts ("prompts signature when there
  is no permit2 allowance"). Also backed by Testlio "Swap with 0 permit alowance for
  USDC Token" (title copied verbatim, including the source typo).
testlioRef: Swap with 0 permit alowance for USDC Token
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
  - approval
  - permit2
wallets:
  - TW-SWAPCORE-03
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/review/
  - packages/uniswap/src/features/transactions/swap/review/hooks/useTokenApprovalInfo.ts
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts
    testName: Swap > permit2 > prompts signature when there is no permit2 allowance
---

> **urgent · all · e2e · scheduled · automated** · chains: ethereum

**Given** wallet `TW-SWAPCORE-03` holds USDC with an ERC20 approval to Permit2 but no signed permit allowance
**When** the user confirms a USDC swap
**Then** a "Sign message" (Permit2 signature) step is prompted, and after signing the swap executes without an extra on-chain approval transaction

---
id: swap-core-allowance-insufficient-permit
title: Insufficient existing Permit2 approval re-prompts a signature
# importance
priority: urgent
severity: high
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts ("swaps USDT with existing but
  insufficient approval permit2" and "prompts signature when existing permit approval
  amount is too low"). Variant of the Testlio 0-permit case (which is mapped on
  swap-core-allowance-zero-permit-signature); no dedicated Testlio title exists for
  the insufficient-permit variant.
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
  - extension
labels:
  - regression
  - swap
  - approval
  - permit2
wallets:
  - TW-SWAPCORE-03
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/review/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts
    testName: Swap > permit2 > swaps USDT with existing but insufficient approval permit2
  - path: apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts
    testName: Swap > permit2 > prompts signature when existing permit approval amount is too low
---

> **urgent · all · e2e · scheduled · automated** · chains: ethereum

**Given** the token has an existing Permit2 allowance that is smaller than the swap amount
**When** the user confirms the swap
**Then** a fresh signature is requested to raise the allowance and the swap executes for the full amount without under-approving

---
id: swap-core-allowance-expired-permit
title: Expired Permit2 approval re-prompts a signature
# importance
priority: urgent
severity: high
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts ("prompts signature when
  existing permit approval is expired"). Variant of the Testlio 0-permit case (mapped
  on swap-core-allowance-zero-permit-signature); no dedicated Testlio title exists for
  the expired-permit variant.
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
  - extension
labels:
  - regression
  - swap
  - approval
  - permit2
  - edge-case
wallets:
  - TW-SWAPCORE-03
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/review/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts
    testName: Swap > permit2 > prompts signature when existing permit approval is expired
---

> **urgent · all · e2e · scheduled · automated** · chains: ethereum

**Given** the token's Permit2 allowance exists but has an expired deadline
**When** the user confirms the swap
**Then** the expired permit is detected and a new "Sign message" step is prompted before the swap proceeds
