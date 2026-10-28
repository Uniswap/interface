# NFT scenarios — Hidden NFTs & visibility grouping

Hidden-NFT expando behavior, hidden/shown grouping, and spam defaults. Shared defaults:
`_defaults.yaml`. Wallet aliases: see `_defaults.yaml` legend.

The Testlio Web suite 'Hidden NFTs Focus Exploratory' is anchored by
`nft-hidden-exploratory-web` below; its exploratory charter spans all cases in this
file collectively.

---
id: nft-hidden-expando-web
title: Hidden NFTs expand below the expando row without layout regression (web)
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio Web suite '[Web][Portfolio][NFT] Verify Hidden NFTs expand below the expando row'. Expando rendering lives in the shared InlineExpandoRow component; no web e2e covers the hidden-NFT expando yet."
testlioRef: "[Web][Portfolio][NFT] Verify Hidden NFTs expand below the expando row"
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - nft
  - hidden
wallets:
  - TW-NFT-02
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/NFTs/Nfts.tsx
  - packages/uniswap/src/components/ExpandoRow/InlineExpandoRow.tsx
  - packages/uniswap/src/features/nfts/utils.ts
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** test wallet TW-NFT-02 (holds one or more hidden NFTs) is on `/portfolio/nfts`
**And** the Hidden NFTs section is visible in its collapsed state with no hidden NFTs shown
**When** the user clicks the Hidden NFTs expando row
**Then** hidden NFTs render below the expando row (never above it), visible NFTs keep their positions with no overlap/clipping/flicker, and the behavior persists after a page refresh; collapsing hides them again

---
id: nft-hidden-exploratory-web
title: Hidden NFTs focus exploratory pass (web)
# importance
priority: low
severity: low
# provenance
source: testlio
sourceNote: "Testlio Web suite 'Hidden NFTs Focus Exploratory' (blueprint-declared title, previously unmapped in this catalog). Exploratory charter — not automatable as a scripted case; the scripted expando/grouping behavior is covered by the other cases in this file."
testlioRef: Hidden NFTs Focus Exploratory
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - nft
  - hidden
  - exploratory
wallets:
  - TW-NFT-02
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/Portfolio/NFTs/Nfts.tsx
  - packages/uniswap/src/components/ExpandoRow/InlineExpandoRow.tsx
  - packages/uniswap/src/features/nfts/hooks/useGroupNftsByVisibility.ts
automationRefs: []
---

> **low · e2e · release · manual** · chains: ethereum

**Given** test wallet TW-NFT-02 (mixed visible, hidden, and spam NFTs) is on `/portfolio/nfts`
**When** the tester explores the hidden-NFT surfaces — expanding/collapsing the expando repeatedly, hiding/unhiding items while the section is expanded, searching while expanded, refreshing, and resizing the viewport
**Then** no layout breakage, stale grouping, duplicated cards, or lost visibility state is observed; every hidden NFT stays below the expando row and counts stay consistent with the actual hidden set

---
id: nft-hidden-expando-mobile
title: Hidden NFTs expando row toggles hidden group (mobile)
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: "Derived from the mobile NFT tab implementation: NftRows renders the HIDDEN_NFTS_ROW sentinel (packages/uniswap/src/features/nfts/constants.ts) appended by buildNftsArray. No mobile automation exists for this path."
# scope
chains:
  - ethereum
platforms:
  - mobile
labels:
  - regression
  - nft
  - hidden
wallets:
  - TW-NFT-02
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/mobile/src/screens/HomeScreen/portfolio/tabs/nfts/NftRows.tsx
  - apps/mobile/src/screens/HomeScreen/portfolio/tabs/nfts/HomeScreenNftsTab.tsx
  - packages/uniswap/src/components/ExpandoRow/ExpandoRow.tsx
  - packages/uniswap/src/features/nfts/constants.ts
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** test wallet TW-NFT-02 is on the NFTs tab with at least one hidden NFT (the `HIDDEN_NFTS_ROW` expando is rendered with the hidden count)
**When** the user taps the "Hidden (N)" expando row
**Then** the hidden NFTs expand below the row and the row toggles between expanded/collapsed on subsequent taps

---
id: nft-hidden-grouping
title: NFTs group into shown vs hidden with spam hidden by default
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: "Derived from getIsNftHidden/buildNftsArray in packages/uniswap/src/features/nfts/utils.ts and useGroupNftsByVisibility. No unit test exists for the grouping logic yet (utils.test.ts covers filterNft only) — a real automatable unit gap."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - nft
  - hidden
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/nfts/utils.ts
  - packages/uniswap/src/features/nfts/hooks/useGroupNftsByVisibility.ts
  - packages/uniswap/src/features/visibility/slice.ts
automationRefs: []
---

> **medium · unit · pr-check · gap**

**Given** a set of NFT items where some are flagged `isSpam` and some have an explicit visibility override in the visibility slice
**When** `getIsNftHidden`/`buildNftsArray` (via `useGroupNftsByVisibility`) partition the list
**Then** spam NFTs default to hidden unless explicitly overridden visible, explicitly hidden NFTs move to the hidden group, and `buildNftsArray` appends the `HIDDEN_NFTS_ROW` (with an `EMPTY_NFT_ITEM` filler when the shown count is odd) only once all pages are fetched
