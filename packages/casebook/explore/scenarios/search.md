# Explore scenarios — Search

Token / wallet search from the Explore search modal: result rendering, recent
search history, ENS/unitag wallet resolution, and the external profile view.
Shared defaults: `_defaults.yaml`. No live wallet required for these read-only
lookups.

---
id: explore-search-token-results
title: Searching returns matching token results
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: "(a) mobile Maestro apps/mobile/.maestro/flows/explore/search.yaml; (b) Testlio Wallet 'Explore - Search - iOS/Android'; unit-level backing for the query layer in packages/uniswap/src/features/search/SearchModal/hooks/useSearchMultichainListTokens.test.ts (V2EndpointsTokens on > calls the v2 ListTokens client with the expected request shape)"
testlioRef: Explore - Search - iOS/Android
# scope
chains:
  - ethereum
platforms:
  - web
  - mobile
labels:
  - regression
  - search
  - smoke
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - packages/uniswap/src/features/search/
  - packages/uniswap/src/features/search/SearchModal/
  - apps/mobile/.maestro/flows/explore/
automationRefs:
  - path: apps/mobile/.maestro/flows/explore/search.yaml
    testName: explore-search
---

> **high · e2e · scheduled · automated** · chains: ethereum

**Given** the user opens the Explore search modal
**When** they type a token symbol or name into the search field
**Then** matching token results render with logo, symbol, and name, and selecting a result navigates to that token's TDP

---
id: explore-search-recent-history
title: Recent searches are persisted and shown on reopen
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "(a) unit packages/uniswap/src/features/search/searchHistorySlice.test.ts (addToSearchHistory, searchResultId de-dup); (b) Testlio Wallet 'Explore - Search - iOS/Android'"
testlioRef: Explore - Search - iOS/Android
# scope
chains:
  - ethereum
platforms:
  - web
  - mobile
labels:
  - regression
  - search
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/search/searchHistorySlice.ts
  - packages/uniswap/src/features/search/SearchModal/
automationRefs:
  - path: packages/uniswap/src/features/search/searchHistorySlice.test.ts
    testName: searchHistorySlice > addToSearchHistory > adds valid token search result to history
  - path: packages/uniswap/src/features/search/searchHistorySlice.test.ts
    testName: searchHistorySlice > searchResultId > generates distinct ids for multichain token with and without TDP chain filter
---

> **medium · unit · pr-check · automated** · chains: ethereum

**Given** the user has previously searched for and selected tokens
**When** they reopen the search modal with no query entered
**Then** a "Recent" section lists up to the most recent searches (across token/wallet/NFT tabs), de-duplicated by a stable search-result id

---
id: explore-search-wallet-ens-unitag
title: Wallet search resolves ENS names and unitags
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "(a) unit packages/uniswap/src/features/search/SearchModal/hooks/useWalletSearchResults.test.tsx (ENS resolution, unitag priority)"
# scope
chains:
  - ethereum
platforms:
  - web
  - mobile
labels:
  - regression
  - search
  - ens
# execution
automatable: true
testLevel: unit
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/search/SearchModal/hooks/useWalletSearchResults.tsx
  - packages/uniswap/src/features/ens/
automationRefs:
  - path: packages/uniswap/src/features/search/SearchModal/hooks/useWalletSearchResults.test.tsx
    testName: useWalletSearchResults > returns an ENSAddress entry when useENS resolves a name
  - path: packages/uniswap/src/features/search/SearchModal/hooks/useWalletSearchResults.test.tsx
    testName: useWalletSearchResults > prioritizes a unitag-by-name match over an ENS result
---

> **medium · unit · release · automated** · chains: ethereum

**Given** the user searches by a name that resolves to an ENS address and/or a unitag
**When** wallet search results are computed
**Then** an ENS address entry is returned, a unitag-by-name match is prioritized over the ENS result, and no wallet entry is returned when neither resolves

---
id: explore-search-profile-view
title: Selecting a wallet search result opens the external profile view
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "(b) Testlio Wallet 'Profile General - iOS (TDP)'; (c) code apps/mobile/src/screens/ExternalProfileScreen.tsx (mounted from ExploreStackNavigator); unit-level backing for result resolution in useWalletSearchResults.test.tsx — no e2e/Maestro flow covers the profile screen, so the e2e flow is a gap"
testlioRef: Profile General - iOS (TDP)
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - search
  - profile
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/screens/ExternalProfileScreen.tsx
  - apps/mobile/src/app/navigation/ExploreStackNavigator.tsx
  - packages/uniswap/src/features/search/SearchModal/
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** the user opens Explore search on mobile and types an ENS name or unitag that resolves to a wallet address
**When** they select the wallet result from the Wallets section
**Then** the external profile view opens for that address showing its display name/avatar, token balances, activity, and NFTs tabs, and the back action returns to search

---
id: explore-multichain-trending-rankings-data
title: Trending tokens resolve to one multichain option per token
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "(a) unit packages/uniswap/src/features/dataApi/top1DVolumeTokens.test.ts — since #42108 the single data source for every trending-tokens surface (search no-query shelf, both token selectors); the multichain Explore grouping UI itself is explore-multichain-grouping-ui, an e2e gap"
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
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/dataApi/top1DVolumeTokens.ts
automationRefs:
  - path: packages/uniswap/src/features/dataApi/top1DVolumeTokens.test.ts
    testName: top1DVolumeResultsToTokenOptions > picks the highest-1d-volume deployment when no chain is filtered
  - path: packages/uniswap/src/features/dataApi/top1DVolumeTokens.test.ts
    testName: useTop1DVolumeTokens > requests every enabled chain when there is no chain filter
---

> **medium · unit · pr-check · automated** · chains: ethereum, base, unichain

**Given** trending tokens are fetched for the search shelf with no network filter applied
**When** the results are turned into token options
**Then** every enabled chain is requested and each token becomes one option on its highest-1D-volume deployment (on the filtered chain when a network filter is set)

---
id: explore-search-web-enter-opens-first-result
title: Pressing Enter in the web search input opens the first result
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: "Consumer Engagement search QA plan (Notion, 2026-10-08), verified against apps/web/src/components/NavBar/SearchBar/SearchModal.tsx on disk. Result selection side effects are unit-covered in packages/uniswap/src/features/search/SearchModal/hooks/useSearchModalOptionSelection.test.ts; the keyboard path has no e2e."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - search
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/components/NavBar/SearchBar/
  - packages/uniswap/src/features/search/SearchModal/hooks/useSearchModalOptionSelection.ts
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** the web search input is focused with a query that has results
**When** the user presses Enter
**Then** the app navigates to the first search result, exactly as clicking that row would

---
id: explore-search-web-recent-pills
title: Web search shows recent searches as a scrollable pill row with correct badges
# importance
priority: medium
severity: low
# provenance
source: uniswap
sourceNote: "Consumer Engagement search QA plan (Notion, 2026-10-08), verified against packages/uniswap/src/features/search/SearchModal/RecentSearchPills/ on disk. Pill count cap and press reporting are unit-covered in RecentSearchPills.test.tsx ('caps the row at the pill limit'); the rendered row has no e2e beyond the recents assertions in SearchBar.e2e.test.ts cited by explore-search-recent-history."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - search
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/search/SearchModal/RecentSearchPills/
  - packages/uniswap/src/features/search/searchHistorySlice.ts
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** the user has recent token, pool and wallet searches
**When** they open web search on the All tab
**Then** up to 30 recent-search pills render in one horizontally scrollable row, with token, pool and wallet pills each rendering correctly
**And** multichain token pills show neither a count badge nor a network badge, while single-chain pills show their network badge

---
id: explore-search-web-section-counts-and-view-all
title: Web search sections show 3 results at rest and 6 while searching, each with View all
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: "Consumer Engagement search QA plan (Notion, 2026-10-08), verified against packages/uniswap/src/features/search/SearchModal/SearchModalNoQueryList.tsx, SearchModalResultsList.tsx and viewAll/ on disk. Section assembly is unit-covered in hooks/useSectionsForSearchResultsUtils.test.ts; the rendered counts and View all navigation have no e2e. The resting-state View all buttons depend on the token_categories flag."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - search
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/search/SearchModal/
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** the web search modal on the All tab
**When** no query is entered
**Then** each section (excluding recent searches) shows 3 results with a "View all" button under it when the `token_categories` flag is on
**And** when a query is typed, each section shows 6 results followed by a "View all" button that opens the matching tab of search

---
id: explore-search-web-tokens-tab-rows
title: Web search Tokens tab rows show volume, price and 24h change without context menus
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: "Consumer Engagement search QA plan (Notion, 2026-10-08), verified against packages/uniswap/src/features/search/SearchModal/SearchModalResultsList.tsx on disk. Earn APY resolution is unit-covered in hooks/useSearchEarnApy.test.ts; the row layout has no e2e. Stocks parent/child rows are asserted by rwa-search-stocks-section."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - search
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/search/SearchModal/
  - packages/uniswap/src/features/search/SearchModal/hooks/useSearchEarnApy.ts
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** the web search modal on the Tokens tab
**When** results render, with and without a query
**Then** token rows have no context menu, show volume in place of the network count, and show price and 24h percent change on the right
**And** an empty query shows 15 rows, and tokens with an earn APY (for example USDC) show it in pink

---
id: explore-search-web-pools-tab-rows
title: Web search Pools tab rows move version, fee and hook to the bottom line and show volume and APR
# importance
priority: medium
severity: low
# provenance
source: uniswap
sourceNote: "Consumer Engagement search QA plan (Notion, 2026-10-08), verified against packages/uniswap/src/features/search/SearchModal/ on disk. Pool navigation is unit-covered in hooks/useSearchModalOptionSelection.test.ts ('navigates pools and wallets to their destinations'); the row layout has no e2e."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - search
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/search/SearchModal/
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** the web search modal on the Pools tab
**When** pool results render
**Then** rows have no context menu, the protocol version, fee tier and hook sit on the bottom line with the hook listed last, and volume and APR show on the right of the row
