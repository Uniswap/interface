# Swap Chains scenarios — Network selection & switching

Chain selection UX inside the swap token selector: switching networks, the per-chain token
badge/toast, and resolving a pasted token address on the selected chain. These are
chain-agnostic behaviours that gate every per-chain swap. Shared defaults: `_defaults.yaml`.
Wallet aliases are symbolic (never a mnemonic).

---
id: swap-chains-network-filter-switching
title: Network filter switches the active swap chain and refreshes the token list
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Network Switching - iOS/Android". The expected network list is
  defined by getEnabledChains (packages/uniswap/src/features/chains/utils.ts) for the
  current app and flag state — asserted against that resolver rather than a hardcoded
  chain list, which drifts as flag-gated chains (Monad, Tempo, MegaETH) roll out.
testlioRef: Network Switching - iOS/Android
# scope
protocol_version: all
chains:
  - ethereum
  - polygon
  - unichain
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - network-selector
wallets:
  - TW-SWAPCHAINS-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/chains/
  - packages/uniswap/src/features/chains/hooks/
  - apps/web/src/pages/Swap/
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: ethereum, polygon, unichain

**Given** test wallet `TW-SWAPCHAINS-01` is connected and the Swap token selector is open
**When** the user opens the network dropdown, verifies that every chain enabled for this app and flag state (per `getEnabledChains`) is listed — anchor checks: Ethereum and Polygon are present — and that no disabled chain appears, then selects Polygon
**Then** the menu dismisses, Polygon becomes the active network, the suggested-token list changes to Polygon tokens, and selecting a token shows the "Swapping on Polygon" toast with the token pre-filled in the swap form

---
id: swap-chains-network-badge-on-tokens
title: Selected-chain badge and swap toast reflect the active network
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Polygon Swap", step "every token should have a small Polygon
  badge"; (c) supporting evidence: per-chain logo/badge config in
  packages/uniswap/src/features/chains/logos.tsx.
testlioRef: Polygon Swap
# scope
protocol_version: all
chains:
  - polygon
  - unichain
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - network-selector
  - ui
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/chains/
  - packages/uniswap/src/features/chains/logos.tsx
automationRefs: []
---

> **medium · all · e2e · release · gap** · chains: polygon, unichain

**Given** the swap token selector is filtered to a specific network (e.g. Polygon)
**When** the user views the token list and then selects a token
**Then** each token logo shows the correct network badge for the active chain, and confirming a swap surfaces a "Swapping on <chain>" toast naming the active network

---
id: swap-chains-paste-token-address-on-chain
title: Pasting a token address resolves the token on the selected chain
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Unichain - iOS/Android" (paste-token-address step) and
  "Network Switching - iOS/Android" (paste token address on the selected network).
testlioRef: Unichain - iOS/Android
# scope
protocol_version: all
chains:
  - unichain
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - token-selector
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/chains/
  - packages/uniswap/src/features/transactions/swap/
automationRefs: []
---

> **medium · all · e2e · release · gap** · chains: unichain

**Given** the swap token selector is open with a specific network selected (e.g. Unichain)
**When** the user pastes a valid token contract address for that chain into the search field
**Then** the matching token is displayed with the correct network logo and can be selected as the swap input/output token

---
id: swap-chains-app-support-invariants
title: Chain app-support invariants hold (Solana web-only, EVM on all apps)
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: >-
  (a) packages/uniswap/src/features/chains/chainAppSupport.test.ts — describe
  "chain app support invariants" (every ordered chain declares supportedApps; Solana
  web-only; EVM chains on all three apps; getEnabledChains never returns unsupported
  chains per app).
# scope
protocol_version: all
chains:
  - ethereum
  - solana
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - chains
  - config
  - invariant
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/chains/chainAppSupport.ts
  - packages/uniswap/src/features/chains/chainInfo.ts
  - packages/uniswap/src/features/chains/utils.ts
automationRefs:
  - path: packages/uniswap/src/features/chains/chainAppSupport.test.ts
    testName: chain app support invariants
---

> **high · all · unit · pr-check · automated** · chains: ethereum, solana

**Given** the ordered chain config and app-support maps
**When** `isChainSupportedOnApp` / `filterChainIdsByAppSupport` / `getEnabledChains` are evaluated for web, mobile, and extension
**Then** every ordered chain declares at least one supported app, Solana is web-only (excluded on mobile and extension), every EVM chain is available on all three apps, and `getEnabledChains` never returns a chain unsupported on that app

---
id: swap-chains-enabled-chains-resolution
title: getEnabledChains resolves mainnet, feature-flagged, and testnet chain sets
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: >-
  (a) packages/uniswap/src/features/chains/utils.test.ts — describe "getEnabledChains".
  Also the unit-level backing for flag-gated chain visibility asserted by the Monad and
  Tempo e2e smokes (flag off => chain hidden from the network selector).
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - chains
  - config
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/chains/utils.ts
automationRefs:
  - path: packages/uniswap/src/features/chains/utils.test.ts
    testName: getEnabledChains
---

> **high · all · unit · pr-check · automated** · chains: ethereum

**Given** an app id, a testnet-mode flag, and a set of feature-flagged chain ids
**When** `getEnabledChains` is called
**Then** it returns all mainnet chains by default, adds feature-flagged chains only when their flags are enabled, returns testnet chains under testnet mode, and returns both when testnets are included — so a chain never appears in the swap network selector unless it is truly enabled

---
id: swap-chains-chain-id-conversion
title: Chain-id conversion helpers round-trip supported chains and reject unsupported
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: >-
  (a) packages/uniswap/src/features/chains/utils.test.ts — describes
  "toSupportedChainId", "chainIdToHexadecimalString", "hexadecimalStringToInt",
  "fromUniswapWebAppLink", "toUniswapWebAppLink".
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - chains
  - config
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/chains/utils.ts
automationRefs:
  - path: packages/uniswap/src/features/chains/utils.test.ts
    testName: toSupportedChainId
---

> **medium · all · unit · pr-check · automated** · chains: ethereum

**Given** a raw chain id, a web-app link, or a hex chain string
**When** the conversion helpers (`toSupportedChainId`, `chainIdToHexadecimalString`, `hexadecimalStringToInt`, `to/fromUniswapWebAppLink`) run
**Then** supported chains convert correctly and round-trip, undefined/unsupported chain ids resolve to no chain, and unknown web-app links throw — none resolve to the wrong chain
