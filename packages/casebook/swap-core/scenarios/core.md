# Swap scenarios — Core

Core same-chain swap flows: exact-input happy path, exact-output, token-direction
switching, form defaults, the token selector, the settings menu, the extension
flow-general smoke, and swap analytics logging. Wallet aliases: see
`TEST_WALLETS.md`. Shared defaults: `_defaults.yaml`.

---
id: swap-core-exact-input-happy-path
title: Exact-input swap completes and updates balances
# importance
priority: urgent
severity: urgent
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts ("should swap ETH to USDC") and
  the Maestro mobile flow apps/mobile/.maestro/flows/swap/swap-base.yaml (declared
  FLOW_NAME "swap", drives review + swap confirm). Also backed by Testlio
  "Swap Function - General - iOS/Android" and "Swap With Available Balance".
testlioRef: Swap Function - General - iOS/Android
# scope
protocol_version: all
chains:
  - ethereum
  - unichain
  - base
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - smoke
wallets:
  - TW-SWAPCORE-01
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/form/
  - packages/uniswap/src/features/transactions/swap/review/
  - packages/uniswap/src/features/transactions/swap/services/
  - apps/web/src/pages/Swap/
  - apps/web/src/state/sagas/transactions/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts
    testName: Swap > should swap ETH to USDC
  - path: apps/mobile/.maestro/flows/swap/swap-base.yaml
    testName: swap
---

> **urgent · all · e2e · scheduled · automated** · chains: ethereum, unichain, base

**Given** test wallet `TW-SWAPCORE-01` is connected with a native ETH + USDC balance on a supported chain
**When** the user enters an exact input amount, opens the review screen, and confirms the swap
**Then** a quote is fetched, the transaction is submitted and confirmed on-chain, the "Swapped" notification appears, and both the input and output token balances update to reflect the executed trade

---
id: swap-core-exact-output
title: Exact-output swap derives and swaps the correct input amount
# importance
priority: urgent
severity: high
# provenance
source: uniswap
sourceNote: >-
  Derived from the exact-output (dependent-input) code path in
  packages/uniswap/src/features/transactions/swap/form/. Manual coverage falls under
  Testlio "Swap Function - General - iOS/Android".
testlioRef: Swap Function - General - iOS/Android
# scope
protocol_version: all
chains:
  - ethereum
  - unichain
  - base
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - form
wallets:
  - TW-SWAPCORE-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/form/
  - packages/uniswap/src/features/transactions/swap/services/
automationRefs: []
---

> **urgent · all · e2e · release · gap** · chains: ethereum, unichain, base

**Given** wallet `TW-SWAPCORE-01` is connected with sufficient input balance
**When** the user types the desired amount into the **output** field
**Then** the input field is populated from the quote, the review screen shows the derived exact input, and executing the trade delivers the requested output amount (within slippage tolerance)

---
id: swap-core-reverse-token-direction
title: Reversing token direction swaps input/output and refetches the quote
# importance
priority: high
severity: high
# provenance
source: uniswap
sourceNote: >-
  Derived from the direction-switch handling in
  packages/uniswap/src/features/transactions/swap/form/ and stores/. Manual coverage
  falls under Testlio "Swap Function - General - iOS/Android".
testlioRef: Swap Function - General - iOS/Android
# scope
protocol_version: all
chains:
  - ethereum
  - unichain
  - base
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - form
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/form/
  - packages/uniswap/src/features/transactions/swap/stores/
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: ethereum, unichain, base

**Given** the user has selected an input and output token with an entered amount
**When** they click the reverse (switch) control between the token fields
**Then** the input and output tokens swap positions, the entered amount moves to the new independent field, and a fresh quote is fetched for the reversed direction

---
id: swap-core-form-defaults-from-url
title: Swap form defaults inputs from URL params
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Swap/Swap.e2e.test.ts ("should default inputs from URL
  params " — the repo test name carries a trailing space). No Testlio counterpart.
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - swap
  - form
  - deeplink
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/Swap/
  - packages/uniswap/src/features/transactions/swap/form/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/Swap.e2e.test.ts
    testName: "Swap > should default inputs from URL params "
---

> **medium · all · e2e · scheduled · automated** · chains: ethereum

**Given** the user opens a `/swap` URL that carries input/output token and chain query params
**When** the swap page loads
**Then** the input and output tokens (and chain) are pre-selected from the URL params without any manual selection

---
id: swap-core-clear-dependent-input
title: Clearing the independent input resets the dependent output field
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Swap/Swap.e2e.test.ts ("should reset the dependent input
  when the independent input is cleared"). No Testlio counterpart.
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - swap
  - form
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/Swap/
  - packages/uniswap/src/features/transactions/swap/form/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/Swap.e2e.test.ts
    testName: Swap > should reset the dependent input when the independent input is cleared
---

> **medium · all · e2e · scheduled · automated** · chains: ethereum

**Given** the user has entered an amount that produced a quoted dependent value
**When** they clear the independent input field
**Then** the dependent (output) field is reset to empty and no stale quote value remains

---
id: swap-core-token-selector-sections
title: Token selector shows top-token and bridging sections and populates the form
# importance
priority: high
severity: medium
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Swap/TokenSelector.e2e.test.ts (input/output section
  rendering). Also backed by Testlio "Token selector Swap / Send / Wallet".
testlioRef: Token selector Swap / Send / Wallet
# scope
protocol_version: all
chains:
  - ethereum
  - unichain
  - base
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - swap
  - token-selector
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/form/
  - apps/web/src/pages/Swap/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/TokenSelector.e2e.test.ts
    testName: TokenSelector > input - should show top tokens sections if token selected
  - path: apps/web/src/pages/Swap/Swap/TokenSelector.e2e.test.ts
    testName: TokenSelector > output - should show bridging and top tokens sections if empty
---

> **high · all · e2e · scheduled · automated** · chains: ethereum, unichain, base

**Given** the user opens the input or output token selector
**When** the selector renders (empty, or with the opposite side already selected)
**Then** the correct sections are shown (top tokens, and the bridging section when applicable), and selecting a token populates that side of the swap form

---
id: swap-core-settings-menu-open-close
title: Swap settings menu opens and closes on desktop and mobile-web layouts
# importance
priority: medium
severity: low
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Swap/SwapSettings.e2e.test.ts. "Mobile" here means the
  mobile-web breakpoint of the web app, not the mobile app. No Testlio counterpart.
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - swap
  - settings
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/Swap/
  - packages/uniswap/src/features/transactions/swap/form/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/SwapSettings.e2e.test.ts
    testName: Swap Settings > opens and closes the settings menu
  - path: apps/web/src/pages/Swap/Swap/SwapSettings.e2e.test.ts
    testName: Swap Settings > should open the mobile settings menu
---

> **medium · all · e2e · scheduled · automated** · chains: ethereum

**Given** the user is on the swap form (desktop or mobile-web layout)
**When** they tap the settings (gear) control and then dismiss it
**Then** the settings menu opens showing slippage/deadline controls and closes cleanly, returning focus to the form

---
id: swap-core-flow-general-extension
title: Extension side-panel swap flow completes end to end
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  Testlio "Swap Flow General - Extension". The existing extension e2e
  apps/extension/e2e/tests/swap/sidepanel-swap.test.ts ("Side panel swap golden path >
  renders a real ETH -> USDC quote and blocks review for the unfunded test wallet")
  automates only the quote-render portion and deliberately never submits, so it is not
  listed as same-level automation for this full-flow case.
testlioRef: Swap Flow General - Extension
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - extension
labels:
  - regression
  - swap
  - smoke
wallets:
  - TW-SWAPCORE-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/swap/
  - packages/wallet/src/features/transactions/swap/
  - packages/uniswap/src/features/transactions/swap/form/
automationRefs: []
---

> **high · all · e2e · release · gap** · chains: ethereum

**Given** wallet `TW-SWAPCORE-01` is active in the extension side panel with ETH and USDC balances
**When** the user opens the swap flow from the home screen, selects an output token, enters an amount, reviews, and confirms
**Then** a quote is rendered, the transaction is submitted and confirmed on-chain, and the updated balances are reflected in the extension portfolio

---
id: swap-core-analytics-time-to-swap-logging
title: Time-to-swap analytics events are logged across the swap flow
# importance
priority: low
severity: low
# provenance
source: existing-e2e
sourceNote: >-
  apps/web/src/pages/Swap/Swap/Logging.anvil.e2e.test.ts ("completes two swaps and
  verifies the TTS logging for the first, plus all intermediate steps along the way").
  No Testlio counterpart.
# scope
protocol_version: all
chains:
  - ethereum
platforms:
  - web
labels:
  - regression
  - swap
  - analytics
wallets:
  - TW-SWAPCORE-01
# execution
automatable: true
testLevel: e2e
runFrequency: scheduled
# coverage
code_paths:
  - apps/web/src/pages/Swap/
  - apps/web/src/state/sagas/transactions/
automationRefs:
  - path: apps/web/src/pages/Swap/Swap/Logging.anvil.e2e.test.ts
    testName: Time-to-swap logging > completes two swaps and verifies the TTS logging for the first, plus all intermediate steps along the way
---

> **low · all · e2e · scheduled · automated** · chains: ethereum

**Given** wallet `TW-SWAPCORE-01` performs a first and a second swap in one session
**When** the swap flow progresses through input, quote, review, and confirmation
**Then** the time-to-swap analytics event fires for the first swap with all intermediate step events logged in order, and no duplicate events fire on the second swap

---
id: swap-core-decimal-pad-caret-position
title: Decimal pad caret stays correctly positioned when typing fast on mobile
# importance
priority: medium
severity: medium
# provenance
source: uniswap
sourceNote: >-
  Derived from the caret-positioning fix in
  packages/uniswap/src/components/CurrencyInputPanel/CurrencyInputPanelInput.tsx and
  packages/uniswap/src/features/transactions/components/DecimalPadInput/DecimalPadInput.tsx —
  the native caret update is now applied in the render that carries the value it belongs
  to (instead of a racy setTimeout + setNativeProps), preventing iOS from recomputing a
  stale cursor position when a keystroke lands before the previous render committed. No
  Testlio counterpart yet.
# scope
protocol_version: all
platforms:
  - mobile
labels:
  - regression
  - swap
  - decimal-pad
  - edge-case
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/components/CurrencyInputPanel/CurrencyInputPanelInput.tsx
  - packages/uniswap/src/features/transactions/components/DecimalPadInput/
  - packages/uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/
automationRefs: []
---

> **medium · all · e2e · release · gap**

**Given** the mobile swap form's input or output field is focused
**When** the user taps digits on the decimal pad rapidly — including a tap that inserts or deletes mid-value rather than at the end — faster than a render cycle
**Then** the caret lands at the correct position for the value just entered on every keystroke, and never jumps to the start of the field or to a stale offset left over from the previous value
