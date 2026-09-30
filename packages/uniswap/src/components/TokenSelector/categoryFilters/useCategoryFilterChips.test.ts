import { OnchainItemListOptionType, type TokenOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useCategoryFilterChips } from 'uniswap/src/components/TokenSelector/categoryFilters/useCategoryFilterChips'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { currencyInfo } from 'uniswap/src/test/fixtures/wallet/currencies'
import { act, renderHook } from 'uniswap/src/test/test-utils'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsTokenCategoriesEnabled: () => true,
  useIsV2EndpointsSearchEnabled: () => true,
  useDynamicConfigValue: ({ defaultValue }: { defaultValue: unknown }) => defaultValue,
}))
vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useAllTokenCategories', () => ({
  useAllTokenCategories: () => ({
    categories: [tokenCategory({ id: 'stocks', name: 'Stocks' }), tokenCategory({ id: 'memes', name: 'Memes' })],
    isLoading: false,
  }),
}))

function section(...categoryIdLists: string[][]): OnchainItemSection<TokenOption>[] {
  return [
    {
      sectionKey: OnchainItemSectionName.SearchResults,
      data: categoryIdLists.map((categoryIds, index) => ({
        type: OnchainItemListOptionType.Token,
        currencyInfo: currencyInfo({ currencyId: `token-${index}`, categoryIds }),
        quantity: null,
        balanceUSD: null,
      })),
    },
  ]
}

const withStocks = section(['stocks'], ['memes'])
const memesOnly = section(['memes'])

describe('useCategoryFilterChips', () => {
  it('keeps a selection across the loading frame but drops it once its chip leaves the result set', () => {
    const { result, rerender } = renderHook(
      (sections: OnchainItemSection<TokenOption>[]) =>
        useCategoryFilterChips({ sections, isLoading: false, isBalancesOnlySearch: false }),
      { initialProps: [withStocks] },
    )

    act(() => result.current.toggleChip('stocks'))
    expect(result.current.activeIds).toEqual(['stocks'])

    // Every new query passes through an empty loading frame before its results land.
    rerender([[]])
    expect(result.current.chips).toEqual([])
    rerender([withStocks])
    expect(result.current.activeIds).toEqual(['stocks'])

    rerender([[]])
    rerender([memesOnly])
    expect(result.current.chips.map((chip) => chip.id)).toEqual(['memes'])
    expect(result.current.activeIds).toEqual([])

    rerender([withStocks])
    expect(result.current.chips.map((chip) => chip.id)).toEqual(['stocks', 'memes'])
    expect(result.current.activeIds).toEqual([])
  })
})
