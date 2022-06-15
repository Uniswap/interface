import { RootState } from 'src/app/rootReducer'
import { WalletConnectModalState } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import { AppModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
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

export const selectModalState = (state: RootState): AppModalState<WalletConnectModalState> => {
  return state.modals[ModalName.WalletConnectScan]
}

export const selectPendingSession = (state: RootState): WalletConnectSession | null => {
  return state.walletConnect.pendingSession
}
