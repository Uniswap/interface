# Settings scenarios — Network selection & gas

Network switching, the network selector modal (sorting/sectioning), and custom
("customize gas") network-cost entry. Shared defaults: `_defaults.yaml`.

---
id: settings-network-switching-mobile
title: Switch active network from settings / network chooser
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  Testlio wallet suite 'Network Switching - iOS/Android'. No same-level automation
  exists.
testlioRef: Network Switching - iOS/Android
# scope
platforms:
  - mobile
labels:
  - regression
  - network
wallets:
  - TW-SETTINGS-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/settings/
  - packages/uniswap/src/components/network/
automationRefs: []
---

> **medium · e2e · release · gap** · platforms: mobile

**Given** test wallet TW-SETTINGS-01 is set up on a multi-chain-enabled build
**When** the user changes the active network via the network chooser
**Then** the selected network becomes active, balances and the network badge update to that chain, and the choice persists for subsequent flows

---
id: settings-network-selector-options
title: Network selector sorts and sections chains correctly
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: >-
  Backed by unit tests in
  packages/uniswap/src/components/network/NetworkFilter/useNetworkSelectorOptions.test.ts
  (sorting, partitioning, spam exclusion, disconnected behavior). The selector UI
  itself is exercised by the Testlio wallet suite
  'Network selector - iOS/Android/Extension'.
testlioRef: Network selector - iOS/Android/Extension
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - network
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/components/network/NetworkFilter/
automationRefs:
  - path: packages/uniswap/src/components/network/NetworkFilter/useNetworkSelectorOptions.test.ts
    testName: useNetworkSelectorOptions > sorts withBalances by USD descending
  - path: packages/uniswap/src/components/network/NetworkFilter/useNetworkSelectorOptions.test.ts
    testName: useNetworkSelectorOptions > partitions chains correctly between withBalances and otherNetworks
  - path: packages/uniswap/src/components/network/NetworkFilter/useNetworkSelectorOptions.test.ts
    testName: useNetworkSelectorOptions > excludes spam tokens from balance aggregation
---

> **high · unit · pr-check · automated** · platforms: mobile, extension

**Given** a connected wallet with token balances across several chains
**When** `useNetworkSelectorOptions` builds the selector data
**Then** chains with balances are sorted by USD value descending in a "With balances" section, zero-balance chains fall into "Other networks" preserving input order, spam and hidden tokens are excluded from aggregation, and a disconnected wallet returns undefined

---
id: settings-custom-gas-toggle
title: Enable custom ("customize gas") network-cost entry
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: >-
  Backed by unit tests in packages/uniswap/src/features/settings/slice.test.ts
  (enableCustomGasFeeEntry toggle, default false) and
  packages/uniswap/src/features/gas/components/NetworkCostPicker.test.tsx
  (Custom/Auto selection). The end-to-end flow maps to the Testlio wallet suite
  'Customize gas inputs'.
testlioRef: Customize gas inputs
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - gas
  - network
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/settings/slice.ts
  - packages/uniswap/src/features/gas/components/
automationRefs:
  - path: packages/uniswap/src/features/settings/slice.test.ts
    testName: userSettingsReducer > toggles enableCustomGasFeeEntry on and off
  - path: packages/uniswap/src/features/gas/components/NetworkCostPicker.test.tsx
    testName: NetworkCostPicker > calls onChange(true) when Custom is tapped
  - path: packages/uniswap/src/features/gas/components/NetworkCostPicker.test.tsx
    testName: NetworkCostPicker > calls onChange(false) when Auto is tapped
---

> **high · unit · pr-check · automated** · platforms: mobile, extension

**Given** the "Customize gas" advanced setting is available
**When** the user toggles custom gas entry and picks Custom vs Auto in the network-cost picker
**Then** `enableCustomGasFeeEntry` flips accordingly (default false), tapping Custom calls `onChange(true)` and Auto calls `onChange(false)`, so the transaction flow exposes editable gas inputs only when enabled

---
id: settings-custom-gas-row-state
title: Network-cost row reflects auto vs custom override state
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: >-
  Backed by unit tests in
  packages/uniswap/src/features/gas/components/NetworkCostRow.test.tsx (Auto pill,
  warning icon, pressability). No Testlio case covers the row states directly.
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - gas
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/gas/components/NetworkCostRow.tsx
automationRefs:
  - path: packages/uniswap/src/features/gas/components/NetworkCostRow.test.tsx
    testName: NetworkCostRow > shows Auto pill when custom entry is enabled but no overrides are saved
  - path: packages/uniswap/src/features/gas/components/NetworkCostRow.test.tsx
    testName: NetworkCostRow > shows amber alert icon when custom overrides have a warning
---

> **high · unit · pr-check · automated** · platforms: mobile, extension

**Given** custom gas entry is enabled
**When** the network-cost row renders with or without saved overrides
**Then** it shows the "Auto" pill when no overrides are saved, hides the pill when custom entry is disabled, surfaces an amber alert icon when an override carries a warning, and only fires `onPress` / shows a chevron when pressable
