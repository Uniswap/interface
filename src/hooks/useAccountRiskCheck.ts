import ms from 'ms'
import { useEffect } from 'react'
import { ApplicationModal, setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'

export default function useAccountRiskCheck(account: string | null | undefined) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (account) {
      const riskCheckLocalStorageKey = `risk-check-${account}`
      const now = Date.now()
      try {
        // Check local browser cache
        const storedTime = localStorage.getItem(riskCheckLocalStorageKey)
        const checkExpirationTime = storedTime ? parseInt(storedTime) : now - 1
        if (checkExpirationTime < Date.now()) {
          const headers = new Headers({ 'Content-Type': 'application/json' })
          fetch('https://api.uniswap.org/v1/screen', {
            method: 'POST',
            headers,
            body: JSON.stringify({ address: account }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.block) {
                dispatch(setOpenModal(ApplicationModal.BLOCKED_ACCOUNT))
              }
            })
            .catch(() => {
              dispatch(setOpenModal(null))
            })
        }
      } finally {
        // Set item to have 1 day local cache storage
        localStorage.setItem(riskCheckLocalStorageKey, (now + ms(`1d`)).toString())
      }
    }
  }, [account, dispatch])
}
