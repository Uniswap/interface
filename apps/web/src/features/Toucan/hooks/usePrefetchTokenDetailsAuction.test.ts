import { act, renderHook } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { useFeatureFlag, useStatsigClientStatus } from '@universe/gating'
import { usePrefetchTokenDetailsAuction } from '~/features/Toucan/hooks/usePrefetchTokenDetailsAuction'
import { getTdpAuctionQueryOptions, getTdpAuctionRequest } from '~/features/Toucan/utils/tdpAuctionQueryOptions'
import { mocked } from '~/test-utils/mocked'

const mockPrefetchQuery = vi.fn().mockResolvedValue(undefined)

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => ({ prefetchQuery: mockPrefetchQuery }),
}))

const TOKEN = {
  chainId: UniverseChainId.Mainnet,
  tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
}

describe('usePrefetchTokenDetailsAuction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useFeatureFlag).mockReturnValue(true)
  })

  it('only warms the exact token lookup when navigation intent is signalled', () => {
    const { result } = renderHook(() => usePrefetchTokenDetailsAuction())
    expect(mockPrefetchQuery).not.toHaveBeenCalled()

    act(() => result.current(TOKEN))

    expect(mockPrefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: getTdpAuctionQueryOptions({ params: getTdpAuctionRequest(TOKEN), enabled: true }).queryKey,
      }),
    )
  })

  it.each([
    ['the flag is off', false, true],
    ['Statsig is not ready', true, false],
  ])('does not prefetch when %s', (_label, featureEnabled, isStatsigReady) => {
    mocked(useFeatureFlag).mockReturnValue(featureEnabled)
    mocked(useStatsigClientStatus).mockReturnValue({
      isStatsigReady,
      isStatsigLoading: !isStatsigReady,
      isStatsigUninitialized: false,
    })
    const { result } = renderHook(() => usePrefetchTokenDetailsAuction())

    act(() => result.current(TOKEN))

    expect(mockPrefetchQuery).not.toHaveBeenCalled()
  })

  it('does not prefetch an invalid token address', () => {
    const { result } = renderHook(() => usePrefetchTokenDetailsAuction())

    act(() => result.current({ ...TOKEN, tokenAddress: 'invalid' }))

    expect(mockPrefetchQuery).not.toHaveBeenCalled()

    act(() => result.current(TOKEN))

    expect(mockPrefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: getTdpAuctionQueryOptions({ params: getTdpAuctionRequest(TOKEN), enabled: true }).queryKey,
      }),
    )
  })
})
