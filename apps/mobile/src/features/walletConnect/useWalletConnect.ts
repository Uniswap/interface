import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { MobileState } from 'src/app/mobileReducer'
import { AppModalState } from 'src/features/modals/ModalsState'
import { selectModalState } from 'src/features/modals/selectModalState'
import {
  makeSelectSessions,
  selectHasPendingSessionError,
  selectPendingRequests,
  selectPendingSession,
} from 'src/features/walletConnect/selectors'
import {
  WalletConnectPendingSession,
  WalletConnectRequest,
  WalletConnectSession,
} from 'src/features/walletConnect/walletConnectSlice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'

interface WalletConnect {
  sessions: WalletConnectSession[]
  pendingRequests: WalletConnectRequest[]
  modalState: AppModalState<ScannerModalState>
  pendingSession: WalletConnectPendingSession | null
  hasPendingSessionError: boolean
}

export function useWalletConnect(address: Maybe<string>): WalletConnect {
  const selectSessions = useMemo(() => makeSelectSessions(), [])
  const sessions = useSelector((state: MobileState) => selectSessions(state, address)) ?? []
  const pendingRequests = useSelector(selectPendingRequests)
  const modalState = useSelector(selectModalState(ModalName.WalletConnectScan))
  const pendingSession = useSelector(selectPendingSession)
  const hasPendingSessionError = useSelector(selectHasPendingSessionError)

  return { sessions, pendingRequests, modalState, pendingSession, hasPendingSessionError }
}
