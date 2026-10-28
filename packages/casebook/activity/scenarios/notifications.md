# Activity scenarios — Notifications & toasts

In-app toast notifications (swap confirmed, receive, dapp connected), the
notification watcher that builds them from finalized transactions, and the
runtime push-notification enable/disable setting. Onboarding-time notification
permission prompts are out of scope here (see the `onboarding` area).
The former copy-toast case is merged into `activity-copy-transaction-id`
(history.md). Shared defaults: `_defaults.yaml`. Wallet alias (no secrets):
TW-ACTIVITY-01 (funded, has tx history).

---
id: activity-toaster-swap-confirmed
title: Swap confirmed toast appears after a successful swap
# importance
priority: high
severity: medium
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Toaster - iOS/Android'."
testlioRef: Toaster - iOS/Android
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - notifications
  - toast
  - smoke
wallets:
  - TW-ACTIVITY-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/notifications/components/SwapNotification.tsx
  - packages/wallet/src/features/notifications/notificationWatcherSaga.ts
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** test wallet TW-ACTIVITY-01 completes a swap
**When** the transaction confirms
**Then** a "Swapped" toast is displayed showing the input/output amounts and dollar value (e.g. "Swapped X ETH for $ amount")

---
id: activity-toaster-receive-token
title: Receive toast appears when a wallet receives a token
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Toaster - iOS/Android'. Notification-object construction is unit-tested in builtReceiveNotification.test.ts (see activity-notification-receive-build)."
testlioRef: Toaster - iOS/Android
# scope
platforms:
  - mobile
labels:
  - regression
  - notifications
  - toast
wallets:
  - TW-ACTIVITY-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/notifications/components/TransferCurrencyNotification.tsx
  - packages/wallet/src/features/notifications/buildReceiveNotification.ts
automationRefs: []
---

> **medium · e2e · release · gap**

**Given** test wallet TW-ACTIVITY-01 is active
**When** the wallet receives a token (currency or NFT) from another address
**Then** a receive toast appears with the copy "Received <amount + token or NFT name> from <sender name or shortened address>" and the correct asset logo

---
id: activity-toaster-dapp-connected
title: Dapp connected/confirmed toasts show correct dapp branding
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Toaster - iOS/Android' (dapp connect/confirm steps)."
testlioRef: Toaster - iOS/Android
# scope
platforms:
  - mobile
labels:
  - regression
  - notifications
  - toast
  - dapp
wallets:
  - TW-ACTIVITY-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/notifications/components/DappConnectedNotification.tsx
  - packages/wallet/src/features/notifications/components/ApproveNotification.tsx
automationRefs: []
---

> **medium · e2e · release · gap**

**Given** test wallet TW-ACTIVITY-01 connects to external dapps via WalletConnect
**When** the wallet connects to a dapp and confirms a transaction there (e.g. an approval revoke, or an NFT purchase)
**Then** a "Connected" toast appears with the correct dapp logo and, on confirmation, a "Transaction confirmed" toast referencing that dapp is shown

---
id: activity-toaster-extension
title: Extension toasts for swap, connect, send and network changes
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Toaster - Extension'."
testlioRef: Toaster - Extension
# scope
platforms:
  - extension
labels:
  - regression
  - notifications
  - toast
  - extension
wallets:
  - TW-ACTIVITY-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/notifications/components/SharedNotificationToastRouter.tsx
  - packages/wallet/src/features/notifications/components/NetworkChangedNotification.tsx
automationRefs: []
---

> **medium · e2e · release · gap**

**Given** test wallet TW-ACTIVITY-01 connected in the extension
**When** the user swaps, connects to a dapp, sends on a given network, switches networks, and disconnects
**Then** the correct toast is shown for each action (Swapped, Connected with dapp logo, "Sending on <network>", Disconnected/Connected on network switch)

---
id: activity-push-notifications-enabled
title: Enabling push notifications delivers an OS push on transaction confirm
# importance
priority: high
severity: medium
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Notifications - Enabled/Disabled - iOS/Android' (enable branch). Toggle state logic is unit-tested at hook level in apps/mobile/src/features/notifications/hooks/useNotificationsToggle.test.ts (useAddressNotificationToggle); OS push delivery itself has no same-level automation."
testlioRef: Notifications - Enabled/Disabled - iOS/Android
# scope
platforms:
  - mobile
labels:
  - regression
  - notifications
  - push
wallets:
  - TW-ACTIVITY-01
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/notifications/hooks/useNotificationsToggle.ts
  - apps/mobile/src/features/notifications/hooks/useNotificationOSPermissionsEnabled.ts
  - apps/mobile/src/features/notifications/Onesignal.ts
  - packages/wallet/src/features/wallet/accounts/editAccountSaga.ts
automationRefs: []
---

> **high · e2e · release · manual**

**Given** test wallet TW-ACTIVITY-01 on a device with OS notification permission granted and the per-wallet push notifications setting toggled ON (Settings → wallet → Notifications)
**When** the user backgrounds the app and a transaction for that wallet confirms on chain
**Then** an OS push notification is received describing the confirmed transaction, and tapping it opens the app to the relevant activity

---
id: activity-push-notifications-disabled
title: Disabling push notifications suppresses OS pushes but keeps in-app toasts
# importance
priority: high
severity: medium
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Notifications - Enabled/Disabled - iOS/Android' (disable branch). Toggle state logic is unit-tested at hook level in apps/mobile/src/features/notifications/hooks/useNotificationsToggle.test.ts; push suppression itself has no same-level automation."
testlioRef: Notifications - Enabled/Disabled - iOS/Android
# scope
platforms:
  - mobile
labels:
  - regression
  - notifications
  - push
wallets:
  - TW-ACTIVITY-01
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/notifications/hooks/useNotificationsToggle.ts
  - apps/mobile/src/features/notifications/Onesignal.ts
  - packages/wallet/src/features/wallet/accounts/editAccountSaga.ts
automationRefs: []
---

> **high · e2e · release · manual**

**Given** test wallet TW-ACTIVITY-01 with the per-wallet push notifications setting toggled OFF (or OS notification permission denied)
**When** a transaction for that wallet confirms on chain
**Then** no OS push notification is delivered, in-app toast notifications still appear while the app is foregrounded, and re-enabling the toggle (including via the OS-settings redirect when OS permission was denied) restores push delivery

---
id: activity-notification-watcher-swap-approve-suppression
title: Notification watcher builds swap/approve notifications with dedup
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Backed by notificationWatcherSaga.test.ts (per-type notification build, approve-within-3s-of-swap suppression; test name preserves the repo's 'submited' typo)."
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - notifications
  - watcher
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/notifications/notificationWatcherSaga.ts
automationRefs:
  - path: packages/wallet/src/features/notifications/notificationWatcherSaga.test.ts
    testName: pushTransactionNotification > Suppresses approve notification if a swap was also submited within 3 seconds
---

> **high · unit · pr-check · automated**

**Given** finalized transactions of various types (approve, swap, send, receive, currency, NFT)
**When** `pushTransactionNotification` processes each
**Then** it builds the correct notification per type, and suppresses a standalone approve notification when a swap was submitted within 3 seconds (avoiding duplicate toasts for an approve+swap pair)

---
id: activity-notification-receive-build
title: Receive notification object is built correctly per asset type
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "Backed by builtReceiveNotification.test.ts (file name preserves the repo's 'built' typo)."
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - notifications
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/notifications/buildReceiveNotification.ts
automationRefs:
  - path: packages/wallet/src/features/notifications/builtReceiveNotification.test.ts
    testName: buildReceiveNotification > builds correct notification object for currency receive
---

> **medium · unit · pr-check · automated**

**Given** a finalized transaction that may or may not be a successful receive
**When** `buildReceiveNotification` runs
**Then** it returns undefined for non-successful or non-receive transactions, and builds a correct notification object for currency receives and for NFT receives
