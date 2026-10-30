# RWA scenarios — Token Details Page (TDP)

The modified TDP for tokenized assets (always on since #41845 removed the RWA flags): issuer-aware header, the
"More ways to trade" sibling-issuer section, the equity off-hours liquidity warning,
the "Other stocks" carousel (mobile), Coingecko-backed pricing, and RWA view analytics.
Shared defaults: `_defaults.yaml`.

Chain scope: `chains: [ethereum]` throughout this catalog. Ethereum mainnet (chainId 1)
is `PREFERRED_RWA_CHAIN_ID` and the production RWA chain; registry matching itself is
chain-scoped but multi-chain-capable (see `rwa-is-rwa-token-identification`).

---
id: rwa-tdp-header-identity
title: RWA TDP header shows ticker, issuer, and issuer-logo fallback
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "Blueprint Testlio suite 'Tokenized Assets - TDP Page'. Header mapping logic is unit-covered by packages/uniswap/src/features/rwa/getRWAHeaderIdentity.test.ts ('shows the underlying asset name for an RWA match', 'keeps the matched token logo (not the shared group icon) for an RWA match', 'falls back to the asset symbol when the RWA asset name is empty', 'keeps the token name for an RWA match with plainTokenNames'); no e2e-level RWA TDP automation exists (verified against apps/web TokenDetails e2e specs), so this e2e case renders as a gap."
testlioRef: Tokenized Assets - TDP Page
# scope
chains:
  - ethereum
platforms:
  - web
  - mobile
labels:
  - regression
  - rwa
  - tdp
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/TokenDetails/components/header/RWAIssuerHeaderDetails.tsx
  - apps/web/src/pages/TokenDetails/components/header/TokenDetailsHeader.tsx
  - apps/mobile/src/components/TokenDetails/rwa/RWAIssuerHeaderDetails.tsx
  - packages/uniswap/src/features/rwa/getRWAHeaderIdentity.ts
  - packages/uniswap/src/features/rwa/hooks/useRwaGroupMatch.ts
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** the user opens the TDP for an RWA asset
**When** the header renders via `getRWAHeaderIdentity`
**Then** the header shows the ticker with the token issuer displayed below the asset name, using the matched token logo (not the shared group icon)
**And** the issuer logo renders next to the issuer when the backend issuer logo set has one; when no logo is available the issuer text still renders cleanly with no broken image
**And** the asset symbol is used as a clean fallback when the RWA asset name is empty
**And** with the token-categories flag on, the header keeps the token's own on-chain/project name instead of the registry asset name
**And** while the RWA identity is still resolving, the title and issuer row hold a loading skeleton instead of painting the plain token name and then flipping to the RWA identity
**And** when no issuer label can be resolved for the matched token, the issuer row does not render at all (not even without a logo)

---
id: rwa-tdp-more-ways-to-trade
title: '"More ways to trade" lists other issuer tokens for the same stock'
# importance
priority: high
severity: medium
# provenance
source: testlio
sourceNote: "Blueprint Testlio suite 'Tokenized Assets - TDP Page'. The sibling market-data mapping is unit-covered by packages/uniswap/src/features/rwa/useRWAIssuerMarketData.test.ts ('buildRWAIssuerMarketDataMap > resolves market data for an EVM token regardless of address checksum casing'); the primary-name resolution is unit-covered by packages/uniswap/src/features/rwa/getIssuerTokenPrimaryName.test.ts; the card layout, dot separator, expand/collapse >2 rule, and tap navigation have no e2e automation, so this e2e case renders as a gap. Carousel gating and the 'Other stocks' fallback rule added from the Consumer Engagement token-categories QA plan (Notion, 2026-10-08)."
testlioRef: Tokenized Assets - TDP Page
# scope
chains:
  - ethereum
platforms:
  - web
  - mobile
labels:
  - regression
  - rwa
  - tdp
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/TokenDetails/components/rwa/MoreWaysToTrade.tsx
  - apps/web/src/pages/TokenDetails/components/rwa/IssuerTokenCard.tsx
  - apps/mobile/src/components/TokenDetails/rwa/MoreRwaTokens.tsx
  - packages/uniswap/src/features/rwa/useRWAIssuerMarketData.ts
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum

**Given** the user views an RWA TDP for an asset represented by multiple issuer tokens
**When** the "More ways to trade" section renders below the Stats section
**Then** it lists the sibling issuer tokens (excluding the currently viewed issuer), each card showing market cap and 1D volume on one line with a dot separator
**And** the expand/collapse control appears only when there are more than 2 sibling tokens
**And** tapping a sibling opens the correct issuer token's TDP
**And** each card's primary label is the sibling's own on-chain/BE token name with the token-categories flag on (falling back to the asset name for an empty token name), or the asset name — falling back to the asset symbol when that is empty — with the flag off
**And** the section heading uses the asset symbol as a fallback when the RWA asset name is empty
**And** a sibling card's issuer line does not render when no issuer label can be resolved for that token
**And** tokens whose category is not issuer-grouped skip the "More <Asset> tokens" carousel entirely
**And** the "Other stocks" fallback carousel appears only when the token belongs to no additional categories

---
id: rwa-tdp-off-hours-warning
title: isEquityMarketOffHours flags weekends, boundaries, and DST correctly
# importance
priority: high
severity: medium
# provenance
source: existing-unit
sourceNote: "Backed by packages/uniswap/src/features/rwa/equityMarketHours.test.ts (all cited test names verified verbatim). Scoped to the time predicate only; the banner render and mobile bottom-sheet UX are the separate e2e case rwa-tdp-off-hours-banner."
# scope
chains:
  - ethereum
platforms:
  - web
  - mobile
labels:
  - regression
  - rwa
  - tdp
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/rwa/equityMarketHours.ts
automationRefs:
  - path: packages/uniswap/src/features/rwa/equityMarketHours.test.ts
    testName: isEquityMarketOffHours > returns false on a weekday during regular trading hours
  - path: packages/uniswap/src/features/rwa/equityMarketHours.test.ts
    testName: isEquityMarketOffHours > returns true at the 4:00pm ET close
  - path: packages/uniswap/src/features/rwa/equityMarketHours.test.ts
    testName: isEquityMarketOffHours > returns true throughout Saturday
  - path: packages/uniswap/src/features/rwa/equityMarketHours.test.ts
    testName: isEquityMarketOffHours > respects daylight saving time (EDT, UTC-4)
---

> **high · unit · pr-check · automated** · chains: ethereum

**Given** a timestamp to evaluate against the U.S. equity trading window
**When** `isEquityMarketOffHours` evaluates it
**Then** it returns false during regular hours (from the 9:30am ET open up to, but not including, the 4:00pm ET close on a weekday) and true before the open, at/after the close, and overnight
**And** it returns true throughout Saturday and Sunday
**And** the ET boundary math respects daylight saving time (EDT, UTC-4)

---
id: rwa-tdp-off-hours-banner
title: Off-hours liquidity banner renders on the TDP with mobile bottom sheet
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Blueprint Testlio suite 'Tokenized Assets - TDP Page'. Split out of rwa-tdp-off-hours-warning per review: the time predicate is unit-covered (equityMarketHours.test.ts) but the banner render and the mobile market-hours bottom sheet have no same-level (e2e) automation, so this case renders as a gap."
testlioRef: Tokenized Assets - TDP Page
# scope
chains:
  - ethereum
platforms:
  - web
  - mobile
labels:
  - regression
  - rwa
  - tdp
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/TokenDetails/components/rwa/OffHoursLiquidityBanner.tsx
  - apps/mobile/src/components/TokenDetails/rwa/OffHoursMarketWarning.tsx
  - packages/uniswap/src/features/rwa/OffHoursWarningCard.tsx
  - packages/uniswap/src/features/rwa/useIsEquityOffHours.ts
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** the user views an RWA equity TDP that matches a stock asset, and the current time is outside the U.S. equity trading window
**When** the page renders
**Then** the off-hours low-liquidity informational warning banner is shown on the TDP
**And** on mobile, tapping the banner opens the market-hours bottom sheet with matching copy, a "Learn more" link, and a Close control
**And** during regular U.S. market hours (9:30am-4:00pm ET on a weekday) the banner is hidden

---
id: rwa-tdp-other-stocks-carousel
title: Mobile TDP shows an "Other stocks" carousel with sparklines
# importance
priority: medium
severity: low
# provenance
source: testlio
sourceNote: "Blueprint Testlio suite 'Tokenized Assets - TDP Page'. Mobile-only surface implemented in apps/mobile/src/components/TokenDetails/rwa/OtherStocks.tsx (verified on disk); no Maestro or e2e automation exists for it."
testlioRef: Tokenized Assets - TDP Page
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - rwa
  - tdp
  - mobile
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/components/TokenDetails/rwa/OtherStocks.tsx
  - packages/uniswap/src/features/rwa/useRWAIssuerMarketData.ts
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** the user views an RWA stock TDP on mobile
**When** they scroll near the bottom of the page
**Then** an "Other stocks" carousel is shown with roughly 1.5 cards visible, each card showing issuer + ticker on one line and price + 1D change on one line
**And** each card renders a non-flat 1D sparkline when the underlying stock has price movement

---
id: rwa-tdp-coingecko-pricing
title: Stock assets use project (Coingecko) pricing on the TDP
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Blueprint Testlio suite 'Tokenized Assets - TDP Page'. The usePreferProjectMarketData hook (and its unit tests) was removed on main — market-data preference now flows through the data-api layer, so the prior unit automationRefs were dropped; re-cite a successor test when one exists."
testlioRef: Tokenized Assets - TDP Page
# scope
chains:
  - ethereum
platforms:
  - web
  - mobile
labels:
  - regression
  - rwa
  - tdp
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/rwa/
  - packages/uniswap/src/features/rwa/useRWAMatch.ts
automationRefs: []
---

> **medium · unit · pr-check · automated** · chains: ethereum

**Given** a TDP for a stock RWA asset that matches the RWA registry
**When** the TDP evaluates market-data preference for the token with the feature flag on
**Then** project (Coingecko) market data is preferred for the price chart and 24h volume stat
**And** for a non-RWA token, or when the flag is off, project market data is not preferred and the default on-chain pricing is used

---
id: rwa-tdp-view-analytics
title: RWA TDP view logs once with resolved RWA and geogated properties
# importance
priority: low
severity: low
# provenance
source: existing-unit
sourceNote: "Backed by packages/uniswap/src/features/rwa/useLogRWATokenDetailsViewed.test.ts (cited test names verified verbatim)."
# scope
chains:
  - ethereum
platforms:
  - web
  - mobile
labels:
  - regression
  - rwa
  - tdp
  - analytics
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/rwa/useLogRWATokenDetailsViewed.ts
automationRefs:
  - path: packages/uniswap/src/features/rwa/useLogRWATokenDetailsViewed.test.ts
    testName: useLogRWATokenDetailsViewed > fires once with the resolved RWA properties, geogated reflecting the compliance region gate
  - path: packages/uniswap/src/features/rwa/useLogRWATokenDetailsViewed.test.ts
    testName: useLogRWATokenDetailsViewed > does not re-fire on unrelated re-renders of the same token
---

> **low · unit · pr-check · automated** · chains: ethereum

**Given** a user opens the TDP for an RWA token
**When** `useLogRWATokenDetailsViewed` runs
**Then** the view event fires exactly once with the resolved RWA properties, `stocks` reflecting the RWA category and `geogated` reflecting the ISSUER_SPECIFIC_RWA compliance gate for the region, and does not fire at all for a non-RWA token
