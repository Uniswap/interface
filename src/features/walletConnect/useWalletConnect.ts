import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { selectModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import {
  selectPendingRequests,
  selectPendingSession,
  selectSessions,
} from 'src/features/walletConnect/selectors'

export function useWalletConnect(address: NullUndefined<string>) {
  const sessionSelector = useMemo(() => selectSessions(address), [address])
  const sessions = useAppSelector(sessionSelector)
  const pendingRequests = useAppSelector(selectPendingRequests)
  const modalState = useAppSelector(selectModalState(ModalName.WalletConnectScan))
  const pendingSession = useAppSelector(selectPendingSession)

  return { sessions, pendingRequests, modalState, pendingSession }
}
