import { createSelector, Selector } from '@reduxjs/toolkit'
import { MobileState } from 'src/app/reducer'
import {
  WalletConnectPendingSession,
  WalletConnectRequest,
  WalletConnectSession,
} from 'src/features/walletConnect/walletConnectSlice'

export const selectSessions =
  (address: Maybe<string>) =>
  (state: MobileState): WalletConnectSession[] | undefined => {
    if (!address) {
      return
    }

    const wcAccount = state.walletConnect.byAccount[address]
    if (!wcAccount) {
      return
    }

    return Object.values(wcAccount.sessions)
  }

export const makeSelectSessions = (): Selector<
  MobileState,
  WalletConnectSession[] | undefined,
  [Maybe<Address>]
> =>
  createSelector(
    (state: MobileState) => state.walletConnect.byAccount,
    (_: MobileState, address: Maybe<Address>) => address,
    (sessionsByAccount, address) => {
      if (!address) {
        return
      }

      const wcAccount = sessionsByAccount[address]
      if (!wcAccount) {
        return
      }

      return Object.values(wcAccount.sessions)
    }
  )

export const selectPendingRequests = (state: MobileState): WalletConnectRequest[] => {
  return state.walletConnect.pendingRequests
}

export const selectPendingSession = (state: MobileState): WalletConnectPendingSession | null => {
  return state.walletConnect.pendingSession
}

export const selectDidOpenFromDeepLink = (state: MobileState): boolean => {
  return state.walletConnect.didOpenFromDeepLink ?? false
}

export const selectHasPendingSessionError = (state: MobileState): boolean => {
  return state.walletConnect.hasPendingSessionError ?? false
}
