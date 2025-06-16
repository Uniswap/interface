import { useUnitagsClaimEligibilityQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsClaimEligibilityQuery'
import { UnitagErrorCodes } from 'uniswap/src/features/unitags/types'
import { getUniqueId } from 'utilities/src/device/getUniqueId'
import { useAsyncData } from 'utilities/src/react/hooks'

export const useCanAddressClaimUnitag = (
  address?: Address,
  isUsernameChange?: boolean,
): { canClaimUnitag: boolean; errorCode?: UnitagErrorCodes } => {
  const { data: deviceId } = useAsyncData(getUniqueId)
  const skip = !deviceId

  const { isLoading, data } = useUnitagsClaimEligibilityQuery({
    params: skip
      ? undefined
      : {
          address,
          deviceId,
          isUsernameChange,
        },
  })

  return {
    canClaimUnitag: !isLoading && !!data?.canClaim,
    errorCode: data?.errorCode,
  }
}
