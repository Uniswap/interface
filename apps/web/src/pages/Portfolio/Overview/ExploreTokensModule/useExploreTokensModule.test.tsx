import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ListTokensRequest } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { ListTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import type { PropsWithChildren } from 'react'
import { getCategoryCardTokensQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/categoryCardTokens'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useExploreTokensModule } from '~/pages/Portfolio/Overview/ExploreTokensModule/useExploreTokensModule'
import { mocked } from '~/test-utils/mocked'

const ENABLED_CHAIN_IDS = [UniverseChainId.Mainnet, UniverseChainId.Base]
const TRENDING = tokenCategory({ id: 'trending', name: 'Trending' })
const STOCKS = tokenCategory({ id: 'stocks', name: 'Stocks' })
const TOP_GAINERS = tokenCategory({
  id: 'top-gainers',
  name: 'Top Gainers',
  defaultSort: { orderBy: TokensOrderBy.PRICE_CHANGE_1D, ascending: false },
})
const DEFI = tokenCategory({ id: 'defi' })

const { listTokens, useListCategoriesQuery } = vi.hoisted(() => ({
  listTokens: vi.fn(),
  useListCategoriesQuery: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: { listTokens },
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery', () => ({
  useListCategoriesQuery,
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => ({ chains: ENABLED_CHAIN_IDS }),
}))

function renderUseExploreTokensModule(selectedCategoryId = 'trending') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0, retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(({ categoryId }) => useExploreTokensModule(categoryId), {
    wrapper,
    initialProps: { categoryId: selectedCategoryId },
  })
}

function lastRequest(): ListTokensRequest {
  return listTokens.mock.calls.at(-1)?.[0] as ListTokensRequest
}

describe(useExploreTokensModule, () => {
  beforeEach(() => {
    listTokens.mockReset()
    listTokens.mockResolvedValue(new ListTokensResponse({ multichainTokens: [] }))
    useListCategoriesQuery.mockReturnValue({ data: [DEFI, TOP_GAINERS, STOCKS, TRENDING] })
    mocked(useIsTokenCategoriesEnabled).mockReturnValue(true)
  })

  it('shows Trending, Stocks and Top Gainers chips in that order', () => {
    const { result } = renderUseExploreTokensModule()

    expect(result.current.categories.map((category) => category.id)).toEqual(['trending', 'stocks', 'top-gainers'])
  })

  it('requests Trending with the trending carousel params so the two share a cache entry', async () => {
    renderUseExploreTokensModule()

    await waitFor(() => expect(listTokens).toHaveBeenCalledTimes(1))
    expect(lastRequest()).toEqual(
      expect.objectContaining(
        getCategoryCardTokensQueryOptions({ categoryId: 'trending', chainIds: ENABLED_CHAIN_IDS }).queryKey[2],
      ),
    )
  })

  it("sorts a non-trending category by the category's default sort", async () => {
    renderUseExploreTokensModule('top-gainers')

    await waitFor(() => expect(listTokens).toHaveBeenCalledTimes(1))
    expect(lastRequest().filter).toEqual({ categoryIds: ['top-gainers'] })
    expect(lastRequest().sort).toEqual({ orderBy: TokensOrderBy.PRICE_CHANGE_1D, ascending: false })
  })

  it('falls back to Trending when the selected category is missing from ListCategories', async () => {
    useListCategoriesQuery.mockReturnValue({ data: [TRENDING, TOP_GAINERS] })

    const { result } = renderUseExploreTokensModule('stocks')

    expect(result.current.categories.map((category) => category.id)).toEqual(['trending', 'top-gainers'])
    expect(result.current.activeCategoryId).toBe('trending')
    await waitFor(() => expect(lastRequest().filter).toEqual({ categoryIds: ['trending'] }))
  })

  it('reports loading instead of the previous category tokens while a newly selected chip loads', async () => {
    listTokens.mockImplementation((request: ListTokensRequest) =>
      request.filter?.categoryIds.includes('stocks')
        ? new Promise(() => {})
        : Promise.resolve(new ListTokensResponse({ multichainTokens: [] })),
    )

    const { result, rerender } = renderUseExploreTokensModule()
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    rerender({ categoryId: 'stocks' })

    await waitFor(() => expect(lastRequest().filter).toEqual({ categoryIds: ['stocks'] }))
    expect(result.current.activeCategoryId).toBe('stocks')
    expect(result.current.isLoading).toBe(true)
  })

  it('shows Trending without chips when token categories are off', async () => {
    mocked(useIsTokenCategoriesEnabled).mockReturnValue(false)

    const { result } = renderUseExploreTokensModule()

    expect(result.current.categories).toEqual([])
    await waitFor(() => expect(lastRequest().filter).toEqual({ categoryIds: ['trending'] }))
  })
})
