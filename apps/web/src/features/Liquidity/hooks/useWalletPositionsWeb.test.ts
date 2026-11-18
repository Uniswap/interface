import { ConnectError } from '@connectrpc/connect'
import { renderHook } from '@testing-library/react'
import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId, Platform } from '@universe/chains'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { DEFAULT_V2_POSITION_STATUS_FILTER } from '~/features/Liquidity/constants'
import { useWalletPositionsWeb } from '~/features/Liquidity/hooks/useWalletPositionsWeb'

const {
  mockUseWalletPositions,
  mockUsePositionVisibilityCheck,
  mockUsePendingLPTransactionsChangeListener,
  mockUseEnabledChains,
  mockUseFeatureFlag,
} = vi.hoisted(() => ({
  mockUseWalletPositions: vi.fn(),
  mockUsePositionVisibilityCheck: vi.fn(),
  mockUsePendingLPTransactionsChangeListener: vi.fn(),
  mockUseEnabledChains: vi.fn(),
  mockUseFeatureFlag: vi.fn(),
}))

vi.mock('uniswap/src/features/positions/hooks/useWalletPositions', () => ({
  useWalletPositions: mockUseWalletPositions,
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: mockUseFeatureFlag,
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

vi.mock('uniswap/src/features/positions/hooks/usePositionModifier', () => ({
  usePositionModifier: vi.fn(() => ({ includeSpamTokens: false, poolIncludeOverrides: [], poolExcludeOverrides: [] })),
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

// Mocks the primary (visible) query only; the hidden-only secondary (autoFetchAllPages: true)
// returns empty. A shared mockReturnValue would feed the same positions to both queries, and the
// provenance-based partition would then classify every BE position as hidden.
const mockPrimaryPositions = (positions: PositionInfo[]): void => {
  mockUseWalletPositions.mockImplementation((args: { autoFetchAllPages?: boolean }) =>
    args.autoFetchAllPages ? walletPositionsResultFor([]) : walletPositionsResultFor(positions),
  )
}

const baseParams = {
  address: ADDRESS,
  chainFilter: null,
  versionFilter: DEFAULT_VERSIONS,
  statusFilter: DEFAULT_STATUSES,
  v2StatusFilter: [...DEFAULT_V2_POSITION_STATUS_FILTER],
}

describe('useWalletPositionsWeb', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseWalletPositions.mockReturnValue(walletPositionsResultFor([]))
    mockUsePositionVisibilityCheck.mockReturnValue(() => true)
    mockUseEnabledChains.mockReturnValue({ chains: FALLBACK_CHAINS })
    mockUseFeatureFlag.mockReturnValue(false)
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

  describe('hidden-only secondary query', () => {
    const hiddenCall = (): { disabled?: boolean; autoFetchAllPages?: boolean } | undefined =>
      mockUseWalletPositions.mock.calls
        .map((call) => call[0] as { disabled?: boolean; autoFetchAllPages?: boolean })
        .find((args) => args.autoFetchAllPages === true)

    it('fires and merges hidden results from the hidden-only secondary query', () => {
      mockUseWalletPositions.mockImplementation((args: { autoFetchAllPages?: boolean }) =>
        args.autoFetchAllPages
          ? walletPositionsResultFor([positionInfo('hid')])
          : walletPositionsResultFor([positionInfo('vis')]),
      )
      mockUsePositionVisibilityCheck.mockReturnValue(({ tokenId }: { tokenId?: string }) => tokenId !== 'hid')

      const { result } = renderHook(() => useWalletPositionsWeb(baseParams))

      expect(hiddenCall()?.disabled).toBe(false)
      expect(result.current.visiblePositions.map((p) => p.tokenId)).toEqual(['vis'])
      expect(result.current.hiddenPositions.map((p) => p.tokenId)).toEqual(['hid'])
    })

    it('classifies hidden-query results as hidden by provenance, even when the visibility check calls them visible', () => {
      // Server spam positions come back with no spam marking (isHidden=false, no Redux entry), so
      // the visibility check alone would misfile them as visible; provenance must win.
      mockUseWalletPositions.mockImplementation((args: { autoFetchAllPages?: boolean }) =>
        args.autoFetchAllPages
          ? walletPositionsResultFor([positionInfo('spam')])
          : walletPositionsResultFor([positionInfo('vis')]),
      )
      mockUsePositionVisibilityCheck.mockReturnValue(() => true)

      const { result } = renderHook(() => useWalletPositionsWeb(baseParams))

      expect(result.current.visiblePositions.map((p) => p.tokenId)).toEqual(['vis'])
      expect(result.current.hiddenPositions.map((p) => p.tokenId)).toEqual(['spam'])
    })
  })

  describe('partition + visibility', () => {
    it('partitions visible vs hidden via the visibility check', () => {
      mockPrimaryPositions([positionInfo('a'), positionInfo('b'), positionInfo('c')])
      mockUsePositionVisibilityCheck.mockReturnValue(({ tokenId }: { tokenId?: string }) => tokenId !== 'b')

      const { result } = renderHook(() => useWalletPositionsWeb(baseParams))

      expect(result.current.visiblePositions.map((p) => p.tokenId)).toEqual(['a', 'c'])
      expect(result.current.hiddenPositions.map((p) => p.tokenId)).toEqual(['b'])
    })

    it('passes poolId/tokenId/chainId/isFlaggedSpam to the visibility check', () => {
      const visibilityCheck = vi.fn().mockReturnValue(true)
      mockUsePositionVisibilityCheck.mockReturnValue(visibilityCheck)
      mockPrimaryPositions([positionInfo('a', { isHidden: true, chainId: UniverseChainId.Optimism, poolId: 'pool-X' })])

      renderHook(() => useWalletPositionsWeb(baseParams))

      expect(visibilityCheck).toHaveBeenCalledWith({
        poolId: 'pool-X',
        tokenId: 'a',
        chainId: UniverseChainId.Optimism,
        isFlaggedSpam: true,
      })
    })
  })

  describe('dedupe', () => {
    it('collapses positions that share a composite key', () => {
      const duplicate = positionInfo('shared')
      mockPrimaryPositions([duplicate, positionInfo('shared'), positionInfo('other')])

      const { result } = renderHook(() => useWalletPositionsWeb(baseParams))

      expect(result.current.visiblePositions.map((p) => p.tokenId)).toEqual(['shared', 'other'])
    })
  })

  describe('enabled', () => {
    it('disables both queries and reports no loading when enabled is false', () => {
      mockUseWalletPositions.mockReturnValue(walletPositionsResultFor([], { isLoading: false, hasData: false }))

      const { result } = renderHook(() => useWalletPositionsWeb({ ...baseParams, enabled: false }))

      const disabledFlags = mockUseWalletPositions.mock.calls.map(
        (call) => (call[0] as { disabled?: boolean }).disabled,
      )
      expect(disabledFlags).toEqual([true, true])
      expect(result.current.isLoadingPositions).toBe(false)
    })

    it('enables both queries by default', () => {
      renderHook(() => useWalletPositionsWeb(baseParams))

      const disabledFlags = mockUseWalletPositions.mock.calls.map(
        (call) => (call[0] as { disabled?: boolean }).disabled,
      )
      expect(disabledFlags).toEqual([false, false])
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

    function mockHiddenQuery(overrides: Partial<ReturnType<typeof mockUseWalletPositions>>): void {
      mockUseWalletPositions.mockImplementation((args: { autoFetchAllPages?: boolean }) =>
        walletPositionsResultFor([], args.autoFetchAllPages ? overrides : {}),
      )
    }

    it('tracks the hidden query first page apart from isLoadingPositions', () => {
      mockHiddenQuery({ isLoading: true, hasData: false })

      const { result } = renderHook(() => useWalletPositionsWeb(baseParams))

      expect(result.current.isLoadingHiddenPositions).toBe(true)
      expect(result.current.isLoadingPositions).toBe(false)
    })

    it('isLoadingHiddenPositions is false once the hidden query has a page', () => {
      mockHiddenQuery({ isLoading: false, hasData: true })

      const { result } = renderHook(() => useWalletPositionsWeb(baseParams))

      expect(result.current.isLoadingHiddenPositions).toBe(false)
    })

    it('isLoadingHiddenPositions is false when disabled', () => {
      mockHiddenQuery({ isLoading: false, hasData: false })

      const { result } = renderHook(() => useWalletPositionsWeb({ ...baseParams, enabled: false }))

      expect(result.current.isLoadingHiddenPositions).toBe(false)
    })

    it('reports a hidden query failure without data and stops loading', () => {
      mockHiddenQuery({ error: new ConnectError('boom'), hasData: false })

      const { result } = renderHook(() => useWalletPositionsWeb(baseParams))

      expect(result.current.hasHiddenErrorWithoutData).toBe(true)
      expect(result.current.isLoadingHiddenPositions).toBe(false)
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

    it('does not subscribe the refetch when disabled', () => {
      const refetch = vi.fn()
      mockUseWalletPositions.mockReturnValue(walletPositionsResultFor([], { refetch }))

      renderHook(() => useWalletPositionsWeb({ ...baseParams, enabled: false }))

      expect(mockUsePendingLPTransactionsChangeListener).not.toHaveBeenCalledWith(refetch)
    })
  })
})
