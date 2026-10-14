import { SharedQueryClient } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { getRowTagCategoryId } from 'uniswap/src/data/apiClients/dataApiService/categories/getRowTagCategoryId'
import { getGetTokenQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
const CATEGORIES = [tokenCategory({ id: 'stablecoins' }), tokenCategory({ id: 'defi' })]

function seedGetToken(categoryIds: string[]): void {
  const { queryKey } = getGetTokenQueryOptions({ params: currencyIdToRestContractInput(CURRENCY_ID) })
  SharedQueryClient.setQueryData(queryKey, { token: { categoryIds } } as never)
}

describe(getRowTagCategoryId, () => {
  afterEach(() => {
    SharedQueryClient.clear()
  })

  it('returns the first passed category id without reading the cache', () => {
    seedGetToken(['defi'])
    expect(
      getRowTagCategoryId({ currencyId: CURRENCY_ID, categoryIds: ['stablecoins', 'defi'], categories: CATEGORIES }),
    ).toBe('stablecoins')
  })

  it('falls back to the cached GetToken categories', () => {
    seedGetToken(['stablecoins', 'defi'])
    expect(getRowTagCategoryId({ currencyId: CURRENCY_ID, categories: CATEGORIES })).toBe('stablecoins')
    expect(getRowTagCategoryId({ currencyId: CURRENCY_ID, categoryIds: [], categories: CATEGORIES })).toBe(
      'stablecoins',
    )
  })

  it('skips ids that are not known categories, matching the row tag', () => {
    expect(
      getRowTagCategoryId({ currencyId: CURRENCY_ID, categoryIds: ['retired', 'defi'], categories: CATEGORIES }),
    ).toBe('defi')
  })

  it('returns null when no known category is found', () => {
    expect(getRowTagCategoryId({ currencyId: CURRENCY_ID, categories: CATEGORIES })).toBeNull()
    seedGetToken([])
    expect(getRowTagCategoryId({ currencyId: CURRENCY_ID, categories: CATEGORIES })).toBeNull()
    expect(getRowTagCategoryId({ currencyId: CURRENCY_ID, categoryIds: ['stablecoins'], categories: [] })).toBeNull()
  })
})
