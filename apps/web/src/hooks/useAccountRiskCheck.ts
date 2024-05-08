import { useEffect } from 'react'
import { ApplicationModal, setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'

export default function useAccountRiskCheck(account: string | null | undefined) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!account) return

    // TODO: add back local browser cacheing (revisit 11/13/2023)
    const headers = new Headers({ 'Content-Type': 'application/json' })
    fetch('https://interface.gateway.uniswap.org/v1/screen', {
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
  }, [account, dispatch])
}
