import { toScreenInput, useIsBlockedAddress } from '@universe/compliance'
import { useEffect } from 'react'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { setOpenModal } from '~/state/application/reducer'
import { useAppDispatch } from '~/state/hooks'

export function useAccountRiskCheck(addresses: { evmAddress?: string; svmAddress?: string }) {
  const dispatch = useAppDispatch()
  const { isBlocked: isEvmBlocked, isBlockedLoading: isEvmBlockedLoading } = useIsBlockedAddress(
    toScreenInput(addresses.evmAddress),
  )
  const { isBlocked: isSvmBlocked, isBlockedLoading: isSvmBlockedLoading } = useIsBlockedAddress(
    toScreenInput(addresses.svmAddress),
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
