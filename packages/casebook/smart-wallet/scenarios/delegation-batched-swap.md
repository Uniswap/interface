# Smart Wallet scenarios — Delegation + batched swap (EIP-7702)

First-time delegation activation bundled into a swap, subsequent swaps that must NOT
re-delegate, per-chain smoke, and the cross-network variants (mobile and extension).
Wallet aliases are defined in `../TEST_WALLETS.md`. Shared defaults: `../_defaults.yaml`.

Known gaps / source notes: the blueprint's automation globs
`apps/web/src/pages/Swap/**/*batch*.e2e.test.ts` and `apps/extension/**/swap/**/*.e2e.test.ts`
match zero files in the repo, and `apps/mobile/.maestro/flows/swap/` contains no
delegation/batched flow — no same-level (e2e) automation exists anywhere for these flows,
so every e2e case below is honestly a gap. `packages/uniswap/src/features/capabilities/`
(blueprint code_path) has no test files; its caip25 helpers are cited as code_paths only.

---
id: smart-wallet-delegation-batched-swap-mainnet
title: First swap on mainnet activates EIP-7702 delegation in a batched transaction
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "Testlio wallet CSV title verbatim. Extension variant backed by the blueprint's '[Extension] Delegation + Batched Swap ... / Manage delegations' entry. No same-level automation exists (blueprint web/ext e2e globs match zero files)."
testlioRef: Delegation + Batched Swap on Mainnet Ethereum
# scope
chains:
  - ethereum
platforms:
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - delegation
  - batched
  - smoke
wallets:
  - TW-SMARTWALLET-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/smartWallet/
  - packages/wallet/src/features/batchedTransactions/
  - packages/uniswap/src/features/smartWallet/userOp/
  - packages/uniswap/src/features/smartWallet/delegation/
automationRefs: []
---

> **urgent · e2e · release · gap** · chains: ethereum

**Given** test wallet TW-SMARTWALLET-01 (funded, not yet delegated) is set up in the mobile app or the extension on Ethereum mainnet
**When** the user opens Swap, selects ETH → USDC, taps Review, and confirms the swap
**Then** the review modal shows "Includes Smart Wallet Delegation" under Network Cost, and after confirming, the on-chain transaction is type `4 (EIP-7702)` with `to` equal to the wallet's own address, confirming delegation was activated and bundled with the swap in a single batched transaction

---
id: smart-wallet-delegation-network-cost-banner
title: Review screen surfaces the "Includes Smart Wallet Delegation" network-cost banner
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Hook logic covered by useIncludesDelegationUpgrade.test.ts (all five branches). Banner render and the explainer-modal tap are unit-uncovered and are verified manually during the Testlio 'Delegation + Batched Swap on Mainnet Ethereum' run."
# scope
chains:
  - ethereum
platforms:
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - delegation
  - review
wallets:
  - TW-SMARTWALLET-01
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/smartWallet/banner/NetworkCostBanner.tsx
  - packages/uniswap/src/features/smartWallet/delegation/hooks/useIncludesDelegationUpgrade.ts
automationRefs:
  - path: packages/uniswap/src/features/smartWallet/delegation/hooks/useIncludesDelegationUpgrade.test.ts
    testName: useIncludesDelegationUpgrade > returns true when the flag is on and the included delegation is a Uniswap re-delegation
---

> **high · unit · pr-check · automated** · chains: ethereum

**Given** a swap whose pending transaction includes a delegation upgrade for a wallet not yet delegated to Uniswap, with the smart-wallet feature flag enabled
**When** the review screen renders the network-cost section
**Then** `useIncludesDelegationUpgrade` returns true, the `NetworkCostBanner` renders the "Includes Smart Wallet Delegation" copy, and tapping the info (i) affordance opens the explainer modal

---
id: smart-wallet-delegation-subsequent-swap-no-redelegation
title: Subsequent swap on an already-delegated wallet does not re-delegate
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "Testlio wallet CSV title verbatim. Extension variant backed by the blueprint's '[Extension] Delegation + Batched Swap ... / Manage delegations' entry. Delegation-detection logic is unit-covered (useIncludesDelegationUpgrade.test.ts, isDelegatedEOA.test.ts) but that is below this case's e2e level, so no automationRefs are claimed."
testlioRef: Delegation + Batched Swap on Mainnet Ethereum
# scope
chains:
  - ethereum
platforms:
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - delegation
wallets:
  - TW-SMARTWALLET-02
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/smartWallet/delegation/hooks/useIncludesDelegationUpgrade.ts
  - packages/uniswap/src/features/smartWallet/delegation/isDelegatedEOA.ts
automationRefs: []
---

> **urgent · e2e · release · gap** · chains: ethereum

**Given** test wallet TW-SMARTWALLET-02 has already been delegated to Uniswap on mainnet
**When** the user performs a second swap (USDC → any non-ETH token) and confirms
**Then** the review screen does NOT show "Includes Smart Wallet Delegation", and the resulting on-chain transaction is type `2 (EIP-1559)` — a plain swap with no repeated delegation

---
id: smart-wallet-delegation-batched-swap-per-chain
title: First swap activates delegation on each supported chain (Unichain, Base, OP, BNB, Arbitrum)
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "Testlio wallet CSV title verbatim (per-chain delegation smoke)."
testlioRef: Delegation + Batched Swap on Unichain/Base/OP Mainnet/BNB/Arbitrum
# scope
chains:
  - unichain
  - base
  - optimism
  - bnb
  - arbitrum
platforms:
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - delegation
  - batched
  - per-chain
wallets:
  - TW-SMARTWALLET-05
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/smartWallet/
  - packages/wallet/src/features/smartWallet/hooks/useSmartWalletChains.ts
  - packages/uniswap/src/features/smartWallet/delegation/
automationRefs: []
---

> **high · e2e · release · gap** · chains: unichain, base, optimism, bnb, arbitrum

**Given** test wallet TW-SMARTWALLET-05 is funded on the target chain and not yet delegated there
**When** the user performs their first swap on that chain and confirms
**Then** the review shows "Includes Smart Wallet Delegation", the first tx confirms as type `4 (EIP-7702)` with `to` = the wallet's own address, and a delegation now exists for that specific chain (verified independently via a bytecode/delegation lookup)

---
id: smart-wallet-delegation-batched-cross-network-swap
title: Delegation activates during a cross-network (bridge) swap
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "Testlio wallet CSV title verbatim (mobile). The extension cross-network variant is covered by smart-wallet-extension-eth-eth-uni."
testlioRef: Delegation + Batched Cross Network Swap on Mainnet Ethereum
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - smart-wallet
  - delegation
  - batched
  - cross-chain
wallets:
  - TW-SMARTWALLET-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/smartWallet/
  - packages/wallet/src/features/batchedTransactions/
  - packages/uniswap/src/features/transactions/swap/plan/
automationRefs: []
---

> **urgent · e2e · release · gap** · chains: ethereum

**Given** test wallet TW-SMARTWALLET-01 (funded, not yet delegated) on Ethereum mainnet
**When** the user selects ETH input and ETH-on-a-different-chain output (a bridge), taps Review, and confirms
**Then** the review shows "Includes Smart Wallet Delegation" under Network Cost, the confirming transaction is type `4 (EIP-7702)` with `to` = the wallet's own address, and a delegation now exists on the origin chain; a follow-up same-wallet swap confirms as type `2 (EIP-1559)`

---
id: smart-wallet-extension-eth-eth-uni
title: Extension swaps mainnet ETH to ETH on Unichain (cross-network, delegation-aware)
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "Testlio wallet CSV title verbatim ('Uni' = Unichain). Extension counterpart of the cross-network delegation swap; previously the only blueprint Testlio title with no case in this catalog."
testlioRef: "[Extension] ETH -> ETH Uni"
# scope
chains:
  - ethereum
  - unichain
platforms:
  - extension
labels:
  - regression
  - smart-wallet
  - delegation
  - batched
  - cross-chain
wallets:
  - TW-SMARTWALLET-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/smartWallet/
  - packages/wallet/src/features/batchedTransactions/
  - packages/uniswap/src/features/transactions/swap/plan/
automationRefs: []
---

> **urgent · e2e · release · gap** · chains: ethereum, unichain

**Given** test wallet TW-SMARTWALLET-01 (funded with ETH on Ethereum mainnet, not yet delegated) is imported in the extension
**When** the user selects ETH on Ethereum as input and ETH on Unichain as output, taps Review, and confirms
**Then** if the wallet is not yet delegated the review shows "Includes Smart Wallet Delegation" under Network Cost and the origin-chain transaction confirms as type `4 (EIP-7702)` with `to` = the wallet's own address; the bridged ETH arrives on Unichain and the destination balance increases by the quoted output amount

---
id: smart-wallet-fund-wallet-additional-networks
title: Fund a smart wallet across additional networks (delegation smoke precondition)
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio wallet CSV title verbatim. Setup/precondition case for the per-chain delegation smoke; inherently manual (real funding across live networks)."
testlioRef: "Fund Wallet: Additional Networks"
# scope
chains:
  - unichain
  - base
  - arbitrum
  - optimism
  - zora
  - polygon
  - bnb
platforms:
  - mobile
labels:
  - regression
  - smart-wallet
  - setup
wallets:
  - TW-SMARTWALLET-05
# execution
automatable: false
testLevel: manual
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/smartWallet/hooks/useNetworkBalances.tsx
  - packages/wallet/src/features/smartWallet/hooks/useSmartWalletChains.ts
automationRefs: []
---

> **medium · manual · release · manual** · chains: unichain, base, arbitrum, optimism, zora, polygon, bnb

**Given** test wallet TW-SMARTWALLET-05 needs balances on the additional networks used by the per-chain delegation cases
**When** the tester bridges native ETH in-app to Unichain, Base, Arbitrum, Optimism and Zora, and uses an external bridge for Polygon and BNB
**Then** each network shows a non-zero balance for the wallet, satisfying the funding precondition for `smart-wallet-delegation-batched-swap-per-chain`

---
id: smart-wallet-userop-transform-eip7702
title: Trading-API userOp transforms to an RPC userOp preserving eip7702Auth and rejecting bad hex
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
sourceNote: "Existing unit suite transformTradingApiUserOp.test.ts (field mapping incl. eip7702Auth, optional-field absence, malformed-hex rejection)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - batched
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/smartWallet/userOp/transformTradingApiUserOp.ts
  - packages/uniswap/src/features/smartWallet/userOp/buildUserOpTypedData.ts
automationRefs:
  - path: packages/uniswap/src/features/smartWallet/userOp/transformTradingApiUserOp.test.ts
    testName: transformTradingApiUserOpToRpcUserOp > maps every required and optional field, including eip7702Auth
---

> **urgent · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** a trading-API userOp payload
**When** `transformTradingApiUserOpToRpcUserOp` converts it
**Then** every required and optional field (including nested `eip7702Auth`) is mapped, optional fields and `eip7702Auth` are left undefined when absent, and it throws when any field or nested `eip7702Auth` field is not a valid 0x-prefixed hex string

---
id: smart-wallet-batched-calls-transform
title: Batched calls transform to transaction requests and batch IDs are well-formed
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Existing unit suites in utils.test.ts (transformCallsToTransactionRequests, generateBatchId)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - batched
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/batchedTransactions/utils.ts
automationRefs:
  - path: packages/wallet/src/features/batchedTransactions/utils.test.ts
    testName: transformCallsToTransactionRequests
---

> **high · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** a set of EIP-5792 calls
**When** `transformCallsToTransactionRequests` and `generateBatchId` run
**Then** valid calls are transformed correctly, invalid calls are filtered out (empty array when all invalid or input empty), and `generateBatchId` produces a correctly formatted, unique ID per call

---
id: smart-wallet-batch-call-status
title: getCallsStatusHelper reports Pending/Success/OffchainFailure for userOp and tx batches
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
sourceNote: "Existing unit suite eip5792Utils.test.ts (UserOp batches, txHashes batches, race windows, not-found error)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - batched
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/batchedTransactions/eip5792Utils.ts
automationRefs:
  - path: packages/wallet/src/features/batchedTransactions/eip5792Utils.test.ts
    testName: getCallsStatusHelper
---

> **urgent · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** a batch tracked as either a userOp or a set of tx hashes
**When** `getCallsStatusHelper` computes its status
**Then** it returns Pending while unconfirmed, Success with receipt when landed, OffchainFailure when finalized Failed without a receipt, stays Pending in the Success-but-receipt-not-yet-landed race window, and returns an error when the batch is not found — so users are never shown a wrong final state for a batched swap

---
id: smart-wallet-gas-fees-group-by-symbol
title: Smart-wallet gas fees group by token symbol
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "Existing unit suite gasFeeUtils.test.ts (groupGasFeesBySymbol)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/smartWallet/utils/gasFeeUtils.ts
automationRefs:
  - path: packages/wallet/src/features/smartWallet/utils/gasFeeUtils.test.ts
    testName: groupGasFeesBySymbol
---

> **medium · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** a list of per-network gas fees for a remove-delegation / batched operation
**When** `groupGasFeesBySymbol` aggregates them
**Then** fees are grouped and summed correctly per token symbol for display in the total-fee UI
