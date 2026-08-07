import { renderHook } from '@testing-library/react'
import {
  type Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'uniswap/src/components/modals/WarningModal/types'
import { useSwapFormButtonText } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useSwapFormButtonText'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'

const {
  mockUseTransactionModalContext,
  mockUseSwapFormStoreDerivedSwapInfo,
  mockUseIsTokenSelectionInvalid,
  mockUseIsAmountSelectionInvalid,
  mockUseConnectionStatus,
  mockUseIsMissingPlatformWallet,
  mockUseFeatureFlag,
  mockUseParsedSwapWarnings,
  mockUseIsTradeIndicative,
  mockUseIsWebFORNudgeEnabled,
} = vi.hoisted(() => ({
  mockUseTransactionModalContext: vi.fn(),
  mockUseSwapFormStoreDerivedSwapInfo: vi.fn(),
  mockUseIsTokenSelectionInvalid: vi.fn(),
  mockUseIsAmountSelectionInvalid: vi.fn(),
  mockUseConnectionStatus: vi.fn(),
  mockUseIsMissingPlatformWallet: vi.fn(),
  mockUseFeatureFlag: vi.fn(),
  mockUseParsedSwapWarnings: vi.fn(),
  mockUseIsTradeIndicative: vi.fn(),
  mockUseIsWebFORNudgeEnabled: vi.fn(),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => (opts ? `${key}:${JSON.stringify(opts)}` : key),
  }),
}))

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...actual,
    useFeatureFlag: (...args: unknown[]) => mockUseFeatureFlag(...args),
  }
})

vi.mock('uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext', () => ({
  useTransactionModalContext: () => mockUseTransactionModalContext(),
}))

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore', () => ({
  useSwapFormStoreDerivedSwapInfo: (selector: (s: unknown) => unknown) => mockUseSwapFormStoreDerivedSwapInfo(selector),
}))

// Geo-acknowledgement is a separate (main) concern; default it off so these permissioned-pool
// tests exercise the gating logic without pulling in the compliance/geo machinery.
vi.mock('uniswap/src/features/transactions/swap/hooks/useGeoRestrictionAcknowledgment', () => ({
  useNeedsGeoAcknowledgment: () => false,
}))

vi.mock('uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsTokenSelectionInvalid', () => ({
  useIsTokenSelectionInvalid: () => mockUseIsTokenSelectionInvalid(),
}))

vi.mock('uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsAmountSelectionInvalid', () => ({
  useIsAmountSelectionInvalid: () => mockUseIsAmountSelectionInvalid(),
}))

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useConnectionStatus: () => mockUseConnectionStatus(),
}))

vi.mock('uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsMissingPlatformWallet', () => ({
  useIsMissingPlatformWallet: (...args: unknown[]) => mockUseIsMissingPlatformWallet(...args),
}))

vi.mock('uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings', () => ({
  useParsedSwapWarnings: () => mockUseParsedSwapWarnings(),
}))

vi.mock('uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsTradeIndicative', () => ({
  useIsTradeIndicative: () => mockUseIsTradeIndicative(),
}))

vi.mock('uniswap/src/features/providers/webForNudgeProvider', () => ({
  useIsWebFORNudgeEnabled: () => mockUseIsWebFORNudgeEnabled(),
}))

const PERMISSIONED_BLOCKING = {
  type: WarningLabel.PermissionedPool,
  severity: WarningSeverity.Blocked,
  action: WarningAction.DisableReview,
}

const INSUFFICIENT_FUNDS_BLOCKING = {
  type: WarningLabel.InsufficientFunds,
  severity: WarningSeverity.Blocked,
  action: WarningAction.DisableReview,
}

function setupDefaults(): void {
  mockUseTransactionModalContext.mockReturnValue({ swapRedirectCallback: undefined })
  mockUseSwapFormStoreDerivedSwapInfo.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({
      currencies: { input: { currency: { symbol: 'USDC' } } },
      wrapType: WrapType.NotApplicable,
      chainId: 1,
    }),
  )
  mockUseIsTokenSelectionInvalid.mockReturnValue(false)
  mockUseIsAmountSelectionInvalid.mockReturnValue(false)
  mockUseConnectionStatus.mockReturnValue({ isDisconnected: false })
  mockUseIsMissingPlatformWallet.mockReturnValue(false)
  mockUseFeatureFlag.mockReturnValue(false)
  mockUseParsedSwapWarnings.mockReturnValue({
    insufficientBalanceWarning: undefined,
    blockingWarning: undefined,
    insufficientGasFundsWarning: undefined,
  })
  mockUseIsTradeIndicative.mockReturnValue(false)
  mockUseIsWebFORNudgeEnabled.mockReturnValue(false)
}

describe('useSwapFormButtonText', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDefaults()
  })

  it('returns the verify-identity copy when permissioned-pool warning blocks', () => {
    mockUseParsedSwapWarnings.mockReturnValue({
      insufficientBalanceWarning: undefined,
      blockingWarning: PERMISSIONED_BLOCKING,
      insufficientGasFundsWarning: undefined,
    })

    const { result } = renderHook(() => useSwapFormButtonText())

    expect(result.current).toBe('permissionedPool.verifyIdentity.cta')
  })

  it('prefers permissioned-pool copy over swapRedirectCallback "get started"', () => {
    mockUseParsedSwapWarnings.mockReturnValue({
      insufficientBalanceWarning: undefined,
      blockingWarning: PERMISSIONED_BLOCKING,
      insufficientGasFundsWarning: undefined,
    })
    mockUseTransactionModalContext.mockReturnValue({ swapRedirectCallback: vi.fn() })

    const { result } = renderHook(() => useSwapFormButtonText())

    expect(result.current).toBe('permissionedPool.verifyIdentity.cta')
  })

  it('prefers permissioned-pool copy over the disconnected connect-wallet copy', () => {
    mockUseParsedSwapWarnings.mockReturnValue({
      insufficientBalanceWarning: undefined,
      blockingWarning: PERMISSIONED_BLOCKING,
      insufficientGasFundsWarning: undefined,
    })
    mockUseConnectionStatus.mockReturnValue({ isDisconnected: true })

    const { result } = renderHook(() => useSwapFormButtonText())

    expect(result.current).toBe('permissionedPool.verifyIdentity.cta')
  })

  it('prefers permissioned-pool copy over the web FOR nudge copy', () => {
    mockUseParsedSwapWarnings.mockReturnValue({
      insufficientBalanceWarning: undefined,
      blockingWarning: PERMISSIONED_BLOCKING,
      insufficientGasFundsWarning: undefined,
    })
    mockUseIsWebFORNudgeEnabled.mockReturnValue(true)

    const { result } = renderHook(() => useSwapFormButtonText())

    expect(result.current).toBe('permissionedPool.verifyIdentity.cta')
  })

  it('prefers permissioned-pool copy over the indicative-quote copy', () => {
    mockUseParsedSwapWarnings.mockReturnValue({
      insufficientBalanceWarning: undefined,
      blockingWarning: PERMISSIONED_BLOCKING,
      insufficientGasFundsWarning: undefined,
    })
    mockUseIsTradeIndicative.mockReturnValue(true)

    const { result } = renderHook(() => useSwapFormButtonText())

    expect(result.current).toBe('permissionedPool.verifyIdentity.cta')
  })

  it('prefers permissioned-pool copy over the missing-platform-wallet copy', () => {
    mockUseParsedSwapWarnings.mockReturnValue({
      insufficientBalanceWarning: undefined,
      blockingWarning: PERMISSIONED_BLOCKING,
      insufficientGasFundsWarning: undefined,
    })
    mockUseIsMissingPlatformWallet.mockReturnValue(true)

    const { result } = renderHook(() => useSwapFormButtonText())

    expect(result.current).toBe('permissionedPool.verifyIdentity.cta')
  })

  it('prefers permissioned-pool copy over insufficient-balance and insufficient-gas-funds copy', () => {
    mockUseParsedSwapWarnings.mockReturnValue({
      insufficientBalanceWarning: { foo: 'bar' } as unknown as Warning,
      blockingWarning: PERMISSIONED_BLOCKING,
      insufficientGasFundsWarning: { foo: 'bar' } as unknown as Warning,
    })

    const { result } = renderHook(() => useSwapFormButtonText())

    expect(result.current).toBe('permissionedPool.verifyIdentity.cta')
  })

  it('falls back to standard copy when blockingWarning is a different label', () => {
    mockUseParsedSwapWarnings.mockReturnValue({
      insufficientBalanceWarning: undefined,
      blockingWarning: { ...INSUFFICIENT_FUNDS_BLOCKING, buttonText: 'Insufficient funds' },
      insufficientGasFundsWarning: undefined,
    })

    const { result } = renderHook(() => useSwapFormButtonText())

    expect(result.current).toBe('Insufficient funds')
  })

  it('returns the default "review" copy in the happy path', () => {
    const { result } = renderHook(() => useSwapFormButtonText())

    expect(result.current).toBe('swap.button.review')
  })
})
