import type { ExploreTokenItemsResult } from 'src/components/explore/ExploreSections/useExploreTokenItems/shared'
import { useExploreTokenItems as useV2ExploreTokenItems } from 'src/components/explore/ExploreSections/useExploreTokenItems/useExploreTokenItems'
import { useV1ExploreTokenItems } from 'src/components/explore/ExploreSections/useExploreTokenItems/useV1ExploreTokenItems'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExploreOrderBy } from 'wallet/src/features/wallet/types'

export function useExploreTokenItems({
  selectedNetwork,
  isMultichainPath,
  orderBy,
  isV2TokensEnabled,
}: {
  selectedNetwork: UniverseChainId | null
  isMultichainPath: boolean
  orderBy: ExploreOrderBy
  isV2TokensEnabled: boolean
}): ExploreTokenItemsResult {
  const v1Result = useV1ExploreTokenItems({ selectedNetwork, isMultichainPath, orderBy, skip: isV2TokensEnabled })
  const v2Result = useV2ExploreTokenItems({ selectedNetwork, orderBy, skip: !isV2TokensEnabled })
  return isV2TokensEnabled ? v2Result : v1Result
}
