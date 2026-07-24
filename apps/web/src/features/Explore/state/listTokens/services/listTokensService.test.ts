import { TimestampedValue, TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { ListTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import {
  HistoryDuration,
  MultichainToken,
  RankedMultichainToken,
  TokenPriceData,
  TokenRankStats,
  TokensOrderBy,
} from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { describe, expect, it, vi } from 'vitest'
import { TimePeriod } from '~/appGraphql/data/util'
import { TokenSortMethod } from '~/components/Tokens/constants'
import { createListTokensService } from '~/features/Explore/state/listTokens/services/listTokensService'
import { getEffectiveListTokensOptions } from '~/features/Explore/state/listTokens/types'
import type { TokenStat } from '~/types/explore'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'

vi.mock('~/utils/params/chainParams', () => ({
  getChainIdFromChainUrlParam: vi.fn(),
}))

const mockGetChainIdFromChainUrlParam = vi.mocked(getChainIdFromChainUrlParam)

function createTokenStat(overrides: Partial<TokenStat> = {}): TokenStat {
  return {
    chain: 'ethereum',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logo: 'https://example.com/usdc.png',
    volume: { value: 1_000_000 } as TokenStat['volume'],
    project: { name: 'Circle', safetyLevel: '1', isSpam: false } as TokenStat['project'],
    ...overrides,
  } as TokenStat
}

const defaultParams = {
  chainIds: [1],
  options: getEffectiveListTokensOptions({}),
  pageSize: 10,
}

function createParams(
  overrides: {
    chainIds?: number[]
    options?: Partial<ReturnType<typeof getEffectiveListTokensOptions>>
    pageToken?: string
    pageSize?: number
  } = {},
) {
  return {
    chainIds: overrides.chainIds ?? [1],
    options: getEffectiveListTokensOptions(overrides.options),
    pageToken: overrides.pageToken,
    pageSize: overrides.pageSize ?? 10,
  }
}

function emptyBackendListResponse(): ListTokensResponse {
  return new ListTokensResponse({ multichainTokens: [] })
}

describe('createListTokensService', () => {
  beforeEach(() => {
    mockGetChainIdFromChainUrlParam.mockReturnValue(1)
  })

  describe('legacy source', () => {
    it('should return multichainTokens from getTokenStats when source is legacy', async () => {
      const stat = createTokenStat({ symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' })
      const getTokenStats = vi.fn(() => [stat])
      const listTokens = vi.fn()

      const service = createListTokensService({
        getSourceType: () => 'legacy',
        getTokenStats,
        listTokens,
      })

      const result = await service.getListTokens(defaultParams)

      expect(getTokenStats).toHaveBeenCalled()
      expect(listTokens).not.toHaveBeenCalled()
      expect(result.multichainTokens).toHaveLength(1)
      expect(result.multichainTokens[0]?.multichainToken?.multichainId).toBe(
        'mc:1_0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      )
      expect(result.multichainTokens[0]?.multichainToken?.symbol).toBe('USDC')
      expect(result.nextPageToken).toBeUndefined()
    })

    it('should return empty multichainTokens when getTokenStats returns undefined', async () => {
      const service = createListTokensService({
        getSourceType: () => 'legacy',
        getTokenStats: () => undefined,
        listTokens: vi.fn(),
      })

      const result = await service.getListTokens(defaultParams)

      expect(result.multichainTokens).toEqual([])
      expect(result.nextPageToken).toBeUndefined()
    })

    it('should return empty multichainTokens when getTokenStats returns empty array', async () => {
      const service = createListTokensService({
        getSourceType: () => 'legacy',
        getTokenStats: () => [],
        listTokens: vi.fn(),
      })

      const result = await service.getListTokens(defaultParams)

      expect(result.multichainTokens).toEqual([])
    })
  })

  describe('backend_sorted source', () => {
    it('should call listTokens and pass through response.multichainTokens (already RankedMultichainToken)', async () => {
      const ranked = new RankedMultichainToken({
        multichainToken: new MultichainToken({
          multichainId: 'mc:1_0xABC',
          symbol: 'MC',
          name: 'Multichain',
          type: TokenType.ERC20,
          addresses: { '1': '0xABC' },
        }),
      })
      const response = new ListTokensResponse({
        multichainTokens: [ranked],
        page: { nextPageToken: 'page2' },
      })
      const listTokens = vi.fn().mockResolvedValue(response)

      const service = createListTokensService({
        getSourceType: () => 'backend_sorted',
        getTokenStats: vi.fn(),
        listTokens,
      })

      const result = await service.getListTokens(defaultParams)

      expect(listTokens).toHaveBeenCalledTimes(1)
      expect(result.multichainTokens).toHaveLength(1)
      expect(result.multichainTokens[0]?.multichainToken?.multichainId).toBe('mc:1_0xABC')
      expect(result.multichainTokens[0]?.multichainToken?.symbol).toBe('MC')
      expect(result.nextPageToken).toBe('page2')
    })

    it('should backfill price.percentChange1h from stats.priceChange1h when BE omits it, so flag-on and flag-off rows read the same field', async () => {
      const ranked = new RankedMultichainToken({
        multichainToken: new MultichainToken({
          multichainId: 'mc:1_0xABC',
          symbol: 'MC',
          name: 'Multichain',
          type: TokenType.ERC20,
          addresses: { '1': '0xABC' },
          price: new TokenPriceData({ spotUsd: 1, percentChange1d: 2 }),
        }),
        stats: new TokenRankStats({ priceChange1h: 5 }),
      })
      const response = new ListTokensResponse({ multichainTokens: [ranked] })
      const listTokens = vi.fn().mockResolvedValue(response)

      const service = createListTokensService({
        getSourceType: () => 'backend_sorted',
        getTokenStats: vi.fn(),
        listTokens,
      })

      const result = await service.getListTokens(defaultParams)

      expect(result.multichainTokens[0]?.multichainToken?.price?.percentChange1h).toBe(5)
      // percentChange1d is already populated by BE — must not be clobbered by the backfill.
      expect(result.multichainTokens[0]?.multichainToken?.price?.percentChange1d).toBe(2)
    })

    it('should not overwrite price.percentChange1h when BE already populates it', async () => {
      const ranked = new RankedMultichainToken({
        multichainToken: new MultichainToken({
          multichainId: 'mc:1_0xABC',
          symbol: 'MC',
          name: 'Multichain',
          type: TokenType.ERC20,
          addresses: { '1': '0xABC' },
          price: new TokenPriceData({ spotUsd: 1, percentChange1h: 9 }),
        }),
        stats: new TokenRankStats({ priceChange1h: 5 }),
      })
      const response = new ListTokensResponse({ multichainTokens: [ranked] })
      const listTokens = vi.fn().mockResolvedValue(response)

      const service = createListTokensService({
        getSourceType: () => 'backend_sorted',
        getTokenStats: vi.fn(),
        listTokens,
      })

      const result = await service.getListTokens(defaultParams)

      expect(result.multichainTokens[0]?.multichainToken?.price?.percentChange1h).toBe(9)
    })

    it('should build priceHistoryByMultichainId from RankedMultichainToken.sparkline', async () => {
      const ranked = new RankedMultichainToken({
        multichainToken: new MultichainToken({
          multichainId: 'mc:1_0xABC',
          symbol: 'MC',
          name: 'Multichain',
          type: TokenType.ERC20,
          addresses: { '1': '0xABC' },
        }),
        sparkline: [
          new TimestampedValue({ timestamp: 1n, value: 1.1 }),
          new TimestampedValue({ timestamp: 2n, value: 1.2 }),
        ],
      })
      const response = new ListTokensResponse({ multichainTokens: [ranked] })
      const listTokens = vi.fn().mockResolvedValue(response)

      const service = createListTokensService({
        getSourceType: () => 'backend_sorted',
        getTokenStats: vi.fn(),
        listTokens,
      })

      const result = await service.getListTokens(defaultParams)

      expect(result.priceHistoryByMultichainId['mc:1_0xABC']).toEqual([
        { timestamp: 1, value: 1.1 },
        { timestamp: 2, value: 1.2 },
      ])
    })

    it('should omit priceHistoryByMultichainId entries for tokens with an empty sparkline', async () => {
      const ranked = new RankedMultichainToken({
        multichainToken: new MultichainToken({
          multichainId: 'mc:1_0xABC',
          symbol: 'MC',
          name: 'Multichain',
          type: TokenType.ERC20,
          addresses: { '1': '0xABC' },
        }),
      })
      const response = new ListTokensResponse({ multichainTokens: [ranked] })
      const listTokens = vi.fn().mockResolvedValue(response)

      const service = createListTokensService({
        getSourceType: () => 'backend_sorted',
        getTokenStats: vi.fn(),
        listTokens,
      })

      const result = await service.getListTokens(defaultParams)

      expect(result.priceHistoryByMultichainId).toEqual({})
    })
  })

  describe('backend request params', () => {
    it('should always set sparklineDuration to DAY (required by BE)', async () => {
      const listTokens = vi.fn().mockResolvedValue(emptyBackendListResponse())
      const service = createListTokensService({
        getSourceType: () => 'backend_sorted',
        getTokenStats: vi.fn(),
        listTokens,
      })

      await service.getListTokens(defaultParams)

      expect(listTokens).toHaveBeenCalledWith(expect.objectContaining({ sparklineDuration: HistoryDuration.DAY }))
    })

    it('should pass chainIds and nested page.pageSize/page.pageToken to listTokens', async () => {
      const listTokens = vi.fn().mockResolvedValue(emptyBackendListResponse())
      const service = createListTokensService({
        getSourceType: () => 'backend_sorted',
        getTokenStats: vi.fn(),
        listTokens,
      })

      await service.getListTokens(
        createParams({
          chainIds: [1, 8453],
          pageSize: 25,
          pageToken: 'pagination-token',
        }),
      )

      expect(listTokens).toHaveBeenCalledWith(
        expect.objectContaining({
          chainIds: [1, 8453],
          page: { pageSize: 25, pageToken: 'pagination-token' },
        }),
      )
    })

    it('should omit sort when sortMethod is PRICE', async () => {
      const listTokens = vi.fn().mockResolvedValue(emptyBackendListResponse())
      const service = createListTokensService({
        getSourceType: () => 'backend_sorted',
        getTokenStats: vi.fn(),
        listTokens,
      })

      await service.getListTokens(
        createParams({
          options: { sortMethod: TokenSortMethod.PRICE, sortAscending: true },
        }),
      )

      const call = listTokens.mock.calls[0]?.[0] as Record<string, unknown>
      expect(call.sort).toBeUndefined()
    })

    it('should include sort.orderBy from filterTimePeriod and sort.ascending when sortMethod is VOLUME', async () => {
      const listTokens = vi.fn().mockResolvedValue(emptyBackendListResponse())
      const service = createListTokensService({
        getSourceType: () => 'backend_sorted',
        getTokenStats: vi.fn(),
        listTokens,
      })

      await service.getListTokens(
        createParams({
          options: {
            sortMethod: TokenSortMethod.VOLUME,
            sortAscending: true,
            filterTimePeriod: TimePeriod.WEEK,
          },
        }),
      )

      const call = listTokens.mock.calls[0]?.[0] as { sort?: { orderBy?: TokensOrderBy; ascending?: boolean } }
      expect(call.sort?.orderBy).toBe(TokensOrderBy.VOLUME_7D)
      expect(call.sort?.ascending).toBe(true)
    })

    it('should include sort.orderBy and sort.ascending when sortMethod is HOUR_CHANGE', async () => {
      const listTokens = vi.fn().mockResolvedValue(emptyBackendListResponse())
      const service = createListTokensService({
        getSourceType: () => 'backend_sorted',
        getTokenStats: vi.fn(),
        listTokens,
      })

      await service.getListTokens(
        createParams({
          options: {
            sortMethod: TokenSortMethod.HOUR_CHANGE,
            sortAscending: false,
          },
        }),
      )

      const call = listTokens.mock.calls[0]?.[0] as { sort?: { orderBy?: TokensOrderBy; ascending?: boolean } }
      expect(call.sort?.orderBy).toBe(TokensOrderBy.PRICE_CHANGE_1H)
      expect(call.sort?.ascending).toBe(false)
    })

    it('should include sort.orderBy and sort.ascending when sortMethod is FULLY_DILUTED_VALUATION', async () => {
      const listTokens = vi.fn().mockResolvedValue(emptyBackendListResponse())
      const service = createListTokensService({
        getSourceType: () => 'backend_sorted',
        getTokenStats: vi.fn(),
        listTokens,
      })

      await service.getListTokens(
        createParams({
          options: {
            sortMethod: TokenSortMethod.FULLY_DILUTED_VALUATION,
            sortAscending: true,
          },
        }),
      )

      const call = listTokens.mock.calls[0]?.[0] as { sort?: { orderBy?: TokensOrderBy; ascending?: boolean } }
      expect(call.sort?.orderBy).toBe(TokensOrderBy.FDV)
      expect(call.sort?.ascending).toBe(true)
    })
  })
})
