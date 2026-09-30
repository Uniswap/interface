import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ListTokensRequest } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { ListTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration, TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import type { PropsWithChildren } from 'react'
import { TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TRENDING_CAROUSEL_TOKEN_COUNT,
  useTrendingCarouselTokens,
} from '~/pages/Explore/trending/useTrendingCarouselTokens'

const ENABLED_CHAIN_IDS = [UniverseChainId.Mainnet, UniverseChainId.Base]
const TRENDING_CATEGORY_ID = 'trending'
const TRENDING = tokenCategory({ id: TRENDING_CATEGORY_ID, name: 'Trending', categoryClass: TokenCategoryClass.Market })
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

function renderUseTrendingCarouselTokens() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0, retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(() => useTrendingCarouselTokens(), { wrapper })
}

function trendingToken(index: number) {
  const address = `0x${(index + 1).toString(16).padStart(40, '0')}`
  return createRankedMultichainToken({
    multichainId: `mc:1_${address}`,
    address,
    symbol: `T${index}`,
    price: 1,
    priceChange1d: index,
    volume1d: 1_000 - index,
  })
}

describe(useTrendingCarouselTokens, () => {
  beforeEach(() => {
    listTokens.mockReset()
    listTokens.mockResolvedValue(new ListTokensResponse({ multichainTokens: [] }))
    useListCategoriesQuery.mockReturnValue({ data: [TRENDING, DEFI], isPending: false })
  })

  it('requests the trending category from ListTokens sorted by 1d volume with sparklines', async () => {
    renderUseTrendingCarouselTokens()

    await waitFor(() => expect(listTokens).toHaveBeenCalledTimes(1))
    const request = listTokens.mock.calls[0]?.[0] as ListTokensRequest
    expect(request.chainIds).toEqual(ENABLED_CHAIN_IDS)
    expect(request.page).toEqual({ pageSize: TRENDING_CAROUSEL_TOKEN_COUNT, pageToken: '' })
    expect(request.sort).toEqual({ orderBy: TokensOrderBy.VOLUME_1D, ascending: false })
    expect(request.sparklineDuration).toBe(HistoryDuration.DAY)
    expect(request.filter).toEqual({ categoryIds: [TRENDING_CATEGORY_ID] })
  })

  it('does not fetch until ListCategories resolves a trending category', () => {
    useListCategoriesQuery.mockReturnValue({ data: undefined, isPending: true })

    const { result } = renderUseTrendingCarouselTokens()

    expect(result.current.isLoading).toBe(true)
    expect(result.current.tokens).toEqual([])
    expect(listTokens).not.toHaveBeenCalled()
  })

  it('renders nothing when the taxonomy has no trending category', () => {
    useListCategoriesQuery.mockReturnValue({ data: [DEFI], isPending: false })

    const { result } = renderUseTrendingCarouselTokens()

    expect(result.current.isLoading).toBe(false)
    expect(result.current.tokens).toEqual([])
    expect(listTokens).not.toHaveBeenCalled()
  })

  it('maps the response to card items in backend order', async () => {
    const multichainTokens = Array.from({ length: TRENDING_CAROUSEL_TOKEN_COUNT }, (_, index) => trendingToken(index))
    listTokens.mockResolvedValue(new ListTokensResponse({ multichainTokens }))

    const { result } = renderUseTrendingCarouselTokens()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.tokens.map((token) => token.symbol)).toEqual(
      multichainTokens.map((token) => token.multichainToken?.symbol),
    )
    expect(result.current.tokens[0]).toMatchObject({
      chainId: UniverseChainId.Mainnet,
      address: multichainTokens[0]?.multichainToken?.addresses['1'],
      priceUsd: 1,
      pricePercentChange1d: 0,
    })
  })

  it('drops tokens that only exist on chains web does not support', async () => {
    listTokens.mockResolvedValue(
      new ListTokensResponse({
        multichainTokens: [
          createRankedMultichainToken({ addresses: { '999999': '0x6982508145454Ce325dDbE47a25d4ec3d2311933' } }),
          trendingToken(0),
        ],
      }),
    )

    const { result } = renderUseTrendingCarouselTokens()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.tokens.map((token) => token.symbol)).toEqual(['T0'])
  })
})
