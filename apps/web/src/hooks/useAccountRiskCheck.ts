import { useEffect } from 'react'
import { setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'

export default function useAccountRiskCheck(addresses: { evmAddress?: string; svmAddress?: string }) {
  const dispatch = useAppDispatch()
  const { isBlocked: isEvmBlocked, isBlockedLoading: isEvmBlockedLoading } = useIsBlocked(
    addresses.evmAddress || undefined,
  )
  const { isBlocked: isSvmBlocked, isBlockedLoading: isSvmBlockedLoading } = useIsBlocked(
    addresses.svmAddress || undefined,
  )

  useEffect(() => {
    if (!addresses.evmAddress && !addresses.svmAddress) {
      return
    }

    if (isEvmBlockedLoading || isSvmBlockedLoading) {
      return
    }

    if (isEvmBlocked) {
      dispatch(setOpenModal({ name: ModalName.BlockedAccount, initialState: { blockedAddress: addresses.evmAddress } }))
    }

    if (isSvmBlocked) {
      dispatch(setOpenModal({ name: ModalName.BlockedAccount, initialState: { blockedAddress: addresses.svmAddress } }))
    }
  }, [
    addresses.evmAddress,
    addresses.svmAddress,
    isEvmBlocked,
    isEvmBlockedLoading,
    isSvmBlocked,
    isSvmBlockedLoading,
    dispatch,
  ])

  return isEvmBlocked ? addresses.evmAddress : isSvmBlocked ? addresses.svmAddress : undefined
}
