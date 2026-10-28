# Activity scenarios — Transaction history

Activity tab / transaction history list: rendering, pagination, local+remote merge,
transaction-detail modals, plan-details extraction, empty state. Shared defaults:
`_defaults.yaml`. Wallet aliases (no secrets): TW-ACTIVITY-01 (funded, has tx history),
TW-ACTIVITY-02 (fresh, no history).

---
id: activity-history-list-general
title: Activity tab renders confirmed transaction history
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Activity General - Android/iOS'. No same-level e2e automation exists for the Activity list; hook-level rendering logic is unit-tested in useFormattedTransactionDataForActivity.test.ts (section data structure)."
testlioRef: Activity General - Android/iOS
# scope
chains:
  - ethereum
platforms:
  - mobile
  - extension
labels:
  - regression
  - activity
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
  - packages/wallet/src/features/activity/useActivityDataWallet.tsx
  - apps/extension/src/app/components/tabs/ActivityTab.tsx
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** test wallet TW-ACTIVITY-01 (funded, with prior confirmed transactions) is set up and the user opens the Activity tab
**When** the transaction list renders
**Then** past transactions are grouped by date (e.g. a "Today" section), each row shows the correct type label (Swapped / Approved / Sent / Received), token quantity and dollar value, and rows are ordered newest-first

---
id: activity-history-load-more-pagination
title: Activity list paginates older transactions on scroll
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Activity General - Android/iOS' covers the manual scroll pass; the fetch-next-page state is unit-tested in both the formatting hook and the consuming useActivityData hook."
testlioRef: Activity General - Android/iOS
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - activity
  - pagination
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/activity/hooks/useFormattedTransactionDataForActivity.ts
  - packages/uniswap/src/features/activity/hooks/useActivityData.tsx
automationRefs:
  - path: packages/uniswap/src/features/activity/hooks/useFormattedTransactionDataForActivity.test.ts
    testName: useFormattedTransactionDataForActivity > loading states > should handle fetching next page state
  - path: packages/uniswap/src/features/activity/hooks/useActivityData.test.tsx
    testName: useActivityData > loading states > should handle fetching next page state
---

> **medium · unit · pr-check · automated**

**Given** the user is on the Activity tab and scrolls to the bottom of the current transaction list
**When** the end of the loaded page is reached
**Then** the activity hook reports a fetching-next-page loading state, the next page is fetched, and older transactions append below the existing ones without duplicating rows

---
id: activity-merge-local-remote-transactions
title: Local and remote transactions merge without duplication
# importance
priority: urgent
severity: high
# provenance
source: existing-unit
sourceNote: "Backed by useMergeLocalAndRemoteTransactions.test.ts (same-hash remote/local precedence, finalizeTransaction dispatch, different-hash retention)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - activity
  - shared
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/activity/hooks/useMergeLocalAndRemoteTransactions.ts
automationRefs:
  - path: packages/uniswap/src/features/activity/hooks/useMergeLocalAndRemoteTransactions.test.ts
    testName: useMergeLocalAndRemoteTransactions > when transactions have the same hash > should use remote data when remote transaction is successful
---

> **urgent · unit · pr-check · automated**

**Given** a local pending transaction and a remote (indexed) transaction share the same hash
**When** the merge hook combines local and remote activity
**Then** the remote record wins when it is successful, the local record wins when the remote reports failure, a `finalizeTransaction` is dispatched when the local tx is unfinalized but the remote is final, and transactions with different hashes are both kept (no duplicate rows)

---
id: activity-empty-state-no-transactions
title: Empty activity state shown for a wallet with no transactions
# importance
priority: low
severity: low
# provenance
source: testlio
sourceNote: "Testlio wallet exploratory case '[Exploratory] App - No transactions.'. Hook-level empty-state handling is unit-tested in useActivityData.test.tsx (empty states)."
testlioRef: '[Exploratory] App - No transactions.'
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - activity
  - empty-state
wallets:
  - TW-ACTIVITY-02
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/activity/
  - apps/extension/src/app/components/tabs/ActivityTab.tsx
automationRefs: []
---

> **low · e2e · release · gap**

**Given** test wallet TW-ACTIVITY-02 (fresh, zero transaction history) is connected and the user opens the Activity tab
**When** the tab loads with no transactions available
**Then** the empty-state placeholder is displayed (no rows, no spinner) and the app does not error or show a stuck loading indicator

---
id: activity-swap-detail-modal
title: Swap transaction detail modal shows accurate trade data
# importance
priority: high
severity: medium
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Activity General - Android/iOS' (swap detail steps)."
testlioRef: Activity General - Android/iOS
# scope
chains:
  - ethereum
platforms:
  - mobile
  - extension
labels:
  - regression
  - activity
wallets:
  - TW-ACTIVITY-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/activity/parse/
  - packages/uniswap/src/features/activity/utils/getTransactionSummaryTitle.ts
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** test wallet TW-ACTIVITY-01 with a completed swap in its history
**When** the user taps the swap row in the Activity tab
**Then** a "Swapped" detail modal opens showing input/output quantities and dollar values with both token logos, and an expandable "Show more" section revealing Network cost, Transaction hash (external link), Submitted-on date, and the executed rate

---
id: activity-bridge-detail-modal
title: Bridge transaction detail modal shows source and destination chains
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Activity General - Android/iOS' (bridge detail steps); plan-details extraction feeding this modal is unit-tested (see activity-plan-details-extraction)."
testlioRef: Activity General - Android/iOS
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - activity
  - bridge
wallets:
  - TW-ACTIVITY-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/activity/parse/
  - packages/uniswap/src/features/activity/extract/extractPlanDetails.ts
automationRefs: []
---

> **medium · e2e · release · gap**

**Given** test wallet TW-ACTIVITY-01 with a completed bridge transaction in its history
**When** the user opens that transaction from the Activity tab
**Then** the detail modal shows the bridge icon, the source and destination chains (e.g. Optimism to Arbitrum), the token quantity and dollar value, Network cost, Transaction hash, and Submitted-on date

---
id: activity-copy-transaction-id
title: Copy Transaction ID shows a copied toast that auto-dismisses
# importance
priority: low
severity: low
# provenance
source: testlio
sourceNote: "Merged from the former notification-copy-toast case (same flow). Testlio wallet suites 'Activity General - Android/iOS' (mobile) and 'Activity Tab - Extension' (extension) both cover the copy action."
testlioRef: Activity General - Android/iOS
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - activity
  - toast
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/activity/parse/
  - packages/wallet/src/features/notifications/components/
automationRefs: []
---

> **low · e2e · release · gap**

**Given** the user has a transaction detail modal open from the Activity tab
**When** they open the overflow ("…") menu and tap "Copy Transaction ID"
**Then** the menu dismisses, a "Copied" toast appears at the top identifying the transaction ID as copied, the toast auto-dismisses after ~1.5 seconds, and the clipboard contains the transaction hash

---
id: activity-tab-extension-full-flow
title: Extension Activity tab renders, filters and links transactions
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Activity Tab - Extension'."
testlioRef: Activity Tab - Extension
# scope
platforms:
  - extension
labels:
  - regression
  - activity
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

> **high · e2e · release · gap**

**Given** test wallet TW-ACTIVITY-01 is connected in the extension with mixed transaction history (approve, revoke, remove-liquidity, swap)
**When** the user scrolls the Activity list and opens a swap transaction
**Then** the list scrolls smoothly, each row shows the correct label (Approved / Transaction confirmed / Removed Liquidity / Swapped), the swap modal shows accurate quantities, dollar values and rate under "Show more", the transaction hash opens a block explorer, and tapping a token row navigates to that token's detail page

---
id: activity-transaction-summary-title
title: Transaction summary titles map correctly per status and type
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "Backed by getTransactionSummaryTitle.test.ts (Earn-plan interrupted titles, canonical fallbacks, flag-gated generic titles)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - activity
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/activity/utils/getTransactionSummaryTitle.ts
automationRefs:
  - path: packages/uniswap/src/features/activity/utils/getTransactionSummaryTitle.test.ts
    testName: getTransactionSummaryTitle - Earn plans > uses Earn-specific interrupted titles for interrupted Earn plans
---

> **medium · unit · pr-check · automated**

**Given** a transaction detail with a given type and status (e.g. an interrupted Earn plan, or a status with no dedicated title)
**When** `getTransactionSummaryTitle` computes the row title
**Then** it returns the type/status-specific title, falls back to the canonical interrupted title where no dedicated title exists, and uses generic plan titles when the Earn activity display flag is disabled

---
id: activity-filter-limit-orders
title: Limit orders are filtered out of the standard activity list
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "Backed by useFormattedTransactionDataForActivity.test.ts (limit order filtering)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - activity
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/activity/hooks/useFormattedTransactionDataForActivity.ts
automationRefs:
  - path: packages/uniswap/src/features/activity/hooks/useFormattedTransactionDataForActivity.test.ts
    testName: useFormattedTransactionDataForActivity > limit order filtering > should filter out limit orders
---

> **medium · unit · pr-check · automated**

**Given** a transaction set that includes limit orders alongside regular transactions
**When** the activity data hook formats the list
**Then** limit orders are excluded from the standard activity feed and only regular transactions remain

---
id: activity-filter-by-chain
title: Activity list filters transactions by selected chains
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "Backed by useFormattedTransactionDataForActivity.test.ts (chainId filtering)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - activity
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/activity/hooks/useFormattedTransactionDataForActivity.ts
automationRefs:
  - path: packages/uniswap/src/features/activity/hooks/useFormattedTransactionDataForActivity.test.ts
    testName: useFormattedTransactionDataForActivity > chainId filtering > should filter transactions by chainIds when provided
---

> **medium · unit · pr-check · automated**

**Given** a set of transactions across multiple chains
**When** the activity hook is given a `chainIds` filter (and separately, `undefined`)
**Then** only transactions on the provided chains are returned when a filter is set, and all transactions are returned when the filter is undefined

---
id: activity-plan-details-extraction
title: Plan details are extracted correctly from DAPI plan responses
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "Backed by the packages/uniswap/src/features/activity/extract/ test suite (extractPlanDetails, extractPlanResponseDetails, extractPlanUtils, conversionRest) — previously uncited despite extract/extractPlanDetails.ts appearing as a code_path on the bridge detail case."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - activity
  - plans
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/activity/extract/extractPlanDetails.ts
  - packages/uniswap/src/features/activity/extract/extractPlanResponseDetails.ts
  - packages/uniswap/src/features/activity/extract/extractPlanUtils.ts
automationRefs:
  - path: packages/uniswap/src/features/activity/extract/extractPlanDetails.test.ts
    testName: extractPlanDetails > maps DAPI Earn deposit metadata and vault deposit steps
  - path: packages/uniswap/src/features/activity/extract/extractPlanResponseDetails.test.ts
    testName: extractPlanResponseDetails
---

> **medium · unit · pr-check · automated**

**Given** a DAPI plan response (e.g. an Earn deposit or withdraw plan) returned for the activity feed
**When** the extract layer maps it to transaction details
**Then** Earn deposit/withdraw metadata and vault steps are mapped to the correct fields, non-Earn plan metadata is left unset, and plan responses convert into well-formed `TransactionDetails` objects for rendering
