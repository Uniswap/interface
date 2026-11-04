# Smart Wallet scenarios — External dapp batched swap (EIP-5792)

Inbound `wallet_sendCalls` batches from an external dapp (via WalletConnect / injected),
the bundled-transaction review UI, and the "be careful" warning. Wallet aliases are defined
in `../TEST_WALLETS.md`. Shared defaults: `../_defaults.yaml`.

---
id: smart-wallet-external-dapp-batched-swap-mainnet
title: External dapp batched swap executes as a single EIP-7702 transaction
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "Testlio wallet CSV title verbatim. Batched-call construction and status logic are unit-covered (utils.test.ts, eip5792Utils.test.ts) but below this case's e2e level; no same-level automation exists."
testlioRef: External Dapp Batched Swap on Mainnet Ethereum
# scope
chains:
  - ethereum
platforms:
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - batched
  - dapp
wallets:
  - TW-SMARTWALLET-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/batchedTransactions/
  - packages/wallet/src/features/dappRequests/
  - packages/uniswap/src/features/capabilities/caip25/
automationRefs: []
---

> **urgent · e2e · release · gap** · chains: ethereum

**Given** test wallet TW-SMARTWALLET-01 is connected to an external dapp (app.uniswap.org) via WalletConnect
**When** the dapp initiates a swap (WBTC → USDC) that batches approval + swap and the user accepts the incoming request on the wallet
**Then** the wallet receives a batched (EIP-5792) request, the transaction confirms on-chain as type `4 (EIP-7702)` with `to` = the wallet's own address, and the swap succeeds

---
id: smart-wallet-external-dapp-bundled-review-warning
title: Incoming external batch shows bundled-transaction count and safety warning
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "Verified as part of the Testlio 'External Dapp Batched Swap on Mainnet Ethereum' run (review-UI leg). No same-level automation exists."
testlioRef: External Dapp Batched Swap on Mainnet Ethereum
# scope
chains:
  - ethereum
platforms:
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - batched
  - dapp
  - review
wallets:
  - TW-SMARTWALLET-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/dappRequests/
  - packages/wallet/src/features/batchedTransactions/utils.ts
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** an external dapp sends a two-call batch to the connected wallet
**When** the confirmation request modal appears on the wallet
**Then** it states "2 bundled transactions", shows a "Be careful…" warning for the external batch, and expanding it reveals a carousel of the two individual transaction details before the user can Accept

---
id: smart-wallet-web-batched-activity-polling
title: Web activity polling finalizes pending EIP-5792 batches correctly
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Existing unit suite apps/web/src/state/activity/polling/batch.test.ts (pollPendingBatches: partial revert 600, receipt-less 400, continue-after-failure, atomic vs non-atomic receipt selection, still-pending 100). Added per review: gives the declared web platform an automated reference in this area."
# scope
platforms:
  - web
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
  - apps/web/src/state/activity/polling/batch.ts
  - apps/web/src/state/walletCapabilities/hooks/useIsAtomicBatchingSupportedByChain.ts
automationRefs:
  - path: apps/web/src/state/activity/polling/batch.test.ts
    testName: pollPendingBatches
---

> **high · unit · pr-check · automated** · platforms: web

**Given** the web app has pending transactions carrying EIP-5792 `batchInfo` for the currently connected connector
**When** `pollPendingBatches` polls the wallet's `getCallsStatus` for those batches
**Then** a status-600 partial revert is finalized as failed with the receipt hash, a receipt-less status-400 failure is finalized as failed with no hash, remaining batches keep processing after one fails, the first receipt is used for atomic execution and the last for non-atomic, and a still-pending status-100 batch is not finalized
