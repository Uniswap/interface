# Explore scenarios — Explore lists & tabs

Explore token leaderboard, Pools/Transactions tabs, time-window/network filters,
row navigation, and not-found redirects. Shared defaults: `_defaults.yaml`.
Wallet-dependent cases reference the symbolic aliases defined in `_defaults.yaml`
(TW-EXPLORE-NN); most of these discovery flows are read-only and need no wallet.

---
id: explore-token-leaderboard-loads
title: Explore token leaderboard loads with ranked tokens
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: "(a) web e2e apps/web/src/pages/Explore/TokenExplore.e2e.test.ts; (b) Testlio Wallet 'Explore - General - iOS/Android'"
testlioRef: Explore - General - iOS/Android
# scope
chains:
  - ethereum
platforms:
  - web
  - mobile
labels:
  - regression
  - explore
  - smoke
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/Explore/
  - apps/web/src/pages/Explore/tables/
  - packages/uniswap/src/features/explore/
automationRefs:
  - path: apps/web/src/pages/Explore/TokenExplore.e2e.test.ts
    testName: Token explore > should load token leaderboard
---

> **high · e2e · scheduled · automated** · chains: ethereum

**Given** the user navigates to `/explore/tokens`
**When** the token explore table finishes loading
**Then** a ranked leaderboard of tokens renders with name, price, and volume columns populated, and the table is not empty

---
id: explore-time-window-toggle
title: Toggling time window refreshes leaderboard stats
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) web e2e apps/web/src/pages/Explore/TokenExplore.e2e.test.ts (time window toggle)"
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - explore
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Explore/
  - apps/web/src/pages/Explore/tables/
automationRefs:
  - path: apps/web/src/pages/Explore/TokenExplore.e2e.test.ts
    testName: Token explore > should update when time window toggled
---

> **medium · e2e · release · automated** · chains: ethereum

**Given** the user is on the Explore tokens table
**When** they change the time-window selector (e.g., 1D → 1W)
**Then** the price-change and volume columns refetch and re-render for the newly selected window

---
id: explore-row-navigates-to-tdp
title: Clicking a token row navigates to its Token Detail Page
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: "(a) web e2e apps/web/src/pages/Explore/TokenExplore.e2e.test.ts (row click navigation); (b) Testlio Wallet 'Explore Token - iOS/Android'"
testlioRef: Explore Token - iOS/Android
# scope
chains:
  - ethereum
platforms:
  - web
  - mobile
labels:
  - regression
  - explore
  - navigation
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/Explore/tables/
  - apps/web/src/pages/TokenDetails/
automationRefs:
  - path: apps/web/src/pages/Explore/TokenExplore.e2e.test.ts
    testName: Token explore > should navigate to token detail page when row clicked
---

> **high · e2e · scheduled · automated** · chains: ethereum

**Given** the user is viewing the Explore token leaderboard
**When** they click a token row
**Then** the app navigates to that token's Token Detail Page (`/explore/tokens/<chain>/<address>`) with the correct token loaded

---
id: explore-network-filter
title: Network filter updates the Explore leaderboard per chain
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) web e2e apps/web/src/pages/Explore/TokenExplore.e2e.test.ts (global + table-level network change); (b) Testlio Wallet 'Explore - General - iOS/Android'"
testlioRef: Explore - General - iOS/Android
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
  - apps/web/src/pages/Explore/NetworkFilter.tsx
  - apps/web/src/pages/Explore/tables/
  - packages/uniswap/src/features/chains/
automationRefs:
  - path: apps/web/src/pages/Explore/TokenExplore.e2e.test.ts
    testName: Token explore > should update when global network changed
  - path: apps/web/src/pages/Explore/TokenExplore.e2e.test.ts
    testName: Token explore > should update when token explore table network changed
---

> **medium · e2e · release · automated** · chains: ethereum, base, unichain

**Given** the user is on the Explore tokens table
**When** they change the global network selector or the table-level network filter to a specific chain
**Then** the leaderboard refetches and shows only tokens for the selected chain

---
id: explore-l2-token-visible-cross-network
title: L2 token appears in Explore regardless of connected network
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) web e2e apps/web/src/pages/Explore/TokenExplore.e2e.test.ts (L2 token visible while connected elsewhere)"
# scope
chains:
  - ethereum
  - base
platforms:
  - web
labels:
  - regression
  - explore
  - multichain
  - edge-case
wallets:
  - TW-EXPLORE-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Explore/tables/
  - packages/uniswap/src/features/explore/
automationRefs:
  - path: apps/web/src/pages/Explore/TokenExplore.e2e.test.ts
    testName: Token explore > should show a L2 token even if the user is connected to a different network
---

> **medium · e2e · release · automated** · chains: ethereum, base

**Given** test wallet TW-EXPLORE-01 is connected to a different network than the filtered chain
**When** the user filters the Explore table to an L2 (e.g., Base)
**Then** the L2 token is still listed and selectable without requiring a network switch

---
id: explore-filter-by-search-term
title: Explore table filters correctly by search term
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) web e2e apps/web/src/pages/Explore/TokenExploreFilter.e2e.test.ts (filter UI lives in SearchBar.tsx + tables/; a TokenExploreFilter.tsx component does not exist)"
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - explore
  - search
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Explore/SearchBar.tsx
  - apps/web/src/pages/Explore/tables/
automationRefs:
  - path: apps/web/src/pages/Explore/TokenExploreFilter.e2e.test.ts
    testName: Token explore filter > should search tokens through the backend
---

> **medium · e2e · release · automated** · chains: ethereum

**Given** the user is on the Explore tokens table
**When** they type a token symbol/name into the in-table search field
**Then** the table narrows to rows matching the term and non-matching rows are hidden

---
id: explore-redirect-unknown-token-or-pool
title: Unknown token or pool route redirects to Explore
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) web e2e apps/web/src/pages/Explore/Explore.e2e.test.ts (token + pool not-found redirects)"
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - explore
  - navigation
  - edge-case
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Explore/redirects.tsx
  - apps/web/src/pages/Explore/index.tsx
automationRefs:
  - path: apps/web/src/pages/Explore/Explore.e2e.test.ts
    testName: Explore > should redirect to explore page when token is not found
  - path: apps/web/src/pages/Explore/Explore.e2e.test.ts
    testName: Explore > should redirect to explore page when pool is not found
---

> **medium · e2e · release · automated** · chains: ethereum

**Given** the user navigates to a token or pool URL that does not resolve
**When** the page attempts to load the entity
**Then** the app redirects to the Explore page rather than rendering an error or blank state

---
id: explore-pools-tab
title: Web Explore Pools tab lists pools and navigates to pool details
# importance
priority: high
severity: medium
# provenance
source: testlio
sourceNote: "(b) Testlio Web 'Test Case: Exploratory - Explore Feature (Uniswap Web)'; (a) unit-only automation exists for rendering states (apps/web/src/pages/Explore/tables/Pools/PoolTable.test.tsx: renders loading/error/data filled state; poolTableStore.test.tsx) — no e2e covers the Pools tab, so the e2e flow is a gap"
testlioRef: "Test Case: Exploratory - Explore Feature (Uniswap Web)"
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - explore
  - pools
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Explore/tables/Pools/
  - apps/web/src/pages/Explore/ExploreTableFilters.tsx
  - apps/web/src/pages/PoolDetails/
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** the user is on `/explore` and selects the Pools tab
**When** the pools table finishes loading and the user applies the protocol filter (e.g., v3 only), then clicks a pool row
**Then** the table lists pools with TVL/APR/volume columns populated, the filter narrows rows to the selected protocol, and clicking a row opens that pool's details page with the same pair loaded

---
id: explore-transactions-tab
title: Web Explore Transactions tab lists recent transactions
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "(b) Testlio Web 'Test Case: Exploratory - Explore Feature (Uniswap Web)'; no automated test (unit or e2e) exists for apps/web/src/pages/Explore/tables/RecentTransactions/"
testlioRef: "Test Case: Exploratory - Explore Feature (Uniswap Web)"
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - explore
  - transactions
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Explore/tables/RecentTransactions/
  - apps/web/src/pages/Explore/index.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** the user is on `/explore` and selects the Transactions tab
**When** the recent-transactions table finishes loading
**Then** rows render with transaction type, token amounts, USD value, wallet, and time columns populated, and the list is not empty for an active chain

---
id: explore-mobile-general-filters-favorites
title: Mobile Explore sheet — browse, filter/sort, and favorite a token
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) mobile Maestro apps/mobile/.maestro/flows/explore/filters-and-sorts.yaml and favorite-token.yaml; (b) Testlio Wallet 'Explore - General - iOS/Android'"
testlioRef: Explore - General - iOS/Android
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - explore
  - mobile
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/explore/
  - apps/mobile/src/screens/ExploreScreen.tsx
  - apps/mobile/.maestro/flows/explore/
automationRefs:
  - path: apps/mobile/.maestro/flows/explore/filters-and-sorts.yaml
    testName: explore-filters-and-sorts
  - path: apps/mobile/.maestro/flows/explore/favorite-token.yaml
    testName: explore-favorite-token
---

> **medium · e2e · release · automated** · chains: ethereum

**Given** the mobile app is open on the Home tab with the Explore sheet reachable from the search bar
**When** the user opens Explore, applies a filter/sort, and marks a token as a favorite
**Then** the token list re-sorts per the selection and the favorited token is persisted to the favorites section
