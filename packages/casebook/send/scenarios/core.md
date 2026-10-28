# Send scenarios — Core transfer flow

Core token-transfer flows: amount entry, token selection, review, and on-chain
submission across web, extension, and mobile. Wallet aliases: see `../TEST_WALLETS.md`.
Shared defaults: `_defaults.yaml`.

---
id: send-eth-happy-path-web
title: Send native ETH to a recipient completes on-chain (web)
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
sourceNote: >-
  Web anvil e2e "Send > should send ETH to recipient"
  (apps/web/src/pages/Swap/Send/Send.anvil.e2e.test.ts) exercises the full flow
  including balance assertions; the Testlio "Send - General - Android/iOS" suite
  covers the equivalent manual flow on wallet platforms.
testlioRef: Send - General - Android/iOS
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - send
  - smoke
wallets:
  - TW-SEND-01
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/Swap/Send/
  - packages/wallet/src/features/transactions/send/
automationRefs:
  - path: apps/web/src/pages/Swap/Send/Send.anvil.e2e.test.ts
    testName: Send > should send ETH to recipient
---

> **urgent · e2e · scheduled · automated** · chains: ethereum · wallet: TW-SEND-01

**Given** a connected funded wallet (test wallet TW-SEND-01 holding native ETH on mainnet) on `/send`
**When** the user fills the amount field, enters a recipient address, resolves it (e.g. `hayden.eth`), clicks "Send", clicks "Continue" on the new-address confirmation, and clicks "Confirm send" in the review modal
**Then** the review modal closes, the transfer is submitted and confirmed on-chain, the sender balance decreases by the sent amount plus gas, and the recipient balance increases by the sent amount

---
id: send-eth-self-send-mobile
title: Send ETH to self via the mobile send flow (Maestro)
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
sourceNote: >-
  existing-maestro — apps/mobile/.maestro/flows/send/send-eth-to-self.yaml
  (FLOW_NAME "send-to-self"): recovers the wallet, copies its own address from the
  Receive QR modal, and sends Base ETH to itself, acknowledging the current-wallet
  warning along the way. Renamed from send-token-happy-path-mobile so the id/title
  match the flow's actual native-ETH self-send behavior.
testlioRef: Send - General - Android/iOS
# scope
chains:
  - base
platforms:
  - mobile
labels:
  - regression
  - send
  - smoke
wallets:
  - TW-SEND-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/transactions/send/
  - packages/uniswap/src/features/send/
automationRefs:
  - path: apps/mobile/.maestro/flows/send/send-eth-to-self.yaml
    testName: send-to-self
---

> **urgent · e2e · release · automated** · chains: base · wallet: TW-SEND-01

**Given** a recovered funded wallet (test wallet TW-SEND-01) on the mobile Home tab, with its own address copied from the Receive QR modal
**When** the user taps Send, pastes the wallet's own address into the search input, selects the recipient row, acknowledges the "this is your current wallet" warning, chooses Base ETH in the token selector, enters an amount on the decimal pad, taps "Review transfer", then confirms the send
**Then** the transaction is submitted and the app returns to the Home/Activity tab showing the pending transfer

---
id: send-token-saga-transfer-types
title: sendTokenSaga builds and dispatches transfers for native, ERC-20, ERC-721 and ERC-1155
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
sourceNote: >-
  packages/wallet/src/features/transactions/send/sendTokenSaga.test.ts covers all
  four asset types (native currency, ERC-20, ERC-721, ERC-1155).
# scope
chains:
  - ethereum
platforms:
  - mobile
  - extension
labels:
  - regression
  - send
  - shared
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/transactions/send/sendTokenSaga.ts
automationRefs:
  - path: packages/wallet/src/features/transactions/send/sendTokenSaga.test.ts
    testName: sendTokenSaga > Transfers native currency
  - path: packages/wallet/src/features/transactions/send/sendTokenSaga.test.ts
    testName: sendTokenSaga > Transfers token currency
  - path: packages/wallet/src/features/transactions/send/sendTokenSaga.test.ts
    testName: sendTokenSaga > Transfers ERC721
  - path: packages/wallet/src/features/transactions/send/sendTokenSaga.test.ts
    testName: sendTokenSaga > Transfers ERC1155
---

> **urgent · unit · pr-check · automated** · chains: ethereum

**Given** a send transaction params object for each asset type (native currency, ERC-20, ERC-721, ERC-1155)
**When** `sendTokenSaga` runs
**Then** it constructs the correct transfer transaction request (recipient, token/tokenId/amount, correct contract call) and dispatches it for signing without mutating amounts

---
id: send-insufficient-balance-blocked
title: Send is blocked when the amount exceeds available balance
# importance
priority: urgent
severity: high
# provenance
source: existing-unit
sourceNote: >-
  Covered at two layers by existing unit tests: the form-warning layer
  (useSendWarnings.test.ts "catches insufficient balance errors") and the saga
  layer (sendTokenSaga.test.ts "Fails on insufficient balance"), so an
  under-funded transfer is rejected even if the form gate regresses.
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
  - validation
wallets:
  - TW-SEND-01
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/transactions/send/hooks/useSendWarnings.ts
  - packages/wallet/src/features/transactions/send/sendTokenSaga.ts
automationRefs:
  - path: packages/wallet/src/features/transactions/send/hooks/useSendWarnings.test.ts
    testName: getSendWarnings > catches insufficient balance errors
  - path: packages/wallet/src/features/transactions/send/sendTokenSaga.test.ts
    testName: sendTokenSaga > Fails on insufficient balance
---

> **urgent · unit · pr-check · automated** · chains: ethereum · wallet: TW-SEND-01

**Given** a send form where the entered amount is greater than the wallet's token balance
**When** `getSendWarnings` evaluates the form state (and, if a transfer were still dispatched, `sendTokenSaga` executes it)
**Then** `getSendWarnings` returns an insufficient-balance warning that blocks the review/send action, and `sendTokenSaga` fails rather than submitting an under-funded transfer

---
id: send-review-modal-amount-display
title: Send review shows the correct token and fiat amounts
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: >-
  SendReviewModal.test.tsx render tests cover both fiat-input and token-input
  display modes.
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - send
  - review
wallets:
  - TW-SEND-01
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/pages/Swap/Send/SendReviewModal.tsx
automationRefs:
  - path: apps/web/src/pages/Swap/Send/SendReviewModal.test.tsx
    testName: SendReviewModal > should render input in fiat correctly
  - path: apps/web/src/pages/Swap/Send/SendReviewModal.test.tsx
    testName: SendReviewModal > should render input in token amount correctly
---

> **high · unit · pr-check · automated** · chains: ethereum · wallet: TW-SEND-01

**Given** a send form with an entered amount and a selected recipient
**When** the review modal opens in either fiat-input or token-input mode
**Then** the review displays the correct primary and secondary amounts matching the entered value, so the user confirms the intended transfer amount

---
id: send-amount-fiat-token-toggle
title: Toggling fiat/token input keeps the send amount consistent
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: >-
  SendCurrencyInputForm.test.tsx render tests cover fiat and token-denominated
  input display; the interactive toggle is exercised manually via the Testlio
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
  - form
wallets:
  - TW-SEND-01
# execution
automatable: true
testLevel: unit
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Swap/Send/SendCurrencyInputForm.tsx
automationRefs:
  - path: apps/web/src/pages/Swap/Send/SendCurrencyInputForm.test.tsx
    testName: SendCurrencyInputform > renders input in fiat correctly
  - path: apps/web/src/pages/Swap/Send/SendCurrencyInputForm.test.tsx
    testName: SendCurrencyInputform > renders input in token amount correctly
---

> **medium · unit · release · automated** · chains: ethereum · wallet: TW-SEND-01

**Given** the send currency input form with a token selected
**When** the user toggles between fiat (USD) and token-denominated input
**Then** the displayed input reformats to the active unit while the underlying transfer value stays equivalent, and the secondary label reflects the converted amount

---
id: send-max-amount
title: Max button fills the maximum sendable balance
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  Manual coverage via the Testlio "Send - General - Android/iOS" suite; no
  automated test exercises the Max control in the send form at any level.
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
  - form
wallets:
  - TW-SEND-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Swap/Send/SendCurrencyInputForm.tsx
  - packages/wallet/src/features/transactions/send/SendAmountInput.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum · wallet: TW-SEND-01

**Given** a funded wallet (test wallet TW-SEND-01) with a token selected in the send form
**When** the user taps the "Max" control next to the amount field
**Then** the amount field is populated with the maximum sendable balance (native gas reserved for the native token) and the Review/Send action becomes enabled

---
id: send-extension-flow
title: Send flow works end-to-end from the extension Home tab
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  Manual coverage via the Testlio "Send Flow - Extension" suite. No extension
  send e2e test exists (the blueprint ext_e2e glob
  apps/extension/**/send/**/*.e2e.test.ts matches zero files in the repo).
testlioRef: Send Flow - Extension
# scope
chains:
  - ethereum
platforms:
  - extension
labels:
  - regression
  - send
  - smoke
wallets:
  - TW-SEND-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/send/
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum · wallet: TW-SEND-01

**Given** a funded wallet (test wallet TW-SEND-01) on the extension Home tab
**When** the user clicks Send, enters or selects a recipient, picks a token, enters an amount (or taps Max), clicks Review, and clicks "Confirm send"
**Then** the recipient search shows ENS/address and prior recipients, the review modal shows the amount and a recalculating network cost, and after confirmation an animated pending transaction appears

---
id: send-french-locale-general
title: Send flow renders correctly with the device language set to French
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  Locale variant of the general send suite; backed by the blueprint-listed
  Testlio "Send General - Android/iOS (French)" suite. The Maestro send flow is
  tagged language-agnostic and asserts no localized copy, so localization has no
  automated coverage.
testlioRef: Send General - Android/iOS (French)
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - send
  - localization
wallets:
  - TW-SEND-01
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/send/
  - packages/wallet/src/features/transactions/send/
automationRefs: []
---

> **medium · e2e · release · manual** · chains: ethereum · wallet: TW-SEND-01

**Given** a funded wallet (test wallet TW-SEND-01) on a device whose system language is set to French
**When** the user walks the full send flow — recipient entry, token selection, amount entry (including the fiat/token toggle), review, and confirmation
**Then** all send-flow copy (labels, warnings, speedbumps, buttons) renders in French with no truncated or untranslated strings, the amount input honors French number formatting (comma decimal separator), and the transfer completes exactly as in the general send suite

---
id: send-decimal-pad-caret-position
title: Decimal pad caret stays correctly positioned when typing fast (mobile)
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: >-
  Derived from the caret-positioning fix in apps/mobile/src/features/send/SendTokenForm.tsx
  and the shared packages/uniswap/src/components/CurrencyInputPanel/CurrencyInputPanelInput.tsx
  / DecimalPadInput.tsx — the native caret update now waits for the render that carries the
  value it belongs to (instead of a racy setTimeout + setNativeProps), preventing iOS from
  recomputing a stale cursor position when a keystroke lands before the previous render
  committed. No Testlio counterpart yet.
# scope
platforms:
  - mobile
labels:
  - regression
  - send
  - decimal-pad
  - edge-case
wallets:
  - TW-SEND-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/send/SendTokenForm.tsx
  - packages/uniswap/src/components/CurrencyInputPanel/CurrencyInputPanelInput.tsx
  - packages/uniswap/src/features/transactions/components/DecimalPadInput/
automationRefs: []
---

> **medium · e2e · release · gap** · wallet: TW-SEND-01

**Given** a funded wallet (test wallet TW-SEND-01) on the mobile send amount field
**When** the user taps digits on the decimal pad rapidly — including a tap that inserts or deletes mid-value rather than at the end — faster than a render cycle
**Then** the caret lands at the correct position for the value just entered on every keystroke, and never jumps to the start of the field or to a stale offset left over from the previous value
