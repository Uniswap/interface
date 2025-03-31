import { useEffect } from 'react'
import { useUnitagsClaimEligibilityQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsClaimEligibilityQuery'
import { useUnitagUpdater } from 'uniswap/src/features/unitags/context'
import { UnitagErrorCodes } from 'uniswap/src/features/unitags/types'
import { getUniqueId } from 'utilities/src/device/getUniqueId'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'

export const useCanAddressClaimUnitag = (
  address?: Address,
  isUsernameChange?: boolean,
): { canClaimUnitag: boolean; errorCode?: UnitagErrorCodes } => {
  const { data: deviceId } = useAsyncData(getUniqueId)
  const { refetchUnitagsCounter } = useUnitagUpdater()
  const skip = !deviceId

  const { isLoading, data, refetch } = useUnitagsClaimEligibilityQuery({
    params: skip
      ? undefined
      : {
          address,
          deviceId,
          isUsernameChange,
        },
  })

  // Force refetch of canClaimUnitag if refetchUnitagsCounter changes
  useEffect(() => {
    if (skip || isLoading) {
      return
    }

    refetch().catch((error) =>
      logger.error(error, { tags: { file: 'unitags/hooks.ts', function: 'useCanAddressClaimUnitag' } }),
    )
    // Skip is included in the dependency array here bc of useAsyncData -- on mount deviceId is undefined so refetch would be skipped if not included
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchUnitagsCounter, skip])

  return {
    canClaimUnitag: !isLoading && !!data?.canClaim,
    errorCode: data?.errorCode,
  }
}
