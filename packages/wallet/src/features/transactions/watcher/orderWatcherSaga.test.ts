import { TradingApi } from '@universe/api'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call, fork } from 'redux-saga/effects'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { evaluateCancelState } from 'uniswap/src/features/transactions/cancel/cancelTimeoutStateMachine'
import { updateTransaction } from 'uniswap/src/features/transactions/slice'
import {
  QueuedOrderStatus,
  TransactionStatus,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { uniswapXOrderDetails } from 'uniswap/src/test/fixtures'
import { mockApolloClient } from 'uniswap/src/test/mocks'
import { getOrderUpdate, OrderWatcher } from 'wallet/src/features/transactions/watcher/orderWatcherSaga'
import { finalizeTransaction } from 'wallet/src/features/transactions/watcher/transactionFinalizationSaga'
import { watchTransaction } from 'wallet/src/features/transactions/watcher/watchOnChainTransactionSaga'
import {
  updateTransactionWithReceipt,
  waitForTransactionStatus,
} from 'wallet/src/features/transactions/watcher/watchTransactionSaga'
import { getProvider } from 'wallet/src/features/wallet/context'

vi.mock('@universe/api', async () => ({
  ...(await vi.importActual('@universe/api')),
  provideSessionService: vi.fn(() => ({
    createSession: vi.fn(),
    getSession: vi.fn(),
    getSessionState: vi.fn().mockResolvedValue(null),
  })),
}))

vi.mock('uniswap/src/data/apiClients/tradingApi/TradingApiClient', () => ({
  TradingApiClient: {
    fetchSwaps: vi.fn().mockResolvedValue({ swaps: [] }),
  },
  // Referenced by TradingApiSessionClient, which is loaded transitively in this test's import graph
  getFeatureFlaggedHeaders: vi.fn().mockResolvedValue({}),
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
  sendAppsFlyerEvent: vi.fn(),
}))

function makeRemoteOrder(orderStatus: TradingApi.OrderStatus, txHash?: string): TradingApi.UniswapXOrder {
  return { orderId: '0xorderhash', orderStatus, txHash } as TradingApi.UniswapXOrder
}

function makeLocalOrder(overrides: Partial<UniswapXOrderDetails> = {}): UniswapXOrderDetails {
  return { ...uniswapXOrderDetails({ status: TransactionStatus.Pending }), orderHash: '0xorderhash', ...overrides }
}

describe(getOrderUpdate, () => {
  describe('guard: Cancelling orders exit only to FINAL statuses', () => {
    it.each([
      [TradingApi.OrderStatus.OPEN, false],
      [TradingApi.OrderStatus.INSUFFICIENT_FUNDS, false],
      [TradingApi.OrderStatus.UNVERIFIED, false],
      [TradingApi.OrderStatus.EXPIRED, true],
      [TradingApi.OrderStatus.FILLED, true],
      [TradingApi.OrderStatus.CANCELLED, true],
      [TradingApi.OrderStatus.ERROR, true],
    ])('Cancelling + backend %s → update applied: %s', (backendStatus, shouldUpdate) => {
      const update = getOrderUpdate({
        localOrder: makeLocalOrder({ status: TransactionStatus.Cancelling }),
        remoteOrder: makeRemoteOrder(backendStatus),
      })
      expect(update !== undefined).toBe(shouldUpdate)
    })

    it('never flicks a Cancelling order back to a cancellable state (INSUFFICIENT_FUNDS flicker)', () => {
      const update = getOrderUpdate({
        localOrder: makeLocalOrder({ status: TransactionStatus.Cancelling }),
        remoteOrder: makeRemoteOrder(TradingApi.OrderStatus.INSUFFICIENT_FUNDS),
      })
      expect(update).toBeUndefined()
    })
  })

  it('unchanged status → no update', () => {
    const update = getOrderUpdate({
      localOrder: makeLocalOrder({ status: TransactionStatus.Pending }),
      remoteOrder: makeRemoteOrder(TradingApi.OrderStatus.OPEN),
    })
    expect(update).toBeUndefined()
  })

  it('marks a filled-while-cancelling order with cancelFailedReason', () => {
    const update = getOrderUpdate({
      localOrder: makeLocalOrder({ status: TransactionStatus.Cancelling }),
      remoteOrder: makeRemoteOrder(TradingApi.OrderStatus.FILLED, '0xfilltx'),
    })
    expect(update?.status).toBe(TransactionStatus.Success)
    expect(update?.hash).toBe('0xfilltx')
    expect(update?.cancelFailedReason).toBe('filled')
  })

  it('never stamps cancelFailedReason on a plain fill', () => {
    const update = getOrderUpdate({
      localOrder: makeLocalOrder({ status: TransactionStatus.Pending }),
      remoteOrder: makeRemoteOrder(TradingApi.OrderStatus.FILLED, '0xfilltx'),
    })
    expect(update?.status).toBe(TransactionStatus.Success)
    expect(update?.cancelFailedReason).toBeUndefined()
  })

  describe('Dutch-on-L2 cancel lifecycle never mis-fires the timeout machine (R1)', () => {
    const dutchOrder = (status: TransactionStatus): UniswapXOrderDetails =>
      makeLocalOrder({
        status,
        routing: TradingApi.Routing.DUTCH_V2,
        chainId: UniverseChainId.ArbitrumOne,
        // No cancel fields — the timeout machine keys exclusively off them
      })

    it.each([
      // open → insufficient-funds → open → filled
      [TransactionStatus.Pending, TradingApi.OrderStatus.INSUFFICIENT_FUNDS],
      [TransactionStatus.InsufficientFunds, TradingApi.OrderStatus.OPEN],
      [TransactionStatus.Pending, TradingApi.OrderStatus.FILLED],
      // open → cancelled
      [TransactionStatus.Pending, TradingApi.OrderStatus.CANCELLED],
    ])('local %s + backend %s: no timeout-machine action', (localStatus, backendStatus) => {
      const evaluation = evaluateCancelState({
        order: dutchOrder(localStatus),
        freshBackendStatus: backendStatus,
        nowMs: Date.now(),
      })
      expect(evaluation.kind).toBe('none')
    })

    it('a Cancelling Dutch order without cancel fields only gets the lazy orphan stamp — no alert', () => {
      const evaluation = evaluateCancelState({
        order: dutchOrder(TransactionStatus.Cancelling),
        freshBackendStatus: TradingApi.OrderStatus.OPEN,
        nowMs: Date.now(),
      })
      expect(evaluation.kind).toBe('stamp-orphan-timeout')
    })
  })
})

// OrderWatcher keeps a module-level listener registry that the poll loop resolves when a fill lands.
// These tests stand in for the poll by seeding a resolved listener, so they exercise the real
// "a fill is available" state instead of hanging on a listener that never resolves.
type OrderWatcherListener = {
  updateOrderStatus: (order: UniswapXOrderDetails) => void
  promise: Promise<UniswapXOrderDetails>
}
type OrderWatcherInternals = { listeners: Record<string, OrderWatcherListener> }

function orderWatcherInternals(): OrderWatcherInternals {
  return OrderWatcher as unknown as OrderWatcherInternals
}

function seedFillListener(orderHash: string, filledOrder: UniswapXOrderDetails): void {
  orderWatcherInternals().listeners[orderHash] = {
    updateOrderStatus: () => undefined,
    promise: Promise.resolve(filledOrder),
  }
}

function clearOrderListeners(): void {
  orderWatcherInternals().listeners = {}
}

// A watcher forked by the Submitted update owns the fill; the pre-submission watcher must release.
// Fork both against the same order to reproduce the historical double-finalization.
function* raceWatchersForSameOrder(params: {
  waitingOrder: UniswapXOrderDetails
  submittedOrder: UniswapXOrderDetails
  apolloClient: typeof mockApolloClient
}): Generator<unknown> {
  yield fork(watchTransaction, { transaction: params.waitingOrder, apolloClient: params.apolloClient })
  yield fork(watchTransaction, { transaction: params.submittedOrder, apolloClient: params.apolloClient })
}

describe(OrderWatcher.waitForOrderStatus, () => {
  const waitingOrder = makeLocalOrder({ queueStatus: QueuedOrderStatus.Waiting })
  const submittedOrder = { ...waitingOrder, queueStatus: QueuedOrderStatus.Submitted }
  const filledOrder = { ...submittedOrder, status: TransactionStatus.Success, hash: '0xfilltx' }

  afterEach(clearOrderListeners)

  it('releases a pre-submission watcher on the Submitted update instead of joining the observed fill', async () => {
    // The poll has already observed the fill and armed the listener. Pre-fix, the Submitted update
    // fell through to this armed listener and returned the fill — so both the pre-submission watcher
    // and the replacement watcher forked by the same update finalized the order (double-logging
    // Swap Transaction Completed). Post-fix it must exit with undefined the moment the update lands.
    seedFillListener(waitingOrder.orderHash as string, filledOrder)

    const { returnValue } = await expectSaga(
      OrderWatcher.waitForOrderStatus,
      waitingOrder.orderHash as string,
      QueuedOrderStatus.Waiting,
    )
      .dispatch(updateTransaction(submittedOrder))
      .run()

    expect(returnValue).toBeUndefined()
  })

  it('ignores submission updates for other orders, then releases on its own Submitted update', async () => {
    const otherOrder = { ...makeLocalOrder({ queueStatus: QueuedOrderStatus.Submitted }), orderHash: '0xother' }
    seedFillListener(waitingOrder.orderHash as string, filledOrder)

    const { returnValue } = await expectSaga(
      OrderWatcher.waitForOrderStatus,
      waitingOrder.orderHash as string,
      QueuedOrderStatus.Waiting,
    )
      .dispatch(updateTransaction(otherOrder))
      .dispatch(updateTransaction(submittedOrder))
      .run()

    expect(returnValue).toBeUndefined()
  })
})

describe('watchTransaction pre-submission UniswapX double-finalization', () => {
  afterEach(clearOrderListeners)

  it('finalizes a filled order exactly once when a pre-submission watcher and its replacement race the fill', async () => {
    // Regression: transactionWatcherSaga forks a fresh watcher on every addTransaction AND
    // updateTransaction, so a UniswapX order has a pre-submission (Waiting) watcher and a
    // replacement (Submitted) watcher live at once. Both used to await the same OrderWatcher
    // listener and each finalize the fill — two finalizeTransaction calls, two completion events.
    const waitingOrder = makeLocalOrder({ queueStatus: QueuedOrderStatus.Waiting })
    const submittedOrder = { ...waitingOrder, queueStatus: QueuedOrderStatus.Submitted }
    const filledOrder = { ...submittedOrder, status: TransactionStatus.Success, hash: '0xfilltx' }

    // Stand in for the poll observing the fill; both watchers read this listener.
    seedFillListener(waitingOrder.orderHash as string, filledOrder)

    const { effects } = await expectSaga(raceWatchersForSameOrder, {
      waitingOrder,
      submittedOrder,
      apolloClient: mockApolloClient,
    })
      .provide([
        [call(getProvider, waitingOrder.chainId), {}],
        [matchers.call.fn(waitForTransactionStatus), { status: TransactionStatus.Success }],
        // Detached receipt-fetch that would otherwise select from an empty store.
        [matchers.spawn.fn(updateTransactionWithReceipt), undefined],
        // Stub the finalize saga so the assertion counts invocations without its downstream effects.
        [matchers.call.fn(finalizeTransaction), undefined],
      ])
      .dispatch(updateTransaction(submittedOrder))
      .silentRun()

    const finalizeCalls = effects.call.filter((effect) => effect.payload.fn === finalizeTransaction)
    expect(finalizeCalls).toHaveLength(1)
  })
})
