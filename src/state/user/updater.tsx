import { L2_CHAIN_IDS } from 'constants/chains'
import { DEFAULT_DEADLINE_FROM_NOW, L2_DEADLINE_FROM_NOW } from 'constants/misc'
import { useActiveWeb3React } from 'hooks/web3'
import { useEffect } from 'react'
import { useAppDispatch } from 'state/hooks'

import { updateMatchesDarkMode } from './actions'
import { useUserTransactionTTL } from './hooks'

export default function Updater(): null {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  const [, setTTL] = useUserTransactionTTL()

  // keep deadline appropriate to chainId
  useEffect(() => {
    if (!chainId) {
      return
    }
    setTTL(L2_CHAIN_IDS.includes(chainId) ? L2_DEADLINE_FROM_NOW : DEFAULT_DEADLINE_FROM_NOW)
  }, [chainId, setTTL])

  // keep dark mode in sync with the system
  useEffect(() => {
    const darkHandler = (match: MediaQueryListEvent) => {
      dispatch(updateMatchesDarkMode({ matchesDarkMode: match.matches }))
    }

    const match = window?.matchMedia('(prefers-color-scheme: dark)')
    dispatch(updateMatchesDarkMode({ matchesDarkMode: match.matches }))

    if (match?.addListener) {
      match?.addListener(darkHandler)
    } else if (match?.addEventListener) {
      match?.addEventListener('change', darkHandler)
    }

    return () => {
      if (match?.removeListener) {
        match?.removeListener(darkHandler)
      } else if (match?.removeEventListener) {
        match?.removeEventListener('change', darkHandler)
      }
    }
  }, [dispatch])

  return null
}
