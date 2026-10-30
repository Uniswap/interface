# Settings scenarios — Security & app lock

Biometric app-lock (Face ID on mobile / WebAuthn platform authenticator on extension),
view-recovery-phrase, and password reset. Wallet aliases are symbolic — no mnemonics
appear here (see `_defaults.yaml`). Shared defaults: `_defaults.yaml`.

---
id: settings-biometric-toggle-mobile
title: Toggle Face ID / biometric app lock from settings
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: >-
  Testlio wallet suite 'Face Id being enabled/not enabled during the onboarding -
  iOS/Android (settings toggle)' — this case covers the settings-toggle half (the
  onboarding half is owned by the onboarding area). No automation exercises the
  biometric enable/lock path (the Maestro onboarding flow taps Skip-FaceID).
testlioRef: Face Id being enabled/not enabled during the onboarding - iOS/Android (settings toggle)
# scope
platforms:
  - mobile
labels:
  - regression
  - security
  - biometrics
wallets:
  - TW-SETTINGS-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/biometricsSettings/
  - apps/mobile/src/screens/SettingsScreen.tsx
  - packages/wallet/src/features/auth/
automationRefs: []
---

> **urgent · e2e · release · gap** · platforms: mobile

**Given** test wallet TW-SETTINGS-01 is set up and the user is on the mobile Settings screen with device biometrics enrolled
**When** they toggle "Face ID / Touch ID" (app lock) on, background and reopen the app, then toggle it off
**Then** enabling requires a successful biometric prompt and the app locks on next foreground; disabling stops requiring the prompt, and the toggle state persists across an app restart

---
id: settings-ext-biometric-unlock-setup
title: Enable biometric unlock (WebAuthn) from extension settings
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
sourceNote: >-
  Backed by unit tests in
  apps/extension/src/app/features/biometricUnlock/useBiometricUnlockSetupMutation.test.ts
  (successful setup plus authenticator-unavailable and credential-failure error
  paths). The settings surface is exercised by the Testlio suite
  'Settings - Extension'.
testlioRef: Settings - Extension
# scope
platforms:
  - extension
labels:
  - regression
  - security
  - biometrics
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/extension/src/app/features/biometricUnlock/
  - apps/extension/src/app/features/settings/DeviceAccessScreen.tsx
automationRefs:
  - path: apps/extension/src/app/features/biometricUnlock/useBiometricUnlockSetupMutation.test.ts
    testName: useBiometricUnlockSetupMutation > successful setup > should successfully set up biometric unlock
---

> **urgent · unit · pr-check · automated** · platforms: extension

**Given** the extension is unlocked and the platform exposes a WebAuthn platform authenticator
**When** the user enables biometric unlock in settings, triggering `useBiometricUnlockSetupMutation`
**Then** a credential is created and the password is stored encrypted; if no platform authenticator is available or credential creation fails, setup throws and no credential is persisted

---
id: settings-ext-biometric-unlock
title: Unlock extension with a stored biometric credential
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
sourceNote: >-
  Backed by unit tests in
  apps/extension/src/app/features/biometricUnlock/useUnlockWithBiometricCredentialMutation.test.ts
  (successful unlock plus missing-credential, auth-failure, and decryption-failure
  error paths).
# scope
platforms:
  - extension
labels:
  - regression
  - security
  - biometrics
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/extension/src/app/features/biometricUnlock/
automationRefs:
  - path: apps/extension/src/app/features/biometricUnlock/useUnlockWithBiometricCredentialMutation.test.ts
    testName: useUnlockWithBiometricCredentialMutation > successful unlock > should successfully unlock with biometric credential
---

> **urgent · unit · pr-check · automated** · platforms: extension

**Given** biometric unlock has been set up and a credential is stored
**When** the user unlocks via `useUnlockWithBiometricCredentialMutation`
**Then** the stored password is decrypted and the wallet unlocks; when no credential is found, authentication fails, or decryption fails, the mutation throws and the wallet stays locked

---
id: settings-ext-change-password-biometric
title: Change extension password with biometric re-encryption
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
sourceNote: >-
  Backed by unit tests in
  apps/extension/src/app/features/biometricUnlock/useChangePasswordWithBiometricMutation.test.ts
  (re-encryption and failure atomicity) and
  apps/extension/src/app/features/settings/password/ChangePasswordForm.test.tsx
  (form validation: rejects reusing the old password, submits a valid new password).
# scope
platforms:
  - extension
labels:
  - regression
  - security
  - biometrics
  - password
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/extension/src/app/features/biometricUnlock/
  - apps/extension/src/app/features/settings/password/
automationRefs:
  - path: apps/extension/src/app/features/biometricUnlock/useChangePasswordWithBiometricMutation.test.ts
    testName: useChangePasswordWithBiometricMutation > successful password change > should successfully change password with biometric re-encryption
  - path: apps/extension/src/app/features/biometricUnlock/useChangePasswordWithBiometricMutation.test.ts
    testName: useChangePasswordWithBiometricMutation > successful password change > should re-encrypt new password with the same encryption key
  - path: apps/extension/src/app/features/settings/password/ChangePasswordForm.test.tsx
    testName: ChangePasswordForm > shows error when new password matches old password
  - path: apps/extension/src/app/features/settings/password/ChangePasswordForm.test.tsx
    testName: ChangePasswordForm > calls onNext and changePassword when passwords are different and valid
---

> **urgent · unit · pr-check · automated** · platforms: extension

**Given** biometric unlock is enabled and the user changes their password
**When** the change-password form is submitted and `useChangePasswordWithBiometricMutation` runs
**Then** the form rejects a new password identical to the old one, a valid new password is re-encrypted against the same biometric encryption key and the keyring password is updated; a keyring change failure or biometric storage update failure aborts the change without leaving the credential in a half-updated state

---
id: settings-ext-password-reset-flow
title: Password reset state machine transitions correctly
# importance
priority: urgent
severity: high
# provenance
source: existing-unit
sourceNote: >-
  Backed by unit tests in
  apps/extension/src/app/features/settings/password/usePasswordResetFlow.test.ts
  (state transitions, biometric branch, old-password storage).
# scope
platforms:
  - extension
labels:
  - regression
  - security
  - password
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/extension/src/app/features/settings/password/
automationRefs:
  - path: apps/extension/src/app/features/settings/password/usePasswordResetFlow.test.ts
    testName: usePasswordResetFlow > should transition to EnterNewPassword when valid password is provided
  - path: apps/extension/src/app/features/settings/password/usePasswordResetFlow.test.ts
    testName: usePasswordResetFlow > should transition to BiometricAuth when biometric is enabled
---

> **urgent · unit · pr-check · automated** · platforms: extension

**Given** the user starts a password reset from settings
**When** they progress through `usePasswordResetFlow` (enter current password, then a valid new password)
**Then** the flow advances None → EnterCurrentPassword → EnterNewPassword, stores the old password only for a valid entry, routes through BiometricAuth when biometric is enabled, and returns to None when no password is provided

---
id: settings-view-recovery-phrase
title: View recovery phrase behind an auth gate
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: >-
  Testlio wallet suite 'Recovery Phase - iOS/Android' (title verbatim from the
  Testlio export, including its spelling). No same-level automation exists — the
  phrase-reveal path is deliberately excluded from automated flows.
testlioRef: Recovery Phase - iOS/Android
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - security
  - recovery
wallets:
  - TW-SETTINGS-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/screens/SettingsViewSeedPhraseScreen.tsx
  - apps/extension/src/app/features/settings/SettingsRecoveryPhraseScreen/
  - apps/extension/src/app/features/settings/BackupRecoveryPhrase/
  - packages/wallet/src/features/auth/
automationRefs: []
---

> **urgent · e2e · release · gap** · platforms: mobile, extension

**Given** test wallet TW-SETTINGS-01 (a signing wallet backed up from a 12-word phrase) is set up
**When** the user opens "View recovery phrase" in settings and completes the biometric / password gate
**Then** the phrase is revealed only after successful authentication and is hidden again on navigating away; a failed or cancelled auth never reveals the phrase. (Tester references the phrase from the QA vault by alias — the mnemonic is never recorded in the catalog or bug report.)
