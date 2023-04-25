import { createSelector } from '@reduxjs/toolkit'
import { Account, AccountType } from 'wallet/src/features/wallet/types'
import type { AppSelector, RootState } from 'wallet/src/state'

export const isOnboardedSelector: AppSelector<boolean> = (state) =>
  Object.keys(state.wallet.accounts).length > 0

export const selectAccounts = (state: RootState): Record<string, Account> =>
  state.wallet.accounts

export const selectNonPendingAccounts = createSelector(
  selectAccounts,
  (accounts) =>
    Object.fromEntries(Object.entries(accounts).filter((a) => !a[1].pending))
)

export const selectPendingAccounts = createSelector(
  selectAccounts,
  (accounts) =>
    Object.fromEntries(Object.entries(accounts).filter((a) => a[1].pending))
)

export const selectSignerAccounts = createSelector(selectAccounts, (accounts) =>
  Object.values(accounts).filter((a) => a.type !== AccountType.Readonly)
)

export const selectNonPendingSignerAccounts = createSelector(
  selectAccounts,
  (accounts) =>
    Object.values(accounts).filter(
      (a) => a.type !== AccountType.Readonly && !a.pending
    )
)

export const selectViewOnlyAccounts = createSelector(
  selectAccounts,
  (accounts) =>
    Object.values(accounts).filter(
      (a) => a.type === AccountType.Readonly && !a.pending
    )
)

export const selectActiveAccountAddress = (state: RootState): string | null =>
  state.wallet.activeAccountAddress

export const selectActiveAccount = createSelector(
  selectAccounts,
  selectActiveAccountAddress,
  (accounts, activeAccountAddress) =>
    (activeAccountAddress ? accounts[activeAccountAddress] : null) ?? null
)
