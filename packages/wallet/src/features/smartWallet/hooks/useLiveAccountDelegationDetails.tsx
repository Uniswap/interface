import { useQuery } from '@tanstack/react-query'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_HOUR_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'
import { DelegationCheckResult } from 'wallet/src/features/smartWallet/delegation/types'
import { getAccountDelegationDetails } from 'wallet/src/features/smartWallet/delegation/utils'

export function useLiveAccountDelegationDetails({
  address,
  chainId,
}: {
  address: Address
  chainId?: number
}): DelegationCheckResult | undefined {
  const { data: delegationData } = useQuery({
    queryKey: [ReactQueryCacheKey.WalletDelegation, address, chainId],
    queryFn: () => getAccountDelegationDetails(address, chainId),
    enabled: !!chainId,
    staleTime: 1 * ONE_MINUTE_MS,
    gcTime: ONE_HOUR_MS,
  })

  return delegationData
}
