# WalletConnect scenarios — Dapp requests over an active session (mobile)

Handling of RPC requests a paired dapp sends over a WalletConnect session:
transactions, message/typed-data signing, batched calls, capability queries,
chain filtering, self-call scam gating, and message decoding for the signing
UI. Shared defaults: `_defaults.yaml`. Wallets referenced by symbolic alias
only. Mobile testlioRefs cite the verbatim iOS suite title; the Android
counterpart suite "WalletConnect - General - Android" is noted in sourceNote.

---
id: walletconnect-transaction-request-approval
title: Dapp transaction request prompts, and approval submits the transaction
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "Testlio suite 'WalletConnect - General - iOS' (Android counterpart suite: 'WalletConnect - General - Android'). The request parse layer is unit-covered by apps/mobile/src/features/walletConnect/utils.test.ts ('parseTransactionRequest > parses eth_sendTransaction request correctly'); the end-to-end flow (push notification, approval sheet, on-chain submit, balance update) has no same-level e2e automation and requires the manual pass."
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
  - transactions
wallets:
  - TW-WALLETCONNECT-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/walletConnect/signWcRequestSaga.ts
  - apps/mobile/src/features/walletConnect/utils.ts
automationRefs: []
---

> **urgent · wc-v2 · e2e · release · gap** · chains: ethereum

**Given** test wallet TW-WALLETCONNECT-01 is connected to a dapp over WalletConnect and the dapp initiates a swap/purchase (an `eth_sendTransaction`)
**When** the request arrives (push notification + bottom sheet "Transaction Request from <dapp>" with Accept/Cancel)
**Then** the parsed request shows the correct dapp, `to`/value/data of the transaction; tapping Accept dismisses the sheet, a pending toaster appears, the transaction is submitted, and on confirmation the Home balance updates — Cancel submits nothing on-chain

---
id: walletconnect-personal-sign-and-typed-data
title: personal_sign / eth_sign / eth_signTypedData requests parse and surface for approval
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Backed by the parseSignRequest suite in apps/mobile/src/features/walletConnect/utils.test.ts covering all three signing methods."
# scope
protocol_version: wc-v2
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - walletconnect
  - signing
wallets:
  - TW-WALLETCONNECT-01
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/mobile/src/features/walletConnect/utils.ts
  - apps/mobile/src/features/walletConnect/signWcRequestSaga.ts
automationRefs:
  - path: apps/mobile/src/features/walletConnect/utils.test.ts
    testName: parseSignRequest > parses personal_sign request correctly (standard hex-encoded message)
  - path: apps/mobile/src/features/walletConnect/utils.test.ts
    testName: parseSignRequest > parses eth_sign request correctly
  - path: apps/mobile/src/features/walletConnect/utils.test.ts
    testName: parseSignRequest > parses personal_sign request correctly
---

> **high · wc-v2 · unit · pr-check · automated** · chains: ethereum

**Given** a paired dapp sends a `personal_sign`, `eth_sign`, or `eth_signTypedData`/`SignTypedDataV4` request
**When** `parseSignRequest` processes it
**Then** the correct method, signing account and message payload are extracted (personal_sign params ordered [message, account]; typed-data payload preserved) so the signing sheet shows the right account and message content to approve

---
id: walletconnect-decode-message-for-signing
title: Hex-encoded messages are decoded to human-readable text in the signing UI
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Backed by the decodeMessage suite in apps/mobile/src/features/walletConnect/utils.test.ts."
# scope
protocol_version: wc-v2
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - walletconnect
  - signing
  - security
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/mobile/src/features/walletConnect/utils.ts
automationRefs:
  - path: apps/mobile/src/features/walletConnect/utils.test.ts
    testName: decodeMessage > should decode hex-encoded message
  - path: apps/mobile/src/features/walletConnect/utils.test.ts
    testName: decodeMessage > should return plain text message unchanged
---

> **high · wc-v2 · unit · pr-check · automated** · chains: ethereum

**Given** a signing request whose message is a hex string (or already plain text)
**When** `decodeMessage` / `isHexString` runs before rendering the signing sheet
**Then** hex is decoded to the underlying UTF-8 text and plain text is returned unchanged, so the user reviews the actual message they are signing (mis-decoding would let a dapp hide what is being signed)

---
id: walletconnect-batched-sendcalls-request
title: wallet_sendCalls (EIP-5792 batched) and wallet_getCapabilities requests parse correctly
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Backed by the parseSendCallsRequest and parseGetCapabilitiesRequest suites in apps/mobile/src/features/walletConnect/utils.test.ts. Delegation/execution is owned by the smart_wallet area; this case asserts the WC parse boundary only."
# scope
protocol_version: wc-v2
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - walletconnect
  - batched
wallets:
  - TW-WALLETCONNECT-01
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/mobile/src/features/walletConnect/utils.ts
  - apps/mobile/src/features/walletConnect/batchedTransactionSaga.ts
automationRefs:
  - path: apps/mobile/src/features/walletConnect/utils.test.ts
    testName: parseSendCallsRequest > parses wallet_sendCalls request with from address
  - path: apps/mobile/src/features/walletConnect/utils.test.ts
    testName: parseSendCallsRequest > uses fallback address when from is not provided
  - path: apps/mobile/src/features/walletConnect/utils.test.ts
    testName: parseGetCapabilitiesRequest > handles request with address and chain IDs
---

> **high · wc-v2 · unit · pr-check · automated** · chains: ethereum

**Given** a dapp sends `wallet_sendCalls` (batched) with or without a `from` address, or a `wallet_getCapabilities` query
**When** `parseSendCallsRequest` / `parseGetCapabilitiesRequest` process it
**Then** the calls, signing account (falling back to the active account when `from` is absent) and requested chain IDs are extracted correctly for the batched-request approval flow (delegation/execution owned by `smart_wallet`; this asserts the WC parse boundary only)

---
id: walletconnect-self-call-with-data-blocked
title: Dapp-originated self-calls with data (scam signal) are rejected
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Backed by the isSelfCallWithData suite in packages/uniswap/src/features/dappRequests/utils.test.ts (parameterized it names are stable strings). The check is enforced for WC requests in apps/mobile/src/features/walletConnect/saga.ts (eth_sendTransaction and each wallet_sendCalls batch call are rejected with USER_REJECTED 'Self-calls with data are not supported') and for injected requests in apps/extension/src/contentScript/methodHandlers/ExtensionEthMethodHandler.ts (rejectSelfCallWithData). Legitimate self-call delegation is user-initiated and owned by the smart_wallet area."
# scope
chains:
  - ethereum
platforms:
  - mobile
  - extension
labels:
  - regression
  - walletconnect
  - security
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/dappRequests/utils.ts
  - apps/mobile/src/features/walletConnect/saga.ts
  - apps/extension/src/contentScript/methodHandlers/ExtensionEthMethodHandler.ts
automationRefs:
  - path: packages/uniswap/src/features/dappRequests/utils.test.ts
    testName: isSelfCallWithData > should return true when from equals to and data is present
  - path: packages/uniswap/src/features/dappRequests/utils.test.ts
    testName: isSelfCallWithData > should return true when from and to are the same address but different case
  - path: packages/uniswap/src/features/dappRequests/utils.test.ts
    testName: isSelfCallWithData > should return false when from equals to but data is 0x
---

> **high · unit · pr-check · automated** · chains: ethereum

**Given** a dapp sends an `eth_sendTransaction` (or a `wallet_sendCalls` batch containing a call) whose `to` equals the signing account's own address AND whose `data` is non-empty (a classic delegation-hijack/scam-transaction signal)
**When** the request is validated before being surfaced for signing
**Then** `isSelfCallWithData` returns true (case-insensitive address comparison) and the request is rejected — on mobile the WC session request is answered with the `USER_REJECTED` error "Self-calls with data are not supported"; on extension the injected request is rejected via `rejectSelfCallWithData` — while self-calls with empty `0x`/undefined data and normal transfers to other addresses are not blocked

---
id: walletconnect-supported-chain-filtering
title: Unsupported chains in a proposal/request are filtered out
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "Backed by the getSupportedWalletConnectChains and getChainIdFromEIP155String suites in apps/mobile/src/features/walletConnect/utils.test.ts."
# scope
protocol_version: wc-v2
chains:
  - ethereum
  - optimism
  - polygon
platforms:
  - mobile
labels:
  - regression
  - walletconnect
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/mobile/src/features/walletConnect/utils.ts
automationRefs:
  - path: apps/mobile/src/features/walletConnect/utils.test.ts
    testName: getSupportedWalletConnectChains > handles list of valid chains including an invalid chain
  - path: apps/mobile/src/features/walletConnect/utils.test.ts
    testName: getChainIdFromEIP155String > handles valid eip155 optimism address
---

> **medium · wc-v2 · unit · pr-check · automated** · chains: ethereum, optimism, polygon

**Given** a dapp proposal/request lists a mix of supported and unsupported eip155 chains
**When** `getSupportedWalletConnectChains` / `getChainIdFromEIP155String` map the eip155 strings
**Then** only supported chain IDs are returned and unsupported/invalid entries are dropped, so the wallet never approves a session or request for a chain it cannot serve
