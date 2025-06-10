import { createSelector, Selector } from '@reduxjs/toolkit'
import { MobileState } from 'src/app/mobileReducer'
import {
  WalletConnectPendingSession,
  WalletConnectSession,
  WalletConnectSigningRequest,
} from 'src/features/walletConnect/walletConnectSlice'

export const makeSelectSessions = (): Selector<MobileState, WalletConnectSession[] | undefined, [Maybe<Address>]> =>
  createSelector(
    (state: MobileState) => state.walletConnect.sessions,
    (_: MobileState, address: Maybe<Address>) => address,
    (sessions, address) => {
      if (!address) {
        return undefined
      }

      // Filter sessions by active account address
      return Object.values(sessions).filter((session) => session.activeAccount === address)
    },
  )

export const selectAllSessions = (state: MobileState): Record<string, WalletConnectSession> => {
  return state.walletConnect.sessions
}

export const selectPendingRequests = (state: MobileState): WalletConnectSigningRequest[] => {
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
