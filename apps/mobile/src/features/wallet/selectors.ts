import { createSelector, Selector } from '@reduxjs/toolkit'
import type { MobileState } from 'src/app/reducer'
import { TokenSortableField } from 'wallet/src/data/__generated__/types-and-hooks'
import {
  Account,
  AccountType,
  SignerMnemonicAccount,
} from 'wallet/src/features/wallet/accounts/types'
import { TokensOrderBy } from 'wallet/src/features/wallet/types'

const DEFAULT_TOKENS_ORDER_BY = TokenSortableField.Volume

export const selectAccounts = (state: MobileState): Record<string, Account> => state.wallet.accounts

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
    .filter((account) => account.type === AccountType.SignerMnemonic)
    .sort(
      (a, b) =>
        (a as SignerMnemonicAccount).derivationIndex - (b as SignerMnemonicAccount).derivationIndex
    )
    .map((account) => account as SignerMnemonicAccount)
)

export const selectSignerMnemonicAccountExists = createSelector(
  selectNonPendingAccounts,
  (accounts) =>
    Object.values(accounts).findIndex((value) => value.type === AccountType.SignerMnemonic) >= 0
)

export const selectActiveAccountAddress = (state: MobileState): string | null =>
  state.wallet.activeAccountAddress
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

export const selectFinishedOnboarding = (state: MobileState): boolean | undefined =>
  state.wallet.finishedOnboarding

export const selectTokensOrderBy = (state: MobileState): TokensOrderBy =>
  state.wallet.settings.tokensOrderBy ?? DEFAULT_TOKENS_ORDER_BY

export const selectInactiveAccounts = createSelector(
  selectActiveAccountAddress,
  selectAccounts,
  (activeAddress, accounts) =>
    Object.values(accounts).filter((account) => account.address !== activeAddress)
)

export const makeSelectAccountNotificationSetting = (
  address: Address
): Selector<MobileState, boolean> =>
  createSelector(selectAccounts, (accounts) => !!accounts[address]?.pushNotificationsEnabled)

export const makeSelectAccountHideSmallBalances = (
  address: Address
): Selector<MobileState, boolean> =>
  createSelector(selectAccounts, (accounts) => !accounts[address]?.showSmallBalances)

export const makeSelectAccountHideSpamTokens = (address: Address): Selector<MobileState, boolean> =>
  createSelector(selectAccounts, (accounts) => !accounts[address]?.showSpamTokens)
