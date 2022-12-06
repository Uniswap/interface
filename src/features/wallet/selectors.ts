import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from 'src/app/rootReducer'
import { TokenSortableField } from 'src/data/__generated__/types-and-hooks'
import { DEMO_ACCOUNT_ADDRESS } from 'src/features/wallet/accounts/useTestAccount'
import { AccountType, SignerMnemonicAccount } from './accounts/types'

const DEFAULT_TOKENS_ORDER_BY = TokenSortableField.Volume

export const selectAccounts = (state: RootState) => state.wallet.accounts

export const selectNonPendingAccounts = createSelector(selectAccounts, (accounts) =>
  Object.fromEntries(Object.entries(accounts).filter((a) => !a[1].pending))
)

export const selectPendingAccounts = createSelector(selectAccounts, (accounts) =>
  Object.fromEntries(Object.entries(accounts).filter((a) => a[1].pending))
)

export const selectSignerAccounts = createSelector(selectAccounts, (accounts) =>
  Object.values(accounts).filter((a) => a.type !== AccountType.Readonly)
)

export const selectNonPendingSignerAccounts = createSelector(selectAccounts, (accounts) =>
  Object.values(accounts).filter((a) => a.type !== AccountType.Readonly && !a.pending)
)

export const selectViewOnlyAccounts = createSelector(selectAccounts, (accounts) =>
  Object.values(accounts).filter((a) => a.type === AccountType.Readonly && !a.pending)
)

export const selectSortedSignerMnemonicAccounts = createSelector(selectAccounts, (accounts) =>
  Object.values(accounts)
    .filter(
      // We filter out demo account to avoid account creation issues
      (account) =>
        account.type === AccountType.SignerMnemonic && account.address !== DEMO_ACCOUNT_ADDRESS
    )
    .sort(
      (a, b) =>
        (a as SignerMnemonicAccount).derivationIndex - (b as SignerMnemonicAccount).derivationIndex
    )
    .map((account) => account as SignerMnemonicAccount)
)

export const selectSignerMnemonicAccountExists = createSelector(
  selectNonPendingAccounts,
  (accounts) =>
    Object.values(accounts).findIndex((value) => {
      // We filter out demo account to avoid account creation issues
      return value.type === AccountType.SignerMnemonic && value.address !== DEMO_ACCOUNT_ADDRESS
    }) >= 0
)

export const selectActiveAccountAddress = (state: RootState) => state.wallet.activeAccountAddress
export const selectActiveAccount = createSelector(
  selectAccounts,
  selectActiveAccountAddress,
  (accounts, activeAccountAddress) =>
    (activeAccountAddress ? accounts[activeAccountAddress] : null) ?? null
)

export const selectUserPalette = createSelector(
  selectActiveAccount,
  (activeAccount) => activeAccount?.customizations?.palette
)

export const selectFinishedOnboarding = (state: RootState) => state.wallet.finishedOnboarding
export const selectFlashbotsEnabled = (state: RootState) => state.wallet.flashbotsEnabled

export const selectTokensOrderBy = (state: RootState) =>
  state.wallet.settings.tokensOrderBy ?? DEFAULT_TOKENS_ORDER_BY

export const selectInactiveAccounts = createSelector(
  selectActiveAccountAddress,
  selectAccounts,
  (activeAddress, accounts) =>
    Object.values(accounts).filter((account) => account.address !== activeAddress)
)

export const makeSelectAccountNotificationSetting = (address: Address) =>
  createSelector(selectAccounts, (accounts) => !!accounts[address]?.pushNotificationsEnabled)

export const makeSelectAccountHideSmallBalances = (address: Address) =>
  createSelector(selectAccounts, (accounts) => !accounts[address]?.showSmallBalances)

export const makeSelectAccountHideSpamTokens = (address: Address) =>
  createSelector(selectAccounts, (accounts) => !accounts[address]?.showSpamTokens)
