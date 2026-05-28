import { useQuery } from '@tanstack/react-query'
import { useUnitagsClaimEligibilityQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsClaimEligibilityQuery'
import { uniqueIdQuery } from 'utilities/src/device/uniqueIdQuery'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export const useCanActiveAddressClaimUnitag = (
  address?: Address,
): {
  canClaimUnitag: boolean
} => {
  const activeAddress = useActiveAccountAddressWithThrow()
  const targetAddress = address ?? activeAddress

  const { data: deviceId } = useQuery(uniqueIdQuery())
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
