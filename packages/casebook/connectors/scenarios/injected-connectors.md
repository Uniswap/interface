# Connectors scenarios — Injected wallets

EIP-6963 injected browser-extension connectors (MetaMask, Rabby, Coinbase extension,
Uniswap extension) and generic wagmi connect/disconnect. Shared defaults: `_defaults.yaml`.

Blueprint Testlio mapping note: the blueprint's `Injected Wallets` suite is subsumed here by
the `Connect Injected Wallets connection with Uniswap` suite mapping — the injected-connect,
disconnect, and wallet-options cases below cover the same injected-wallet connection surface,
so no separate case cites the `Injected Wallets` title.

---
id: connectors-injected-connect
title: Connect an injected browser-extension wallet to Uniswap
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
sourceNote: >-
  Web Playwright e2e "Wallet Connection > should connect wallet"
  (apps/web/src/app/WalletConnection.e2e.test.ts) drives the mock injected connector
  end-to-end. The connector-level unit test "Wagmi connectors > connectWagmiWallet >
  should connect to wagmi wallet successfully"
  (apps/web/src/features/wallet/connection/connectors/wagmi.test.ts) backs the same path
  at unit level (cited here rather than in automationRefs because it is below this case's
  testLevel). Testlio suite: "Connect Injected Wallets connection with Uniswap".
testlioRef: Connect Injected Wallets connection with Uniswap
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - injected
  - smoke
wallets:
  - TW-CONNECTORS-01
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/components/Web3Provider/
  - apps/web/src/features/wallet/connection/connectors/wagmi.ts
  - apps/web/src/features/wallet/connection/hooks/useConnectWallet.ts
  - apps/web/src/components/WalletModal/
automationRefs:
  - path: apps/web/src/app/WalletConnection.e2e.test.ts
    testName: Wallet Connection > should connect wallet
---

> **urgent · e2e · scheduled · automated** · platforms: web

**Given** a disconnected session (`eagerlyConnect=false`) and an injected connector available (mock connector in e2e; MetaMask/Rabby/Coinbase extension manually with test wallet TW-CONNECTORS-01)
**When** the user clicks "Connect Wallet" and selects the injected connector from the wallet modal
**Then** the connect mutation resolves, the wallet modal closes, and the connected address (`test0` in e2e) is shown in the `Web3StatusConnected` element in the nav

---
id: connectors-injected-disconnect
title: Disconnect a connected injected wallet
# importance
priority: high
severity: high
# provenance
source: existing-e2e
sourceNote: >-
  Web Playwright e2e "Wallet Connection > disconnect wallet"
  (apps/web/src/app/WalletConnection.e2e.test.ts) asserts the full drawer-hover-confirm
  disconnect path. Testlio suite: "Connect Injected Wallets connection with Uniswap".
testlioRef: Connect Injected Wallets connection with Uniswap
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - injected
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/components/Web3Provider/
  - apps/web/src/components/AccountDrawer/
  - apps/web/src/features/wallet/connection/
automationRefs:
  - path: apps/web/src/app/WalletConnection.e2e.test.ts
    testName: Wallet Connection > disconnect wallet
---

> **high · e2e · scheduled · automated** · platforms: web

**Given** a connected wallet (address visible in `Web3StatusConnected`)
**When** the user opens the account drawer, hovers the disconnect control, and confirms disconnect in the modal
**Then** the wallet is disconnected and the nav reverts to the `NavConnectWalletButton` "Connect Wallet" state

---
id: connectors-injected-wallet-options-list
title: All supported connectors appear as options in the wallet modal
# importance
priority: high
severity: medium
# provenance
source: testlio
sourceNote: >-
  Testlio suite "Connect Injected Wallets connection with Uniswap" (also subsumes the
  blueprint's "Injected Wallets" suite — see file header). Unit coverage:
  useOrderedWalletConnectors.test.ts ordering tests and
  UniswapWalletOptions.test.tsx extension-detection tests.
testlioRef: Connect Injected Wallets connection with Uniswap
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - injected
  - wallet-modal
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/components/WalletModal/UniswapWalletOptions.tsx
  - apps/web/src/components/WalletModal/StandardWalletModal.tsx
  - apps/web/src/features/wallet/connection/hooks/useOrderedWalletConnectors.ts
automationRefs:
  - path: apps/web/src/features/wallet/connection/hooks/useOrderedWalletConnectors.test.ts
    testName: useOrderedWallets > should return ordered wallets
  - path: apps/web/src/components/WalletModal/UniswapWalletOptions.test.tsx
    testName: UniswapWalletOptions > Extension connecter should be shown if detected
---

> **high · unit · pr-check · automated** · platforms: web

**Given** the user opens the Connect Wallet modal on desktop web
**When** the connector list is rendered
**Then** the expected connectors are offered (MetaMask, Rabby / other EIP-6963 injected, Coinbase Wallet, WalletConnect, and the Uniswap wallet), the Uniswap extension option shows when detected, and a "Download wallet" option shows when the extension is not detected

---
id: connectors-recent-wallet-badge
title: Most-recently-used connector is surfaced first with a "Recent" badge
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  Recent-wallet ordering is part of the Testlio "Connect Injected Wallets connection with
  Uniswap" suite walk. Unit coverage: useOrderedWalletConnectors.test.ts "should place the
  most recent wallet at the top of the list".
testlioRef: Connect Injected Wallets connection with Uniswap
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - injected
  - wallet-modal
# execution
automatable: true
testLevel: unit
runFrequency: release
# coverage
code_paths:
  - apps/web/src/features/wallet/connection/hooks/useOrderedWalletConnectors.ts
  - apps/web/src/state/wallets/
automationRefs:
  - path: apps/web/src/features/wallet/connection/hooks/useOrderedWalletConnectors.test.ts
    testName: useOrderedWallets > should place the most recent wallet at the top of the list
---

> **medium · unit · release · automated** · platforms: web

**Given** the user has previously connected with a given connector (persisted as the recent wallet)
**When** the wallet modal connector list is rendered again
**Then** that connector is ordered at the top of the list and labeled with the "Recent" badge

---
id: connectors-metamask-detection-ordering
title: MetaMask ordering depends on extension detection
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: >-
  Backed by useOrderedWalletConnectors.test.ts detection-ordering unit tests (verified
  test names) over useIsMetaMaskExtensionDetected; no Testlio counterpart.
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - injected
  - metamask
# execution
automatable: true
testLevel: unit
runFrequency: release
# coverage
code_paths:
  - apps/web/src/features/wallet/connection/hooks/useOrderedWalletConnectors.ts
  - apps/web/src/features/wallet/connection/hooks/useIsMetaMaskExtensionDetected.ts
automationRefs:
  - path: apps/web/src/features/wallet/connection/hooks/useOrderedWalletConnectors.test.ts
    testName: useOrderedWallets > shows MetaMask in the primary list when the extension is detected
  - path: apps/web/src/features/wallet/connection/hooks/useOrderedWalletConnectors.test.ts
    testName: useOrderedWallets > shows MetaMask after WalletConnect (not as an injected wallet) when the extension is not detected
---

> **medium · unit · release · automated** · platforms: web

**Given** the wallet modal is opened
**When** the MetaMask browser extension is detected vs not detected
**Then** MetaMask appears in the primary injected list when detected, and is instead placed after WalletConnect (not as an injected wallet) when the extension is not detected

---
id: connectors-multiplatform-dedup
title: Same-named EVM and Solana connectors merge into one dual-platform entry
# importance
priority: low
severity: low
# provenance
source: existing-unit
sourceNote: >-
  Backed by multiplatform.test.ts deduplicateWalletConnectorMeta unit tests (verified
  test names); no Testlio counterpart.
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - solana
  - wallet-modal
# execution
automatable: true
testLevel: unit
runFrequency: release
# coverage
code_paths:
  - apps/web/src/features/wallet/connection/connectors/multiplatform.ts
  - apps/web/src/features/wallet/connection/types/WalletConnectorMeta.ts
automationRefs:
  - path: apps/web/src/features/wallet/connection/connectors/multiplatform.test.ts
    testName: multiplatform connectors > deduplicateWalletConnectorMeta > should merge the real MetaMask Connect EVM and Solana connectors into one dual-platform entry
---

> **low · unit · release · automated** · platforms: web

**Given** a connector list containing an EVM connector and a Solana connector with the same normalized wallet name
**When** `deduplicateWalletConnectorMeta` runs
**Then** the two entries merge into a single dual-platform connector entry, first-occurrence order is preserved, and custom connectors are never merged with others
