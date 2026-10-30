# Onboarding scenarios — Recovery, backup & wallet removal

On-device recovery of a wallet whose local secret is missing, cross-device restore,
forgot-password reset, and full wallet removal. These are the highest-blast-radius
onboarding paths: a defect here can permanently lose access to funds, so most are
`urgent`. Shared defaults: `_defaults.yaml`. Wallets referenced by alias only (see
`import.md` legend); no mnemonics or keys appear here.

---
id: onboarding-recovery-single-mnemonic-nonfunded
title: Single-mnemonic recovery of a non-funded wallet (cloud lookup, then manual phrase)
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
sourceNote: "(a) Testlio 'Single mnemonic recovery flow for non-funded wallet'; (b) Maestro apps/mobile/.maestro/flows/restore/restore-new-device.yaml (FLOW_NAME restore-new-device). Merged with the former onboarding-restore-new-device case — both described the same walk (Recover-your-wallet state -> cloud lookup finds no backup -> manual phrase entry -> avatar visible), so they are one case carrying both the Testlio ref and the Maestro ref."
testlioRef: Single mnemonic recovery flow for non-funded wallet
# scope
platforms:
  - mobile
labels:
  - regression
  - smoke
  - recovery
  - cloud-backup
wallets:
  - TW-ONBOARDING-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/onboarding/
  - apps/mobile/src/features/onboarding/
  - packages/wallet/src/features/auth/
automationRefs:
  - path: apps/mobile/.maestro/flows/restore/restore-new-device.yaml
    testName: restore-new-device
---

> **urgent · e2e · release · automated** · platforms: mobile

**Given** a device presenting "Recover your wallet" with a "Continue" action and no "Cancel" — either a fresh device or one where the non-funded wallet `TW-ONBOARDING-01`'s on-device seed phrase has been removed
**When** the user continues, the cloud lookup returns "No backups found" (or a backup-import error), and they fall back to entering the valid recovery phrase manually
**Then** the single mnemonic is re-imported, onboarding completes, the account header avatar is visible, and the wallet is usable again

---
id: onboarding-restore-missing-seed
title: Recover a missing seed phrase and view private keys
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: "(b) Maestro apps/mobile/.maestro/flows/restore/restore-missing-seed.yaml (FLOW_NAME restore-missing-seed)"
# scope
platforms:
  - mobile
labels:
  - regression
  - recovery
  - private-keys
  - error-handling
wallets:
  - TW-ONBOARDING-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/onboarding/
  - apps/mobile/src/features/onboarding/
  - packages/wallet/src/features/auth/
automationRefs:
  - path: apps/mobile/.maestro/flows/restore/restore-missing-seed.yaml
    testName: restore-missing-seed
---

> **high · e2e · release · automated** · platforms: mobile

**Given** a wallet whose on-device seed phrase was deleted, reached via Settings > Recovery phrase showing "Restore your wallet"
**When** the user tries cloud restore (no backup found), enters a wrong phrase twice (each rejected with "Wrong recovery phrase"), then enters the correct phrase, and separately walks the "view private keys" restore path
**Then** wrong phrases are always rejected, the correct phrase restores the account (avatar visible), and the private-keys view is gated behind the correct restore before the key is revealed

---
id: onboarding-forgot-password-extension
title: Forgot-password reset flow on the extension
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "(a) Testlio 'Forgot Password - Extension'; (c) apps/extension/src/app/features/onboarding/reset/ResetComplete.tsx, onboarding/Password.tsx"
testlioRef: Forgot Password - Extension
# scope
platforms:
  - extension
labels:
  - regression
  - recovery
  - auth
  - security
wallets:
  - TW-ONBOARDING-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/onboarding/reset/
  - apps/extension/src/app/features/onboarding/Password.tsx
automationRefs: []
---

> **urgent · e2e · release · gap** · platforms: extension

**Given** a locked extension where the user has forgotten their unlock password
**When** they choose "Forgot password", acknowledge that the local wallet will be reset, re-import `TW-ONBOARDING-01` via its recovery phrase, and set a new password
**Then** the old local state is cleared, the wallet is re-imported from the phrase, the new password unlocks it, and the correct address is restored

---
id: onboarding-remove-wallet
title: Remove a wallet (delete seed phrase and private keys)
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
sourceNote: "(a) Testlio 'Remove wallet flow'; (b) Maestro shared-flows/delete-seed-phrase.yaml exercised by apps/mobile/.maestro/flows/restore/restore-new-device.yaml. Scoped to mobile: the Given/When/Then (Settings seed-phrase management, 'Recover your wallet' state on relaunch) is mobile-shaped — the extension's removal flow lands in a different post-removal state and needs its own case if cataloged."
testlioRef: Remove wallet flow
# scope
platforms:
  - mobile
labels:
  - regression
  - recovery
  - remove-wallet
wallets:
  - TW-ONBOARDING-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/onboarding/
  - packages/wallet/src/features/auth/
automationRefs:
  - path: apps/mobile/.maestro/flows/restore/restore-new-device.yaml
    testName: restore-new-device
---

> **urgent · e2e · release · automated** · platforms: mobile

**Given** a device with an imported wallet (`TW-ONBOARDING-01`) and its seed phrase / private keys stored locally
**When** the user opens the seed-phrase/private-keys management, deletes the seed phrase and confirms, then deletes the private keys and confirms
**Then** both secrets are removed from the device, and on relaunch the app presents the "Recover your wallet" state rather than an unlocked wallet

---
id: onboarding-clean-install-intro
title: Clean install shows the first-run intro and entry choices
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "(a) Testlio 'Clean Install - iOS/Android'; (b) Playwright apps/extension/e2e/tests/smoke/onboarding-flow.test.ts covers the extension only (fresh-install onboarding tab auto-opens and the intro renders); the mobile first-run intro is manual; (c) apps/extension/src/app/features/onboarding/intro/IntroScreen.tsx; packages/wallet/src/features/onboarding/WelcomeSplash.tsx"
testlioRef: Clean Install - iOS/Android
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - smoke
  - intro
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/onboarding/intro/
  - packages/wallet/src/features/onboarding/WelcomeSplash.tsx
  - apps/mobile/src/features/onboarding/
automationRefs:
  - path: apps/extension/e2e/tests/smoke/onboarding-flow.test.ts
    testName: Extension Onboarding Flow > onboarding tab opens automatically on fresh install
---

> **medium · e2e · release · automated** · platforms: mobile, extension

**Given** a clean install with no wallet provisioned
**When** the app is launched for the first time
**Then** the welcome/intro screen is shown with both "Create a new wallet" and "Import/Add existing wallet" entry points, and terms acknowledgement is presented before either path proceeds (automation covers the extension only; verify the mobile first-run intro manually)
