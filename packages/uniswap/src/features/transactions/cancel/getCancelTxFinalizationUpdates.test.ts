import { TradingApi } from '@universe/api'
import { getCancelTxFinalizationUpdates } from 'uniswap/src/features/transactions/cancel/getCancelTxFinalizationUpdates'
import { TransactionsState } from 'uniswap/src/features/transactions/slice'
import {
  TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { uniswapXOrderDetails } from 'uniswap/src/test/fixtures'

const NOW = 1_700_000_000_000
const ADDRESS = '0xaddress'
const CANCEL_TX_HASH = '0xcanceltxhash'

function makeOrder(overrides: Partial<UniswapXOrderDetails> = {}): UniswapXOrderDetails {
  return {
    ...uniswapXOrderDetails({ status: TransactionStatus.Cancelling }),
    from: ADDRESS,
    routing: TradingApi.Routing.DUTCH_LIMIT,
    cancelTxHash: CANCEL_TX_HASH,
    cancelTimeoutAtMs: NOW + 60_000,
    ...overrides,
  }
}

function makeState(orders: UniswapXOrderDetails[]): TransactionsState {
  const state: TransactionsState = { [ADDRESS]: {} }
  for (const order of orders) {
    state[ADDRESS]![order.chainId] = { ...state[ADDRESS]![order.chainId], [order.id]: order }
  }
  return state
}

function makeCancelTx({
  status,
  orderHashes,
}: {
  status: TransactionStatus
  orderHashes: string[]
}): TransactionDetails {
  return {
    routing: TradingApi.Routing.CLASSIC,
    id: CANCEL_TX_HASH,
    hash: CANCEL_TX_HASH,
    chainId: 1,
    from: ADDRESS,
    addedTime: NOW - 1000,
    status,
    options: {},
    transactionOriginType: TransactionOriginType.Internal,
    typeInfo: { type: TransactionType.UniswapXCancel, orderHashes },
  } as TransactionDetails
}

describe(getCancelTxFinalizationUpdates, () => {
  it('returns [] for non-cancel transactions', () => {
    const order = makeOrder()
    const tx = {
      ...makeCancelTx({ status: TransactionStatus.Success, orderHashes: [order.orderHash ?? ''] }),
      typeInfo: { type: TransactionType.Approve, tokenAddress: '0x1', spender: '0x2' },
    } as TransactionDetails
    expect(
      getCancelTxFinalizationUpdates({ transaction: tx, transactionsState: makeState([order]), nowMs: NOW }),
    ).toEqual([])
  })

  it.each([TransactionStatus.Canceled, TransactionStatus.Success])(
    'cancel tx finalized %s → orderCancelTxMined only, never a terminal order flip',
    (status) => {
      const order = makeOrder()
      const updates = getCancelTxFinalizationUpdates({
        transaction: makeCancelTx({ status, orderHashes: [order.orderHash ?? ''] }),
        transactionsState: makeState([order]),
        nowMs: NOW,
      })
      expect(updates).toHaveLength(1)
      expect(updates[0]?.type).toBe('transactions/orderCancelTxMined')
      expect(updates[0]?.payload).toEqual({ address: ADDRESS, chainId: order.chainId, id: order.id })
    },
  )

  describe('cancel tx finalized Failed (poll-exhaustion race gate)', () => {
    it('gate unmet (timeout not expired) → NO flip', () => {
      const order = makeOrder({ cancelTimeoutAtMs: NOW + 60_000 })
      const updates = getCancelTxFinalizationUpdates({
        transaction: makeCancelTx({ status: TransactionStatus.Failed, orderHashes: [order.orderHash ?? ''] }),
        transactionsState: makeState([order]),
        nowMs: NOW,
      })
      expect(updates).toEqual([])
    })

    it('gate met (timeout expired) → revert to Pending', () => {
      const order = makeOrder({ cancelTimeoutAtMs: NOW - 1 })
      const updates = getCancelTxFinalizationUpdates({
        transaction: makeCancelTx({ status: TransactionStatus.Failed, orderHashes: [order.orderHash ?? ''] }),
        transactionsState: makeState([order]),
        nowMs: NOW,
      })
      expect(updates).toHaveLength(1)
      expect(updates[0]?.type).toBe('transactions/orderCancelFailed')
      expect(updates[0]?.payload).toEqual({
        address: ADDRESS,
        chainId: order.chainId,
        id: order.id,
        reason: 'broadcast-failed',
        revertToStatus: TransactionStatus.Pending,
      })
    })

    it('OR-gate receipt arm: mined-and-reverted (real Failed receipt) converges immediately, even inside the window', () => {
      const order = makeOrder({ cancelTimeoutAtMs: NOW + 60_000 })
      const failedWithReceipt = {
        ...makeCancelTx({ status: TransactionStatus.Failed, orderHashes: [order.orderHash ?? ''] }),
        receipt: { transactionIndex: 1, blockHash: '0xblock', blockNumber: 1, confirmedTime: NOW },
      } as TransactionDetails
      const updates = getCancelTxFinalizationUpdates({
        transaction: failedWithReceipt,
        transactionsState: makeState([order]),
        nowMs: NOW,
      })
      expect(updates).toHaveLength(1)
      expect(updates[0]?.type).toBe('transactions/orderCancelFailed')
    })

    it('order no longer Cancelling → no flip', () => {
      const order = makeOrder({ status: TransactionStatus.Success, cancelTimeoutAtMs: NOW - 1 })
      const updates = getCancelTxFinalizationUpdates({
        transaction: makeCancelTx({ status: TransactionStatus.Failed, orderHashes: [order.orderHash ?? ''] }),
        transactionsState: makeState([order]),
        nowMs: NOW,
      })
      expect(updates).toEqual([])
    })
  })

  it('late Canceled finalize for the same hash still re-marks the order toward cancelled (fake-Pending killer)', () => {
    // The order was reverted to Pending by an earlier Failed pass; a later Canceled finalize
    // must still emit orderCancelTxMined — the reducer re-enters it into the cancel flow.
    const order = makeOrder({ status: TransactionStatus.Pending, cancelTxHash: undefined })
    const updates = getCancelTxFinalizationUpdates({
      transaction: makeCancelTx({ status: TransactionStatus.Canceled, orderHashes: [order.orderHash ?? ''] }),
      transactionsState: makeState([order]),
      nowMs: NOW,
    })
    expect(updates).toHaveLength(1)
    expect(updates[0]?.type).toBe('transactions/orderCancelTxMined')
  })

  it('CAS: order already Success (filled) gets a mined marker whose reducer no-ops, not a flip', () => {
    const order = makeOrder({ status: TransactionStatus.Success })
    const updates = getCancelTxFinalizationUpdates({
      transaction: makeCancelTx({ status: TransactionStatus.Canceled, orderHashes: [order.orderHash ?? ''] }),
      transactionsState: makeState([order]),
      nowMs: NOW,
    })
    // The pure core emits the marker; the orderCancelTxMined reducer's CAS ignores final orders.
    expect(updates.every((update) => update.type === 'transactions/orderCancelTxMined')).toBe(true)
  })

  it('multiple orderHashes → one update per linked order', () => {
    const orderA = makeOrder()
    const orderB = makeOrder()
    const updates = getCancelTxFinalizationUpdates({
      transaction: makeCancelTx({
        status: TransactionStatus.Canceled,
        orderHashes: [orderA.orderHash ?? '', orderB.orderHash ?? ''],
      }),
      transactionsState: makeState([orderA, orderB]),
      nowMs: NOW,
    })
    expect(updates).toHaveLength(2)
  })
})
