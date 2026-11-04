# Smart Wallet scenarios — Flashblocks with pre-delegated wallet

Fast-confirmation swaps on Flashblocks-enabled chains using a wallet that is already delegated,
plus the two comparison baselines (non-Flashblocks chain; non-delegated wallet), split into
separate cases so each has a single observable pass/fail. Wallet aliases are defined in
`../TEST_WALLETS.md`. Shared defaults: `../_defaults.yaml`.

---
id: smart-wallet-flashblocks-predelegated-fast-confirm
title: Swap with a pre-delegated wallet shows fast confirmation on Flashblocks chains
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "Testlio wallet CSV case '[FlashBlocks] Swap With Pre Delegated Wallet' (fast-confirmation leg). A numeric confirmation-time threshold still needs to be agreed with the pod; until then the observable criterion is fast-confirmation success shown before the canonical block receipt."
testlioRef: "[FlashBlocks] Swap With Pre Delegated Wallet"
# scope
chains:
  - base
  - unichain
platforms:
  - mobile
labels:
  - regression
  - smart-wallet
  - delegation
  - flashblocks
wallets:
  - TW-SMARTWALLET-03
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/smartWallet/
  - packages/uniswap/src/features/smartWallet/delegation/
automationRefs: []
---

> **high · e2e · release · gap** · chains: base, unichain

**Given** test wallet TW-SMARTWALLET-03 is already delegated and funded on a Flashblocks chain (Base or Unichain)
**When** the user swaps ETH → USDC on that chain and confirms
**Then** the swap succeeds and the confirmation UI reaches the success state via the Flashblocks fast-confirmation path — before the canonical block receipt is observable on a block explorer — with no re-delegation included in the transaction

---
id: smart-wallet-flashblocks-non-flashblocks-baseline
title: Same pre-delegated swap on a non-Flashblocks chain completes via standard confirmation
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Baseline leg of the Testlio wallet CSV case '[FlashBlocks] Swap With Pre Delegated Wallet' (repeat on Arbitrum/Optimism), split out so the comparison has its own pass/fail."
testlioRef: "[FlashBlocks] Swap With Pre Delegated Wallet"
# scope
chains:
  - arbitrum
  - optimism
platforms:
  - mobile
labels:
  - regression
  - smart-wallet
  - delegation
  - flashblocks
wallets:
  - TW-SMARTWALLET-05
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/smartWallet/
  - packages/uniswap/src/features/smartWallet/delegation/
automationRefs: []
---

> **medium · e2e · release · gap** · chains: arbitrum, optimism

**Given** test wallet TW-SMARTWALLET-05 is already delegated and funded on a non-Flashblocks chain (Arbitrum or Optimism)
**When** the user swaps ETH → USDC on that chain and confirms
**Then** the swap completes successfully through the standard confirmation path (no fast-confirmation state is shown), with no re-delegation included in the transaction

---
id: smart-wallet-flashblocks-non-delegated-baseline
title: Swap with a non-delegated wallet on a Flashblocks chain still completes
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Baseline leg of the Testlio wallet CSV case '[FlashBlocks] Swap With Pre Delegated Wallet' (non-delegated comparison), split out so the comparison has its own pass/fail."
testlioRef: "[FlashBlocks] Swap With Pre Delegated Wallet"
# scope
chains:
  - base
  - unichain
platforms:
  - mobile
labels:
  - regression
  - smart-wallet
  - delegation
  - flashblocks
wallets:
  - TW-SMARTWALLET-06
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/smartWallet/
  - packages/uniswap/src/features/smartWallet/delegation/
automationRefs: []
---

> **medium · e2e · release · gap** · chains: base, unichain

**Given** test wallet TW-SMARTWALLET-06 (funded on Base/Unichain, not delegated) is set up in the mobile app
**When** the user swaps ETH → USDC on the Flashblocks chain and confirms
**Then** the swap completes successfully (with the delegation banner shown if first-time activation applies), demonstrating that Flashblocks fast confirmation is an enhancement and non-delegated wallets are not broken on those chains
