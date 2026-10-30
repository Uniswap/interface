# Connectors scenarios — Embedded (passkey) wallet

Uniswap embedded wallet connector: connections panel, account creation/registration,
OAuth login, and passkey authenticator management. Shared defaults: `_defaults.yaml`.

---
id: connectors-embedded-open-connections-panel
title: Connect opens the Embedded Wallet connections panel
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: >-
  Web Playwright e2e "Embedded Wallet — connections panel > Connect button opens
  EmbeddedWalletConnectionsModal" (apps/web/src/components/WalletModal/
  EmbeddedWalletModal.e2e.test.ts). Unit render coverage:
  "EmbeddedWalletConnectionsModal > renders correctly"
  (apps/web/src/components/WalletModal/WalletModals.test.tsx) — cited here rather than in
  automationRefs because it is below this case's testLevel. Testlio suite: "Embedded
  Wallet".
testlioRef: Embedded Wallet
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - embedded-wallet
  - passkey
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/components/WalletModal/EmbeddedWalletModal.tsx
  - apps/web/src/connection/
  - apps/web/src/components/AccountDrawer/PasskeyMenu/
automationRefs:
  - path: apps/web/src/components/WalletModal/EmbeddedWalletModal.e2e.test.ts
    testName: Embedded Wallet — connections panel > Connect button opens EmbeddedWalletConnectionsModal
---

> **high · e2e · scheduled · automated** · platforms: web

**Given** the Embedded Wallet feature flag is enabled and the session is disconnected
**When** the user clicks the `NavConnectWalletButton`
**Then** the `wallet-modal` opens showing the "Connect a wallet" heading, a "Create account" CTA (`CreateAccount`), and a "Log in" button

---
id: connectors-embedded-create-account
title: Create Account closes the panel and opens the get-the-app / registration flow
# importance
priority: high
severity: medium
# provenance
source: existing-e2e
sourceNote: >-
  Web Playwright e2e "Embedded Wallet — connections panel > Create Account button closes
  connections panel and opens GetTheApp modal"
  (apps/web/src/components/WalletModal/EmbeddedWalletModal.e2e.test.ts). Testlio suite:
  "Embedded Wallet".
testlioRef: Embedded Wallet
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - embedded-wallet
  - registration
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/components/WalletModal/EmbeddedWalletModal.tsx
  - apps/web/src/components/NavBar/DownloadApp/Modal/
automationRefs:
  - path: apps/web/src/components/WalletModal/EmbeddedWalletModal.e2e.test.ts
    testName: Embedded Wallet — connections panel > Create Account button closes connections panel and opens GetTheApp modal
---

> **high · e2e · scheduled · automated** · platforms: web

**Given** the Embedded Wallet connections panel is open
**When** the user clicks the "Create account" CTA
**Then** the connections panel closes and the `DownloadUniswapModal` (GetTheApp) opens at the get-started page

---
id: connectors-embedded-registration-steps
title: Embedded Wallet registration walks ChooseUnitag to KeyManagement to PasskeyGeneration
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: >-
  Web Playwright e2e EWRegistration.e2e.test.ts step-machine tests (verified test names,
  including the back-navigation test "Back navigation: PasskeyGeneration → KeyManagement
  → ChooseUnitag"). Testlio suite: "Embedded Wallet".
testlioRef: Embedded Wallet
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - embedded-wallet
  - registration
  - passkey
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/components/NavBar/DownloadApp/Modal/EmbeddedWalletOnboarding/
  - apps/web/src/components/AccountDrawer/PasskeyMenu/
automationRefs:
  - path: apps/web/src/components/NavBar/DownloadApp/Modal/EWRegistration.e2e.test.ts
    testName: EW Registration > Modal opens to ChooseUnitag step when EW enabled
  - path: apps/web/src/components/NavBar/DownloadApp/Modal/EWRegistration.e2e.test.ts
    testName: EW Registration > PasskeyGeneration page appears after KeyManagement continue
---

> **medium · e2e · release · automated** · platforms: web

**Given** the Embedded Wallet feature flag is enabled and registration begins
**When** the user picks a unitag, continues through KeyManagement, and proceeds to PasskeyGeneration
**Then** the flow advances ChooseUnitag → KeyManagement → PasskeyGeneration, and back-navigation returns through the same steps in reverse

---
id: connectors-embedded-oauth-login
title: Log in offers Google/Apple OAuth and email recovery
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: >-
  Backed by WalletModals.test.tsx "EmbeddedWalletConnectionsModal > OAuth initiation"
  unit tests (Google/Apple initOAuth + sessionStorage, email recovery modal, email
  disabled during OAuth loading; verified test names); no Testlio counterpart named for
  the OAuth branch specifically.
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - embedded-wallet
  - oauth
# execution
automatable: true
testLevel: unit
runFrequency: release
# coverage
code_paths:
  - apps/web/src/components/WalletModal/WalletModalLayout.tsx
  - apps/web/src/connection/
  - apps/web/src/components/AccountDrawer/PasskeyMenu/
automationRefs:
  - path: apps/web/src/components/WalletModal/WalletModals.test.tsx
    testName: EmbeddedWalletConnectionsModal > OAuth initiation > Google button calls initOAuth and sets sessionStorage
  - path: apps/web/src/components/WalletModal/WalletModals.test.tsx
    testName: EmbeddedWalletConnectionsModal > OAuth initiation > Email button opens recovery modal without calling initOAuth
---

> **high · unit · release · automated** · platforms: web

**Given** the Embedded Wallet connections modal is open and the user clicks "Log In"
**When** the user selects a login method
**Then** the Google and Apple buttons call `initOAuth` and set the OAuth sessionStorage marker, the Email button opens the recovery modal without calling `initOAuth`, and the email button is disabled while an OAuth request is in flight

---
id: connectors-embedded-passkey-add
title: Add a new passkey authenticator to the embedded wallet
# importance
priority: medium
severity: high
# provenance
source: existing-e2e
sourceNote: >-
  Web Playwright e2e PasskeyMenu.e2e.test.ts authenticator tests (verified test names).
  Testlio: connect/passkey-management portion of "Add and remove liquidity with embedded
  (passkey) wallet" (blueprint annotates this suite as owned here for the connect portion
  only; the LP flow body stays in the LP area).
testlioRef: Add and remove liquidity with embedded (passkey) wallet
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - embedded-wallet
  - passkey
wallets:
  - TW-CONNECTORS-03
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/components/AccountDrawer/PasskeyMenu/
automationRefs:
  - path: apps/web/src/components/AccountDrawer/PasskeyMenu/PasskeyMenu.e2e.test.ts
    testName: shows authenticators after API response
  - path: apps/web/src/components/AccountDrawer/PasskeyMenu/PasskeyMenu.e2e.test.ts
    testName: calls StartAuthenticatedSession before AddAuthenticator
---

> **medium · e2e · release · automated** · platforms: web

**Given** an embedded (passkey) wallet is connected (test wallet TW-CONNECTORS-03) and the Passkey menu is open
**When** the user adds a new passkey
**Then** the client calls `StartAuthenticatedSession` before `AddAuthenticator`, the new authenticator succeeds, and the authenticators list reflects it after the API response

---
id: connectors-embedded-passkey-delete
title: Delete a passkey authenticator with speedbump and keep the wallet connected
# importance
priority: medium
severity: high
# provenance
source: existing-e2e
sourceNote: >-
  Web Playwright e2e PasskeyMenu.e2e.test.ts delete tests (verified test names, including
  "deleting a non-last passkey keeps the wallet connected" and the speedbump test).
  Testlio: connect/passkey-management portion of "Add and remove liquidity with embedded
  (passkey) wallet" (blueprint annotates this suite as owned here for the connect portion
  only).
testlioRef: Add and remove liquidity with embedded (passkey) wallet
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - embedded-wallet
  - passkey
wallets:
  - TW-CONNECTORS-03
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/components/AccountDrawer/PasskeyMenu/
automationRefs:
  - path: apps/web/src/components/AccountDrawer/PasskeyMenu/PasskeyMenu.e2e.test.ts
    testName: opens delete passkey speedbump when trash icon is clicked
  - path: apps/web/src/components/AccountDrawer/PasskeyMenu/PasskeyMenu.e2e.test.ts
    testName: deleting a non-last passkey keeps the wallet connected
---

> **medium · e2e · release · automated** · platforms: web

**Given** an embedded wallet with more than one passkey authenticator (test wallet TW-CONNECTORS-03)
**When** the user clicks the trash icon on a non-last authenticator and confirms past the speedbump
**Then** the speedbump warning appears before the confirmation, the delete uses the `DELETE_AUTHENTICATOR` action with the correct `authenticatorId`, the authenticator is removed, and the wallet stays connected. The delete affordance is hidden when only one authenticator remains

---
id: connectors-embedded-fiat-connect
title: Connect an embedded (passkey) wallet from the fiat on-ramp entry point
# importance
priority: high
severity: medium
# provenance
source: testlio
sourceNote: >-
  Testlio suite "Embedded Wallet - Fiat" (blueprint lists it with a "(connect portion)"
  annotation — only the connect precondition is owned by connectors; the fiat purchase
  body belongs to the fiat_onramp area). No automation — real passkey ceremony required.
testlioRef: Embedded Wallet - Fiat
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - embedded-wallet
  - passkey
  - fiat-onramp
wallets:
  - TW-CONNECTORS-03
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/components/WalletModal/
  - apps/web/src/connection/
  - apps/web/src/components/AccountDrawer/PasskeyMenu/
automationRefs: []
---

> **high · e2e · release · manual** · platforms: web

**Given** a disconnected session with the Embedded Wallet feature flag enabled, and the tester's embedded (passkey) wallet TW-CONNECTORS-03
**When** the user starts the fiat on-ramp (Buy) flow and, at the connect prompt, logs in to the embedded wallet with their passkey
**Then** the passkey ceremony completes, the embedded wallet's address appears connected in the nav, and the user is returned to the Buy flow with the connected wallet pre-selected as the receiving account (the fiat purchase itself is asserted by the fiat_onramp area, not here)
