# Portfolio scenarios — Account management

Account switcher, add/remove/set-active account state, copy address (own account
and token contract), and the get-token CTA on an empty wallet. Shared defaults:
`_defaults.yaml`.

---
id: portfolio-account-switcher
title: Account switcher lists accounts and switches the active account
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "(a) unit wallet slice.test.ts (sets active account); (b) unit accounts/useAccountListData.test.ts; (c) Testlio Wallet 'Account Switcher (multiple wallets/single wallet) - iOS/Android/Extension'"
testlioRef: Account Switcher (multiple wallets/single wallet) - iOS/Android/Extension
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - accounts
wallets:
  - TW-PORTFOLIO-03
# execution
automatable: true
testLevel: integration
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/wallet/slice.ts
  - packages/wallet/src/features/accounts/useAccountListData.ts
  - apps/extension/src/app/features/home/
automationRefs:
  - path: packages/wallet/src/features/wallet/slice.test.ts
    testName: walletReducer > sets active account
  - path: packages/wallet/src/features/wallet/slice.test.ts
    testName: walletReducer > throws when setting unknown active account
  - path: packages/wallet/src/features/accounts/useAccountListData.test.ts
    testName: useAccountListData > returns balances keyed by address once loaded
---

> **high · integration · pr-check · automated**

**Given** a multi-account wallet (TW-PORTFOLIO-03) with several signer accounts
**When** the user opens the account switcher and selects a different account
**Then** every account is listed with its per-address balance, the selected account becomes the active account, and switching to an unknown account is rejected (guards against acting on the wrong wallet)

---
id: portfolio-add-remove-account
title: Adding and removing accounts updates wallet state and active account
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "(a) unit wallet slice.test.ts (adds account, removes active account and resets); (b) code packages/wallet/src/features/wallet/slice.ts"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - accounts
wallets:
  - TW-PORTFOLIO-03
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/wallet/slice.ts
  - packages/wallet/src/features/accounts/
automationRefs:
  - path: packages/wallet/src/features/wallet/slice.test.ts
    testName: walletReducer > adds account to wallet
  - path: packages/wallet/src/features/wallet/slice.test.ts
    testName: walletReducer > removes active account from wallet and resets active account
  - path: packages/wallet/src/features/wallet/slice.test.ts
    testName: walletReducer > removes all accounts from wallet and resets active account
---

> **high · unit · pr-check · automated**

**Given** a wallet (TW-PORTFOLIO-03) with one or more accounts in state
**When** an account is added, or the active account is removed
**Then** the account list updates, and when the active account is removed the active-account pointer is reset to a valid account (never left dangling), preventing the app from operating on a deleted account

---
id: portfolio-copy-own-address
title: Copy own account address for the first time
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "(a) Testlio Wallet 'Copy Address for the first time - iOS/Android'. No same-level automation exists for copying the ACCOUNT address — the portfolio Maestro flow automates copying a token CONTRACT address only (see portfolio-copy-token-contract-address)."
testlioRef: Copy Address for the first time - iOS/Android
# scope
platforms:
  - mobile
labels:
  - regression
  - portfolio
  - accounts
wallets:
  - TW-PORTFOLIO-02
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/wallet/src/features/wallet/
  - packages/uniswap/src/features/portfolio/
automationRefs: []
---

> **medium · e2e · release · gap**

**Given** a funded wallet (TW-PORTFOLIO-02) on the mobile home screen
**When** the user opens their account entry and taps copy address for the first time
**Then** the active account's address is copied to the clipboard exactly (no truncation), and a copied confirmation is surfaced

---
id: portfolio-copy-token-contract-address
title: Copy token contract address shows the do-not-send warning
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) mobile Maestro apps/mobile/.maestro/flows/portfolio/view-token-details.yaml — taps TokenDetailsCopyAddressButton, handles the ContractAddressExplainerModalWarning ('Do not send crypto to this address'), and checks for the copied confirmation"
# scope
platforms:
  - mobile
labels:
  - regression
  - portfolio
  - accounts
wallets:
  - TW-PORTFOLIO-02
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/portfolio/
  - packages/wallet/src/features/wallet/
automationRefs:
  - path: apps/mobile/.maestro/flows/portfolio/view-token-details.yaml
    testName: portfolio-view-token-details
---

> **medium · e2e · release · automated**

**Given** a funded wallet (TW-PORTFOLIO-02) viewing a standard ERC-20 token's details page
**When** the user taps the copy contract-address button for the first time
**Then** a "do not send crypto to this address" contract-address warning modal is shown, acknowledging it copies the contract address to the clipboard, and a copied confirmation is surfaced (the copy button is disabled for native tokens)

---
id: portfolio-get-token-cta
title: Empty wallet shows a Get token / Receive CTA
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "(a) Testlio Wallet 'Get Token CTA - iOS/Android'; (b) code apps/extension/src/app/features/home/PortfolioActionButtons.tsx and mobile home"
testlioRef: Get Token CTA - iOS/Android
# scope
platforms:
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - empty-state
wallets:
  - TW-PORTFOLIO-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/extension/src/app/features/home/PortfolioActionButtons.tsx
  - packages/uniswap/src/features/portfolio/
automationRefs: []
---

> **medium · e2e · release · gap**

**Given** a freshly imported wallet (TW-PORTFOLIO-01) with $0.00 balance
**When** the user views the home / portfolio surface
**Then** a Get token / Receive CTA is presented, and tapping it opens the buy/receive flow so the user can fund the wallet

---
id: portfolio-account-list-data
title: Account list data returns per-address balances keyed and summed
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "(a) unit packages/wallet/src/features/accounts/useAccountListData.test.ts"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - accounts
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/accounts/useAccountListData.ts
automationRefs:
  - path: packages/wallet/src/features/accounts/useAccountListData.test.ts
    testName: useAccountListData > returns balances keyed by address once loaded
  - path: packages/wallet/src/features/accounts/useAccountListData.test.ts
    testName: useAccountBalances > returns defined balances in address order and their sum
---

> **medium · unit · pr-check · automated**

**Given** a set of account addresses
**When** useAccountListData / useAccountBalances resolve
**Then** balances are returned keyed by address (and in address order with a correct sum), the query is disabled when there are no addresses, and loading/placeholder states are reported while the first fetch is pending
