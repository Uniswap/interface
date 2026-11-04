# Fiat Onramp scenarios — Sell (off-ramp)

Fiat off-ramp ("Sell") flows: the Sell tab (percentage presets, min-amount
validation, quote fetch), unsupported-token handling in the sell token selector,
provider selection, the on-chain "Send with Uniswap" confirm-transfer step that
moves funds to the provider, and the FOR instructions/help surface. Min-amount
validation is owned by `fiat-onramp-offramp-general-sell-tab`; the provider
cases assume a valid amount. Shared defaults: `_defaults.yaml`. Wallet aliases
are symbolic (see `_defaults.yaml`).

---
id: fiat-onramp-offramp-general-sell-tab
title: Sell tab presets, min-amount validation and quote fetch
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "(b) Testlio Wallet — 'Fiat Off Ramp - Offramp General'. Pre-handoff UI only (no provider login), so automatable in principle with a funded test wallet and FOR API mocks."
testlioRef: Fiat Off Ramp - Offramp General
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - fiat
  - offramp
wallets:
  - TW-FIATONRAMP-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/fiatOnRamp/FiatOnRampAmountSection.tsx
  - apps/mobile/src/features/fiatOnRamp/FiatOnRampTokenSelector.tsx
  - apps/mobile/src/features/fiatOnRamp/FiatOnRampCountryListModal.tsx
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** the mobile app with test wallet TW-FIATONRAMP-01 (funded)
**When** the user taps Buy/Sell, switches to the Sell tab, and interacts with amount presets and the token selector
**Then** the Sell tab defaults to 25/50/75% presets at $0 with the highest-balance token preselected, the token selector lists all tokens with balances plus an expandable Unsupported section, an under-minimum entry surfaces a min-amount error, and the country selector opens a scrollable region list without rendering issues

---
id: fiat-onramp-offramp-unsupported-token-modal
title: Selecting an unsupported sell token offers "Swap to a supported token"
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: "(c) codebase — packages/uniswap/src/features/fiatOnRamp/UnsupportedTokenModal.tsx (also Testlio 'Fiat Off Ramp - Offramp General' steps 5-8)"
testlioRef: Fiat Off Ramp - Offramp General
# scope
platforms:
  - web
  - mobile
labels:
  - regression
  - fiat
  - offramp
  - edge-case
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/fiatOnRamp/UnsupportedTokenModal.tsx
  - apps/mobile/src/features/fiatOnRamp/FiatOnRampTokenSelector.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · platforms: web, mobile

**Given** the user is on the Sell token selector with an unsupported token present in the list
**When** they tap an unsupported token
**Then** the Unsupported-token modal appears with "Go Back" and "Swap to a supported token" CTAs; "Go Back" returns to the token selector, and "Swap to a supported token" routes into the swap flow

---
id: fiat-onramp-offramp-provider-transak
title: Off-ramp sell via Transak submits a send and shows pending
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "(b) Testlio Wallet — 'Fiat Off Ramp - Transak/Robinhood/Moonpay Supported Region' (Transak leg). Not automatable past the Transak login/card-selection handoff (real funds move on Confirm Send)."
testlioRef: Fiat Off Ramp - Transak/Robinhood/Moonpay Supported Region
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - fiat
  - offramp
  - provider
  - transak
wallets:
  - TW-FIATONRAMP-01
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/fiatOnRamp/ExchangeTransferModal.tsx
  - packages/uniswap/src/features/fiatOnRamp/hooks/useFiatOnRampQueries.ts
automationRefs: []
---

> **urgent · e2e · release · manual** · chains: ethereum

**Given** the mobile app with test wallet TW-FIATONRAMP-01 (funded) in a Transak-supported region
**When** the user opens Sell, enters 0.01 ETH (above the min), taps Continue, selects Transak, taps "Sell Now", selects a card, taps Confirm, then taps "Confirm Send" back in the Uniswap app
**Then** a valid amount fetches a quote and enables Continue, the provider list appears, and after Confirm Send a "sell pending" toaster shows with a "Selling via Transak" pending Send in Activity that later settles

---
id: fiat-onramp-offramp-provider-robinhood
title: Off-ramp sell via Robinhood submits a send and updates balance
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "(b) Testlio Wallet — 'Fiat Off Ramp - Transak/Robinhood/Moonpay Supported Region' (Robinhood leg). Not automatable past the Robinhood app login/access-grant handoff (real funds move on Confirm)."
testlioRef: Fiat Off Ramp - Transak/Robinhood/Moonpay Supported Region
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - fiat
  - offramp
  - provider
  - robinhood
wallets:
  - TW-FIATONRAMP-01
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/fiatOnRamp/ExchangeTransferModal.tsx
  - packages/uniswap/src/features/fiatOnRamp/hooks/useFiatOnRampQueries.ts
automationRefs: []
---

> **urgent · e2e · release · manual** · chains: ethereum

**Given** the mobile app with test wallet TW-FIATONRAMP-01 (funded) in a Robinhood-supported region
**When** the user opens Sell, enters a valid amount (0.01 ETH), taps Continue, selects Robinhood, opens the Robinhood app, selects a payment method, reviews the quote, grants Uniswap access, and taps Confirm
**Then** the quote is fetched and Continue enabled, the Robinhood handoff and access-grant modal appear, and after Confirm the sell settles and the balance updates accordingly

---
id: fiat-onramp-offramp-provider-moonpay-send-with-uniswap
title: Off-ramp sell via Moonpay confirms an on-chain "Send with Uniswap"
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "(b) Testlio Wallet — 'Fiat Off Ramp - Transak/Robinhood/Moonpay Supported Region' (Moonpay leg). Not automatable past the Moonpay login/'Sell now' handoff (real funds move on Confirm Send)."
testlioRef: Fiat Off Ramp - Transak/Robinhood/Moonpay Supported Region
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - fiat
  - offramp
  - provider
  - moonpay
wallets:
  - TW-FIATONRAMP-01
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/fiatOnRamp/ExchangeTransferModal.tsx
  - packages/uniswap/src/features/fiatOnRamp/hooks/useFiatOnRampQueries.ts
automationRefs: []
---

> **urgent · e2e · release · manual** · chains: ethereum

**Given** the mobile app with test wallet TW-FIATONRAMP-01 (funded) in a Moonpay-supported region
**When** the user opens Sell, enters 0.01 ETH, taps Continue, selects Moonpay, agrees, taps "Sell now", taps "Send with Uniswap", then taps "Confirm Send" in the Uniswap confirm modal
**Then** the confirm modal shows the destination wallet address with Confirm Send and Navigate Back controls, and Confirm Send creates a pending "Selling via Moonpay" Send in Activity that later settles

---
id: fiat-onramp-offramp-confirm-transfer-web
title: Web off-ramp confirm-transfer builds and sends the transfer transaction
# importance
priority: urgent
severity: urgent
# provenance
source: uniswap
sourceNote: "(c) codebase — apps/web/src/pages/Swap/Buy/OffRampConfirmTransferModal.tsx (useSendCallback + useFiatOnRampAggregatorOffRampTransferDetailsQuery). Automatable with FOR API mocks (apps/web/src/playwright/mocks/fiatOnRamp/) and an anvil-backed send."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - fiat
  - offramp
wallets:
  - TW-FIATONRAMP-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Swap/Buy/OffRampConfirmTransferModal.tsx
  - packages/uniswap/src/features/fiatOnRamp/hooks/useFiatOnRampQueries.ts
automationRefs: []
---

> **urgent · e2e · release · gap** · chains: ethereum

**Given** the web app on `/buy` (Sell) with test wallet TW-FIATONRAMP-01 and an off-ramp provider selected
**When** the off-ramp transfer-details query resolves and the user confirms the transfer in `OffRampConfirmTransferModal`
**Then** the modal shows the source/destination amounts, network fee and shortened recipient address, and Confirm sends the transfer transaction via the send callback with the pending fiat-off-ramp transaction recorded in state

---
id: fiat-onramp-offramp-instructions
title: FOR / Fiat Off Ramp instructions and help surface is reachable and accurate
# importance
priority: low
severity: low
# provenance
source: testlio
sourceNote: "(b) Testlio Wallet — 'Instructions for FOR / Fiat Off Ramp'. Help/instructions surface of the buy/sell flow: the Get Help entry on FOR transaction details and the region/currency notices in the amount section (fiatOnRamp.error.unavailable / fiatOnRamp.error.usd in FiatOnRampAmountSection.tsx)."
testlioRef: Instructions for FOR / Fiat Off Ramp
# scope
platforms:
  - mobile
labels:
  - regression
  - fiat
  - offramp
  - help
wallets:
  - TW-FIATONRAMP-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/fiatOnRamp/FiatOnRampAggregatorModal.tsx
  - apps/mobile/src/features/fiatOnRamp/FiatOnRampAmountSection.tsx
automationRefs: []
---

> **low · e2e · release · gap** · platforms: mobile

**Given** the mobile app with test wallet TW-FIATONRAMP-01 on the Buy/Sell flow
**When** the user triggers the flow's instruction surfaces: enters the flow in an unsupported region, enters the flow with a non-USD app currency, and opens "Get Help" on a FOR transaction's detail modal
**Then** the unavailable-region notice and the USD-only notice render with accurate copy, "Get Help" opens the help center in the in-app browser, and returning from it restores the transaction detail view
