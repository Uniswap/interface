import { useEffect } from 'react'
import { setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
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
      dispatch(setOpenModal({ name: ModalName.BlockedAccount }))
    }
  }, [account, isBlockedLoading, isBlocked, dispatch])
}
