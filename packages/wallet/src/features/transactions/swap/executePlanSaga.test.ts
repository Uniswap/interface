import { expectSaga } from 'redux-saga-test-plan'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { plan } from 'uniswap/src/features/transactions/swap/plan/planSaga'
import { emitSubmissionErrorTelemetry } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionLifecycleHelpers'
import { prepareTransactionServices } from 'wallet/src/features/transactions/shared/baseTransactionPreparationSaga'
import { createExecutePlanSaga, type ExecutePlanParams } from 'wallet/src/features/transactions/swap/executePlanSaga'
import { shouldSubmitViaPrivateRpc } from 'wallet/src/features/transactions/swap/prepareAndSignSwapSaga'
import {
  mockAnalytics,
  mockSignerAccount,
  mockSwapTxRequest,
  mockTransactionSagaDependencies,
  mockTransactionSigner,
  prepareSwapTxContext,
} from 'wallet/src/features/transactions/swap/types/fixtures'

jest.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: jest.fn(),
  sendAppsFlyerEvent: jest.fn(),
}))
jest.mock('uniswap/src/features/transactions/swap/plan/planSaga')
jest.mock('wallet/src/features/transactions/shared/baseTransactionPreparationSaga')
jest.mock('wallet/src/features/transactions/swap/prepareAndSignSwapSaga')
jest.mock('wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionLifecycleHelpers')

const MOCK_TIMESTAMP = 1487076708000

const mockedPlan = jest.mocked(plan)
const mockedSendAnalyticsEvent = jest.mocked(sendAnalyticsEvent)
const mockedPrepareTransactionServices = jest.mocked(prepareTransactionServices)
const mockedShouldSubmitViaPrivateRpc = jest.mocked(shouldSubmitViaPrivateRpc)
const mockedEmitSubmissionErrorTelemetry = jest.mocked(emitSubmissionErrorTelemetry)

function buildParams(overrides: Partial<ExecutePlanParams> = {}): ExecutePlanParams {
  return {
    txId: 'plan-tx-id',
    address: mockSignerAccount.address,
    analytics: mockAnalytics,
    swapTxContext: prepareSwapTxContext(),
    onSuccess: jest.fn(),
    onFailure: jest.fn(),
    onPending: jest.fn(),
    onClearForm: jest.fn(),
    setCurrentStep: jest.fn(),
    setSteps: jest.fn(),
    caip25Info: undefined,
    ...overrides,
  }
}

const windowCallsOf = (event: WalletEventName): unknown[] =>
  mockedSendAnalyticsEvent.mock.calls.filter(([name]) => name === event).map(([, props]) => props)

describe('executePlanSaga', () => {
  let dateNowSpy: jest.SpyInstance
  let executePlan: ReturnType<typeof createExecutePlanSaga>

  beforeAll(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => MOCK_TIMESTAMP)
    executePlan = createExecutePlanSaga(mockTransactionSagaDependencies)
  })

  afterAll(() => {
    dateNowSpy.mockRestore()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockedSendAnalyticsEvent.mockReset()
    // Default: plan completes immediately (empty iterable) without invoking any step handler.
    mockedPlan.mockReturnValue([] as unknown as ReturnType<typeof plan>)
  })

  describe('SwapExecutionWindow markers (SWAP-2471)', () => {
    it('emits a start marker then an end marker for a completed plan', async () => {
      const params = buildParams()

      await expectSaga(executePlan, params).run()

      const windowCalls = windowCallsOf(WalletEventName.SwapExecutionWindow)
      expect(windowCalls).toHaveLength(2)
      expect(windowCalls[0]).toEqual(
        expect.objectContaining({ saga: 'executePlan', phase: 'start', address: params.address }),
      )
      expect(windowCalls[1]).toEqual(
        expect.objectContaining({ saga: 'executePlan', phase: 'end', address: params.address }),
      )
      expect(params.onPending).toHaveBeenCalledTimes(1)
    })

    it('still emits the end marker when the plan throws (finally block)', async () => {
      mockedPlan.mockImplementation((() => {
        throw new Error('plan blew up')
      }) as unknown as typeof plan)

      await expectSaga(executePlan, buildParams())
        .run()
        .catch(() => undefined)

      expect(mockedSendAnalyticsEvent).toHaveBeenCalledWith(
        WalletEventName.SwapExecutionWindow,
        expect.objectContaining({ saga: 'executePlan', phase: 'end' }),
      )
    })

    it('does NOT let a throwing end-marker emit mask the in-flight plan error (N4)', async () => {
      mockedPlan.mockImplementation((() => {
        throw new Error('real plan error')
      }) as unknown as typeof plan)
      // Make the telemetry emit itself throw on the end marker, in the catch-less finally.
      mockedSendAnalyticsEvent.mockImplementation(((_event: WalletEventName, props?: { phase?: string }) => {
        if (props?.phase === 'end') {
          throw new Error('telemetry boom')
        }
      }) as unknown as typeof sendAnalyticsEvent)

      let caught: Error | undefined
      await expectSaga(executePlan, buildParams())
        .run()
        .catch((error: Error) => {
          caught = error
        })

      // The ORIGINAL plan error must survive, not the telemetry error.
      expect(caught?.message).toBe('real plan error')
      // And the swallowed telemetry failure is logged rather than thrown.
      expect(mockTransactionSagaDependencies.logger.warn).toHaveBeenCalledWith(
        'executePlanSaga',
        'executePlan',
        'SwapExecutionWindow emit failed',
        expect.objectContaining({ phase: 'end' }),
      )
    })
  })

  describe('chained-plan submission-error telemetry options (N2)', () => {
    const stepFixture = {
      payload: mockSwapTxRequest,
      tokenInChainId: UniverseChainId.Mainnet,
      txRequest: mockSwapTxRequest,
      stepIndex: 0,
      type: 'SwapTransaction',
    }

    beforeEach(() => {
      mockedShouldSubmitViaPrivateRpc.mockReturnValue(true as unknown as ReturnType<typeof shouldSubmitViaPrivateRpc>)
      mockedPrepareTransactionServices.mockImplementation(function* prepared() {
        yield* []
        return { transactionSigner: mockTransactionSigner, calculatedNonce: { nonce: 9 } }
      } as unknown as typeof prepareTransactionServices)
      mockTransactionSigner.prepareTransaction.mockResolvedValue({ nonce: 9 } as never)
      mockTransactionSigner.signTransaction.mockResolvedValue('0xsigned' as never)
      mockTransactionSigner.sendTransaction.mockRejectedValue(new Error('send failed'))
    })

    it('records submit_via_private_rpc + includes_delegation on a failed plan_swap step', async () => {
      mockedPlan.mockImplementation(function* invokeSwapStep(planArg: unknown) {
        yield* (planArg as { handleSwapTransactionStep: (s: unknown) => Generator }).handleSwapTransactionStep({
          step: stepFixture,
          planId: 'plan-1',
          analytics: mockAnalytics,
        })
      } as unknown as typeof plan)

      await expectSaga(executePlan, buildParams())
        .run()
        .catch(() => undefined)

      expect(mockedEmitSubmissionErrorTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: 'plan_swap',
          methodName: 'handleSwapTransactionStep',
          assignedNonce: 9,
          options: { submitViaPrivateRpc: true, includesDelegation: false },
        }),
      )
    })

    it('records submit_via_private_rpc + includes_delegation on a failed plan_approve step', async () => {
      mockedPlan.mockImplementation(function* invokeApprovalStep(planArg: unknown) {
        yield* (planArg as { handleApprovalTransactionStep: (s: unknown) => Generator }).handleApprovalTransactionStep({
          step: stepFixture,
          planId: 'plan-1',
          analytics: mockAnalytics,
        })
      } as unknown as typeof plan)

      await expectSaga(executePlan, buildParams({ swapTxContext: prepareSwapTxContext({ includesDelegation: true }) }))
        .run()
        .catch(() => undefined)

      expect(mockedEmitSubmissionErrorTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: 'plan_approve',
          methodName: 'handleApprovalTransactionStep',
          assignedNonce: 9,
          options: { submitViaPrivateRpc: true, includesDelegation: true },
        }),
      )
    })
  })
})
