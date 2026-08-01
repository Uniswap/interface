import type { ReactNode } from 'react'
import { EarnSwapToggle } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/EarnSwapToggle'
import { SubmitSwapButton } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/SubmitSwapButton'
import { SwapReviewFooter } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/SwapReviewFooter'
import { renderWithProviders } from 'uniswap/src/test/render'

type MockActivePlanState = {
  activePlan?: unknown
  actions: {
    resetActivePlan: () => void
    setActivePlan: (plan: unknown) => void
  }
}

const mockPlatformState = vi.hoisted(() => ({ isWebApp: false, isWebPlatform: true }))
const mockSwapReviewState = vi.hoisted(() => ({ showInterfaceReviewSteps: false }))
const mockActivePlanStore = vi.hoisted(() => {
  const listeners = new Set<() => void>()
  let state: MockActivePlanState = {
    activePlan: undefined,
    actions: {
      resetActivePlan: () => {
        state = { ...state, activePlan: undefined }
        listeners.forEach((listener) => listener())
      },
      setActivePlan: (plan) => {
        state = { ...state, activePlan: plan }
        listeners.forEach((listener) => listener())
      },
    },
  }

  return {
    getInitialState: (): MockActivePlanState => state,
    getState: (): MockActivePlanState => state,
    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
})

// Minimal store state for the selectors SwapReviewFooter reads. `routing` is any
// non-Jupiter/non-UniswapX value so `getEVMTxRequest` falls through to
// `txRequests?.[0]` (undefined), and `trade: undefined` short-circuits
// `validateSwapTxContext`.
const mockSwapReviewTransactionState = vi.hoisted(() => ({
  chainId: undefined,
  derivedSwapInfo: { trade: { trade: undefined } },
  swapTxContext: { routing: 'CLASSIC', trade: undefined, txRequests: undefined, gasFee: undefined },
  tokenWarningProps: undefined,
  feeOnTransferProps: undefined,
  blockingWarning: undefined,
  newTradeRequiresAcceptance: false,
  reviewScreenWarning: undefined,
  isWrap: false,
}))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isWebApp(): boolean {
      return mockPlatformState.isWebApp
    },
    get isWebPlatform(): boolean {
      return mockPlatformState.isWebPlatform
    },
  }
})

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...actual,
    useFeatureFlag: (): boolean => false,
  }
})

vi.mock('uniswap/src/features/transactions/swap/review/SwapReviewScreen/EarnSwapToggle', () => ({
  EarnSwapToggle: vi.fn((): null => null),
}))

vi.mock('uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/SubmitSwapButton', () => ({
  SubmitSwapButton: vi.fn((): null => null),
}))

vi.mock('uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore', () => ({
  activePlanStore: mockActivePlanStore,
}))

vi.mock('uniswap/src/features/transactions/components/TransactionModal/TransactionModal', () => ({
  TransactionModal: ({ children }: { children?: ReactNode }): ReactNode => children,
  TransactionModalInnerContainer: ({ children }: { children?: ReactNode }): ReactNode => children,
  TransactionModalFooterContainer: ({ children }: { children?: ReactNode }): ReactNode => children,
}))

vi.mock('uniswap/src/features/transactions/TransactionDetails/UnichainPoweredMessage', () => ({
  UnichainPoweredMessage: (): null => null,
}))

vi.mock('uniswap/src/features/transactions/swap/review/hooks/useSwapOnPrevious', () => ({
  useSwapOnPrevious: (): { onPrev: () => void } => ({ onPrev: vi.fn() }),
}))

vi.mock('uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore', () => ({
  useShowInterfaceReviewSteps: (): boolean => mockSwapReviewState.showInterfaceReviewSteps,
}))

vi.mock(
  'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore',
  () => ({
    useSwapReviewTransactionStore: (selector: (s: typeof mockSwapReviewTransactionState) => unknown): unknown =>
      selector(mockSwapReviewTransactionState),
    useIsEarnQuoteRefreshLoading: (): boolean => false,
  }),
)

vi.mock(
  'uniswap/src/features/transactions/swap/review/stores/swapReviewWarningStore/useSwapReviewWarningStore',
  () => ({
    useSwapReviewWarningStore: (selector: (s: { tokenWarningChecked: boolean }) => unknown): unknown =>
      selector({ tokenWarningChecked: true }),
  }),
)

vi.mock(
  'uniswap/src/features/transactions/swap/review/stores/swapReviewCallbacksStore/useSwapReviewCallbacksStore',
  () => ({
    useSwapReviewCallbacksStore: (selector: (s: { onSwapButtonClick: () => Promise<void> }) => unknown): unknown =>
      selector({ onSwapButtonClick: (): Promise<void> => Promise.resolve() }),
  }),
)

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore', () => ({
  useSwapFormStore: (selector: (s: { isSubmitting: boolean; showPendingUI: boolean }) => unknown): unknown =>
    selector({ isSubmitting: false, showPendingUI: false }),
}))

vi.mock(
  'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore',
  () => ({
    useTransactionSettingsStore: (selector: (s: { gasOverrides: undefined }) => unknown): unknown =>
      selector({ gasOverrides: undefined }),
    useTransactionSettingsActions: (): { setGasOverrides: () => void } => ({ setGasOverrides: vi.fn() }),
  }),
)

vi.mock('uniswap/src/features/gas/components/NetworkCostEditor/useGasOverridesWarningState', () => ({
  useGasOverridesWarningState: (): { hasWarning: boolean } => ({ hasWarning: false }),
}))

vi.mock('uniswap/src/features/gas/hooks/useIsCustomGasFlowAvailable', () => ({
  useIsCustomGasFlowAvailable: (): boolean => false,
}))

vi.mock('uniswap/src/features/transactions/TransactionDetails/utils/getShouldDisplayTokenWarningCard', () => ({
  getShouldDisplayTokenWarningCard: (): { shouldDisplayTokenWarningCard: boolean } => ({
    shouldDisplayTokenWarningCard: false,
  }),
}))

vi.mock('uniswap/src/utils/saga', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/utils/saga')>()
  return {
    ...actual,
    useMonitoredSagaStatus: (): { status: null } => ({ status: null }),
  }
})

describe('SwapReviewFooter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSwapReviewState.showInterfaceReviewSteps = false
    mockActivePlanStore.getState().actions.resetActivePlan()
  })

  it('does not render EarnSwapToggle on the extension (web platform but not the web app)', () => {
    mockPlatformState.isWebPlatform = true
    mockPlatformState.isWebApp = false

    renderWithProviders(<SwapReviewFooter />)

    // The footer itself rendered — the gate, not the whole component, hid the toggle.
    expect(vi.mocked(SubmitSwapButton)).toHaveBeenCalled()
    expect(vi.mocked(EarnSwapToggle)).not.toHaveBeenCalled()
  })

  it('renders EarnSwapToggle on the web app', () => {
    mockPlatformState.isWebPlatform = true
    mockPlatformState.isWebApp = true

    renderWithProviders(<SwapReviewFooter />)

    expect(vi.mocked(SubmitSwapButton)).toHaveBeenCalled()
    expect(vi.mocked(EarnSwapToggle)).toHaveBeenCalled()
  })

  it('renders EarnSwapToggle on native mobile', () => {
    mockPlatformState.isWebPlatform = false
    mockPlatformState.isWebApp = false

    renderWithProviders(<SwapReviewFooter />)

    expect(vi.mocked(SubmitSwapButton)).toHaveBeenCalled()
    expect(vi.mocked(EarnSwapToggle)).toHaveBeenCalled()
  })

  it('does not render EarnSwapToggle while an active plan can be continued or retried', () => {
    mockPlatformState.isWebPlatform = true
    mockPlatformState.isWebApp = true
    mockActivePlanStore.getState().actions.setActivePlan({ planId: 'plan-id' })

    renderWithProviders(<SwapReviewFooter />)

    expect(vi.mocked(SubmitSwapButton)).toHaveBeenCalled()
    expect(vi.mocked(EarnSwapToggle)).not.toHaveBeenCalled()
  })

  it('does not render the footer while interface review steps are active and no plan can be retried', () => {
    mockPlatformState.isWebPlatform = true
    mockPlatformState.isWebApp = true
    mockSwapReviewState.showInterfaceReviewSteps = true

    renderWithProviders(<SwapReviewFooter />)

    expect(vi.mocked(SubmitSwapButton)).not.toHaveBeenCalled()
    expect(vi.mocked(EarnSwapToggle)).not.toHaveBeenCalled()
  })
})
