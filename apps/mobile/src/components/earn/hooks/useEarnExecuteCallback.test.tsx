import { act, renderHook } from '@testing-library/react-native'
import type { Currency } from '@uniswap/sdk-core'
import type { ChainedQuoteResponse, TradingApi } from '@universe/api'
import { useEarnExecuteCallback } from 'src/components/earn/hooks/useEarnExecuteCallback'

type BiometricTriggerArgs = {
  failureCallback?: () => void
  successCallback?: () => void
}

const mocks = vi.hoisted(() => ({
  biometricTrigger: vi.fn((_args?: BiometricTriggerArgs) => Promise.resolve()),
  buildEarnChainedActionTrade: vi.fn(() => ({ routing: 'CHAINED' })),
  buildEarnPlanAnalytics: vi.fn(() => ({})),
  buildEarnSwapTxContext: vi.fn(() => ({ routing: 'CHAINED' })),
  dispatch: vi.fn(),
  isEarnEnabled: true,
  isTestnetModeEnabled: false,
  requiredForTransactions: true,
}))

vi.mock('react-redux', () => ({
  useDispatch: (): typeof mocks.dispatch => mocks.dispatch,
  useStore: () => ({
    getState: () => ({
      userSettings: { isTestnetModeEnabled: mocks.isTestnetModeEnabled },
    }),
  }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string): string => key }),
}))

vi.mock('src/features/biometrics/useBiometricAppSettings', () => ({
  useBiometricAppSettings: () => ({ requiredForTransactions: mocks.requiredForTransactions }),
}))

vi.mock('src/features/biometricsSettings/hooks', () => ({
  useBiometricPrompt: () => ({ trigger: mocks.biometricTrigger }),
}))

vi.mock('uniswap/src/features/earn/hooks/useIsEarnEnabled', () => ({
  getIsEarnEnabled: () => mocks.isEarnEnabled,
}))

vi.mock('wallet/src/features/accounts/store/hooks', () => ({
  useAccountsStore: () => undefined,
  useActiveAddress: () => '0x0000000000000000000000000000000000000001',
}))

vi.mock('wallet/src/features/transactions/swap/configuredSagas', () => ({
  executePlanActions: {
    trigger: (payload: unknown) => ({ type: 'executePlan/trigger', payload }),
  },
}))

vi.mock('uniswap/src/features/earn/planExecution', () => ({
  buildEarnChainedActionTrade: mocks.buildEarnChainedActionTrade,
  buildEarnPlanAnalytics: mocks.buildEarnPlanAnalytics,
  buildEarnSwapTxContext: mocks.buildEarnSwapTxContext,
  EarnPlanPriceChangeError: class EarnPlanPriceChangeError extends Error {},
  EarnPlanUnavailableError: class EarnPlanUnavailableError extends Error {},
}))

vi.mock('uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore', () => ({
  activePlanStore: {
    getState: () => ({
      activePlan: undefined,
      executionLockPlanId: undefined,
      priceChangeInterruptedPlanIds: new Set(),
      actions: { clearPriceChangeInterrupted: vi.fn() },
    }),
  },
}))

const PARAMS = {
  earnIntent: {} as TradingApi.EarnIntent,
  inputCurrency: {} as Currency,
  outputCurrency: {} as Currency,
  quote: {} as ChainedQuoteResponse,
  onSuccess: vi.fn(),
  onFailure: vi.fn(),
  onSubmitted: vi.fn(),
}

describe(useEarnExecuteCallback, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isEarnEnabled = true
    mocks.isTestnetModeEnabled = false
    mocks.requiredForTransactions = true
  })

  it('waits for biometric success before submitting an Earn plan', async () => {
    const { result } = renderHook(() => useEarnExecuteCallback())

    act(() => result.current(PARAMS))

    expect(mocks.biometricTrigger).toHaveBeenCalledOnce()
    expect(mocks.dispatch).not.toHaveBeenCalled()
    expect(PARAMS.onSubmitted).not.toHaveBeenCalled()

    const { successCallback } = mocks.biometricTrigger.mock.calls[0]![0] as {
      successCallback: () => void
    }
    await act(async () => successCallback())

    expect(PARAMS.onSubmitted).toHaveBeenCalledOnce()
    expect(mocks.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'executePlan/trigger' }))
  })

  it('submits immediately when transaction biometrics are disabled', () => {
    mocks.requiredForTransactions = false
    const { result } = renderHook(() => useEarnExecuteCallback())

    act(() => result.current(PARAMS))

    expect(mocks.biometricTrigger).not.toHaveBeenCalled()
    expect(PARAMS.onSubmitted).toHaveBeenCalledOnce()
    expect(mocks.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'executePlan/trigger' }))
  })

  it('does not submit when biometric authentication fails', () => {
    const { result } = renderHook(() => useEarnExecuteCallback())

    act(() => result.current(PARAMS))

    const { failureCallback } = mocks.biometricTrigger.mock.calls[0]![0] as {
      failureCallback: () => void
    }
    act(() => failureCallback())

    expect(PARAMS.onFailure).toHaveBeenCalledOnce()
    expect(PARAMS.onSubmitted).not.toHaveBeenCalled()
    expect(mocks.dispatch).not.toHaveBeenCalled()
  })

  it('reports a biometric prompt error without submitting', async () => {
    mocks.biometricTrigger.mockRejectedValueOnce(new Error('Biometric prompt failed'))
    const { result } = renderHook(() => useEarnExecuteCallback())

    await act(async () => result.current(PARAMS))

    expect(PARAMS.onFailure).toHaveBeenCalledOnce()
    expect(PARAMS.onSubmitted).not.toHaveBeenCalled()
    expect(mocks.dispatch).not.toHaveBeenCalled()
  })

  it('blocks execution in testnet mode', () => {
    mocks.isTestnetModeEnabled = true
    const { result } = renderHook(() => useEarnExecuteCallback())

    act(() => result.current(PARAMS))

    expect(PARAMS.onFailure).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'explore.earn.review.unavailable' }),
    )
    expect(mocks.biometricTrigger).not.toHaveBeenCalled()
    expect(mocks.dispatch).not.toHaveBeenCalled()
  })

  it('blocks execution when Earn is disabled', () => {
    mocks.isEarnEnabled = false
    const { result } = renderHook(() => useEarnExecuteCallback())

    act(() => result.current(PARAMS))

    expect(PARAMS.onFailure).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'explore.earn.review.unavailable' }),
    )
    expect(mocks.biometricTrigger).not.toHaveBeenCalled()
    expect(mocks.dispatch).not.toHaveBeenCalled()
  })

  it('rechecks the Earn flag after biometric authentication succeeds', () => {
    const { result } = renderHook(() => useEarnExecuteCallback())

    act(() => result.current(PARAMS))
    const { successCallback } = mocks.biometricTrigger.mock.calls[0]![0] as {
      successCallback: () => void
    }

    mocks.isEarnEnabled = false
    act(() => successCallback())

    expect(PARAMS.onFailure).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'explore.earn.review.unavailable' }),
    )
    expect(PARAMS.onSubmitted).not.toHaveBeenCalled()
    expect(mocks.dispatch).not.toHaveBeenCalled()
  })

  it('rechecks testnet mode after biometric authentication succeeds', () => {
    const { result } = renderHook(() => useEarnExecuteCallback())

    act(() => result.current(PARAMS))
    const { successCallback } = mocks.biometricTrigger.mock.calls[0]![0] as {
      successCallback: () => void
    }

    mocks.isTestnetModeEnabled = true
    act(() => successCallback())

    expect(PARAMS.onFailure).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'explore.earn.review.unavailable' }),
    )
    expect(PARAMS.onSubmitted).not.toHaveBeenCalled()
    expect(mocks.dispatch).not.toHaveBeenCalled()
  })
})
