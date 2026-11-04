# Bridging scenarios — Same-token bridge

Same-token / native bridge (ETH on chain A -> ETH on chain B) driven from the swap form's
output token selector, plus the bridging sections and cross-chain promo surfaced in that
selector. Shared defaults: `_defaults.yaml`. Wallet aliases: see `_defaults.yaml`.

---
id: bridging-eth-to-l2-happy-path
title: Bridge native ETH from mainnet to an L2 completes and updates balances
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
sourceNote: >-
  (a) apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts — Swap > "should bridge from
  ETH to L2"; (b) Testlio wallet "Bridging - ETH to ETH Arbitrum"; Testlio web
  "Bridging General" (the general web bridge walkthrough is subsumed by this case's
  steps — kept here rather than as a separate case).
testlioRef: Bridging - ETH to ETH Arbitrum
# scope
protocol_version: all
chains:
  - ethereum
  - arbitrum
  - optimism
  - base
  - zora
  - zksync
  - unichain
  - soneium
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - bridging
  - smoke
wallets:
  - TW-BRIDGING-01
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - packages/uniswap/src/features/bridging/
  - packages/uniswap/src/features/transactions/swap/plan/
  - apps/web/src/pages/Swap/Swap/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts
    testName: Swap > should bridge from ETH to L2
---

> **urgent · all · e2e · scheduled · automated** · chains: ethereum, arbitrum, optimism, base, zora, zksync, unichain, soneium

**Given** test wallet TW-BRIDGING-01 (native ETH on mainnet) is connected on `/swap?inputCurrency=ETH`
**And** the `/swappable_tokens` prefetch for the input chain has resolved so the ETH(mainnet)->ETH(L2) pair is recognized as a bridge pair
**When** the user opens the output token selector, selects ETH on a destination L2 (e.g. Base), enters an input amount, clicks "Review", confirms, and taps "Swap"
**Then** the output field shows the destination-chain network logo, a bridge quote is fetched for both fields, the transaction submits and confirms, the "Swapped" activity popup appears, and the source-chain ETH balance decreases while the destination-chain ETH balance increases

---
id: bridging-eth-l2-to-l2-hops
title: Bridge native ETH between two L2s (L2 -> L2 direction)
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet L2-pair suite: "Bridging - ETH Arbitrum to Optimism",
  "Bridging - ETH Optimism to Base", "Bridging - ETH Zora to Zksynch" (blueprint titles
  verbatim, incl. the "Zksynch" spelling); the Base->Blast and Blast->Zora blueprints
  retired with the Blast chain. One representative title is used as the
  testlioRef; each listed chain pair must be exercised. L2-source direction differs
  from the mainnet-source happy path (L2 gas-token economics, chain-switch UX).
testlioRef: Bridging - ETH Arbitrum to Optimism
# scope
protocol_version: all
chains:
  - arbitrum
  - optimism
  - base
  - zora
  - zksync
platforms:
  - mobile
labels:
  - regression
  - bridging
  - l2
wallets:
  - TW-BRIDGING-01
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/bridging/
  - packages/uniswap/src/features/transactions/swap/plan/
automationRefs: []
---

> **high · all · e2e · release · manual** · chains: arbitrum, optimism, base, zora, zksync

**Given** test wallet TW-BRIDGING-01 holds native ETH plus gas on the source L2 (e.g. Arbitrum)
**When** the user selects ETH on the source L2 as input, opens the output token selector, selects ETH on the next L2 in the pair chain (Arbitrum->Optimism, Optimism->Base, Base->Zora, Zora->zkSync), enters an amount, reviews, and confirms
**Then** a bridge quote is fetched with the L2 gas token accounted for, the bridge submits and confirms, the destination-L2 ETH balance increases while the source-L2 balance decreases, and the activity entry shows the correct source->destination chain pair

---
id: bridging-xlayer-bridge
title: Bridge ETH to X Layer from the swap form
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  (b) Testlio web "X-layer" — bridge portion only (the blueprint lists this source as
  "X-layer (bridge portion)"; the rest of that Testlio case is out of this area's
  scope). X Layer chain support exists in
  packages/uniswap/src/features/chains/evm/info/xlayer.ts.
testlioRef: X-layer
# scope
protocol_version: all
chains:
  - ethereum
  - xlayer
platforms:
  - web
labels:
  - regression
  - bridging
  - chain-support
wallets:
  - TW-BRIDGING-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/bridging/
  - packages/uniswap/src/features/chains/evm/info/xlayer.ts
  - apps/web/src/pages/Swap/Swap/
automationRefs: []
---

> **medium · all · e2e · release · gap** · chains: ethereum, xlayer

**Given** test wallet TW-BRIDGING-01 is connected on `/swap` with native ETH selected as input
**When** the user opens the output token selector, filters to the X Layer network, selects the bridgeable output token on X Layer, enters an amount, reviews, and confirms
**Then** X Layer is offered as a bridge destination in the selector, a bridge quote is fetched, the bridge submits and confirms, and the X Layer balance increases in the portfolio view

---
id: bridging-token-selector-bridging-section
title: Output/input token selector surfaces a bridging tokens section when empty
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: >-
  (a) apps/web/src/pages/Swap/Swap/TokenSelector.e2e.test.ts — "output - should show
  bridging and top tokens sections if empty" and "input - should show bridging and top
  tokens sections if empty". Web Playwright only, so this case is scoped to web.
# scope
protocol_version: all
chains:
  - ethereum
  - arbitrum
  - optimism
  - base
  - unichain
platforms:
  - web
labels:
  - regression
  - bridging
  - token-selector
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - packages/uniswap/src/features/bridging/hooks/
  - apps/web/src/pages/Swap/Swap/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/TokenSelector.e2e.test.ts
    testName: TokenSelector > output - should show bridging and top tokens sections if empty
  - path: apps/web/src/pages/Swap/Swap/TokenSelector.e2e.test.ts
    testName: TokenSelector > input - should show bridging and top tokens sections if empty
---

> **medium · all · e2e · scheduled · automated** · chains: ethereum, arbitrum, optimism, base, unichain

**Given** the user is on the swap form with an input token selected and no output token chosen
**When** they open the output (or input) token selector with an empty search field
**Then** a "Bridging tokens" section header is rendered alongside the top-tokens section, listing the tokens bridgeable from the selected input chain

---
id: bridging-crosschain-promo-banner-visibility
title: Cross-chain swaps promo banner shows only in the enabled bridge context
# importance
priority: low
severity: low
# provenance
source: existing-e2e
sourceNote: >-
  (a) apps/web/src/pages/Swap/Swap/TokenSelector.e2e.test.ts — promo banner tests
  (output shows when chained-actions flag enabled; hidden in limit flow; hidden when
  filtered to unsupported chain).
# scope
protocol_version: all
chains:
  - ethereum
  - arbitrum
  - base
  - unichain
platforms:
  - web
labels:
  - regression
  - bridging
  - token-selector
  - feature-flag
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/bridging/
  - apps/web/src/pages/Swap/Swap/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/TokenSelector.e2e.test.ts
    testName: TokenSelector > output - should show crosschain swaps promo banner when chained actions flag is enabled
  - path: apps/web/src/pages/Swap/Swap/TokenSelector.e2e.test.ts
    testName: TokenSelector > limit - should NOT show crosschain swaps promo banner in limit order flow
  - path: apps/web/src/pages/Swap/Swap/TokenSelector.e2e.test.ts
    testName: TokenSelector > output - should NOT show crosschain swaps promo banner when filtering to unsupported chain
---

> **low · all · e2e · release · automated** · chains: ethereum, arbitrum, base, unichain

**Given** the `enable_chained_actions` feature flag is enabled
**When** the user opens the output token selector on the swap form
**Then** the "Crosschain swaps are here" promo banner is visible
**And** the banner is NOT shown in the limit-order flow, and NOT shown when the selector is filtered to a chain that does not support cross-chain swaps

---
id: bridging-supported-pairs-only
title: Bridging is offered only across supported token pairs and networks
# importance
priority: medium
severity: high
# provenance
source: uniswap
sourceNote: >-
  (c) packages/uniswap/src/features/bridging/hooks/chains.ts (useIsBridgingChain,
  useBridgingSupportedChainIds) gate bridgeable chains from the /swappable_tokens cache;
  (b) Testlio web "Bridging" precondition "Ensure bridging is only attempted across
  supported token pairs and networks".
testlioRef: Bridging
# scope
protocol_version: all
chains:
  - ethereum
  - arbitrum
  - optimism
  - base
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - bridging
  - validation
  - edge-case
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/bridging/hooks/chains.ts
  - packages/uniswap/src/features/bridging/hooks/tokens.ts
automationRefs: []
---

> **medium · all · unit · pr-check · gap** · chains: ethereum, arbitrum, optimism, base

**Given** the `/swappable_tokens` cache lists the set of bridgeable chains/tokens for the selected input token
**When** `useIsBridgingChain` / `useBridgingSupportedChainIds` are evaluated for a candidate output chain
**Then** only chains present in the swappable set are treated as bridgeable, and an unsupported output-chain/token selection is not offered as a bridge (it is treated as a plain chain switch instead)

---
id: bridging-native-eth-output-not-wrapped
title: Bridging ETH previews native ETH (not WETH) as the output token
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  (b) Testlio web "Bridging" step "Bridge ETH from Ethereum -> Arbitrum. User preview
  clearly shows ETH (not WETH) as the output"; Testlio web "Test Bridging in the UI"
  note "Selecting WETH populates ETH in the target bridging UI instead of WETH".
testlioRef: Test Bridging in the UI
# scope
protocol_version: all
chains:
  - ethereum
  - arbitrum
  - optimism
  - base
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - bridging
  - native-eth
wallets:
  - TW-BRIDGING-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/bridging/
  - apps/web/src/pages/Swap/Swap/
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: ethereum, arbitrum, optimism, base

**Given** test wallet TW-BRIDGING-01 with native ETH selected as input on mainnet
**When** the user selects a destination chain and reviews the bridge (including the case where WETH is chosen)
**Then** the output token displayed in the preview is native ETH on the destination chain (not WETH), consistent with the app's native-token bridge behavior

---
id: bridging-review-quote-refresh-and-accept
title: Bridge review refreshes the quote and gates the swap CTA behind Accept
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Bridging - ETH to ETH Arbitrum" review step: new output after a
  few seconds, swap CTA disabled while a new quote is fetched, Accept button visible,
  Est. time shown when expanded, swap enabled after Accept.
testlioRef: Bridging - ETH to ETH Arbitrum
# scope
protocol_version: all
chains:
  - ethereum
  - arbitrum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - bridging
  - review
wallets:
  - TW-BRIDGING-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/plan/
  - packages/uniswap/src/features/bridging/
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: ethereum, arbitrum

**Given** the user has entered a bridge amount (ETH mainnet -> ETH Arbitrum) and opened the review screen
**When** a refreshed quote arrives while the review is open
**Then** the review shows the updated output amount, the "Swap" CTA is disabled while the new quote is being fetched and an "Accept" button is shown, the estimated bridge time is visible when the details are expanded, and the "Swap" CTA becomes enabled after "Accept" is pressed

---
id: bridging-activity-single-entry-and-balances
title: Completed bridge shows a single activity entry with correct chain labeling and balances
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Bridging - ETH to ETH Arbitrum" activity steps (accurate info,
  ETH->ETH logo/labeling, source balance down / destination balance up) and Testlio web
  "Crosschain swaps" step "Each crosschain swap appears as a single transaction item in
  the activity screen".
testlioRef: Bridging - ETH to ETH Arbitrum
# scope
protocol_version: all
chains:
  - ethereum
  - arbitrum
  - optimism
  - base
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - bridging
  - activity
wallets:
  - TW-BRIDGING-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/plan/
  - packages/uniswap/src/features/bridging/
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: ethereum, arbitrum, optimism, base

**Given** test wallet TW-BRIDGING-01 has completed a bridge (ETH mainnet -> ETH on a destination chain)
**When** the user opens the activity screen and taps the bridge entry
**Then** the bridge appears as a single activity item (not multiple transactions) with the correct ETH->ETH logo and source->destination chain labeling
**And** on the home/portfolio view the destination-chain ETH balance has increased while the mainnet ETH balance has decreased
