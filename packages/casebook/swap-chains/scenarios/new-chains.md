# Swap Chains scenarios — Newer & rollout chains

Per-chain swap smoke for chains added more recently or gated behind chain-enablement
feature flags. Same core flow as `established-chains.md`; these are separated because they
are newer, often feature-flagged, and enter/exit the enabled-chain set as rollout
progresses. Canonical token pairs are grounded in
`packages/uniswap/src/features/chains/evm/info/<chain>.ts`. Shared defaults:
`_defaults.yaml`. Wallet aliases are symbolic (never a mnemonic).

---
id: swap-chains-unichain-swap-smoke
title: Swap on Unichain completes and updates balances
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Unichain - iOS/Android" (plus "Unichain Swap - Extension") and
  web "Swap's task - Unichain Chain". Canonical pair ETH -> DAI per
  packages/uniswap/src/features/chains/evm/info/unichain.ts (the Testlio case pastes
  the token address, exercising per-chain address resolution).
testlioRef: Unichain - iOS/Android
# scope
protocol_version: all
chains:
  - unichain
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - smoke
  - per-chain
wallets:
  - TW-SWAPCHAINS-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/chains/
  - apps/web/src/pages/Swap/
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: unichain

**Given** test wallet `TW-SWAPCHAINS-01` (funded ETH on Unichain) is connected
**And** the Swap screen is open
**When** the user selects Unichain in the network filter, chooses Unichain ETH as input, pastes/selects DAI as output — accepting the first-time "Always do your research" token warning — enters an amount, and confirms in Review
**Then** the pasted token resolves with the Unichain network logo, a quote is fetched for both fields, the swap confirms on-chain, and balances update by the quoted amounts

---
id: swap-chains-soneium-swap-smoke
title: Swap on Soneium completes and updates balances
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Soneium - iOS/Android" (plus "Soneium Swap - Extension") and
  web "Swap's task - Soneium Chain". Canonical pair ETH -> USDCE per
  packages/uniswap/src/features/chains/evm/info/soneium.ts (Soneium's bridged USDC
  carries the non-standard symbol USDCE — a chain-specific display surface).
testlioRef: Soneium - iOS/Android
# scope
protocol_version: all
chains:
  - soneium
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - smoke
  - per-chain
wallets:
  - TW-SWAPCHAINS-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/chains/
  - apps/web/src/pages/Swap/
automationRefs: []
---

> **medium · all · e2e · release · gap** · chains: soneium

**Given** test wallet `TW-SWAPCHAINS-01` (funded ETH + USDCE on Soneium) is connected
**When** the user selects Soneium in the network filter, picks ETH as input and USDCE (Soneium bridged USDC) as output, enters an amount, and confirms in Review
**Then** a quote is fetched, the swap confirms on-chain, and both balances update by the quoted amounts

---
id: swap-chains-monad-swap-smoke
title: Swap on Monad completes and updates balances
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Monad Chain - Android/iOS" and web "Monad Chain"; (c) Monad is a
  feature-flag-gated chain in chainFeatureFlags.ts. Canonical pair MON -> USDC per
  packages/uniswap/src/features/chains/evm/info/monad.ts. Flag-off visibility (Monad
  hidden from the network list) is covered at unit level by
  swap-chains-enabled-chains-resolution.
testlioRef: Monad Chain - Android/iOS
# scope
protocol_version: all
chains:
  - monad
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - smoke
  - per-chain
  - rollout
wallets:
  - TW-SWAPCHAINS-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/chains/
  - packages/uniswap/src/features/chains/chainFeatureFlags.ts
  - apps/web/src/pages/Swap/
automationRefs: []
---

> **medium · all · e2e · release · gap** · chains: monad

**Given** test wallet `TW-SWAPCHAINS-01` (funded MON + USDC on Monad) is connected
**And** the Monad chain-enablement feature flag is on
**When** the user selects Monad in the network filter, picks MON as input and USDC as output, enters an amount, and confirms in Review
**Then** a quote is fetched, the swap confirms on-chain, and both balances update by the quoted amounts

---
id: swap-chains-megaeth-swap-smoke
title: Swap on MegaETH completes and updates balances
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "MegaETH Swap - Extension/iOS/Android" and web "MegaETH chain";
  (c) MegaETH is a feature-flag-gated chain in chainFeatureFlags.ts. Canonical pair
  ETH -> USDM per packages/uniswap/src/features/chains/evm/info/megaeth.ts (USDM is
  MegaETH's configured primary stablecoin).
testlioRef: MegaETH Swap - Extension/iOS/Android
# scope
protocol_version: all
chains:
  - megaeth
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - smoke
  - per-chain
  - rollout
wallets:
  - TW-SWAPCHAINS-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/chains/
  - packages/uniswap/src/features/chains/chainFeatureFlags.ts
  - apps/web/src/pages/Swap/
automationRefs: []
---

> **medium · all · e2e · release · gap** · chains: megaeth

**Given** test wallet `TW-SWAPCHAINS-01` (funded ETH + USDM on MegaETH) is connected
**When** the user selects MegaETH in the network filter, picks ETH as input and USDM as output, enters an amount, and confirms in Review
**Then** a quote is fetched, the swap confirms on-chain, and both balances update by the quoted amounts

---
id: swap-chains-linea-swap-smoke
title: Swap on Linea completes and updates balances
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Linea" and web "Linea Chain"; (c) Linea is a supported chain in
  chainInfo RPC resolution. Canonical pair ETH -> USDC per
  packages/uniswap/src/features/chains/evm/info/linea.ts.
testlioRef: Linea
# scope
protocol_version: all
chains:
  - linea
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - smoke
  - per-chain
  - rollout
wallets:
  - TW-SWAPCHAINS-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/chains/
  - apps/web/src/pages/Swap/
automationRefs: []
---

> **medium · all · e2e · release · gap** · chains: linea

**Given** test wallet `TW-SWAPCHAINS-01` (funded ETH + USDC on Linea) is connected
**When** the user selects Linea in the network filter, picks ETH as input and USDC as output, enters an amount, and confirms in Review
**Then** a quote is fetched, the swap confirms on-chain, and both balances update by the quoted amounts

---
id: swap-chains-xlayer-swap-smoke
title: Swap on X Layer completes and updates balances
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  (b) Testlio "X-layer" (listed in both the web and wallet exports); (c) XLayer is a
  supported chain in chainInfo. Canonical pair OKB -> USDT0 per
  packages/uniswap/src/features/chains/evm/info/xlayer.ts (OKB is X Layer's native
  gas token; USDT0 is its configured stablecoin).
testlioRef: X-layer
# scope
protocol_version: all
chains:
  - xlayer
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - smoke
  - per-chain
  - rollout
wallets:
  - TW-SWAPCHAINS-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/chains/
  - apps/web/src/pages/Swap/
automationRefs: []
---

> **medium · all · e2e · release · gap** · chains: xlayer

**Given** test wallet `TW-SWAPCHAINS-01` (funded OKB + USDT0 on X Layer) is connected
**When** the user selects X Layer in the network filter, picks OKB as input and USDT0 as output, enters an amount, and confirms in Review
**Then** a quote is fetched, the swap confirms on-chain, and both balances update by the quoted amounts

---
id: swap-chains-tempo-swap-smoke
title: Swap on Tempo completes and updates balances
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Tempo" and web "Tempo Chain"; (c) Tempo is a
  feature-flag-gated chain in chainFeatureFlags.ts. Canonical pair pathUSD -> USDC.e
  per packages/uniswap/src/features/chains/evm/info/tempo.ts (Tempo has no native gas
  token — gas is paid in pathUSD, a chain-specific regression surface).
testlioRef: Tempo
# scope
protocol_version: all
chains:
  - tempo
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - smoke
  - per-chain
  - rollout
wallets:
  - TW-SWAPCHAINS-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/chains/
  - packages/uniswap/src/features/chains/chainFeatureFlags.ts
  - apps/web/src/pages/Swap/
automationRefs: []
---

> **medium · all · e2e · release · gap** · chains: tempo

**Given** test wallet `TW-SWAPCHAINS-01` (funded pathUSD on Tempo — pathUSD also pays gas on this chain) is connected
**And** the Tempo chain-enablement feature flag is on
**When** the user selects Tempo in the network filter, picks pathUSD as input and USDC.e as output, enters an amount, and confirms in Review
**Then** a quote is fetched, gas is charged in pathUSD, the swap confirms on-chain, and both balances update by the quoted amounts

---
id: swap-chains-robinhood-swap-smoke
title: Swap on Robinhood Chain completes and updates balances
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  (b) Testlio web "Robinhood chain" (web only — no wallet-app case exists in the
  blueprint). Canonical pair ETH -> USDG per
  packages/uniswap/src/features/chains/evm/info/robinhood.ts (USDG is Robinhood
  Chain's configured primary stablecoin).
testlioRef: Robinhood chain
# scope
protocol_version: all
chains:
  - robinhood
platforms:
  - web
labels:
  - regression
  - swap
  - smoke
  - per-chain
  - rollout
wallets:
  - TW-SWAPCHAINS-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/chains/
  - apps/web/src/pages/Swap/
automationRefs: []
---

> **medium · all · e2e · release · gap** · chains: robinhood

**Given** test wallet `TW-SWAPCHAINS-01` (funded ETH + USDG on Robinhood Chain) is connected on web
**When** the user selects Robinhood Chain in the network filter, picks ETH as input and USDG as output, enters an amount, and confirms in Review
**Then** a quote is fetched, the swap confirms on-chain, and both balances update by the quoted amounts
