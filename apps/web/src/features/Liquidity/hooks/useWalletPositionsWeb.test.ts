import { ConnectError } from '@connectrpc/connect'
import { renderHook } from '@testing-library/react'
import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { useWalletPositionsWeb } from '~/features/Liquidity/hooks/useWalletPositionsWeb'

const {
  mockUseWalletPositions,
  mockUseRequestPositionsForSavedPairs,
  mockUsePositionVisibilityCheck,
  mockUsePendingLPTransactionsChangeListener,
  mockUseEnabledChains,
  mockParseRestPosition,
} = vi.hoisted(() => ({
  mockUseWalletPositions: vi.fn(),
  mockUseRequestPositionsForSavedPairs: vi.fn(),
  mockUsePositionVisibilityCheck: vi.fn(),
  mockUsePendingLPTransactionsChangeListener: vi.fn(),
  mockUseEnabledChains: vi.fn(),
  mockParseRestPosition: vi.fn(),
}))

vi.mock('uniswap/src/features/positions/hooks/useWalletPositions', () => ({
  useWalletPositions: mockUseWalletPositions,
}))

vi.mock('~/state/user/hooks', () => ({
  useRequestPositionsForSavedPairs: mockUseRequestPositionsForSavedPairs,
}))

vi.mock('uniswap/src/features/visibility/hooks/usePositionVisibilityCheck', () => ({
  usePositionVisibilityCheck: mockUsePositionVisibilityCheck,
}))

vi.mock('~/state/transactions/hooks', () => ({
  usePendingLPTransactionsChangeListener: mockUsePendingLPTransactionsChangeListener,
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('uniswap/src/features/positions/parseRestPosition', () => ({
  parseRestPosition: mockParseRestPosition,
}))

// ---------- Test fixtures ----------

const ADDRESS = '0xUser'
const FALLBACK_CHAINS = [UniverseChainId.Mainnet, UniverseChainId.Optimism]
const DEFAULT_VERSIONS = [ProtocolVersion.V4, ProtocolVersion.V3, ProtocolVersion.V2]
const DEFAULT_STATUSES = [PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE]

const positionInfo = (id: string, overrides: Partial<PositionInfo> = {}): PositionInfo =>
  ({
    poolId: `pool-${id}`,
    tokenId: id,
    chainId: UniverseChainId.Mainnet,
    isHidden: false,
    ...overrides,
  }) as PositionInfo

interface SavedPositionPayload {
  chainId?: UniverseChainId
  status?: PositionStatus
  protocolVersion?: ProtocolVersion
  tokenId?: string
  poolId?: string
}

interface SavedPositionEntry {
  data?: { position?: SavedPositionPayload }
}

const savedEntry = (overrides: SavedPositionPayload): SavedPositionEntry => ({
  data: {
    position: {
      chainId: UniverseChainId.Mainnet,
      status: PositionStatus.IN_RANGE,
      protocolVersion: ProtocolVersion.V3,
      ...overrides,
    },
  },
})

const walletPositionsResultFor = (
  allPositions: PositionInfo[] = [],
  overrides: Partial<ReturnType<typeof mockUseWalletPositions>> = {},
): ReturnType<typeof mockUseWalletPositions> => ({
  positions: allPositions,
  hiddenPositions: [],
  allPositions,
  hasData: true,
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

const baseParams = {
  address: ADDRESS,
  chainFilter: null,
  versionFilter: DEFAULT_VERSIONS,
  statusFilter: DEFAULT_STATUSES,
}

describe('useWalletPositionsWeb', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseWalletPositions.mockReturnValue(walletPositionsResultFor([]))
    mockUseRequestPositionsForSavedPairs.mockReturnValue([])
    mockUsePositionVisibilityCheck.mockReturnValue(() => true)
    mockUseEnabledChains.mockReturnValue({ chains: FALLBACK_CHAINS })
    // Identity-ish parse: a minimal saved-position payload becomes a PositionInfo using its tokenId.
    mockParseRestPosition.mockImplementation((rest?: SavedPositionPayload) => {
      if (!rest) {
        return undefined
      }
      return positionInfo(rest.tokenId ?? 'saved', {
        poolId: rest.poolId ?? `pool-${rest.tokenId ?? 'saved'}`,
      })
    })
  })

  describe('query input forwarding', () => {
    it('forwards address ?? "" and constants (includeHidden, autoFetchAllPages, pageSize) to useWalletPositions', () => {
      renderHook(() => useWalletPositionsWeb(baseParams))

      expect(mockUseWalletPositions).toHaveBeenCalledWith(
        expect.objectContaining({
          account: ADDRESS,
          includeHidden: true,
          autoFetchAllPages: false,
          pageSize: 25,
          protocolVersions: DEFAULT_VERSIONS,
          statuses: DEFAULT_STATUSES,
        }),
      )
    })

    it('forwards account as empty string when address is undefined (preserves disconnected behavior)', () => {
      renderHook(() => useWalletPositionsWeb({ ...baseParams, address: undefined }))

      expect(mockUseWalletPositions).toHaveBeenCalledWith(expect.objectContaining({ account: '' }))
    })

    it('chainIds falls back to enabled EVM chains when chainFilter is null', () => {
      renderHook(() => useWalletPositionsWeb(baseParams))

      expect(mockUseWalletPositions).toHaveBeenCalledWith(expect.objectContaining({ chainIds: FALLBACK_CHAINS }))
    })

    it('uses enabled-chains hook with platform: EVM', () => {
      renderHook(() => useWalletPositionsWeb(baseParams))

      expect(mockUseEnabledChains).toHaveBeenCalledWith(expect.objectContaining({ platform: Platform.EVM }))
    })

    it('chainIds equals [chainFilter] when chainFilter is set', () => {
      renderHook(() => useWalletPositionsWeb({ ...baseParams, chainFilter: UniverseChainId.Base }))

      expect(mockUseWalletPositions).toHaveBeenCalledWith(expect.objectContaining({ chainIds: [UniverseChainId.Base] }))
    })
  })

  describe('partition + visibility', () => {
    it('partitions visible vs hidden via the visibility check', () => {
      mockUseWalletPositions.mockReturnValue(
        walletPositionsResultFor([positionInfo('a'), positionInfo('b'), positionInfo('c')]),
      )
      mockUsePositionVisibilityCheck.mockReturnValue(({ tokenId }: { tokenId?: string }) => tokenId !== 'b')

      const { result } = renderHook(() => useWalletPositionsWeb(baseParams))

      expect(result.current.visiblePositions.map((p) => p.tokenId)).toEqual(['a', 'c'])
      expect(result.current.hiddenPositions.map((p) => p.tokenId)).toEqual(['b'])
    })

    it('passes poolId/tokenId/chainId/isFlaggedSpam to the visibility check', () => {
      const visibilityCheck = vi.fn().mockReturnValue(true)
      mockUsePositionVisibilityCheck.mockReturnValue(visibilityCheck)
      mockUseWalletPositions.mockReturnValue(
        walletPositionsResultFor([
          positionInfo('a', { isHidden: true, chainId: UniverseChainId.Optimism, poolId: 'pool-X' }),
        ]),
      )

      renderHook(() => useWalletPositionsWeb(baseParams))

      expect(visibilityCheck).toHaveBeenCalledWith({
        poolId: 'pool-X',
        tokenId: 'a',
        chainId: UniverseChainId.Optimism,
        isFlaggedSpam: true,
      })
    })
  })

  describe('saved-pair filtering', () => {
    it('drops saved positions whose chainId mismatches chainFilter', () => {
      mockUseRequestPositionsForSavedPairs.mockReturnValue([
        savedEntry({ chainId: UniverseChainId.Mainnet, tokenId: 'mainnet-only' }),
        savedEntry({ chainId: UniverseChainId.Optimism, tokenId: 'optimism-only' }),
      ])

      const { result } = renderHook(() =>
        useWalletPositionsWeb({ ...baseParams, chainFilter: UniverseChainId.Mainnet }),
      )

      expect(result.current.visiblePositions.map((p) => p.tokenId)).toEqual(['mainnet-only'])
    })

    it('drops saved positions whose protocolVersion is not in versionFilter', () => {
      mockUseRequestPositionsForSavedPairs.mockReturnValue([
        savedEntry({ protocolVersion: ProtocolVersion.V2, tokenId: 'v2-saved' }),
        savedEntry({ protocolVersion: ProtocolVersion.V3, tokenId: 'v3-saved' }),
      ])

      const { result } = renderHook(() => useWalletPositionsWeb({ ...baseParams, versionFilter: [ProtocolVersion.V3] }))

      expect(result.current.visiblePositions.map((p) => p.tokenId)).toEqual(['v3-saved'])
    })

    it('drops saved positions whose status is not in statusFilter', () => {
      mockUseRequestPositionsForSavedPairs.mockReturnValue([
        savedEntry({ status: PositionStatus.IN_RANGE, tokenId: 'in-range-saved' }),
        savedEntry({ status: PositionStatus.CLOSED, tokenId: 'closed-saved' }),
      ])

      const { result } = renderHook(() =>
        useWalletPositionsWeb({ ...baseParams, statusFilter: [PositionStatus.IN_RANGE] }),
      )

      expect(result.current.visiblePositions.map((p) => p.tokenId)).toEqual(['in-range-saved'])
    })
  })

  describe('dedupe', () => {
    it('BE wins over saved when composite key collides', () => {
      const beVersion = positionInfo('shared', { isHidden: false })
      mockUseWalletPositions.mockReturnValue(walletPositionsResultFor([beVersion]))
      // Saved entry with same composite key as the BE entry.
      mockUseRequestPositionsForSavedPairs.mockReturnValue([
        savedEntry({ tokenId: 'shared', chainId: UniverseChainId.Mainnet }),
      ])
      // Distinguish the saved version by toggling isHidden — if saved wins, it'd flip to hidden.
      mockParseRestPosition.mockImplementation((rest?: SavedPositionPayload) => {
        if (!rest) {
          return undefined
        }
        return positionInfo(rest.tokenId ?? 'x', { isHidden: true })
      })

      // Visibility check defers to the entry's isHidden via isFlaggedSpam.
      mockUsePositionVisibilityCheck.mockReturnValue(({ isFlaggedSpam }: { isFlaggedSpam?: boolean }) => !isFlaggedSpam)

      const { result } = renderHook(() => useWalletPositionsWeb(baseParams))

      // The BE version (isHidden=false) won; partition placed it in visible.
      expect(result.current.visiblePositions.map((p) => p.tokenId)).toEqual(['shared'])
      expect(result.current.hiddenPositions).toHaveLength(0)
    })

    it('saved positions are added when no BE collision', () => {
      mockUseWalletPositions.mockReturnValue(walletPositionsResultFor([positionInfo('be-only')]))
      mockUseRequestPositionsForSavedPairs.mockReturnValue([savedEntry({ tokenId: 'saved-only' })])

      const { result } = renderHook(() => useWalletPositionsWeb(baseParams))

      const tokenIds = result.current.visiblePositions
        .map((p) => p.tokenId)
        .sort((a, b) => (a ?? '').localeCompare(b ?? ''))
      expect(tokenIds).toEqual(['be-only', 'saved-only'])
    })
  })

  describe('derived flags', () => {
    it('isLoadingPositions is true when address + isLoading + !hasData + !error', () => {
      mockUseWalletPositions.mockReturnValue(
        walletPositionsResultFor([], { isLoading: true, hasData: false, error: null }),
      )

      const { result } = renderHook(() => useWalletPositionsWeb(baseParams))

      expect(result.current.isLoadingPositions).toBe(true)
    })

    it('isLoadingPositions is false when address is undefined (disconnected)', () => {
      mockUseWalletPositions.mockReturnValue(
        walletPositionsResultFor([], { isLoading: true, hasData: false, error: null }),
      )

      const { result } = renderHook(() => useWalletPositionsWeb({ ...baseParams, address: undefined }))

      expect(result.current.isLoadingPositions).toBe(false)
    })

    it('isLoadingPositions is false when there is an error', () => {
      mockUseWalletPositions.mockReturnValue(
        walletPositionsResultFor([], { isLoading: true, hasData: false, error: new ConnectError('boom') }),
      )

      const { result } = renderHook(() => useWalletPositionsWeb(baseParams))

      expect(result.current.isLoadingPositions).toBe(false)
    })

    it('isLoadingPositions is false when hasData is true', () => {
      mockUseWalletPositions.mockReturnValue(walletPositionsResultFor([], { isLoading: false, hasData: true }))

      const { result } = renderHook(() => useWalletPositionsWeb(baseParams))

      expect(result.current.isLoadingPositions).toBe(false)
    })

    it('hasErrorWithoutData is true when error and !hasData', () => {
      mockUseWalletPositions.mockReturnValue(
        walletPositionsResultFor([], { error: new ConnectError('boom'), hasData: false }),
      )

      const { result } = renderHook(() => useWalletPositionsWeb(baseParams))

      expect(result.current.hasErrorWithoutData).toBe(true)
    })

    it('hasErrorWithoutData is false when error but hasData is true', () => {
      mockUseWalletPositions.mockReturnValue(
        walletPositionsResultFor([], { error: new ConnectError('boom'), hasData: true }),
      )

      const { result } = renderHook(() => useWalletPositionsWeb(baseParams))

      expect(result.current.hasErrorWithoutData).toBe(false)
    })
  })

  describe('loadMorePositions', () => {
    it('calls fetchNextPage when hasNextPage and !isFetching', () => {
      const fetchNextPage = vi.fn().mockResolvedValue({ data: undefined })
      mockUseWalletPositions.mockReturnValue(
        walletPositionsResultFor([], { hasNextPage: true, isFetching: false, fetchNextPage }),
      )

      const { result } = renderHook(() => useWalletPositionsWeb(baseParams))
      result.current.loadMorePositions()

      expect(fetchNextPage).toHaveBeenCalledTimes(1)
    })

    it('no-ops when !hasNextPage', () => {
      const fetchNextPage = vi.fn()
      mockUseWalletPositions.mockReturnValue(
        walletPositionsResultFor([], { hasNextPage: false, isFetching: false, fetchNextPage }),
      )

      const { result } = renderHook(() => useWalletPositionsWeb(baseParams))
      result.current.loadMorePositions()

      expect(fetchNextPage).not.toHaveBeenCalled()
    })

    it('no-ops when isFetching is true', () => {
      const fetchNextPage = vi.fn()
      mockUseWalletPositions.mockReturnValue(
        walletPositionsResultFor([], { hasNextPage: true, isFetching: true, fetchNextPage }),
      )

      const { result } = renderHook(() => useWalletPositionsWeb(baseParams))
      result.current.loadMorePositions()

      expect(fetchNextPage).not.toHaveBeenCalled()
    })

    it('keeps identity stable across rerenders when query state is unchanged', () => {
      mockUseWalletPositions.mockReturnValue(walletPositionsResultFor([], { hasNextPage: true, isFetching: false }))

      const { result, rerender } = renderHook(() => useWalletPositionsWeb(baseParams))
      const first = result.current.loadMorePositions

      rerender()

      expect(result.current.loadMorePositions).toBe(first)
    })
  })

  describe('pending-tx refetch listener', () => {
    it('subscribes usePendingLPTransactionsChangeListener with the refetch from useWalletPositions', () => {
      const refetch = vi.fn()
      mockUseWalletPositions.mockReturnValue(walletPositionsResultFor([], { refetch }))

      renderHook(() => useWalletPositionsWeb(baseParams))

      expect(mockUsePendingLPTransactionsChangeListener).toHaveBeenCalledWith(refetch)
    })
  })
})
