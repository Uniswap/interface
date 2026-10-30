# Portfolio scenarios — Home & overview

Home/portfolio balance display, overview chart, token table, external/demo wallet
views, network filtering, tab navigation, and multichain token UX. Shared defaults:
`_defaults.yaml`. Wallet aliases are described in `_defaults.yaml` (no secrets).

---
id: portfolio-overview-value-and-chart
title: Portfolio overview displays total value and time-period chart
# importance
priority: high
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) existing web e2e apps/web/src/pages/Portfolio/Overview/Overview.e2e.test.ts (Portfolio Chart block); (b) Testlio Web 'Portfolio' suite"
testlioRef: Portfolio
# scope
platforms:
  - web
labels:
  - regression
  - portfolio
  - smoke
wallets:
  - TW-PORTFOLIO-02
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/Overview/
  - packages/uniswap/src/features/portfolio/PortfolioBalance/
automationRefs:
  - path: apps/web/src/pages/Portfolio/Overview/Overview.e2e.test.ts
    testName: Portfolio Overview Tab > Portfolio Chart > should display portfolio value
  - path: apps/web/src/pages/Portfolio/Overview/Overview.e2e.test.ts
    testName: Portfolio Overview Tab > Portfolio Chart > should change time period when clicking selector
---

> **high · e2e · scheduled · automated**

**Given** a wallet (TW-PORTFOLIO-02) is loaded on the portfolio Overview tab
**When** the page renders and the user clicks a different time-period in the chart selector
**Then** the total portfolio value is displayed, the time-period selector is shown, and selecting a period updates the chart to that range

---
id: portfolio-home-zero-balance
title: Home shows $0.00 and empty state for a wallet with no balance
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) existing web e2e Overview.e2e.test.ts 'Empty Portfolio State'; (b) Testlio Wallet 'Home - Imported Wallet - With 0 Balance - iOS/Android'"
testlioRef: Home - Imported Wallet - With 0 Balance - iOS/Android
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - empty-state
wallets:
  - TW-PORTFOLIO-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/Overview/
  - apps/extension/src/app/features/home/
  - packages/uniswap/src/features/portfolio/
automationRefs:
  - path: apps/web/src/pages/Portfolio/Overview/Overview.e2e.test.ts
    testName: Portfolio Overview Tab > Empty Portfolio State > should show zero balance for empty portfolio
  - path: apps/web/src/pages/Portfolio/Overview/Overview.e2e.test.ts
    testName: Portfolio Overview Tab > Empty Portfolio State > should not show mini tables for empty portfolio
---

> **medium · e2e · release · automated**

**Given** a freshly imported wallet (TW-PORTFOLIO-01) with no token or NFT balances
**When** the user opens the home / portfolio surface
**Then** the USD total balance reads $0.00, the mini token/activity tables are not shown, and a receive/get-token prompt is offered

---
id: portfolio-home-funded-token-list
title: Token table lists visible balances in descending value order
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: "(a) existing web e2e Tokens.e2e.test.ts 'Token Table Display'; (b) Testlio Wallet 'Imported Wallet - with ETH Balance and NFT' (tokens ordered highest->lowest) and 'Home - with Balance and NFT - Extension'"
testlioRef: Imported Wallet - with ETH Balance and NFT
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - balances
  - smoke
wallets:
  - TW-PORTFOLIO-02
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/Tokens/
  - packages/uniswap/src/features/portfolio/balances/
  - packages/uniswap/src/features/portfolio/PortfolioBalance/
automationRefs:
  - path: apps/web/src/pages/Portfolio/Tokens/Tokens.e2e.test.ts
    testName: Portfolio Tokens Tab > Token Table Display > should display tokens table with visible tokens
  - path: apps/web/src/pages/Portfolio/Tokens/Tokens.e2e.test.ts
    testName: Portfolio Tokens Tab > Token Table Display > should display token data correctly
  - path: apps/web/src/pages/Portfolio/Tokens/Tokens.e2e.test.ts
    testName: Portfolio Tokens Tab > Token Table Display > should display portfolio balance
---

> **high · e2e · scheduled · automated**

**Given** a funded wallet (TW-PORTFOLIO-02) holding ETH plus several ERC-20 balances
**When** the user opens the Tokens tab
**Then** each held token shows the correct symbol, quantity, and USD value, the aggregate portfolio balance equals the sum of non-hidden tokens, and rows are ordered from highest to lowest balance

---
id: portfolio-token-row-to-tdp
title: Tapping a token row opens its token details page
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) web e2e Tokens.e2e.test.ts + Overview.e2e.test.ts row navigation; (b) mobile Maestro apps/mobile/.maestro/flows/portfolio/view-token-details.yaml"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - navigation
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
    testName: Portfolio Tokens Tab > Token Row Interactions > should navigate to token details when clicking a token row
  - path: apps/mobile/.maestro/flows/portfolio/view-token-details.yaml
    testName: portfolio-view-token-details
---

> **medium · e2e · release · automated**

**Given** a funded wallet (TW-PORTFOLIO-02) on the portfolio token list
**When** the user taps a token row (e.g. ETH or a standard ERC-20)
**Then** the token details screen opens showing the token header and the correct action buttons (Buy/Sell), and the back control returns to the portfolio

---
id: portfolio-external-and-view-only-wallet
title: External / view-only wallet portfolio renders with share, without swap actions
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) web e2e Overview.e2e.test.ts + Header.e2e.test.ts 'External Wallet View'; (b) Testlio Wallet 'Imported View Only Account (hayden.ens)'"
testlioRef: Imported View Only Account (hayden.ens)
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - view-only
wallets:
  - TW-PORTFOLIO-04
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/Overview/
  - apps/web/src/pages/Portfolio/Header/
  - packages/wallet/src/features/wallet/
automationRefs:
  - path: apps/web/src/pages/Portfolio/Overview/Overview.e2e.test.ts
    testName: Portfolio Overview Tab > External Wallet View > should display external wallet portfolio
  - path: apps/web/src/pages/Portfolio/Overview/Overview.e2e.test.ts
    testName: Portfolio Overview Tab > Action Tiles - External Wallet > should not show Swap, Buy, or More tiles for external wallet
  - path: apps/web/src/pages/Portfolio/Header/Header.e2e.test.ts
    testName: Portfolio Page Header > External Wallet View > should show share button when viewing external wallet
---

> **medium · e2e · release · automated**

**Given** a view-only account (TW-PORTFOLIO-04) imported by ENS
**When** the user views its portfolio
**Then** balances render for the external address, the address is preserved in the URL, a Share tile is shown, and Swap/Buy/More action tiles are hidden (no signing capability)

---
id: portfolio-demo-view
title: Demo portfolio view renders for a disconnected user
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) web e2e 'Demo View (Disconnected User)' describe blocks in Overview.e2e.test.ts, Header.e2e.test.ts, and Tokens.e2e.test.ts"
# scope
platforms:
  - web
labels:
  - regression
  - portfolio
  - demo-view
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/
automationRefs:
  - path: apps/web/src/pages/Portfolio/Overview/Overview.e2e.test.ts
    testName: Portfolio Overview Tab > Demo View (Disconnected User) > should show demo wallet indicator
  - path: apps/web/src/pages/Portfolio/Overview/Overview.e2e.test.ts
    testName: Portfolio Overview Tab > Demo View (Disconnected User) > should display demo portfolio data
  - path: apps/web/src/pages/Portfolio/Header/Header.e2e.test.ts
    testName: Portfolio Page Header > Demo View (Disconnected User) > should navigate tabs in demo view
  - path: apps/web/src/pages/Portfolio/Tokens/Tokens.e2e.test.ts
    testName: Portfolio Tokens Tab > Demo View (Disconnected User) > should show demo wallet tokens
---

> **medium · e2e · scheduled · automated**

**Given** no wallet is connected in the web app
**When** the user opens the portfolio page
**Then** a demo wallet indicator is shown, demo portfolio data (chart, action tiles, demo tokens) is displayed instead of a blank page, and the portfolio tabs still navigate while disconnected

---
id: portfolio-network-filter
title: Network filter scopes portfolio data and persists across tabs
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) web e2e Header.e2e.test.ts 'Network Filter' + Overview.e2e.test.ts 'Network Filter Integration'; (b) web e2e Tokens.e2e.test.ts 'Empty States' chain-scoped empty state with filter"
# scope
chains:
  - ethereum
  - base
  - unichain
platforms:
  - web
labels:
  - regression
  - portfolio
  - network-filter
wallets:
  - TW-PORTFOLIO-05
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/Header/
  - apps/web/src/pages/Portfolio/Overview/
  - apps/web/src/pages/Portfolio/Tokens/
automationRefs:
  - path: apps/web/src/pages/Portfolio/Header/Header.e2e.test.ts
    testName: Portfolio Page Header > Network Filter > should filter by Ethereum network and update URL
  - path: apps/web/src/pages/Portfolio/Header/Header.e2e.test.ts
    testName: Portfolio Page Header > Network Filter > should preserve chain filter across tab navigation
  - path: apps/web/src/pages/Portfolio/Overview/Overview.e2e.test.ts
    testName: Portfolio Overview Tab > Network Filter Integration > should filter overview data by network
  - path: apps/web/src/pages/Portfolio/Tokens/Tokens.e2e.test.ts
    testName: Portfolio Tokens Tab > Empty States > should show chain-specific empty state with filter
---

> **medium · e2e · release · automated** · chains: ethereum, base, unichain

**Given** a funded multichain wallet (TW-PORTFOLIO-05) on the portfolio page
**When** the user selects a single network (e.g. Ethereum) in the network filter
**Then** overview and token data are scoped to that chain, the URL reflects the chain filter, the filter is preserved when navigating between portfolio tabs, and filtering to a chain with no holdings shows a chain-specific empty state with a See-all-networks escape hatch

---
id: portfolio-tab-navigation
title: Portfolio header tabs navigate between Overview, Tokens, NFTs, Activity
# importance
priority: medium
severity: low
# provenance
source: existing-e2e
sourceNote: "(a) web e2e Header.e2e.test.ts 'Tab Navigation'"
# scope
platforms:
  - web
labels:
  - regression
  - portfolio
  - navigation
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/Header/
automationRefs:
  - path: apps/web/src/pages/Portfolio/Header/Header.e2e.test.ts
    testName: Portfolio Page Header > Tab Navigation > should display all portfolio tabs
  - path: apps/web/src/pages/Portfolio/Header/Header.e2e.test.ts
    testName: Portfolio Page Header > Tab Navigation > should navigate to Tokens tab
---

> **medium · e2e · release · automated**

**Given** the user is on the portfolio page with all tabs visible
**When** they click each tab (Tokens, NFTs, Activity, Overview)
**Then** the corresponding tab content loads and the active tab reflects the current route

---
id: portfolio-multichain-token-ux
title: Multichain token UX groups same-token balances across chains
# importance
priority: high
severity: medium
# provenance
source: testlio
sourceNote: "(a) Testlio 'Portfolio - Multichain Token UX' and 'Extension (Portfolio) - Multichain Token UX'; (b) lower-level unit coverage of the row/expansion logic exists in useTokenBalanceListMultichainExpansion.test.ts and balances/buildExtensionMultichainBalancesListData.test.ts (see portfolio-multichain-expansion-rows) — the rendered UI layer (grouped row, expand gesture, accordion) has no same-level automation"
testlioRef: Portfolio - Multichain Token UX
# scope
chains:
  - ethereum
  - base
  - unichain
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - multichain
wallets:
  - TW-PORTFOLIO-05
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/portfolio/useTokenBalanceListMultichainExpansion.ts
  - packages/uniswap/src/features/portfolio/balances/buildExtensionMultichainBalancesListData.ts
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum, base, unichain

**Given** a wallet (TW-PORTFOLIO-05) holding the same token across multiple chains
**When** the token list renders under the multichain UX flag and the user expands a grouped token row
**Then** a single aggregated parent row is shown by default, expanding reveals per-chain sub-rows, and only one multichain parent stays expanded at a time (accordion behaviour)

---
id: portfolio-data-liveliness
title: Data liveliness surfaces stale/unavailable balance indicators
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "(a) Testlio Web 'FE Data Liveliness Project - Part I/II/III' (flag data_liveliness_ui); (b) lower-level unit coverage of the mismatch threshold exists in checkBalanceDiffWithinRange.test.ts (see portfolio-balance-diff-within-range) — the rendered indicator UI has no same-level automation; (c) code BalanceUnavailableIndicator"
testlioRef: FE Data Liveliness Project - Part I/II/III
# scope
platforms:
  - web
labels:
  - regression
  - portfolio
  - data-liveliness
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/portfolio/checkBalanceDiffWithinRange.ts
  - packages/uniswap/src/features/portfolio/PortfolioBalance/BalanceUnavailableIndicator.tsx
  - packages/uniswap/src/features/portfolio/usePortfolioChartBalanceMismatch.ts
automationRefs: []
---

> **medium · e2e · release · gap**

**Given** the data_liveliness_ui flag is enabled and the chart total diverges from the summed portfolio total
**When** the divergence exceeds the tolerated threshold (>2% and above the absolute floor)
**Then** the balance is treated as mismatched/unavailable and a balance-unavailable indicator is shown instead of a misleading number

---
id: portfolio-multichain-metrics
title: Multichain portfolio metrics aggregate per-chain asset counts
# importance
priority: low
severity: low
# provenance
source: existing-unit
sourceNote: "(a) unit packages/uniswap/src/features/portfolio/getMultichainPortfolioMetrics.test.ts"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - multichain
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/portfolio/getMultichainPortfolioMetrics.ts
automationRefs:
  - path: packages/uniswap/src/features/portfolio/getMultichainPortfolioMetrics.test.ts
    testName: getMultichainPortfolioMetrics > aggregates multichain assets into reduction counts
  - path: packages/uniswap/src/features/portfolio/getMultichainPortfolioMetrics.test.ts
    testName: getMultichainRowReductionMetricsFromChainCounts > treats non-positive counts as one chain
---

> **low · unit · pr-check · automated**

**Given** a balance list spanning single-chain and multichain assets
**When** getMultichainPortfolioMetrics computes reduction metrics
**Then** single-chain assets contribute no reduction, multichain assets aggregate into correct reduction counts, and non-positive counts are treated as a single chain

---
id: portfolio-multichain-expansion-rows
title: Multichain balance list builds parent/hidden/per-chain rows correctly
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "(a) unit useTokenBalanceListMultichainExpansion.test.ts + balances/buildExtensionMultichainBalancesListData.test.ts + balances/flattenMultichainToSingleChainRows.test.ts"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - multichain
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/portfolio/useTokenBalanceListMultichainExpansion.ts
  - packages/uniswap/src/features/portfolio/balances/buildExtensionMultichainBalancesListData.ts
  - packages/uniswap/src/features/portfolio/balances/flattenMultichainToSingleChainRows.ts
automationRefs:
  - path: packages/uniswap/src/features/portfolio/useTokenBalanceListMultichainExpansion.test.ts
    testName: useTokenBalanceListMultichainExpansion > lists parent balance ids only for single-chain balances
  - path: packages/uniswap/src/features/portfolio/useTokenBalanceListMultichainExpansion.test.ts
    testName: useTokenBalanceListMultichainExpansion > includes hidden balance rows after the hidden section row when hiddenTokensExpanded is true
  - path: packages/uniswap/src/features/portfolio/useTokenBalanceListMultichainExpansion.test.ts
    testName: useTokenBalanceListMultichainExpansion > when multichain row expansion is enabled (extension) > does not insert per-chain rows until the parent is expanded
  - path: packages/uniswap/src/features/portfolio/useTokenBalanceListMultichainExpansion.test.ts
    testName: useTokenBalanceListMultichainExpansion > when multichain row expansion is enabled (extension) > expands only one multichain parent at a time (accordion)
---

> **medium · unit · pr-check · automated**

**Given** sorted balance data with single-chain, multichain, and hidden balances
**When** the multichain expansion hook / extension builder computes the row list
**Then** single-chain balances yield parent-only rows, hidden balances append a hidden section row (with their rows shown only when expanded), per-chain sub-rows appear only when a multichain parent is expanded, and only one parent stays expanded at a time (accordion)
