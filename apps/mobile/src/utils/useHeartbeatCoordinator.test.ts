import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { AppState } from 'react-native'
import { useHeartbeatCoordinator } from 'src/utils/useHeartbeatCoordinator'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useInterval } from 'utilities/src/time/timing'

vi.mock('utilities/src/time/timing', () => ({
  useInterval: vi.fn(),
}))

// react-native-web's AppState methods aren't jest-style mocks (jest-expo's were); stub them
vi.mock('react-native', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  AppState: {
    currentState: 'active',
    addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  },
}))

const mockUseInterval = vi.mocked(useInterval)

function makeParams(overrides?: { enabled?: boolean }) {
  return {
    refresh: vi.fn().mockResolvedValue(undefined),
    priceRefresh: vi.fn().mockResolvedValue(undefined),
    enabled: true,
    ...overrides,
  }
}

describe('useHeartbeatCoordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      get: () => 'active',
    })
  })

  it('passes half the heartbeat interval when enabled and active, so price ticks land at the midpoint', () => {
    renderHook(() => useHeartbeatCoordinator(makeParams()))

    const [, delay] = mockUseInterval.mock.calls[0]!
    expect(delay).toBe(PollingInterval.KindaFast)
  })

  it('passes null delay when disabled', () => {
    renderHook(() => useHeartbeatCoordinator(makeParams({ enabled: false })))

    const [, delay] = mockUseInterval.mock.calls[0]!
    expect(delay).toBeNull()
  })

  it('passes null delay when app is backgrounded', () => {
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      get: () => 'background',
    })

    renderHook(() => useHeartbeatCoordinator(makeParams()))

    const [, delay] = mockUseInterval.mock.calls[0]!
    expect(delay).toBeNull()
  })

  it('calls refresh on the first (even) tick', async () => {
    const params = makeParams()
    renderHook(() => useHeartbeatCoordinator(params))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback()
    })

    expect(params.refresh).toHaveBeenCalledTimes(1)
    expect(params.priceRefresh).not.toHaveBeenCalled()
  })

  it('calls priceRefresh on the second (odd) tick', async () => {
    const params = makeParams()
    renderHook(() => useHeartbeatCoordinator(params))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback() // full tick
    })
    vi.clearAllMocks()

    await act(async () => {
      await callback() // price-only tick
    })

    expect(params.priceRefresh).toHaveBeenCalledTimes(1)
    expect(params.refresh).not.toHaveBeenCalled()
  })

  it('alternates refresh and priceRefresh across successive ticks', async () => {
    const params = makeParams()
    renderHook(() => useHeartbeatCoordinator(params))

    const [callback] = mockUseInterval.mock.calls[0]!
    for (let i = 0; i < 4; i++) {
      await act(async () => {
        await callback()
      })
    }

    expect(params.refresh).toHaveBeenCalledTimes(2)
    expect(params.priceRefresh).toHaveBeenCalledTimes(2)
  })

  it('fires a full refresh immediately on foreground return and resets the phase to price-only', async () => {
    const params = makeParams()
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      get: () => 'background',
    })

    renderHook(() => useHeartbeatCoordinator(params))

    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      get: () => 'active',
    })
    const listener = vi.mocked(AppState.addEventListener).mock.calls[0]?.[1]
    await act(async () => {
      listener?.('active')
    })

    expect(params.refresh).toHaveBeenCalledTimes(1)

    params.refresh.mockClear()

    // The callback is stable across renders (reads latest deps via a ref), so the callback
    // captured on the initial render still reflects the post-foreground-return tick phase.
    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback() // next scheduled tick should be price-only
    })

    expect(params.priceRefresh).toHaveBeenCalledTimes(1)
    expect(params.refresh).not.toHaveBeenCalled()
  })

  it('does not fire an extra refresh when returning to foreground while disabled', async () => {
    const params = makeParams({ enabled: false })
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      get: () => 'background',
    })

    renderHook(() => useHeartbeatCoordinator(params))

    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      get: () => 'active',
    })
    const listener = vi.mocked(AppState.addEventListener).mock.calls[0]?.[1]
    await act(async () => {
      listener?.('active')
    })

    expect(params.refresh).not.toHaveBeenCalled()
  })
})
