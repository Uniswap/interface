# RWA scenarios — Explore

Tokenized-asset (RWA) surfaces on the Explore page: the featured Stocks shelf, the
Popular/Stocks/Commodities/ETFs category chips, the ranked Stocks table, expandable
multi-issuer rows, and the legal disclaimer. Shared defaults: `_defaults.yaml`.

Chain scope: `chains: [ethereum]` throughout this catalog. Ethereum mainnet (chainId 1)
is `PREFERRED_RWA_CHAIN_ID` (packages/uniswap/src/data/rest/rwa/types.ts) and the
production RWA chain; registry matching itself is chain-scoped but multi-chain-capable
(see `rwa-is-rwa-token-identification`).

---
id: rwa-explore-stocks-shelf-and-chips
title: Explore shows featured Stocks shelf and RWA category chips
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "Blueprint Testlio suite 'Tokenized Assets - Explore Page'. No RWA web e2e exists under apps/web/src/pages/Explore/**/*.e2e.test.ts (verified), so this renders as an automation gap. URL persistence on refresh/back is owned by rwa-explore-category-routing; the former flag-OFF fallback case was retired when #41845 removed the RWA flags (surfaces are always on)."
testlioRef: Tokenized Assets - Explore Page
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - rwa
  - explore
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Explore/categories/
  - apps/web/src/pages/Explore/ExploreAssetsIntegration.tsx
  - packages/uniswap/src/features/rwa/
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** the user opens the Explore page
**When** the page loads and the user reads the featured Stocks shelf and the Popular / Stocks / Commodities / ETFs chips
**Then** the featured Stocks shelf renders cards with correct data, clicking a card navigates to the matching TDP and "View all" lands on the Stocks table
**And** the chips default correctly and switching a chip swaps to the right ranked table

---
id: rwa-explore-stocks-table-and-filters
title: Stocks table loads with chain filter, search, and empty/error states
# importance
priority: high
severity: medium
# provenance
source: testlio
sourceNote: "Blueprint Testlio suite 'Tokenized Assets - Explore Page'. No RWA web e2e exists for the ranked Stocks table (verified against apps/web/src/pages/Explore e2e specs)."
testlioRef: Tokenized Assets - Explore Page
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - rwa
  - explore
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Explore/categories/ExploreCategoryTablesSection.tsx
  - apps/web/src/pages/Explore/categories/
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** the user has selected the Stocks category on Explore
**When** the ranked Stocks table loads and the user applies the chain filter and enters a search query
**Then** the table shows valid ranked-RWA data, the chain filter and search narrow the rows correctly
**And** the empty-result and error states render without breaking layout, and loading skeletons/refresh behave correctly

---
id: rwa-explore-expandable-issuer-rows
title: Multi-issuer Stocks rows expand and route to the issuer TDP
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Blueprint Testlio suite 'Tokenized Assets - Explore Page'. Expand/collapse and child-row navigation have no web e2e coverage (verified). Issuer icon, backend-only naming and the flat Commodities rule added from the Consumer Engagement token-categories QA plan (Notion, 2026-10-08)."
testlioRef: Tokenized Assets - Explore Page
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - rwa
  - explore
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Explore/categories/ExploreCategoryTablesSection.tsx
  - packages/uniswap/src/components/ExpandoRow/
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** the Stocks table contains an asset represented by more than one issuer (a multi-issuer row)
**When** the user expands the parent row and then clicks a child issuer token
**Then** only one parent row is expanded at a time, and clicking a child navigates to that issuer's TDP without toggling (collapsing) the parent row
**And** every issuer row shows the issuer icon when one exists, and token names come from the backend with no front-end overrides
**And** Commodities render as a flat list rather than issuer groups, still showing the issuer icon on rows that have one

---
id: rwa-mobile-category-details-grouping
title: Mobile Category Details screen groups Stocks/ETFs by issuer; Commodities lists flat
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: "Derived from apps/mobile/src/screens/CategoryDetailsScreen/CategoryDetailsScreen.tsx (verified on disk). Grouping now reads the BE `grouped` flag via getGroupedRwaCategory (packages/uniswap/src/features/tokenCategories/groupedCategory.ts); previously this screen also grouped Commodities pending a BE signal, so this is a real behavior narrowing, not just a refactor. No mobile e2e/detox coverage exists for this screen."
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - rwa
  - explore
  - mobile
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/screens/CategoryDetailsScreen/
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** the user opens the mobile Category Details screen for Stocks, ETFs, or Commodities
**When** the token list renders
**Then** Stocks and ETFs show expandable multi-issuer grouping rows (matching the web category page), and Commodities lists ranked tokens flat with no grouping row
**And** expanding a Stocks/ETFs parent row and selecting a child issuer token navigates correctly without toggling the parent row's collapsed state

---
id: rwa-explore-category-routing
title: Explore RWA category param and URL routing resolve correctly
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "Backed by apps/web/src/pages/Explore/categories/useExploreCategory.test.tsx (cited test names verified). Owns URL persistence/restore behavior for the RWA explore categories."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - rwa
  - explore
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/pages/Explore/categories/useExploreCategory.ts
  - apps/web/src/pages/Explore/categories/
automationRefs:
  - path: apps/web/src/pages/Explore/categories/useExploreCategory.test.tsx
    testName: categoryFromParam
  - path: apps/web/src/pages/Explore/categories/useExploreCategory.test.tsx
    testName: getExploreStocksTableURL > returns explore tokens URL with stocks category param
  - path: apps/web/src/pages/Explore/categories/useExploreCategory.test.tsx
    testName: categoryFromParam
---

> **medium · unit · pr-check · automated** · chains: ethereum

**Given** an Explore URL carries a category query param (popular / stocks / commodities / etfs)
**When** `categoryFromParam` resolves it and `getExploreStocksTableURL` / `exploreCategoryToRankedRwaCategory` map the selection
**Then** RWA category params resolve to the matching `ExploreCategory`, unknown values fall back to `popular`, and ranked RWA categories (Stocks, ETFs) map to the correct data-API `RwaCategory`
**And** refreshing or navigating back to a category URL restores the selected category

---
id: rwa-explore-grouped-category-resolution
title: Category grouping (Stocks/ETFs issuer rows) is BE-declared, with safe fallback
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "Backed by packages/uniswap/src/features/tokenCategories/groupedCategory.test.ts and apps/web/src/pages/Explore/categories/exploreGroupedCategory.test.ts (cited test names verified). Replaces the prior FE-hardcoded Stocks/ETFs/Commodities grouping list with the BE's `TokenCategory.grouped` flag; covers the fallback-to-flat-with-one-time-warning path when the BE flags a category grouped that the FE has no grouped table for."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - rwa
  - explore
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/tokenCategories/groupedCategory.ts
  - apps/web/src/pages/Explore/categories/exploreGroupedCategory.ts
automationRefs:
  - path: packages/uniswap/src/features/tokenCategories/groupedCategory.test.ts
    testName: getGroupedRwaCategory > maps BE-grouped stocks and etfs to their grouped RwaCategory
  - path: packages/uniswap/src/features/tokenCategories/groupedCategory.test.ts
    testName: getGroupedRwaCategory > falls back to flat for a grouped category without a grouped table, warning once per id
  - path: apps/web/src/pages/Explore/categories/exploreGroupedCategory.test.ts
    testName: resolveGroupedRwaCategory > falls back to the static grouped set when the category is not in the fetched list
---

> **medium · unit · pr-check · automated** · chains: ethereum

**Given** a fetched `TokenCategory` carries the BE's `grouped` boolean
**When** `getGroupedRwaCategory` / `resolveGroupedRwaCategory` resolve which table it renders
**Then** a category flagged grouped with a known RWA mapping (Stocks, ETFs) renders its grouped (issuer-beneath) table, and a category flagged grouped with no FE-supported grouped table falls back to the flat list and logs a warning once per category id
**And** a category not yet in the fetched list (flag off, still loading, static deep link) falls back to the static grouped set so today's rendering holds

---
id: rwa-explore-legal-disclaimer
title: Legal disclaimer shows only on Stocks and ETFs explore tabs
# importance
priority: low
severity: low
# provenance
source: uniswap
sourceNote: "Derived from apps/web/src/pages/Explore/categories/ExploreRwaDisclaimer.tsx (verified on disk). Which category the disclaimer keys on now resolves via resolveRwaDisclaimerCategory in exploreGroupedCategory.ts — deliberately id-based and decoupled from the BE `grouped` flag so a BE grouping change can never silently drop the legal copy; that resolver has unit coverage (exploreGroupedCategory.test.ts), but full disclaimer placement across tab switches is still e2e-only and untested. Category Detail Page coverage added from the Consumer Engagement token-categories QA plan (Notion, 2026-10-08)."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - rwa
  - explore
  - compliance
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Explore/categories/ExploreRwaDisclaimer.tsx
  - apps/web/src/pages/Explore/categories/exploreGroupedCategory.ts
  - apps/web/src/pages/Explore/CategoryDetails/
  - packages/uniswap/src/features/tokenCategories/RwaDisclaimerText.tsx
automationRefs: []
---

> **low · e2e · release · gap** · chains: ethereum

**Given** the RWA explore surfaces are enabled
**When** the user switches between the Popular, Stocks, Commodities, and ETFs tabs
**Then** the legal disclaimer with a "Learn more" link renders below the Stocks table (stocks copy) and below the ETFs table (ETFs copy)
**And** no disclaimer is shown on the Popular or Commodities tabs
**And** the Stocks and ETFs Category Detail Pages show the same RWA disclaimer, while Commodities and non-RWA category pages do not

---
id: rwa-issuer-identity-plain-token-names
title: Issuer rows and cards honor the token-categories plain-name and BE issuer-label overrides
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "Backed by packages/uniswap/src/features/rwa/getIssuerTokenPrimaryName.test.ts (all cases), packages/uniswap/src/features/expandableAsset/ExpandableIssuerIdentity.test.tsx ('prefers the BE issuer display name over the formatted slug when served', 'shows the issuer token name unmodified on flat rows when token categories are on'), and packages/uniswap/src/data/apiClients/dataApiService/tokenGroups/mapRankedTokenGroup.test.ts ('falls back to the ticker when the group has no display name'). Gated by the token-categories flag (`useIsTokenCategoriesEnabled`, @universe/gating). Added per review: getIssuerTokenPrimaryName and getIssuerTokenLabel are shared by the Explore expandable Stocks rows, the Explore Stocks shelf, and the mobile 'Other stocks' carousel, none of whose existing cases' code_paths covered this shared naming rule."
# scope
platforms:
  - web
  - mobile
labels:
  - regression
  - rwa
  - naming
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/rwa/getIssuerTokenPrimaryName.ts
  - packages/uniswap/src/features/expandableAsset/ExpandableIssuerIdentity.tsx
  - packages/uniswap/src/data/apiClients/dataApiService/rwa/formatIssuerDisplaySymbol.ts
  - packages/uniswap/src/data/apiClients/dataApiService/tokenGroups/mapRankedTokenGroup.ts
automationRefs:
  - path: packages/uniswap/src/features/rwa/getIssuerTokenPrimaryName.test.ts
    testName: getIssuerTokenPrimaryName > shows the token name when plainTokenNames is on
  - path: packages/uniswap/src/features/rwa/getIssuerTokenPrimaryName.test.ts
    testName: getIssuerTokenPrimaryName > falls back to the asset name for an empty token name
  - path: packages/uniswap/src/features/expandableAsset/ExpandableIssuerIdentity.test.tsx
    testName: ExpandableIssuerIdentity network badge > prefers the BE issuer display name over the formatted slug when served
  - path: packages/uniswap/src/data/apiClients/dataApiService/tokenGroups/mapRankedTokenGroup.test.ts
    testName: mapRankedTokenGroup > falls back to the ticker when the group has no display name
---

> **medium · unit · pr-check · automated**

**Given** an RWA row or card on the Explore expandable Stocks table, the Explore Stocks shelf, or the mobile "Other stocks" carousel
**When** the token-categories flag is ON
**Then** the primary label shows the issuer token's own on-chain/BE name (falling back to the clean asset name only when the token name is empty) instead of the shared group asset name
**And** the issuer brand label prefers the backend-served issuer display name (v2 `ListTokenGroups`) over the label derived from the issuer slug when one is served
**And** a grouped asset with an empty BE display name falls back to its ticker instead of rendering blank
