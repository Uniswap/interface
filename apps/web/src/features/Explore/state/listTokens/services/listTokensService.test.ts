import { ListTokensResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { MultichainToken, TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { TokensOrderBy } from '@universe/api'
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
  return new ListTokensResponse({
    tokens: [],
    multichainTokens: [],
  })
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
      expect(result.multichainTokens[0]?.multichainId).toBe('mc:1_0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
      expect(result.multichainTokens[0]?.symbol).toBe('USDC')
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
    it('should call listTokens with multichain true and return response.multichainTokens', async () => {
      const mcToken = new MultichainToken({
        multichainId: 'mc:1_0xABC',
        symbol: 'MC',
        name: 'Multichain',
        type: TokenType.ERC20,
        projectName: '',
        logoUrl: '',
        safetyLevel: 0,
        spamCode: 0,
        chainTokens: [],
      })
      const response = new ListTokensResponse({
        tokens: [],
        multichainTokens: [mcToken],
        nextPageToken: 'page2',
      })
      const listTokens = vi.fn().mockResolvedValue(response)

      const service = createListTokensService({
        getSourceType: () => 'backend_sorted',
        getTokenStats: vi.fn(),
        listTokens,
      })

      const result = await service.getListTokens(defaultParams)

      expect(listTokens).toHaveBeenCalledTimes(1)
      const call = listTokens.mock.calls[0]?.[0]
      expect(call?.multichain).toBe(true)
      expect(result.multichainTokens).toHaveLength(1)
      expect(result.multichainTokens[0]?.multichainId).toBe('mc:1_0xABC')
      expect(result.multichainTokens[0]?.symbol).toBe('MC')
      expect(result.nextPageToken).toBe('page2')
    })
  })

  describe('backend request params', () => {
    it('should pass chainIds, pageSize, and pageToken to listTokens', async () => {
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
          pageSize: 25,
          pageToken: 'pagination-token',
          multichain: true,
        }),
      )
    })

    it('should omit orderBy and ascending when sortMethod is PRICE', async () => {
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
      expect(call.orderBy).toBeUndefined()
      expect(call.ascending).toBeUndefined()
    })

    it('should include orderBy from filterTimePeriod and ascending when sortMethod is VOLUME', async () => {
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

      const call = listTokens.mock.calls[0]?.[0] as Record<string, unknown>
      expect(call.orderBy).toBe(TokensOrderBy.VOLUME_7D)
      expect(call.ascending).toBe(true)
    })

    it('should include orderBy and ascending when sortMethod is HOUR_CHANGE', async () => {
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

      const call = listTokens.mock.calls[0]?.[0] as Record<string, unknown>
      expect(call.orderBy).toBe(TokensOrderBy.PRICE_CHANGE_1H)
      expect(call.ascending).toBe(false)
    })

    it('should include orderBy and ascending when sortMethod is FULLY_DILUTED_VALUATION', async () => {
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

      const call = listTokens.mock.calls[0]?.[0] as Record<string, unknown>
      expect(call.orderBy).toBe(TokensOrderBy.FDV)
      expect(call.ascending).toBe(true)
    })
  })
})
