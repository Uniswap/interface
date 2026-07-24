import type { TokenSelectorListOption } from 'uniswap/src/components/lists/items/types'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { findRwaForToken, type RwaSearchIndex } from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'
import { tagOptionAsRwa } from 'uniswap/src/features/search/SearchModal/stocks/tagOptionAsRwa'
import { currencyAddress } from 'uniswap/src/utils/currencyId'

/** Sets `rwaCategory` on each single-`TokenOption` row whose (chainId, address) is in the RWA index, so the
 *  token-selector row renders its category tag. Array rows (token pills / stocks shelf) and non-matches pass
 *  through by reference; an unchanged section keeps its object identity and, if nothing matched anywhere, the
 *  original `sections` array is returned — so the virtualized list skips needless re-renders. No-op when the
 *  index is empty, so it is safe to call with the flag off (the index is empty unless the gating flag is on). */
export function tagRwaTokenSelectorSections({
  sections,
  rwaIndex,
}: {
  sections?: OnchainItemSection<TokenSelectorListOption>[]
  rwaIndex: RwaSearchIndex
}): OnchainItemSection<TokenSelectorListOption>[] | undefined {
  if (!sections || rwaIndex.byChainAddress.size === 0) {
    return sections
  }
  const next = sections.map((sectionItem) => {
    const data = sectionItem.data.map((item) => {
      // Array rows are the horizontal token pills and the stocks shelf — never individually tagged.
      // `Array.isArray` also narrows `item` to a single `TokenOption` for the lookup below.
      if (Array.isArray(item)) {
        return item
      }
      const match = findRwaForToken(rwaIndex, {
        chainId: item.currencyInfo.currency.chainId,
        address: currencyAddress(item.currencyInfo.currency),
      })
      if (!match) {
        return item
      }
      return tagOptionAsRwa({ option: item, match })
    })
    // A row was tagged iff `.map` produced a new object for it — unchanged rows keep their reference.
    const sectionChanged = data.some((item, index) => item !== sectionItem.data[index])
    return sectionChanged ? { ...sectionItem, data } : sectionItem
  })
  // Same reference check at the section level: nothing matched → keep the original array identity.
  const anyChanged = next.some((sectionItem, index) => sectionItem !== sections[index])
  return anyChanged ? next : sections
}
