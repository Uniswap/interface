import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { AppModalState, selectModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import {
  selectPendingRequests,
  selectPendingSession,
  selectSessions,
} from 'src/features/walletConnect/selectors'
import {
  WalletConnectRequest,
  WalletConnectSession,
} from 'src/features/walletConnect/walletConnectSlice'

interface WalletConnect {
  sessions: WalletConnectSession[]
  pendingRequests: WalletConnectRequest[]
  modalState: AppModalState<ScannerModalState>
  pendingSession: WalletConnectSession | null
}

export function useWalletConnect(address: NullUndefined<string>): WalletConnect {
  const sessionSelector = useMemo(() => selectSessions(address), [address])
  const sessions = useAppSelector(sessionSelector)
  const pendingRequests = useAppSelector(selectPendingRequests)
  const modalState = useAppSelector(selectModalState(ModalName.WalletConnectScan))
  const pendingSession = useAppSelector(selectPendingSession)

  return { sessions, pendingRequests, modalState, pendingSession }
}
