# WalletConnect scenarios — Session lifecycle (mobile)

Inbound WalletConnect v2 session handling on the mobile wallet: pairing via QR
and deeplink, session proposal approval, namespace authorization of incoming
requests, session restore on launch, disconnect on account removal, and SIWE
authentication. Shared defaults: `_defaults.yaml`. Wallets referenced by
symbolic alias only.

Testlio mapping notes: mobile cases cite the verbatim suite title
"WalletConnect - General - iOS"; the Android counterpart suite
"WalletConnect - General - Android" runs the same steps on Android and is
noted per-case in sourceNote (testlioRef holds a single verbatim title).
The mobile "Dapp Connection" Testlio suite is not yet mapped to a case —
its raw CSV steps were not available to verify subsumption; review against
this file and `requests.md` before the first export.

---
id: walletconnect-connect-via-qr
title: Pair with a dapp by scanning a WalletConnect QR code
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "Testlio suite 'WalletConnect - General - iOS' (Android counterpart suite: 'WalletConnect - General - Android'). The proposal parse/save layer is unit-covered by apps/mobile/src/features/walletConnect/saga.test.ts ('WalletConnect Saga > handleSessionProposal > dispatches addPendingSession with correct parameters for valid proposal'), but the camera/QR scan flow itself has no same-level e2e automation and is not feasibly automatable (physical camera input), so this stays a manual release pass."
testlioRef: WalletConnect - General - iOS
# scope
protocol_version: wc-v2
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - walletconnect
  - smoke
wallets:
  - TW-WALLETCONNECT-01
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/walletConnect/saga.ts
  - apps/mobile/src/features/walletConnect/walletConnectClient.ts
  - apps/mobile/src/features/walletConnect/WalletConnect.ts
automationRefs: []
---

> **high · wc-v2 · e2e · release · manual** · chains: ethereum

**Given** the mobile wallet is unlocked on test wallet TW-WALLETCONNECT-01 and the user taps the Scan icon on the Home tab (granting camera permission)
**And** a dapp (e.g. app.uniswap.org) has displayed a WalletConnect QR code on desktop
**When** the user points the camera at the QR code
**Then** the camera freezes, a session-proposal sheet appears showing the dapp logo, URL and the account to connect, and `addPendingSession` is dispatched with the parsed proposal metadata

---
id: walletconnect-connect-via-deeplink
title: Pair with a dapp via a WalletConnect deeplink or universal link
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Derived from the WalletConnect deeplink handling tests in apps/mobile/src/features/deepLinking/handleDeepLinkSaga.test.ts (all four URI forms). Deeplink is the primary mobile-browser-to-wallet connect path. No Maestro flow exercises WC deeplinks (apps/mobile/.maestro/flows/deeplinks/deeplink-comprehensive.yaml contains no WC steps), so the on-device pairing UX after routing remains manual; the routing layer itself is automated at unit level."
# scope
protocol_version: wc-v2
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - walletconnect
  - deeplink
wallets:
  - TW-WALLETCONNECT-01
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/mobile/src/features/deepLinking/handleDeepLinkSaga.ts
  - apps/mobile/src/features/walletConnect/walletConnectClient.ts
automationRefs:
  - path: apps/mobile/src/features/deepLinking/handleDeepLinkSaga.test.ts
    testName: handleDeepLink > Handles WalletConnect connection using Universal Link URL
  - path: apps/mobile/src/features/deepLinking/handleDeepLinkSaga.test.ts
    testName: handleDeepLink > Handles WalletConnect connection using Uniswap URL scheme with WalletConnect URI as query param
  - path: apps/mobile/src/features/deepLinking/handleDeepLinkSaga.test.ts
    testName: handleDeepLink > Handles WalletConnect connection using Uniswap URL scheme with WalletConnect URI
  - path: apps/mobile/src/features/deepLinking/handleDeepLinkSaga.test.ts
    testName: handleDeepLink > Handles WalletConnect connection using WalletConnect URI
---

> **high · wc-v2 · unit · pr-check · automated** · chains: ethereum

**Given** the mobile wallet is installed with an active account (TW-WALLETCONNECT-01)
**When** the app is opened via any WalletConnect pairing URI form: a universal link (`https://uniswap.org/app/wc?uri=<wcUri>`), the Uniswap scheme with the WC URI as a query param (`uniswap://wc?uri=<wcUri>`), the Uniswap scheme wrapping the WC URI directly, or a bare `wc:` URI
**Then** `handleWalletConnectDeepLink` is called with the extracted WC URI (after `waitForWcWeb3WalletIsReady`), a `DeepLinkOpened` analytics event fires with the matching action, and the session-proposal sheet flow proceeds as in QR pairing; arbitrary non-WC URL schemes are rejected

---
id: walletconnect-session-proposal-permissions
title: Session-proposal sheet shows dapp identity and scoped permissions
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "Testlio suite 'WalletConnect - General - iOS' (Android counterpart suite: 'WalletConnect - General - Android'). The verified-origin resolution is unit-covered by apps/mobile/src/features/walletConnect/saga.test.ts ('WalletConnect Saga > handleSessionProposal > uses verifyContext.verified.origin as URL when available'); the proposal-sheet UI itself has no same-level e2e automation (a WC test dapp driven via deeplink pairing could automate it)."
testlioRef: WalletConnect - General - iOS
# scope
protocol_version: wc-v2
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - walletconnect
wallets:
  - TW-WALLETCONNECT-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/walletConnect/saga.ts
  - apps/mobile/src/features/walletConnect/fetchDappDetails.ts
automationRefs: []
---

> **high · wc-v2 · e2e · release · gap** · chains: ethereum

**Given** a WalletConnect session proposal sheet is displayed for a dapp
**When** the user expands the "App permissions" dropdown and the account selector
**Then** the sheet shows the verified dapp origin/URL, and permissions read "View your balance" and "Request Transactions" with an explicit "cannot move funds without permission" statement
**And** the account selector lists the wallet's signer accounts so the user can choose which to connect

---
id: walletconnect-request-namespace-authorization
title: Incoming requests from an address outside the session namespace are rejected
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
sourceNote: "Backed by the 'handleSessionRequest authorization' suite in apps/mobile/src/features/walletConnect/saga.test.ts, covering all four inbound methods (eth_sendTransaction, personal_sign, wallet_getCapabilities, wallet_sendCalls)."
# scope
protocol_version: wc-v2
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - walletconnect
  - security
wallets:
  - TW-WALLETCONNECT-01
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/mobile/src/features/walletConnect/saga.ts
automationRefs:
  - path: apps/mobile/src/features/walletConnect/saga.test.ts
    testName: WalletConnect Saga > handleSessionRequest authorization > rejects eth_sendTransaction whose `from` is not in the session namespace
  - path: apps/mobile/src/features/walletConnect/saga.test.ts
    testName: WalletConnect Saga > handleSessionRequest authorization > rejects personal_sign whose address is not in the session namespace
  - path: apps/mobile/src/features/walletConnect/saga.test.ts
    testName: WalletConnect Saga > handleSessionRequest authorization > rejects wallet_getCapabilities whose address is not in the session namespace
  - path: apps/mobile/src/features/walletConnect/saga.test.ts
    testName: WalletConnect Saga > handleSessionRequest authorization > rejects wallet_sendCalls whose `from` is not in the session namespace
---

> **urgent · wc-v2 · unit · pr-check · automated** · chains: ethereum

**Given** an active WalletConnect session scoped to a specific account address (namespace)
**When** the dapp sends `eth_sendTransaction`, `personal_sign`, `wallet_getCapabilities` or `wallet_sendCalls` whose `from`/address is NOT in the session namespace
**Then** the request is rejected (never surfaced for signing), so a dapp cannot induce the wallet to sign or transact for an account the user never approved

---
id: walletconnect-restore-sessions-on-launch
title: Active sessions are restored on launch; expired and orphaned ones are dropped
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Backed by the 'populateActiveSessions' suite in apps/mobile/src/features/walletConnect/saga.test.ts (restore, expired, orphaned, and partial-failure paths)."
# scope
protocol_version: wc-v2
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - walletconnect
wallets:
  - TW-WALLETCONNECT-01
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/mobile/src/features/walletConnect/saga.ts
  - apps/mobile/src/features/walletConnect/walletConnectSlice.ts
automationRefs:
  - path: apps/mobile/src/features/walletConnect/saga.test.ts
    testName: WalletConnect Saga > populateActiveSessions > restores valid sessions to store
  - path: apps/mobile/src/features/walletConnect/saga.test.ts
    testName: WalletConnect Saga > populateActiveSessions > disconnects expired sessions instead of restoring them
  - path: apps/mobile/src/features/walletConnect/saga.test.ts
    testName: WalletConnect Saga > populateActiveSessions > disconnects orphaned sessions whose accounts no longer exist
  - path: apps/mobile/src/features/walletConnect/saga.test.ts
    testName: WalletConnect Saga > populateActiveSessions > continues restoring other sessions if one disconnect fails
---

> **high · wc-v2 · unit · pr-check · automated** · chains: ethereum

**Given** the wallet has previously established WalletConnect sessions
**When** the app launches and `populateActiveSessions` runs
**Then** still-valid sessions are restored to the store, expired sessions are disconnected rather than restored, sessions whose accounts no longer exist are disconnected, and a failure disconnecting one session does not abort restoring the rest

---
id: walletconnect-disconnect-on-account-removal
title: Removing an account disconnects only its WalletConnect sessions
# importance
priority: high
severity: medium
# provenance
source: existing-unit
sourceNote: "Backed by the 'disconnectSessionsForRemovedAccounts' suite in apps/mobile/src/features/walletConnect/saga.test.ts."
# scope
protocol_version: wc-v2
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - walletconnect
wallets:
  - TW-WALLETCONNECT-02
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/mobile/src/features/walletConnect/saga.ts
automationRefs:
  - path: apps/mobile/src/features/walletConnect/saga.test.ts
    testName: WalletConnect Saga > disconnectSessionsForRemovedAccounts > disconnects sessions associated with removed accounts
  - path: apps/mobile/src/features/walletConnect/saga.test.ts
    testName: WalletConnect Saga > disconnectSessionsForRemovedAccounts > does not disconnect sessions for unrelated accounts
---

> **high · wc-v2 · unit · pr-check · automated** · chains: ethereum

**Given** a multi-account wallet (TW-WALLETCONNECT-02) with WalletConnect sessions on more than one account
**When** the user removes one account
**Then** `disconnectSessionsForRemovedAccounts` disconnects the sessions bound to the removed account only, and leaves sessions for the remaining accounts intact

---
id: walletconnect-siwe-authenticate
title: Sign-In With Ethereum (EIP-4361) authentication request over WalletConnect
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Backed by the 'handleSessionAuthenticate' suite in apps/mobile/src/features/walletConnect/saga.test.ts (chain filtering and active-account routing of session_authenticate)."
# scope
protocol_version: wc-v2
chains:
  - ethereum
  - polygon
platforms:
  - mobile
labels:
  - regression
  - walletconnect
  - siwe
wallets:
  - TW-WALLETCONNECT-01
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/mobile/src/features/walletConnect/saga.ts
  - apps/mobile/src/features/walletConnect/utils.ts
automationRefs:
  - path: apps/mobile/src/features/walletConnect/saga.test.ts
    testName: WalletConnect Saga > handleSessionAuthenticate > processes authentication request
---

> **high · wc-v2 · unit · pr-check · automated** · chains: ethereum, polygon

**Given** a dapp sends a WalletConnect `session_authenticate` (SIWE / EIP-4361) request whose authPayload lists both supported and unsupported chains (e.g. eip155 and solana)
**When** `handleSessionAuthenticate` processes the request for the active account
**Then** non-eip155 chains are filtered out, only supported eip155 chains remain in the formatted set, and the authentication request is surfaced for the correct active account

---
id: walletconnect-manage-and-disconnect-sessions
title: Connected apps are listed and can be disconnected from settings
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio suite 'WalletConnect - General - iOS' (Android counterpart suite: 'WalletConnect - General - Android'). The connection-management screen is co-owned with the settings area (settings owns the screen; this case asserts the session-store disconnect side-effect). No same-level e2e automation exists."
testlioRef: WalletConnect - General - iOS
# scope
protocol_version: wc-v2
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - walletconnect
wallets:
  - TW-WALLETCONNECT-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/walletConnect/walletConnectSlice.ts
  - apps/mobile/src/features/walletConnect/selectors.ts
automationRefs: []
---

> **medium · wc-v2 · e2e · release · gap** · chains: ethereum

**Given** the wallet has one or more active WalletConnect sessions (e.g. Uniswap Interface, OpenSea)
**When** the user opens Settings → profile → Connections and uses the "…" menu / long-press on a connected app
**Then** the connections page lists each connected dapp, exposes "Disconnect All" and "Edit", and disconnecting an individual app removes it from the list and terminates its session
**And** (overlap note) the connection-management screen is co-owned with the `settings` area; this case asserts the disconnect side-effect on the session store only
