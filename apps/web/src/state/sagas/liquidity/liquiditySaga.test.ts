import { configureStore } from '@reduxjs/toolkit'
import { UniverseChainId } from '@universe/chains'
import ms from 'ms'
import createSagaMiddleware from 'redux-saga'
import { generateLPTransactionSteps } from 'uniswap/src/features/transactions/liquidity/steps/generateLPTransactionSteps'
import type { ValidatedLiquidityTxContext } from 'uniswap/src/features/transactions/liquidity/types'
import { LiquidityTransactionType } from 'uniswap/src/features/transactions/liquidity/types'
import type { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { getMonitoredSagaReducers, SagaStatus } from 'uniswap/src/utils/saga'
import { liquiditySaga } from '~/state/sagas/liquidity/liquiditySaga'
import { handleAtomicSendCalls } from '~/state/sagas/transactions/5792'
import { getDisplayableError, handleApprovalTransactionStep } from '~/state/sagas/transactions/utils'

vi.mock('uniswap/src/features/transactions/liquidity/steps/generateLPTransactionSteps', () => ({
  generateLPTransactionSteps: vi.fn(),
}))

vi.mock('~/state/sagas/transactions/utils', () => ({
  getDisplayableError: vi.fn(),
  handleApprovalTransactionStep: vi.fn(),
  handleOnChainStep: vi.fn(),
  handlePermitTransactionStep: vi.fn(),
  handleSignatureStep: vi.fn(),
}))

vi.mock('~/state/sagas/transactions/5792', () => ({
  handleAtomicSendCalls: vi.fn(),
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const ACCOUNT = { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' }
const APPROVAL_STEP = { type: TransactionStepType.TokenApprovalTransaction } as TransactionStep

function makeTxContext(amountRaw: string): ValidatedLiquidityTxContext {
  const currency = { chainId: UniverseChainId.Mainnet }
  return {
    action: {
      type: LiquidityTransactionType.Decrease,
      currency0Amount: { currency, quotient: amountRaw },
      currency1Amount: { currency, quotient: amountRaw },
    },
  } as unknown as ValidatedLiquidityTxContext
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (error: unknown) => void } {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

function createTestStore() {
  const sagaMiddleware = createSagaMiddleware()
  const store = configureStore({
    reducer: { saga: getMonitoredSagaReducers({ [liquiditySaga.name]: liquiditySaga }) },
    middleware: (getDefault) =>
      getDefault({ thunk: false, serializableCheck: false, immutableCheck: false }).concat(sagaMiddleware),
  })
  sagaMiddleware.run(liquiditySaga.wrappedSaga)
  return store
}

function makeTrigger({
  txContext,
  startChainId = UniverseChainId.Mainnet,
  selectChain = vi.fn(async () => true),
}: {
  txContext: ValidatedLiquidityTxContext
  startChainId?: UniverseChainId
  selectChain?: (chainId: number) => Promise<boolean>
}) {
  const callbacks = { onSuccess: vi.fn(), onFailure: vi.fn(), setCurrentStep: vi.fn(), selectChain }
  const action = liquiditySaga.actions.trigger({
    selectChain,
    startChainId,
    account: ACCOUNT,
    liquidityTxContext: txContext,
    setCurrentStep: callbacks.setCurrentStep,
    setSteps: vi.fn(),
    onSuccess: callbacks.onSuccess,
    onFailure: callbacks.onFailure,
  } as unknown as Parameters<typeof liquiditySaga.actions.trigger>[0])
  return { action, ...callbacks }
}

describe('liquiditySaga running status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(generateLPTransactionSteps).mockReturnValue([APPROVAL_STEP])
    vi.mocked(getDisplayableError).mockImplementation(({ error }) => error as Error)
  })

  it('is idle before any confirm', () => {
    const store = createTestStore()

    expect(store.getState().saga[liquiditySaga.name]?.status).toBeNull()
  })

  it('stays running while a wallet approval is pending, drops a second confirm, and ends on rejection', async () => {
    const approval = deferred<void>()
    vi.mocked(handleApprovalTransactionStep).mockReturnValue(approval.promise as never)
    const store = createTestStore()

    const first = makeTrigger({ txContext: makeTxContext('100') })
    store.dispatch(first.action)
    await flush()

    expect(store.getState().saga[liquiditySaga.name]?.status).toBe(SagaStatus.Started)
    expect(handleApprovalTransactionStep).toHaveBeenCalledTimes(1)

    const second = makeTrigger({ txContext: makeTxContext('50') })
    store.dispatch(second.action)
    await flush()

    expect(generateLPTransactionSteps).toHaveBeenCalledTimes(1)
    expect(handleApprovalTransactionStep).toHaveBeenCalledTimes(1)
    expect(store.getState().saga[liquiditySaga.name]?.status).toBe(SagaStatus.Started)

    const rejection = new Error('User rejected the request')
    approval.reject(rejection)
    await flush()

    expect(first.onFailure).toHaveBeenCalledTimes(1)
    expect(first.onFailure).toHaveBeenCalledWith(rejection)
    expect(first.onSuccess).not.toHaveBeenCalled()
    expect(second.onFailure).not.toHaveBeenCalled()
    expect(second.onSuccess).not.toHaveBeenCalled()
    expect(store.getState().saga[liquiditySaga.name]?.status).not.toBe(SagaStatus.Started)
  })

  it('stays running across a pending chain switch, then a retry runs with the latest inputs', async () => {
    const chainSwitch = deferred<boolean>()
    vi.mocked(handleApprovalTransactionStep).mockReturnValue(Promise.resolve() as never)
    const store = createTestStore()

    const first = makeTrigger({
      txContext: makeTxContext('100'),
      startChainId: UniverseChainId.Base,
      selectChain: vi.fn(() => chainSwitch.promise),
    })
    store.dispatch(first.action)
    await flush()

    expect(first.selectChain).toHaveBeenCalledWith(UniverseChainId.Mainnet)
    expect(store.getState().saga[liquiditySaga.name]?.status).toBe(SagaStatus.Started)
    expect(first.setCurrentStep).toHaveBeenCalledWith({ step: APPROVAL_STEP, accepted: false })

    chainSwitch.resolve(false)
    await flush()

    expect(first.onFailure).toHaveBeenCalledTimes(1)
    expect(handleApprovalTransactionStep).not.toHaveBeenCalled()
    expect(store.getState().saga[liquiditySaga.name]?.status).not.toBe(SagaStatus.Started)

    const editedTxContext = makeTxContext('50')
    const retry = makeTrigger({ txContext: editedTxContext })
    store.dispatch(retry.action)
    await flush()

    expect(generateLPTransactionSteps).toHaveBeenLastCalledWith(editedTxContext)
    expect(handleApprovalTransactionStep).toHaveBeenCalledTimes(1)
    expect(retry.onSuccess).toHaveBeenCalledTimes(1)
    expect(retry.onFailure).not.toHaveBeenCalled()
    expect(store.getState().saga[liquiditySaga.name]?.status).toBe(SagaStatus.Success)
  })
})

describe('liquiditySaga batched wallet call', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reports the wallet call as the current step while the wallet prompt is open', async () => {
    const walletCallStep = { type: TransactionStepType.IncreasePositionTransactionWalletCall } as TransactionStep
    vi.mocked(generateLPTransactionSteps).mockReturnValue([walletCallStep])
    const sendCalls = deferred<string>()
    // Delegated to with `yield*`, so the mock has to be a generator; redux-saga waits on the yielded promise.
    vi.mocked(handleAtomicSendCalls).mockImplementation(function* () {
      return (yield sendCalls.promise) as string
    } as never)
    const store = createTestStore()

    const run = makeTrigger({ txContext: makeTxContext('100') })
    store.dispatch(run.action)
    await flush()

    expect(store.getState().saga[liquiditySaga.name]?.status).toBe(SagaStatus.Started)
    expect(run.setCurrentStep).toHaveBeenCalledWith({ step: walletCallStep, accepted: false })
  })
})

describe('liquiditySaga cancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(generateLPTransactionSteps).mockReturnValue([APPROVAL_STEP])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls onFailure when the 30 minute timeout stops a run stuck on a wallet prompt', async () => {
    vi.useFakeTimers()
    vi.mocked(handleApprovalTransactionStep).mockReturnValue(new Promise(() => undefined) as never)
    const store = createTestStore()

    const run = makeTrigger({ txContext: makeTxContext('100') })
    store.dispatch(run.action)
    await vi.advanceTimersByTimeAsync(ms('30m') - 1)

    expect(run.onFailure).not.toHaveBeenCalled()
    expect(store.getState().saga[liquiditySaga.name]?.status).toBe(SagaStatus.Started)

    await vi.advanceTimersByTimeAsync(1)

    expect(run.onFailure).toHaveBeenCalledTimes(1)
    expect(run.onSuccess).not.toHaveBeenCalled()
    expect(store.getState().saga[liquiditySaga.name]?.status).toBe(SagaStatus.Failure)
  })

  it('calls onFailure when the run is stopped with the cancel action', async () => {
    vi.mocked(handleApprovalTransactionStep).mockReturnValue(new Promise(() => undefined) as never)
    const store = createTestStore()

    const run = makeTrigger({ txContext: makeTxContext('100') })
    store.dispatch(run.action)
    await flush()
    store.dispatch(liquiditySaga.actions.cancel())
    await flush()

    expect(run.onFailure).toHaveBeenCalledTimes(1)
    expect(run.onSuccess).not.toHaveBeenCalled()
  })

  it('does not call onFailure when the run succeeds', async () => {
    vi.mocked(handleApprovalTransactionStep).mockReturnValue(Promise.resolve() as never)
    const store = createTestStore()

    const run = makeTrigger({ txContext: makeTxContext('100') })
    store.dispatch(run.action)
    await flush()

    expect(run.onSuccess).toHaveBeenCalledTimes(1)
    expect(run.onFailure).not.toHaveBeenCalled()
    expect(store.getState().saga[liquiditySaga.name]?.status).toBe(SagaStatus.Success)
  })
})
