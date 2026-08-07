import { TradingApi } from '@universe/api'
import { getFeatureFlag } from '@universe/gating'
import { getPublicClient } from '@wagmi/core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  CANCEL_TX_TIMEOUT_MS,
  ORPHAN_CANCEL_TIMEOUT_MS,
} from 'uniswap/src/features/transactions/cancel/cancelTimeoutStateMachine'
import {
  orderCancelTxMined,
  stampCancelAlertShown,
  stampOrphanCancelTimeout,
} from 'uniswap/src/features/transactions/slice'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import type { Mock } from 'vitest'
import { evaluateCancelTimeouts } from '~/state/activity/polling/cancelTimeouts'
import { UniswapXBackendOrder } from '~/types/uniswapx'

const mockDispatch = vi.fn()

vi.mock('~/connection/wagmiConfig', () => ({
  wagmiConfig: {},
}))

vi.mock('@wagmi/core', () => ({
  getPublicClient: vi.fn(),
}))

vi.mock('@universe/gating', async () => ({
  ...(await vi.importActual('@universe/gating')),
  getFeatureFlag: vi.fn(() => true),
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

const NOW = 1_700_000_000_000
const ADDRESS = '0xaddress'
let orderCounter = 0

// viem's TransactionReceiptNotFoundError, matched by name (unmined tx — a positive "no receipt")
function receiptNotFoundError(): Error {
  const error = new Error('Transaction receipt with hash x could not be found')
  error.name = 'TransactionReceiptNotFoundError'
  return error
}

function makeCancellingOrder(overrides: Partial<UniswapXOrderDetails> = {}): UniswapXOrderDetails {
  orderCounter += 1
  return {
    routing: TradingApi.Routing.DUTCH_LIMIT,
    // Unique per test: the alert-shown analytics dedup is module-level
    orderHash: `0xorderhash${orderCounter}`,
    id: `order-${orderCounter}`,
    status: TransactionStatus.Cancelling,
    chainId: UniverseChainId.Mainnet,
    from: ADDRESS,
    addedTime: NOW - 10 * 60 * 1000,
    expiry: Math.floor(NOW / 1000) + 3600,
    transactionOriginType: TransactionOriginType.Internal,
    typeInfo: { type: TransactionType.Swap } as UniswapXOrderDetails['typeInfo'],
    ...overrides,
  }
}

function backendStatusFor(order: UniswapXOrderDetails, orderStatus: TradingApi.OrderStatus): UniswapXBackendOrder {
  return { orderHash: order.orderHash, orderStatus } as UniswapXBackendOrder
}

describe(evaluateCancelTimeouts, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    ;(getFeatureFlag as Mock).mockReturnValue(true)
    ;(getPublicClient as Mock).mockReturnValue({
      getTransactionReceipt: vi.fn().mockRejectedValue(receiptNotFoundError()),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does nothing when the flag is off', async () => {
    const order = makeCancellingOrder({ cancelTxHash: undefined, cancelTimeoutAtMs: undefined })
    ;(getFeatureFlag as Mock).mockReturnValue(false)

    await evaluateCancelTimeouts({
      dispatch: mockDispatch,
      pendingOrders: [order],
      statuses: [backendStatusFor(order, TradingApi.OrderStatus.OPEN)],
    })

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('rehydrated record with a past deadline + backend OPEN alerts on the first tick (deadline lives in the record)', async () => {
    const order = makeCancellingOrder({
      cancelTxHash: '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
      cancelBroadcastTimeMs: NOW - 10 * 60 * 1000,
      cancelTimeoutAtMs: NOW - 8 * 60 * 1000,
    })

    await evaluateCancelTimeouts({
      dispatch: mockDispatch,
      pendingOrders: [order],
      statuses: [backendStatusFor(order, TradingApi.OrderStatus.OPEN)],
    })

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(
      InterfaceEventName.LimitCancelTimeoutAlertShown,
      expect.objectContaining({ order_hash: order.orderHash, cause: 'no-receipt' }),
    )
  })

  it('timeout-alert arm stamps the one-time alert write so memoized rows re-render', async () => {
    const order = makeCancellingOrder({
      cancelTxHash: '0xdeadbeef000000000000000000000000000000000000000000000000000000aa',
      cancelTimeoutAtMs: NOW - 1000,
    })

    await evaluateCancelTimeouts({
      dispatch: mockDispatch,
      pendingOrders: [order],
      statuses: [backendStatusFor(order, TradingApi.OrderStatus.OPEN)],
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      stampCancelAlertShown({ address: ADDRESS, chainId: order.chainId, id: order.id, nowMs: NOW }),
    )

    // Once the record carries the stamp, later ticks stop dispatching (idempotent by state)
    mockDispatch.mockClear()
    await evaluateCancelTimeouts({
      dispatch: mockDispatch,
      pendingOrders: [{ ...order, cancelAlertShownAtMs: NOW }],
      statuses: [backendStatusFor(order, TradingApi.OrderStatus.OPEN)],
    })
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('an RPC outage at the deadline never raises a false alert (retries next tick)', async () => {
    ;(getPublicClient as Mock).mockReturnValue({
      getTransactionReceipt: vi.fn().mockRejectedValue(new Error('fetch failed')),
    })
    const order = makeCancellingOrder({
      cancelTxHash: '0xdeadbeef000000000000000000000000000000000000000000000000000000bb',
      cancelTimeoutAtMs: NOW - 1000,
    })

    await evaluateCancelTimeouts({
      dispatch: mockDispatch,
      pendingOrders: [order],
      statuses: [backendStatusFor(order, TradingApi.OrderStatus.OPEN)],
    })

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('fires the alert-shown event once per persisted deadline', async () => {
    const order = makeCancellingOrder({
      cancelTxHash: '0xdeadbeef00000000000000000000000000000000000000000000000000000001',
      cancelTimeoutAtMs: NOW - 1000,
    })
    const statuses = [backendStatusFor(order, TradingApi.OrderStatus.OPEN)]

    await evaluateCancelTimeouts({ pendingOrders: [order], statuses, dispatch: mockDispatch })
    await evaluateCancelTimeouts({ pendingOrders: [order], statuses, dispatch: mockDispatch })

    expect(sendAnalyticsEvent).toHaveBeenCalledTimes(1)
  })

  describe('orphan / legacy lazy stamp', () => {
    it('first tick stamps the 5-min orphan deadline instead of alerting', async () => {
      const order = makeCancellingOrder({ cancelTxHash: undefined, cancelTimeoutAtMs: undefined })

      await evaluateCancelTimeouts({
        dispatch: mockDispatch,
        pendingOrders: [order],
        statuses: [backendStatusFor(order, TradingApi.OrderStatus.OPEN)],
      })

      expect(mockDispatch).toHaveBeenCalledWith(
        stampOrphanCancelTimeout({ address: ADDRESS, chainId: order.chainId, id: order.id, nowMs: NOW }),
      )
      expect(sendAnalyticsEvent).not.toHaveBeenCalled()
    })

    it('no alert at 4 minutes, alert past the 5-minute deadline, then auto-resolves on CANCELLED', async () => {
      const stampedAt = NOW - 4 * 60 * 1000
      const order = makeCancellingOrder({
        cancelTxHash: undefined,
        cancelRequest: undefined,
        cancelInitiatedTimeMs: stampedAt,
        cancelTimeoutAtMs: stampedAt + ORPHAN_CANCEL_TIMEOUT_MS,
      })

      // 4 minutes in: deadline not reached
      await evaluateCancelTimeouts({
        dispatch: mockDispatch,
        pendingOrders: [order],
        statuses: [backendStatusFor(order, TradingApi.OrderStatus.OPEN)],
      })
      expect(sendAnalyticsEvent).not.toHaveBeenCalled()

      // Past 5 minutes: alert (legacy record — no hash, no cancelRequest)
      vi.setSystemTime(stampedAt + ORPHAN_CANCEL_TIMEOUT_MS + 1000)
      await evaluateCancelTimeouts({
        dispatch: mockDispatch,
        pendingOrders: [order],
        statuses: [backendStatusFor(order, TradingApi.OrderStatus.OPEN)],
      })
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(
        InterfaceEventName.LimitCancelTimeoutAlertShown,
        expect.objectContaining({ cause: 'legacy-record' }),
      )

      // Next tick the backend reports CANCELLED: no further alert; the normal poll path converges
      ;(sendAnalyticsEvent as Mock).mockClear()
      await evaluateCancelTimeouts({
        dispatch: mockDispatch,
        pendingOrders: [order],
        statuses: [backendStatusFor(order, TradingApi.OrderStatus.CANCELLED)],
      })
      expect(sendAnalyticsEvent).not.toHaveBeenCalled()
    })
  })

  it('receipt-first: a mined cancel tx marks the order finalizing instead of alerting', async () => {
    ;(getPublicClient as Mock).mockReturnValue({
      getTransactionReceipt: vi.fn().mockResolvedValue({ status: 'success' }),
    })
    const order = makeCancellingOrder({
      cancelTxHash: '0xdeadbeef00000000000000000000000000000000000000000000000000000002',
      cancelTimeoutAtMs: NOW - 1000,
    })

    await evaluateCancelTimeouts({
      dispatch: mockDispatch,
      pendingOrders: [order],
      statuses: [backendStatusFor(order, TradingApi.OrderStatus.OPEN)],
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      orderCancelTxMined({ address: ADDRESS, chainId: order.chainId, id: order.id }),
    )
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(
      InterfaceEventName.LimitCancelConfirmed,
      expect.objectContaining({ order_hash: order.orderHash }),
    )
    expect(sendAnalyticsEvent).not.toHaveBeenCalledWith(
      InterfaceEventName.LimitCancelTimeoutAlertShown,
      expect.anything(),
    )
  })

  it('a pre-deadline order is left alone', async () => {
    const order = makeCancellingOrder({
      cancelTxHash: '0xdeadbeef00000000000000000000000000000000000000000000000000000003',
      cancelTimeoutAtMs: NOW + CANCEL_TX_TIMEOUT_MS,
    })

    await evaluateCancelTimeouts({
      dispatch: mockDispatch,
      pendingOrders: [order],
      statuses: [backendStatusFor(order, TradingApi.OrderStatus.OPEN)],
    })

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
  })
})
