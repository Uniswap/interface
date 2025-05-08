import { useEffect } from 'react'
import { useUnitagsClaimEligibilityQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsClaimEligibilityQuery'
import { useUnitagUpdater } from 'uniswap/src/features/unitags/context'
import { getUniqueId } from 'utilities/src/device/getUniqueId'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export const useCanActiveAddressClaimUnitag = (
  address?: Address,
): {
  canClaimUnitag: boolean
} => {
  const activeAddress = useActiveAccountAddressWithThrow()
  const targetAddress = address ?? activeAddress

  const { data: deviceId } = useAsyncData(getUniqueId)
  const { refetchUnitagsCounter } = useUnitagUpdater()
  const skip = !deviceId

  const { isLoading, data, refetch } = useUnitagsClaimEligibilityQuery({
    params: skip
      ? undefined
      : {
          address: targetAddress,
          deviceId,
        },
  })

  // Force refetch of canClaimUnitag if refetchUnitagsCounter changes
  useEffect(() => {
    if (skip || isLoading) {
      return
    }

    refetch().catch((error) =>
      logger.error(error, { tags: { file: 'unitags/hooks.ts', function: 'useCanActiveAddressClaimUnitag' } }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchUnitagsCounter])

  return {
    canClaimUnitag: !isLoading && !!data?.canClaim,
  }
}
