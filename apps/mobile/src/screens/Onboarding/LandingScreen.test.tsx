import { RouteProp } from '@react-navigation/core'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { TestID } from '@universe/test'
import React from 'react'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { LandingScreen } from 'src/screens/Onboarding/LandingScreen'
import { resolveUnitagEligibility } from 'src/screens/Onboarding/resolveUnitagEligibility'
import { act, fireEvent, render } from 'src/test/test-utils'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { logger } from 'utilities/src/logger/logger'

vi.mock('src/screens/Onboarding/resolveUnitagEligibility', async (importOriginal) => ({
  ...(await importOriginal<typeof import('src/screens/Onboarding/resolveUnitagEligibility')>()),
  resolveUnitagEligibility: vi.fn(),
}))

const generateOnboardingAccount = vi.fn(async (): Promise<void> => undefined)
const resolveCanClaimUnitag = vi.fn(async (_signal?: AbortSignal): Promise<boolean> => true)

vi.mock('wallet/src/features/onboarding/OnboardingContext', () => ({
  useOnboardingContext: (): unknown => ({
    getOnboardingAccount: (): undefined => undefined,
    generateOnboardingAccount,
  }),
}))

vi.mock('wallet/src/features/unitags/hooks/useCanAddressClaimUnitag', () => ({
  useResolveCanAddressClaimUnitag: (): ((signal?: AbortSignal) => Promise<boolean>) => resolveCanClaimUnitag,
}))

vi.mock('src/features/splashScreen/useHideSplashScreen', () => ({
  useHideSplashScreen: (): (() => void) => (): void => {},
}))

vi.mock('@shopify/react-native-performance-navigation', () => ({
  ReactNavigationPerformanceView: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('wallet/src/components/landing/LandingBackground', () => ({
  LANDING_ANIMATION_DURATION: 0,
  LandingBackground: (): null => null,
}))

const NOTIFICATIONS_NAVIGATION = [
  OnboardingScreens.Notifications,
  {
    importType: ImportType.CreateNew,
    entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
  },
]

function createDeferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })

  return { promise, resolve }
}

function renderLandingScreen(): {
  blur: () => void
  getBlurListenerCount: () => number
  navigate: ReturnType<typeof vi.fn>
  pressCreateWallet: () => Promise<void>
} {
  const navigate = vi.fn()
  const blurListeners = new Set<() => void>()
  const navigation = {
    navigate,
    addListener: vi.fn((event: string, listener: () => void) => {
      if (event === 'blur') {
        blurListeners.add(listener)
        return (): void => {
          blurListeners.delete(listener)
        }
      }

      return vi.fn()
    }),
  } as unknown as NativeStackNavigationProp<OnboardingStackParamList, OnboardingScreens.Landing>
  const route = { key: 'landing', name: OnboardingScreens.Landing } as RouteProp<
    OnboardingStackParamList,
    OnboardingScreens.Landing
  >

  const screen = render(<LandingScreen navigation={navigation} route={route} />)

  return {
    blur: (): void => {
      if (blurListeners.size === 0) {
        throw new Error('Expected the create-wallet flow to register a blur listener')
      }

      for (const listener of blurListeners) {
        listener()
      }
    },
    getBlurListenerCount: (): number => blurListeners.size,
    navigate,
    pressCreateWallet: async (): Promise<void> => {
      await act(async () => {
        fireEvent.press(screen.getByTestId(TestID.CreateAccount))
      })
    },
  }
}

describe(LandingScreen, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('navigates to the claim step when eligibility resolves true', async () => {
    vi.mocked(resolveUnitagEligibility).mockResolvedValue({ status: 'resolved', canClaim: true })

    const { navigate, pressCreateWallet } = renderLandingScreen()
    await pressCreateWallet()

    expect(navigate).toHaveBeenCalledWith(UnitagScreens.ClaimUnitag, { entryPoint: OnboardingScreens.Landing })
  })

  it('stays on landing when eligibility times out', async () => {
    vi.mocked(resolveUnitagEligibility).mockImplementation(async (resolveEligibility) => {
      await resolveEligibility()
      return { status: 'timeout' }
    })
    const warnSpy = vi.spyOn(logger, 'warn')

    const { navigate, pressCreateWallet } = renderLandingScreen()
    await pressCreateWallet()

    expect(generateOnboardingAccount).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    expect(resolveCanClaimUnitag.mock.calls[0]?.[0]?.aborted).toBe(true)
    expect(warnSpy).toHaveBeenCalledWith(
      'LandingScreen.tsx',
      'onPressCreateWallet',
      expect.stringContaining('Unitag eligibility unresolved after'),
    )
  })

  it('stays on landing when the eligibility request fails', async () => {
    const error = new Error('offline')
    vi.mocked(resolveUnitagEligibility).mockResolvedValue({ status: 'error', error })
    const errorSpy = vi.spyOn(logger, 'error')

    const { navigate, pressCreateWallet } = renderLandingScreen()
    await pressCreateWallet()

    expect(generateOnboardingAccount).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledWith(error, {
      tags: { file: 'LandingScreen.tsx', function: 'onPressCreateWallet' },
    })
  })

  it('continues to notifications only when eligibility resolves false', async () => {
    vi.mocked(resolveUnitagEligibility).mockResolvedValue({ status: 'resolved', canClaim: false })

    const { navigate, pressCreateWallet } = renderLandingScreen()
    await pressCreateWallet()

    expect(generateOnboardingAccount).toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith(...NOTIFICATIONS_NAVIGATION)
  })

  it('does not navigate when the screen blurs before eligibility resolves', async () => {
    const eligibilityResolution = createDeferred<Awaited<ReturnType<typeof resolveUnitagEligibility>>>()
    vi.mocked(resolveUnitagEligibility).mockReturnValue(eligibilityResolution.promise)

    const { blur, navigate, pressCreateWallet } = renderLandingScreen()
    await pressCreateWallet()
    blur()

    await act(async () => {
      eligibilityResolution.resolve({ status: 'resolved', canClaim: true })
      await eligibilityResolution.promise
    })

    expect(generateOnboardingAccount).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('releases the create-wallet CTA when the screen blurs mid-resolve', async () => {
    const eligibilityResolution = createDeferred<Awaited<ReturnType<typeof resolveUnitagEligibility>>>()
    vi.mocked(resolveUnitagEligibility).mockReturnValue(eligibilityResolution.promise)

    const { blur, pressCreateWallet } = renderLandingScreen()
    await pressCreateWallet()
    expect(resolveUnitagEligibility).toHaveBeenCalledTimes(1)

    await act(async () => {
      blur()
    })
    await pressCreateWallet()

    expect(resolveUnitagEligibility).toHaveBeenCalledTimes(2)

    await act(async () => {
      eligibilityResolution.resolve({ status: 'resolved', canClaim: false })
      await eligibilityResolution.promise
    })
  })

  it('leaves the CTA owned by the newest run when an abandoned one settles', async () => {
    const abandoned = createDeferred<Awaited<ReturnType<typeof resolveUnitagEligibility>>>()
    const retry = createDeferred<Awaited<ReturnType<typeof resolveUnitagEligibility>>>()
    vi.mocked(resolveUnitagEligibility).mockReturnValueOnce(abandoned.promise).mockReturnValueOnce(retry.promise)

    const { blur, getBlurListenerCount, navigate, pressCreateWallet } = renderLandingScreen()
    await pressCreateWallet()
    expect(getBlurListenerCount()).toBe(1)
    await act(async () => {
      blur()
    })
    await pressCreateWallet()
    expect(resolveUnitagEligibility).toHaveBeenCalledTimes(2)
    expect(getBlurListenerCount()).toBe(2)

    await act(async () => {
      abandoned.resolve({ status: 'resolved', canClaim: false })
      await abandoned.promise
    })
    expect(getBlurListenerCount()).toBe(1)

    await pressCreateWallet()
    expect(resolveUnitagEligibility).toHaveBeenCalledTimes(2)

    await act(async () => {
      retry.resolve({ status: 'resolved', canClaim: false })
      await retry.promise
    })
    expect(getBlurListenerCount()).toBe(0)

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(...NOTIFICATIONS_NAVIGATION)
  })

  it('stays on landing when account generation fails', async () => {
    vi.mocked(resolveUnitagEligibility).mockResolvedValue({ status: 'resolved', canClaim: false })
    const error = new Error('keyring unavailable')
    generateOnboardingAccount.mockRejectedValueOnce(error)
    const errorSpy = vi.spyOn(logger, 'error')

    const { navigate, pressCreateWallet } = renderLandingScreen()
    await pressCreateWallet()

    expect(navigate).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledWith(error, {
      tags: { file: 'LandingScreen.tsx', function: 'onPressCreateWallet' },
    })
  })

  it('does not navigate when the screen blurs during account generation', async () => {
    vi.mocked(resolveUnitagEligibility).mockResolvedValue({ status: 'resolved', canClaim: false })
    const accountGeneration = createDeferred<void>()
    generateOnboardingAccount.mockReturnValueOnce(accountGeneration.promise)

    const { blur, navigate, pressCreateWallet } = renderLandingScreen()
    await pressCreateWallet()
    expect(generateOnboardingAccount).toHaveBeenCalled()
    blur()

    await act(async () => {
      accountGeneration.resolve(undefined)
      await accountGeneration.promise
    })

    expect(navigate).not.toHaveBeenCalled()
  })

  it('shares the in-flight account generation with a run started after a blur', async () => {
    vi.mocked(resolveUnitagEligibility).mockResolvedValue({ status: 'resolved', canClaim: false })
    const firstGeneration = createDeferred<void>()
    generateOnboardingAccount.mockReturnValueOnce(firstGeneration.promise)

    const { blur, navigate, pressCreateWallet } = renderLandingScreen()
    await pressCreateWallet()
    expect(generateOnboardingAccount).toHaveBeenCalledTimes(1)

    await act(async () => {
      blur()
    })
    await pressCreateWallet()

    expect(resolveUnitagEligibility).toHaveBeenCalledTimes(2)
    expect(generateOnboardingAccount).toHaveBeenCalledTimes(1)

    await act(async () => {
      firstGeneration.resolve(undefined)
      await firstGeneration.promise
    })

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(...NOTIFICATIONS_NAVIGATION)
  })
})
