import { renderHook } from '@testing-library/react'
import { useSwapFormButtonColors } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useSwapFormButtonColors'

const {
  mockUseIsSwapButtonDisabled,
  mockUseIsBlockedByPermissionedPool,
  mockUseIsBlockingWithCustomMessage,
  mockUseSwapFormStoreDerivedSwapInfo,
  mockUseActiveAccount,
  mockUseSwapFormStore,
  mockUseIsShowingWebFORNudge,
  mockUseColorsFromTokenColor,
  mockUseTransactionModalContext,
  mockUseIsWebFORNudgeEnabled,
} = vi.hoisted(() => ({
  mockUseIsSwapButtonDisabled: vi.fn(),
  mockUseIsBlockedByPermissionedPool: vi.fn(),
  mockUseIsBlockingWithCustomMessage: vi.fn(),
  mockUseSwapFormStoreDerivedSwapInfo: vi.fn(),
  mockUseActiveAccount: vi.fn(),
  mockUseSwapFormStore: vi.fn(),
  mockUseIsShowingWebFORNudge: vi.fn(),
  mockUseColorsFromTokenColor: vi.fn(),
  mockUseTransactionModalContext: vi.fn(),
  mockUseIsWebFORNudgeEnabled: vi.fn(),
}))

// Mock only the function the hook calls. Avoid `importOriginal` here — pulling all of
// `ui/src` brings in Tamagui's full module graph (heavy in JSDOM) for a single override.
// The hook itself only uses ButtonProps / ColorTokens as types (erased at runtime).
vi.mock('ui/src', () => ({
  useColorsFromTokenColor: (...args: unknown[]) => mockUseColorsFromTokenColor(...args),
}))

vi.mock('uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsSwapButtonDisabled', () => ({
  useIsSwapButtonDisabled: () => mockUseIsSwapButtonDisabled(),
}))

vi.mock(
  'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsBlockedByPermissionedPool',
  () => ({
    useIsBlockedByPermissionedPool: () => mockUseIsBlockedByPermissionedPool(),
  }),
)

vi.mock(
  'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsBlockingWithCustomMessage',
  () => ({
    useIsBlockingWithCustomMessage: () => mockUseIsBlockingWithCustomMessage(),
  }),
)

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore', () => ({
  useSwapFormStoreDerivedSwapInfo: (selector: (s: unknown) => unknown) => mockUseSwapFormStoreDerivedSwapInfo(selector),
  useSwapFormStore: (selector: (s: unknown) => unknown) => mockUseSwapFormStore(selector),
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

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAccount: (...args: unknown[]) => mockUseActiveAccount(...args),
}))

vi.mock('uniswap/src/features/providers/webForNudgeProvider', () => ({
  useIsShowingWebFORNudge: () => mockUseIsShowingWebFORNudge(),
  useIsWebFORNudgeEnabled: () => mockUseIsWebFORNudgeEnabled(),
}))

vi.mock('uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext', () => ({
  useTransactionModalContext: () => mockUseTransactionModalContext(),
}))

function setupDefaults(): void {
  mockUseIsSwapButtonDisabled.mockReturnValue(false)
  mockUseIsBlockedByPermissionedPool.mockReturnValue(false)
  mockUseIsBlockingWithCustomMessage.mockReturnValue(false)
  mockUseSwapFormStoreDerivedSwapInfo.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({ chainId: 1 }),
  )
  mockUseActiveAccount.mockReturnValue({ address: '0xWallet' })
  mockUseSwapFormStore.mockImplementation((selector: (s: unknown) => unknown) => selector({ isSubmitting: false }))
  mockUseIsShowingWebFORNudge.mockReturnValue(false)
  mockUseColorsFromTokenColor.mockReturnValue({ validTokenColor: '$accent1', lightTokenColor: '$accent2' })
  mockUseTransactionModalContext.mockReturnValue({ swapRedirectCallback: undefined })
  mockUseIsWebFORNudgeEnabled.mockReturnValue(false)
}

describe('useSwapFormButtonColors — permissioned-pool branch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDefaults()
  })

  it('uses default+primary and undefined background when permissioned-pool warning blocks (Figma-specified style)', () => {
    // The Verify-Identity CTA must not inherit any token-color tint (passing '#abcabc'
    // here proves the override). Per Figma node 1-22014, the button is the design-system
    // default primary, distinct from the branded-color Swap CTA — this keeps the gating
    // affordance visually separate from the standard happy-path button.
    mockUseIsBlockedByPermissionedPool.mockReturnValue(true)

    const { result } = renderHook(() => useSwapFormButtonColors('#abcabc'))

    expect(result.current.variant).toBe('default')
    expect(result.current.emphasis).toBe('primary')
    expect(result.current.backgroundColor).toBeUndefined()
  })

  it('uses default+primary even when the underlying disabled state is true', () => {
    mockUseIsSwapButtonDisabled.mockReturnValue(true)
    mockUseIsBlockedByPermissionedPool.mockReturnValue(true)

    const { result } = renderHook(() => useSwapFormButtonColors('#abcabc'))

    expect(result.current.variant).toBe('default')
    expect(result.current.emphasis).toBe('primary')
    expect(result.current.backgroundColor).toBeUndefined()
  })

  it('falls back to branded+primary for a non-permissioned blocking warning with active account', () => {
    const { result } = renderHook(() => useSwapFormButtonColors('#abcabc'))

    expect(result.current.variant).toBe('branded')
    expect(result.current.emphasis).toBe('primary')
  })

  it('does not apply permissioned styling when blocking warning is a different label', () => {
    mockUseIsSwapButtonDisabled.mockReturnValue(true)
    mockUseIsBlockingWithCustomMessage.mockReturnValue(true)

    const { result } = renderHook(() => useSwapFormButtonColors('#abcabc'))

    expect(result.current.variant).toBe('default')
    expect(result.current.emphasis).toBe('secondary')
  })
})
