# RWA scenarios — Search (stocks in the search modal)

Tokenized assets in the shared SearchModal (always on since #41845 removed the RWA flags): the no-query
Stocks shelf, RWA grouping of multi-issuer tickers into collections, and RWA tagging
of matched token rows. This surface sits outside the blueprint's original code_paths
(a blueprint scoping gap flagged in review); it is included here because it is a
user-facing RWA surface with real unit coverage. Shared defaults: `_defaults.yaml`.

---
id: rwa-search-stocks-section
title: Search groups and tags stocks via the RWA index
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "Backed by packages/uniswap/src/features/search/SearchModal/stocks/ unit suites: useRwaIndex.test.ts, applyRwaGrouping.test.ts, noQueryStocks.test.ts, tagOptionAsRwa.test.ts (cited names verified verbatim, including tagOptionAsRwa.test.ts's 'leaves the clean name unset with plainTokenNames so the row keeps the token name'). The former RwaUxSearch flag was removed in #41845; the surface is always on. Added per review; code_paths extend beyond the blueprint's declared RWA roots because the search surface lives under features/search. Parent/child row content and label styling added from the Consumer Engagement search QA plan (Notion, 2026-10-08)."
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
  - search
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/search/SearchModal/stocks/
automationRefs:
  - path: packages/uniswap/src/features/search/SearchModal/stocks/useRwaIndex.test.ts
    testName: useRwaIndex > requests commodities inline for the shared index
  - path: packages/uniswap/src/features/search/SearchModal/stocks/applyRwaGrouping.test.ts
    testName: applyRwaGroupingToSearchOptions > collapses a matched multi-issuer ticker into one collection
  - path: packages/uniswap/src/features/search/SearchModal/stocks/noQueryStocks.test.ts
    testName: buildNoQueryRwaCollectionOptions > wraps the top N rwas as RwaCollection options preserving order
  - path: packages/uniswap/src/features/search/SearchModal/stocks/tagOptionAsRwa.test.ts
    testName: tagOptionAsRwa > stamps category, clean name, and issuer slug from the match
---

> **medium · unit · pr-check · automated** · chains: ethereum

**Given** the search modal has the RWA index available
**When** the user opens search with no query, or searches a stock ticker
**Then** the no-query state shows the top stocks as RwaCollection options preserving registry order, and a matched multi-issuer ticker collapses into one collection hoisted above generic token results
**And** a matched single token row is tagged with its category, clean name, and issuer slug (direct contract-address search stays a single tagged token, no collection)
**And** with the token-categories flag on, the clean name is left unset so the row keeps showing the token's own name instead
**And** on web a collapsed Stocks parent row shows volume on the left and the "from" price with 24h change on the right; expanding it hides those from the parent and each child issuer row shows its own volume, price and 24h change (mobile keeps volume out of the parent row)
**And** issuer labels use the updated style with grayscale issuer logos, and the "Stocks" label uses the updated style
