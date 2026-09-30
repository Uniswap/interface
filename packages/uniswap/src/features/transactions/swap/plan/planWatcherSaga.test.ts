import { getFeatureFlag, getStatsigClient, isStatsigClientRegistered } from '@universe/gating'
import { runSaga, stdChannel } from 'redux-saga'
import { PlanWatcher } from 'uniswap/src/features/transactions/swap/plan/planWatcherSaga'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getFeatureFlag: vi.fn(() => false),
  getStatsigClient: vi.fn(),
  isStatsigClientRegistered: vi.fn(() => false),
}))

function runInitialize(): Promise<unknown> {
  return runSaga(
    { channel: stdChannel(), dispatch: () => undefined, getState: () => ({}) },
    PlanWatcher.initialize,
  ).toPromise()
}

describe('PlanWatcher.initialize', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(getStatsigClient).mockReturnValue({ loadingStatus: 'Ready' } as ReturnType<typeof getStatsigClient>)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not touch the Statsig client until one is registered', async () => {
    vi.mocked(isStatsigClientRegistered).mockReturnValue(false)

    const done = runInitialize()
    await vi.advanceTimersByTimeAsync(2_500)
    expect(getStatsigClient).not.toHaveBeenCalled()
    expect(getFeatureFlag).not.toHaveBeenCalled()

    vi.mocked(isStatsigClientRegistered).mockReturnValue(true)
    await vi.advanceTimersByTimeAsync(1_000)
    await done

    expect(getStatsigClient).toHaveBeenCalled()
    expect(getFeatureFlag).toHaveBeenCalled()
  })

  it('waits for the registered client to finish loading before reading the flag', async () => {
    vi.mocked(isStatsigClientRegistered).mockReturnValue(true)
    vi.mocked(getStatsigClient).mockReturnValue({ loadingStatus: 'Loading' } as ReturnType<typeof getStatsigClient>)

    const done = runInitialize()
    await vi.advanceTimersByTimeAsync(1_500)
    expect(getFeatureFlag).not.toHaveBeenCalled()

    vi.mocked(getStatsigClient).mockReturnValue({ loadingStatus: 'Ready' } as ReturnType<typeof getStatsigClient>)
    await vi.advanceTimersByTimeAsync(1_000)
    await done

    expect(getFeatureFlag).toHaveBeenCalled()
  })
})
