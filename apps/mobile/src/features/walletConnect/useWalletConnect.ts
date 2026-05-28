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
  WalletConnectSession,
  WalletConnectSigningRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { ScannerModalState } from 'uniswap/src/components/ReceiveQRCode/constants'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

interface WalletConnect {
  sessions: WalletConnectSession[]
  pendingRequests: WalletConnectSigningRequest[]
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
