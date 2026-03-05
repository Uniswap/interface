import { CurrencyAmount, NativeCurrency } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useParsedActivePlanWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useParsedActivePlanWarnings'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { renderHookWithProviders } from 'uniswap/src/test/render'

// Mock dependencies
vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: vi.fn(),
}))

vi.mock('uniswap/src/features/portfolio/api', () => ({
  useOnChainCurrencyBalance: vi.fn().mockReturnValue({ balance: undefined, isLoading: false, error: null }),
  useOnChainNativeCurrencyBalance: vi.fn().mockReturnValue({ balance: undefined, isLoading: false }),
}))

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddress: vi.fn().mockReturnValue('0x1234567890abcdef1234567890abcdef12345678'),
}))

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore', () => ({
  useSwapFormStore: vi.fn((selector: (s: { isSubmitting: boolean }) => unknown) => selector({ isSubmitting: false })),
}))

import { useOnChainCurrencyBalance, useOnChainNativeCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import type { Mock } from 'vitest'

const mockUseCurrencyInfo = useCurrencyInfo as Mock
const mockUseOnChainCurrencyBalance = useOnChainCurrencyBalance as Mock
const mockUseOnChainNativeCurrencyBalance = useOnChainNativeCurrencyBalance as Mock

const ETH = nativeOnChain(UniverseChainId.Mainnet)

function createMockStep(overrides: Partial<TradingApi.PlanStep> = {}): TradingApi.PlanStep {
  return {
    stepIndex: 0,
    method: TradingApi.PlanStepMethod.SEND_TX,
    payloadType: TradingApi.PlanStepPayloadType.TX,
    payload: {},
    status: TradingApi.PlanStepStatus.AWAITING_ACTION,
    tokenIn: '0x0000000000000000000000000000000000000000',
    tokenInChainId: TradingApi.ChainId._1,
    tokenInAmount: '1000000000000000000', // 1 ETH
    stepType: TradingApi.PlanStepType.CLASSIC,
    gasFee: '21000000000000', // ~0.000021 ETH
    ...overrides,
  } as TradingApi.PlanStep
}

function setActivePlan(steps: TradingApi.PlanStep[], currentStepIndex = 0): void {
  activePlanStore.setState({
    activePlan: {
      planId: 'test-plan',
      inputChainId: UniverseChainId.Mainnet,
      steps: steps as never[],
      currentStepIndex,
      proofPending: false,
      response: {} as TradingApi.PlanResponse,
    },
  })
}

function mockBalances(tokenBalance: string, nativeBalance: string): void {
  mockUseCurrencyInfo.mockReturnValue({ currency: ETH, currencyId: 'ETH' })
  mockUseOnChainCurrencyBalance.mockReturnValue({
    balance: CurrencyAmount.fromRawAmount(ETH, tokenBalance),
    isLoading: false,
    error: null,
  })
  mockUseOnChainNativeCurrencyBalance.mockReturnValue({
    balance: CurrencyAmount.fromRawAmount(ETH, nativeBalance) as CurrencyAmount<NativeCurrency>,
    isLoading: false,
  })
}

describe(useParsedActivePlanWarnings, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    activePlanStore.setState({ activePlan: undefined })
  })

  it('returns empty ParsedWarnings when no active plan', () => {
    const { result } = renderHookWithProviders(() => useParsedActivePlanWarnings())

    expect(result.current.warnings).toHaveLength(0)
    expect(result.current.insufficientBalanceWarning).toBeUndefined()
    expect(result.current.insufficientGasFundsWarning).toBeUndefined()
  })

  it('returns no balance/gas warnings for SIGN_MSG-only step', () => {
    const step = createMockStep({ method: TradingApi.PlanStepMethod.SIGN_MSG })
    setActivePlan([step])

    const { result } = renderHookWithProviders(() => useParsedActivePlanWarnings())

    expect(result.current.warnings).toHaveLength(0)
    expect(result.current.insufficientBalanceWarning).toBeUndefined()
    expect(result.current.insufficientGasFundsWarning).toBeUndefined()
  })

  it('returns no warnings for SEND_TX swap step with sufficient balance', () => {
    setActivePlan([createMockStep()])
    mockBalances('2000000000000000000', '2000000000000000000')

    const { result } = renderHookWithProviders(() => useParsedActivePlanWarnings())

    expect(result.current.insufficientBalanceWarning).toBeUndefined()
    expect(result.current.insufficientGasFundsWarning).toBeUndefined()
  })

  it('returns InsufficientFunds warning for SEND_TX swap step with insufficient balance', () => {
    setActivePlan([createMockStep({ tokenInAmount: '2000000000000000000' })])
    mockBalances('1000000000000000000', '1000000000000000000')

    const { result } = renderHookWithProviders(() => useParsedActivePlanWarnings())

    expect(result.current.insufficientBalanceWarning).toBeDefined()
    expect(result.current.insufficientBalanceWarning?.type).toBe(WarningLabel.InsufficientFunds)
  })

  it('returns InsufficientGasFunds warning for SEND_TX step with insufficient gas', () => {
    setActivePlan([
      createMockStep({
        tokenInAmount: '500000000000000000', // 0.5 ETH
        gasFee: '900000000000000000', // 0.9 ETH gas
      }),
    ])
    mockBalances('1000000000000000000', '1000000000000000000')

    const { result } = renderHookWithProviders(() => useParsedActivePlanWarnings())

    expect(result.current.insufficientGasFundsWarning).toBeDefined()
    expect(result.current.insufficientGasFundsWarning?.type).toBe(WarningLabel.InsufficientGasFunds)
  })

  it('returns no balance warning for approval-only step', () => {
    setActivePlan([
      createMockStep({
        stepType: TradingApi.PlanStepType.APPROVAL_TXN,
        tokenInAmount: '2000000000000000000',
      }),
    ])
    mockBalances('1000000000000000000', '1000000000000000000')

    const { result } = renderHookWithProviders(() => useParsedActivePlanWarnings())

    expect(result.current.insufficientBalanceWarning).toBeUndefined()
  })

  // --- Look-ahead tests ---

  it('fires balance warning from upcoming BRIDGE when current step is SIGN_MSG', () => {
    const signStep = createMockStep({
      stepIndex: 1,
      method: TradingApi.PlanStepMethod.SIGN_MSG,
      status: TradingApi.PlanStepStatus.AWAITING_ACTION,
    })
    const bridgeStep = createMockStep({
      stepIndex: 2,
      stepType: TradingApi.PlanStepType.BRIDGE,
      tokenInAmount: '2000000000000000000', // needs 2 ETH
      status: TradingApi.PlanStepStatus.NOT_READY,
    })

    setActivePlan([signStep, bridgeStep], 0) // current = signStep
    mockBalances('1000000000000000000', '1000000000000000000') // only 1 ETH

    const { result } = renderHookWithProviders(() => useParsedActivePlanWarnings())

    // Even though current step is SIGN_MSG, the upcoming BRIDGE needs 2 ETH
    expect(result.current.insufficientBalanceWarning).toBeDefined()
    expect(result.current.insufficientBalanceWarning?.type).toBe(WarningLabel.InsufficientFunds)
  })

  it('sums gas fees across APPROVE + BRIDGE on the same chain', () => {
    const approveStep = createMockStep({
      stepIndex: 0,
      stepType: TradingApi.PlanStepType.APPROVAL_TXN,
      gasFee: '500000000000000000', // 0.5 ETH gas for approval
      status: TradingApi.PlanStepStatus.AWAITING_ACTION,
    })
    const bridgeStep = createMockStep({
      stepIndex: 1,
      stepType: TradingApi.PlanStepType.BRIDGE,
      tokenInAmount: '100000000000000000', // 0.1 ETH bridge amount
      gasFee: '500000000000000000', // 0.5 ETH gas for bridge
      status: TradingApi.PlanStepStatus.NOT_READY,
    })

    setActivePlan([approveStep, bridgeStep], 0)
    // Native balance 1 ETH: needs 0.1 (bridge native spend) + 1.0 (summed gas) = 1.1 ETH total → insufficient
    mockBalances('1000000000000000000', '1000000000000000000')

    const { result } = renderHookWithProviders(() => useParsedActivePlanWarnings())

    expect(result.current.insufficientGasFundsWarning).toBeDefined()
    expect(result.current.insufficientGasFundsWarning?.type).toBe(WarningLabel.InsufficientGasFunds)
  })

  it('ignores steps on a different chain than the current step', () => {
    // BASE steps (completed or different chain)
    const baseApprove = createMockStep({
      stepIndex: 0,
      stepType: TradingApi.PlanStepType.APPROVAL_TXN,
      tokenInChainId: TradingApi.ChainId._8453,
      status: TradingApi.PlanStepStatus.COMPLETE,
    })
    const baseBridge = createMockStep({
      stepIndex: 1,
      stepType: TradingApi.PlanStepType.BRIDGE,
      tokenInChainId: TradingApi.ChainId._8453,
      tokenInAmount: '5000000000000000000', // 5 ETH on Base
      status: TradingApi.PlanStepStatus.COMPLETE,
    })
    // OP step (current)
    const opSwap = createMockStep({
      stepIndex: 2,
      stepType: TradingApi.PlanStepType.CLASSIC,
      tokenInChainId: TradingApi.ChainId._1, // Mainnet for test simplicity
      tokenInAmount: '500000000000000000', // 0.5 ETH
      status: TradingApi.PlanStepStatus.AWAITING_ACTION,
    })

    setActivePlan([baseApprove, baseBridge, opSwap], 2)
    // Sufficient balance for the OP swap
    mockBalances('1000000000000000000', '1000000000000000000')

    const { result } = renderHookWithProviders(() => useParsedActivePlanWarnings())

    // BASE steps are on a different chain and COMPLETE — should not cause warnings
    expect(result.current.insufficientBalanceWarning).toBeUndefined()
    expect(result.current.insufficientGasFundsWarning).toBeUndefined()
  })

  it('returns no warnings when all remaining steps on chain are COMPLETE', () => {
    const completedStep = createMockStep({
      stepIndex: 0,
      tokenInAmount: '5000000000000000000', // would need 5 ETH if not complete
      status: TradingApi.PlanStepStatus.COMPLETE,
    })

    setActivePlan([completedStep], 0)
    mockBalances('1000000000000000000', '1000000000000000000')

    const { result } = renderHookWithProviders(() => useParsedActivePlanWarnings())

    // Step is COMPLETE so it's not in remainingStepsOnChain
    expect(result.current.insufficientBalanceWarning).toBeUndefined()
    expect(result.current.insufficientGasFundsWarning).toBeUndefined()
  })
})
