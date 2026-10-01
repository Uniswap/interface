import type { SearchModalListOption } from 'uniswap/src/components/lists/items/types'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'

/** Result rows across the sections; a pill row counts each pill, and footers (View all, gaps) aren't rows. */
export function countSearchResultRows(sections: OnchainItemSection<SearchModalListOption>[] | undefined): number {
  return (sections ?? []).reduce((count, section) => count + section.data.flat().length, 0)
}
