import { act } from '@testing-library/react-native'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePoolsFailedNetworks } from 'uniswap/src/features/portfolio/pools/usePoolsFailedNetworks'
import { usePoolsOutageBanner } from 'uniswap/src/features/portfolio/pools/usePoolsOutageBanner'
import { renderHookWithProviders } from 'uniswap/src/test/render'

vi.mock('uniswap/src/features/portfolio/pools/usePoolsFailedNetworks', () => ({
  usePoolsFailedNetworks: vi.fn(),
}))

function mockFailedNetworks({
  failedChainIds = [],
  hasResolved = true,
  isPoolsUnavailable = false,
}: {
  failedChainIds?: UniverseChainId[]
  hasResolved?: boolean
  isPoolsUnavailable?: boolean
}): void {
  vi.mocked(usePoolsFailedNetworks).mockReturnValue({
    failedChainIds,
    hasResolved,
    isPoolsUnavailable,
  })
}

describe('usePoolsOutageBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a dismissible network banner for a partial outage', () => {
    mockFailedNetworks({ failedChainIds: [UniverseChainId.Base] })

    const { result } = renderHookWithProviders(() => usePoolsOutageBanner({ enabled: true }))

    expect(result.current.isVisible).toBe(true)
    expect(result.current.message).not.toBe('')
    expect(typeof result.current.onDismiss).toBe('function')
  })

  it('shows a non-dismissible generic banner for a full outage', () => {
    mockFailedNetworks({ isPoolsUnavailable: true })

    const { result } = renderHookWithProviders(() => usePoolsOutageBanner({ enabled: true }))

    expect(result.current.isVisible).toBe(true)
    expect(result.current.onDismiss).toBeUndefined()
  })

  it('is hidden when pools are healthy', () => {
    mockFailedNetworks({})

    const { result } = renderHookWithProviders(() => usePoolsOutageBanner({ enabled: true }))

    expect(result.current.isVisible).toBe(false)
  })

  it('hides and persists the dismissal when the partial banner is dismissed', () => {
    mockFailedNetworks({ failedChainIds: [UniverseChainId.Base] })

    const { result, store } = renderHookWithProviders(() => usePoolsOutageBanner({ enabled: true }))

    act(() => result.current.onDismiss?.())

    expect(store.getState().uniswapBehaviorHistory.hasDismissedPoolsOutageBanner).toBe(true)
    expect(result.current.isVisible).toBe(false)
  })

  it('stays hidden for an ongoing partial outage that was already dismissed', () => {
    mockFailedNetworks({ failedChainIds: [UniverseChainId.Base] })

    const { result } = renderHookWithProviders(() => usePoolsOutageBanner({ enabled: true }), {
      preloadedState: { uniswapBehaviorHistory: { hasDismissedPoolsOutageBanner: true } },
    })

    expect(result.current.isVisible).toBe(false)
  })

  it('keeps the dismissal while the breakdown is still loading on a fresh visit', () => {
    mockFailedNetworks({ hasResolved: false })

    const { rerender, store } = renderHookWithProviders(() => usePoolsOutageBanner({ enabled: true }), {
      preloadedState: { uniswapBehaviorHistory: { hasDismissedPoolsOutageBanner: true } },
    })

    expect(store.getState().uniswapBehaviorHistory.hasDismissedPoolsOutageBanner).toBe(true)

    mockFailedNetworks({ failedChainIds: [UniverseChainId.Base] })
    act(() => rerender())
    expect(store.getState().uniswapBehaviorHistory.hasDismissedPoolsOutageBanner).toBe(true)
  })

  it('resets the dismissal once the outage clears so a later outage shows again', () => {
    mockFailedNetworks({ failedChainIds: [UniverseChainId.Base] })

    const { result, rerender, store } = renderHookWithProviders(() => usePoolsOutageBanner({ enabled: true }), {
      preloadedState: { uniswapBehaviorHistory: { hasDismissedPoolsOutageBanner: true } },
    })
    expect(result.current.isVisible).toBe(false)

    mockFailedNetworks({})
    act(() => rerender())
    expect(store.getState().uniswapBehaviorHistory.hasDismissedPoolsOutageBanner).toBe(false)

    mockFailedNetworks({ failedChainIds: [UniverseChainId.Optimism] })
    act(() => rerender())
    expect(result.current.isVisible).toBe(true)
  })
})
