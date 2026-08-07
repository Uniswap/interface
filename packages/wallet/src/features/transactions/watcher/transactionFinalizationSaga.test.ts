import { TradingApi } from '@universe/api'
import { getFeatureFlag } from '@universe/gating'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { selectTransactions } from 'uniswap/src/features/transactions/selectors'
import {
  orderCancelFailed,
  orderCancelTxMined,
  transactionActions,
  TransactionsState,
} from 'uniswap/src/features/transactions/slice'
import {
  FinalizedTransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { uniswapXOrderDetails } from 'uniswap/src/test/fixtures'
import type { Mock } from 'vitest'
import { handleCancelTxFinalized } from 'wallet/src/features/transactions/watcher/transactionFinalizationSaga'

vi.mock('@universe/gating', async () => ({
  ...(await vi.importActual('@universe/gating')),
  getFeatureFlag: vi.fn(),
}))

const ADDRESS = '0xaddress'
const NOW_GATE_EXPIRED = 1 // any cancelTimeoutAtMs in the past relative to Date.now()

function makeOrder(overrides: Partial<UniswapXOrderDetails> = {}): UniswapXOrderDetails {
  return {
    ...uniswapXOrderDetails({ status: TransactionStatus.Cancelling }),
    from: ADDRESS,
    orderHash: '0xorderhash',
    cancelTxHash: '0xcanceltx',
    ...overrides,
  }
}

function makeState(order: UniswapXOrderDetails): TransactionsState {
  return { [ADDRESS]: { [order.chainId]: { [order.id]: order } } }
}

function makeFinalizedCancelTx(status: TransactionStatus): FinalizedTransactionDetails {
  return {
    routing: TradingApi.Routing.CLASSIC,
    id: '0xcanceltx',
    hash: '0xcanceltx',
    chainId: 1,
    from: ADDRESS,
    addedTime: Date.now(),
    status,
    options: {},
    transactionOriginType: TransactionOriginType.Internal,
    typeInfo: { type: TransactionType.UniswapXCancel, orderHashes: ['0xorderhash'] },
  } as FinalizedTransactionDetails
}

describe(handleCancelTxFinalized, () => {
  beforeEach(() => {
    ;(getFeatureFlag as Mock).mockReturnValue(true)
  })

  it.each([TransactionStatus.Canceled, TransactionStatus.Success])(
    'cancel tx finalized %s → orderCancelTxMined only',
    async (status) => {
      const order = makeOrder({ cancelTimeoutAtMs: Date.now() + 60_000 })
      await expectSaga(handleCancelTxFinalized, transactionActions.finalizeTransaction(makeFinalizedCancelTx(status)))
        .provide([[matchers.select(selectTransactions), makeState(order)]])
        .put(orderCancelTxMined({ address: ADDRESS, chainId: order.chainId, id: order.id }))
        .run()
    },
  )

  it('cancel tx finalized Failed with gate unmet → no flip (poll-exhaustion race)', async () => {
    const order = makeOrder({ cancelTimeoutAtMs: Date.now() + 60_000 })
    await expectSaga(
      handleCancelTxFinalized,
      transactionActions.finalizeTransaction(makeFinalizedCancelTx(TransactionStatus.Failed)),
    )
      .provide([[matchers.select(selectTransactions), makeState(order)]])
      .not.put.like({ action: { type: orderCancelFailed.type } })
      .run()
  })

  it('cancel tx finalized Failed with gate met → reverts the order to Pending', async () => {
    const order = makeOrder({ cancelTimeoutAtMs: NOW_GATE_EXPIRED })
    await expectSaga(
      handleCancelTxFinalized,
      transactionActions.finalizeTransaction(makeFinalizedCancelTx(TransactionStatus.Failed)),
    )
      .provide([[matchers.select(selectTransactions), makeState(order)]])
      .put(
        orderCancelFailed({
          address: ADDRESS,
          chainId: order.chainId,
          id: order.id,
          reason: 'broadcast-failed',
          revertToStatus: TransactionStatus.Pending,
        }),
      )
      .run()
  })

  it('late Canceled finalize still re-marks an already-reverted Pending order (saga-level re-entrancy)', async () => {
    // A previous Failed pass reverted the order to Pending; the receipt backfill then corrects
    // the cancel tx to Canceled — the saga must still emit the mined marker (fake-Pending killer)
    const order = makeOrder({ status: TransactionStatus.Pending, cancelTxHash: undefined })
    await expectSaga(
      handleCancelTxFinalized,
      transactionActions.finalizeTransaction(makeFinalizedCancelTx(TransactionStatus.Canceled)),
    )
      .provide([[matchers.select(selectTransactions), makeState(order)]])
      .put(orderCancelTxMined({ address: ADDRESS, chainId: order.chainId, id: order.id }))
      .run()
  })

  it('multi-order cancel tx → one update per linked order (saga-level)', async () => {
    const orderA = makeOrder({ id: 'order-a', orderHash: '0xorderhashA' })
    const orderB = makeOrder({ id: 'order-b', orderHash: '0xorderhashB' })
    const state: TransactionsState = {
      [ADDRESS]: { [orderA.chainId]: { [orderA.id]: orderA, [orderB.id]: orderB } },
    }
    const finalizedTx = {
      ...makeFinalizedCancelTx(TransactionStatus.Canceled),
      typeInfo: { type: TransactionType.UniswapXCancel, orderHashes: ['0xorderhashA', '0xorderhashB'] },
    } as FinalizedTransactionDetails
    await expectSaga(handleCancelTxFinalized, transactionActions.finalizeTransaction(finalizedTx))
      .provide([[matchers.select(selectTransactions), state]])
      .put(orderCancelTxMined({ address: ADDRESS, chainId: orderA.chainId, id: orderA.id }))
      .put(orderCancelTxMined({ address: ADDRESS, chainId: orderB.chainId, id: orderB.id }))
      .run()
  })

  it('does nothing when the flag is off', async () => {
    ;(getFeatureFlag as Mock).mockReturnValue(false)
    const order = makeOrder()
    await expectSaga(
      handleCancelTxFinalized,
      transactionActions.finalizeTransaction(makeFinalizedCancelTx(TransactionStatus.Canceled)),
    )
      .provide([[matchers.select(selectTransactions), makeState(order)]])
      .not.put.like({ action: { type: orderCancelTxMined.type } })
      .run()
  })
})
