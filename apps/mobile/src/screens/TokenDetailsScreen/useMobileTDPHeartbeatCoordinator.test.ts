import { useIsFocused } from '@react-navigation/native'
import { renderHook } from '@testing-library/react'
import { useMobileTDPHeartbeatCoordinator } from 'src/screens/TokenDetailsScreen/useMobileTDPHeartbeatCoordinator'
import { useHeartbeatCoordinator } from 'src/utils/useHeartbeatCoordinator'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

const mockQueryClientRefetchQueries = vi.fn().mockResolvedValue(undefined)
const mockQueryClient = { refetchQueries: mockQueryClientRefetchQueries }
const mockRefetchGatedFeatures = vi.hoisted(() => vi.fn())

vi.mock('@react-navigation/native', () => ({
  useIsFocused: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => mockQueryClient,
}))

vi.mock('@universe/compliance', () => ({
  refetchGatedFeatures: mockRefetchGatedFeatures,
}))

vi.mock('wallet/src/features/wallet/hooks', () => ({
  useActiveAccountAddress: vi.fn(),
}))

vi.mock('src/utils/useHeartbeatCoordinator', () => ({
  useHeartbeatCoordinator: vi.fn(),
}))

const mockUseIsFocused = vi.mocked(useIsFocused)
const mockUseActiveAccountAddress = vi.mocked(useActiveAccountAddress)
const mockUseHeartbeatCoordinator = vi.mocked(useHeartbeatCoordinator)

function createDeferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

type RefetchFilter = { queryKey: unknown[]; type: 'active' }

function dataApiFilter(name: string): RefetchFilter {
  return { queryKey: [ReactQueryCacheKey.DataApiService, name], type: 'active' }
}

const PRICE_FILTERS = [dataApiFilter('getTokenMultiChain'), dataApiFilter('getTokenHistoryPrice')]
const EARN_FILTERS = [dataApiFilter('listEarnVaults'), dataApiFilter('listEarnPositions')]

function isEarnFilter(filter: RefetchFilter): boolean {
  return EARN_FILTERS.some((earnFilter) => earnFilter.queryKey[1] === filter.queryKey[1])
}

describe('useMobileTDPHeartbeatCoordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryClientRefetchQueries.mockReset().mockResolvedValue(undefined)
    mockRefetchGatedFeatures.mockReset().mockResolvedValue(undefined)
    mockUseActiveAccountAddress.mockReturnValue(null)
    mockUseIsFocused.mockReturnValue(true)
  })

  it('passes refresh callbacks through to the shared coordinator, enabled while focused', () => {
    renderHook(() => useMobileTDPHeartbeatCoordinator(false))

    expect(mockUseHeartbeatCoordinator).toHaveBeenCalledWith(
      expect.objectContaining({ refresh: expect.any(Function), priceRefresh: expect.any(Function), enabled: true }),
    )
  })

  it('disables the coordinator when the screen is unfocused, so stacked TDPs do not multiply refetches', () => {
    mockUseIsFocused.mockReturnValue(false)
    renderHook(() => useMobileTDPHeartbeatCoordinator(false))

    expect(mockUseHeartbeatCoordinator).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('refetches price history, but not Zerion-backed balances, on refresh', async () => {
    mockUseActiveAccountAddress.mockReturnValue('0xabc')
    renderHook(() => useMobileTDPHeartbeatCoordinator(false))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    for (const filter of PRICE_FILTERS) {
      expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith(filter)
    }
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: [ReactQueryCacheKey.GetPortfolio] }),
    )
  })

  it('refetches price only after everything else has settled', async () => {
    mockUseActiveAccountAddress.mockReturnValue('0xabc')
    const gatedFeatures = createDeferred<void>()
    const earnQueries = createDeferred<void>()
    mockRefetchGatedFeatures.mockReturnValue(gatedFeatures.promise)
    mockQueryClientRefetchQueries.mockImplementation((filter: RefetchFilter) =>
      isEarnFilter(filter) ? earnQueries.promise : Promise.resolve(undefined),
    )

    renderHook(() => useMobileTDPHeartbeatCoordinator(true))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    const refreshPromise = refresh()

    for (const filter of PRICE_FILTERS) {
      expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith(filter)
    }

    gatedFeatures.resolve(undefined)
    earnQueries.resolve(undefined)
    await refreshPromise

    const calledFilters = mockQueryClientRefetchQueries.mock.calls.map(([filter]) => filter as RefetchFilter)
    expect(calledFilters.slice(-PRICE_FILTERS.length)).toEqual(PRICE_FILTERS)
  })

  it('only refetches the REST price queries on priceRefresh', async () => {
    mockUseActiveAccountAddress.mockReturnValue('0xabc')
    renderHook(() => useMobileTDPHeartbeatCoordinator(true))

    const { priceRefresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await priceRefresh?.()

    expect(mockQueryClientRefetchQueries.mock.calls.map(([filter]) => filter)).toEqual(PRICE_FILTERS)
    expect(mockRefetchGatedFeatures).not.toHaveBeenCalled()
  })

  it('skips region gating and earn queries for a non-RWA token with no active address', async () => {
    mockUseActiveAccountAddress.mockReturnValue(null)
    renderHook(() => useMobileTDPHeartbeatCoordinator(false))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(mockRefetchGatedFeatures).not.toHaveBeenCalled()
    for (const filter of EARN_FILTERS) {
      expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith(filter)
    }
  })

  it('refetches region gating for an RWA token', async () => {
    renderHook(() => useMobileTDPHeartbeatCoordinator(true))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(mockRefetchGatedFeatures).toHaveBeenCalledExactlyOnceWith(mockQueryClient)
  })

  it('refetches earn vaults and positions when there is an active address', async () => {
    mockUseActiveAccountAddress.mockReturnValue('0xabc')
    renderHook(() => useMobileTDPHeartbeatCoordinator(false))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    for (const filter of EARN_FILTERS) {
      expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith(filter)
    }
  })
})
