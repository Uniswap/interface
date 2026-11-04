# Swap Chains scenarios — Established EVM chains

Per-chain swap smoke matrix for the well-established EVM chains. Each case exercises the
same core swap flow (select chain via the token-selector network filter → pick a token on
that chain → enter amount → quote → review → confirm → balances update) on one chain, to
catch chain-specific regressions (RPC, token lists, gas, network badge/toast). Canonical
token pairs are the chain's native gas token → its stablecoin as configured in
`packages/uniswap/src/features/chains/evm/info/<chain>.ts`. Shared defaults:
`_defaults.yaml`. Wallet aliases are symbolic — see `_defaults.yaml` (never a mnemonic).

---
id: swap-chains-ethereum-swap-smoke
title: Swap on Ethereum mainnet completes and updates balances
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
sourceNote: >-
  (a) apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts — Swap > "should swap ETH to
  USDC" (web, anvil mainnet fork) and apps/mobile/.maestro/flows/swap/swap-base.yaml
  (declared FLOW_NAME "swap", mobile); (b) Testlio web "Swap's task - Ethereum Chain".
testlioRef: Swap's task - Ethereum Chain
# scope
protocol_version: all
chains:
  - ethereum
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
runFrequency: scheduled
# coverage
code_paths:
  - packages/uniswap/src/features/chains/
  - apps/web/src/pages/Swap/
  - packages/uniswap/src/features/transactions/swap/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts
    testName: Swap > should swap ETH to USDC
  - path: apps/mobile/.maestro/flows/swap/swap-base.yaml
    testName: swap
---

> **urgent · all · e2e · scheduled · automated** · chains: ethereum

**Given** test wallet `TW-SWAPCHAINS-01` (funded ETH + USDC on Ethereum mainnet) is connected
**And** the Swap screen is open with Ethereum selected in the token-selector network filter
**When** the user selects ETH as input and USDC as output, enters a valid input amount, taps Review, then confirms the swap
**Then** a quote is fetched, the transaction submits and confirms on-chain, the "Swapped" notification appears, and the ETH balance decreases while the USDC balance increases by the quoted amount

---
id: swap-chains-polygon-swap-smoke
title: Swap on Polygon completes and updates balances
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Polygon Swap" (plus "Polygon Swap - Extension") and web
  "Swap's task - Polygon Chain". Canonical pair POL -> USDC per
  packages/uniswap/src/features/chains/evm/info/polygon.ts.
testlioRef: Polygon Swap
# scope
protocol_version: all
chains:
  - polygon
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

> **high · all · e2e · release · gap** · chains: polygon

**Given** test wallet `TW-SWAPCHAINS-01` (funded POL + USDC on Polygon) is connected
**And** the Swap screen is open
**When** the user opens the token selector, selects Polygon in the network filter, picks POL as input and USDC as output, enters an amount, and confirms in Review
**Then** every token in the selector shows the Polygon network badge, a quote is fetched, the swap confirms on-chain, and POL decreases while USDC increases by the corresponding amount

---
id: swap-chains-optimism-swap-smoke
title: Swap on Optimism completes and updates balances
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Optimism Swap" (plus "Optimism Swap - Extension") and web
  "Swap's task - Optimism Chain". Canonical pair ETH -> USDC per
  packages/uniswap/src/features/chains/evm/info/optimism.ts.
testlioRef: Optimism Swap
# scope
protocol_version: all
chains:
  - optimism
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

> **high · all · e2e · release · gap** · chains: optimism

**Given** test wallet `TW-SWAPCHAINS-01` (funded ETH + USDC on Optimism) is connected
**When** the user selects Optimism in the network filter, picks ETH as input and USDC as output, enters an amount, and confirms in Review
**Then** the swap confirms on-chain and both balances update by the quoted amounts, with the Optimism network badge shown on token logos

---
id: swap-chains-arbitrum-swap-smoke
title: Swap on Arbitrum One completes and updates balances
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Arbitrum Swap" (plus "Arbitrum Swap - Extension") and web
  "Swap's task - Arbitrum Chain". Canonical pair ETH -> USDC per
  packages/uniswap/src/features/chains/evm/info/arbitrum.ts.
testlioRef: Arbitrum Swap
# scope
protocol_version: all
chains:
  - arbitrum
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

> **high · all · e2e · release · gap** · chains: arbitrum

**Given** test wallet `TW-SWAPCHAINS-01` (funded ETH + USDC on Arbitrum One) is connected
**When** the user selects Arbitrum in the network filter, picks ETH as input and USDC as output, enters an amount, and confirms in Review
**Then** a quote is fetched, the swap confirms on-chain, and both balances update by the quoted amounts

---
id: swap-chains-base-swap-smoke
title: Swap on Base completes and updates balances
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Base Swap" (plus "Base Swap - Extension") and web
  "Swap's task - Base Chain"; (c) Base is an ALL_APPS EVM chain in chainAppSupport.
  Canonical pair ETH -> USDC per packages/uniswap/src/features/chains/evm/info/base.ts.
testlioRef: Base Swap
# scope
protocol_version: all
chains:
  - base
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

> **high · all · e2e · release · gap** · chains: base

**Given** test wallet `TW-SWAPCHAINS-01` (funded ETH + USDC on Base) is connected
**When** the user selects Base in the network filter, picks ETH as input and USDC as output, enters an amount, and confirms in Review
**Then** a quote is fetched, the swap confirms on-chain, and both balances update by the quoted amounts

---
id: swap-chains-bnb-swap-smoke
title: Swap on BNB Chain completes and updates balances
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "BNB Swap" (plus "BNB Swap - Extension") and web
  "Swap's task - BNB Chain". Canonical pair BNB -> USDC per
  packages/uniswap/src/features/chains/evm/info/bnb.ts (USDC on BNB has
  non-default 18 decimals — a chain-specific regression surface).
testlioRef: BNB Swap
# scope
protocol_version: all
chains:
  - bnb
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

> **high · all · e2e · release · gap** · chains: bnb

**Given** test wallet `TW-SWAPCHAINS-01` (funded BNB + USDC on BNB Chain) is connected
**When** the user selects BNB Chain in the network filter, picks BNB as input and USDC as output, enters an amount, and confirms in Review
**Then** a quote is fetched, the swap confirms on-chain, and both balances update by the quoted amounts (USDC amount formatted correctly despite its 18-decimal BNB variant)

---
id: swap-chains-avalanche-swap-smoke
title: Swap on Avalanche completes and updates balances
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Avax Swap" (plus "Avax Swap - Extension") and web
  "Swap's task - Avalanche Chain". Canonical pair AVAX -> USDC per
  packages/uniswap/src/features/chains/evm/info/avalanche.ts.
testlioRef: Avax Swap
# scope
protocol_version: all
chains:
  - avalanche
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

> **high · all · e2e · release · gap** · chains: avalanche

**Given** test wallet `TW-SWAPCHAINS-01` (funded AVAX + USDC on Avalanche) is connected
**When** the user selects Avalanche in the network filter, picks AVAX as input and USDC as output, enters an amount, and confirms in Review
**Then** a quote is fetched, the swap confirms on-chain, and both balances update by the quoted amounts

---
id: swap-chains-celo-swap-smoke
title: Swap on Celo completes and updates balances
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Celo Swap" (plus "Celo Swap - Extension") and web
  "Swap's task - Celo Chain". Canonical pair CELO -> USDC per
  packages/uniswap/src/features/chains/evm/info/celo.ts.
testlioRef: Celo Swap
# scope
protocol_version: all
chains:
  - celo
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

> **medium · all · e2e · release · gap** · chains: celo

**Given** test wallet `TW-SWAPCHAINS-01` (funded CELO + USDC on Celo) is connected
**When** the user selects Celo in the network filter, picks CELO as input and USDC as output, enters an amount, and confirms in Review
**Then** a quote is fetched, the swap confirms on-chain, and both balances update by the quoted amounts

---
id: swap-chains-zora-swap-smoke
title: Swap on Zora completes and updates balances
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Zora Swap" (plus "Zora Swap - Extension") and web
  "Swap's task - Zora Chain". Canonical pair ETH -> USDC per
  packages/uniswap/src/features/chains/evm/info/zora.ts.
testlioRef: Zora Swap
# scope
protocol_version: all
chains:
  - zora
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

> **medium · all · e2e · release · gap** · chains: zora

**Given** test wallet `TW-SWAPCHAINS-01` (funded ETH + USDC on Zora) is connected
**When** the user selects Zora in the network filter, picks ETH as input and USDC as output, enters an amount, and confirms in Review
**Then** a quote is fetched, the swap confirms on-chain, and both balances update by the quoted amounts

---
id: swap-chains-zksync-swap-smoke
title: Swap on ZKsync completes and updates balances
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "Zksync Swap" (plus "Zksync Swap - Extension") and web
  "Swap's task - ZKsync Chain". Canonical pair ETH -> USDC per
  packages/uniswap/src/features/chains/evm/info/zksync.ts.
testlioRef: Zksync Swap
# scope
protocol_version: all
chains:
  - zksync
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

> **medium · all · e2e · release · gap** · chains: zksync

**Given** test wallet `TW-SWAPCHAINS-01` (funded ETH + USDC on ZKsync Era) is connected
**When** the user selects ZKsync in the network filter, picks ETH as input and USDC as output, enters an amount, and confirms in Review
**Then** a quote is fetched, the swap confirms on-chain (ZKsync-native account abstraction handled), and both balances update by the quoted amounts

---
id: swap-chains-worldchain-swap-smoke
title: Swap on World Chain completes and updates balances
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  (b) Testlio wallet "WorldChain - Swap" and web "Swap's task - WorldChain Chain".
  Canonical pair ETH -> USDC per
  packages/uniswap/src/features/chains/evm/info/worldchain.ts (ETH is World Chain's
  native gas token).
testlioRef: WorldChain - Swap
# scope
protocol_version: all
chains:
  - worldchain
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

> **medium · all · e2e · release · gap** · chains: worldchain

**Given** test wallet `TW-SWAPCHAINS-01` (funded ETH + USDC on World Chain) is connected
**When** the user selects World Chain in the network filter, picks ETH as input and USDC as output, enters an amount, and confirms in Review
**Then** a quote is fetched, the swap confirms on-chain, and both balances update by the quoted amounts

---
id: swap-chains-chain-info-rpc-resolution
title: RPC endpoint resolution handles every supported chain
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: >-
  (a) packages/uniswap/src/features/chains/chainInfo.test.ts — "getQuicknodeEndpointUrl >
  handles all supported chains without throwing" (plus the getUniRpcEndpointUrl
  describe in the same file).
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - chains
  - config
  - rpc
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/chains/chainInfo.ts
automationRefs:
  - path: packages/uniswap/src/features/chains/chainInfo.test.ts
    testName: getQuicknodeEndpointUrl > handles all supported chains without throwing
---

> **medium · all · unit · pr-check · automated** · chains: ethereum

**Given** the full list of supported chain ids (Mainnet, Arbitrum, Avalanche, Base, Bnb, Celo, Linea, Monad, XLayer, Optimism, Polygon, WorldChain, Zksync, Zora, testnets)
**When** `getQuicknodeEndpointUrl` / `getUniRpcEndpointUrl` build the RPC URL for each chain
**Then** a valid endpoint URL is produced for every supported chain and unsupported chains throw — preventing a chain from shipping with a broken RPC route
