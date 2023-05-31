import { MobileState } from 'src/app/reducer'
import {
  WalletConnectPendingSession,
  WalletConnectRequest,
  WalletConnectSession,
} from 'src/features/walletConnect/walletConnectSlice'
import { EMPTY_ARRAY } from 'wallet/src/constants/misc'

export const selectSessions =
  (address: Maybe<string>) =>
  (state: MobileState): WalletConnectSession[] => {
    if (!address) return EMPTY_ARRAY

    const wcAccount = state.walletConnect.byAccount[address]
    if (!wcAccount) return EMPTY_ARRAY

    return Object.values(wcAccount.sessions)
  }

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
