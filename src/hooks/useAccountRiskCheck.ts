import { sendEvent } from 'components/analytics'
import ms from 'ms.macro'
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
        const storedTime = localStorage.getItem(riskCheckLocalStorageKey)
        const checkExpirationTime = storedTime ? parseInt(storedTime) : now - 1
        if (checkExpirationTime < Date.now()) {
          const headers = new Headers({ 'Content-Type': 'application/json' })
          fetch('https://screening-worker.uniswap.workers.dev', {
            method: 'POST',
            headers,
            body: JSON.stringify({ address: account }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.block) {
                dispatch(setOpenModal(ApplicationModal.BLOCKED_ACCOUNT))
                sendEvent({
                  category: 'Address Screening',
                  action: 'blocked',
                  label: account,
                })
              }
            })
            .catch(() => dispatch(setOpenModal(null)))
        }
      } finally {
        // leaving this code in place w/ a negligible cache time in case we want to increase cache time later
        localStorage.setItem(riskCheckLocalStorageKey, (now + ms`10 seconds`).toString())
      }
    }
  }, [account, dispatch])
}
