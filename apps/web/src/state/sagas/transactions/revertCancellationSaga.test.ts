import { TradingApi } from '@universe/api'
import { getFeatureFlag } from '@universe/gating'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { buildSingleCancellation } from 'uniswap/src/features/transactions/cancel/cancelOrderFactory'
import { CANCEL_TX_TIMEOUT_MS } from 'uniswap/src/features/transactions/cancel/cancelTimeoutStateMachine'
import { addTransaction, orderCancelTxMined, revertCancelSwap } from 'uniswap/src/features/transactions/slice'
import { getOrders } from 'uniswap/src/features/transactions/swap/orders'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import type { Mock } from 'vitest'
import { fetchCancelTxReceiptStatus } from '~/state/activity/polling/cancelTimeouts'

const { mockGetSigner, mockAppStore } = vi.hoisted(() => ({
  mockGetSigner: vi.fn(),
  mockAppStore: {
    getState: vi.fn(() => ({ transactions: {} })),
    dispatch: vi.fn(),
  },
}))

vi.mock('~/state', () => ({ default: mockAppStore }))
vi.mock('~/state/sagas/transactions/utils', () => ({ getSigner: mockGetSigner }))
vi.mock('~/state/activity/polling/cancelTimeouts', () => ({ fetchCancelTxReceiptStatus: vi.fn() }))
vi.mock('uniswap/src/features/transactions/swap/orders', () => ({ getOrders: vi.fn() }))
vi.mock('uniswap/src/features/transactions/cancel/cancelOrderFactory', async () => ({
  ...(await vi.importActual('uniswap/src/features/transactions/cancel/cancelOrderFactory')),
  buildSingleCancellation: vi.fn(),
}))
vi.mock('@universe/gating', async () => ({
  ...(await vi.importActual('@universe/gating')),
  getFeatureFlag: vi.fn(() => true),
}))
vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))
vi.mock('~/hooks/useSelectChain', () => ({ useSelectChain: vi.fn() }))

import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
// Import after mocks
import { revertCancellationSaga } from '~/state/sagas/transactions/revertCancellationSaga'

const ADDRESS = '0xaddress'
const ORDER_ID = 'order-1'
const ORDER_HASH = '0xorderhash'
const OLD_CANCEL_TX = '0xoldcancel'
const NEW_CANCEL_TX = '0xnewcancel'
const NOW = 1_700_000_000_000

function makeTimedOutOrder(overrides: Partial<UniswapXOrderDetails> = {}): UniswapXOrderDetails {
  return {
    routing: TradingApi.Routing.DUTCH_LIMIT,
    id: ORDER_ID,
    orderHash: ORDER_HASH,
    status: TransactionStatus.Cancelling,
    chainId: UniverseChainId.Mainnet,
    from: ADDRESS,
    addedTime: NOW - 10 * 60 * 1000,
    encodedOrder: '0xencoded',
    transactionOriginType: TransactionOriginType.Internal,
    typeInfo: { type: TransactionType.Swap } as UniswapXOrderDetails['typeInfo'],
    cancelTxHash: OLD_CANCEL_TX,
    cancelBroadcastTimeMs: NOW - CANCEL_TX_TIMEOUT_MS - 60_000,
    cancelTimeoutAtMs: NOW - 60_000,
    ...overrides,
  }
}

function setStoreOrder(order: UniswapXOrderDetails | undefined) {
  mockAppStore.getState.mockReturnValue({
    transactions: order ? { [ADDRESS]: { [order.chainId]: { [order.id]: order } } } : {},
  })
}

function runRevert(order: UniswapXOrderDetails, selectChain = vi.fn().mockResolvedValue(true)) {
  const sagaMiddleware = createSagaMiddleware()
  const store = configureStore({
    reducer: { _: (state = null) => state },
    middleware: (getDefault) =>
      getDefault({ thunk: false, serializableCheck: false, immutableCheck: false }).concat(sagaMiddleware),
  })
  const task = sagaMiddleware.run(revertCancellationSaga.wrappedSaga)
  store.dispatch(revertCancellationSaga.actions.trigger({ order, selectChain }))
  return { task, selectChain, flush: () => new Promise((resolve) => setTimeout(resolve, 20)) }
}

describe('revertCancellationSaga', () => {
  const mockSendTransaction = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(NOW)
    ;(getFeatureFlag as Mock).mockReturnValue(true)
    mockGetSigner.mockResolvedValue({ sendTransaction: mockSendTransaction })
    mockSendTransaction.mockResolvedValue({ hash: NEW_CANCEL_TX })
    ;(getOrders as Mock).mockResolvedValue({
      orders: [{ orderId: ORDER_HASH, orderStatus: TradingApi.OrderStatus.OPEN, encodedOrder: '0xencoded' }],
    })
    ;(fetchCancelTxReceiptStatus as Mock).mockResolvedValue('not-found')
    ;(buildSingleCancellation as Mock).mockResolvedValue({ to: '0xpermit2', from: ADDRESS, data: '0xdata' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('happy path: swaps the record via CAS on successful broadcast and registers the new tracked tx', async () => {
    const order = makeTimedOutOrder()
    setStoreOrder(order)

    const { task, flush } = runRevert(order)
    await flush()

    const dispatched = mockAppStore.dispatch.mock.calls.map(([action]) => action)
    const swapAction = dispatched.find((action) => action.type === revertCancelSwap.type)
    expect(swapAction?.payload).toEqual(expect.objectContaining({ id: ORDER_ID, newCancelTxHash: NEW_CANCEL_TX }))
    const addAction = dispatched.find((action) => action.type === addTransaction.type)
    expect(addAction?.payload).toEqual(
      expect.objectContaining({
        hash: NEW_CANCEL_TX,
        typeInfo: { type: TransactionType.UniswapXCancel, orderHashes: [ORDER_HASH] },
      }),
    )
    task.cancel()
  })

  it('precondition CAS: aborts when the fresh record is no longer timed-out Cancelling', async () => {
    const order = makeTimedOutOrder()
    // Fresh record already recovered (new deadline in the future)
    setStoreOrder(makeTimedOutOrder({ cancelTimeoutAtMs: NOW + 60_000 }))

    const { task, flush } = runRevert(order)
    await flush()

    expect(getOrders).not.toHaveBeenCalled()
    expect(mockGetSigner).not.toHaveBeenCalled()
    task.cancel()
  })

  it.each([
    TradingApi.OrderStatus.FILLED,
    TradingApi.OrderStatus.CANCELLED,
    TradingApi.OrderStatus.EXPIRED,
    TradingApi.OrderStatus.ERROR,
  ])('pre-check %s: never prompts the wallet', async (orderStatus) => {
    const order = makeTimedOutOrder()
    setStoreOrder(order)
    ;(getOrders as Mock).mockResolvedValue({ orders: [{ orderId: ORDER_HASH, orderStatus }] })

    const { task, flush } = runRevert(order)
    await flush()

    expect(mockGetSigner).not.toHaveBeenCalled()
    expect(
      mockAppStore.dispatch.mock.calls.map(([action]) => action).find((a) => a.type === revertCancelSwap.type),
    ).toBeUndefined()
    task.cancel()
  })

  it('last-second receipt check: aborts with a mined marker when the original cancel confirmed', async () => {
    const order = makeTimedOutOrder()
    setStoreOrder(order)
    ;(fetchCancelTxReceiptStatus as Mock).mockResolvedValue('mined')

    const { task, flush } = runRevert(order)
    await flush()

    const dispatched = mockAppStore.dispatch.mock.calls.map(([action]) => action)
    expect(dispatched.find((action) => action.type === orderCancelTxMined.type)).toBeDefined()
    expect(mockGetSigner).not.toHaveBeenCalled()
    task.cancel()
  })

  it('receipt check RPC outage: aborts without a wallet prompt (never risks the double-gas case)', async () => {
    const order = makeTimedOutOrder()
    setStoreOrder(order)
    ;(fetchCancelTxReceiptStatus as Mock).mockResolvedValue('rpc-error')

    const { task, flush } = runRevert(order)
    await flush()

    expect(mockGetSigner).not.toHaveBeenCalled()
    expect(
      mockAppStore.dispatch.mock.calls.map(([action]) => action).find((a) => a.type === revertCancelSwap.type),
    ).toBeUndefined()
    task.cancel()
  })

  it('empty getOrders result: bails without a wallet prompt or failure analytics (nothing was attempted)', async () => {
    const order = makeTimedOutOrder()
    setStoreOrder(order)
    ;(getOrders as Mock).mockResolvedValue({ orders: [] })

    const { task, flush } = runRevert(order)
    await flush()

    expect(mockGetSigner).not.toHaveBeenCalled()
    expect(sendAnalyticsEvent).not.toHaveBeenCalledWith(
      InterfaceEventName.LimitCancelBroadcastFailed,
      expect.anything(),
    )
    task.cancel()
  })

  it('legacy no-hash record: skips the receipt check and proceeds to the wallet prompt', async () => {
    const order = makeTimedOutOrder({ cancelTxHash: undefined, cancelBroadcastTimeMs: undefined })
    setStoreOrder(order)

    const { task, flush } = runRevert(order)
    await flush()

    expect(fetchCancelTxReceiptStatus).not.toHaveBeenCalled()
    expect(mockSendTransaction).toHaveBeenCalled()
    task.cancel()
  })

  it('broadcast rejection: record untouched — no CAS swap, no status write', async () => {
    const order = makeTimedOutOrder()
    setStoreOrder(order)
    mockSendTransaction.mockRejectedValue({ code: 4001 })

    const { task, flush } = runRevert(order)
    await flush()

    const dispatched = mockAppStore.dispatch.mock.calls.map(([action]) => action)
    expect(dispatched.find((action) => action.type === revertCancelSwap.type)).toBeUndefined()
    expect(dispatched.find((action) => action.type === addTransaction.type)).toBeUndefined()
    // Nothing may restore Pending mid-flow — that would re-enable both cancel entry points
    expect(dispatched.some((action) => action.payload?.revertToStatus !== undefined)).toBe(false)
    task.cancel()
  })

  it('does nothing when the flag is off', async () => {
    ;(getFeatureFlag as Mock).mockReturnValue(false)
    const order = makeTimedOutOrder()
    setStoreOrder(order)

    const { task, flush } = runRevert(order)
    await flush()

    expect(getOrders).not.toHaveBeenCalled()
    task.cancel()
  })
})
