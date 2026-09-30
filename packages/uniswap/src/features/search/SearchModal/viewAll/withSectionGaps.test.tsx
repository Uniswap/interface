import type { SearchModalListOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { withSectionGaps } from 'uniswap/src/features/search/SearchModal/viewAll/withSectionGaps'

function section(
  sectionKey: OnchainItemSectionName,
  footerElement?: JSX.Element,
): OnchainItemSection<SearchModalListOption> {
  return { sectionKey, data: [], footerElement }
}

describe('withSectionGaps', () => {
  it('spaces every section off the next, after any existing footer, leaving the last alone', () => {
    const viewAll = <></>
    const wallets = section(OnchainItemSectionName.Wallets)
    const [recents, tokens, walletsOut] =
      withSectionGaps([
        section(OnchainItemSectionName.RecentSearches),
        section(OnchainItemSectionName.Tokens, viewAll),
        wallets,
      ]) ?? []

    expect(recents?.footerElement?.props.children[0]).toBeUndefined()
    expect(tokens?.footerElement?.props.children[0]).toBe(viewAll)
    expect(walletsOut).toBe(wallets)
  })

  it('passes undefined sections through', () => {
    expect(withSectionGaps(undefined)).toBeUndefined()
  })
})
