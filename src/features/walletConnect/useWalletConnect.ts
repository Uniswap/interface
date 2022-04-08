import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { selectPendingRequests, selectSessions } from 'src/features/walletConnect/selectors'

export function useWalletConnect(account?: string) {
  const sessionSelector = useMemo(() => selectSessions(account), [account])
  const sessions = useAppSelector(sessionSelector)

  const pendingRequests = useAppSelector(selectPendingRequests)

  return { sessions, pendingRequests }
}
