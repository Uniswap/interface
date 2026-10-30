# Onboarding scenarios — Create new wallet

Fresh-wallet creation funnel on mobile and extension: generate mnemonic, skip/claim
unitag, notifications prompt, biometric/password setup, and recovery-phrase backup.
Shared defaults: `_defaults.yaml`. Wallets referenced by symbolic alias only (see
`wallets:` field); no mnemonics, keys, or addresses appear here.

---
id: onboarding-create-new-wallet-mobile
title: Create a fresh wallet on mobile completes to the home screen
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
sourceNote: "(b) Maestro flow apps/mobile/.maestro/flows/onboarding/new-wallet.yaml (FLOW_NAME onboarding-new-wallet); (c) packages/wallet/src/features/onboarding/createOnboardingAccount.ts"
# scope
platforms:
  - mobile
labels:
  - regression
  - smoke
  - create
  - funnel
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
  - path: apps/mobile/.maestro/flows/onboarding/new-wallet.yaml
    testName: onboarding-new-wallet
---

> **urgent · e2e · release · automated** · platforms: mobile

**Given** a clean install of the mobile app on the intro screen
**When** the user taps "Create a new wallet", skips the unitag step, skips notifications, skips Face ID, and confirms the OS biometric prompt
**Then** a new mnemonic-backed account is generated, the app lands on the home screen, and the account header avatar (`AccountHeaderAvatar`) is visible

---
id: onboarding-create-new-wallet-extension
title: Create a fresh wallet on the extension (GA onboarding)
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "(a) Testlio 'Onboarding GA - Extension'; (c) apps/extension/src/app/features/onboarding/create/PasswordCreate.tsx, intro/IntroScreen.tsx. Extension e2e smoke apps/extension/e2e/tests/smoke/onboarding-flow.test.ts verifies only that the onboarding tab opens on fresh install — the create funnel itself has no same-level automation, so this remains a gap."
testlioRef: Onboarding GA - Extension
# scope
platforms:
  - extension
labels:
  - regression
  - smoke
  - create
  - funnel
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/onboarding/
  - apps/extension/src/app/features/onboarding/create/
  - apps/extension/src/app/features/onboarding/intro/
  - packages/wallet/src/features/onboarding/
automationRefs: []
---

> **urgent · e2e · release · gap** · platforms: extension

**Given** a first-run extension on the intro screen
**When** the user selects "Create a new wallet", sets a password, backs up the generated recovery phrase, and completes the steps
**Then** a new account is created, the completion screen is shown, and opening the extension unlocks to the funded/home view

---
id: onboarding-extension-password-create
title: Set an unlock password during extension wallet creation
# importance
priority: high
severity: high
# provenance
source: uniswap
sourceNote: "(c) apps/extension/src/app/features/onboarding/create/PasswordCreate.tsx, onboarding/Password.tsx, PinReminder.tsx"
# scope
platforms:
  - extension
labels:
  - regression
  - create
  - auth
  - security
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/onboarding/create/PasswordCreate.tsx
  - apps/extension/src/app/features/onboarding/Password.tsx
  - apps/extension/src/app/features/onboarding/PinReminder.tsx
automationRefs: []
---

> **high · e2e · release · gap** · platforms: extension

**Given** the user is creating a new wallet on the extension and reaches the password step
**When** they enter a password that does not meet requirements, then a valid password with a mismatched confirmation, then a valid matching pair
**Then** weak/mismatched entries are blocked with an inline error, the "Continue" action is disabled until valid, and a matching valid password advances to the next step

---
id: onboarding-backup-recovery-phrase
title: Back up and verify the recovery phrase during onboarding
# importance
priority: urgent
severity: urgent
# provenance
source: uniswap
sourceNote: "(c) apps/extension/src/app/features/recoveryPhraseVerification/RecoveryPhraseVerification.tsx; packages/wallet/src/features/onboarding/"
# scope
platforms:
  - extension
  - mobile
labels:
  - regression
  - create
  - backup
  - recovery
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/recoveryPhraseVerification/
  - packages/wallet/src/features/onboarding/
automationRefs: []
---

> **urgent · e2e · release · gap** · platforms: extension, mobile

**Given** a newly generated wallet showing its recovery phrase during onboarding
**When** the user proceeds to the verification step and is asked to re-select the missing words in order
**Then** selecting the wrong word is rejected, selecting the correct words in order passes verification, and the manual-backup step is marked complete

---
id: onboarding-skip-unitag-claim
title: Skip the unitag claim step during onboarding
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(b) Maestro flow apps/mobile/.maestro/flows/onboarding/new-wallet.yaml (Skip-Unitag tap) — mobile only; the extension skip path (apps/extension/src/app/features/onboarding/ClaimUnitagScreen.tsx) has no automation and is manual."
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - create
  - unitag
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/onboarding/ClaimUnitagScreen.tsx
  - packages/wallet/src/features/onboarding/
automationRefs:
  - path: apps/mobile/.maestro/flows/onboarding/new-wallet.yaml
    testName: onboarding-new-wallet
---

> **medium · e2e · release · automated** · platforms: mobile, extension

**Given** the user reaches the unitag/username step during new-wallet onboarding
**When** they tap "Skip"
**Then** no unitag is claimed and onboarding advances to the next step without blocking wallet creation (automation covers the mobile skip only; verify the extension skip manually)

---
id: onboarding-notifications-prompt
title: Enable, disable, or skip notifications during onboarding
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "(a) Testlio 'Notifications - Enabled/Disabled/Skipped during the Onboarding'. Maestro apps/mobile/.maestro/flows/onboarding/new-wallet.yaml exercises only the skip branch (taps Skip-Notifications) — not same-level coverage for the enable/disable branches, so no automationRef is claimed; enable/disable are manual."
testlioRef: Notifications - Enabled/Disabled/Skipped during the Onboarding
# scope
platforms:
  - mobile
labels:
  - regression
  - create
  - notifications
  - funnel
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/onboarding/
  - packages/wallet/src/features/onboarding/
automationRefs: []
---

> **medium · e2e · release · gap** · platforms: mobile

**Given** the user reaches the notifications prompt during onboarding
**When** they enable, disable, or skip the OS push-notification permission
**Then** the corresponding permission state is persisted, onboarding continues in all three cases, and no path blocks reaching the home screen

---
id: onboarding-face-id-setup
title: Enable biometric (Face ID) unlock during onboarding
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "(a) Testlio 'Face Id being enabled during the onboarding - iOS/Android'; (c) packages/wallet/src/features/auth/. No automation exercises biometric enablement: Maestro new-wallet.yaml taps Skip-FaceID, and shared-flows/biometrics-confirm.yaml only confirms an in-app dialog — this security path is a true automation gap."
testlioRef: Face Id being enabled during the onboarding - iOS/Android
# scope
platforms:
  - mobile
labels:
  - regression
  - create
  - biometrics
  - auth
  - security
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/onboarding/
  - packages/wallet/src/features/auth/
automationRefs: []
---

> **high · e2e · release · gap** · platforms: mobile

**Given** the user reaches the biometric setup step during onboarding
**When** they choose to enable Face ID / Touch ID and confirm the OS biometric prompt
**Then** biometric unlock is enabled for the wallet, onboarding completes to the home screen, and a subsequent lock requires the biometric to unlock

---
id: onboarding-extension-biometric-setup
title: Enable or skip biometric unlock during extension onboarding
# importance
priority: high
severity: high
# provenance
source: uniswap
sourceNote: "(c) apps/extension/src/app/features/onboarding/BiometricUnlockSetUp.tsx; apps/extension/src/app/features/biometricUnlock/useBiometricUnlockSetupMutation.ts. Unit test apps/extension/src/app/features/biometricUnlock/useBiometricUnlockSetupMutation.test.ts backs the setup mutation at unit level only — not same-level automation for this e2e journey."
# scope
platforms:
  - extension
labels:
  - regression
  - create
  - biometrics
  - auth
  - security
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/onboarding/BiometricUnlockSetUp.tsx
  - apps/extension/src/app/features/biometricUnlock/useBiometricUnlockSetupMutation.ts
automationRefs: []
---

> **high · e2e · release · gap** · platforms: extension

**Given** a device with a built-in biometric sensor, where extension onboarding has passed the password step and shows the biometric unlock setup screen with the toggle enabled by default
**When** the user continues with the toggle on and completes the OS/WebAuthn biometric prompt (and separately: cancels/fails the prompt; and separately: turns the toggle off and continues)
**Then** on success biometric unlock is set up and onboarding advances; on prompt failure the toggle is automatically disabled and the user can still continue without being stuck; with the toggle off, continuing advances without enabling biometric unlock

---
id: onboarding-derivation-index
title: getNextDerivationIndex picks the correct next/free account index
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "(b) unit packages/wallet/src/features/onboarding/createOnboardingAccount.test.ts (describe getNextDerivationIndex)"
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - unit
  - shared
  - derivation
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/onboarding/createOnboardingAccount.ts
automationRefs:
  - path: packages/wallet/src/features/onboarding/createOnboardingAccount.test.ts
    testName: getNextDerivationIndex
---

> **high · unit · pr-check · automated** · platforms: mobile, extension

**Given** an existing set of derived accounts (empty, consecutive, or with gaps)
**When** `getNextDerivationIndex` is called
**Then** it returns 0 for an empty set, the next sequential index for consecutive accounts, and the first missing index when there are gaps (at the beginning, middle, or with large non-sequential gaps) — never colliding with an existing account's index
