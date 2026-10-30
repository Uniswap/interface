# Portfolio scenarios — Token visibility & row actions

Hide/unhide tokens, the hidden-tokens expando, hidden NFTs on the portfolio tab,
token search within the portfolio, and long-press / row context menus. Shared
defaults: `_defaults.yaml`.

---
id: portfolio-hide-unhide-token
title: Hide and unhide a token moves it in/out of the hidden section
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) web e2e Tokens.e2e.test.ts 'Hidden Tokens'; (b) Testlio Wallet 'Hiding/Unhiding Token'; (c) lower-level unit coverage of the persisted visibility state in visibility.test.ts setTokenVisibility (see portfolio-visibility-slice)"
testlioRef: Hiding/Unhiding Token
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - visibility
wallets:
  - TW-PORTFOLIO-05
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/Tokens/
  - packages/uniswap/src/features/visibility/
automationRefs:
  - path: apps/web/src/pages/Portfolio/Tokens/Tokens.e2e.test.ts
    testName: Portfolio Tokens Tab > Hidden Tokens > should expand hidden tokens when clicking expando row
  - path: apps/web/src/pages/Portfolio/Tokens/Tokens.e2e.test.ts
    testName: Portfolio Tokens Tab > Hidden Tokens > should collapse hidden tokens when clicking expando row again
---

> **medium · e2e · release · automated**

**Given** a wallet (TW-PORTFOLIO-05) with both visible and hidden tokens
**When** the user hides a visible token and then expands the hidden-tokens expando to unhide it
**Then** the hidden token is removed from the main list into the hidden section, the expando toggles the hidden section open/closed, and the persisted token-visibility state reflects each toggle

---
id: portfolio-hidden-tokens-expando
title: Hidden-tokens section stays collapsed by default and toggles open
# importance
priority: medium
severity: low
# provenance
source: existing-e2e
sourceNote: "(a) web e2e Tokens.e2e.test.ts 'Hidden Tokens' (expando row + info banner); (b) lower-level unit coverage of the hidden-section row in useTokenBalanceListMultichainExpansion.test.ts (see portfolio-multichain-expansion-rows)"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - visibility
wallets:
  - TW-PORTFOLIO-05
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/Tokens/
  - packages/uniswap/src/features/portfolio/useTokenBalanceListMultichainExpansion.ts
automationRefs:
  - path: apps/web/src/pages/Portfolio/Tokens/Tokens.e2e.test.ts
    testName: Portfolio Tokens Tab > Hidden Tokens > should display hidden tokens expando row
  - path: apps/web/src/pages/Portfolio/Tokens/Tokens.e2e.test.ts
    testName: Portfolio Tokens Tab > Hidden Tokens > should display hidden tokens info banner when expanded
---

> **medium · e2e · release · automated**

**Given** a wallet (TW-PORTFOLIO-05) that has at least one user-hidden token
**When** the user views the token list and clicks the hidden-tokens expando row
**Then** the hidden section is collapsed by default, the hidden count is shown on the expando row, and expanding reveals the hidden balances plus the informational banner

---
id: portfolio-hidden-nfts-tab
title: Hidden NFTs stay out of the main grid on the portfolio NFTs tab
# importance
priority: low
severity: low
# provenance
source: testlio
sourceNote: "(a) Testlio Web 'Hidden NFTs Focus Exploratory (portfolio tab)'; (b) lower-level unit coverage of the persisted NFT-visibility state in visibility.test.ts setNftVisibility (see portfolio-visibility-slice) — the NFTs-tab rendering layer has no automation. Full NFT-tab visuals and NFT detail flows are owned by the nft area catalog."
testlioRef: Hidden NFTs Focus Exploratory (portfolio tab)
# scope
platforms:
  - web
labels:
  - regression
  - portfolio
  - visibility
  - nft
wallets:
  - TW-PORTFOLIO-02
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/visibility/
  - apps/web/src/pages/Portfolio/NFTs/
automationRefs: []
---

> **low · e2e · release · manual**

**Given** a wallet (TW-PORTFOLIO-02) holding at least one NFT, viewed on the portfolio NFTs tab
**When** the user hides an NFT and revisits the NFTs tab
**Then** the hidden NFT is excluded from the main grid, is reachable only via the hidden section, and unhiding it restores it to the main grid without stale or duplicated entries

---
id: portfolio-token-search
title: Token search filters the portfolio token list by name and symbol
# importance
priority: low
severity: low
# provenance
source: existing-e2e
sourceNote: "(a) web e2e Tokens.e2e.test.ts 'Search Functionality'"
# scope
platforms:
  - web
labels:
  - regression
  - portfolio
  - search
wallets:
  - TW-PORTFOLIO-02
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/Tokens/
automationRefs:
  - path: apps/web/src/pages/Portfolio/Tokens/Tokens.e2e.test.ts
    testName: Portfolio Tokens Tab > Search Functionality > should filter tokens by name
  - path: apps/web/src/pages/Portfolio/Tokens/Tokens.e2e.test.ts
    testName: Portfolio Tokens Tab > Search Functionality > should show no results message when search has no matches
---

> **low · e2e · release · automated**

**Given** a funded wallet (TW-PORTFOLIO-02) on the Tokens tab
**When** the user types a token name or symbol into the search field
**Then** the list filters to matching tokens, a no-results message appears for non-matching input, and clearing the search restores the full list

---
id: portfolio-token-row-context-menu
title: Token row long-press / hover exposes a context menu
# importance
priority: low
severity: low
# provenance
source: existing-e2e
sourceNote: "(a) web e2e Tokens.e2e.test.ts 'Token Row Interactions' (context menu on hover); (b) Testlio Wallet 'Long Press'"
testlioRef: Long Press
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - context-menu
wallets:
  - TW-PORTFOLIO-02
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/Tokens/
  - packages/uniswap/src/features/portfolio/
automationRefs:
  - path: apps/web/src/pages/Portfolio/Tokens/Tokens.e2e.test.ts
    testName: Portfolio Tokens Tab > Token Row Interactions > should show context menu button on row hover
---

> **low · e2e · release · automated**

**Given** a funded wallet (TW-PORTFOLIO-02) on the token list
**When** the user long-presses a token row (mobile) or hovers it (web)
**Then** a row context menu / action button appears offering the per-token actions (e.g. hide, view details, swap)

---
id: portfolio-visibility-slice
title: Visibility slice toggles token / NFT / activity / position visibility
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "(a) unit packages/uniswap/src/features/visibility/visibility.test.ts (slice + selectors)"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - visibility
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/visibility/slice.ts
  - packages/uniswap/src/features/visibility/selectors.ts
automationRefs:
  - path: packages/uniswap/src/features/visibility/visibility.test.ts
    testName: visibility slice > setTokenVisibility > should set token visibility from false to true
  - path: packages/uniswap/src/features/visibility/visibility.test.ts
    testName: visibility slice > setNftVisibility > should set nft visibility from false to true
  - path: packages/uniswap/src/features/visibility/visibility.test.ts
    testName: visibility slice > selectors > selectPositionsVisibility should return correct visibility map
---

> **medium · unit · pr-check · automated**

**Given** an initial visibility state
**When** setTokenVisibility / setNftVisibility / setActivityVisibility / setPositionVisibility are dispatched
**Then** each entity's visibility toggles correctly and the corresponding selector returns the accurate visibility map (empty object when no context is present)
