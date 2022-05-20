import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import {
  selectModalState,
  selectPendingRequests,
  selectSessions,
} from 'src/features/walletConnect/selectors'

export function useWalletConnect(account?: string) {
  const sessionSelector = useMemo(() => selectSessions(account), [account])
  const sessions = useAppSelector(sessionSelector)
  const pendingRequests = useAppSelector(selectPendingRequests)
  const modalState = useAppSelector(selectModalState)

  return { sessions, pendingRequests, modalState }
}
