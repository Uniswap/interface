# Explore scenarios — Multichain Token UX

Multichain token grouping across Explore lists, the Token Detail Page, and
search. Testlio "Multichain Token UX" feature cases (web suites cited in
`testlioRef`; the wallet-side variants "Explore - Multichain Token UX",
"TDP - Multichain Token UX", and "Search - Multichain Token UX" are noted in
`sourceNote` since `testlioRef` holds exactly one verbatim title). The data
layer is unit-tested (see `explore-multichain-trending-rankings-data` in
`search.md`); the UI flows below have no same-level automation and render as
gaps. Shared defaults: `_defaults.yaml`. No live wallet required for these
read-only discovery surfaces.

---
id: explore-multichain-grouping-ui
title: Explore groups multichain tokens with a networks affordance
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "(b) Testlio Web 'Multichain Token UX - Explore'; wallet-suite variant 'Explore - Multichain Token UX' (iOS/Android); data layer automated at unit level only (top1DVolumeTokens.test.ts, see explore-multichain-trending-rankings-data) — the grouped-row/hover/click UI has no e2e automation"
testlioRef: Multichain Token UX - Explore
# scope
chains:
  - ethereum
  - base
  - unichain
platforms:
  - web
  - mobile
labels:
  - regression
  - explore
  - multichain
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Explore/tables/
  - packages/uniswap/src/features/explore/
  - packages/uniswap/src/features/dataApi/top1DVolumeTokens.ts
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum, base, unichain

**Given** the user views the Explore tokens table with multichain token UX enabled and no network filter applied
**When** multichain tokens are listed
**Then** they are grouped into a single row with no corner network badge, hovering the row shows "x networks" with up to three network icons, and clicking the row navigates to the multichain (all-networks) TDP

---
id: explore-multichain-network-filtered-tdp
title: Network-filtered Explore and search open the network-filtered TDP
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "(b) Testlio Web 'Multichain Token UX - Explore' (network-filtered branch; same branch appears in 'Multichain Token UX - Search'); wallet-suite variants 'Explore - Multichain Token UX' and 'Search - Multichain Token UX' — no e2e automation"
testlioRef: Multichain Token UX - Explore
# scope
chains:
  - ethereum
  - base
  - unichain
platforms:
  - web
  - mobile
labels:
  - regression
  - explore
  - search
  - multichain
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Explore/tables/
  - apps/web/src/pages/TokenDetails/
  - packages/uniswap/src/features/search/SearchModal/
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum, base, unichain

**Given** the Explore table (or the search modal) is filtered to a specific network with multichain token UX enabled
**When** the user selects a multichain token row or search result
**Then** the network-filtered TDP for that chain opens (not the all-networks TDP), showing chain-specific data for the filtered network

---
id: explore-multichain-tdp-network-selector
title: Multichain TDP shows a header network selector
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "(b) Testlio Web 'Multichain Token UX - TDP'; wallet-suite variant 'TDP - Multichain Token UX' (iOS/Android) — no automated coverage"
testlioRef: Multichain Token UX - TDP
# scope
chains:
  - ethereum
  - base
  - unichain
platforms:
  - web
  - mobile
labels:
  - regression
  - tdp
  - multichain
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/TokenDetails/
  - apps/web/src/pages/TokenDetails/components/
  - packages/uniswap/src/features/chains/
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum, base, unichain

**Given** the user opens the TDP for a multichain token (e.g., USDC, ETH, WBTC)
**When** the header renders
**Then** a network selector is shown in the header (Explorer/Website icons hidden, only share and more), and switching networks updates the displayed chain-specific data

---
id: explore-multichain-search-subtext
title: Search shows multichain tokens with networks subtext and chain submenu
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "(b) Testlio Web 'Multichain Token UX - Search'; wallet-suite variant 'Search - Multichain Token UX' (iOS/Android); the 'X networks' chain-count computation is automated at unit level only (packages/uniswap/src/features/search/SearchModal/utils/getSearchModalTokenRowChainCounts.test.ts: counts multichain rows by tokens.length; counts token rows in trending and results sections) — the rendered subtext/submenu UI has no e2e automation"
testlioRef: Multichain Token UX - Search
# scope
chains:
  - ethereum
  - base
  - unichain
platforms:
  - web
  - mobile
labels:
  - regression
  - search
  - multichain
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/search/SearchModal/
  - packages/uniswap/src/features/search/SearchModal/utils/getSearchModalTokenRowChainCounts.ts
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum, base, unichain

**Given** the user searches for a multichain token with multichain token UX enabled and no network filter applied
**When** results render
**Then** the result row shows an "X networks" subtext, its submenu lets the user copy a chain-specific address (with back navigation), and selecting the row opens the all-networks TDP
