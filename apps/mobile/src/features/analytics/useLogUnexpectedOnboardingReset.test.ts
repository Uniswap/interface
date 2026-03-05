import * as onboardingTimestamp from 'src/features/analytics/onboardingTimestamp'
import { useLogUnexpectedOnboardingReset } from 'src/features/analytics/useLogUnexpectedOnboardingReset'
import { renderHook } from 'src/test/test-utils'
import { logger } from 'utilities/src/logger/logger'
import { initialWalletState } from 'wallet/src/features/wallet/slice'

jest.mock('src/features/analytics/onboardingTimestamp')
jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

const mockGetOnboardingTimestamp = jest.mocked(onboardingTimestamp.getOnboardingTimestamp)
const mockSetOnboardingTimestamp = jest.mocked(onboardingTimestamp.setOnboardingTimestamp)
const mockClearOnboardingTimestamp = jest.mocked(onboardingTimestamp.clearOnboardingTimestamp)

describe('useLogUnexpectedOnboardingReset', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
