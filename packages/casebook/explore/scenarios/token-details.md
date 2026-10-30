# Explore scenarios — Token Detail Page (TDP)

Token Detail Page content rendering, testnet/mainnet mode handling, not-found
redirects, the inline TDP swap widget, and responsive layout. Shared defaults:
`_defaults.yaml`. Read-only unless noted; wallet-dependent cases reference the
symbolic aliases defined in `_defaults.yaml` (TW-EXPLORE-NN).

---
id: explore-tdp-general-content
title: TDP renders full token content (chart, stats, warnings)
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: "(a) web e2e apps/web/src/pages/TokenDetails/TokenDetails.e2e.test.ts (warning + low-volume token fully populated); (b) Testlio Wallet 'Token Details - General - iOS/Android'"
testlioRef: Token Details - General - iOS/Android
# scope
chains:
  - ethereum
platforms:
  - web
  - mobile
labels:
  - regression
  - tdp
  - smoke
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/TokenDetails/
  - apps/web/src/pages/TokenDetails/components/
  - apps/mobile/src/screens/TokenDetailsScreen/
  - packages/uniswap/src/features/tokens/
automationRefs:
  - path: apps/web/src/pages/TokenDetails/TokenDetails.e2e.test.ts
    testName: Token Details > token with warning and low trading volume should have all information populated
---

> **high · e2e · scheduled · automated** · chains: ethereum

**Given** the user opens a Token Detail Page for an ERC-20 token
**When** the page loads
**Then** the price chart, current USD price and % change, stats (volume, market cap, TVL), links, and any safety warning banner are all rendered and populated

---
id: explore-tdp-testnet-mainnet-modes
title: TDP loads correct token data across testnet/mainnet modes
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) web e2e apps/web/src/pages/TokenDetails/TokenDetails.e2e.test.ts (disconnected/connected x mainnet/testnet mode matrix)"
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - tdp
  - testnet
  - edge-case
wallets:
  - TW-EXPLORE-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/TokenDetails/
  - apps/web/src/pages/TokenDetails/context/
  - packages/uniswap/src/features/settings/
automationRefs:
  - path: apps/web/src/pages/TokenDetails/TokenDetails.e2e.test.ts
    testName: Token Details > disconnected wallet on mainnet mode should load mainnet token details
  - path: apps/web/src/pages/TokenDetails/TokenDetails.e2e.test.ts
    testName: Token Details > connected wallet on mainnet mode should load testnet token details
  - path: apps/web/src/pages/TokenDetails/TokenDetails.e2e.test.ts
    testName: Token Details > connected wallet on testnet mode should load mainnet token details
---

> **medium · e2e · release · automated** · chains: ethereum

**Given** the user views a TDP with test wallet TW-EXPLORE-01 connected (or no wallet connected) and testnet mode on/off
**When** the page resolves the token for the active mode
**Then** the correct mainnet or testnet token details load consistently with the connection and testnet-mode state

---
id: explore-tdp-redirect-unknown-or-gated
title: TDP redirects to Explore for unknown token or feature-gated chain
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) web e2e apps/web/src/pages/TokenDetails/TokenDetails.e2e.test.ts (not-found + feature-gated chain redirects)"
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - tdp
  - navigation
  - edge-case
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/TokenDetails/
  - apps/web/src/pages/Explore/redirects.tsx
automationRefs:
  - path: apps/web/src/pages/TokenDetails/TokenDetails.e2e.test.ts
    testName: Token Details > redirect to explore if token is not found
  - path: apps/web/src/pages/TokenDetails/TokenDetails.e2e.test.ts
    testName: Token Details > redirect to explore for a feature-gated chain (Arc)
---

> **medium · e2e · release · automated** · chains: ethereum

**Given** the user navigates to a TDP for a nonexistent token or a chain gated behind a disabled feature flag (e.g., Arc)
**When** the page attempts to resolve the token
**Then** the user is redirected to the Explore page instead of seeing an error

---
id: explore-tdp-inline-swap-widget
title: Inline TDP swap widget quotes and stays isolated from main swap
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: "(a) web e2e apps/web/src/pages/TokenDetails/components/TokenDetailsSwap.e2e.test.ts (output/input handling + state isolation from /swap)"
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - tdp
  - swap
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/TokenDetails/components/
  - packages/uniswap/src/features/transactions/swap/
automationRefs:
  - path: apps/web/src/pages/TokenDetails/components/TokenDetailsSwap.e2e.test.ts
    testName: TokenDetailsSwap > should have the expected output for a tokens detail page
  - path: apps/web/src/pages/TokenDetails/components/TokenDetailsSwap.e2e.test.ts
    testName: TokenDetailsSwap > swap input > should handle amount into input
  - path: apps/web/src/pages/TokenDetails/components/TokenDetailsSwap.e2e.test.ts
    testName: TokenDetailsSwap > swap output > should handle amount into input
  - path: apps/web/src/pages/TokenDetails/components/TokenDetailsSwap.e2e.test.ts
    testName: TokenDetailsSwap > should not share swap state with the main swap page
---

> **high · e2e · scheduled · automated** · chains: ethereum

**Given** the user is on a TDP with the inline swap widget visible
**When** they enter an input (or output) amount with the TDP token pre-selected
**Then** the widget quotes the trade, and its swap state is isolated from the main `/swap` page state (edits on one do not leak into the other)

---
id: explore-tdp-navigate-correct-tokens
title: Navigating to TDP pre-selects the correct swap tokens
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) was web e2e TokenDetailsSwap.e2e.test.ts (auto-navigation + token pre-selection); that behavior changed on main — TDP swap selection now keeps the page token in the pair instead of navigating — so the e2e refs were removed. Explore team: re-validate this case against current behavior."
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - tdp
  - navigation
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/TokenDetails/components/
automationRefs: []
---

> **medium · e2e · release · automated** · chains: ethereum

**Given** the user selects a token from the TDP swap widget
**When** navigation to the new TDP occurs
**Then** the destination TDP loads with the correct token as output and the paired token retained as input

---
id: explore-tdp-responsive-layout
title: TDP renders correct heading structure on small screens
# importance
priority: low
severity: low
# provenance
source: existing-e2e
sourceNote: "(a) web e2e apps/web/src/pages/TokenDetails/components/TokenDetails.e2e.test.ts (h1 count at small viewport)"
# scope
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - tdp
  - responsive
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/TokenDetails/components/
automationRefs:
  - path: apps/web/src/pages/TokenDetails/components/TokenDetails.e2e.test.ts
    testName: Token details > should have exactly 2 h1 tags on smaller screen size
---

> **low · e2e · release · automated** · chains: ethereum

**Given** the user opens a TDP at a small (mobile) viewport width
**When** the page renders
**Then** exactly two `h1` headings are present (correct responsive layout / no duplicated or missing headings)
