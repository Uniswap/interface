# NFT scenarios — Context menu & actions

Per-NFT context menu (long-press on mobile, hover/click on web/extension): view on
explorer, view on OpenSea, copy address, hide/unhide, report spam. Shared defaults:
`_defaults.yaml`. Wallet aliases: see `_defaults.yaml` legend.

---
id: nft-context-menu-extension
title: NFT context menu shows the full owned-asset action set (extension)
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio Wallet suite 'NFT Tab - Extension'. Menu composition verified against useNftContextMenuItems (report-spam entry gated on FeatureFlags.SelfReportSpamNFTs, owned, not view-only, not already spam)."
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
  - context-menu
wallets:
  - TW-NFT-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/nfts/hooks/useNftContextMenuItems.tsx
  - packages/uniswap/src/components/nfts/NftViewWithContextMenu.tsx
  - apps/extension/src/app/components/tabs/NftsTab.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum, base

**Given** test wallet TW-NFT-01 is on the extension NFT tab with an owned NFT
**When** the user opens the context menu on an NFT card
**Then** the menu shows: View on <explorer> (BaseScan/Etherscan), View on OpenSea, Copy address, Hide NFT, and (when the self-report flag is enabled and the asset is not already spam) Report as spam

---
id: nft-hide-unhide-extension
title: Hide then unhide an NFT via context menu (extension)
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio Wallet suite 'NFT Tab - Extension'. Visibility toggling persists in packages/uniswap/src/features/visibility/slice.ts."
testlioRef: NFT Tab - Extension
# scope
chains:
  - ethereum
platforms:
  - extension
labels:
  - regression
  - nft
  - context-menu
  - hidden
wallets:
  - TW-NFT-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/nfts/hooks/useNftContextMenuItems.tsx
  - packages/uniswap/src/features/visibility/slice.ts
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum

**Given** an owned, visible NFT on the extension NFT tab (TW-NFT-01)
**When** the user selects "Hide NFT" from its context menu
**Then** the NFT moves to the hidden group; reopening the menu now offers "Unhide NFT", and selecting it restores the NFT to the visible grid (visibility persisted in the visibility slice)

---
id: nft-context-menu-mobile-longpress
title: Long-press NFT surfaces the context menu (mobile)
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio Wallet suite 'NFT - General - iOS / Android'. Long-press haptic and menu items come from NftViewWithContextMenu + useNftContextMenuItems; no mobile automation exists."
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
  - context-menu
wallets:
  - TW-NFT-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/components/nfts/NftViewWithContextMenu.tsx
  - packages/uniswap/src/features/nfts/hooks/useNftContextMenuItems.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · chains: ethereum, polygon

**Given** test wallet TW-NFT-01 is on the NFTs tab
**When** the user long-presses an NFT card
**Then** the context menu opens (with haptic feedback) offering View on <explorer>, Copy address, Hide, and Report as spam actions for the asset

---
id: nft-report-spam-mobile
title: Report an NFT as spam hides it and confirms with a toaster
# importance
priority: high
severity: medium
# provenance
source: testlio
sourceNote: "Testlio Wallet suite 'NFT - General - iOS / Android'. Report path verified in useNftContextMenuItems (gated on FeatureFlags.SelfReportSpamNFTs) and packages/uniswap/src/features/reporting/reports.ts."
testlioRef: NFT - General - iOS / Android
# scope
chains:
  - ethereum
  - polygon
platforms:
  - mobile
  - extension
labels:
  - regression
  - nft
  - spam
wallets:
  - TW-NFT-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/nfts/hooks/useNftContextMenuItems.tsx
  - packages/uniswap/src/features/reporting/reports.ts
automationRefs: []
---

> **high · e2e · release · gap** · chains: ethereum, polygon

**Given** an owned, non-spam NFT and the self-report-spam flag enabled (TW-NFT-01)
**When** the user selects "Report as spam" from the NFT context menu
**Then** a report is submitted (analytics + data API), the NFT is set hidden, the "Reported" toaster appears, and the NFT now lives under the hidden group

---
id: nft-external-links
title: NFT external-link and copy-address actions open the correct targets
# importance
priority: medium
severity: low
# provenance
source: existing-e2e
sourceNote: "Web hover context-menu covered by existing Playwright e2e Nfts.e2e.test.ts ('NFT Card Interactions' block); the extension/mobile variants of the same menu actions map to Testlio Wallet suite 'NFT Tab - Extension'."
testlioRef: NFT Tab - Extension
# scope
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - nft
  - context-menu
wallets:
  - TW-NFT-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/nfts/hooks/useNftContextMenuItems.tsx
  - packages/uniswap/src/features/nfts/hooks/useNavigateToNftExplorerLink.ts
  - apps/web/src/pages/Portfolio/NFTs/NFTCard.tsx
automationRefs:
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > NFT Card Interactions > should show context menu on NFT card hover
  - path: apps/web/src/pages/Portfolio/NFTs/Nfts.e2e.test.ts
    testName: Portfolio NFTs Tab > NFT Card Interactions > should show "View on OpenSea" text on hover
---

> **medium · e2e · release · automated** · chains: ethereum

**Given** an owned NFT card (TW-NFT-01) with its context menu open
**When** the user chooses "View on <explorer>", "View on OpenSea", or "Copy address"
**Then** the explorer/OpenSea link opens the correct external URL for the contract and token id, and Copy address copies the contract address and shows the "Address copied" toaster
