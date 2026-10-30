# NFT scenarios — View & browse

NFT tab display, grid rendering, search, empty/external/demo states, and navigation to
external marketplaces. Shared defaults: `_defaults.yaml`. Wallet aliases: see
`_defaults.yaml` legend.

---
id: nft-view-tab-mobile
title: NFT tab displays all owned NFTs (mobile)
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio Wallet suite 'NFT - General - iOS / Android'. No mobile NFT automation exists — apps/mobile/.maestro/flows/portfolio/ contains no NFT flow — so e2e automation is a genuine gap."
testlioRef: NFT - General - iOS / Android
# scope
chains:
  - ethereum
  - base
  - polygon
platforms:
  - mobile
labels:
  - regression
  - nft
  - smoke
wallets:
  - TW-NFT-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/screens/HomeScreen/portfolio/tabs/nfts/HomeScreenNftsTab.tsx
  - apps/mobile/src/screens/HomeScreen/portfolio/tabs/nfts/NftRows.tsx
  - packages/uniswap/src/components/nfts/NftsList.native.tsx
  - packages/uniswap/src/features/nfts/hooks/useGroupNftsByVisibility.ts
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum, base, polygon

**Given** test wallet TW-NFT-01 (funded wallet holding several visible NFTs) is imported and on the Home screen
**When** the user taps the NFTs tab (or swipes right to the NFT screen)
**Then** all owned NFTs are displayed as a grid; on a cold start a grey-box loading state shows first, and on a warm start previously-fetched NFT cards render immediately from cache without the grey-box loading state

---
id: nft-view-tab-extension
title: NFT tab displays owned NFTs (extension)
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio Wallet suite 'NFT Tab - Extension'. No extension e2e NFT automation exists; the shared list component (NftsList) and empty state are exercised by the web Playwright suite only."
testlioRef: NFT Tab - Extension
# scope
chains:
  - ethereum
  - base
platforms:
  - extension
labels:
  - regression
  - nft
  - smoke
wallets:
  - TW-NFT-01
  - TW-NFT-04
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/components/tabs/NftsTab.tsx
  - packages/uniswap/src/components/nfts/NftsList.native.tsx
  - packages/uniswap/src/components/nfts/NftViewWithContextMenu.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum, base

**Given** test wallet TW-NFT-01 is unlocked in the extension Home view
**When** the user clicks the NFT tab
**Then** all owned NFTs are displayed; a wallet with no NFTs (TW-NFT-04) instead shows the "No NFTs yet" empty state

---
id: nft-grid-display-web
title: Portfolio NFT grid renders cards, collection names, and count (web)
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "Existing web Playwright e2e apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts ('NFT Grid Display' block, NftsTab GraphQL intercept). A previous 'Test NFTs tab' testlioRef was removed — it is not among the blueprint's declared Testlio titles and could not be verified against the raw CSVs."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - nft
  - smoke
wallets:
  - TW-NFT-01
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/NFTs/Nfts.tsx
  - apps/web/src/pages/Portfolio/NFTs/NFTCard.tsx
  - packages/uniswap/src/components/nfts/NftsList.web.tsx
automationRefs:
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > NFT Grid Display > should display NFT cards with names
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > NFT Grid Display > should display collection names
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > NFT Grid Display > should display NFT count in header
---

> **medium · e2e · scheduled · automated** · chains: ethereum

**Given** the user is on `/portfolio/nfts` with an address (TW-NFT-01) whose NFTs are mocked via the `NftsTab` GraphQL intercept
**When** the NFTs tab loads
**Then** NFT cards render with their names and collection names, and the header shows the correct NFT count

---
id: nft-open-external-marketplace-mobile
title: Tapping an NFT opens it on the external marketplace (mobile)
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio Wallet suite 'NFT - General - iOS / Android'. Link construction lives in useNavigateToNftExplorerLink; no mobile automation exists for this path."
testlioRef: NFT - General - iOS / Android
# scope
chains:
  - ethereum
  - polygon
platforms:
  - mobile
labels:
  - regression
  - nft
wallets:
  - TW-NFT-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/nfts/hooks/useNavigateToNftExplorerLink.ts
  - apps/mobile/src/screens/HomeScreen/portfolio/tabs/nfts/NftRows.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum, polygon

**Given** test wallet TW-NFT-01 is on the NFTs tab with at least one owned NFT
**When** the user taps a single NFT card
**Then** the user is redirected to that NFT on the external marketplace (OpenSea) for the correct contract and token id

---
id: nft-search-filter-web
title: NFT search filters by name and collection with clear/no-results states (web)
# importance
priority: medium
severity: low
# provenance
source: existing-e2e
sourceNote: "Existing web Playwright e2e Nfts.e2e.test.ts ('Search Functionality' block). The underlying hook and matcher are additionally unit-covered by packages/uniswap/src/components/nfts/hooks/useNftSearch.test.ts and packages/uniswap/src/features/nfts/utils.test.ts — see companion unit cases nft-search-hook-unit and nft-filter-unit."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - nft
  - search
wallets:
  - TW-NFT-01
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/NFTs/Nfts.tsx
  - apps/web/src/pages/Portfolio/components/SearchInput.tsx
  - packages/uniswap/src/components/nfts/hooks/useNftSearch.ts
  - packages/uniswap/src/features/nfts/utils.ts
automationRefs:
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > Search Functionality > should filter NFTs by name
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > Search Functionality > should filter NFTs by collection name
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > Search Functionality > should show no results message when search has no matches
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > Search Functionality > should clear search and show all NFTs
---

> **medium · e2e · scheduled · automated** · chains: ethereum

**Given** the user is on the NFTs tab with several NFTs displayed (TW-NFT-01)
**When** they type a name or collection fragment into the search input
**Then** only matching NFTs remain; a non-matching query shows the no-results message; and clearing the search restores the full grid

---
id: nft-filter-unit
title: filterNft matches name, collection, token id, and contract case-insensitively (unit)
# importance
priority: medium
severity: low
# provenance
source: existing-unit
sourceNote: "Existing unit suite packages/uniswap/src/features/nfts/utils.test.ts (describe 'filterNft': empty/whitespace queries, per-field case-insensitive matching, undefined-field handling)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - nft
  - search
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/nfts/utils.ts
automationRefs:
  - path: packages/uniswap/src/features/nfts/utils.test.ts
    testName: filterNft
---

> **medium · unit · pr-check · automated**

**Given** an NFT item with name, collection name, token id, and contract address
**When** `filterNft(item, query)` is called
**Then** it returns true for empty/whitespace queries and for case-insensitive substring matches on any of the four fields (trimming surrounding whitespace), and false when no field contains the query or all fields are undefined

---
id: nft-search-hook-unit
title: useNftSearch partitions shown/hidden NFTs by search term and rebuilds the list (unit)
# importance
priority: medium
severity: low
# provenance
source: existing-unit
sourceNote: "Existing unit suite packages/uniswap/src/components/nfts/hooks/useNftSearch.test.ts (describe 'useNftSearch': unfiltered passthrough on empty search, per-group filtering, buildNftsArray rebuild, clear-search restore). Added per review — this suite was previously uncited anywhere in the catalog."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - nft
  - search
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/components/nfts/hooks/useNftSearch.ts
  - packages/uniswap/src/features/nfts/utils.ts
automationRefs:
  - path: packages/uniswap/src/components/nfts/hooks/useNftSearch.test.ts
    testName: useNftSearch
---

> **medium · unit · pr-check · automated**

**Given** shown and hidden NFT arrays and a search term
**When** `useNftSearch` recomputes its filtered results
**Then** an empty search returns the unfiltered shown/hidden arrays; a search term filters each group to case-insensitive matches only (empty arrays when nothing matches); the combined nfts array is rebuilt via `buildNftsArray` while searching; and clearing the search restores the unfiltered arrays

---
id: nft-empty-state-web
title: NFT empty states — no NFTs, chain-filtered, and see-all-networks (web)
# importance
priority: low
severity: low
# provenance
source: existing-e2e
sourceNote: "Existing web Playwright e2e Nfts.e2e.test.ts ('Empty States' block)."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - nft
  - empty-state
wallets:
  - TW-NFT-04
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/NFTs/Nfts.tsx
  - packages/uniswap/src/components/nfts/NftsListEmptyState.tsx
automationRefs:
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > Empty States > should show empty state when wallet has no NFTs
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > Empty States > should show chain-specific empty state with filter
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > Empty States > should navigate to all NFTs when clicking "See all networks"
---

> **low · e2e · release · automated** · chains: ethereum

**Given** a wallet with no NFTs (TW-NFT-04), or a chain filter selected with no NFTs on that chain
**When** the user opens the NFTs tab
**Then** the empty state is shown; with a chain filter the chain-specific empty state appears, and clicking "See all networks" navigates to the unfiltered NFTs view

---
id: nft-external-wallet-view-web
title: NFTs render for an external / view-only wallet with address preserved (web)
# importance
priority: medium
severity: low
# provenance
source: existing-e2e
sourceNote: "Existing web Playwright e2e Nfts.e2e.test.ts ('External Wallet View' block). A previous 'Imported View Only Account' testlioRef was removed — it is not among the blueprint's declared Testlio titles and could not be verified against the raw CSVs."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - nft
  - view-only
wallets:
  - TW-NFT-03
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/NFTs/Nfts.tsx
  - apps/web/src/pages/Portfolio/hooks/usePortfolioAddresses.ts
automationRefs:
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > External Wallet View > should show NFTs for external wallet
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > External Wallet View > should preserve external address in URL
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > External Wallet View > should show share button for external wallet
---

> **medium · e2e · release · automated** · chains: ethereum

**Given** an external / view-only wallet address (TW-NFT-03) is loaded via the portfolio route
**When** the user views its NFTs tab
**Then** the external wallet's NFTs are displayed, the external address is preserved in the URL, and a share button is shown

---
id: nft-demo-view-web
title: Disconnected demo view shows NFT content and demo indicator (web)
# importance
priority: low
severity: low
# provenance
source: existing-e2e
sourceNote: "Existing web Playwright e2e Nfts.e2e.test.ts ('Demo View (Disconnected User)' block)."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - nft
  - demo
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/NFTs/Nfts.tsx
automationRefs:
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > Demo View (Disconnected User) > should show demo wallet indicator
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > Demo View (Disconnected User) > should still display NFTs tab content in demo view
---

> **low · e2e · release · automated** · chains: ethereum

**Given** no wallet is connected (demo mode)
**When** the user opens the portfolio NFTs tab
**Then** the demo wallet indicator is shown and demo NFT tab content still renders

---
id: nft-responsive-web
title: NFT grid and search render correctly on mobile-width viewport (web)
# importance
priority: low
severity: low
# provenance
source: existing-e2e
sourceNote: "Existing web Playwright e2e Nfts.e2e.test.ts ('Responsive Behavior' block)."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - nft
  - responsive
wallets:
  - TW-NFT-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/NFTs/Nfts.tsx
  - packages/uniswap/src/components/nfts/NftsList.web.tsx
automationRefs:
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > Responsive Behavior > should display NFTs on mobile
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > Responsive Behavior > should have search input visible on mobile
---

> **low · e2e · release · automated** · chains: ethereum

**Given** the portfolio NFTs tab is loaded on a mobile-width viewport (TW-NFT-01)
**When** the page renders
**Then** NFT cards display in the responsive grid and the search input remains visible and usable
