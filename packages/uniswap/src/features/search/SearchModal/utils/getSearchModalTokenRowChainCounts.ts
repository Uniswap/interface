import { OnchainItemListOptionType, type SearchModalOption } from 'uniswap/src/components/lists/items/types'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'

/**
 * One entry per visible search token row across all sections (results, trending, recents, etc.):
 * `1` for single-chain, `tokens.length` for multichain rows. Ignores pools, wallets, and other types.
 */
export function getSearchModalTokenRowChainCounts(
  sections: OnchainItemSection<SearchModalOption>[] | undefined,
): number[] {
  if (!sections?.length) {
    return []
  }
  const counts: number[] = []
  for (const section of sections) {
    for (const item of section.data) {
      if (item.type === OnchainItemListOptionType.MultichainToken) {
        const n = item.multichainResult.tokens.length
        counts.push(n < 1 ? 1 : n)
      } else if (item.type === OnchainItemListOptionType.Token) {
        counts.push(1)
      }
    }
  }
  return counts
}
