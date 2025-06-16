import { useUnitagsClaimEligibilityQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsClaimEligibilityQuery'
import { getUniqueId } from 'utilities/src/device/getUniqueId'
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
  const skip = !deviceId

  const { isLoading, data } = useUnitagsClaimEligibilityQuery({
    params: skip
      ? undefined
      : {
          address: targetAddress,
          deviceId,
        },
  })

  return {
    canClaimUnitag: !isLoading && !!data?.canClaim,
  }
}
