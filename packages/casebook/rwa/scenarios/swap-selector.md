# RWA scenarios — Swap flow token selector & registry

Selecting a tokenized asset from the "Stocks" section of the swap token selector and
carrying it into the swap flow, plus the underlying RWA identification/tagging and
registry-parsing logic. Shared defaults: `_defaults.yaml`.

Wallet alias used below (no secrets; the real mnemonic lives in the QA vault keyed by
the same alias): `TW-RWA-01` = funded wallet holding a tradable RWA/stock token and a
stablecoin on Ethereum mainnet. The alias is region-neutral; each case's Given states
the region the session must run from.

Chain scope: `chains: [ethereum]` throughout this catalog. Ethereum mainnet (chainId 1)
is `PREFERRED_RWA_CHAIN_ID` and the production RWA chain; registry matching itself is
chain-scoped but multi-chain-capable (see `rwa-is-rwa-token-identification`).

---
id: rwa-token-selector-stocks-section
title: Selecting a Stocks-section token populates the swap flow
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "Blueprint Testlio suites 'Tokenized Assets - Swap Flow Token Selector' and (wallet CSV) \"Verify selecting a token from the 'Stocks' section in the token selector populates the swap flow\". The tagging/mapping logic is unit-covered by packages/uniswap/src/components/TokenSelector/tagRwaTokenSelectorSections.test.ts ('tags a matching single token row with its category, clean name, and issuer slug') and hooks/useRwaTokenOptions.test.ts ('maps and caps the list to the first 10'); the selector-to-swap-form UI flow has no e2e automation, so this e2e case renders as a gap."
testlioRef: Tokenized Assets - Swap Flow Token Selector
# scope
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - rwa
  - swap
  - token-selector
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/components/TokenSelector/tagRwaTokenSelectorSections.ts
  - packages/uniswap/src/components/TokenSelector/hooks/useRwaTokenOptions.ts
  - packages/uniswap/src/components/TokenSelector/lists/TokenSelectorSwapList.tsx
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** the user opens the swap token selector
**When** they select a token from the "Stocks" section
**Then** the token selector closes automatically and the selected stock token is highlighted
**And** the swap flow input field is populated with the selected stock token, showing the correct symbol, name, and icon
**And** repeatedly switching between stock and non-stock tokens keeps the swap input field and selector consistently showing the correct token, with no error messages or unexpected notifications

---
id: rwa-swap-stock-token-execute
title: Swap executes with a selected stock token and balances update
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "Blueprint Testlio suite 'Tokenized Assets - Swap Flow Token Selector'. Funds-moving smoke path; no e2e automation exists (a fork-based harness would be required for real stock-token swaps)."
testlioRef: Tokenized Assets - Swap Flow Token Selector
# scope
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - rwa
  - swap
  - smoke
wallets:
  - TW-RWA-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/components/TokenSelector/hooks/useRwaTokenOptions.ts
  - packages/uniswap/src/features/transactions/swap/
automationRefs: []
---

> **urgent · e2e · release · gap** · chains: ethereum

**Given** test wallet `TW-RWA-01` (funded, holding a tradable stock token + a stablecoin on Ethereum mainnet) is connected from a non-restricted region
**When** the user selects a stock token from the "Stocks" section, enters a valid amount, reviews, and confirms the swap
**Then** the swap executes successfully with the selected stock token and the wallet balances update to reflect the trade
**And** repeating the flow with different stock/non-stock tokens completes additional swaps without errors or unexpected notifications

---
id: rwa-is-rwa-token-identification
title: RWA token identification matches the ListRwas registry
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "Backed by packages/uniswap/src/features/rwa/useIsRWAToken.test.ts, rwaMatch.test.ts, and rwaCandidates.test.ts (all cited test names verified verbatim). Matching is multi-chain-capable (non-preferred chains are matched from the raw listRwas response) even though production RWA tokens live on Ethereum mainnet."
# scope
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - rwa
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/rwa/useIsRWAToken.ts
  - packages/uniswap/src/features/rwa/rwaMatch.ts
  - packages/uniswap/src/features/rwa/rwaCandidates.ts
automationRefs:
  - path: packages/uniswap/src/features/rwa/useIsRWAToken.test.ts
    testName: useIsRWAToken > matches non-preferred chain RWA tokens from the raw listRwas response when enabled
  - path: packages/uniswap/src/features/rwa/rwaMatch.test.ts
    testName: findRWAMatch > does not match when the address is on a different chain
  - path: packages/uniswap/src/features/rwa/rwaMatch.test.ts
    testName: findRWAMatch > keeps non-EVM token addresses case-sensitive
  - path: packages/uniswap/src/features/rwa/rwaCandidates.test.ts
    testName: getRWACandidatesFromCurrency > returns chain and address for ERC-20 currencies
---

> **medium · unit · pr-check · automated** · chains: ethereum

**Given** a currency and the `ListRwas` registry response
**When** `useIsRWAToken` derives candidates via `getRWACandidatesFromCurrency` and matches them with `rwaTokenMatchesCandidate` / `findRWAMatch`
**Then** it returns true for a registry-listed RWA token (including non-preferred chains) and false for a token not in the response
**And** matching is chain-scoped (no cross-chain match) and keeps non-EVM addresses case-sensitive
**And** the underlying `ListRwas` fetch is skipped when `enabled` is false or there are no candidate chain IDs

---
id: rwa-whitelist-registry-parsing
title: RWA whitelist parsing maps issuer data and preferred-chain tokens
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "Backed by packages/uniswap/src/features/rwa/useRWAWhitelist.test.ts (9 tests; cited names verified verbatim). Added per review: the registry-parsing layer that feeds every RWA surface was previously uncited."
# scope
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - rwa
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/rwa/useRWAWhitelist.ts
automationRefs:
  - path: packages/uniswap/src/features/rwa/useRWAWhitelist.test.ts
    testName: toRWAWhitelistFromDataApi > maps issuerData onto each token by its issuer
  - path: packages/uniswap/src/features/rwa/useRWAWhitelist.test.ts
    testName: toRWAWhitelistFromDataApi > drops tokens whose issuer has no issuerData entry
  - path: packages/uniswap/src/features/rwa/useRWAWhitelist.test.ts
    testName: toRWAWhitelistFromDataApi > carries network count for preferred issuer tokens
---

> **medium · unit · pr-check · automated** · chains: ethereum

**Given** a data-API `ListRwas` response with assets, issuer tokens, and issuerData entries
**When** `toRWAWhitelistFromDataApi` parses it into the RWA whitelist
**Then** issuerData is mapped onto each token by its issuer, tokens whose issuer has no issuerData entry are dropped (with an error logged for non-empty issuers), and an asset is excluded when none of its tokens resolve
**And** the asset display category resolves from `categories` (defaulting to UNSPECIFIED when absent) and network count is carried for preferred issuer tokens
