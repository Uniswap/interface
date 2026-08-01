import { TradingApi } from '@universe/api'
import { runSaga, stdChannel } from 'redux-saga'
import { UNI, USDC_MAINNET, WBTC } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { HandledTransactionInterrupt } from 'uniswap/src/features/transactions/errors'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import type { FetchAndTransformPlanResult } from 'uniswap/src/features/transactions/swap/plan/planSagaUtils'
import type { TransactionAndPlanStep } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import { PlanStepTimeoutError } from 'uniswap/src/features/transactions/swap/plan/types'
import type { WatchPlanStepResult } from 'uniswap/src/features/transactions/swap/plan/watchPlanStepSaga'
import type { ValidatedChainedSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { createChainedActionTrade, type ChainedActionTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'

interface InitializePlanResult extends FetchAndTransformPlanResult {
  response?: TradingApi.PlanResponse
  wasPlanResumed: boolean
}

// ── Test constants ──────────────────────────────────────────────────────
const INPUT_TOKEN = UNI[UniverseChainId.Mainnet]
const OUTPUT_TOKEN = WBTC
const EARN_UNDERLYING_TOKEN = USDC_MAINNET
const EARN_VAULT_ADDRESS = '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0'
const INPUT_AMOUNT = '1000000000000000000' // 1e18
const OUTPUT_AMOUNT = '100000000' // 1e8 (original trade output)
const ADDRESS = '0x1234567890123456789012345678901234567890' as Address
const EARN_INTENT: TradingApi.EarnQuoteIntent = {
  action: TradingApi.EarnAction.DEPOSIT,
  vault: EARN_VAULT_ADDRESS,
  chainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
  underlyingAsset: EARN_UNDERLYING_TOKEN.address,
}

// ── Mock tracking ───────────────────────────────────────────────────────
let initializePlanResult: InitializePlanResult
let watchPlanStepResult: WatchPlanStepResult
let watchPlanStepError: Error | undefined

const mockResetActivePlan = vi.fn()
const mockMarkPlanPriceChangeInterrupted = vi.fn()
const mockIsPlanBackgrounded = vi.fn().mockReturnValue(false)
const mockIsPlanCancelledCheck = vi.fn().mockReturnValue(false)
const mockUpdateGlobalStateWithLatestSteps = vi.fn()
const mockUpdateGlobalStateProofPending = vi.fn()
const mockClearPlan = vi.fn()
const mockBackgroundPlan = vi.fn()
const mockLogHelper = vi.fn()
const mockLockPlanForExecution = vi.fn()
const mockUnlockPlanExecution = vi.fn()
const mockLogPlanStepTradeAnalytics = vi.fn()
const mockLogUniswapXPlanOrderSubmitted = vi.fn()
const mockWatchPlanStep = vi.fn()
const mockUpdateExistingPlan = vi.fn().mockResolvedValue(undefined)

// ── Module mocks ────────────────────────────────────────────────────────
vi.mock('uniswap/src/features/transactions/swap/plan/planSagaUtils', async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal()
  return {
    ...actual,
    // oxlint-disable-next-line require-yield -- saga mock — runSaga requires generator functions
    initializePlan: vi.fn().mockImplementation(function* () {
      return initializePlanResult
    }),
    resetActivePlan: (...args: unknown[]): unknown => mockResetActivePlan(...args),
    markPlanPriceChangeInterrupted: (...args: unknown[]): unknown => mockMarkPlanPriceChangeInterrupted(...args),
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
    // oxlint-disable-next-line eslint-js/object-shorthand
    showPendingOnEarlyModalClose: function* () {
      yield // no-op: avoids the real saga which waits on signalSwapModalClosed
    },
  }
})

vi.mock('uniswap/src/features/transactions/swap/plan/watchPlanStepSaga', () => ({
  // oxlint-disable-next-line require-yield -- saga mock — runSaga requires generator functions
  watchPlanStep: vi.fn().mockImplementation(function* (params) {
    mockWatchPlanStep(params)
    if (watchPlanStepError) {
      throw watchPlanStepError
    }
    return watchPlanStepResult
  }),
}))

vi.mock('uniswap/src/features/transactions/swap/plan/planStepAnalytics', () => ({
  TRADE_STEP_TYPES: new Set<TransactionStepType>([
    TransactionStepType.SwapTransaction,
    TransactionStepType.SwapTransactionWalletCall,
    TransactionStepType.UniswapXPlanSignature,
  ]),
  logPlanStepTradeAnalytics: (...args: unknown[]): unknown => mockLogPlanStepTradeAnalytics(...args),
  logUniswapXPlanOrderSubmitted: (...args: unknown[]): unknown => mockLogUniswapXPlanOrderSubmitted(...args),
}))

vi.mock('utilities/src/async/retryWithBackoff', () => ({
  retryWithBackoff: vi.fn().mockImplementation(({ fn }) => fn()),
  BackoffStrategy: { None: 'none' },
}))

vi.mock('uniswap/src/data/apiClients/tradingApi/TradingApiSessionClient', () => ({
  TradingApiSessionClient: {
    updateExistingPlan: (...args: unknown[]): unknown => mockUpdateExistingPlan(...args),
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

function createTransactionAndPlanStep(overrides: Partial<TransactionAndPlanStep> = {}): TransactionAndPlanStep {
  return {
    ...createMockPlanStep(overrides),
    type: TransactionStepType.SwapTransaction,
    txRequest: { to: '0x', chainId: 1, data: '0x' },
  } as TransactionAndPlanStep
}

/** Display preview for deposit earn quotes — without one, deposit trades intentionally fail to build. */
function createEarnDepositPreview(amount: string): TradingApi.EarnPreview {
  return {
    type: TradingApi.EarnDepositPreview.type.DEPOSIT,
    depositAssets: [
      {
        token: EARN_UNDERLYING_TOKEN.address,
        chainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
        amount,
      },
    ],
    estimatedSharesOut: amount,
  }
}

function createChainedTrade(outputAmount: string, earnIntent?: TradingApi.EarnQuoteIntent): ChainedActionTrade {
  const currencyIn = earnIntent ? EARN_UNDERLYING_TOKEN : INPUT_TOKEN
  const currencyOut = earnIntent ? EARN_UNDERLYING_TOKEN : OUTPUT_TOKEN
  const tokenIn = currencyIn.address
  const tokenOut = earnIntent ? earnIntent.vault : OUTPUT_TOKEN.address
  const trade = createChainedActionTrade({
    quote: {
      routing: TradingApi.Routing.CHAINED,
      requestId: 'test-request',
      permitData: null,
      quote: {
        input: { amount: INPUT_AMOUNT, maximumAmount: INPUT_AMOUNT, token: tokenIn },
        output: {
          amount: outputAmount,
          minimumAmount: outputAmount,
          token: tokenOut,
          recipient: '0xrecipient',
        },
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
        earnIntent,
        earnPreview: earnIntent ? createEarnDepositPreview(outputAmount) : undefined,
      },
    },
    currencyIn,
    currencyOut,
    earnIntent,
  })

  if (!trade) {
    throw new Error('Expected test chained trade to be created')
  }

  return trade
}

function createPlanResponse(
  expectedOutput: string,
  steps?: TradingApi.PlanStep[],
  options?: { earnIntent?: TradingApi.EarnQuoteIntent },
): TradingApi.PlanResponse {
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
    // Refreshed earn deposit trades need a preview to display an underlying amount — mirror the API,
    // which carries it on planResponse.earnIntent.preview.
    earnIntent: options?.earnIntent
      ? { ...options.earnIntent, preview: createEarnDepositPreview(expectedOutput) }
      : undefined,
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
  onPlanFinalized: ReturnType<typeof vi.fn>
  handleSwapTransactionStep: ReturnType<typeof vi.fn>
} {
  const onSuccess = vi.fn()
  const onFailure = vi.fn()
  const onPlanFinalized = vi.fn()
  // oxlint-disable-next-line require-yield -- saga mock
  const handleSwapTransactionStep = vi.fn().mockImplementation(function* () {
    return '0xhash'
  })

  return {
    params: {
      address: ADDRESS,
      swapTxContext: createSwapTxContext(trade),
      analytics: {} as never,
      onSuccess,
      onFailure,
      selectChain: vi.fn().mockResolvedValue(true),
      // oxlint-disable-next-line require-yield -- saga mock
      handleApprovalTransactionStep: vi.fn().mockImplementation(function* () {
        return '0xhash'
      }),
      handleSwapTransactionStep,
      // oxlint-disable-next-line require-yield -- saga mock
      handleSwapTransactionWalletCallStep: vi.fn().mockImplementation(function* () {
        return { batchId: '1', hash: '0xhash' }
      }),
      // oxlint-disable-next-line require-yield -- saga mock
      handleSignatureStep: vi.fn().mockImplementation(function* () {
        return '0xsig'
      }),
      // oxlint-disable-next-line require-yield -- saga mock
      handleUniswapXPlanSignatureStep: vi.fn().mockImplementation(function* () {
        return '0xsig'
      }),
      getDisplayableError: vi.fn().mockReturnValue(undefined),
      getOnPressRetry: vi.fn().mockReturnValue(undefined),
      onPlanFinalized,
      sendToast: vi.fn().mockImplementation(function* () {
        yield // no-op
      }),
      caip25Info: undefined,
    },
    onSuccess,
    onFailure,
    onPlanFinalized,
    handleSwapTransactionStep,
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
    watchPlanStepError = undefined
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

    it('interrupts Earn plans when expectedOutput drops > 1%, same as non-earn plans', async () => {
      const originalTrade = createChainedTrade(OUTPUT_AMOUNT, EARN_INTENT)
      const { params, onFailure, onSuccess } = createPlanParams(originalTrade)

      const badOutput = scaleOutput(98, 100)
      const planResponse = createPlanResponse(badOutput, [createMockPlanStep()], { earnIntent: EARN_INTENT })
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

      // The earn callbacks convert the interrupt into a displayable "review again" error — the saga
      // must hand them the PlanPriceChangeInterrupt through getDisplayableError.
      expect(params['getDisplayableError']).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.objectContaining({ name: 'PlanPriceChangeInterrupt' }) }),
      )
      expect(mockMarkPlanPriceChangeInterrupted).toHaveBeenCalledWith('test-plan')
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
      const { params, onFailure, onSuccess, onPlanFinalized } = createPlanParams(originalTrade)

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
      expect(onPlanFinalized).toHaveBeenCalledWith(expect.objectContaining({ status: TransactionStatus.Pending }))
      expect(onPlanFinalized).not.toHaveBeenCalledWith(expect.objectContaining({ status: TransactionStatus.Success }))
    })

    it('interrupts Earn plans mid-plan when the refreshed price drops > 1%, retaining the active plan', async () => {
      const originalTrade = createChainedTrade(OUTPUT_AMOUNT, EARN_INTENT)
      const { params, onFailure, onSuccess, onPlanFinalized } = createPlanParams(originalTrade)

      const step0 = createTransactionAndPlanStep({
        stepIndex: 0,
        status: TradingApi.PlanStepStatus.AWAITING_ACTION,
      })
      const step1 = createTransactionAndPlanStep({
        stepIndex: 1,
        status: TradingApi.PlanStepStatus.NOT_READY,
      })

      initializePlanResult = {
        planId: 'test-plan',
        response: createPlanResponse(
          OUTPUT_AMOUNT,
          [
            createMockPlanStep({ stepIndex: 0 }),
            createMockPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.NOT_READY }),
          ],
          { earnIntent: EARN_INTENT },
        ),
        wasPlanResumed: false,
        steps: [step0, step1],
        currentStepIndex: 0,
        currentStep: step0,
        inputChainId: UniverseChainId.Mainnet,
      }

      const badOutput = scaleOutput(98, 100)
      watchPlanStepResult = {
        steps: [
          createTransactionAndPlanStep({ stepIndex: 0, status: TradingApi.PlanStepStatus.COMPLETE }),
          createTransactionAndPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.AWAITING_ACTION }),
        ],
        planResponse: createPlanResponse(
          badOutput,
          [
            createMockPlanStep({ stepIndex: 0, status: TradingApi.PlanStepStatus.COMPLETE }),
            createMockPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.AWAITING_ACTION }),
          ],
          { earnIntent: EARN_INTENT },
        ),
      }

      await runPlanSaga(params)

      expect(params['getDisplayableError']).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.objectContaining({ name: 'PlanPriceChangeInterrupt' }) }),
      )
      expect(mockMarkPlanPriceChangeInterrupted).toHaveBeenCalledWith('test-plan')
      // A step already completed — the active plan must be retained so the user can resume the
      // existing plan (creating a fresh plan could double-execute the completed swap step).
      expect(mockResetActivePlan).not.toHaveBeenCalled()
      expect(onFailure).toHaveBeenCalled()
      expect(onSuccess).not.toHaveBeenCalled()
      expect(onPlanFinalized).toHaveBeenCalledWith(expect.objectContaining({ status: TransactionStatus.Pending }))
      expect(onPlanFinalized).not.toHaveBeenCalledWith(expect.objectContaining({ status: TransactionStatus.Success }))
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

    it('passes chained-action headers through Earn proof patching and next-step polling', async () => {
      const originalTrade = createChainedTrade(OUTPUT_AMOUNT, EARN_INTENT)
      const { params, onFailure, onSuccess } = createPlanParams(originalTrade)

      const step0 = createTransactionAndPlanStep({
        stepIndex: 0,
        status: TradingApi.PlanStepStatus.AWAITING_ACTION,
      })
      const step1 = createTransactionAndPlanStep({
        stepIndex: 1,
        status: TradingApi.PlanStepStatus.NOT_READY,
      })

      initializePlanResult = {
        planId: 'test-plan',
        response: createPlanResponse(
          OUTPUT_AMOUNT,
          [
            createMockPlanStep({ stepIndex: 0 }),
            createMockPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.NOT_READY }),
          ],
          { earnIntent: EARN_INTENT },
        ),
        wasPlanResumed: false,
        steps: [step0, step1],
        currentStepIndex: 0,
        currentStep: step0,
        inputChainId: UniverseChainId.Mainnet,
      }

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
        planResponse: createPlanResponse(
          OUTPUT_AMOUNT,
          [
            createMockPlanStep({ stepIndex: 0, status: TradingApi.PlanStepStatus.COMPLETE }),
            createMockPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.AWAITING_ACTION }),
          ],
          { earnIntent: EARN_INTENT },
        ),
      }

      await runPlanSaga(params)

      expect(mockUpdateExistingPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: 'test-plan',
        }),
      )
      expect(mockWatchPlanStep).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: 'test-plan',
        }),
      )
      expect(onSuccess).toHaveBeenCalled()
      expect(onFailure).not.toHaveBeenCalled()
    })
  })

  describe('final-step classification', () => {
    function getLastTradeRelevantNonErrorStep(steps: TransactionAndPlanStep[]): TransactionAndPlanStep | undefined {
      const tradeStepTypes = new Set<TransactionStepType>([
        TransactionStepType.SwapTransaction,
        TransactionStepType.SwapTransactionWalletCall,
        TransactionStepType.UniswapXPlanSignature,
      ])

      return [...steps]
        .filter((step) => tradeStepTypes.has(step.type))
        .filter((step) => step.status !== TradingApi.PlanStepStatus.STEP_ERROR)
        .sort((a, b) => a.stepIndex - b.stepIndex)
        .at(-1)
    }

    it('treats a semantically final trade step as final even when a trailing error row exists', async () => {
      const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
      const { params, onSuccess, onFailure, handleSwapTransactionStep } = createPlanParams(originalTrade)

      const completedApprovalStep = createTransactionAndPlanStep({
        stepIndex: 0,
        type: TransactionStepType.TokenApprovalTransaction,
        status: TradingApi.PlanStepStatus.COMPLETE,
      })
      const actionableSwapStep = createTransactionAndPlanStep({
        stepIndex: 2,
        status: TradingApi.PlanStepStatus.AWAITING_ACTION,
      })
      const trailingErroredSwapStep = createTransactionAndPlanStep({
        stepIndex: 1,
        status: TradingApi.PlanStepStatus.STEP_ERROR,
      })

      const initialSteps = [completedApprovalStep, actionableSwapStep, trailingErroredSwapStep]
      const semanticFinalStep = getLastTradeRelevantNonErrorStep(initialSteps)

      initializePlanResult = {
        planId: 'test-plan',
        response: createPlanResponse(OUTPUT_AMOUNT, initialSteps),
        wasPlanResumed: false,
        steps: initialSteps,
        currentStepIndex: 1,
        currentStep: actionableSwapStep,
        inputChainId: UniverseChainId.Mainnet,
      }

      watchPlanStepResult = {
        steps: [
          completedApprovalStep,
          createTransactionAndPlanStep({
            stepIndex: 2,
            status: TradingApi.PlanStepStatus.COMPLETE,
            proof: { txHash: '0xcompleted' } as TransactionAndPlanStep['proof'],
          }),
          trailingErroredSwapStep,
        ],
        planResponse: createPlanResponse(OUTPUT_AMOUNT, [
          completedApprovalStep,
          createTransactionAndPlanStep({
            stepIndex: 2,
            status: TradingApi.PlanStepStatus.COMPLETE,
            proof: { txHash: '0xcompleted' } as TransactionAndPlanStep['proof'],
          }),
          trailingErroredSwapStep,
        ]),
      }

      await runPlanSaga(params)

      expect(semanticFinalStep?.stepIndex).toBe(2)
      expect(handleSwapTransactionStep).toHaveBeenCalledOnce()
      expect(handleSwapTransactionStep.mock.calls[0]?.[0]).toMatchObject({
        analytics: expect.objectContaining({
          plan_id: 'test-plan',
          step_index: 2,
          is_final_step: true,
        }),
      })
      expect(mockLogPlanStepTradeAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({
          semanticStepIndex: 2,
          stepFailure: false,
          analyticsWithPlanStepContext: expect.objectContaining({
            step_index: 2,
            is_final_step: true,
          }),
        }),
      )
      expect(onSuccess).toHaveBeenCalled()
      expect(onFailure).not.toHaveBeenCalled()
    })

    it('reads failure and proof data by semantic step index after plan mutation', async () => {
      const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
      const { params, onFailure } = createPlanParams(originalTrade)

      const completedApprovalStep = createTransactionAndPlanStep({
        stepIndex: 0,
        type: TransactionStepType.TokenApprovalTransaction,
        status: TradingApi.PlanStepStatus.COMPLETE,
      })
      const actionableSwapStep = createTransactionAndPlanStep({
        stepIndex: 2,
        status: TradingApi.PlanStepStatus.AWAITING_ACTION,
      })
      const trailingErroredSwapStep = createTransactionAndPlanStep({
        stepIndex: 1,
        status: TradingApi.PlanStepStatus.STEP_ERROR,
      })

      initializePlanResult = {
        planId: 'test-plan',
        response: createPlanResponse(OUTPUT_AMOUNT, [
          completedApprovalStep,
          actionableSwapStep,
          trailingErroredSwapStep,
        ]),
        wasPlanResumed: false,
        steps: [completedApprovalStep, actionableSwapStep, trailingErroredSwapStep],
        currentStepIndex: 1,
        currentStep: actionableSwapStep,
        inputChainId: UniverseChainId.Mainnet,
      }

      const updatedExecutedStep = createTransactionAndPlanStep({
        stepIndex: 2,
        status: TradingApi.PlanStepStatus.COMPLETE,
        proof: { txHash: '0xcompleted' } as TransactionAndPlanStep['proof'],
      })
      const updatedErroredStep = createTransactionAndPlanStep({
        stepIndex: 1,
        status: TradingApi.PlanStepStatus.STEP_ERROR,
        proof: { txHash: '0xerror' } as TransactionAndPlanStep['proof'],
      })

      watchPlanStepResult = {
        steps: [completedApprovalStep, updatedErroredStep, updatedExecutedStep],
        planResponse: createPlanResponse(OUTPUT_AMOUNT, [
          completedApprovalStep,
          updatedErroredStep,
          updatedExecutedStep,
        ]),
      }

      await runPlanSaga(params)

      expect(mockLogPlanStepTradeAnalytics).toHaveBeenCalledOnce()
      expect(mockLogPlanStepTradeAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({
          semanticStepIndex: 2,
          stepFailure: false,
          analyticsWithPlanStepContext: expect.objectContaining({
            step_index: 2,
            is_final_step: true,
          }),
        }),
      )
      expect(onFailure).not.toHaveBeenCalled()
    })

    it('calls onPlanFinalized with Success when the watched last step completes', async () => {
      const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
      const { params, onPlanFinalized } = createPlanParams(originalTrade)
      const actionableSwapStep = createTransactionAndPlanStep({
        stepIndex: 0,
        status: TradingApi.PlanStepStatus.AWAITING_ACTION,
      })
      const completedSwapStep = createTransactionAndPlanStep({
        stepIndex: 0,
        status: TradingApi.PlanStepStatus.COMPLETE,
      })

      initializePlanResult = {
        planId: 'test-plan',
        response: createPlanResponse(OUTPUT_AMOUNT, [actionableSwapStep]),
        wasPlanResumed: false,
        steps: [actionableSwapStep],
        currentStepIndex: 0,
        currentStep: actionableSwapStep,
        inputChainId: UniverseChainId.Mainnet,
      }
      watchPlanStepResult = {
        steps: [completedSwapStep],
        planResponse: createPlanResponse(OUTPUT_AMOUNT, [completedSwapStep]),
      }

      await runPlanSaga(params)

      expect(onPlanFinalized).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: 'test-plan',
          status: TransactionStatus.Success,
          stepStatus: TradingApi.PlanStepStatus.COMPLETE,
        }),
      )
    })

    it('keeps the plan Pending (not Failed) when last-step polling exhausts before confirmation', async () => {
      const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
      const { params, onPlanFinalized } = createPlanParams(originalTrade)
      const actionableSwapStep = createTransactionAndPlanStep({
        stepIndex: 0,
        status: TradingApi.PlanStepStatus.AWAITING_ACTION,
      })

      initializePlanResult = {
        planId: 'test-plan',
        response: createPlanResponse(OUTPUT_AMOUNT, [actionableSwapStep]),
        wasPlanResumed: false,
        steps: [actionableSwapStep],
        currentStepIndex: 0,
        currentStep: actionableSwapStep,
        inputChainId: UniverseChainId.Mainnet,
      }
      // The watcher gave up, but the submitted tx can still confirm on-chain — finalizing as Failed
      // would permanently skip Success-gated consumers (e.g. earn optimistic position updates).
      watchPlanStepError = new PlanStepTimeoutError('Exceeded 60 attempts waiting for step completion')

      await runPlanSaga(params)

      expect(onPlanFinalized).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: 'test-plan',
          status: TransactionStatus.Pending,
        }),
      )
      // The user is still notified the plan needs attention.
      expect(params['sendToast']).toHaveBeenCalled()
    })

    it('finalizes as Canceled without an error toast when the last-step watch is cancelled', async () => {
      const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
      const { params, onPlanFinalized } = createPlanParams(originalTrade)
      const actionableSwapStep = createTransactionAndPlanStep({
        stepIndex: 0,
        status: TradingApi.PlanStepStatus.AWAITING_ACTION,
      })

      initializePlanResult = {
        planId: 'test-plan',
        response: createPlanResponse(OUTPUT_AMOUNT, [actionableSwapStep]),
        wasPlanResumed: false,
        steps: [actionableSwapStep],
        currentStepIndex: 0,
        currentStep: actionableSwapStep,
        inputChainId: UniverseChainId.Mainnet,
      }
      watchPlanStepError = new HandledTransactionInterrupt('Plan cancelled during step watch')

      await runPlanSaga(params)

      expect(onPlanFinalized).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: 'test-plan',
          status: TransactionStatus.Canceled,
        }),
      )
      expect(params['sendToast']).not.toHaveBeenCalled()
    })

    it('calls onPlanFinalized with Failed when the watched last step errors', async () => {
      const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
      const { params, onPlanFinalized } = createPlanParams(originalTrade)
      const actionableSwapStep = createTransactionAndPlanStep({
        stepIndex: 0,
        status: TradingApi.PlanStepStatus.AWAITING_ACTION,
      })
      const erroredSwapStep = createTransactionAndPlanStep({
        stepIndex: 0,
        status: TradingApi.PlanStepStatus.STEP_ERROR,
      })

      initializePlanResult = {
        planId: 'test-plan',
        response: createPlanResponse(OUTPUT_AMOUNT, [actionableSwapStep]),
        wasPlanResumed: false,
        steps: [actionableSwapStep],
        currentStepIndex: 0,
        currentStep: actionableSwapStep,
        inputChainId: UniverseChainId.Mainnet,
      }
      watchPlanStepResult = {
        steps: [erroredSwapStep],
        planResponse: createPlanResponse(OUTPUT_AMOUNT, [erroredSwapStep]),
      }

      await runPlanSaga(params)

      expect(onPlanFinalized).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: 'test-plan',
          status: TransactionStatus.Failed,
          stepStatus: TradingApi.PlanStepStatus.STEP_ERROR,
        }),
      )
    })
  })
})
