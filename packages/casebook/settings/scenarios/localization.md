# Settings scenarios — Language & currency

App language (i18n) and display fiat currency selection, plus the locale-aware number
formatting these drive. Shared defaults: `_defaults.yaml`.

---
id: settings-language-switch-mobile
title: Switch app language and re-render localized strings
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  Testlio wallet suite 'Internalization - Spanish/Chinese/Vietnamese/French'. Also
  subsumes the blueprint's standalone 'Language' Testlio title (same language-switch
  walk). No same-level automation exists.
testlioRef: Internalization - Spanish/Chinese/Vietnamese/French
# scope
platforms:
  - mobile
labels:
  - regression
  - i18n
  - language
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/language/
  - apps/mobile/src/screens/SettingsLanguageModal.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · platforms: mobile

**Given** the user is on the mobile Settings > Language screen
**When** they select a non-default language (Spanish, Chinese, Vietnamese, or French)
**Then** the selection is persisted and visible UI strings (settings labels, tab names, buttons) re-render in the chosen language after returning to the app; switching back to English restores English strings

---
id: settings-ext-i18n-spanish
title: Extension renders in a non-default language
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  Testlio suite 'i18n Spanish - Extension'. No same-level automation exists.
testlioRef: i18n Spanish - Extension
# scope
platforms:
  - extension
labels:
  - regression
  - i18n
  - language
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/language/
  - apps/extension/src/app/features/settings/SettingsScreen.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · platforms: extension

**Given** the extension is unlocked on the Settings screen
**When** the user selects Spanish as the app language
**Then** settings and navigation strings render in Spanish and the preference persists across reopening the extension popup

---
id: settings-fiat-currency-switch
title: Change display fiat currency across balances and amounts
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: >-
  Testlio wallet suite 'Currency - General/iOS/Android'. No same-level automation
  exists.
testlioRef: Currency - General/iOS/Android
# scope
platforms:
  - mobile
  - extension
labels:
  - regression
  - currency
  - i18n
wallets:
  - TW-SETTINGS-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/fiatCurrency/
  - apps/mobile/src/screens/SettingsFiatCurrencyModal.tsx
automationRefs: []
---

> **medium · e2e · release · gap** · platforms: mobile, extension

**Given** test wallet TW-SETTINGS-01 with a balance is set up and the display currency is USD
**When** the user selects a different fiat currency (e.g. EUR) in settings
**Then** portfolio value, token rows, and swap/send fiat amounts re-display in the selected currency with the correct symbol and locale grouping, and the preference persists

---
id: settings-locale-decimal-input
title: Locale decimal separator accepted in amount inputs
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: >-
  Testlio wallet suite 'Internalization - Spanish/Chinese/Vietnamese/French' — this
  case isolates the French fiat-input special case (comma decimal separator parsed
  correctly in swap/send amount fields). No same-level automation exists.
testlioRef: Internalization - Spanish/Chinese/Vietnamese/French
# scope
platforms:
  - mobile
labels:
  - regression
  - i18n
  - currency
  - edge-case
wallets:
  - TW-SETTINGS-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/language/formatter.ts
  - packages/uniswap/src/features/fiatCurrency/conversion.ts
automationRefs: []
---

> **high · e2e · release · gap** · platforms: mobile

**Given** the app language is set to French (comma decimal separator) with fiat input enabled
**When** the user enters an amount using a comma (e.g. `4,5` EUR) in the swap or send fiat field
**Then** the amount is parsed as 4.5, the resulting token amount matches the USD-equivalent, and no rounding/parse error mangles the traded amount
