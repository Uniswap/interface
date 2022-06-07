import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import {
  selectModalState,
  selectPendingRequests,
  selectPendingSession,
  selectSessions,
} from 'src/features/walletConnect/selectors'

export function useWalletConnect(address: Nullable<string>) {
  const sessionSelector = useMemo(() => selectSessions(address), [address])
  const sessions = useAppSelector(sessionSelector)
  const pendingRequests = useAppSelector(selectPendingRequests)
  const modalState = useAppSelector(selectModalState)
  const pendingSession = useAppSelector(selectPendingSession)

  return { sessions, pendingRequests, modalState, pendingSession }
}
