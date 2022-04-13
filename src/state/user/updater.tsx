import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useCallback, useEffect } from 'react'
import { ApplicationModal, setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'

import { updateMatchesDarkMode } from './actions'

export default function Updater(): null {
  const dispatch = useAppDispatch()

  const { account } = useActiveWeb3React()

  const checkAddressAgainstTRM = useCallback(
    async (address: string) => {
      try {
        const response = await fetch('https://screening-worker.uniswap.workers.dev', {
          method: 'POST',
          headers: { 'Content-type': 'application/json' },
          body: JSON.stringify({ address }),
        })
        const data = await response.json()
        if (data.block) {
          dispatch(setOpenModal(ApplicationModal.BLOCKED_ACCOUNT))
        }
      } catch (e) {
        dispatch(setOpenModal(null))
      }
    },
    [dispatch]
  )
  useEffect(() => {
    if (account) {
      checkAddressAgainstTRM(account)
    }
  }, [account, checkAddressAgainstTRM])

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
