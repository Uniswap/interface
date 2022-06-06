import { useEffect } from 'react'
import ReactGA from 'react-ga4'
import { ApplicationModal, setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'

export default function useAccountRiskCheck(account: string | null | undefined) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (account) {
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
            ReactGA.event({
              category: 'Address Screening',
              action: 'blocked',
              label: account,
            })
          }
        })
        .catch(() => {
          dispatch(setOpenModal(null))
        })
    }
  }, [account, dispatch])
}
