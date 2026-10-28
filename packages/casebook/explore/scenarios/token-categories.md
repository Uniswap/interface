# Explore scenarios — Token categories

Token categories (`token_categories` flag): the Trending carousel and category
chip row on web Explore, category tags and definition cards, the Category
Detail Page, category chips and related-token carousels on the TDP, spotlit
category sections in search, and the mobile Explore sections, Collections
page and Category Details screen. Shared defaults: `_defaults.yaml`. Every
case assumes the `token_categories` flag is ON unless it says otherwise.
Token-selector category tags and filter chips are here too (the selector is
shared by swap, limit, send and swap-and-add); issuer-grouped Stocks/ETFs
behavior lives in the rwa catalog.

---
id: explore-categories-web-trending-carousel
title: Web Explore shows the Trending carousel in place of the Stocks carousel
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: "Consumer Engagement token-categories QA plan (Notion, 2026-10-08), verified against apps/web/src/pages/Explore/trending/ on disk. Card mapping and unsupported-chain filtering are unit-covered in useTrendingCarouselTokens.test.tsx (cited by explore-categories-unit-web-explore-logic); the rendered carousel and its navigation have no e2e."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - explore
  - token-categories
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Explore/trending/
  - packages/uniswap/src/features/tokenCategories/findTrendingCategory.ts
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** the user opens web Explore with the `token_categories` flag on
**When** the page renders above the tokens table
**Then** a Trending carousel of 12 tokens replaces the former Stocks carousel, each card carrying a network badge only when the Explore network filter is set to a single network
**And** clicking a card opens that token's TDP, the info icon shows the Trending definition tooltip with a "View all" link, and the "View all" button selects the Trending category in the table below

---
id: explore-categories-web-chip-row
title: Web Explore category chip row follows the Statsig order and keeps five chips
# importance
priority: high
severity: high
# provenance
source: uniswap
sourceNote: "Consumer Engagement token-categories QA plan (Notion, 2026-10-08), verified against apps/web/src/pages/Explore/categories/ExploreCategoryChips.tsx and MoreCategoriesDropdown.tsx on disk. Chip selection analytics and the flex-slot memory are unit-covered (ExploreCategoryChips.test.tsx, useFlexSlotCategoryId.test.tsx, cited by explore-categories-unit-web-explore-logic); the rendered row has no e2e."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - explore
  - token-categories
  - smoke
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Explore/categories/
  - packages/uniswap/src/features/tokenCategories/useTokenCategoryOrder.ts
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** the user opens web Explore with the `token_categories` flag on
**When** the category chip row above the tokens table loads
**Then** a skeleton shows while categories load, "All" is the default chip, and the chips follow the Statsig dynamic-config order (expected today: All, Trending, Stocks, Top Gainers, Memes)
**And** the "More" dropdown lists every other category bucketed by Market / Assets / Sectors, each row showing its token count and 1D % change
**And** picking a non-spotlit category from "More" replaces the last chip so the row stays at five chips, and that pick stays in the last slot after moving back to a default chip
**And** the "More" counts update when the network filter changes, and zero-token categories stay listed but disabled

---
id: explore-categories-web-table-filter-and-url
title: Selecting a category filters the Explore table and round-trips through the URL
# importance
priority: high
severity: high
# provenance
source: uniswap
sourceNote: "Consumer Engagement token-categories QA plan (Notion, 2026-10-08), verified against apps/web/src/pages/Explore/categories/useExploreCategory.ts on disk. Param parsing, unknown-value fallback and dynamic-id hydration are unit-covered (useExploreCategory.test.tsx, cited by explore-categories-unit-web-explore-logic); the end-to-end filter, reload and legacy-link behavior have no e2e. The RWA-specific legacy `?category=stocks` routing is also asserted by rwa-explore-category-routing."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - explore
  - token-categories
  - smoke
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Explore/categories/
  - apps/web/src/pages/Explore/index.tsx
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** web Explore with the `token_categories` flag on
**When** the user selects a category chip, including one picked from "More"
**Then** the table filters to that category and the URL gains the category param, so reloading or sharing the URL (for example `/explore?category=top-gainers`) restores the same selection
**And** legacy `?category=stocks` links still land on the Stocks view
**And** the volume timeframe toggle renders and works on every category, grouped ones included, with volume-column sorting intact
**And** the network filter and the search box keep working while a category is selected

---
id: explore-categories-web-row-tags
title: Explore table rows carry a primary category tag that opens the Category Detail Page
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: "Consumer Engagement token-categories QA plan (Notion, 2026-10-08), verified against packages/uniswap/src/features/tokenCategories/getRowCategoryTag.tsx and TokenCategoryTag.tsx on disk. Tag selection (primary category, RWA tag precedence) and the press navigation are unit-covered (cited by explore-categories-unit-shared-logic); the rendered table has no e2e."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - explore
  - token-categories
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/tokenCategories/getRowCategoryTag.tsx
  - packages/uniswap/src/features/tokenCategories/TokenCategoryTag.tsx
  - apps/web/src/pages/Explore/tables/Tokens/
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** web Explore on the "All" category with the `token_categories` flag on
**When** the tokens table renders
**Then** each row shows its primary category tag when it has one (ETH is tagged "Majors"), and rows without categories show no tag
**And** clicking a tag opens that category's Category Detail Page

---
id: explore-categories-web-definition-cards
title: Category definition cards open from chip hover on web, info tap on mWeb, double tap on tablet
# importance
priority: medium
severity: low
# provenance
source: uniswap
sourceNote: "Consumer Engagement token-categories QA plan (Notion, 2026-10-08), verified against apps/web/src/components/HoverCard/CategoryHoverCard/ and apps/web/src/components/CategoryDefinitionCard/ on disk. Card contents, the Learn-more link and touch-device info-icon rules are unit-covered (CategoryDefinitionCard.test.tsx, ExploreCategoryChips.test.tsx, cited by explore-categories-unit-web-explore-logic); the hover and sheet interactions have no e2e."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - explore
  - token-categories
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/components/HoverCard/CategoryHoverCard/
  - apps/web/src/components/CategoryDefinitionCard/
  - apps/web/src/pages/Explore/categories/ExploreCategoryChips.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** web Explore with the `token_categories` flag on
**When** the user hovers a category chip with a pointer
**Then** a definition card shows with a "Learn more" link to the general categories help article, clicking the card opens the Category Detail Page, and the "All" chip shows no card
**And** on mWeb tapping a chip selects it and shows an info icon on the selected chip only; tapping the icon opens the definition bottom sheet, whose body opens the Category Detail Page and whose "Learn more" link works as on web
**And** tablets open a popup modal on double tap instead of a hover card or bottom sheet, and the Trending info control opens the Trending definition the same way

---
id: explore-categories-web-solana-network
title: Selecting the Solana network on Explore resets to the All category
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: "Consumer Engagement token-categories QA plan (Notion, 2026-10-08), verified against apps/web/src/pages/Explore/categories/MoreCategoriesDropdown.tsx on disk. The 'Solana reads as All networks' stats scoping is unit-covered (MoreCategoriesDropdown.test.tsx, cited by explore-categories-unit-web-explore-logic); the chip/network interplay has no e2e."
# scope
chains:
  - solana
  - ethereum
platforms:
  - web
labels:
  - regression
  - explore
  - token-categories
  - solana
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Explore/categories/
  - apps/web/src/pages/Explore/NetworkFilter.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · chains: solana, ethereum

**Given** web Explore with a category selected and the `token_categories` flag on
**When** the user selects the Solana network in the network filter
**Then** the selected category resets to "All" and the "More" dropdown counts keep reflecting "All networks"
**And** selecting any other category chip afterwards switches the network selector back to "All networks"

---
id: explore-categories-web-category-detail-page
title: Web Category Detail Page lists only the category's tokens and redirects for unknown slugs
# importance
priority: high
severity: high
# provenance
source: uniswap
sourceNote: "Consumer Engagement token-categories QA plan (Notion, 2026-10-08), verified against apps/web/src/pages/Explore/CategoryDetails/ on disk. The entry-point breadcrumb and nav state are unit-covered (CategoryDetailsBreadcrumb.test.tsx, categoryDetailsEntryPoint.test.ts, cited by explore-categories-unit-web-explore-logic); the page itself has no e2e. The Stocks/ETFs disclaimer and grouped tables on this page are asserted in the rwa catalog."
# scope
chains:
  - ethereum
  - solana
platforms:
  - web
labels:
  - regression
  - explore
  - token-categories
  - smoke
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Explore/CategoryDetails/
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum, solana

**Given** the `token_categories` flag is on
**When** the user reaches a Category Detail Page from a TDP chip, an Explore "All" row tag, or a direct link such as `/explore/category/stablecoins`
**Then** the header, description and stats (token count, 1D volume, FDV with sparklines) render, and the breadcrumb returns to the TDP it was entered from or to the Tokens tab otherwise
**And** the token table lists only tokens in the category, and the network filter, timeframe selector, sorting and load-more all work; selecting Solana shows no data
**And** an unknown slug, or the flag being off, redirects to `/explore`
**And** the page renders correctly on mWeb

---
id: explore-categories-web-tdp-chips-and-sections
title: Web TDP shows category chips under the name and the token-categories section order
# importance
priority: high
severity: medium
# provenance
source: uniswap
sourceNote: "Consumer Engagement token-categories QA plan (Notion, 2026-10-08), verified against apps/web/src/pages/TokenDetails/components/header/TokenDetailsHeaderCategoryChips.tsx on disk. Chip rendering per category, flag-off and no-category cases are unit-covered (TokenDetailsHeaderCategoryChips.test.tsx, cited by explore-categories-unit-web-tdp-logic); the rendered header and section order have no e2e. The issuer line for RWAs is asserted by rwa-tdp-header-identity."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - tdp
  - token-categories
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/TokenDetails/components/header/TokenDetailsHeaderCategoryChips.tsx
  - apps/web/src/pages/TokenDetails/components/TokenDetails.tsx
  - apps/web/src/pages/TokenDetails/hooks/useTDPTokenCategories.ts
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** the user opens a web TDP for a token with categories and the `token_categories` flag on
**When** the header renders
**Then** category chips appear under the token name in Statsig config order; clicking a chip opens its Category Detail Page and hovering shows the definition card, whose click also navigates there
**And** tokens without categories show no chips
**And** the page sections run Stats, More <Asset> tokens (grouped RWAs only), About, Related tokens, then Pools / Transactions
**And** on mWeb the chips scroll horizontally, hide in the compact scrolled header, and show no hover cards

---
id: explore-categories-web-tdp-related-tokens
title: Web TDP related-tokens carousel switches by category and singularizes for one category
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: "Consumer Engagement token-categories QA plan (Notion, 2026-10-08), verified against apps/web/src/pages/TokenDetails/components/relatedTokens/ on disk. Section state (chip visibility, singular title, stale-pick fallback) is unit-covered (relatedTokensSectionState.test.ts, cited by explore-categories-unit-web-tdp-logic); the rendered carousel has no e2e."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - tdp
  - token-categories
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/TokenDetails/components/relatedTokens/
  - packages/uniswap/src/features/tokenCategories/getRelatedTokensTitle.ts
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** a web TDP for a token with the `token_categories` flag on
**When** the Related tokens section renders
**Then** a multi-category token shows one chip per category and selecting a chip reloads the carousel for that category
**And** a single-category token shows no chips and a singular title (for example "More stock tokens", "More defi tokens")
**And** the carousel shows up to 16 cards and clicking a card opens that token's TDP

---
id: explore-categories-web-search-spotlit-sections
title: Web search surfaces spotlit category sections and category rows
# importance
priority: high
severity: medium
# provenance
source: uniswap
sourceNote: "Consumer Engagement token-categories QA plan (Notion, 2026-10-08), verified against packages/uniswap/src/features/search/SearchModal/categories/ and hooks/useSpotlitCategorySections.tsx on disk. Config-order resolution, flag-off disabling and region filtering are unit-covered (cited by explore-categories-unit-search-logic); the rendered modal has no e2e. Stocks rows inside search are asserted by rwa-search-stocks-section."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - search
  - token-categories
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/search/SearchModal/categories/
  - packages/uniswap/src/features/search/SearchModal/hooks/
  - apps/web/src/components/NavBar/SearchBar/
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** the `token_categories` flag is on
**When** the user opens web search with no query
**Then** recent searches come first, followed by three spotlit category sections (New / Trending / Top Gainers) with 3 tokens each on the All tab and 5 on the Tokens tab
**And** hovering a spotlit header's info icon shows the description with a "View all" link, and clicking the header or the link opens that Category Detail Page
**And** searching a category name (for example "stablecoins", "memes") shows a category row at the top of the Tokens section on the All tab that opens the Category Detail Page; category rows appear only on the All tab and are never saved to recents
**And** token rows show at most one tag, and inside a spotlit section that section's own tag is hidden
**And** the same holds on mWeb

---
id: explore-categories-mobile-explore-sections
title: Mobile Explore orders its sections and routes Trending and Collections to category screens
# importance
priority: high
severity: high
# provenance
source: uniswap
sourceNote: "Consumer Engagement token-categories QA plan (Notion, 2026-10-08), verified against apps/mobile/src/components/explore/ExploreSections/ on disk. No Maestro flow covers the Trending or Collections sections (apps/mobile/.maestro/flows/explore/ has favorites, filters-and-sorts, search only)."
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - explore
  - token-categories
  - smoke
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/components/explore/ExploreSections/
  - apps/mobile/src/screens/ExploreScreen.tsx
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** the mobile Explore tab with the `token_categories` flag on
**When** the sections render
**Then** they appear in the order Favorites, Earn, Trending, Collections, Top tokens
**And** Trending shows 3 trending tokens (not the unfiltered top tokens) and tapping its header opens the Trending Category Details screen
**And** the Collections pill row shows one pill per category in Statsig dynamic-config order with horizontal scroll; tapping a pill opens that Category Details screen and "View all" opens the Collections page
**And** Top tokens rows show no category tags

---
id: explore-categories-mobile-collections-page
title: Mobile Collections page buckets categories and opens Category Details from a row
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: "Consumer Engagement token-categories QA plan (Notion, 2026-10-08), verified against apps/mobile/src/screens/CollectionsScreen/CollectionsScreen.tsx on disk. Bucketing and the logo pile are unit-covered in packages/uniswap/src/features/tokenCategories (cited by explore-categories-unit-shared-logic); the screen has no Maestro flow."
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - explore
  - token-categories
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/screens/CollectionsScreen/
  - packages/uniswap/src/features/tokenCategories/bucketTokenCategories.ts
  - packages/uniswap/src/features/tokenCategories/TokenLogoPile.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** the user opens the mobile Collections page from Explore
**When** the page renders
**Then** categories are bucketed by Market / Assets / Sectors, and each row shows its icon and name, 24H change with token count, and a pile of the top-3 token logos
**And** tapping a row opens that Category Details screen

---
id: explore-categories-mobile-tdp
title: Mobile TDP shows collections chips, the token-categories section order and related tokens
# importance
priority: high
severity: medium
# provenance
source: uniswap
sourceNote: "Consumer Engagement token-categories QA plan (Notion, 2026-10-08), verified against apps/mobile/src/components/TokenDetails/TokenDetailsCollections.tsx and relatedTokens/ on disk. No Maestro flow covers the TDP collections row. The RWA issuer line and the More <Asset> tokens carousel rules are asserted in the rwa catalog (rwa-tdp-header-identity, rwa-tdp-more-ways-to-trade)."
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - tdp
  - token-categories
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/components/TokenDetails/TokenDetailsCollections.tsx
  - apps/mobile/src/components/TokenDetails/relatedTokens/
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** a mobile TDP for a token with categories and the `token_categories` flag on
**When** the screen renders
**Then** a Collections chip row sits under the balance and tapping a chip opens that Category Details screen
**And** the sections run Collections, Performance, About, Related tokens, Stats, Links, then More <Asset> tokens, and non-grouped tokens skip the More <Asset> tokens carousel
**And** the Related tokens carousel follows the web rules (chip per category for multi-category tokens, none for single-category), with the category list scrolling horizontally beyond the viewport width

---
id: explore-categories-mobile-search
title: Mobile search shows spotlit sections and category rows without tooltips
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: "Consumer Engagement token-categories QA plan (Notion, 2026-10-08), verified against apps/mobile/src/components/explore/search/ on disk. The existing Maestro search flow (apps/mobile/.maestro/flows/explore/search.yaml, cited by explore-search-token-results) covers token lookup only, not category sections."
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - search
  - token-categories
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/components/explore/search/
  - packages/uniswap/src/features/search/SearchModal/categories/
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** the mobile Explore search with the `token_categories` flag on
**When** the user opens search with no query
**Then** the resting state shows the spotlit category sections; tapping a header opens that category page and back returns to search
**And** searching a category name and a token shows category rows as on web, token rows show one tag each with the section's own tag hidden, and no tooltip appears on mobile

---
id: explore-categories-mobile-category-details
title: Mobile Category Details screen loads stats and tokens with a collapsing header
# importance
priority: high
severity: high
# provenance
source: uniswap
sourceNote: "Consumer Engagement token-categories QA plan (Notion, 2026-10-08), verified against apps/mobile/src/screens/CategoryDetailsScreen/ on disk. No Maestro flow covers the screen. Stocks/ETFs issuer grouping on this screen is asserted by rwa-mobile-category-details-grouping."
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - explore
  - token-categories
  - smoke
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/screens/CategoryDetailsScreen/
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** the `token_categories` flag is on, on iOS and Android
**When** the user reaches a Category Details screen from a TDP chip, a search row, or Explore
**Then** the header collapses into the sticky toolbar on scroll, "Learn" opens the category definition, and stats and the token list load behind skeletons
**And** the network pills, pagination, pull-to-refresh and row tap to the TDP all work
**And** going back returns to the originating screen with its state intact

---
id: explore-categories-unit-web-explore-logic
title: Explore category param, flex slot, More-dropdown scoping and trending tokens are unit-pinned
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "The pure logic behind explore-categories-web-chip-row, -table-filter-and-url, -solana-network, -definition-cards and -trending-carousel."
# scope
platforms:
  - web
labels:
  - regression
  - explore
  - token-categories
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/pages/Explore/categories/
  - apps/web/src/pages/Explore/trending/
  - apps/web/src/components/CategoryDefinitionCard/
automationRefs:
  - path: apps/web/src/pages/Explore/categories/useExploreCategory.test.tsx
    testName: maps unknown category values to all
  - path: apps/web/src/pages/Explore/categories/useExploreCategory.test.tsx
    testName: hydrates a dynamic id once it joins the valid set
  - path: apps/web/src/pages/Explore/categories/useFlexSlotCategoryId.test.tsx
    testName: remembers a non-spotlit selection and keeps it after moving back to All
  - path: apps/web/src/pages/Explore/categories/MoreCategoriesDropdown.test.tsx
    testName: scopes stats to the selected EVM network
  - path: apps/web/src/pages/Explore/categories/MoreCategoriesDropdown.test.tsx
    testName: reads Solana as All networks rather than requesting an unsupported scope
  - path: apps/web/src/pages/Explore/categories/ExploreCategoryChips.test.tsx
    testName: shows the info icon only on the selected chip, and only when it has a category
  - path: apps/web/src/pages/Explore/trending/useTrendingCarouselTokens.test.tsx
    testName: drops tokens that only exist on chains web does not support
  - path: apps/web/src/components/CategoryDefinitionCard/CategoryDefinitionCard.test.tsx
    testName: links "Learn more" to the category definitions article
  - path: apps/web/src/pages/Explore/CategoryDetails/CategoryDetailsBreadcrumb.test.tsx
    testName: links back to the token details page it was entered from, labeled with the ticker
---

> **medium · unit · pr-check · automated**

**Given** the Explore category hooks and components under test
**When** the unit suites run
**Then** an unknown `?category=` value falls back to All and a dynamic id hydrates once known, a non-spotlit pick is remembered in the flex slot, More-dropdown stats scope to the selected EVM network and read Solana as All networks, the info icon shows only on the selected chip, unsupported-chain trending tokens are dropped, the definition card links to the help article, and the Category Details breadcrumb returns to the entering TDP

---
id: explore-categories-unit-web-tdp-logic
title: TDP category chips and related-tokens section state are unit-pinned
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "The pure logic behind explore-categories-web-tdp-chips-and-sections and -tdp-related-tokens."
# scope
platforms:
  - web
labels:
  - regression
  - tdp
  - token-categories
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/pages/TokenDetails/components/header/TokenDetailsHeaderCategoryChips.tsx
  - apps/web/src/pages/TokenDetails/components/relatedTokens/
  - packages/uniswap/src/features/tokenCategories/getRelatedTokensTitle.ts
automationRefs:
  - path: apps/web/src/pages/TokenDetails/components/header/TokenDetailsHeaderCategoryChips.test.tsx
    testName: renders one chip per category in the given order
  - path: apps/web/src/pages/TokenDetails/components/header/TokenDetailsHeaderCategoryChips.test.tsx
    testName: renders nothing when the token categories flag is off
  - path: apps/web/src/pages/TokenDetails/components/header/TokenDetailsHeaderCategoryChips.test.tsx
    testName: renders nothing for a token with no categories
  - path: apps/web/src/pages/TokenDetails/components/relatedTokens/relatedTokensSectionState.test.ts
    testName: shows chips and the generic header for multi-category tokens
  - path: apps/web/src/pages/TokenDetails/components/relatedTokens/relatedTokensSectionState.test.ts
    testName: hides chips and singularizes the title for single-category tokens
  - path: packages/uniswap/src/features/tokenCategories/getRelatedTokensTitle.test.ts
    testName: has a singular key for every known category id
---

> **medium · unit · pr-check · automated**

**Given** the TDP category chip component and the related-tokens section state under test
**When** the unit suites run
**Then** chips render one per category in order and not at all with the flag off or without categories, multi-category tokens get chips with the generic header while single-category tokens get no chips and a singular title, and every known category has a singular title key

---
id: explore-categories-unit-search-logic
title: Spotlit search categories and category options are unit-pinned
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "The pure logic behind explore-categories-web-search-spotlit-sections and explore-categories-mobile-search."
# scope
platforms:
  - web
  - mobile
labels:
  - regression
  - search
  - token-categories
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/search/SearchModal/categories/
  - packages/uniswap/src/features/search/SearchModal/hooks/useSpotlitCategorySections.tsx
automationRefs:
  - path: packages/uniswap/src/features/search/SearchModal/categories/spotlitCategories.test.ts
    testName: keeps config order rather than backend order
  - path: packages/uniswap/src/features/search/SearchModal/categories/spotlitCategories.test.ts
    testName: drops unknown and duplicate ids
  - path: packages/uniswap/src/features/search/SearchModal/categories/toCategoryOptions.test.ts
    testName: drops ids unknown to ListCategories
  - path: packages/uniswap/src/features/search/SearchModal/hooks/useSpotlitCategorySections.test.tsx
    testName: is disabled and fetches nothing when the flag is off
  - path: packages/uniswap/src/features/search/SearchModal/hooks/useSpotlitCategorySections.test.tsx
    testName: builds category-scoped sections in config order and omits empty categories
  - path: packages/uniswap/src/features/search/SearchModal/hooks/useSpotlitCategorySections.test.tsx
    testName: drops RWA categories for RWA-blocked regions
---

> **medium · unit · pr-check · automated**

**Given** the search-modal category helpers under test
**When** the unit suites run
**Then** spotlit categories keep config order and drop unknown or duplicate ids, category options drop ids unknown to ListCategories, and the spotlit sections hook fetches nothing with the flag off, builds sections in config order omitting empty ones, and drops RWA categories in RWA-blocked regions

---
id: explore-categories-unit-shared-logic
title: Shared category bucketing, trending lookup and tag selection are unit-pinned
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "The shared tokenCategories helpers behind explore-categories-web-row-tags, -mobile-collections-page and the Trending surfaces on both platforms."
# scope
platforms:
  - web
  - mobile
labels:
  - regression
  - explore
  - token-categories
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/tokenCategories/
automationRefs:
  - path: packages/uniswap/src/features/tokenCategories/bucketTokenCategories.test.ts
    testName: buckets by class in Market/Asset/Sector order regardless of input order
  - path: packages/uniswap/src/features/tokenCategories/bucketTokenCategories.test.ts
    testName: omits empty buckets
  - path: packages/uniswap/src/features/tokenCategories/findTrendingCategory.test.ts
    testName: resolves the trending category by id regardless of its localized name
  - path: packages/uniswap/src/features/tokenCategories/selectTokenRowCategoryTag.test.ts
    testName: follows categoryIds (BE) order, not the resolved categories order
  - path: packages/uniswap/src/features/tokenCategories/getRowCategoryTag.test.tsx
    testName: prefers the RWA tag over the taxonomy primary category
  - path: packages/uniswap/src/features/tokenCategories/TokenCategoryTag.test.tsx
    testName: opens the category detail page on press
---

> **medium · unit · pr-check · automated**

**Given** the shared tokenCategories helpers under test
**When** the unit suites run
**Then** categories bucket into Market / Asset / Sector order with empty buckets omitted, the trending category resolves by id regardless of localized name, a row's tag follows the backend category order with the RWA tag taking precedence, and pressing a tag opens the category detail page

---
id: explore-token-selector-category-tags
title: Token selector rows show one category tag only for unowned tokens
# importance
priority: high
severity: medium
# provenance
source: uniswap
sourceNote: "Consumer Engagement token-categories QA plan (Notion, 2026-10-08), verified against packages/uniswap/src/components/TokenSelector/ on disk. The RWA tag threading and balance handling are unit-covered in tagRwaTokenSelectorSections.test.ts (cited by explore-token-selector-category-filter-logic); the rendered rows have no e2e for tags."
# scope
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - explore
  - token-selector
  - token-categories
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/components/TokenSelector/
  - packages/uniswap/src/features/tokenCategories/getRowCategoryTag.tsx
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** the token selector with the `token_categories` flag on
**When** it opens with no query
**Then** the resting state is unchanged: no filter chips and no category tags
**And** once the user searches, rows with a balance show the balance and never a category tag, unowned rows show exactly one tag, tokens with no categories show none, quick-select tiles never show tags, and RWA rows keep the issuer label alongside the tag

---
id: explore-token-selector-category-filter-chips
title: Token selector filter chips narrow search results client-side across swap, limit, send and swap-and-add
# importance
priority: high
severity: high
# provenance
source: uniswap
sourceNote: "Consumer Engagement token-categories QA plan (Notion, 2026-10-08), verified against packages/uniswap/src/components/TokenSelector/categoryFilters/ on disk. Chip derivation, ordering, OR/AND semantics and stale-selection clearing are unit-covered (categoryFilterChips.test.ts, useCategoryFilterChips.test.ts, cited by explore-token-selector-category-filter-logic); the rendered chip row on each surface has no e2e."
# scope
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - explore
  - token-selector
  - token-categories
  - smoke
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/components/TokenSelector/categoryFilters/
  - packages/uniswap/src/components/TokenSelector/lists/TokenSelectorSearchResultsList.tsx
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** the token selector in the swap, limit, send and swap-and-add flows with the `token_categories` flag on
**When** the user types a query
**Then** a chip row appears with "My tokens" first (only when at least one result has a balance), then one chip per category present in the results in canonical order
**And** chips reflect the current results only: retyping adds or drops chips, and a selected chip that disappears clears itself
**And** category chips OR together while "My tokens" ANDs with them; filtering is client-side with no refetch, and sections a filter empties drop out
**And** the chip row scrolls horizontally when it overflows: on the 360px extension sidebar it fits and scrolls with the clear-filters link reachable without horizontal scroll, on mobile it scrolls inside the bottom sheet without dragging the sheet, and on mWeb it is tappable and scrolls

---
id: explore-token-selector-filter-no-results
title: Token selector distinguishes an empty query result from results removed by active chips
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: "Consumer Engagement token-categories QA plan (Notion, 2026-10-08), verified against packages/uniswap/src/components/TokenSelector/categoryFilters/CategoryFilterEmptyState.tsx on disk. The clear action is unit-covered (CategoryFilterEmptyState.test.tsx, cited by explore-token-selector-category-filter-logic); the two empty states have no e2e."
# scope
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - explore
  - token-selector
  - token-categories
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/components/TokenSelector/categoryFilters/
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** the token selector with a query typed and the `token_categories` flag on
**When** the query itself returns nothing
**Then** the existing empty state shows with no clear-filters link
**And** when the query has results but the active chips remove them all, the selector shows "No results found for <query>" with a "Clear active filter(s)" action that resets the chips and keeps the query

---
id: explore-token-selector-category-filter-logic
title: Token selector category chip derivation, filtering and RWA tagging are unit-pinned
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "The pure logic behind explore-token-selector-category-tags, -category-filter-chips and -filter-no-results."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - explore
  - token-selector
  - token-categories
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/components/TokenSelector/categoryFilters/
  - packages/uniswap/src/components/TokenSelector/tagRwaTokenSelectorSections.ts
automationRefs:
  - path: packages/uniswap/src/components/TokenSelector/categoryFilters/categoryFilterChips.test.ts
    testName: returns one chip per category present, in canonical order, with My tokens first when a balance exists
  - path: packages/uniswap/src/components/TokenSelector/categoryFilters/categoryFilterChips.test.ts
    testName: omits My tokens when no result carries a balance
  - path: packages/uniswap/src/components/TokenSelector/categoryFilters/categoryFilterChips.test.ts
    testName: drops selections whose chip disappeared from the result set
  - path: packages/uniswap/src/components/TokenSelector/categoryFilters/categoryFilterChips.test.ts
    testName: ORs multiple category chips
  - path: packages/uniswap/src/components/TokenSelector/categoryFilters/categoryFilterChips.test.ts
    testName: ANDs My tokens with the category chips
  - path: packages/uniswap/src/components/TokenSelector/categoryFilters/useCategoryFilterChips.test.ts
    testName: keeps a selection across the loading frame but drops it once its chip leaves the result set
  - path: packages/uniswap/src/components/TokenSelector/categoryFilters/CategoryFilterEmptyState.test.tsx
    testName: renders the clear action and fires the handler
  - path: packages/uniswap/src/components/TokenSelector/tagRwaTokenSelectorSections.test.ts
    testName: tags a matching single token row with its category, clean name, and issuer slug
  - path: packages/uniswap/src/components/TokenSelector/tagRwaTokenSelectorSections.test.ts
    testName: marks a matched RWA with no classified category as UNSPECIFIED (no tag)
---

> **medium · unit · pr-check · automated**

**Given** the token selector category-filter helpers and RWA tagging transform under test
**When** the unit suites run
**Then** chips derive one per present category in canonical order with "My tokens" first only when a balance exists, stale selections drop when their chip leaves the result set, category chips OR and "My tokens" ANDs, the empty state's clear action fires, and RWA rows are tagged with category, clean name and issuer slug while unclassified matches get no tag
