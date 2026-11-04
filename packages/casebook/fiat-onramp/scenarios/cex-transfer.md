# Fiat Onramp scenarios — CEX transfer (Receive)

Centralized-exchange (CEX) transfer flows reached from the Receive entry point:
selecting a CEX provider (Coinbase, Robinhood, OKX), completing the transfer in
the provider's in-app browser, and reflecting the incoming funds in Activity and
balances. Shared defaults: `_defaults.yaml`. Wallet aliases are symbolic (see
`_defaults.yaml`).

---
id: fiat-onramp-cex-transfer-funded-wallet
title: CEX transfer into a funded wallet reflects in Activity and balance
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "(b) Testlio Wallet — 'CEX Transfer - Transfer with funded wallet' (runs on iOS and Android). Not automatable past the CEX login/transfer handoff in the in-app browser."
testlioRef: CEX Transfer - Transfer with funded wallet
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - fiat
  - cex-transfer
wallets:
  - TW-FIATONRAMP-01
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/fiatOnRamp/ExchangeTransferModal.tsx
  - apps/mobile/src/features/fiatOnRamp/ExchangeTransferServiceProviderSelector.tsx
  - packages/uniswap/src/features/fiatOnRamp/useCexTransferProviders.ts
automationRefs: []
---

> **high · e2e · release · manual** · chains: ethereum

**Given** the mobile app home screen with test wallet TW-FIATONRAMP-01 (funded)
**When** the user taps Receive, selects a CEX from the list, and completes the transfer flow inside the provider's in-app browser
**Then** the CEX options list is displayed (e.g. Coinbase, Robinhood, OKX), the selected provider opens in the in-app browser, and after the transfer the Activity tab records it and the wallet balance updates on return to Home

---
id: fiat-onramp-cex-transfer-empty-wallet
title: CEX transfer into an empty wallet updates balance from zero
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "(b) Testlio Wallet — 'CEX Transfer - Transfer on empty wallet' (runs on iOS and Android). Not automatable past the CEX login/transfer handoff in the in-app browser."
testlioRef: CEX Transfer - Transfer on empty wallet
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - fiat
  - cex-transfer
  - edge-case
wallets:
  - TW-FIATONRAMP-02
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/fiatOnRamp/ExchangeTransferModal.tsx
  - apps/mobile/src/features/fiatOnRamp/ExchangeTransferServiceProviderSelector.tsx
  - packages/uniswap/src/features/fiatOnRamp/useCexTransferProviders.ts
automationRefs: []
---

> **high · e2e · release · manual** · chains: ethereum

**Given** the mobile app home screen with test wallet TW-FIATONRAMP-02 (empty, 0 balance)
**When** the user taps Receive, selects a CEX from the list, and completes the transfer flow inside the provider's in-app browser
**Then** the CEX options list is displayed, the flow completes without depending on any pre-existing balance, and the wallet balance updates from zero once the transfer settles
