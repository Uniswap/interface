# Activity scenarios — Pending transaction status

Pending/queued transaction indicators and the on-chain transaction watcher that
drives status transitions (pending → confirmed / failed / stuck), including the
fiat on-ramp purchase watcher (the FOR purchase *flow* itself belongs to the
fiat_onramp area; only the activity-status watching lives here). Shared defaults:
`_defaults.yaml`. Wallet alias (no secrets): TW-ACTIVITY-01 (funded, has tx history).

---
id: activity-pending-two-concurrent-swaps
title: Two concurrent swaps both show pending then confirm
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Pending Tx - iOS/Android'."
testlioRef: Pending Tx - iOS/Android
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - activity
  - pending
  - smoke
wallets:
  - TW-ACTIVITY-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/activity/
  - packages/wallet/src/features/transactions/watcher/watchTransactionSaga.ts
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** test wallet TW-ACTIVITY-01 with an ETH → USDC swap staged
**When** the user submits two swap transactions in quick succession and opens the Activity tab
**Then** a spinner appears next to the Activity tab, a "Pending" section shows both transactions in submission order each with a pending spinner, and after confirmation the spinners clear and both transactions move to the confirmed (Today) section

---
id: activity-pending-queued-extension
title: Second concurrent swap shows Queued state on extension
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Activity Tab - Extension' (queued pending steps)."
testlioRef: Activity Tab - Extension
# scope
chains:
  - ethereum
platforms:
  - extension
labels:
  - regression
  - activity
  - pending
  - extension
wallets:
  - TW-ACTIVITY-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/components/tabs/ActivityTab.tsx
  - packages/uniswap/src/features/activity/
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** test wallet TW-ACTIVITY-01 connected in the extension
**When** the user submits two swaps in quick succession and opens the Activity tab
**Then** the Activity spinner shows a "2" badge, the first tx spins as pending while the second shows a "Queued" label with an empty spinner; when the first completes it moves to "Today" and the second begins spinning, then also completes and moves to "Today"

---
id: activity-pending-watcher-finalizes-confirmed
title: Transaction watcher finalizes a successful on-chain transaction
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
sourceNote: "Backed by watchOnChainTransactionSaga.test.ts ('Finalizes successful transaction'). Nonce-superseded invalidation is asserted by the separate activity-pending-nonce-invalidation-on-backgrounding case."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - activity
  - pending
  - watcher
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/transactions/watcher/watchOnChainTransactionSaga.ts
automationRefs:
  - path: packages/wallet/src/features/transactions/watcher/watchOnChainTransactionSaga.test.ts
    testName: watchTransaction > Finalizes successful transaction
---

> **urgent · unit · pr-check · automated**

**Given** a pending transaction is being watched on chain
**When** the provider returns a successful receipt
**Then** the watcher finalizes the transaction to Success with the receipt attached

---
id: activity-pending-stuck-poll-exhaustion
title: Stuck classic transaction emits PendingTransactionStuck after polling
# importance
priority: urgent
severity: high
# provenance
source: existing-unit
sourceNote: "Backed by watchTransactionSaga.test.ts (waitForTransactionStatus poll-exhaustion cases)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - activity
  - pending
  - watcher
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/transactions/watcher/watchTransactionSaga.ts
automationRefs:
  - path: packages/wallet/src/features/transactions/watcher/watchTransactionSaga.test.ts
    testName: waitForTransactionStatus > emits PendingTransactionStuck (poll_exhausted) for a classic tx when polling exhausts
---

> **urgent · unit · pr-check · automated**

**Given** a classic pending transaction that never confirms
**When** `waitForTransactionStatus` polls to exhaustion (10 polls for classic, 20 for UserOps)
**Then** a PendingTransactionStuck (poll_exhausted) event is emitted for the classic tx, while a non-classic tx does not emit the stuck event under the same exhaustion

---
id: activity-pending-nonce-invalidation-on-backgrounding
title: Stale pending transaction invalidated when nonce is reused
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Backed by watchOnChainTransactionSaga.test.ts (same-nonce invalidation, bridge-send same-nonce case)."
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - activity
  - pending
  - watcher
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/transactions/watcher/watchOnChainTransactionSaga.ts
automationRefs:
  - path: packages/wallet/src/features/transactions/watcher/watchOnChainTransactionSaga.test.ts
    testName: watchTransaction > Invalidates stale transaction when another transaction with same nonce is finalized
---

> **high · unit · pr-check · automated**

**Given** a pending transaction whose nonce is later consumed by a different finalized transaction (or a bridge send confirmed on the same nonce)
**When** the watcher re-checks state (including after the app is backgrounded while pending)
**Then** the stale transaction is invalidated rather than left spinning, and app-backgrounded state updates are applied to the watched transaction

---
id: activity-tx-watcher-orchestration
title: Transaction watcher orchestrates per-transaction watchers on startup
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Backed by transactionWatcherSaga.test.ts — the top-level watcher orchestration suite, previously uncited despite packages/wallet/src/features/transactions/watcher/ being a blueprint code_path."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - activity
  - pending
  - watcher
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/transactions/watcher/transactionWatcherSaga.ts
automationRefs:
  - path: packages/wallet/src/features/transactions/watcher/transactionWatcherSaga.test.ts
    testName: transactionWatcher > Triggers watchers successfully
---

> **high · unit · pr-check · automated**

**Given** the app starts with pending transactions in state (including a private-pending subset)
**When** the top-level `transactionWatcher` saga initializes
**Then** it triggers a watcher for each pending transaction successfully and emits the startup backlog census with the correct private-pending subset count

---
id: activity-fiat-onramp-tx-watcher
title: Fiat on-ramp purchase watcher updates and prunes FOR transactions
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "Backed by watchFiatOnRampSaga.test.ts. Scope note: the FOR purchase flow itself belongs to the fiat_onramp area; this case covers only the activity-status watching under the blueprint code_path packages/wallet/src/features/transactions/watcher/."
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - activity
  - pending
  - watcher
  - fiat-onramp
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/transactions/watcher/watchFiatOnRampSaga.ts
automationRefs:
  - path: packages/wallet/src/features/transactions/watcher/watchFiatOnRampSaga.test.ts
    testName: watchFiatOnRampTransaction > removes transactions on 404 when stale
---

> **medium · unit · pr-check · automated**

**Given** a pending fiat on-ramp purchase transaction is being watched
**When** the FOR status endpoint responds
**Then** a successful response updates the transaction's status in activity, a 404 for a stale transaction removes it from the list, and a 404 for a not-yet-stale transaction keeps it pending (including when the fetch is forced)
