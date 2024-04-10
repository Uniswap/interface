import { createSelector, Selector } from '@reduxjs/toolkit'
import { TokenSortableField } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  Account,
  AccountType,
  ReadOnlyAccount,
  SignerMnemonicAccount,
} from 'wallet/src/features/wallet/accounts/types'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { TokensOrderBy } from 'wallet/src/features/wallet/types'
import type { RootState } from 'wallet/src/state'

const DEFAULT_TOKENS_ORDER_BY = TokenSortableField.Volume

function isPending(account: Account): boolean {
  return account.pending ?? false
}

export const selectAccounts = (state: RootState): Record<string, Account> => state.wallet.accounts

export const selectNonPendingAccounts = createSelector(selectAccounts, (accounts) =>
  Object.fromEntries(Object.entries(accounts).filter((a) => !isPending(a[1])))
)

export const selectPendingAccounts = createSelector(selectAccounts, (accounts) =>
  Object.fromEntries(Object.entries(accounts).filter((a) => isPending(a[1])))
)

export const selectSignerMnemonicAccounts = createSelector(selectAccounts, (accounts) =>
  Object.values(accounts).filter(
    (a): a is SignerMnemonicAccount => a.type === AccountType.SignerMnemonic
  )
)

export const selectNonPendingSignerMnemonicAccounts = createSelector(
  selectSignerMnemonicAccounts,
  (accounts) => Object.values(accounts).filter((a) => !isPending(a))
)

export const selectSortedSignerMnemonicAccounts = createSelector(
  selectSignerMnemonicAccounts,
  (accounts) =>
    accounts.sort(
      (a, b) =>
        (a as SignerMnemonicAccount).derivationIndex - (b as SignerMnemonicAccount).derivationIndex
    )
)

export const selectSignerMnemonicAccountExists = createSelector(
  selectNonPendingAccounts,
  (accounts) =>
    Object.values(accounts).findIndex((value) => value.type === AccountType.SignerMnemonic) >= 0
)

export const selectViewOnlyAccounts = createSelector(selectAccounts, (accounts) =>
  Object.values(accounts).filter((a): a is ReadOnlyAccount => a.type === AccountType.Readonly)
)

export const selectNonPendingViewOnlyAccounts = createSelector(selectViewOnlyAccounts, (accounts) =>
  accounts.filter((a) => !isPending(a))
)

export const selectSortedViewOnlyAccounts = createSelector(selectViewOnlyAccounts, (accounts) =>
  accounts.sort((a, b) => a.timeImportedMs - b.timeImportedMs)
)

// Sorted signer accounts, then sorted view-only accounts
export const selectAllAccountsSorted = createSelector(
  selectSortedSignerMnemonicAccounts,
  selectSortedViewOnlyAccounts,
  (signerMnemonicAccounts, viewOnlyAccounts) => {
    return [...signerMnemonicAccounts, ...viewOnlyAccounts]
  }
)

export const selectActiveAccountAddress = (state: RootState): string | null =>
  state.wallet.activeAccountAddress
export const selectActiveAccount = createSelector(
  selectAccounts,
  selectActiveAccountAddress,
  (accounts, activeAccountAddress) =>
    (activeAccountAddress ? accounts[activeAccountAddress] : null) ?? null
)

export const selectFinishedOnboarding = (state: RootState): boolean | undefined =>
  state.wallet.finishedOnboarding

export const selectTokensOrderBy = (state: RootState): TokensOrderBy =>
  state.wallet.settings.tokensOrderBy ?? DEFAULT_TOKENS_ORDER_BY

export const selectInactiveAccounts = createSelector(
  selectActiveAccountAddress,
  selectAccounts,
  (activeAddress, accounts) =>
    Object.values(accounts).filter((account) => account.address !== activeAddress)
)

export const makeSelectAccountNotificationSetting = (): Selector<RootState, boolean, [Address]> =>
  createSelector(
    selectAccounts,
    (_: RootState, address: Address) => address,
    (accounts, address) => !!accounts[address]?.pushNotificationsEnabled
  )

export const selectWalletHideSmallBalancesSetting = (state: RootState): boolean =>
  state.wallet.settings.hideSmallBalances

export const selectWalletHideSpamTokensSetting = (state: RootState): boolean =>
  state.wallet.settings.hideSpamTokens

export const selectWalletSwapProtectionSetting = (state: RootState): SwapProtectionSetting =>
  state.wallet.settings.swapProtection
