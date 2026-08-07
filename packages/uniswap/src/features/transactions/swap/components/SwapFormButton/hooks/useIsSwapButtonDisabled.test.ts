import { renderHook } from '@testing-library/react'
import { WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { useIsSwapButtonDisabled } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsSwapButtonDisabled'

const {
  mockUseSwapFormStore,
  mockUseSwapFormStoreDerivedSwapInfo,
  mockUseActiveAddress,
  mockUseActiveWallet,
  mockUseIsMissingPlatformWallet,
  mockUseParsedSwapWarnings,
  mockUseIsBlockedAddress,
  mockUseTransactionModalContext,
  mockUseIsShowingWebFORNudge,
  mockUseIsWebFORNudgeEnabled,
  platform,
} = vi.hoisted(() => ({
  mockUseSwapFormStore: vi.fn(),
  mockUseSwapFormStoreDerivedSwapInfo: vi.fn(),
  mockUseActiveAddress: vi.fn(),
  mockUseActiveWallet: vi.fn(),
  mockUseIsMissingPlatformWallet: vi.fn(),
  mockUseParsedSwapWarnings: vi.fn(),
  mockUseIsBlockedAddress: vi.fn(),
  mockUseTransactionModalContext: vi.fn(),
  mockUseIsShowingWebFORNudge: vi.fn(),
  mockUseIsWebFORNudgeEnabled: vi.fn(),
  platform: { isExtensionApp: false, isMobileApp: false, isWebApp: true },
}))

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore', () => ({
  useSwapFormStore: (selector: (s: unknown) => unknown) => mockUseSwapFormStore(selector),
  useSwapFormStoreDerivedSwapInfo: (selector: (s: unknown) => unknown) => mockUseSwapFormStoreDerivedSwapInfo(selector),
}))

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddress: (...args: unknown[]) => mockUseActiveAddress(...args),
  useActiveWallet: (...args: unknown[]) => mockUseActiveWallet(...args),
}))

vi.mock('uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsMissingPlatformWallet', () => ({
  useIsMissingPlatformWallet: (...args: unknown[]) => mockUseIsMissingPlatformWallet(...args),
}))

vi.mock('uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings', () => ({
  useParsedSwapWarnings: () => mockUseParsedSwapWarnings(),
}))

// Geo-acknowledgement is a separate (main) concern; default it off so these permissioned-pool
// tests exercise the gating logic without pulling in the compliance/geo machinery.
vi.mock('uniswap/src/features/transactions/swap/hooks/useGeoRestrictionAcknowledgment', () => ({
  useNeedsGeoAcknowledgment: () => false,
}))

// Same rationale as the geo-acknowledgement mock: useGeoRestrictionMode reads the derived-swap-info
// `currencies` slice and the compliance API. Default it to 'default' (non-restricting) so the
// permissioned-pool gating below is what these tests actually exercise.
vi.mock('uniswap/src/features/transactions/swap/hooks/useGeoRestrictionMode', () => ({
  useGeoRestrictionMode: () => 'default',
}))

vi.mock('@universe/compliance', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/compliance')>()),
  useIsBlockedAddress: (...args: unknown[]) => mockUseIsBlockedAddress(...args),
}))

vi.mock('uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext', () => ({
  useTransactionModalContext: () => mockUseTransactionModalContext(),
}))

vi.mock('uniswap/src/features/providers/webForNudgeProvider', () => ({
  useIsShowingWebFORNudge: () => mockUseIsShowingWebFORNudge(),
  useIsWebFORNudgeEnabled: () => mockUseIsWebFORNudgeEnabled(),
}))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isExtensionApp() {
      return platform.isExtensionApp
    },
    get isMobileApp() {
      return platform.isMobileApp
    },
    get isWebApp() {
      return platform.isWebApp
    },
  }
})

import { SigningCapability } from 'uniswap/src/features/accounts/store/types/Wallet'

const PERMISSIONED_BLOCKING = {
  type: WarningLabel.PermissionedPool,
  severity: WarningSeverity.Blocked,
  action: WarningAction.DisableReview,
  title: 'Permissioned',
  message: 'Permissioned',
}

const INSUFFICIENT_FUNDS_BLOCKING = {
  type: WarningLabel.InsufficientFunds,
  severity: WarningSeverity.Blocked,
  action: WarningAction.DisableReview,
  title: 'Insufficient funds',
  message: 'Insufficient funds',
}

function setupDefaults(): void {
  mockUseSwapFormStore.mockImplementation((selector: (s: unknown) => unknown) => selector({ isSubmitting: false }))
  mockUseSwapFormStoreDerivedSwapInfo.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({ trade: { trade: undefined }, chainId: 1 }),
  )
  mockUseActiveAddress.mockReturnValue('0xWallet')
  mockUseActiveWallet.mockReturnValue({ signingCapability: SigningCapability.Interactive })
  mockUseIsMissingPlatformWallet.mockReturnValue(false)
  mockUseParsedSwapWarnings.mockReturnValue({ blockingWarning: undefined })
  mockUseIsBlockedAddress.mockReturnValue({ isBlocked: false, isBlockedLoading: false })
  mockUseTransactionModalContext.mockReturnValue({ walletNeedsRestore: false, swapRedirectCallback: undefined })
  mockUseIsShowingWebFORNudge.mockReturnValue(false)
  mockUseIsWebFORNudgeEnabled.mockReturnValue(false)
}

describe('useIsSwapButtonDisabled — isInAppPermissionedPool branch', () => {
  // Reset the full platform object (not selective keys) so a stray mutation in any nested
  // describe cannot leak into the next test via the hoisted singleton.
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(platform, { isExtensionApp: false, isMobileApp: false, isWebApp: true })
    setupDefaults()
  })

  describe('extension', () => {
    beforeEach(() => {
      Object.assign(platform, { isExtensionApp: true, isMobileApp: false, isWebApp: false })
    })

    it('stays enabled when the permissioned-pool warning blocks and no trade is loaded', () => {
      mockUseParsedSwapWarnings.mockReturnValue({ blockingWarning: PERMISSIONED_BLOCKING })

      const { result } = renderHook(() => useIsSwapButtonDisabled())

      expect(result.current).toBe(false)
    })

    it('becomes disabled when the account is blocked even with permissioned warning', () => {
      mockUseParsedSwapWarnings.mockReturnValue({ blockingWarning: PERMISSIONED_BLOCKING })
      mockUseIsBlockedAddress.mockReturnValue({ isBlocked: true, isBlockedLoading: false })

      const { result } = renderHook(() => useIsSwapButtonDisabled())

      expect(result.current).toBe(true)
    })

    it('becomes disabled while submitting even with permissioned warning', () => {
      mockUseParsedSwapWarnings.mockReturnValue({ blockingWarning: PERMISSIONED_BLOCKING })
      mockUseSwapFormStore.mockImplementation((selector: (s: unknown) => unknown) => selector({ isSubmitting: true }))

      const { result } = renderHook(() => useIsSwapButtonDisabled())

      expect(result.current).toBe(true)
    })

    it('becomes disabled while walletNeedsRestore is true even with permissioned warning', () => {
      mockUseParsedSwapWarnings.mockReturnValue({ blockingWarning: PERMISSIONED_BLOCKING })
      mockUseTransactionModalContext.mockReturnValue({ walletNeedsRestore: true, swapRedirectCallback: undefined })

      const { result } = renderHook(() => useIsSwapButtonDisabled())

      expect(result.current).toBe(true)
    })

    it('becomes disabled when the platform wallet is missing even with permissioned warning', () => {
      mockUseParsedSwapWarnings.mockReturnValue({ blockingWarning: PERMISSIONED_BLOCKING })
      mockUseIsMissingPlatformWallet.mockReturnValue(true)

      const { result } = renderHook(() => useIsSwapButtonDisabled())

      expect(result.current).toBe(true)
    })

    it('falls back to standard logic when the blocking warning is not PermissionedPool', () => {
      mockUseParsedSwapWarnings.mockReturnValue({ blockingWarning: INSUFFICIENT_FUNDS_BLOCKING })

      const { result } = renderHook(() => useIsSwapButtonDisabled())

      expect(result.current).toBe(true)
    })
  })

  describe('mobile', () => {
    beforeEach(() => {
      Object.assign(platform, { isExtensionApp: false, isMobileApp: true, isWebApp: false })
    })

    it('stays enabled when permissioned warning blocks and no trade is loaded (parity with extension)', () => {
      mockUseParsedSwapWarnings.mockReturnValue({ blockingWarning: PERMISSIONED_BLOCKING })

      const { result } = renderHook(() => useIsSwapButtonDisabled())

      expect(result.current).toBe(false)
    })
  })

  describe('web', () => {
    it('stays enabled when permissioned warning blocks (parity with extension/mobile; press opens the shared verify-identity Dialog)', () => {
      mockUseParsedSwapWarnings.mockReturnValue({ blockingWarning: PERMISSIONED_BLOCKING })

      const { result } = renderHook(() => useIsSwapButtonDisabled())

      expect(result.current).toBe(false)
    })
  })

  describe('outer disable layer', () => {
    it('never disables when there is a swapRedirectCallback', () => {
      mockUseTransactionModalContext.mockReturnValue({
        walletNeedsRestore: false,
        swapRedirectCallback: vi.fn(),
      })
      mockUseParsedSwapWarnings.mockReturnValue({ blockingWarning: INSUFFICIENT_FUNDS_BLOCKING })

      const { result } = renderHook(() => useIsSwapButtonDisabled())

      expect(result.current).toBe(false)
    })

    it('never disables when wallet cannot sign (view-only)', () => {
      mockUseActiveWallet.mockReturnValue({ signingCapability: SigningCapability.None })
      mockUseParsedSwapWarnings.mockReturnValue({ blockingWarning: INSUFFICIENT_FUNDS_BLOCKING })

      const { result } = renderHook(() => useIsSwapButtonDisabled())

      expect(result.current).toBe(false)
    })

    it('never disables when no wallet is connected (so the connect-wallet press works)', () => {
      mockUseActiveWallet.mockReturnValue(undefined)
      mockUseParsedSwapWarnings.mockReturnValue({ blockingWarning: INSUFFICIENT_FUNDS_BLOCKING })

      const { result } = renderHook(() => useIsSwapButtonDisabled())

      expect(result.current).toBe(false)
    })
  })
})
