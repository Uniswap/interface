# Fiat Onramp scenarios — Buy (on-ramp)

Fiat on-ramp ("Buy") flows: amount entry, token/country selection, provider
selection, order submission to third-party providers (Moonpay, Coinbase,
Robinhood, Transak, Stripe), deeplinking into Buy, the embedded-wallet buy
portion, extension Buy routing, and the post-provider return. The connect
portion of the 'Embedded Wallet - Fiat' Testlio suite is owned by the
connectors area. Shared defaults: `_defaults.yaml`. Wallet aliases are
symbolic (see `_defaults.yaml`).

Automation convention: provider flows are `automatable: false` past the
provider-handoff boundary (third-party login/KYC/real-money checkout cannot be
automated); pre-handoff form behavior is `automatable: true`.

---
id: fiat-onramp-quick-amount-select
title: Buy form quick-amount preset builds a quote and reveals provider selection
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: "(a) automated web e2e — apps/web/src/pages/Swap/Buy/Buy.e2e.test.ts 'Buy Crypto Form > quick amount select'; (b) Testlio Web — 'New onramp and offramp flows'"
testlioRef: New onramp and offramp flows
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - fiat
  - onramp
  - smoke
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/Swap/Buy/BuyForm.tsx
  - apps/web/src/pages/Swap/Buy/PredefinedAmount.tsx
  - apps/web/src/pages/Swap/Buy/BuyFormButton.tsx
automationRefs:
  - path: apps/web/src/pages/Swap/Buy/Buy.e2e.test.ts
    testName: Buy Crypto Form > quick amount select
---

> **high · e2e · scheduled · automated** · chains: ethereum

**Given** a connected wallet on `/buy` with an input token selected (Ethereum)
**When** the user clicks a predefined amount preset ("$100") and clicks "Continue"
**Then** the Continue button is enabled and the "Choose provider" step (`buy-form-choose-provider`) becomes visible

---
id: fiat-onramp-user-input-amount
title: Buy form accepts a typed fiat amount and advances to provider selection
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: "(a) automated web e2e — apps/web/src/pages/Swap/Buy/Buy.e2e.test.ts 'Buy Crypto Form > user input amount'"
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - fiat
  - onramp
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/Swap/Buy/BuyForm.tsx
  - apps/web/src/pages/Swap/Buy/BuyFormContext.tsx
automationRefs:
  - path: apps/web/src/pages/Swap/Buy/Buy.e2e.test.ts
    testName: Buy Crypto Form > user input amount
---

> **high · e2e · scheduled · automated** · chains: ethereum

**Given** a connected wallet on `/buy` with an input token selected
**When** the user types a custom amount ("123") into the amount input and clicks "Continue"
**Then** the "Choose provider" step (`buy-form-choose-provider`) becomes visible

---
id: fiat-onramp-change-input-token
title: Changing the buy input token preserves amount and re-quotes providers
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) automated web e2e — apps/web/src/pages/Swap/Buy/Buy.e2e.test.ts 'Buy Crypto Form > change input token'"
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - fiat
  - onramp
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Swap/Buy/SelectTokenPanel.tsx
  - apps/web/src/pages/Swap/Buy/resolveInitialBuyFormToken.ts
automationRefs:
  - path: apps/web/src/pages/Swap/Buy/Buy.e2e.test.ts
    testName: Buy Crypto Form > change input token
---

> **medium · e2e · release · automated** · chains: ethereum

**Given** a connected wallet on `/buy`
**When** the user opens the token selector, picks a different token (DAI), enters an amount, and clicks "Continue"
**Then** the newly selected token is used and the "Choose provider" step becomes visible

---
id: fiat-onramp-change-country
title: Changing buy country refreshes supported providers and currency
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) automated web e2e — apps/web/src/pages/Swap/Buy/Buy.e2e.test.ts 'Buy Crypto Form > change country'"
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - fiat
  - onramp
  - geo
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/fiatOnRamp/FiatOnRampCountryPicker.tsx
  - apps/web/src/pages/Swap/Buy/CountryListModal.tsx
automationRefs:
  - path: apps/web/src/pages/Swap/Buy/Buy.e2e.test.ts
    testName: Buy Crypto Form > change country
---

> **medium · e2e · release · automated** · chains: ethereum

**Given** a connected wallet on `/buy` with the country picker (`fiat-on-ramp-country-picker`) available
**When** the user opens the country picker, selects a different country (Argentina), and enters an amount
**Then** the form recomputes for the new region and Continue proceeds to provider selection

---
id: fiat-onramp-submit-order-moonpay
title: Submit an on-ramp order to Moonpay and track it in Activity
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "(b) Testlio Wallet — 'FOR - Submit Order to Moonpay - iOS/Android'. The suite repeats the purchase across base/polygon/optimism/arbitrum with ETH and USDC — treat those as per-chain reruns of this case. Not automatable past the Moonpay checkout handoff (real-money purchase); pre-handoff form behavior is covered by the automated Buy form cases."
testlioRef: FOR - Submit Order to Moonpay - iOS/Android
# scope
chains:
  - ethereum
  - base
  - polygon
  - optimism
  - arbitrum
platforms:
  - mobile
labels:
  - regression
  - fiat
  - onramp
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
  - apps/mobile/src/features/fiatOnRamp/FiatOnRampAggregatorModal.tsx
  - apps/mobile/src/features/fiatOnRamp/FiatOnRampAmountSection.tsx
  - packages/uniswap/src/features/fiatOnRamp/hooks/useFiatOnRampQueries.ts
automationRefs: []
---

> **urgent · e2e · release · manual** · chains: ethereum, base, polygon, optimism, arbitrum

**Given** the mobile app with test wallet TW-FIATONRAMP-01 (funded) in a Moonpay-supported region
**When** the user taps Buy/Sell on the Buy tab, selects a minimal input amount, taps Continue, selects Moonpay, and completes the Moonpay checkout to buy ETH
**Then** on return to the wallet a pending toaster appears, the Activity tab shows a pending Moonpay transaction whose detail modal offers "View on Moonpay", copy transaction ID and Get Help, and once the order succeeds the transaction moves out of pending and the token balance updates

---
id: fiat-onramp-provider-coinbase
title: On-ramp purchase via Coinbase updates USDC balance
# importance
priority: urgent
severity: high
# provenance
source: testlio
sourceNote: "(b) Testlio Wallet — 'FOR - Coinbase - iOS/Android'. Not automatable past the Coinbase external-browser login/checkout handoff."
testlioRef: FOR - Coinbase - iOS/Android
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - fiat
  - onramp
  - provider
  - coinbase
wallets:
  - TW-FIATONRAMP-01
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/fiatOnRamp/FiatOnRampAggregatorModal.tsx
  - packages/uniswap/src/features/fiatOnRamp/FORQuoteItem.tsx
automationRefs: []
---

> **urgent · e2e · release · manual** · chains: ethereum

**Given** the mobile app with test wallet TW-FIATONRAMP-01 (funded)
**When** the user opens Buy, selects a minimal amount with USDC as the token, taps Continue, selects Coinbase from the provider list, logs in to Coinbase in the external browser, submits a purchase, and returns to the wallet
**Then** the provider list includes Coinbase, the external browser opens, the purchase shows pending under Activity, and once confirmed it leaves pending and the USDC balance updates

---
id: fiat-onramp-provider-robinhood
title: On-ramp purchase via Robinhood updates ETH balance
# importance
priority: urgent
severity: high
# provenance
source: testlio
sourceNote: "(b) Testlio Wallet — 'FOR - Robinhood - iOS/Android'. Not automatable past the Robinhood external-browser/app login and checkout handoff."
testlioRef: FOR - Robinhood - iOS/Android
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - fiat
  - onramp
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
  - apps/mobile/src/features/fiatOnRamp/FiatOnRampAggregatorModal.tsx
  - packages/uniswap/src/features/fiatOnRamp/FORQuoteItem.tsx
automationRefs: []
---

> **urgent · e2e · release · manual** · chains: ethereum

**Given** the mobile app with test wallet TW-FIATONRAMP-01 (funded)
**When** the user opens Buy, selects a minimal amount with ETH as the token, taps Continue, selects Robinhood, logs in via the external browser or Robinhood app, submits a purchase, and returns to the wallet
**Then** the provider list includes Robinhood, the purchase shows pending under Activity, and once confirmed it leaves pending and the ETH balance updates

---
id: fiat-onramp-provider-transak
title: On-ramp purchase via Transak updates MATIC/POL balance
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "(b) Testlio Wallet — 'FOR - Transak - iOS/Android'. Not automatable past the Transak external-browser login/checkout handoff."
testlioRef: FOR - Transak - iOS/Android
# scope
chains:
  - polygon
platforms:
  - mobile
labels:
  - regression
  - fiat
  - onramp
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
  - apps/mobile/src/features/fiatOnRamp/FiatOnRampAggregatorModal.tsx
  - packages/uniswap/src/features/fiatOnRamp/FORQuoteItem.tsx
automationRefs: []
---

> **high · e2e · release · manual** · chains: polygon

**Given** the mobile app with test wallet TW-FIATONRAMP-01 (funded)
**When** the user opens Buy, selects a minimal amount with POL (MATIC) as the token, taps Continue, selects Transak, logs in via the external browser, submits a purchase, and returns to the wallet
**Then** the provider list includes Transak, the purchase shows pending under Activity, and once confirmed it leaves pending and the MATIC balance updates

---
id: fiat-onramp-provider-stripe-kyc
title: On-ramp purchase via Stripe including KYC completion
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "(b) Testlio Wallet — 'FOR - Stripe - iOS/Android'. Not automatable: requires a real Stripe KYC identity-verification pass."
testlioRef: FOR - Stripe - iOS/Android
# scope
chains:
  - polygon
platforms:
  - mobile
labels:
  - regression
  - fiat
  - onramp
  - provider
  - stripe
  - kyc
wallets:
  - TW-FIATONRAMP-01
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/fiatOnRamp/FiatOnRampAggregatorModal.tsx
  - packages/uniswap/src/features/fiatOnRamp/FORQuoteItem.tsx
automationRefs: []
---

> **high · e2e · release · manual** · chains: polygon

**Given** the mobile app with a non-KYC-verified test wallet TW-FIATONRAMP-01 in a Stripe-supported region
**When** the user opens Buy, selects a minimal amount with MATIC as the token, taps Continue, selects Stripe, logs in and completes the Stripe KYC process, submits a purchase, and returns to the wallet
**Then** the provider list includes Stripe, KYC completes, the purchase shows pending under Activity, and once confirmed it leaves pending and the MATIC balance updates

---
id: fiat-onramp-return-preserves-provider-query
title: Returning from a provider forwards to /buy with the provider query intact
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "(a) automated unit — apps/web/src/pages/Swap/Buy/OnRampReturn.test.tsx 'OnRampReturn > forwards to /buy with the provider query string intact'"
# scope
platforms:
  - web
labels:
  - regression
  - fiat
  - onramp
  - deeplink
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/pages/Swap/Buy/OnRampReturn.tsx
  - apps/web/src/pages/Swap/Buy/onRampRedirectUrl.ts
automationRefs:
  - path: apps/web/src/pages/Swap/Buy/OnRampReturn.test.tsx
    testName: OnRampReturn > forwards to /buy with the provider query string intact
---

> **high · unit · pr-check · automated** · platforms: web

**Given** the web app receives a return redirect from an on-ramp provider carrying a provider query string
**When** the `OnRampReturn` route renders
**Then** it forwards the user to `/buy` with the provider query string preserved so the pending transaction can be reconciled

---
id: fiat-onramp-redirect-url-not-claimed-by-native
title: On-ramp return path resolves correctly and is not captured by native app-links
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "(a) automated unit — apps/web/src/pages/Swap/Buy/onRampRedirectUrl.test.ts (getOnRampRedirectUrl desktop/mobile-web cases plus the AASA/Android app-link non-claim assertions; the app-link describe title is built from the ON_RAMP_RETURN_PATH constant, so refs cite the it-level names)"
# scope
platforms:
  - web
labels:
  - regression
  - fiat
  - onramp
  - deeplink
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/pages/Swap/Buy/onRampRedirectUrl.ts
automationRefs:
  - path: apps/web/src/pages/Swap/Buy/onRampRedirectUrl.test.ts
    testName: getOnRampRedirectUrl > returns the buy page on desktop web
  - path: apps/web/src/pages/Swap/Buy/onRampRedirectUrl.test.ts
    testName: getOnRampRedirectUrl > returns the app-link-safe return path on mobile web
  - path: apps/web/src/pages/Swap/Buy/onRampRedirectUrl.test.ts
    testName: is not matched by any iOS AASA applinks component
  - path: apps/web/src/pages/Swap/Buy/onRampRedirectUrl.test.ts
    testName: is not under any Android app-link pathPrefix
---

> **high · unit · pr-check · automated** · platforms: web

**Given** the on-ramp redirect-URL helper is invoked on desktop web and on mobile web
**When** `getOnRampRedirectUrl` computes the return URL
**Then** it returns the buy page on desktop and an app-link-safe return path on mobile web, and the return path is NOT matched by any iOS AASA applinks component nor any Android app-link pathPrefix (so it is not hijacked by the native apps)

---
id: fiat-onramp-moonpay-deeplink-web
title: Buy deeplink with chain param prompts connect/switch and reaches provider selection
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "(b) Testlio Web — 'Moonpay Deeplinking' (/buy?chain=base). Automatable up to the provider-handoff boundary (connect/switch prompts and form state, with FOR API mocks); the Testlio run additionally completes the provider purchase, which is manual-only."
testlioRef: Moonpay Deeplinking
# scope
chains:
  - base
platforms:
  - web
labels:
  - regression
  - fiat
  - onramp
  - deeplink
wallets:
  - TW-FIATONRAMP-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Swap/Buy/BuyForm.tsx
  - apps/web/src/pages/Swap/Buy/resolveInitialBuyFormToken.ts
automationRefs: []
---

> **high · e2e · release · gap** · chains: base

**Given** the web app opened at `/buy?chain=base` with test wallet TW-FIATONRAMP-01
**When** the user arrives (a) already connected on Ethereum, (b) disconnected, or (c) already connected on Base
**Then** case (a) prompts a chain switch to Base, case (b) prompts wallet connect then a switch to Base, case (c) proceeds directly — and in every case the header reflects "Buying on Base" and Continue reaches the "Choose provider" step for Base

---
id: fiat-onramp-deeplink-mobile
title: fiatonramp deeplink opens the Buy flow prefilled on mobile
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: "(a) automated Maestro e2e — apps/mobile/.maestro/flows/deeplinks/deeplink-comprehensive.yaml opens uniswap://app/fiatonramp (plus the moonpayOnly variant) and asserts ForFormTokenSelected + BuyFormAmountInput"
# scope
platforms:
  - mobile
labels:
  - regression
  - fiat
  - onramp
  - deeplink
wallets:
  - TW-FIATONRAMP-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/fiatOnRamp/FiatOnRampAggregatorModal.tsx
  - apps/mobile/src/features/fiatOnRamp/FiatOnRampContext.tsx
automationRefs:
  - path: apps/mobile/.maestro/flows/deeplinks/deeplink-comprehensive.yaml
    testName: deeplink-comprehensive
---

> **high · e2e · nightly · automated** · platforms: mobile

**Given** the mobile app is installed with test wallet TW-FIATONRAMP-01
**When** the app opens the deeplink `uniswap://app/fiatonramp?userAddress=<addr>&source=push`
**Then** the Buy (FOR) flow opens with a token preselected (`ForFormTokenSelected`) and the amount input (`BuyFormAmountInput`) is present and interactable

---
id: fiat-onramp-get-token-cta-buy-with-card
title: Get-token CTA on TDP offers "Buy with Card" when funds are insufficient
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "(b) Testlio Wallet — '[Moonpay] Get Token CTA - Android'. A separate 'Get Token CTA - iOS' title could not be verified against the blueprint and is not cited; run the case on both OSes. Assertions stop at opening the FOR flow (pre-handoff), so it is automatable in principle."
testlioRef: "[Moonpay] Get Token CTA - Android"
# scope
chains:
  - base
platforms:
  - mobile
labels:
  - regression
  - fiat
  - onramp
  - tdp
wallets:
  - TW-FIATONRAMP-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/fiatOnRamp/FiatOnRampAggregatorModal.tsx
  - packages/uniswap/src/features/fiatOnRamp/hooks.ts
automationRefs: []
---

> **medium · e2e · release · gap** · chains: base

**Given** the mobile app with test wallet TW-FIATONRAMP-01 that lacks the target token / gas on the target chain (e.g. no ETH on Base)
**When** the user opens the token's TDP and taps the "Get <token>" CTA
**Then** both "Swap for ETH on Base" and "Buy with Card" options are displayed, and choosing "Buy with Card" opens the fiat on-ramp flow for the target chain

---
id: fiat-onramp-embedded-wallet-buy
title: Embedded-wallet user completes the buy form through provider selection
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "(b) Testlio Web — 'Embedded Wallet - Fiat (buy portion)' (blueprint title; buy portion only — the connect portion is owned by the connectors area catalog). Not automatable: the embedded wallet requires a real passkey/OAuth login."
testlioRef: Embedded Wallet - Fiat (buy portion)
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - fiat
  - onramp
  - embedded-wallet
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Swap/Buy/BuyForm.tsx
  - apps/web/src/pages/Swap/Buy/ChooseProviderModal.tsx
  - apps/web/src/state/embeddedWallet/
automationRefs: []
---

> **high · e2e · release · manual** · chains: ethereum

**Given** the web app with a user signed in via the embedded (Uniswap) wallet
**When** the user opens `/buy`, selects a token, enters an amount, and clicks "Continue"
**Then** quotes are fetched for the embedded wallet's address, the "Choose provider" step lists available providers, and selecting a provider hands off to the provider checkout with the embedded wallet's address as the destination

---
id: fiat-onramp-extension-buy-routing
title: Extension Buy button opens web /buy with the dapp chain query param
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: "(c) codebase — apps/extension/src/app/features/for/utils.ts: useInterfaceBuyNavigator/navigateToInterfaceFiatOnRamp open the web interface buy URL and append ?chain=<urlParam> for the active dapp chain; entry points in apps/extension/src/app/features/home/PortfolioActionButtons.tsx and TokenBalanceList.tsx."
# scope
platforms:
  - extension
labels:
  - regression
  - fiat
  - onramp
  - deeplink
wallets:
  - TW-FIATONRAMP-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/for/utils.ts
  - apps/extension/src/app/features/home/PortfolioActionButtons.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · platforms: extension

**Given** the extension sidebar open with test wallet TW-FIATONRAMP-01 and the connected dapp on a non-mainnet chain (e.g. Base)
**When** the user clicks the Buy action in the extension
**Then** a new tab opens on the web interface `/buy` URL with `?chain=<dapp chain urlParam>` appended, and with no dapp chain set the `/buy` URL opens without a chain param

---
id: fiat-onramp-unit-country-from-locale
title: getCountryFromLocale derives the buy/sell country from device locale
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "(a) automated unit — apps/web/src/pages/Swap/Buy/shared.test.tsx 'getCountryFromLocale' (web-only code path)"
# scope
platforms:
  - web
labels:
  - regression
  - fiat
  - unit
  - geo
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/pages/Swap/Buy/shared.tsx
automationRefs:
  - path: apps/web/src/pages/Swap/Buy/shared.test.tsx
    testName: getCountryFromLocale > should extract country from navigatorLocale when available
  - path: apps/web/src/pages/Swap/Buy/shared.test.tsx
    testName: getCountryFromLocale > should return default US country when locale is unavailable
---

> **medium · unit · pr-check · automated** · platforms: web

**Given** a device/navigator locale with, without, or with a malformed country code
**When** `getCountryFromLocale` runs
**Then** it extracts and uppercases the country code when present, falls back to `navigator.language`, returns the default (US or a provided custom default) when no country code is present, and handles parsing errors gracefully

---
id: fiat-onramp-unit-iso-currency-validation
title: isValidIsoCurrencyCode and FOR utils validate provider inputs
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "(a) automated unit — packages/uniswap/src/features/fiatOnRamp/utils.test.ts (isValidIsoCurrencyCode, getCountryFlagSvgUrl, isFiatOnRampApiError). Quote filtering/sectioning and amount-error classification from the same spec are covered by fiat-onramp-unit-quote-filtering-and-sections."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - fiat
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/fiatOnRamp/utils.ts
automationRefs:
  - path: packages/uniswap/src/features/fiatOnRamp/utils.test.ts
    testName: isValidIsoCurrencyCode > returns true for valid 3-letter currency codes
  - path: packages/uniswap/src/features/fiatOnRamp/utils.test.ts
    testName: isFiatOnRampApiError > returns true
---

> **medium · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** currency codes, country codes and API error shapes passed to the fiat on-ramp utilities
**When** `isValidIsoCurrencyCode`, `getCountryFlagSvgUrl` and `isFiatOnRampApiError` are called
**Then** currency validation accepts valid 3-letter codes (case-insensitive) and rejects non-strings/wrong-length/non-alphabetic input, the flag URL is built correctly for a country code, and API errors are correctly identified

---
id: fiat-onramp-unit-quote-filtering-and-sections
title: FOR quote filtering, sectioning and amount-error classification
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "(a) automated unit — packages/uniswap/src/features/fiatOnRamp/utils.test.ts (filterQuotesByPaymentMethod, organizeQuotesIntoSections, isInvalidRequestAmountTooHigh, isInvalidRequestAmountTooLow)"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - fiat
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/fiatOnRamp/utils.ts
automationRefs:
  - path: packages/uniswap/src/features/fiatOnRamp/utils.test.ts
    testName: filterQuotesByPaymentMethod > filters by Apple Pay
  - path: packages/uniswap/src/features/fiatOnRamp/utils.test.ts
    testName: filterQuotesByPaymentMethod > returns all quotes when no filter is provided
  - path: packages/uniswap/src/features/fiatOnRamp/utils.test.ts
    testName: organizeQuotesIntoSections > organizes quotes with most recent provider first
  - path: packages/uniswap/src/features/fiatOnRamp/utils.test.ts
    testName: organizeQuotesIntoSections > organizes quotes by best quote when no most recent provider
  - path: packages/uniswap/src/features/fiatOnRamp/utils.test.ts
    testName: isInvalidRequestAmountTooHigh > returns true
  - path: packages/uniswap/src/features/fiatOnRamp/utils.test.ts
    testName: isInvalidRequestAmountTooLow > returns true
---

> **medium · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** provider quote lists and FOR API error payloads
**When** `filterQuotesByPaymentMethod`, `organizeQuotesIntoSections`, `isInvalidRequestAmountTooHigh` and `isInvalidRequestAmountTooLow` are called
**Then** quotes are filtered per payment method (Apple Pay, Google Pay, Bank/ACH, Debit, PayPal, Venmo) with null/undefined/empty inputs handled, sections put the most-recent provider first (falling back to best quote), and amount-too-high/too-low API errors are classified only for matching 400-status payloads

---
id: fiat-onramp-unit-payment-method-filter
title: PaymentMethodFilter renders and reflects selection across platforms
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "(a) automated unit — packages/uniswap/src/features/fiatOnRamp/PaymentMethodFilter/PaymentMethodFilter.test.tsx"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - fiat
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/fiatOnRamp/PaymentMethodFilter/
automationRefs:
  - path: packages/uniswap/src/features/fiatOnRamp/PaymentMethodFilter/PaymentMethodFilter.test.tsx
    testName: PaymentMethodFilter > Mobile Implementation > renders mobile implementation correctly
  - path: packages/uniswap/src/features/fiatOnRamp/PaymentMethodFilter/PaymentMethodFilter.test.tsx
    testName: PaymentMethodFilter > Web Implementation > renders web implementation correctly
---

> **medium · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** the payment-method filter with a set of supported payment methods (incl. iOS-specific methods)
**When** it renders on the web and mobile implementations with and without a selected method
**Then** it renders the correct implementation per platform, reflects the selected payment method, and honors platform/iOS-specific props

---
id: fiat-onramp-unit-provider-connected-and-error-views
title: Provider connected and connection-error views render and fire callbacks
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "(a) automated unit — apps/web/src/pages/Swap/Buy/ProviderConnectedView.test.tsx & ProviderConnectionError.test.tsx"
# scope
platforms:
  - web
labels:
  - regression
  - fiat
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/pages/Swap/Buy/ProviderConnectedView.tsx
  - apps/web/src/pages/Swap/Buy/ProviderConnectionError.tsx
automationRefs:
  - path: apps/web/src/pages/Swap/Buy/ProviderConnectedView.test.tsx
    testName: ProviderConnectedView > should render the component and call callbacks
  - path: apps/web/src/pages/Swap/Buy/ProviderConnectionError.test.tsx
    testName: ProviderConnectionError > should render the component and call callbacks
---

> **medium · unit · pr-check · automated** · platforms: web

**Given** the provider-connected view and the provider-connection-error view
**When** each renders and the user triggers its actions
**Then** the component renders as expected and invokes its callbacks (continue/retry/close as applicable)

---
id: fiat-onramp-unit-country-list-and-predefined-amount
title: Country list modal and predefined-amount presets render and select
# importance
priority: low
severity: low
# provenance
source: existing-unit
sourceNote: "(a) automated unit — apps/web/src/pages/Swap/Buy/CountryListModal.test.tsx, CountryListRow.test.tsx, PredefinedAmount.test.tsx"
# scope
platforms:
  - web
labels:
  - regression
  - fiat
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/pages/Swap/Buy/CountryListModal.tsx
  - apps/web/src/pages/Swap/Buy/CountryListRow.tsx
  - apps/web/src/pages/Swap/Buy/PredefinedAmount.tsx
automationRefs:
  - path: apps/web/src/pages/Swap/Buy/CountryListModal.test.tsx
    testName: CountryListModal > should render options and call select callback
  - path: apps/web/src/pages/Swap/Buy/CountryListRow.test.tsx
    testName: CountryListRow > should render selected country
  - path: apps/web/src/pages/Swap/Buy/PredefinedAmount.test.tsx
    testName: PredefinedAmount
---

> **low · unit · pr-check · automated** · platforms: web

**Given** the country list modal/rows and predefined-amount presets
**When** they render and the user selects a country or an amount preset (or closes the modal)
**Then** options render (including the selected country state), the select and close callbacks fire, and predefined amounts render correctly

---
id: fiat-onramp-unit-for-transaction-polling
title: FOR transaction polling updates, keeps or removes pending fiat purchases
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "(a) automated unit — packages/wallet/src/features/transactions/watcher/watchFiatOnRampSaga.test.ts (watchFiatOnRampTransaction), exercising fetchFORTransaction in packages/wallet/src/features/fiatOnRamp/api.ts. Flow-level Activity assertions live in the provider submit-order cases."
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - fiat
  - unit
  - activity
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/fiatOnRamp/api.ts
  - packages/wallet/src/features/transactions/watcher/watchFiatOnRampSaga.ts
automationRefs:
  - path: packages/wallet/src/features/transactions/watcher/watchFiatOnRampSaga.test.ts
    testName: watchFiatOnRampTransaction > updates a transactions on success network request
  - path: packages/wallet/src/features/transactions/watcher/watchFiatOnRampSaga.test.ts
    testName: watchFiatOnRampTransaction > removes transactions on 404 when stale
  - path: packages/wallet/src/features/transactions/watcher/watchFiatOnRampSaga.test.ts
    testName: watchFiatOnRampTransaction > keeps a transaction on 404 when not yet stale
---

> **high · unit · pr-check · automated** · platforms: mobile, extension

**Given** a pending FOR (fiat purchase/sell) transaction stored locally for the active account
**When** the FOR transaction watcher polls the aggregator API for its status
**Then** a successful response updates the stored transaction's status, a 404 before the 20-minute staleness window keeps the transaction pending (including when a fetch is forced), and a 404 after the staleness window removes the stale transaction from the store

---
id: fiat-onramp-decimal-pad-caret-position
title: Buy amount decimal pad caret stays correctly positioned when typing fast (mobile)
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: >-
  Derived from the caret-positioning fix in
  apps/mobile/src/features/fiatOnRamp/FiatOnRampAmountSection.tsx and
  apps/mobile/src/screens/FiatOnRampScreen.tsx (both consuming the shared
  packages/uniswap/src/features/transactions/components/DecimalPadInput/DecimalPadInput.tsx)
  — the native caret update now waits for the render that carries the value it belongs to
  (instead of a racy setTimeout + setNativeProps), preventing iOS from recomputing a stale
  cursor position when a keystroke lands before the previous render committed. No Testlio
  counterpart yet.
# scope
platforms:
  - mobile
labels:
  - regression
  - fiat
  - onramp
  - decimal-pad
  - edge-case
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/features/fiatOnRamp/FiatOnRampAmountSection.tsx
  - apps/mobile/src/screens/FiatOnRampScreen.tsx
  - packages/uniswap/src/features/transactions/components/DecimalPadInput/
automationRefs: []
---

> **medium · e2e · release · gap** · platforms: mobile

**Given** the mobile Buy amount field is focused
**When** the user taps digits on the decimal pad rapidly — including a tap that inserts or deletes mid-value rather than at the end — faster than a render cycle
**Then** the caret lands at the correct position for the value just entered on every keystroke, and never jumps to the start of the field or to a stale offset left over from the previous value
