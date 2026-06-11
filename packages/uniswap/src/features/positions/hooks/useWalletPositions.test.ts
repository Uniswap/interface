import { ConnectError } from '@connectrpc/connect'
import { Position as RestPosition } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useWalletPositions } from 'uniswap/src/features/positions/hooks/useWalletPositions'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockUseGetPositionsInfiniteQuery,
  mockUseEnabledChains,
  mockUsePositionVisibilityCheck,
  mockParseRestPosition,
} = vi.hoisted(() => ({
  mockUseGetPositionsInfiniteQuery: vi.fn(),
  mockUseEnabledChains: vi.fn(),
  mockUsePositionVisibilityCheck: vi.fn(),
  mockParseRestPosition: vi.fn(),
}))

vi.mock('uniswap/src/data/rest/getPositions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/rest/getPositions')>()),
  useGetPositionsInfiniteQuery: mockUseGetPositionsInfiniteQuery,
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('uniswap/src/features/visibility/hooks/usePositionVisibilityCheck', () => ({
  usePositionVisibilityCheck: mockUsePositionVisibilityCheck,
}))

vi.mock('uniswap/src/features/positions/parseRestPosition', () => ({
  parseRestPosition: mockParseRestPosition,
}))

// ---------- Test fixtures ----------

const ACCOUNT = '0xUser'
const DEFAULT_CHAINS = [UniverseChainId.Mainnet, UniverseChainId.Optimism]

const restPosition = (id: string): RestPosition => ({ id }) as unknown as RestPosition

const positionInfo = (id: string, overrides: Partial<PositionInfo> = {}): PositionInfo =>
  ({
    poolId: `pool-${id}`,
    tokenId: id,
    chainId: UniverseChainId.Mainnet,
    isHidden: false,
    ...overrides,
  }) as PositionInfo

const queryStateFor = (
  positions: RestPosition[],
  overrides: Partial<ReturnType<typeof mockUseGetPositionsInfiniteQuery>> = {},
): ReturnType<typeof mockUseGetPositionsInfiniteQuery> => ({
  data: { pages: [{ positions, nextPageToken: '' }], pageParams: [undefined] },
  isLoading: false,
  isFetching: false,
  isFetchingNextPage: false,
  isPlaceholderData: false,
  hasNextPage: false,
  error: null,
  refetch: vi.fn(),
  fetchNextPage: vi.fn().mockResolvedValue({ data: undefined }),
  ...overrides,
})

describe('useWalletPositions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEnabledChains.mockReturnValue({ chains: DEFAULT_CHAINS })
    // Default: every position is visible.
    mockUsePositionVisibilityCheck.mockReturnValue(() => true)
    // Default: identity parse - RestPosition with `id` becomes a PositionInfo with that tokenId.
    mockParseRestPosition.mockImplementation((rest?: RestPosition) => {
      if (!rest) {
        return undefined
      }
      const id = (rest as unknown as { id: string }).id
      return positionInfo(id)
    })
    mockUseGetPositionsInfiniteQuery.mockReturnValue(queryStateFor([]))
  })

  describe('query enable/disable', () => {
    it('disables the underlying query when account is empty', () => {
      renderHookWithProviders(() => useWalletPositions({ account: '' }))

      expect(mockUseGetPositionsInfiniteQuery).toHaveBeenCalledWith(expect.any(Object), {
        disabled: true,
        refetchInterval: undefined,
      })
    })

    it('enables the underlying query when account is provided', () => {
      renderHookWithProviders(() => useWalletPositions({ account: ACCOUNT }))

      expect(mockUseGetPositionsInfiniteQuery).toHaveBeenCalledWith(expect.any(Object), {
        disabled: false,
        refetchInterval: undefined,
      })
    })

    it('disables the underlying query when `disabled` is true even with an account', () => {
      renderHookWithProviders(() => useWalletPositions({ account: ACCOUNT, disabled: true }))

      expect(mockUseGetPositionsInfiniteQuery).toHaveBeenCalledWith(expect.any(Object), {
        disabled: true,
        refetchInterval: undefined,
      })
    })

    it('forwards `pollInterval` to the underlying query as `refetchInterval`', () => {
      renderHookWithProviders(() => useWalletPositions({ account: ACCOUNT, pollInterval: 60_000 }))

      expect(mockUseGetPositionsInfiniteQuery).toHaveBeenCalledWith(expect.any(Object), {
        disabled: false,
        refetchInterval: 60_000,
      })
    })
  })

  describe('chain id resolution', () => {
    it('passes the provided chainIds through to the underlying query', () => {
      const chainIds = [UniverseChainId.Base]
      renderHookWithProviders(() => useWalletPositions({ account: ACCOUNT, chainIds }))

      const [input] = mockUseGetPositionsInfiniteQuery.mock.calls[0]!
      expect(input.chainIds).toEqual(chainIds)
    })

    it('falls back to enabled EVM chains when chainIds is omitted', () => {
      renderHookWithProviders(() => useWalletPositions({ account: ACCOUNT }))

      const [input] = mockUseGetPositionsInfiniteQuery.mock.calls[0]!
      expect(input.chainIds).toEqual(DEFAULT_CHAINS)
    })
  })

  describe('query input forwarding', () => {
    it('forwards address, includeHidden, pageSize, statuses, protocolVersions to the query', () => {
      const customParams = {
        account: ACCOUNT,
        includeHidden: true,
        pageSize: 50,
      }
      renderHookWithProviders(() => useWalletPositions(customParams))

      const [input] = mockUseGetPositionsInfiniteQuery.mock.calls[0]!
      expect(input).toMatchObject({
        address: ACCOUNT,
        includeHidden: true,
        pageSize: 50,
        pageToken: '',
      })
      // Defaults applied.
      expect(input.protocolVersions).toBeDefined()
      expect(input.protocolVersions.length).toBeGreaterThan(0)
      expect(input.positionStatuses).toBeDefined()
    })
  })

  describe('parse + partition', () => {
    it('parses positions and treats them all as visible by default', () => {
      mockUseGetPositionsInfiniteQuery.mockReturnValue(queryStateFor([restPosition('a'), restPosition('b')]))

      const { result } = renderHookWithProviders(() => useWalletPositions({ account: ACCOUNT }))

      expect(result.current.positions).toHaveLength(2)
      expect(result.current.positions.map((p) => p.tokenId)).toEqual(['a', 'b'])
      expect(result.current.hiddenPositions).toHaveLength(0)
      expect(result.current.allPositions).toHaveLength(2)
    })

    it('partitions visible vs hidden using the visibility check', () => {
      mockUsePositionVisibilityCheck.mockReturnValue(({ tokenId }: { tokenId?: string }) => tokenId !== 'b')
      mockUseGetPositionsInfiniteQuery.mockReturnValue(
        queryStateFor([restPosition('a'), restPosition('b'), restPosition('c')]),
      )

      const { result } = renderHookWithProviders(() => useWalletPositions({ account: ACCOUNT }))

      expect(result.current.positions.map((p) => p.tokenId)).toEqual(['a', 'c'])
      expect(result.current.hiddenPositions.map((p) => p.tokenId)).toEqual(['b'])
      expect(result.current.allPositions.map((p) => p.tokenId)).toEqual(['a', 'b', 'c'])
    })

    it('passes poolId/tokenId/chainId/isFlaggedSpam to the visibility check', () => {
      const visibilityCheck = vi.fn().mockReturnValue(true)
      mockUsePositionVisibilityCheck.mockReturnValue(visibilityCheck)
      mockParseRestPosition.mockReturnValue(
        positionInfo('a', { isHidden: true, chainId: UniverseChainId.Optimism, poolId: 'pool-X' }),
      )
      mockUseGetPositionsInfiniteQuery.mockReturnValue(queryStateFor([restPosition('a')]))

      renderHookWithProviders(() => useWalletPositions({ account: ACCOUNT }))

      expect(visibilityCheck).toHaveBeenCalledWith({
        poolId: 'pool-X',
        tokenId: 'a',
        chainId: UniverseChainId.Optimism,
        isFlaggedSpam: true,
      })
    })

    it('filters out positions that fail to parse (parseRestPosition returns undefined)', () => {
      mockParseRestPosition.mockImplementation((rest?: RestPosition) => {
        if (!rest) {
          return undefined
        }
        const id = (rest as unknown as { id: string }).id
        return id === 'bad' ? undefined : positionInfo(id)
      })
      mockUseGetPositionsInfiniteQuery.mockReturnValue(
        queryStateFor([restPosition('a'), restPosition('bad'), restPosition('c')]),
      )

      const { result } = renderHookWithProviders(() => useWalletPositions({ account: ACCOUNT }))

      expect(result.current.positions.map((p) => p.tokenId)).toEqual(['a', 'c'])
      expect(result.current.allPositions.map((p) => p.tokenId)).toEqual(['a', 'c'])
    })

    it('flattens positions across multiple pages', () => {
      mockUseGetPositionsInfiniteQuery.mockReturnValue({
        ...queryStateFor([]),
        data: {
          pages: [
            { positions: [restPosition('a'), restPosition('b')], nextPageToken: 'page2' },
            { positions: [restPosition('c')], nextPageToken: '' },
          ],
          pageParams: [undefined, 'page2'],
        },
      })

      const { result } = renderHookWithProviders(() => useWalletPositions({ account: ACCOUNT }))

      expect(result.current.allPositions.map((p) => p.tokenId)).toEqual(['a', 'b', 'c'])
    })
  })

  describe('auto-drain pages', () => {
    it('auto-fetches the next page when hasNextPage is true (default behavior)', () => {
      const fetchNextPage = vi.fn().mockResolvedValue({ data: undefined })
      mockUseGetPositionsInfiniteQuery.mockReturnValue(queryStateFor([], { hasNextPage: true, fetchNextPage }))

      renderHookWithProviders(() => useWalletPositions({ account: ACCOUNT }))

      expect(fetchNextPage).toHaveBeenCalledTimes(1)
    })

    it('does NOT auto-fetch when autoFetchAllPages is false', () => {
      const fetchNextPage = vi.fn()
      mockUseGetPositionsInfiniteQuery.mockReturnValue(queryStateFor([], { hasNextPage: true, fetchNextPage }))

      renderHookWithProviders(() =>
        useWalletPositions({
          account: ACCOUNT,
          autoFetchAllPages: false,
        }),
      )

      expect(fetchNextPage).not.toHaveBeenCalled()
    })

    it('does NOT auto-fetch when there is no next page', () => {
      const fetchNextPage = vi.fn()
      mockUseGetPositionsInfiniteQuery.mockReturnValue(queryStateFor([], { hasNextPage: false, fetchNextPage }))

      renderHookWithProviders(() => useWalletPositions({ account: ACCOUNT }))

      expect(fetchNextPage).not.toHaveBeenCalled()
    })

    it('does NOT auto-fetch while a next-page fetch is already in flight', () => {
      const fetchNextPage = vi.fn()
      mockUseGetPositionsInfiniteQuery.mockReturnValue(
        queryStateFor([], { hasNextPage: true, isFetchingNextPage: true, fetchNextPage }),
      )

      renderHookWithProviders(() => useWalletPositions({ account: ACCOUNT }))

      expect(fetchNextPage).not.toHaveBeenCalled()
    })

    it('does NOT auto-fetch while a refetch is in flight', () => {
      const fetchNextPage = vi.fn()
      mockUseGetPositionsInfiniteQuery.mockReturnValue(
        queryStateFor([], { hasNextPage: true, isFetching: true, fetchNextPage }),
      )

      renderHookWithProviders(() => useWalletPositions({ account: ACCOUNT }))

      expect(fetchNextPage).not.toHaveBeenCalled()
    })

    it('does NOT auto-fetch after an error (no retry loop)', () => {
      const fetchNextPage = vi.fn()
      mockUseGetPositionsInfiniteQuery.mockReturnValue(
        queryStateFor([], {
          hasNextPage: true,
          error: new ConnectError('boom'),
          fetchNextPage,
        }),
      )

      renderHookWithProviders(() => useWalletPositions({ account: ACCOUNT }))

      expect(fetchNextPage).not.toHaveBeenCalled()
    })

    it('does NOT auto-fetch when the query is disabled (empty account)', () => {
      const fetchNextPage = vi.fn()
      mockUseGetPositionsInfiniteQuery.mockReturnValue(queryStateFor([], { hasNextPage: true, fetchNextPage }))

      renderHookWithProviders(() => useWalletPositions({ account: '' }))

      expect(fetchNextPage).not.toHaveBeenCalled()
    })
  })

  describe('forwarded React Query state', () => {
    it('returns hasData=false when the query has not yet returned data', () => {
      mockUseGetPositionsInfiniteQuery.mockReturnValue({
        ...queryStateFor([]),
        data: undefined,
      })

      const { result } = renderHookWithProviders(() => useWalletPositions({ account: ACCOUNT }))

      expect(result.current.hasData).toBe(false)
      expect(result.current.allPositions).toHaveLength(0)
    })

    it('returns hasData=true once the first response has arrived (even if positions empty)', () => {
      mockUseGetPositionsInfiniteQuery.mockReturnValue(queryStateFor([]))

      const { result } = renderHookWithProviders(() => useWalletPositions({ account: ACCOUNT }))

      expect(result.current.hasData).toBe(true)
    })

    it('forwards error, isPlaceholderData, hasNextPage, and refetch from the underlying query', () => {
      const refetch = vi.fn()
      const error = new ConnectError('boom')
      mockUseGetPositionsInfiniteQuery.mockReturnValue(
        queryStateFor([], {
          isPlaceholderData: true,
          hasNextPage: true,
          error,
          refetch,
          // override autoFetch path with isFetching so the auto-drain doesn't fire here
          isFetching: true,
        }),
      )

      const { result } = renderHookWithProviders(() => useWalletPositions({ account: ACCOUNT }))

      expect(result.current.error).toBe(error)
      expect(result.current.isPlaceholderData).toBe(true)
      expect(result.current.hasNextPage).toBe(true)
      expect(result.current.refetch).toBe(refetch)
    })
  })
})
