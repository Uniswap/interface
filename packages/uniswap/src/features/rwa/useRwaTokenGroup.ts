import { useMemo } from 'react'
import {
  mapTokenGroupToRwaData,
  type TokenGroupRwaData,
} from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/mapTokenGroupToRwaData'
import {
  type TokenGroupMember,
  useGetTokenGroupQuery,
} from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/useGetTokenGroupQuery'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'

/**
 * `tokenGroup` is undefined for an ungrouped token (NOT_FOUND), without a subject (natives have no group),
 * or while `isLoading`, which is true only while an enabled lookup is in flight.
 */
export function useRwaTokenGroup({
  subject,
  enabled = true,
}: {
  subject: TokenGroupMember | undefined
  enabled?: boolean
}): { tokenGroup: TokenGroupRwaData | undefined; isLoading: boolean } {
  const { chains: enabledChainIds } = useEnabledChains()
  const { data: response, isLoading } = useGetTokenGroupQuery({ member: subject, enabled })

  const tokenGroup = useMemo(
    () => (response && subject ? mapTokenGroupToRwaData({ response, subject, enabledChainIds }) : undefined),
    [response, subject, enabledChainIds],
  )

  return { tokenGroup, isLoading: enabled && isLoading }
}
