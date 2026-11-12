import { act, renderHook } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { useFeatureFlag, useStatsigClientStatus } from '@universe/gating'
import { type LaunchItem, UNISWAP_CCA_LAUNCHPAD_ID } from '~/features/Toucan/utils/launchesModel'
import { usePrefetchLaunchTokenDetails } from '~/pages/Launches/usePrefetchLaunchTokenDetails'
import { mocked } from '~/test-utils/mocked'
import { getInitialTokenPriceHistoryQueryOptions, getTokenMultiChainQueryOptions } from '~/utils/tokenQueryOptions'

const mockPrefetchQuery = vi.fn().mockResolvedValue(undefined)

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useQueryClient: () => ({ prefetchQuery: mockPrefetchQuery }) }
})
// Keep the real page modules out of the test.
vi.mock('~/pages/TokenDetails/TokenDetailsPage', () => ({ default: () => null }))
vi.mock('~/pages/Explore/ToucanToken', () => ({ default: () => null }))

const HOVER_DELAY_MS = 120
const CHAIN_ID = UniverseChainId.Mainnet
const ADDRESS = '0x68749665FF8D2d112Fa859AA293F07A622782F38'

function makeLaunch(overrides?: Partial<LaunchItem>): LaunchItem {
  return {
    id: `launchpad-1-${CHAIN_ID}-${ADDRESS}`,
    name: 'Test Token',
    symbol: 'TEST',
    tokenAddress: ADDRESS,
    launchpadId: 'launchpad-1',
    launchpadLabel: 'Launchpad',
    networkLabel: 'Ethereum',
    logoChainId: CHAIN_ID,
    createdSecondsAgo: 60,
    detailPath: `/explore/tokens/ethereum/${ADDRESS}`,
    isQuickLaunch: false,
    graduated: false,
    ...overrides,
  }
}

function prefetchedQueryKey(name: string): unknown {
  return mockPrefetchQuery.mock.calls.find((call) => call[0]?.queryKey?.[1] === name)?.[0]?.queryKey
}

function renderAndHover(launch: LaunchItem): void {
  const { result } = renderHook(() => usePrefetchLaunchTokenDetails())
  act(() => result.current.scheduleHoverPrefetch(launch))
  act(() => {
    vi.advanceTimersByTime(HOVER_DELAY_MS)
  })
}

describe('usePrefetchLaunchTokenDetails', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockPrefetchQuery.mockClear()
    mocked(useFeatureFlag).mockReturnValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('warms the same metadata and price-chart keys the TDP builds', () => {
    renderAndHover(makeLaunch())

    expect(mockPrefetchQuery).toHaveBeenCalledTimes(2)
    // Assert against the TDP's own key builders (shared with useCreateTDPContext / useTokenPriceChartData),
    // so this fails if the prefetch ever warms a key the page doesn't actually request.
    expect(prefetchedQueryKey('getTokenMultiChain')).toEqual(
      getTokenMultiChainQueryOptions({ chainId: CHAIN_ID, address: ADDRESS, isNative: false }).queryKey,
    )
    expect(prefetchedQueryKey('getTokenMultiChain')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          chainIds: expect.arrayContaining([UniverseChainId.Mainnet, UniverseChainId.Sepolia]),
        }),
      ]),
    )
    expect(prefetchedQueryKey('getTokenHistoryPrice')).toEqual(
      getInitialTokenPriceHistoryQueryOptions({ chainId: CHAIN_ID, address: ADDRESS }).queryKey,
    )
  })

  it('debounces: a fleeting hover cleared before the delay fires nothing', () => {
    const { result } = renderHook(() => usePrefetchLaunchTokenDetails())

    act(() => result.current.scheduleHoverPrefetch(makeLaunch()))
    expect(mockPrefetchQuery).not.toHaveBeenCalled()

    act(() => result.current.cancelHoverPrefetch())
    act(() => {
      vi.advanceTimersByTime(HOVER_DELAY_MS)
    })

    expect(mockPrefetchQuery).not.toHaveBeenCalled()
  })

  it('prefetchNow warms the queries immediately, without the hover delay', () => {
    const { result } = renderHook(() => usePrefetchLaunchTokenDetails())

    act(() => result.current.prefetchNow(makeLaunch()))

    expect(mockPrefetchQuery).toHaveBeenCalledTimes(2)
    expect(prefetchedQueryKey('getTokenMultiChain')).toEqual(
      getTokenMultiChainQueryOptions({ chainId: CHAIN_ID, address: ADDRESS, isNative: false }).queryKey,
    )
  })

  it('prefetchNow replaces a pending hover prefetch', () => {
    const { result } = renderHook(() => usePrefetchLaunchTokenDetails())

    act(() => result.current.scheduleHoverPrefetch(makeLaunch()))
    act(() => result.current.prefetchNow(makeLaunch()))
    act(() => {
      vi.advanceTimersByTime(HOVER_DELAY_MS)
    })

    expect(mockPrefetchQuery).toHaveBeenCalledTimes(2)
  })

  it('unmounting after prefetchNow does not undo it', () => {
    const { result, unmount } = renderHook(() => usePrefetchLaunchTokenDetails())

    act(() => result.current.prefetchNow(makeLaunch()))
    unmount()

    expect(mockPrefetchQuery).toHaveBeenCalledTimes(2)
  })

  it('also warms the auction lookup for a CCA token regardless of the quick-launch boolean', () => {
    renderAndHover(makeLaunch({ launchpadId: UNISWAP_CCA_LAUNCHPAD_ID, isQuickLaunch: false }))

    expect(mockPrefetchQuery).toHaveBeenCalledTimes(3)
    expect(prefetchedQueryKey('getAuction')).toBeDefined()
  })

  it.each([
    ['the flag is off', false, true],
    ['Statsig is not ready', true, false],
  ])('keeps canonical prefetch unchanged when %s', (_label, featureEnabled, isStatsigReady) => {
    mocked(useFeatureFlag).mockReturnValue(featureEnabled)
    mocked(useStatsigClientStatus).mockReturnValue({
      isStatsigReady,
      isStatsigLoading: !isStatsigReady,
      isStatsigUninitialized: false,
    })

    renderAndHover(makeLaunch({ launchpadId: UNISWAP_CCA_LAUNCHPAD_ID }))

    expect(mockPrefetchQuery).toHaveBeenCalledTimes(2)
    expect(prefetchedQueryKey('getAuction')).toBeUndefined()
  })

  it('cancels queued auction prefetch when the flag turns off', () => {
    const { result, rerender } = renderHook(() => usePrefetchLaunchTokenDetails())
    act(() => result.current.scheduleHoverPrefetch(makeLaunch({ launchpadId: UNISWAP_CCA_LAUNCHPAD_ID })))

    mocked(useFeatureFlag).mockReturnValue(false)
    rerender()
    act(() => vi.advanceTimersByTime(HOVER_DELAY_MS))

    expect(mockPrefetchQuery).not.toHaveBeenCalled()
  })

  it('does not prefetch token queries for auction detail paths', () => {
    renderAndHover(makeLaunch({ detailPath: '/explore/auctions/ethereum/0xauction' }))

    expect(mockPrefetchQuery).not.toHaveBeenCalled()
  })

  it('does not prefetch when the launch has no detail path', () => {
    renderAndHover(makeLaunch({ detailPath: undefined }))

    expect(mockPrefetchQuery).not.toHaveBeenCalled()
  })

  it('does not prefetch when the launch has no supported chain', () => {
    renderAndHover(makeLaunch({ logoChainId: undefined }))

    expect(mockPrefetchQuery).not.toHaveBeenCalled()
  })
})
