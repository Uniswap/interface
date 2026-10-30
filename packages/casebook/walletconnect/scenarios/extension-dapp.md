# WalletConnect scenarios — Injected dapp requests (extension)

Inbound dapp connection and request handling for the browser extension, which
acts as an injected (EIP-1193/EIP-6963) wallet provider — no WalletConnect
relay is involved, so these cases carry no `protocol_version`. Covers
connection prompts and queue, chain and account synchronisation with the dapp,
transaction confirmation, message signing, stale-request handling, and dapp
risk/permission gating. Shared defaults: `_defaults.yaml`. Wallets referenced
by symbolic alias only. Case ids use the area-wide `walletconnect-` prefix
(`-ext-` marks extension-only cases).

---
id: walletconnect-ext-connection-prompt-and-approve
title: Navigating to a dapp prompts a connection that persists on approval
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "Testlio suite 'Dapp Connection - Extension'. E2e automation exists in the extension Playwright suites (cited in automationRefs): the web connect test drives the real navbar Connect -> Uniswap Extension -> sidebar approval flow, and the smoke test verifies provider injection/detection on app.uniswap.org. The connection persistence/no-silent-expansion rules are additionally unit-covered by apps/extension/src/app/features/dappRequests/accounts.test.ts ('saveAccount > saves the connection and notifies on a first-time connection', 'saveAccount > does not expand an already-connected origin to the unapproved active account')."
testlioRef: Dapp Connection - Extension
# scope
chains:
  - ethereum
platforms:
  - extension
labels:
  - regression
  - dapp
  - smoke
wallets:
  - TW-WALLETCONNECT-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/dappRequests/accounts.ts
  - apps/extension/src/app/features/dappRequests/requestContent/Connection/
  - apps/extension/src/app/features/dapp/saga.ts
automationRefs:
  - path: apps/extension/e2e/tests/web/extension-web-connect.test.ts
    testName: Extension-connected web swap > connects via the injected provider and renders a swap quote on app.uniswap.org
  - path: apps/extension/e2e/tests/smoke/wallet-connection.test.ts
    testName: Wallet Connection to Uniswap > extension is detected by Uniswap app
---

> **high · e2e · release · automated** · chains: ethereum

**Given** the extension is unlocked on test wallet TW-WALLETCONNECT-01 and the user navigates to a dapp (e.g. app.uniswap.org) and clicks Connect
**When** the dapp requests a connection and the user selects the Uniswap Extension account and confirms in the sidebar
**Then** the dapp shows the connected account, a first-time connection is saved and the user is notified; re-visiting does not silently expand the origin to an un-approved active account (only the approved account stays connected)

---
id: walletconnect-ext-request-queue
title: Multiple pending dapp requests queue and are navigable
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio suite 'Dapp Connection - Extension'. No automated coverage exists for the queue UI (no unit or e2e tests under DappRequestQueue*)."
testlioRef: Dapp Connection - Extension
# scope
chains:
  - ethereum
platforms:
  - extension
labels:
  - regression
  - dapp
wallets:
  - TW-WALLETCONNECT-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/dappRequests/DappRequestQueue.tsx
  - apps/extension/src/app/features/dappRequests/DappRequestQueueCards.tsx
  - apps/extension/src/app/features/dappRequests/DappRequestQueueContext.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** the user has triggered connection requests from more than one dapp (e.g. opensea.io then blur.io)
**When** they open the extension request queue and use the next/previous arrows
**Then** each pending request is shown as a separate card, the arrows move between requests, and approving/dismissing one advances the queue to the next without losing the others

---
id: walletconnect-ext-change-chain-bidirectional
title: Chain switches sync between the dapp and the extension in both directions
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "Testlio suite 'Dapp Connection - Extension'. Unit-covered by the changeChain suite in apps/extension/src/app/features/dapp/changeChain.test.ts; the on-page toast and dapp-side network-switcher sync remain part of the manual pass."
testlioRef: Dapp Connection - Extension
# scope
chains:
  - ethereum
  - base
  - arbitrum
platforms:
  - extension
labels:
  - regression
  - dapp
  - network
wallets:
  - TW-WALLETCONNECT-01
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/extension/src/app/features/dapp/changeChain.ts
  - apps/extension/src/app/features/dapp/store.ts
automationRefs:
  - path: apps/extension/src/app/features/dapp/changeChain.test.ts
    testName: changeChain > should update dappStore and send analytics event if dappUrl is provided
  - path: apps/extension/src/app/features/dapp/changeChain.test.ts
    testName: changeChain > should return an error response if updatedChainId is null
---

> **high · unit · pr-check · automated** · chains: ethereum, base, arbitrum

**Given** the extension is connected to a dapp (e.g. app.uniswap.org)
**When** the chain is changed from the dapp, or from the extension network dropdown while on the dapp
**Then** `changeChain` updates the dapp store (for a valid chain id and provider) and emits the analytics event, a chain-changed toast is shown, and both the dapp's network switcher and the extension dropdown reflect the new chain; a null chain id / null provider returns an error response and does not update the store

---
id: walletconnect-ext-transaction-request-confirm
title: Dapp-initiated transaction request shows a confirm modal and signs correctly
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "Testlio suite 'Dapp Connection - Extension'. The pre-sign safety layer is unit-covered by apps/extension/src/app/features/dappRequests/hooks/usePrepareAndSignDappTransaction.test.ts ('usePrepareAndSignDappTransaction > dependency changes > should reset preSignedTransaction when request changes' and '... when chainId changes'); the end-to-end confirm-and-submit flow has no same-level e2e automation (the extension-web-connect Playwright test stops at quote rendering and does not submit a transaction)."
testlioRef: Dapp Connection - Extension
# scope
chains:
  - ethereum
platforms:
  - extension
labels:
  - regression
  - dapp
  - transactions
wallets:
  - TW-WALLETCONNECT-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/dappRequests/requestContent/EthSend/
  - apps/extension/src/app/features/dappRequests/sagas/prepareAndSignDappTransactionSaga.ts
  - apps/extension/src/app/features/dappRequests/hooks/usePrepareAndSignDappTransaction.ts
automationRefs: []
---

> **urgent · e2e · release · gap** · chains: ethereum

**Given** test wallet TW-WALLETCONNECT-01 is connected to a dapp (e.g. uniswap web app) and initiates a swap/send/mint
**When** the `eth_sendTransaction` request reaches the extension
**Then** a confirm-transaction modal appears with the correct request details, the pre-signed transaction is reset whenever the request or chainId changes (so a stale payload is never signed), and confirming submits exactly one transaction which appears on the Activity tab

---
id: walletconnect-ext-message-signing
title: personal_sign / eth_signTypedData requests from a dapp show a decoded approval prompt
# importance
priority: high
severity: high
# provenance
source: uniswap
sourceNote: "Derived from the extension request-content code: apps/extension/src/app/features/dappRequests/requestContent/PersonalSign/PersonalSignRequestContent.tsx and requestContent/SignTypeData/SignTypedDataRequestContent.tsx (plus NonStandardTypedDataRequestContent.tsx). No unit or e2e tests exist under these directories, so this is an automation gap; the shared parse layer is covered on mobile by walletconnect-personal-sign-and-typed-data."
# scope
chains:
  - ethereum
platforms:
  - extension
labels:
  - regression
  - dapp
  - signing
wallets:
  - TW-WALLETCONNECT-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/dappRequests/requestContent/PersonalSign/
  - apps/extension/src/app/features/dappRequests/requestContent/SignTypeData/
  - apps/extension/src/contentScript/methodHandlers/ExtensionEthMethodHandler.ts
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** the extension is connected to a dapp on test wallet TW-WALLETCONNECT-01
**When** the dapp requests `personal_sign` (e.g. a login message) or `eth_signTypedData` (e.g. an EIP-712 permit)
**Then** the extension shows a signing prompt attributed to the requesting origin, addressed to the connected (signing) account, with the message rendered human-readable (typed-data fields decoded, not raw hex); approving returns exactly one signature to the dapp and rejecting returns an error with nothing signed

---
id: walletconnect-ext-stale-request-handling
title: Stale dapp requests are blocked from confirmation
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Backed by apps/extension/src/app/features/dappRequests/DappRequestContent.test.tsx (stale-request rendering) and hooks/useIsRequestStale.test.ts (30-minute threshold)."
# scope
chains:
  - ethereum
platforms:
  - extension
labels:
  - regression
  - dapp
  - security
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/extension/src/app/features/dappRequests/DappRequestContent.tsx
  - apps/extension/src/app/features/dappRequests/hooks/useIsRequestStale.ts
automationRefs:
  - path: apps/extension/src/app/features/dappRequests/DappRequestContent.test.tsx
    testName: DappRequestContent - Stale Request Rendering > should render warning and Close button for stale requests
  - path: apps/extension/src/app/features/dappRequests/hooks/useIsRequestStale.test.ts
    testName: isRequestStale > returns true for requests created more than 30 minutes ago
---

> **high · unit · pr-check · automated** · chains: ethereum

**Given** a dapp request older than the staleness threshold (30 minutes)
**When** the request content renders
**Then** `isRequestStale` returns true, a warning and a "Close" button are shown instead of Cancel/Confirm, so the user cannot confirm a stale transaction; fresh requests (<30 min) still render Cancel/Confirm

---
id: walletconnect-ext-account-switch-reconnect
title: Switching accounts in the extension updates the connected dapp account
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio suite 'Dapp Connection - Extension'. Unit-covered by apps/extension/src/app/features/dapp/hooks.test.ts and utils.test.ts (connection lookup and active-address ordering)."
testlioRef: Dapp Connection - Extension
# scope
chains:
  - ethereum
platforms:
  - extension
labels:
  - regression
  - dapp
wallets:
  - TW-WALLETCONNECT-02
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/extension/src/app/features/dapp/hooks.ts
  - apps/extension/src/app/features/dapp/utils.ts
automationRefs:
  - path: apps/extension/src/app/features/dapp/hooks.test.ts
    testName: Dapp hooks > useAllDappConnectionsForAccount > should return connections for a specific address when provided
  - path: apps/extension/src/app/features/dapp/utils.test.ts
    testName: getOrderedConnectedAddresses > places the active address first
---

> **medium · unit · pr-check · automated** · chains: ethereum

**Given** a multi-account wallet (TW-WALLETCONNECT-02) connected to a dapp
**When** the user switches to another account in the extension and approves the connect popup
**Then** the newly-connected account is added to the dapp's connection list, `getOrderedConnectedAddresses` places the active address first, and the dapp reflects the updated connected account

---
id: walletconnect-blockaid-threat-warning
title: Malicious or unverified dapps surface a risk warning before signing
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Backed by packages/wallet/src/features/dappRequests/hooks/useBlockaidVerification.test.ts (Threat status) and verification.test.ts (first-party hostname check, status-merge dominance). Shared packages/wallet layer, so this case covers both extension and mobile request surfaces."
# scope
chains:
  - ethereum
platforms:
  - extension
  - mobile
labels:
  - regression
  - dapp
  - security
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/dappRequests/hooks/useBlockaidVerification.ts
  - packages/wallet/src/features/dappRequests/verification.ts
automationRefs:
  - path: packages/wallet/src/features/dappRequests/hooks/useBlockaidVerification.test.ts
    testName: useBlockaidVerification > Verification status handling > should return Threat status when dapp is malicious
  - path: packages/wallet/src/features/dappRequests/verification.test.ts
    testName: isFirstPartyDapp > returns false for non-first-party hostnames
  - path: packages/wallet/src/features/dappRequests/verification.test.ts
    testName: mergeVerificationStatuses > when Threat is present > should return Threat when first status is Threat and second is Verified
---

> **high · unit · pr-check · automated** · chains: ethereum

**Given** a dapp connection/request whose site is scanned by Blockaid
**When** verification resolves to Threat (malicious) or Unverified, and statuses from multiple sources are merged
**Then** a Threat in any source dominates the merged status (Threat > Unverified > Verified), only genuine first-party hostnames (app.uniswap.org, not look-alikes) are treated as first-party, and the corresponding risk warning is surfaced before the user can proceed

---
id: walletconnect-ext-permissioned-swap-gate
title: Permissioned (KYC-gated) token swaps via a dapp are blocked for non-allowlisted accounts
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Backed by apps/extension/src/app/features/dappRequests/requestContent/EthSend/Swap/useDappSwapPermissionedBlock.test.ts and EthSend.test.tsx (gate keyed on the dapp-request signing account)."
# scope
chains:
  - ethereum
platforms:
  - extension
labels:
  - regression
  - dapp
  - compliance
wallets:
  - TW-WALLETCONNECT-01
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/extension/src/app/features/dappRequests/requestContent/EthSend/Swap/useDappSwapPermissionedBlock.ts
  - apps/extension/src/app/features/dappRequests/requestContent/EthSend/EthSend.tsx
automationRefs:
  - path: apps/extension/src/app/features/dappRequests/requestContent/EthSend/Swap/useDappSwapPermissionedBlock.test.ts
    testName: useDappSwapPermissionedBlock > should block with the output symbol and kycUrl when buying a permissioned token while not allowlisted
  - path: apps/extension/src/app/features/dappRequests/requestContent/EthSend/EthSend.test.tsx
    testName: EthSendRequestContent permissioned-swap gate (Blockaid healthy) > refuses a permissioned, non-allowlisted swap with no approve control even though scanning succeeds
---

> **high · unit · pr-check · automated** · chains: ethereum

**Given** a dapp `eth_sendTransaction` swap involving a permissioned (KYC-gated) token, keyed on the dapp-request signing account (not the active account)
**When** the signing account is not allowlisted
**Then** the swap is blocked with the relevant token symbol and KYC url, no approve/confirm control is offered even when Blockaid scanning succeeds; native-currency legs and allowlisted wallets are not blocked, and the check fails open only while loading
