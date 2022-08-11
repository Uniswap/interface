import { RootState } from 'src/app/rootReducer'
import { EMPTY_ARRAY } from 'src/constants/misc'
import {
  WalletConnectRequest,
  WalletConnectSession,
} from 'src/features/walletConnect/walletConnectSlice'

export const selectSessions =
  (address: NullUndefined<string>) =>
  (state: RootState): WalletConnectSession[] => {
    if (!address || !state.walletConnect.byAccount[address]) return EMPTY_ARRAY

    return Object.values(state.walletConnect.byAccount[address].sessions)
  }

export const selectPendingRequests = (state: RootState): WalletConnectRequest[] => {
  return state.walletConnect.pendingRequests
}

export const selectPendingSession = (state: RootState): WalletConnectSession | null => {
  return state.walletConnect.pendingSession
}
