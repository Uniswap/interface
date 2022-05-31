import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from 'src/app/rootReducer'

export const selectAccounts = (state: RootState) => state.wallet.accounts

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

export const makeSelectLocalPfp = (address: Address) =>
  createSelector(selectAccounts, (accounts) => accounts[address]?.customizations?.localPfp)

export const selectFinishedOnboarding = (state: RootState) => state.wallet.finishedOnboarding
export const selectFlashbotsEnabled = (state: RootState) => state.wallet.flashbotsEnabled

export const selectInactiveAccountAddresses = createSelector(
  selectActiveAccountAddress,
  selectAccounts,
  (activeAddress, accounts) => Object.keys(accounts).filter((address) => address !== activeAddress)
)
