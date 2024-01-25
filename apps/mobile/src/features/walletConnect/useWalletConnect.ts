import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
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
import { ModalName } from 'wallet/src/telemetry/constants'

interface WalletConnect {
  sessions: WalletConnectSession[]
  pendingRequests: WalletConnectRequest[]
  modalState: AppModalState<ScannerModalState>
  pendingSession: WalletConnectPendingSession | null
  hasPendingSessionError: boolean
}

export function useWalletConnect(address: Maybe<string>): WalletConnect {
  const selectSessions = useMemo(() => makeSelectSessions(), [])
  const sessions = useAppSelector((state) => selectSessions(state, address)) ?? []
  const pendingRequests = useAppSelector(selectPendingRequests)
  const modalState = useAppSelector(selectModalState(ModalName.WalletConnectScan))
  const pendingSession = useAppSelector(selectPendingSession)
  const hasPendingSessionError = useAppSelector(selectHasPendingSessionError)

  return { sessions, pendingRequests, modalState, pendingSession, hasPendingSessionError }
}
