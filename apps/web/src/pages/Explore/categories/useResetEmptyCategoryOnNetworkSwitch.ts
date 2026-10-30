import { useEffect } from 'react'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import {
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { ExploreCategory } from '~/pages/Explore/categories/useExploreCategory'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

/**
 * Falls back to All when a network filter pick leaves the selected category empty. Deep links and history
 * navigation never set the pick, so they can still open an empty category. The returned category is already
 * All on the render that decides the reset; the URL catches up in an effect.
 */
export function useResetEmptyCategoryOnNetworkSwitch({
  category,
  setCategory,
  categories,
  isCategoryEmpty,
  scopedStatsPending,
}: {
  category: string
  setCategory: (category: string) => void
  categories: TokenCategory[]
  isCategoryEmpty: (category: TokenCategory) => boolean
  scopedStatsPending: boolean
}): { category: string; awaitingNetworkStats: boolean } {
  const chainId = useChainIdFromUrlParam()
  const categoryCheckChainId = useExploreTablesFilterStore((s) => s.categoryCheckChainId)
  const { clearCategoryCheckChainId } = useExploreTablesFilterStoreActions()
  // The pick lands in the store a render before the router moves, so match on the chain.
  const checking = categoryCheckChainId !== undefined && categoryCheckChainId === chainId
  const selectedCategory = categories.find((tokenCategory) => tokenCategory.id === category)
  const resetToAll =
    checking && !scopedStatsPending && selectedCategory !== undefined && isCategoryEmpty(selectedCategory)

  useEffect(() => {
    if (!checking || scopedStatsPending) {
      return
    }
    // Clearing before the URL reads All would render the old category for a frame.
    if (resetToAll) {
      setCategory(ExploreCategory.All)
      return
    }
    clearCategoryCheckChainId(chainId)
  }, [checking, chainId, scopedStatsPending, resetToAll, setCategory, clearCategoryCheckChainId])

  // Drop a pick abandoned before its stats land (back button, leaving the tab) so a later visit doesn't reset.
  useEffect(() => {
    if (!checking) {
      return undefined
    }
    return () => clearCategoryCheckChainId(chainId)
  }, [checking, chainId, clearCategoryCheckChainId])

  return {
    category: resetToAll ? ExploreCategory.All : category,
    awaitingNetworkStats: checking && scopedStatsPending,
  }
}
