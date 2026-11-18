import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { TimestampedValue } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { ListTokensRequest } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { ListTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import {
  HistoryDuration,
  MultichainToken,
  TokenPriceData,
  TokenRankStats,
  TokensOrderBy,
} from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import type { PropsWithChildren } from 'react'
import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TokenSortMethod } from '~/components/Tokens/constants'
import { TimePeriod } from '~/data/util'
import type { UseListTokensOptions } from '~/features/Explore/state/listTokens/types'
import { useListTokens } from '~/features/Explore/state/listTokens/useListTokens'
import { LIST_API_PAGE_SIZE } from '~/utils/listRequestParams'

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const BRIDGED_USDC_POLYGON = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
const ENABLED_CHAIN_IDS = [UniverseChainId.Mainnet, UniverseChainId.Polygon]

const listTokens = vi.hoisted(() => vi.fn())

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: { listTokens },
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => ({ chains: ENABLED_CHAIN_IDS }),
}))

// Also the display gate (allowedChainIds): a token with no leg in this list renders no row.
vi.mock('uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds', () => ({
  useFeatureFlaggedChainIds: () => ENABLED_CHAIN_IDS,
}))

function listTokensResponse({
  multichainTokens = [],
  nextPageToken,
}: {
  multichainTokens?: RankedMultichainToken[]
  nextPageToken?: string
} = {}): ListTokensResponse {
  return new ListTokensResponse({
    multichainTokens,
    ...(nextPageToken && { page: { nextPageToken } }),
  })
}

/**
 * The shape BE actually returns for 1h price change: only `stats.priceChange1h`, with
 * `price.percentChange1h` left unset (unlike percentChange1d, which BE does populate on price).
 * Not expressible via createRankedMultichainToken, whose `priceChange1h` lands on price.
 */
function tokenWith1hChangeInStats({
  priceChange1h,
  pricePercentChange1h,
}: {
  priceChange1h: number
  pricePercentChange1h?: number
}): RankedMultichainToken {
  const token = createRankedMultichainToken({ multichainId: 'mc:1_0xABC', symbol: 'MC', address: '0xABC' })
  token.multichainToken = new MultichainToken({
    ...token.multichainToken,
    price: new TokenPriceData({ spotUsd: 1, percentChange1d: 2, percentChange1h: pricePercentChange1h }),
  })
  token.stats = new TokenRankStats({ priceChange1h })
  return token
}

// A fresh client per test: nothing cached across cases.
function renderUseListTokens(chainId?: UniverseChainId, options?: UseListTokensOptions) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(() => useListTokens(chainId, options), { wrapper })
}

/** Renders and waits for the first listTokens call, returning the request it was handed. */
async function renderAndGetRequest(options?: UseListTokensOptions, chainId?: UniverseChainId) {
  renderUseListTokens(chainId, options)
  await waitFor(() => expect(listTokens).toHaveBeenCalled())
  return listTokens.mock.calls[0]?.[0] as ListTokensRequest
}

describe('useListTokens', () => {
  beforeEach(() => {
    listTokens.mockReset()
    listTokens.mockResolvedValue(listTokensResponse())
  })

  describe('backend request params', () => {
    it('should always set sparklineDuration to DAY (required by BE)', async () => {
      const request = await renderAndGetRequest()

      expect(request.sparklineDuration).toBe(HistoryDuration.DAY)
    })

    it('should request the enabled chains and the explore page size', async () => {
      const request = await renderAndGetRequest()

      expect(request.chainIds).toEqual(ENABLED_CHAIN_IDS)
      expect(request.page).toEqual({ pageSize: LIST_API_PAGE_SIZE, pageToken: '' })
    })

    it('should narrow chainIds to the single chain when a chainId is passed', async () => {
      const request = await renderAndGetRequest(undefined, UniverseChainId.Polygon)

      expect(request.chainIds).toEqual([UniverseChainId.Polygon])
    })

    it('should pass the previous page nextPageToken as page.pageToken when loading more', async () => {
      listTokens.mockResolvedValueOnce(
        listTokensResponse({
          multichainTokens: [createRankedMultichainToken({ address: USDC })],
          nextPageToken: 'page2',
        }),
      )

      const { result } = renderUseListTokens()
      await waitFor(() => expect(result.current.hasNextPage).toBe(true))

      act(() => result.current.loadMore?.({}))

      await waitFor(() => expect(listTokens).toHaveBeenCalledTimes(2))
      expect((listTokens.mock.calls[1]?.[0] as ListTokensRequest).page).toEqual({
        pageSize: LIST_API_PAGE_SIZE,
        pageToken: 'page2',
      })
    })

    it('should include filter.categoryIds when a categoryId is set', async () => {
      const request = await renderAndGetRequest({ categoryId: 'defi' })

      expect(request.filter).toEqual({ categoryIds: ['defi'] })
    })

    it('should omit filter entirely when no categoryId is set', async () => {
      const request = await renderAndGetRequest()

      expect(request.filter).toBeUndefined()
    })

    // Callers pass optional props straight through, so an explicit `undefined` must resolve to the
    // field's default rather than overwrite it — `filterString` is dereferenced on the way to the
    // query key, and a lost `sortMethod` would silently drop the sort from the request.
    it('should treat an explicit undefined option as its default', async () => {
      const request = await renderAndGetRequest({
        filterString: undefined,
        categoryId: undefined,
        sortMethod: undefined,
      })

      expect(request.filter).toBeUndefined()
      expect(request.sort).toEqual({ orderBy: TokensOrderBy.VOLUME_1D, ascending: false })
    })

    it('should send the trimmed filterString as filter.searchQuery', async () => {
      const request = await renderAndGetRequest({ filterString: '  dai ' })

      expect(request.filter).toEqual({ searchQuery: 'dai' })
    })

    // A blank box must share the unsearched request rather than send an empty searchQuery.
    it('should omit filter entirely for a whitespace-only filterString', async () => {
      const request = await renderAndGetRequest({ filterString: '   ' })

      expect(request.filter).toBeUndefined()
    })

    it('should send filter.searchQuery alongside filter.categoryIds', async () => {
      const request = await renderAndGetRequest({ categoryId: 'defi', filterString: 'dai' })

      expect(request.filter).toEqual({ categoryIds: ['defi'], searchQuery: 'dai' })
    })

    // The query key carries the normalized search: a real change refetches, a whitespace-only edit
    // shares the existing entry.
    it('should refetch when the search changes but not for a whitespace-only edit', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
      const wrapper = ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )
      const { rerender } = renderHook((options: UseListTokensOptions) => useListTokens(undefined, options), {
        wrapper,
        initialProps: { filterString: 'usdc' },
      })
      await waitFor(() => expect(listTokens).toHaveBeenCalledTimes(1))

      rerender({ filterString: 'usdc ' })
      await act(async () => {})
      expect(listTokens).toHaveBeenCalledTimes(1)

      rerender({ filterString: 'usd' })
      await waitFor(() => expect(listTokens).toHaveBeenCalledTimes(2))
      expect((listTokens.mock.calls[1]?.[0] as ListTokensRequest).filter).toEqual({ searchQuery: 'usd' })
    })

    it('should include sort.orderBy and sort.ascending when sortMethod is PRICE', async () => {
      const request = await renderAndGetRequest({ sortMethod: TokenSortMethod.PRICE, sortAscending: true })

      expect(request.sort?.orderBy).toBe(TokensOrderBy.PRICE)
      expect(request.sort?.ascending).toBe(true)
    })

    it('should include sort.orderBy from filterTimePeriod and sort.ascending when sortMethod is VOLUME', async () => {
      const request = await renderAndGetRequest({
        sortMethod: TokenSortMethod.VOLUME,
        sortAscending: true,
        filterTimePeriod: TimePeriod.WEEK,
      })

      expect(request.sort?.orderBy).toBe(TokensOrderBy.VOLUME_7D)
      expect(request.sort?.ascending).toBe(true)
    })

    it('should include sort.orderBy and sort.ascending when sortMethod is HOUR_CHANGE', async () => {
      const request = await renderAndGetRequest({ sortMethod: TokenSortMethod.HOUR_CHANGE, sortAscending: false })

      expect(request.sort?.orderBy).toBe(TokensOrderBy.PRICE_CHANGE_1H)
      expect(request.sort?.ascending).toBe(false)
    })

    it('should include sort.orderBy and sort.ascending when sortMethod is FULLY_DILUTED_VALUATION', async () => {
      const request = await renderAndGetRequest({
        sortMethod: TokenSortMethod.FULLY_DILUTED_VALUATION,
        sortAscending: true,
      })

      expect(request.sort?.orderBy).toBe(TokensOrderBy.FDV)
      expect(request.sort?.ascending).toBe(true)
    })
  })

  describe('results', () => {
    it('should expose the response multichainTokens as topTokens and its nextPageToken as hasNextPage', async () => {
      listTokens.mockResolvedValue(
        listTokensResponse({
          multichainTokens: [
            createRankedMultichainToken({ multichainId: 'mc:1_0xABC', symbol: 'MC', address: '0xABC' }),
          ],
          nextPageToken: 'page2',
        }),
      )

      const { result } = renderUseListTokens()

      await waitFor(() => expect(result.current.topTokens).toHaveLength(1))
      expect(result.current.topTokens[0]?.multichainToken?.multichainId).toBe('mc:1_0xABC')
      expect(result.current.topTokens[0]?.multichainToken?.symbol).toBe('MC')
      expect(result.current.hasNextPage).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isError).toBe(false)
    })

    // The BE can put a nextPageToken on its final page. Following it would burn empty fetches (with
    // a spinner flash each) until the table's no-growth budget runs out, so an empty page ends the
    // list — the case a searched feed shorter than one page now hits routinely.
    it('should stop paginating on an empty page even when it carries a nextPageToken', async () => {
      listTokens.mockResolvedValue(listTokensResponse({ nextPageToken: 'page2' }))

      const { result } = renderUseListTokens(undefined, { filterString: 'zzz' })

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.topTokens).toEqual([])
      expect(result.current.hasNextPage).toBe(false)
    })

    // The BE filters and paginates a searched feed itself, so every served row is shown and
    // infinite scroll stays on — the old client-side filter froze pagination while searching.
    it('should show every served row and keep paginating while a search is active', async () => {
      listTokens.mockResolvedValue(
        listTokensResponse({
          multichainTokens: [
            createRankedMultichainToken({ multichainId: 'mc:usdc', name: 'USD Coin', symbol: 'USDC' }),
            createRankedMultichainToken({ multichainId: 'mc:weth', name: 'Wrapped Ether', symbol: 'WETH' }),
          ],
          nextPageToken: 'page2',
        }),
      )

      const { result } = renderUseListTokens(undefined, { filterString: 'usdc' })

      await waitFor(() => expect(result.current.topTokens).toHaveLength(2))
      expect(result.current.hasNextPage).toBe(true)
      expect(result.current.loadMore).toBeDefined()
    })

    it('should backfill price.percentChange1h from stats.priceChange1h when BE omits it, so consumers read one field', async () => {
      listTokens.mockResolvedValue(
        listTokensResponse({ multichainTokens: [tokenWith1hChangeInStats({ priceChange1h: 5 })] }),
      )

      const { result } = renderUseListTokens()

      await waitFor(() => expect(result.current.topTokens).toHaveLength(1))
      expect(result.current.topTokens[0]?.multichainToken?.price?.percentChange1h).toBe(5)
      // percentChange1d is already populated by BE — must not be clobbered by the backfill.
      expect(result.current.topTokens[0]?.multichainToken?.price?.percentChange1d).toBe(2)
    })

    it('should not overwrite price.percentChange1h when BE already populates it', async () => {
      listTokens.mockResolvedValue(
        listTokensResponse({
          multichainTokens: [tokenWith1hChangeInStats({ priceChange1h: 5, pricePercentChange1h: 9 })],
        }),
      )

      const { result } = renderUseListTokens()

      await waitFor(() => expect(result.current.topTokens).toHaveLength(1))
      expect(result.current.topTokens[0]?.multichainToken?.price?.percentChange1h).toBe(9)
    })
  })

  describe('price history', () => {
    it('should build priceHistoryByMultichainId and sparklines from RankedMultichainToken.sparkline', async () => {
      const token = createRankedMultichainToken({ multichainId: 'mc:1_0xABC', symbol: 'MC', address: '0xABC' })
      token.sparkline = [
        new TimestampedValue({ timestamp: 1n, value: 1.1 }),
        new TimestampedValue({ timestamp: 2n, value: 1.2 }),
      ]
      listTokens.mockResolvedValue(listTokensResponse({ multichainTokens: [token] }))

      const { result } = renderUseListTokens()

      await waitFor(() => expect(result.current.topTokens).toHaveLength(1))
      const expectedHistory = [
        { timestamp: 1, value: 1.1 },
        { timestamp: 2, value: 1.2 },
      ]
      expect(result.current.priceHistoryByMultichainId['mc:1_0xABC']).toEqual(expectedHistory)
      expect(result.current.sparklines['mc:1_0xABC']).toEqual(expectedHistory)
    })

    it('should key an ungrouped token (empty multichainId) sparkline by chainId:address', async () => {
      const token = createRankedMultichainToken({
        multichainId: '',
        symbol: 'USDC.e',
        name: 'Bridged USDC',
        chainId: UniverseChainId.Polygon,
        address: BRIDGED_USDC_POLYGON,
      })
      token.sparkline = [new TimestampedValue({ timestamp: 1n, value: 1 })]
      listTokens.mockResolvedValue(listTokensResponse({ multichainTokens: [token] }))

      const { result } = renderUseListTokens()

      await waitFor(() => expect(result.current.topTokens).toHaveLength(1))
      // The '' sentinel would collide every single onto one key; the map is
      // keyed by multichainTokenKey so each single keeps its sparkline.
      expect(result.current.priceHistoryByMultichainId[`137:${BRIDGED_USDC_POLYGON}`]).toEqual([
        { timestamp: 1, value: 1 },
      ])
      expect(result.current.sparklines[`137:${BRIDGED_USDC_POLYGON}`]).toEqual([{ timestamp: 1, value: 1 }])
    })

    it('should omit priceHistoryByMultichainId entries for tokens with an empty sparkline', async () => {
      listTokens.mockResolvedValue(
        listTokensResponse({
          multichainTokens: [createRankedMultichainToken({ multichainId: 'mc:1_0xABC', address: '0xABC' })],
        }),
      )

      const { result } = renderUseListTokens()

      await waitFor(() => expect(result.current.topTokens).toHaveLength(1))
      expect(result.current.priceHistoryByMultichainId).toEqual({})
      expect(result.current.sparklines).toEqual({})
    })
  })
})
