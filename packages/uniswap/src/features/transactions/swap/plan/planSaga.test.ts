import { TradingApi } from '@universe/api'
import { runSaga, stdChannel } from 'redux-saga'
import { UNI, WBTC } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import type { FetchAndTransformPlanResult } from 'uniswap/src/features/transactions/swap/plan/planSagaUtils'
import type { TransactionAndPlanStep } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import type { WatchPlanStepResult } from 'uniswap/src/features/transactions/swap/plan/watchPlanStepSaga'
import type { ValidatedChainedSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ChainedActionTrade } from 'uniswap/src/features/transactions/swap/types/trade'

interface InitializePlanResult extends FetchAndTransformPlanResult {
  response?: TradingApi.PlanResponse
  wasPlanResumed: boolean
}

// ── Test constants ──────────────────────────────────────────────────────
const INPUT_TOKEN = UNI[UniverseChainId.Mainnet]
const OUTPUT_TOKEN = WBTC
const INPUT_AMOUNT = '1000000000000000000' // 1e18
const OUTPUT_AMOUNT = '100000000' // 1e8 (original trade output)
const ADDRESS = '0x1234567890123456789012345678901234567890' as Address

// ── Mock tracking ───────────────────────────────────────────────────────
let initializePlanResult: InitializePlanResult
let watchPlanStepResult: WatchPlanStepResult

const mockResetActivePlan = vi.fn()
const mockIsPlanBackgrounded = vi.fn().mockReturnValue(false)
const mockIsPlanCancelledCheck = vi.fn().mockReturnValue(false)
const mockUpdateGlobalStateWithLatestSteps = vi.fn()
const mockUpdateGlobalStateProofPending = vi.fn()
const mockClearPlan = vi.fn()
const mockBackgroundPlan = vi.fn()
const mockLogHelper = vi.fn()
const mockLockPlanForExecution = vi.fn()
const mockUnlockPlanExecution = vi.fn()

// ── Module mocks ────────────────────────────────────────────────────────
vi.mock('uniswap/src/features/transactions/swap/plan/planSagaUtils', async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal()
  return {
    ...actual,
    // biome-ignore lint/correctness/useYield: saga mock — runSaga requires generator functions
    initializePlan: vi.fn().mockImplementation(function* () {
      return initializePlanResult
    }),
    resetActivePlan: (...args: unknown[]): unknown => mockResetActivePlan(...args),
    isPlanBackgrounded: (...args: unknown[]): unknown => mockIsPlanBackgrounded(...args),
    isPlanCancelledCheck: (...args: unknown[]): unknown => mockIsPlanCancelledCheck(...args),
    updateGlobalStateWithLatestSteps: (...args: unknown[]): unknown => mockUpdateGlobalStateWithLatestSteps(...args),
    updateGlobalStateProofPending: (...args: unknown[]): unknown => mockUpdateGlobalStateProofPending(...args),
    clearPlan: (...args: unknown[]): unknown => mockClearPlan(...args),
    backgroundPlan: (...args: unknown[]): unknown => mockBackgroundPlan(...args),
    logHelper: (...args: unknown[]): unknown => mockLogHelper(...args),
    lockPlanForExecution: (...args: unknown[]): unknown => mockLockPlanForExecution(...args),
    unlockPlanExecution: (...args: unknown[]): unknown => mockUnlockPlanExecution(...args),
    getWalletExecutionContext: (): undefined => undefined,
    // eslint-disable-next-line object-shorthand, @typescript-eslint/explicit-function-return-type
    showPendingOnEarlyModalClose: function* () {
      yield // no-op: avoids the real saga which waits on signalSwapModalClosed
    },
  }
})

vi.mock('uniswap/src/features/transactions/swap/plan/watchPlanStepSaga', () => ({
  // biome-ignore lint/correctness/useYield: saga mock — runSaga requires generator functions
  watchPlanStep: vi.fn().mockImplementation(function* () {
    return watchPlanStepResult
  }),
}))

vi.mock('utilities/src/async/retryWithBackoff', () => ({
  retryWithBackoff: vi.fn().mockResolvedValue(undefined),
  BackoffStrategy: { None: 'none' },
}))

vi.mock('uniswap/src/data/apiClients/tradingApi/TradingApiSessionClient', () => ({
  TradingApiSessionClient: {
    updateExistingPlan: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('uniswap/src/utils/saga', () => ({
  createMonitoredSaga: vi.fn().mockImplementation(({ saga, name }: { saga: unknown; name: string }) => ({
    name,
    wrappedSaga: saga,
    reducer: (): Record<string, never> => ({}),
    actions: { trigger: vi.fn() },
  })),
  signalSwapModalClosed: { type: 'signalSwapModalClosed' },
  signalPlanCancellation: { type: 'signalPlanCancellation' },
  interruptTransactionFlow: { type: 'interruptTransactionFlow' },
}))

// ── Helpers ─────────────────────────────────────────────────────────────
function createMockTruncatedStep(slippage = 0.5): TradingApi.TruncatedPlanStep {
  return { stepType: TradingApi.PlanStepType.CLASSIC, slippage }
}

function createMockPlanStep(overrides: Partial<TradingApi.PlanStep> = {}): TradingApi.PlanStep {
  return {
    stepIndex: 0,
    stepType: TradingApi.PlanStepType.CLASSIC,
    status: TradingApi.PlanStepStatus.AWAITING_ACTION,
    method: TradingApi.PlanStepMethod.SEND_TX,
    payload: {},
    tokenInChainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
    tokenOutChainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
    slippage: 0.5,
    ...overrides,
  } as TradingApi.PlanStep
}

function createTransactionAndPlanStep(overrides: Partial<TradingApi.PlanStep> = {}): TransactionAndPlanStep {
  return {
    ...createMockPlanStep(overrides),
    type: TransactionStepType.SwapTransaction,
    txRequest: { to: '0x', chainId: 1, data: '0x' },
  } as TransactionAndPlanStep
}

function createChainedTrade(outputAmount: string): ChainedActionTrade {
  return new ChainedActionTrade({
    quote: {
      routing: TradingApi.Routing.CHAINED,
      requestId: 'test-request',
      permitData: null,
      quote: {
        input: { amount: INPUT_AMOUNT, token: INPUT_TOKEN.address },
        output: { amount: outputAmount, token: OUTPUT_TOKEN.address, recipient: '0xrecipient' },
        swapper: '0xswapper',
        tokenInChainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
        tokenOutChainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
        tradeType: TradingApi.TradeType.EXACT_INPUT,
        slippage: 0.5,
        quoteId: 'test-quote',
        gasFee: '0',
        gasFeeUSD: '0',
        gasFeeQuote: '0',
        gasUseEstimate: '0',
        gasStrategies: [],
        steps: [createMockTruncatedStep()],
      },
    },
    currencyIn: INPUT_TOKEN,
    currencyOut: OUTPUT_TOKEN,
  })
}

function createPlanResponse(expectedOutput: string, steps?: TradingApi.PlanStep[]): TradingApi.PlanResponse {
  return {
    planId: 'test-plan',
    requestId: 'test-request',
    quoteId: 'test-quote',
    expectedOutput,
    swapper: '0xswapper',
    recipient: '0xrecipient',
    gasFee: '0',
    gasFeeUSD: '0',
    gasFeeQuote: '0',
    gasUseEstimate: '0',
    gasStrategies: [],
    timeEstimateMs: 10000,
    status: TradingApi.PlanStatus.ACTIVE,
    currentStepIndex: 0,
    steps: steps ?? [createMockPlanStep()],
  } as TradingApi.PlanResponse
}

function createSwapTxContext(trade: ChainedActionTrade): ValidatedChainedSwapTxAndGasInfo {
  return {
    routing: TradingApi.Routing.CHAINED,
    trade,
    planId: 'test-plan',
    txRequests: undefined,
    approveTxRequest: undefined,
    revocationTxRequest: undefined,
    includesDelegation: false,
    gasFee: { value: '0', isLoading: false, error: null },
    gasFeeEstimation: {},
  } as unknown as ValidatedChainedSwapTxAndGasInfo
}

function createPlanParams(trade: ChainedActionTrade): {
  params: Record<string, unknown>
  onSuccess: ReturnType<typeof vi.fn>
  onFailure: ReturnType<typeof vi.fn>
} {
  const onSuccess = vi.fn()
  const onFailure = vi.fn()

  return {
    params: {
      address: ADDRESS,
      swapTxContext: createSwapTxContext(trade),
      analytics: {} as never,
      onSuccess,
      onFailure,
      selectChain: vi.fn().mockResolvedValue(true),
      // biome-ignore lint/correctness/useYield: saga mock
      handleApprovalTransactionStep: vi.fn().mockImplementation(function* () {
        return '0xhash'
      }),
      // biome-ignore lint/correctness/useYield: saga mock
      handleSwapTransactionStep: vi.fn().mockImplementation(function* () {
        return '0xhash'
      }),
      // biome-ignore lint/correctness/useYield: saga mock
      handleSwapTransactionBatchedStep: vi.fn().mockImplementation(function* () {
        return { batchId: '1', hash: '0xhash' }
      }),
      // biome-ignore lint/correctness/useYield: saga mock
      handleSignatureStep: vi.fn().mockImplementation(function* () {
        return '0xsig'
      }),
      // biome-ignore lint/correctness/useYield: saga mock
      handleUniswapXPlanSignatureStep: vi.fn().mockImplementation(function* () {
        return '0xsig'
      }),
      getDisplayableError: vi.fn().mockReturnValue(undefined),
      getOnPressRetry: vi.fn().mockReturnValue(undefined),
      sendToast: vi.fn().mockImplementation(function* () {
        yield // no-op
      }),
      caip25Info: undefined,
    },
    onSuccess,
    onFailure,
  }
}

/** Compute a scaled fraction of OUTPUT_AMOUNT using integer math */
function scaleOutput(numerator: number, denominator: number): string {
  return String(Math.floor((Number(OUTPUT_AMOUNT) * numerator) / denominator))
}

async function runPlanSaga(params: unknown): Promise<void> {
  const { plan } = await import('uniswap/src/features/transactions/swap/plan/planSaga')
  const channel = stdChannel()
  await runSaga({ channel, dispatch: () => {}, getState: () => ({}) }, plan, params as never).toPromise()
}

// ── Tests ───────────────────────────────────────────────────────────────
describe('plan saga — price change interrupts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsPlanBackgrounded.mockReturnValue(false)
    mockIsPlanCancelledCheck.mockReturnValue(false)
  })

  describe('on initializePlan', () => {
    it('interrupts when plan expectedOutput drops > 1% from original trade', async () => {
      const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
      const { params, onFailure, onSuccess } = createPlanParams(originalTrade)

      // Plan response has 2% worse output → triggers interrupt
      const badOutput = scaleOutput(98, 100)
      const planResponse = createPlanResponse(badOutput)
      const step = createTransactionAndPlanStep()

      initializePlanResult = {
        planId: 'test-plan',
        response: planResponse,
        wasPlanResumed: false,
        steps: [step],
        currentStepIndex: 0,
        currentStep: step,
        inputChainId: UniverseChainId.Mainnet,
      }

      await runPlanSaga(params)

      expect(mockResetActivePlan).toHaveBeenCalled()
      expect(onFailure).toHaveBeenCalled()
      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('does not interrupt when plan expectedOutput is within 1% threshold', async () => {
      const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
      const { params, onFailure, onSuccess } = createPlanParams(originalTrade)

      // Plan response has 0.5% worse output → within threshold
      const okOutput = scaleOutput(995, 1000)
      const planResponse = createPlanResponse(okOutput, [createMockPlanStep()])
      const step = createTransactionAndPlanStep()

      initializePlanResult = {
        planId: 'test-plan',
        response: planResponse,
        wasPlanResumed: false,
        steps: [step],
        currentStepIndex: 0,
        currentStep: step,
        inputChainId: UniverseChainId.Mainnet,
      }

      await runPlanSaga(params)

      // Price is within threshold → saga should proceed (not interrupt at init)
      expect(mockResetActivePlan).not.toHaveBeenCalled()
      // For a single-step plan, saga proceeds to step execution and eventually calls onSuccess
      expect(onSuccess).toHaveBeenCalled()
      expect(onFailure).not.toHaveBeenCalled()
    })

    it('does not interrupt for resumed plans even if price changed', async () => {
      const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
      const { params, onFailure, onSuccess } = createPlanParams(originalTrade)

      // Bad price but wasPlanResumed = true → no check
      const step = createTransactionAndPlanStep()

      initializePlanResult = {
        planId: 'test-plan',
        response: undefined, // resumed plans have no response
        wasPlanResumed: true,
        steps: [step],
        currentStepIndex: 0,
        currentStep: step,
        inputChainId: UniverseChainId.Mainnet,
      }

      await runPlanSaga(params)

      expect(mockResetActivePlan).not.toHaveBeenCalled()
      // Saga proceeds to execute steps
      expect(onSuccess).toHaveBeenCalled()
      expect(onFailure).not.toHaveBeenCalled()
    })

    it('does not interrupt when plan expectedOutput improves', async () => {
      const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
      const { params, onFailure, onSuccess } = createPlanParams(originalTrade)

      // Plan response has 5% better output
      const betterOutput = scaleOutput(105, 100)
      const planResponse = createPlanResponse(betterOutput, [createMockPlanStep()])
      const step = createTransactionAndPlanStep()

      initializePlanResult = {
        planId: 'test-plan',
        response: planResponse,
        wasPlanResumed: false,
        steps: [step],
        currentStepIndex: 0,
        currentStep: step,
        inputChainId: UniverseChainId.Mainnet,
      }

      await runPlanSaga(params)

      expect(mockResetActivePlan).not.toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
      expect(onFailure).not.toHaveBeenCalled()
    })
  })

  describe('execution lock', () => {
    it('locks with planId after init and unlocks on successful completion', async () => {
      const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
      const { params, onSuccess } = createPlanParams(originalTrade)

      const planResponse = createPlanResponse(OUTPUT_AMOUNT, [createMockPlanStep()])
      const step = createTransactionAndPlanStep()

      initializePlanResult = {
        planId: 'test-plan',
        response: planResponse,
        wasPlanResumed: false,
        steps: [step],
        currentStepIndex: 0,
        currentStep: step,
        inputChainId: UniverseChainId.Mainnet,
      }

      await runPlanSaga(params)

      expect(mockLockPlanForExecution).toHaveBeenCalledWith('test-plan')
      expect(mockUnlockPlanExecution).toHaveBeenCalledWith('test-plan')
      expect(onSuccess).toHaveBeenCalled()
      // lock should be called before unlock
      const lockOrder = mockLockPlanForExecution.mock.invocationCallOrder[0]!
      const unlockOrder = mockUnlockPlanExecution.mock.invocationCallOrder[0]!
      expect(lockOrder).toBeLessThan(unlockOrder)
    })

    it('unlocks on error (price change interrupt)', async () => {
      const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
      const { params, onFailure } = createPlanParams(originalTrade)

      const badOutput = scaleOutput(98, 100)
      const planResponse = createPlanResponse(badOutput)
      const step = createTransactionAndPlanStep()

      initializePlanResult = {
        planId: 'test-plan',
        response: planResponse,
        wasPlanResumed: false,
        steps: [step],
        currentStepIndex: 0,
        currentStep: step,
        inputChainId: UniverseChainId.Mainnet,
      }

      await runPlanSaga(params)

      expect(mockLockPlanForExecution).toHaveBeenCalledWith('test-plan')
      expect(mockUnlockPlanExecution).toHaveBeenCalledWith('test-plan')
      expect(onFailure).toHaveBeenCalled()
    })
  })

  describe('after watchPlanStep', () => {
    it('interrupts when refreshed plan price drops > 1% between steps', async () => {
      const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
      const { params, onFailure, onSuccess } = createPlanParams(originalTrade)

      // Two-step plan: approve (step 0) + swap (step 1)
      const step0 = createTransactionAndPlanStep({
        stepIndex: 0,
        status: TradingApi.PlanStepStatus.AWAITING_ACTION,
      })
      const step1 = createTransactionAndPlanStep({
        stepIndex: 1,
        status: TradingApi.PlanStepStatus.NOT_READY,
      })

      // initializePlan returns good price
      const goodPlanResponse = createPlanResponse(OUTPUT_AMOUNT, [
        createMockPlanStep({ stepIndex: 0 }),
        createMockPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.NOT_READY }),
      ])

      initializePlanResult = {
        planId: 'test-plan',
        response: goodPlanResponse,
        wasPlanResumed: false,
        steps: [step0, step1],
        currentStepIndex: 0,
        currentStep: step0,
        inputChainId: UniverseChainId.Mainnet,
      }

      // After step 0 completes, watchPlanStep returns bad price (2% drop)
      const badOutput = scaleOutput(98, 100)
      const updatedStep0 = createTransactionAndPlanStep({
        stepIndex: 0,
        status: TradingApi.PlanStepStatus.COMPLETE,
      })
      const updatedStep1 = createTransactionAndPlanStep({
        stepIndex: 1,
        status: TradingApi.PlanStepStatus.AWAITING_ACTION,
      })

      watchPlanStepResult = {
        steps: [updatedStep0, updatedStep1],
        planResponse: createPlanResponse(badOutput, [
          createMockPlanStep({ stepIndex: 0, status: TradingApi.PlanStepStatus.COMPLETE }),
          createMockPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.AWAITING_ACTION }),
        ]),
      }

      await runPlanSaga(params)

      // Should NOT reset active plan (step 0 already completed, currentStepIndex is now 1)
      expect(onFailure).toHaveBeenCalled()
      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('does not interrupt when refreshed plan price is within threshold', async () => {
      const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
      const { params, onFailure, onSuccess } = createPlanParams(originalTrade)

      // Two-step plan
      const step0 = createTransactionAndPlanStep({
        stepIndex: 0,
        status: TradingApi.PlanStepStatus.AWAITING_ACTION,
      })
      const step1 = createTransactionAndPlanStep({
        stepIndex: 1,
        status: TradingApi.PlanStepStatus.NOT_READY,
      })

      const goodPlanResponse = createPlanResponse(OUTPUT_AMOUNT, [
        createMockPlanStep({ stepIndex: 0 }),
        createMockPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.NOT_READY }),
      ])

      initializePlanResult = {
        planId: 'test-plan',
        response: goodPlanResponse,
        wasPlanResumed: false,
        steps: [step0, step1],
        currentStepIndex: 0,
        currentStep: step0,
        inputChainId: UniverseChainId.Mainnet,
      }

      // watchPlanStep returns price within threshold (0.5% drop)
      const okOutput = scaleOutput(995, 1000)
      const updatedStep0 = createTransactionAndPlanStep({
        stepIndex: 0,
        status: TradingApi.PlanStepStatus.COMPLETE,
      })
      const updatedStep1 = createTransactionAndPlanStep({
        stepIndex: 1,
        status: TradingApi.PlanStepStatus.AWAITING_ACTION,
      })

      watchPlanStepResult = {
        steps: [updatedStep0, updatedStep1],
        planResponse: createPlanResponse(okOutput, [
          createMockPlanStep({ stepIndex: 0, status: TradingApi.PlanStepStatus.COMPLETE }),
          createMockPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.AWAITING_ACTION }),
        ]),
      }

      await runPlanSaga(params)

      // Price within threshold → saga proceeds to step 1 (which is last step) and succeeds
      expect(onSuccess).toHaveBeenCalled()
      expect(onFailure).not.toHaveBeenCalled()
    })
  })
})
