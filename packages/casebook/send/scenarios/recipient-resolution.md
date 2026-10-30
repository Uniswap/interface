# Send scenarios — Recipient resolution

Resolving and validating the transfer recipient: raw addresses, ENS names, unitags,
and recently-used recipients. Wallet aliases: see `../TEST_WALLETS.md`.
Shared defaults: `_defaults.yaml`.

---
id: send-recipient-address-input
title: Recipient input accepts and validates a raw address
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: >-
  SendRecipientForm.test.tsx render tests cover the placeholder and
  no-verified-recipient states.
testlioRef: Send - General - Android/iOS
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - send
  - recipient
wallets:
  - TW-SEND-02
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/pages/Swap/Send/SendRecipientForm.tsx
automationRefs:
  - path: apps/web/src/pages/Swap/Send/SendRecipientForm.test.tsx
    testName: SendRecipientForm > should render placeholder values
  - path: apps/web/src/pages/Swap/Send/SendRecipientForm.test.tsx
    testName: SendRecipientForm > should render correctly with no verified recipient
---

> **high · unit · pr-check · automated** · chains: ethereum · wallet: TW-SEND-02

**Given** the send recipient form with the "address or ENS" placeholder shown
**When** the user enters a valid recipient address (recipient test wallet TW-SEND-02)
**Then** the entered recipient is displayed, and until a recipient is verified the form reflects the "no verified recipient" state (Send/Review not yet armed)

---
id: send-recipient-ens-resolution
title: ENS name resolves to a verified recipient
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: >-
  The web anvil e2e "Send > should send ETH to recipient" enters an address,
  selects the resolved "hayden.eth" suggestion, and proceeds only once the
  recipient is validated. Supporting unit render coverage exists below this
  case's e2e level: SendRecipientForm.test.tsx "should render correctly with
  verified recipient" (cited here rather than in automationRefs because it is
  unit-level).
testlioRef: Send Flow - Extension
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
  - recipient
  - ens
wallets:
  - TW-SEND-02
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/Swap/Send/SendRecipientForm.tsx
  - packages/uniswap/src/features/ens/
automationRefs:
  - path: apps/web/src/pages/Swap/Send/Send.anvil.e2e.test.ts
    testName: Send > should send ETH to recipient
---

> **high · e2e · scheduled · automated** · chains: ethereum · wallet: TW-SEND-02

**Given** the send recipient form
**When** the user types an ENS name (e.g. `hayden.eth`) and selects the resolved suggestion
**Then** the recipient resolves to its underlying address, the verified-recipient state is shown, and the Send/Review action is enabled against the resolved address

---
id: send-recipient-unitag
title: Recipient displays correctly when resolved to a unitag
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: >-
  SendRecipientForm.test.tsx "should render correctly with unitag".
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
  - recipient
  - unitag
wallets:
  - TW-SEND-02
# execution
automatable: true
testLevel: unit
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Swap/Send/SendRecipientForm.tsx
automationRefs:
  - path: apps/web/src/pages/Swap/Send/SendRecipientForm.test.tsx
    testName: SendRecipientForm > should render correctly with unitag
---

> **medium · unit · release · automated** · chains: ethereum · wallet: TW-SEND-02

**Given** the send recipient form with a recipient that has a unitag (recipient test wallet TW-SEND-02)
**When** the recipient is resolved
**Then** the form renders the unitag identity (name and avatar) for the verified recipient rather than a bare address

---
id: send-recent-transfers-suggestions
title: Recent-transfer recipients are surfaced, deduped and checksummed
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: >-
  useRecentTransfersByAddress.test.ts covers checksumming, ordering, counts, and
  the invalid-address fallback in one comprehensive test.
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
  - recipient
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/send/useRecentTransfersByAddress.ts
automationRefs:
  - path: packages/uniswap/src/features/send/useRecentTransfersByAddress.test.ts
    testName: useRecentTransfersByAddress > returns checksummed recipients while preserving order, counts, and invalid-address fallback
---

> **medium · unit · pr-check · automated** · chains: ethereum

**Given** a transfer history containing repeated and mixed-case recipient addresses (and an invalid entry)
**When** `useRecentTransfersByAddress` derives the recent-recipient list
**Then** it returns checksummed addresses preserving first-seen order and occurrence counts, and falls back safely on invalid addresses without dropping the list

---
id: send-incomplete-form-warnings
title: Send is gated until recipient and amount are both provided
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: >-
  useSendWarnings.test.ts covers both incomplete-form branches (missing
  recipient, missing amount).
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
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/transactions/send/hooks/useSendWarnings.ts
automationRefs:
  - path: packages/wallet/src/features/transactions/send/hooks/useSendWarnings.test.ts
    testName: "getSendWarnings > catches incomplete form errors: no recipient"
  - path: packages/wallet/src/features/transactions/send/hooks/useSendWarnings.test.ts
    testName: "getSendWarnings > catches incomplete form errors: no amount"
---

> **medium · unit · pr-check · automated** · chains: ethereum

**Given** a partially-filled send form (missing recipient, or missing amount)
**When** `getSendWarnings` evaluates the form
**Then** it returns the corresponding incomplete-form warning so the Review/Send action stays disabled until both recipient and amount are present
