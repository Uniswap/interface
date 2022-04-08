import { RootState } from 'src/app/rootReducer'
import {
  WalletConnectRequest,
  WalletConnectSession,
} from 'src/features/walletConnect/walletConnectSlice'

export const selectSessions =
  (account?: string) =>
  (state: RootState): WalletConnectSession[] => {
    if (!account || !state.walletConnect.byAccount[account]) return []

    return Object.values(state.walletConnect.byAccount[account].sessions)
  }

export const selectPendingRequests = (state: RootState): WalletConnectRequest[] => {
  return state.walletConnect.pendingRequests
}
