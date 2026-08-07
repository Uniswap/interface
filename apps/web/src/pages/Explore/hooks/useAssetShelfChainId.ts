import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useExploreParams } from '~/features/Explore/hooks/useExploreParams'
import { ExploreTab } from '~/types/explore'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

/** URL chain filter scoped to the stocks shelf: only the Tokens tab's network filter applies — other tabs' filters target their own tables. */
export function useAssetShelfChainId(): UniverseChainId | undefined {
  const { tab } = useExploreParams()
  const chainId = useChainIdFromUrlParam()
  const isTokensTab = !tab || tab === ExploreTab.Tokens
  return isTokensTab ? chainId : undefined
}
