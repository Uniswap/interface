import * as onboardingTimestamp from 'src/features/analytics/onboardingTimestamp'
import { useLogUnexpectedOnboardingReset } from 'src/features/analytics/useLogUnexpectedOnboardingReset'
import { renderHook } from 'src/test/test-utils'
import { logger } from 'utilities/src/logger/logger'
import { initialWalletState } from 'wallet/src/features/wallet/slice'

vi.mock('src/features/analytics/onboardingTimestamp')
vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}))

const mockGetOnboardingTimestamp = vi.mocked(onboardingTimestamp.getOnboardingTimestamp)
const mockSetOnboardingTimestamp = vi.mocked(onboardingTimestamp.setOnboardingTimestamp)
const mockClearOnboardingTimestamp = vi.mocked(onboardingTimestamp.clearOnboardingTimestamp)

describe('useLogUnexpectedOnboardingReset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing when user has not yet onboarded', () => {
    mockGetOnboardingTimestamp.mockReturnValue(undefined)

    renderHook(() => useLogUnexpectedOnboardingReset(), {
      preloadedState: { wallet: { ...initialWalletState, finishedOnboarding: false } },
    })

    expect(logger.error).not.toHaveBeenCalled()
    expect(mockSetOnboardingTimestamp).not.toHaveBeenCalled()
    expect(mockClearOnboardingTimestamp).not.toHaveBeenCalled()
  })

  it('does nothing when user is properly onboarded', () => {
    mockGetOnboardingTimestamp.mockReturnValue(Date.now())

    renderHook(() => useLogUnexpectedOnboardingReset(), {
      preloadedState: { wallet: { ...initialWalletState, finishedOnboarding: true } },
    })

    expect(logger.error).not.toHaveBeenCalled()
    expect(mockSetOnboardingTimestamp).not.toHaveBeenCalled()
    expect(mockClearOnboardingTimestamp).not.toHaveBeenCalled()
  })

  it('sets timestamp for existing users who onboarded before this feature', () => {
    mockGetOnboardingTimestamp.mockReturnValue(undefined)

    renderHook(() => useLogUnexpectedOnboardingReset(), {
      preloadedState: { wallet: { ...initialWalletState, finishedOnboarding: true } },
    })

    expect(mockSetOnboardingTimestamp).toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
    expect(mockClearOnboardingTimestamp).not.toHaveBeenCalled()
  })

  it('logs error when unexpected reset detected (timestamp exists but redux shows not onboarded)', () => {
    mockGetOnboardingTimestamp.mockReturnValue(Date.now())

    renderHook(() => useLogUnexpectedOnboardingReset(), {
      preloadedState: { wallet: { ...initialWalletState, finishedOnboarding: false } },
    })

    expect(logger.error).toHaveBeenCalled()
    expect(mockClearOnboardingTimestamp).toHaveBeenCalled()
  })
})
