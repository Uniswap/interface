# Onboarding scenarios — Import existing wallet

Importing a previously created wallet: seed-phrase import, multi-account selection,
invalid/short phrases, view-only + ENS, cloud restore (iCloud / Google Drive), QR
sync, passkey, and extension "existing wallet". Shared defaults: `_defaults.yaml`.

Wallets are referenced by symbolic alias only — mnemonics/keys stay in the QA vault,
keyed by the same alias:
- `TW-ONBOARDING-01` — fresh 12-word mnemonic, single account, zero balance
- `TW-ONBOARDING-02` — mnemonic with multiple funded derived accounts
- `TW-ONBOARDING-03` — view-only account, ENS name resolved from a public address (no key)
- `TW-ONBOARDING-04` — mnemonic backed up to iCloud (iOS)
- `TW-ONBOARDING-05` — mnemonic backed up to Google Drive (Android)

---
id: onboarding-import-seed-phrase-mobile
title: Import an already-created wallet via recovery phrase on mobile
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
sourceNote: "(a) Testlio 'Import Already Created Wallet via Seed Phrase - iOS/Android'; (b) Maestro shared-flows/recover-fast.yaml exercised by apps/mobile/.maestro/flows/restore/restore-new-device.yaml"
testlioRef: Import Already Created Wallet via Seed Phrase - iOS/Android
# scope
platforms:
  - mobile
labels:
  - regression
  - smoke
  - import
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
  - packages/wallet/src/features/onboarding/createImportedAccounts.ts
automationRefs:
  - path: apps/mobile/.maestro/flows/restore/restore-new-device.yaml
    testName: restore-new-device
---

> **urgent · e2e · release · automated** · platforms: mobile

**Given** a clean install and access to test wallet `TW-ONBOARDING-01`'s recovery phrase (from the QA vault, by alias)
**When** the user taps "Import a wallet", selects "Import recovery phrase", enters the valid phrase, and continues
**Then** the wallet's account is imported, onboarding completes, and the correct address for `TW-ONBOARDING-01` is shown on the home screen

---
id: onboarding-import-multiple-accounts
title: Import a wallet with multiple derived accounts and select which to import
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "(a) Testlio 'Import Wallets with multiple accounts - iOS/Android'; (b) unit packages/wallet/src/features/onboarding/hooks/useSelectAccounts.test.ts backs the selection logic at unit level only (cited by onboarding-select-accounts-hook) — not same-level automation for this on-device e2e journey; (c) hooks/useImportableAccounts.tsx, resolveImportableAddresses.ts"
testlioRef: Import Wallets with multiple accounts - iOS/Android
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - import
  - multi-account
wallets:
  - TW-ONBOARDING-02
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/onboarding/hooks/useSelectAccounts.tsx
  - packages/wallet/src/features/onboarding/hooks/useImportableAccounts.tsx
  - packages/wallet/src/features/onboarding/resolveImportableAddresses.ts
automationRefs: []
---

> **high · e2e · release · gap** · platforms: mobile, extension

**Given** the user imports `TW-ONBOARDING-02`, whose mnemonic derives multiple accounts with balances
**When** the derived-accounts selector loads and the user toggles account selection
**Then** all accounts with balances are surfaced pre-selected, the user can deselect/reselect individual accounts, the last remaining selected account cannot be deselected, and only the selected accounts are imported

---
id: onboarding-import-incorrect-seed-phrase
title: Importing with an incorrect recovery phrase is rejected
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: "(a) Testlio 'Importing Wallet with incorrect Seed Phase - iOS/Android'; (b) Maestro apps/mobile/.maestro/flows/restore/restore-missing-seed.yaml asserts 'Wrong recovery phrase'"
testlioRef: Importing Wallet with incorrect Seed Phase - iOS/Android
# scope
platforms:
  - mobile
labels:
  - regression
  - import
  - validation
  - error-handling
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/onboarding/
  - apps/mobile/src/features/onboarding/
automationRefs:
  - path: apps/mobile/.maestro/flows/restore/restore-missing-seed.yaml
    testName: restore-missing-seed
---

> **high · e2e · release · automated** · platforms: mobile

**Given** the user is on the import recovery-phrase screen
**When** they enter a syntactically valid but wrong 12-word phrase and tap "Continue"
**Then** a "Wrong recovery phrase" error is shown, no account is imported, and correcting the phrase clears the error and allows import

---
id: onboarding-import-short-seed-phrase
title: Importing a phrase shorter than 12 words is blocked
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "(a) Testlio 'Importing wallet with < 12 Seed Phrase - iOS/Android'; (c) apps/extension/src/app/features/onboarding/import/ImportMnemonic.tsx"
testlioRef: Importing wallet with < 12 Seed Phrase - iOS/Android
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - import
  - validation
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/onboarding/import/ImportMnemonic.tsx
  - packages/wallet/src/features/onboarding/
automationRefs: []
---

> **medium · e2e · release · gap** · platforms: mobile, extension

**Given** the user is on the import recovery-phrase screen
**When** they enter fewer than 12 words and attempt to continue
**Then** the "Continue" action stays disabled (or shows a length/validation error) and no import is attempted

---
id: onboarding-import-view-only-ens
title: Import a view-only account by address or ENS name
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "(a) Testlio 'Onboarding - View Only and ENS Wallets - iOS/Android'; (c) packages/wallet/src/features/onboarding/createViewOnlyAccount.ts, resolveImportableAddresses.ts"
testlioRef: Onboarding - View Only and ENS Wallets - iOS/Android
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - import
  - view-only
  - ens
wallets:
  - TW-ONBOARDING-03
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/onboarding/createViewOnlyAccount.ts
  - packages/wallet/src/features/onboarding/resolveImportableAddresses.ts
automationRefs: []
---

> **high · e2e · release · gap** · platforms: mobile, extension

**Given** the user chooses to watch/import a view-only account and has `TW-ONBOARDING-03`'s public address or ENS name
**When** they enter an ENS name (and separately, a raw address)
**Then** the ENS name resolves to its address, a view-only account is created with no signing capability, and the home screen indicates the account is view-only

---
id: onboarding-restore-icloud-ios
title: Restore an already-created wallet from an iCloud backup (iOS)
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "(a) Testlio 'Import Already Created Wallet via Icloud - iOS'; (c) packages/wallet/src/features/onboarding/ (cloud restore); restore-from-cloud path in apps/mobile"
testlioRef: Import Already Created Wallet via Icloud - iOS
# scope
platforms:
  - mobile
labels:
  - regression
  - import
  - cloud-backup
  - ios
wallets:
  - TW-ONBOARDING-04
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/onboarding/
  - apps/mobile/src/features/onboarding/
automationRefs: []
---

> **high · e2e · release · gap** · platforms: mobile

**Given** an iOS clean install signed into the iCloud account holding `TW-ONBOARDING-04`'s encrypted backup
**When** the user chooses "Restore from cloud", selects the backup, and enters its backup password
**Then** the backup is decrypted, the wallet is restored, and the correct address for `TW-ONBOARDING-04` appears on the home screen

---
id: onboarding-restore-google-drive-android
title: Restore an already-created wallet from Google Drive (Android)
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "(a) Testlio 'Importing Already Created Wallet via Google Drive - Android'; (c) packages/wallet/src/features/onboarding/ (cloud restore)"
testlioRef: Importing Already Created Wallet via Google Drive - Android
# scope
platforms:
  - mobile
labels:
  - regression
  - import
  - cloud-backup
  - android
wallets:
  - TW-ONBOARDING-05
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/onboarding/
  - apps/mobile/src/features/onboarding/
automationRefs: []
---

> **high · e2e · release · gap** · platforms: mobile

**Given** an Android clean install signed into the Google account holding `TW-ONBOARDING-05`'s encrypted backup
**When** the user chooses "Restore from cloud", selects the Google Drive backup, and enters its backup password
**Then** the backup is decrypted, the wallet is restored, and the correct address for `TW-ONBOARDING-05` appears on the home screen

---
id: onboarding-import-existing-wallet-extension
title: Import an existing wallet during extension onboarding
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "(a) Testlio 'Onboarding - With Existing Wallet - Extension'; (b) Playwright apps/extension/e2e/tests/smoke/onboarding-import.test.ts (@publish-gate) — its importedExtensionTest fixture drives the onboarding import UI with the deterministic dev wallet, then asserts the imported address in the sidebar; (c) apps/extension/src/app/features/onboarding/import/SelectImportMethod.tsx, ImportMnemonic.tsx"
testlioRef: Onboarding - With Existing Wallet - Extension
# scope
platforms:
  - extension
labels:
  - regression
  - import
wallets:
  - TW-ONBOARDING-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/onboarding/import/
  - apps/extension/src/app/features/onboarding/import/SelectImportMethod.tsx
  - apps/extension/src/app/features/onboarding/import/ImportMnemonic.tsx
automationRefs:
  - path: apps/extension/e2e/tests/smoke/onboarding-import.test.ts
    testName: Onboarding via seed phrase import > sidebar shows the deterministic imported wallet
---

> **high · e2e · release · automated** · platforms: extension

**Given** a first-run extension on the intro screen
**When** the user selects "Import an existing wallet", chooses the recovery-phrase method, enters `TW-ONBOARDING-01`'s valid phrase, and sets a password
**Then** the account is imported, the completion screen is shown, and the extension unlocks to the home view with the correct address

---
id: onboarding-scan-qr-sync-extension
title: Onboard the extension by scanning a QR code from the mobile app
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "(a) Testlio 'Onboarding - with QR scanning from - Extension'; (c) apps/extension/src/app/features/onboarding/scan/ScanToOnboard.tsx, SyncFromPhoneButton.tsx"
testlioRef: Onboarding - with QR scanning from - Extension
# scope
platforms:
  - extension
labels:
  - regression
  - import
  - scantastic
  - qr
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/onboarding/scan/
  - apps/extension/src/app/features/onboarding/SyncFromPhoneButton.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · platforms: extension

**Given** a first-run extension and a mobile app already holding the wallet, on the "Sync from phone" flow
**When** the extension displays a QR/OTP challenge and the user scans it and enters the one-time code on mobile
**Then** the encrypted mnemonic is transferred over the scantastic channel, the account is provisioned on the extension, and onboarding completes to the home view

---
id: onboarding-passkey-import-extension
title: Import a wallet using a passkey during extension onboarding
# importance
priority: medium
severity: high
# provenance
source: uniswap
sourceNote: "(c) apps/extension/src/app/features/onboarding/import/PasskeyImport.tsx, PasskeyImportContextProvider.tsx; packages/wallet/src/features/onboarding/PasskeyImportLoading.tsx"
# scope
platforms:
  - extension
labels:
  - regression
  - import
  - passkey
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/onboarding/import/PasskeyImport.tsx
  - apps/extension/src/app/features/onboarding/import/PasskeyImportContextProvider.tsx
  - packages/wallet/src/features/onboarding/PasskeyImportLoading.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · platforms: extension

**Given** a first-run extension where the user chooses to import via passkey
**When** they initiate passkey authentication and complete the OS/WebAuthn prompt
**Then** the passkey-derived wallet is imported, a loading state is shown while resolving accounts, and onboarding completes to the home view; a cancelled or failed passkey prompt returns to the import-method selection without provisioning an account

---
id: onboarding-select-accounts-hook
title: useSelectAccounts manages import selection and protects the last account
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "(b) unit packages/wallet/src/features/onboarding/hooks/useSelectAccounts.test.ts (describe useSelectAccounts). Sole case citing this suite — the e2e journey onboarding-import-multiple-accounts references it in sourceNote only, so the suite is not double-counted."
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - unit
  - shared
  - multi-account
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/onboarding/hooks/useSelectAccounts.tsx
automationRefs:
  - path: packages/wallet/src/features/onboarding/hooks/useSelectAccounts.test.ts
    testName: useSelectAccounts
---

> **medium · unit · pr-check · automated** · platforms: mobile, extension

**Given** a set of importable accounts passed to `useSelectAccounts`
**When** the consumer toggles selection and the input account list changes
**Then** all accounts start selected, selection updates when the passed accounts change, a deselected account can be re-selected, and deselecting the last remaining selected account is disallowed

---
id: onboarding-extension-keyboard-key
title: KeyboardKey renders key states and platform-correct symbols
# importance
priority: low
severity: low
# provenance
source: existing-unit
sourceNote: "(b) unit apps/extension/src/app/features/onboarding/KeyboardKey.test.tsx (describe KeyboardKey Component)"
# scope
platforms:
  - extension
labels:
  - regression
  - unit
  - ui
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/extension/src/app/features/onboarding/KeyboardKey.tsx
automationRefs:
  - path: apps/extension/src/app/features/onboarding/KeyboardKey.test.tsx
    testName: KeyboardKey Component
---

> **low · unit · pr-check · automated** · platforms: extension

**Given** the `KeyboardKey` component used in the extension onboarding keyboard hints
**When** it renders in KeyUp, KeyDown, and Highlighted states, and for the Meta key on macOS versus other keys
**Then** each state renders correctly, the command symbol is shown for the Meta key on macOS, and the correct title is shown for other keys
