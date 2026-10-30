# Settings scenarios — Account & general settings

Manage dapp connections (management screen only — the connect flow is owned by
`walletconnect`), wallet nickname, spam/small-balance visibility, view-only account
gating, testnet mode, on-device storage, and top-level settings navigation.
Shared defaults: `_defaults.yaml`.

---
id: settings-manage-connections
title: View and revoke active dapp connections
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  Testlio wallet suite 'Manage Connection - iOS/Android'. The connect flow itself is
  owned by the walletconnect area; this case covers only the settings management
  screen (list, revoke, empty state). No same-level automation exists for this screen.
testlioRef: Manage Connection - iOS/Android
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - connections
wallets:
  - TW-SETTINGS-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/screens/SettingsWalletManageConnection.tsx
  - apps/mobile/src/components/Settings/ConnectionsDappModal/
  - apps/extension/src/app/features/settings/SettingsManageConnectionsScreen/
automationRefs: []
---

> **high · e2e · release · gap** · platforms: mobile, extension

**Given** test wallet TW-SETTINGS-01 has at least one active dapp connection
**When** the user opens Settings > Manage connections and removes a connection
**Then** the connection list shows all active sessions, revoking removes the session (and disconnects the dapp), and an account with no connections shows the empty state

---
id: settings-change-nickname
title: Edit wallet nickname / profile name
# importance
priority: medium
severity: low
# provenance
source: testlio
sourceNote: >-
  Testlio wallet suite 'Change nickname - iOS/Android'. Edit-label UI lives in
  apps/mobile/src/components/Settings/EditWalletModal/ (EditLabelSettingsModal);
  no same-level automation exists.
testlioRef: Change nickname - iOS/Android
# scope
platforms:
  - mobile
labels:
  - regression
  - account
wallets:
  - TW-SETTINGS-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/components/Settings/EditWalletModal/
  - apps/mobile/src/screens/SettingsScreen.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · platforms: mobile

**Given** test wallet TW-SETTINGS-01 is set up
**When** the user edits the wallet nickname in the account settings and saves
**Then** the new nickname is validated, persisted, and reflected on the home header, account switcher, and settings screen; cancelling leaves the previous nickname unchanged

---
id: settings-view-only-account
title: View-only account hides signing-gated settings rows
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: >-
  Derived from code: apps/mobile/src/screens/SettingsScreen.tsx hides the
  'Recovery phrase' row when no signer account is imported (noSignerAccountImported
  gating on MobileScreens.SettingsViewSeedPhrase), and
  apps/mobile/src/components/Settings/ManageWalletsModal.tsx hides the edit-profile
  and connections rows for AccountType.Readonly accounts while showing the view-only
  badge. No Testlio case or automated test covers this today.
# scope
platforms:
  - mobile
labels:
  - regression
  - account
  - security
wallets:
  - TW-SETTINGS-02
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/screens/SettingsScreen.tsx
  - apps/mobile/src/components/Settings/ManageWalletsModal.tsx
  - apps/mobile/src/components/Settings/WalletSettings.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · platforms: mobile

**Given** only view-only account TW-SETTINGS-02 (added by ENS name, no signing keys) is present in the app
**When** the user opens Settings and the wallet management screen for that account
**Then** the "Recovery phrase" row is not shown, the edit-profile and manage-connections rows are hidden for the view-only account, the account row displays the view-only badge, and no screen offers a signing-gated action for that account

---
id: settings-spam-token-visibility
title: Hide spam / small-balance tokens setting
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: >-
  Backed by unit tests in packages/uniswap/src/features/settings/hooks.test.ts
  (useHideSpamTokensSetting) and slice.test.ts (userSettingsReducer defaults for spam
  and small-balance flags). The toggle surfaces in the Testlio wallet suite
  'Wallet Settings - iOS/Android'.
testlioRef: Wallet Settings - iOS/Android
# scope
platforms:
  - mobile
  - extension
  - web
labels:
  - regression
  - account
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/settings/slice.ts
  - packages/uniswap/src/features/settings/hooks.ts
automationRefs:
  - path: packages/uniswap/src/features/settings/hooks.test.ts
    testName: useHideSpamTokensSetting > should return true when hideSpamTokens is true
  - path: packages/uniswap/src/features/settings/slice.test.ts
    testName: userSettingsReducer > sets spam tokens setting from default
  - path: packages/uniswap/src/features/settings/slice.test.ts
    testName: userSettingsReducer > sets small balances setting from default
---

> **medium · unit · pr-check · automated** · platforms: mobile, extension, web

**Given** the user opens wallet display settings
**When** they toggle "Hide spam tokens" / "Hide small balances"
**Then** `useHideSpamTokensSetting` reflects the stored flag, the reducer initializes both flags from defaults, and portfolio/token lists filter accordingly

---
id: settings-testnet-mode
title: Testnet mode defaults off and gates the testnet banner
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: >-
  Backed by unit tests in packages/uniswap/src/features/settings/hooks.test.ts
  (useTestnetModeBannerHeight, nested inside the useHideSpamTokensSetting describe
  block). slice.ts initializes isTestnetModeEnabled to false and carries an explicit
  incident-risk comment on setIsTestnetModeEnabled: testnets must never be
  unintentionally toggled on. The end-to-end toggle path (web TestnetsToggle,
  extension SettingsScreen, mobile advanced settings menu) has no same-level
  automation and remains a manual check.
# scope
platforms:
  - mobile
  - extension
  - web
labels:
  - regression
  - network
  - edge-case
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/settings/slice.ts
  - packages/uniswap/src/features/settings/hooks.ts
  - apps/web/src/components/AccountDrawer/TestnetsToggle.tsx
  - apps/mobile/src/features/settings/hooks/useAdvancedSettingsMenuState.ts
  - apps/extension/src/app/features/settings/SettingsScreen.tsx
automationRefs:
  - path: packages/uniswap/src/features/settings/hooks.test.ts
    testName: useHideSpamTokensSetting > useTestnetModeBannerHeight > should return TESTNET_MODE_BANNER_HEIGHT when isTestnetModeEnabled is true and isMobileApp is true
  - path: packages/uniswap/src/features/settings/hooks.test.ts
    testName: useHideSpamTokensSetting > useTestnetModeBannerHeight > should return 0 when isTestnetModeEnabled is true and isMobileApp is false
---

> **high · unit · pr-check · automated** · platforms: mobile, extension, web

**Given** a fresh install where `isTestnetModeEnabled` is at its default
**When** testnet mode is read and then explicitly enabled via `setIsTestnetModeEnabled`
**Then** the default is `false` (testnet mode is never on without an explicit user toggle), `useTestnetModeBannerHeight` returns the banner height only when testnet mode is enabled on the mobile app, and returns 0 when not on mobile

---
id: settings-storage-management
title: On-device storage settings and clear-data guard
# importance
priority: medium
severity: high
# provenance
source: existing-unit
sourceNote: >-
  Backed by unit tests in
  packages/uniswap/src/features/settings/storage/StorageSettingsContent.test.tsx
  (row rendering and confirmation-gated destructive actions). No Testlio case covers
  the storage screen.
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - account
  - edge-case
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/settings/storage/
  - apps/mobile/src/screens/SettingsStorageScreen.tsx
  - apps/extension/src/app/features/settings/SettingsStorageScreen.tsx
automationRefs:
  - path: packages/uniswap/src/features/settings/storage/StorageSettingsContent.test.tsx
    testName: StorageSettingsContent > renders all three storage action rows with subtitles
  - path: packages/uniswap/src/features/settings/storage/StorageSettingsContent.test.tsx
    testName: StorageSettingsContent > calls callback when clear all data button is pressed and confirmed
---

> **medium · unit · pr-check · automated** · platforms: mobile, extension

**Given** the user opens Settings > Storage
**When** they press a storage action row or the "Clear all data" button
**Then** all three storage rows render with subtitles, and destructive actions invoke their callback only after the confirmation is accepted — dismissing the confirmation performs no clear

---
id: settings-mobile-navigation
title: Wallet settings screen navigation and sections
# importance
priority: low
severity: low
# provenance
source: testlio
sourceNote: >-
  Testlio wallet suite 'Wallet Settings - iOS/Android' (exploratory navigation pass
  over the settings screen). No same-level automation exists.
testlioRef: Wallet Settings - iOS/Android
# scope
platforms:
  - mobile
labels:
  - regression
  - navigation
wallets:
  - TW-SETTINGS-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/screens/SettingsScreen.tsx
  - apps/mobile/src/features/settings/
automationRefs: []
---

> **low · e2e · release · gap** · platforms: mobile

**Given** test wallet TW-SETTINGS-01 is set up
**When** the user opens Settings and taps every row listed on the settings screen
**Then** every row opens its screen without a crash and back navigation returns to the settings list, with each row showing a non-empty label

---
id: settings-extension-navigation
title: Extension settings screen navigation
# importance
priority: low
severity: low
# provenance
source: testlio
sourceNote: >-
  Testlio suite 'Settings - Extension' (exploratory navigation pass over the extension
  settings screen). No same-level automation exists — the blueprint's extension e2e
  glob for settings matches no files in the repo.
testlioRef: Settings - Extension
# scope
platforms:
  - extension
labels:
  - regression
  - navigation
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/settings/SettingsScreen.tsx
  - apps/extension/src/app/features/settings/SettingsScreenWrapper.tsx
automationRefs: []
---

> **low · e2e · release · gap** · platforms: extension

**Given** the extension is unlocked
**When** the user opens Settings and navigates every row listed on the screen, then toggles the theme
**Then** each row opens its screen and back navigation returns to the settings list, the theme toggle switches between light and dark and the choice persists, and the popup renders every screen without a crash

---
id: settings-web-navigation
title: Web app settings and navigation menu
# importance
priority: low
severity: low
# provenance
source: testlio
sourceNote: >-
  Testlio web suite 'Test Case: Exploratory – Navigation and Settings (Uniswap Web)'.
  Also subsumes the blueprint's '[Wallet Browser] Test Case: Exploratory – Navigation
  and Settings' title (same exploratory pass run from the wallet browser). No
  same-level automation exists.
testlioRef: "Test Case: Exploratory – Navigation and Settings (Uniswap Web)"
# scope
platforms:
  - web
labels:
  - regression
  - navigation
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/components/AccountDrawer/
  - packages/uniswap/src/features/language/
  - packages/uniswap/src/features/fiatCurrency/
automationRefs: []
---

> **low · e2e · release · gap** · platforms: web

**Given** the user is on the Uniswap web app (connected or disconnected)
**When** they open the settings / preferences menu, change language, currency, and theme, then navigate each top-level route from the menu
**Then** each preference applies immediately to visible strings/amounts/colors and persists across a page reload, and every top-level route reached from the menu renders its page
