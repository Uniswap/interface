# Smart Wallet scenarios — Manage delegations (settings)

The Advanced → Smart wallet settings screen: the Inactive / Active / Unavailable / Action-required
sections, enabling, and disabling (including the on-chain reset-to-zero-address delegation removal).
Wallet aliases are defined in `../TEST_WALLETS.md`. Shared defaults: `../_defaults.yaml`.

Source note: the blueprint records the wallet-CSV title for this suite as
"[Extension] Delegation + Batched Swap ... / Manage delegations" (a truncated composite);
cases below cite the manage-delegations half as `[Extension] Manage delegations` — verify the
verbatim title against the raw wallet CSV before Testlio export.

---
id: smart-wallet-manage-delegations-status-sections
title: Smart wallet settings groups wallets into Inactive/Active/Unavailable/Action-required
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Backed by SmartWalletSettingsContent.test.tsx ('renders correctly with active and inactive wallets'). The full four-section walk is also exercised manually in the Testlio '[Extension] Manage delegations' suite (see the e2e cases below)."
# scope
platforms:
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - manage-delegations
  - settings
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/smartWallet/SmartWalletSettingsContent.tsx
  - packages/wallet/src/features/smartWallet/hooks/useSmartWalletData.tsx
automationRefs:
  - path: packages/wallet/src/features/smartWallet/SmartWalletSettingsContent.test.tsx
    testName: SmartWalletSettingsContent > renders correctly with active and inactive wallets
---

> **high · unit · pr-check · automated** · platforms: extension, mobile

**Given** the account has wallets in mixed delegation states (no delegation + disabled, enabled with no non-Uniswap delegations, active non-Uniswap delegation, disabled with active Uniswap delegations)
**When** the Advanced → Smart wallet settings screen renders
**Then** each wallet appears under the correct section — Inactive, Active, Unavailable, or Action required — matching its delegation status

---
id: smart-wallet-manage-enable-smart-wallet
title: Enabling an inactive wallet moves it to Active
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "Testlio wallet CSV, manage-delegations suite (blueprint records the composite title '[Extension] Delegation + Batched Swap ... / Manage delegations')."
testlioRef: "[Extension] Manage delegations"
# scope
platforms:
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - manage-delegations
  - settings
wallets:
  - TW-SMARTWALLET-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/smartWallet/SmartWalletSettingsContent.tsx
  - packages/wallet/src/features/smartWallet/SmartWalletStatusModal.tsx
automationRefs: []
---

> **high · e2e · release · gap** · platforms: extension, mobile

**Given** the user is on the Smart wallet settings screen with a wallet in the Inactive section
**When** they tap "Enable" on that wallet
**Then** a "Smart wallet enabled" confirmation appears and the wallet moves into the Active section

---
id: smart-wallet-manage-disable-no-delegations
title: Disabling an Active wallet with zero active networks reverts instantly (no on-chain tx)
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio wallet CSV, manage-delegations suite (blueprint records the composite title '[Extension] Delegation + Batched Swap ... / Manage delegations')."
testlioRef: "[Extension] Manage delegations"
# scope
platforms:
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - manage-delegations
  - settings
wallets:
  - TW-SMARTWALLET-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/smartWallet/SmartWalletSettingsContent.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · platforms: extension, mobile

**Given** an Active-section wallet whose detail modal shows 0 active networks
**When** the user opens its detail modal and taps "Disable"
**Then** the wallet is moved to Inactive instantly, with no on-chain transaction required

---
id: smart-wallet-manage-disable-with-delegations
title: Disabling an Active wallet with delegations resets delegation on-chain to the zero address
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "Testlio wallet CSV, manage-delegations suite (blueprint records the composite title '[Extension] Delegation + Batched Swap ... / Manage delegations'). Incident-risk path: submits a real on-chain delegation-reset transaction."
testlioRef: "[Extension] Manage delegations"
# scope
platforms:
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - manage-delegations
  - settings
wallets:
  - TW-SMARTWALLET-02
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/smartWallet/SmartWalletSettingsContent.tsx
  - packages/wallet/src/features/smartWallet/sagas/removeDelegationSaga.ts
  - packages/wallet/src/features/smartWallet/RemoveDelegationTotalFee.tsx
automationRefs: []
---

> **urgent · e2e · release · gap** · platforms: extension, mobile

**Given** an Active-section wallet with one or more active networks (Active networks > 0)
**When** the user opens the detail modal, expands "Active networks" (accordion shows working links to each active Uniswap delegation), taps Disable, confirms the "Are you sure?" and "Disable smart wallet" prompts
**Then** after loading, an on-chain transaction is submitted that resets the delegation to the zero address, and the wallet moves to the Inactive section

---
id: smart-wallet-manage-unavailable-non-uniswap-delegation
title: Wallet with a non-Uniswap delegation shows the "features unavailable" state
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "Testlio wallet CSV, manage-delegations suite (blueprint records the composite title '[Extension] Delegation + Batched Swap ... / Manage delegations')."
testlioRef: "[Extension] Manage delegations"
# scope
platforms:
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - manage-delegations
  - settings
wallets:
  - TW-SMARTWALLET-04
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/smartWallet/SmartWalletSettingsContent.tsx
  - packages/wallet/src/features/smartWallet/hooks/useLiveAccountDelegationDetails.tsx
automationRefs: []
---

> **high · e2e · release · gap** · platforms: extension, mobile

**Given** test wallet TW-SMARTWALLET-04 carries an active non-Uniswap delegation and appears in the Unavailable section
**When** the user taps that wallet
**Then** a "Smart wallet features unavailable" modal is shown and the wallet cannot be enabled

---
id: smart-wallet-manage-action-required-disable
title: Action-required wallet can be disabled across all its active networks
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "Testlio wallet CSV, manage-delegations suite (blueprint records the composite title '[Extension] Delegation + Batched Swap ... / Manage delegations'). Incident-risk path: submits a real on-chain delegation-reset transaction."
testlioRef: "[Extension] Manage delegations"
# scope
platforms:
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - manage-delegations
  - settings
wallets:
  - TW-SMARTWALLET-02
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/smartWallet/SmartWalletSettingsContent.tsx
  - packages/wallet/src/features/smartWallet/sagas/removeDelegationSaga.ts
  - packages/wallet/src/features/smartWallet/ActiveNetworkExpando/ActiveNetworkExpando.tsx
automationRefs: []
---

> **urgent · e2e · release · gap** · platforms: extension, mobile

**Given** a wallet in the Action-required section (disabled with active Uniswap delegations)
**When** the user taps it, sees the "Smart wallet is active on <n> network(s)" sheet, taps "Disable on <n> network(s)", and confirms the "Are you sure?" and "Disable smart wallet" prompts
**Then** after loading, an on-chain transaction resets the delegation to the zero address and the wallet moves to Inactive

---
id: smart-wallet-detect-delegated-eoa
title: isDelegatedEOA correctly detects delegation from account bytecode
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
sourceNote: "Existing unit suite isDelegatedEOA.test.ts (empty bytecode, delegation-pattern match with delegatee extraction, malformed-pattern rejection)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - delegation
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/smartWallet/delegation/isDelegatedEOA.ts
automationRefs:
  - path: packages/uniswap/src/features/smartWallet/delegation/isDelegatedEOA.test.ts
    testName: isDelegatedEOA
---

> **urgent · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** an account's on-chain bytecode
**When** `isDelegatedEOA` inspects it
**Then** it returns non-delegated for empty/arbitrary bytecode, and delegated (with the correct extracted delegatee address, case-insensitively) only when the bytecode matches the EIP-7702 delegation prefix and length — a wrong verdict would route the user into the wrong transaction type

---
id: smart-wallet-delegation-service-multichain-status
title: Delegation service resolves delegation status across chains and fails safe
# importance
priority: urgent
severity: high
# provenance
source: existing-unit
sourceNote: "Existing unit suite delegation.test.ts (status checks, multi-chain, error handling, single-chain convenience method)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - delegation
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/smartWallet/delegation/delegation.ts
  - packages/uniswap/src/features/smartWallet/delegation/delegationRepository.ts
automationRefs:
  - path: packages/uniswap/src/features/smartWallet/delegation/delegation.test.ts
    testName: delegation service
---

> **urgent · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** the delegation repository is queried for one or many chains
**When** the delegation service resolves status
**Then** it reports delegated vs non-delegated correctly, handles multiple chains at once, handles empty responses gracefully, and returns non-delegated (rather than throwing) when the repository errors

---
id: smart-wallet-account-mismatch-detection
title: Account mismatch detection identifies delegated-state mismatches
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Existing unit suite mismatch.test.ts (createHasMismatchUtil)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - delegation
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/smartWallet/mismatch/mismatch.ts
automationRefs:
  - path: packages/uniswap/src/features/smartWallet/mismatch/mismatch.test.ts
    testName: createHasMismatchUtil
---

> **high · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** an account's expected vs actual delegation state
**When** `createHasMismatchUtil` evaluates it
**Then** it correctly reports whether a mismatch exists, driving the mismatch UI/effects

---
id: smart-wallet-delegation-state-effects
title: Delegation-state effects update state and active chain id correctly
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Existing unit suite effects.test.ts (getHandleOnUpdateDelegatedState, getHandleOnSetActiveChainId)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - smart-wallet
  - delegation
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/smartWallet/delegation/effects.ts
  - packages/uniswap/src/features/smartWallet/delegation/slice.ts
automationRefs:
  - path: packages/uniswap/src/features/smartWallet/delegation/effects.test.ts
    testName: effects
---

> **high · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** a delegated-state update or an active-chain-id change
**When** `getHandleOnUpdateDelegatedState` / `getHandleOnSetActiveChainId` run
**Then** the delegation slice is updated with the correct delegated state and active chain id
