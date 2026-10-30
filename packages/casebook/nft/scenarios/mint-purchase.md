# NFT scenarios — Mint & purchase

Transactional NFT flows initiated from external dapps (Zora mint, OpenSea purchase) via
the wallet's dapp-request / WalletConnect surface, and reflected back in the NFT tab.
These move funds on-chain — treat failures as prod-incident severity. Shared defaults:
`_defaults.yaml`. Wallet aliases: see `_defaults.yaml` legend.

---
id: nft-mint-zora-mobile
title: Mint an NFT on Zora and confirm the on-chain transaction (mobile)
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "Testlio Wallet suite 'Mint NFT on Zora - iOS/Android'. Primary surface is the in-app browser dapp-request flow; connecting via WalletConnect instead is a variant of this case (different code path in packages/wallet/src/features/dappRequests/). Manual/Testlio-only for now: requires real funds on the live zora.co dapp — no fork-based dapp harness exists to automate it, unlike LP's anvil-fork e2e."
testlioRef: Mint NFT on Zora - iOS/Android
# scope
chains:
  - base
  - zora
platforms:
  - mobile
labels:
  - regression
  - nft
  - mint
  - transaction
wallets:
  - TW-NFT-05
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/nfts/
  - packages/wallet/src/features/dappRequests/
  - packages/wallet/src/features/transactions/watcher/
automationRefs: []
---

> **urgent · e2e · release · manual** · chains: base, zora

**Given** test wallet TW-NFT-05 (funded on Base/Zora with gas) is connected to zora.co in the in-app browser
**When** the user selects an NFT, picks a chain (e.g. Base), taps Buy, and taps Accept on the transaction request modal
**Then** the modal first shows the correct origin (zora.co), network cost, and wallet; on Accept the mint is submitted, the pending-tx toaster appears, and the Activity tab reflects "transaction confirmed" once mined

**When** instead the user taps Cancel on the transaction request modal
**Then** the modal is dismissed, no transaction is submitted, and nothing appears in the Activity tab

---
id: nft-purchase-avax-mobile
title: Purchase an NFT on Avalanche via external dapp and see it in the NFT tab (mobile)
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "Testlio Wallet suite 'Purchase NFT on Avax - iOS/Android'. Manual/Testlio-only for now: requires real funds on a live third-party marketplace (OpenSea) on Avalanche — no fork-based dapp harness exists to automate it."
testlioRef: Purchase NFT on Avax - iOS/Android
# scope
chains:
  - avalanche
platforms:
  - mobile
labels:
  - regression
  - nft
  - purchase
  - transaction
wallets:
  - TW-NFT-06
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/nfts/
  - packages/wallet/src/features/dappRequests/
  - packages/uniswap/src/data/apiClients/dataApiService/nfts/useWalletNfts.ts
automationRefs: []
---

> **urgent · e2e · release · manual** · chains: avalanche

**Given** test wallet TW-NFT-06 (funded on Avalanche with gas) is connected to an external NFT marketplace (OpenSea)
**When** the user purchases an NFT from an Avalanche collection and approves + signs the transaction
**Then** the purchase confirms on-chain and the just-purchased NFT is displayed under the wallet's NFT tab after the balance refreshes
