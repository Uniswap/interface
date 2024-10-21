import { useEffect } from 'react'
import { ApplicationModal, setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'

export default function useAccountRiskCheck(account: string | null | undefined) {
  const dispatch = useAppDispatch()
  const { isBlocked, isBlockedLoading } = useIsBlocked(account || undefined)

  useEffect(() => {
    if (!account) {
      return
    }

    if (isBlockedLoading) {
      return
    }

    if (isBlocked) {
      dispatch(setOpenModal({ name: ApplicationModal.BLOCKED_ACCOUNT }))
    }
  }, [account, isBlockedLoading, isBlocked, dispatch])
}
