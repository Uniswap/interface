import { RootState } from 'src/app/rootReducer'
import {
  WalletConnectRequest,
  WalletConnectSession,
} from 'src/features/walletConnect/walletConnectSlice'

export const selectSessions =
  (address: Nullable<string>) =>
  (state: RootState): WalletConnectSession[] => {
    if (!address || !state.walletConnect.byAccount[address]) return []

    return Object.values(state.walletConnect.byAccount[address].sessions)
  }

export const selectPendingRequests = (state: RootState): WalletConnectRequest[] => {
  return state.walletConnect.pendingRequests
}

export const selectPendingSession = (state: RootState): WalletConnectSession | null => {
  return state.walletConnect.pendingSession
}
