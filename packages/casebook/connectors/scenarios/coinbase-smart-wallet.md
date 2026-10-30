# Connectors scenarios — Coinbase Smart Wallet

Coinbase Smart Wallet (passkey-backed) connection via the Coinbase SDK connector, plus
the custom-connector metadata that renders it. Shared defaults: `_defaults.yaml`.

---
id: connectors-coinbase-smart-wallet-connect
title: Connect a Coinbase Smart Wallet via passkey
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  Testlio suite "Smart Wallet - Coinbase - Mobile" (verbatim blueprint title; the suite
  name says Mobile but the blueprint claims the web connect portion for this area). No
  automation — passkey ceremony against the Coinbase SDK connector is manual.
testlioRef: Smart Wallet - Coinbase - Mobile
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - coinbase
  - smart-wallet
  - passkey
wallets:
  - TW-CONNECTORS-02
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/features/wallet/connection/connectors/wagmi.ts
  - apps/web/src/components/WalletModal/
  - apps/web/src/connection/wagmiConfig.ts
automationRefs: []
---

> **high · e2e · release · manual** · platforms: web

**Given** the Coinbase Smart Wallet (passkey-backed) test wallet TW-CONNECTORS-02 assigned to the tester, and the Coinbase SDK connector available in the wallet modal
**When** the user selects "Coinbase Wallet" and authenticates with the passkey (no browser extension)
**Then** the Coinbase Smart Wallet connects, the connected address appears in the nav, and a Coinbase-Smart-Wallet-supported chain (e.g. Base) is active

Note (non-normative): some chains (e.g. Soneium, Unichain) are not supported by the Coinbase Smart Wallet; how unsupported chains are surfaced is not asserted by this case and would need its own scenario once the expected UI is specified.

---
id: connectors-coinbase-custom-meta
title: Custom-connector metadata renders Coinbase and Uniswap connector options correctly
# importance
priority: low
severity: low
# provenance
source: existing-unit
sourceNote: >-
  Backed by custom.test.ts applyCustomConnectorMeta unit tests (verified test names); no
  Testlio counterpart.
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - coinbase
  - wallet-modal
# execution
automatable: true
testLevel: unit
runFrequency: release
# coverage
code_paths:
  - apps/web/src/features/wallet/connection/connectors/custom.ts
  - apps/web/src/features/wallet/connection/types/CustomConnectorId.ts
automationRefs:
  - path: apps/web/src/features/wallet/connection/connectors/custom.test.ts
    testName: custom connectors > applyCustomConnectorMeta > should override coinbase sdk icon with icon override map
  - path: apps/web/src/features/wallet/connection/connectors/custom.test.ts
    testName: custom connectors > applyCustomConnectorMeta > should apply embedded wallet connector meta to existing embedded wallet
---

> **low · unit · release · automated** · platforms: web

**Given** a raw wagmi connector list including the Coinbase SDK connector and the embedded wallet connector
**When** `applyCustomConnectorMeta` runs
**Then** the Coinbase SDK icon is overridden from the icon-override map, the Uniswap wallet and embedded wallet metadata are applied to their respective entries, and non-embedded connector IDs are left unmodified
