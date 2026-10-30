# Send scenarios — Safety speedbumps & gating

Guardrails that protect funds before a transfer is submitted: new-address, self-send
and smart-contract speedbumps, permissioned-token allowlist gating, offline gating,
and insufficient-gas copy. Wallet aliases: see `../TEST_WALLETS.md`.
Shared defaults: `_defaults.yaml`.

---
id: send-new-address-speedbump
title: New-address speedbump warns before sending to an unseen recipient
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: >-
  The web anvil e2e "Send > should send ETH to recipient" clicks "Continue" on
  the new-address confirmation before reaching review, so the trigger/proceed
  behavior is verified at e2e level. Supporting unit render coverage below this
  case's level: NewAddressSpeedBump.test.tsx "NewAddressSpeedBumpModal > should
  not render AccountIcon if account has no ENS avatar/unitag pp" (cited here
  rather than in automationRefs because it is unit-level).
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - send
  - speedbump
  - safety
wallets:
  - TW-SEND-01
  - TW-SEND-02
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/Swap/Send/NewAddressSpeedBump.tsx
automationRefs:
  - path: apps/web/src/pages/Swap/Send/Send.anvil.e2e.test.ts
    testName: Send > should send ETH to recipient
---

> **high · e2e · scheduled · automated** · chains: ethereum · wallets: TW-SEND-01, TW-SEND-02

**Given** a funded wallet (TW-SEND-01) sending to a recipient (TW-SEND-02) it has not transacted with before
**When** the user clicks "Send"
**Then** a new-address confirmation speedbump is shown (rendering an account icon only when an ENS avatar / unitag picture exists), and the transfer proceeds to review only after the user clicks "Continue"

---
id: send-self-send-speedbump
title: Self-send speedbump modal renders its warning content correctly
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: >-
  Render-only unit coverage: SelfSendSpeedBump.test.tsx "should render
  correctly" verifies the modal's content, not its trigger. The trigger/blocking
  behavior — the modal appearing when the recipient equals the sender and
  submission proceeding only after explicit confirmation — has no automated test
  at that level; it is exercised manually via the Testlio
  "Send - General - Android/iOS" suite and, on mobile, by the Maestro self-send
  flow's current-wallet-warning acknowledgment step
  (apps/mobile/.maestro/flows/send/send-eth-to-self.yaml).
testlioRef: Send - General - Android/iOS
# scope
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - send
  - speedbump
  - safety
wallets:
  - TW-SEND-01
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/pages/Swap/Send/SelfSendSpeedBump.tsx
automationRefs:
  - path: apps/web/src/pages/Swap/Send/SelfSendSpeedBump.test.tsx
    testName: SelfSendSpeedBumpModal > should render correctly
---

> **high · unit · pr-check · automated** · chains: ethereum · wallet: TW-SEND-01

**Given** the self-send speedbump modal for a recipient equal to the connected wallet's own address (TW-SEND-01)
**When** the modal is rendered
**Then** it renders the "this is your current wallet" warning copy with its confirm and cancel actions correctly (the runtime trigger/blocking behavior is covered manually — see sourceNote)

---
id: send-smart-contract-speedbump
title: Smart-contract speedbump modal renders its warning content correctly
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: >-
  Render-only unit coverage: SmartContractSpeedbump.test.tsx "should render
  correctly" verifies the modal's content, not its trigger. The trigger/blocking
  behavior — the modal appearing when the entered recipient resolves to a
  smart-contract address and confirmation being required before submission — has
  no automated test at that level; it is exercised manually via the Testlio
  "Send - General - Android/iOS" suite.
testlioRef: Send - General - Android/iOS
# scope
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - send
  - speedbump
  - safety
wallets:
  - TW-SEND-01
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/pages/Swap/Send/SmartContractSpeedBump.tsx
automationRefs:
  - path: apps/web/src/pages/Swap/Send/SmartContractSpeedbump.test.tsx
    testName: SmartContractSpeedBumpModal > should render correctly
---

> **high · unit · pr-check · automated** · chains: ethereum · wallet: TW-SEND-01

**Given** the smart-contract speedbump modal for a recipient that resolves to a smart-contract address (e.g. a token contract pasted into the recipient field)
**When** the modal is rendered
**Then** it renders the "token address detected" warning copy with its confirm and cancel actions correctly, guarding against sending funds to a contract by mistake (the runtime trigger/blocking behavior is covered manually — see sourceNote)

---
id: send-permissioned-token-gating
title: Permissioned-token send is gated by sender and recipient allowlist
# importance
priority: urgent
severity: high
# provenance
source: existing-unit
sourceNote: >-
  useIsPermissionedSendBlocked.test.ts covers the recipient/sender block matrix,
  self-sends, native-token exemption, and the in-flight loading state; the web
  SendForm and extension SendFormScreen unit tests verify the banner/Review
  gating UI on each platform.
testlioRef: Send - General - Android/iOS
# scope
chains:
  - ethereum
platforms:
  - web
  - extension
labels:
  - regression
  - send
  - compliance
  - gating
wallets:
  - TW-SEND-03
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/permissionedTokens/useIsPermissionedSendBlocked.ts
  - apps/web/src/pages/Swap/Send/SendForm.tsx
  - apps/extension/src/app/features/send/SendFormScreen/SendFormScreen.tsx
automationRefs:
  - path: packages/uniswap/src/features/permissionedTokens/useIsPermissionedSendBlocked.test.ts
    testName: useIsPermissionedSendBlocked > blocks when the token is permissioned and the recipient is not allowlisted
  - path: packages/uniswap/src/features/permissionedTokens/useIsPermissionedSendBlocked.test.ts
    testName: useIsPermissionedSendBlocked > blocks with reason "sender" when the holder is no longer allowlisted, even to an allowlisted recipient
  - path: packages/uniswap/src/features/permissionedTokens/useIsPermissionedSendBlocked.test.ts
    testName: useIsPermissionedSendBlocked > reports loading (without blocking) while the recipient allowlist check is in flight
  - path: apps/web/src/pages/Swap/Send/SendForm.test.tsx
    testName: "SendForm: permissioned gating (sender + recipient allowlist) > shows the recipient-not-allowlisted banner and disables Review when Send is blocked"
  - path: apps/extension/src/app/features/send/SendFormScreen/SendFormScreen.test.tsx
    testName: SendFormScreen — permissioned-token gating > wraps the Review button with PermissionedTokenTooltip when Send is blocked for a permissioned token
---

> **urgent · unit · pr-check · automated** · chains: ethereum · wallet: TW-SEND-03

**Given** a wallet holding a permissioned (allowlist-gated) token (TW-SEND-03)
**When** the recipient is not allowlisted, or the sender is no longer allowlisted (even to an allowlisted recipient)
**Then** `useIsPermissionedSendBlocked` reports the block with the correct reason, the appropriate not-allowlisted banner is shown, and the Review/Send action is disabled; while the allowlist check is still in flight the hook reports loading without blocking; native-token sends, non-permissioned tokens, and allowlisted self-sends are NOT blocked

---
id: send-offline-blocked
title: Send is gated with a network warning while the app is offline
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: >-
  useSendWarnings.test.ts covers both branches: "errors if there is no internet"
  (offline: true produces a network warning) and "does not error when offline is
  false". Added from the review's coverage pass — offline gating previously had
  no case.
# scope
chains:
  - ethereum
platforms:
  - mobile
  - extension
labels:
  - regression
  - send
  - validation
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/transactions/send/hooks/useSendWarnings.ts
automationRefs:
  - path: packages/wallet/src/features/transactions/send/hooks/useSendWarnings.test.ts
    testName: getSendWarnings > errors if there is no internet
  - path: packages/wallet/src/features/transactions/send/hooks/useSendWarnings.test.ts
    testName: getSendWarnings > does not error when offline is false
---

> **medium · unit · pr-check · automated** · chains: ethereum

**Given** a completed send form (recipient and amount provided) while the device has no internet connection
**When** `getSendWarnings` evaluates the form with `offline: true`
**Then** it returns a network-error warning that gates submission until connectivity returns, and with `offline: false` no network warning is produced

---
id: send-insufficient-gas-copy
title: Review button switches to insufficient-funds copy when gas is short
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: >-
  ReviewButton.test.tsx covers both the insufficient-funds copy swap and the
  blocking-warning disable override.
# scope
chains:
  - ethereum
platforms:
  - extension
labels:
  - regression
  - send
  - validation
wallets:
  - TW-SEND-01
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/extension/src/app/features/send/SendFormScreen/ReviewButton.tsx
automationRefs:
  - path: apps/extension/src/app/features/send/SendFormScreen/ReviewButton.test.tsx
    testName: ReviewButton > swaps the button copy to the insufficient-funds key when an InsufficientGasFunds warning is present
  - path: apps/extension/src/app/features/send/SendFormScreen/ReviewButton.test.tsx
    testName: ReviewButton > disables the button when warnings.blockingWarning is set, even if the disabled prop is false
---

> **medium · unit · pr-check · automated** · chains: ethereum · wallet: TW-SEND-01

**Given** the extension send form where the wallet lacks enough native token to cover gas
**When** an InsufficientGasFunds warning is present
**Then** the review button copy switches to the insufficient-funds message and the button is disabled whenever a blocking warning is set, regardless of the passed `disabled` prop
