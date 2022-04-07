import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { selectSessions } from 'src/features/walletConnect/selectors'

export function useWalletConnect(account?: string) {
  const sessionSelector = useMemo(() => selectSessions(account), [account])
  const sessions = useAppSelector(sessionSelector)

  return { sessions }
}
