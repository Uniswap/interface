import { RootState } from 'src/app/rootReducer'
import { EMPTY_ARRAY } from 'src/constants/misc'
import {
  WalletConnectPendingSession,
  WalletConnectRequest,
  WalletConnectSession,
} from 'src/features/walletConnect/walletConnectSlice'

export const selectSessions =
  (address: NullUndefined<string>) =>
  (state: RootState): WalletConnectSession[] => {
    if (!address) return EMPTY_ARRAY

    const wcAccount = state.walletConnect.byAccount[address]
    if (!wcAccount) return EMPTY_ARRAY

    return Object.values(wcAccount.sessions)
  }

export const selectPendingRequests = (state: RootState): WalletConnectRequest[] => {
  return state.walletConnect.pendingRequests
}

export const selectPendingSession = (state: RootState): WalletConnectPendingSession | null => {
  return state.walletConnect.pendingSession
}

export const selectDidOpenFromDeepLink = (state: RootState): boolean => {
  return state.walletConnect.didOpenFromDeepLink ?? false
}
