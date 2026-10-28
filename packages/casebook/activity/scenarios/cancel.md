# Activity scenarios — Cancel transaction

Cancelling a pending transaction from the Activity surface: classic on-chain
replacement cancels and UniswapX order cancellations, plus the cancel calldata /
gas-fee logic. Funds-movement adjacent — failures here can strand a stuck tx or
leak funds, so happy-path cancels are urgent. Shared defaults: `_defaults.yaml`.
Wallet alias (no secrets): TW-ACTIVITY-01 (funded, has tx history).

---
id: activity-cancel-classic-general
title: Cancel a pending classic transaction from Activity
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Cancel Tx - General - iOS/Android'."
testlioRef: Cancel Tx - General - iOS/Android
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - activity
  - cancel
  - smoke
wallets:
  - TW-ACTIVITY-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/components/cancel/CancelConfirmationView.tsx
  - packages/uniswap/src/features/transactions/hooks/useIsCancelable.ts
  - packages/wallet/src/features/transactions/cancelTransactionSaga.ts
automationRefs: []
---

> **urgent · e2e · release · gap** · chains: ethereum

**Given** test wallet TW-ACTIVITY-01 has a pending swap showing a spinner in the Activity tab
**When** the user opens the pending transaction, taps "Cancel transaction", reviews the "Cancel this Transaction?" modal (which shows the network cost), and taps "Confirm"
**Then** biometric auth triggers (if enabled), the transaction header changes to "Pending cancellation" with a spinner in the Activity list, and the transaction hash row opens a block explorer

---
id: activity-cancel-uniswapx
title: Cancel a pending UniswapX order from Activity
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Cancel Tx UniswapX - iOS/Android'. Cancellation calldata construction is unit-tested in cancelOrderFactory.test.ts (see activity-cancel-order-factory-build)."
testlioRef: Cancel Tx UniswapX - iOS/Android
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - activity
  - cancel
  - uniswapx
wallets:
  - TW-ACTIVITY-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/cancel/cancelOrderFactory.ts
  - packages/uniswap/src/features/transactions/cancel/getCancelOrderTxRequest.ts
  - packages/uniswap/src/features/transactions/components/cancel/CancelConfirmationView.tsx
automationRefs: []
---

> **urgent · e2e · release · gap** · chains: ethereum

**Given** test wallet TW-ACTIVITY-01 has a pending UniswapX order in the Activity tab
**When** the user opens the pending transaction, selects "Cancel Transaction" from the overflow menu, and confirms in the cancellation modal
**Then** the UniswapX order is cancelled without error, the pending spinner clears, and the activity row title changes to "Swap canceled"

---
id: activity-cancel-extension
title: Cancel a pending transaction from the extension Activity tab
# importance
priority: urgent
severity: high
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Activity Tab - Extension' (cancel steps)."
testlioRef: Activity Tab - Extension
# scope
chains:
  - ethereum
platforms:
  - extension
labels:
  - regression
  - activity
  - cancel
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
  - packages/uniswap/src/features/transactions/components/cancel/CancelConfirmationView.tsx
automationRefs: []
---

> **urgent · e2e · release · gap** · chains: ethereum

**Given** test wallet TW-ACTIVITY-01 has submitted a swap in the extension and opens the pending transaction in the Activity tab
**When** the user taps "Cancel Transaction" and completes the "Cancel this transaction" modal
**Then** the header reads "Swap pending" with a Cancel Transaction CTA before cancelling, and after confirming a cancel-pending toast is shown

---
id: activity-cancel-order-factory-build
title: Cancel order factory builds valid single and batch cancellations
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Backed by cancelOrderFactory.test.ts (buildSingleCancellation, buildBatchCancellation, error handling)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - activity
  - cancel
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/cancel/cancelOrderFactory.ts
  - packages/uniswap/src/features/transactions/cancel/cancelMultipleOrders.ts
automationRefs:
  - path: packages/uniswap/src/features/transactions/cancel/cancelOrderFactory.test.ts
    testName: cancelOrderFactory > buildBatchCancellation > should build batch cancellation for multiple orders
---

> **high · unit · pr-check · automated**

**Given** one or more UniswapX orders to cancel
**When** the cancel order factory builds the cancellation request
**Then** a single order yields a valid single-cancellation tx (null when parsing or nonce extraction fails), multiple orders yield a batch cancellation with correct word/mask pairs, invalid orders are filtered out, and an empty array returns null

---
id: activity-cancellation-gas-fee
title: Cancellation gas fee is computed for a replacement cancel
# importance
priority: high
severity: medium
# provenance
source: existing-unit
sourceNote: "Backed by useCancellationGasFeeInfo.test.ts (classic cancellations and UniswapX orders; describe-level ref)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - activity
  - cancel
  - gas
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/gas/hooks/useCancellationGasFeeInfo.ts
  - packages/uniswap/src/features/gas/utils/cancel.ts
automationRefs:
  - path: packages/uniswap/src/features/gas/hooks/useCancellationGasFeeInfo.test.ts
    testName: useCancellationGasFeeInfo
---

> **high · unit · pr-check · automated**

**Given** a pending cancelable transaction
**When** the cancellation gas-fee hook computes the cost of the replacement cancel transaction
**Then** it returns a gas fee estimate consistent with the cancel calldata so the confirmation modal can display an accurate network cost
