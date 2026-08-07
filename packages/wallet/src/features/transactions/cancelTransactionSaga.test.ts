import { TradingApi } from '@universe/api'
import { getFeatureFlag } from '@universe/gating'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { orderCancelBroadcasted, orderCancelFailed } from 'uniswap/src/features/transactions/slice'
import {
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { uniswapXOrderDetails } from 'uniswap/src/test/fixtures'
import type { Mock } from 'vitest'
import { attemptCancelTransaction } from 'wallet/src/features/transactions/cancelTransactionSaga'
import { executeTransaction } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { selectAccounts } from 'wallet/src/features/wallet/selectors'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'

vi.mock('@universe/gating', async () => ({
  ...(await vi.importActual('@universe/gating')),
  getFeatureFlag: vi.fn(),
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

// Checksummed address so the saga's getValidAddress lookup matches the accounts map key
const account = signerMnemonicAccount({ address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' })

const CANCEL_TX_HASH = '0xcanceltxhash'
const cancelRequest = { to: '0xpermit2', from: account.address, data: '0x0' }

function makeOrder(status: TransactionStatus): UniswapXOrderDetails {
  return {
    ...uniswapXOrderDetails({ status }),
    routing: TradingApi.Routing.DUTCH_LIMIT,
    from: account.address,
    orderHash: '0xorderhash',
  }
}

const accountsState = { [account.address]: account }

describe(attemptCancelTransaction, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getFeatureFlag as Mock).mockReturnValue(true)
  })

  it('passes UniswapXCancel typeInfo + Cancelling initial status and records the broadcast', async () => {
    const order = makeOrder(TransactionStatus.Cancelling)

    const { effects } = await expectSaga(attemptCancelTransaction, order, cancelRequest)
      .provide([
        [matchers.select(selectAccounts), accountsState],
        [matchers.call.fn(executeTransaction), { transactionHash: CANCEL_TX_HASH }],
      ])
      .put.like({
        action: {
          type: orderCancelBroadcasted.type,
          payload: {
            address: account.address,
            chainId: order.chainId,
            id: order.id,
            cancelTxHash: CANCEL_TX_HASH,
          },
        },
      })
      .run()

    const executeCall = effects.call.find((effect) => effect.payload.fn === executeTransaction)
    expect(executeCall?.payload.args[0]).toEqual(
      expect.objectContaining({
        typeInfo: { type: TransactionType.UniswapXCancel, orderHashes: [order.orderHash] },
        initialStatus: TransactionStatus.Cancelling,
      }),
    )
  })

  it('omits tracked registration when the flag is off', async () => {
    ;(getFeatureFlag as Mock).mockReturnValue(false)
    const order = makeOrder(TransactionStatus.Cancelling)

    const { effects } = await expectSaga(attemptCancelTransaction, order, cancelRequest)
      .provide([
        [matchers.select(selectAccounts), accountsState],
        [matchers.call.fn(executeTransaction), { transactionHash: CANCEL_TX_HASH }],
      ])
      .run()

    const executeCall = effects.call.find((effect) => effect.payload.fn === executeTransaction)
    expect(executeCall?.payload.args[0]?.typeInfo).toBeUndefined()
    expect(executeCall?.payload.args[0]?.initialStatus).toBeUndefined()
  })

  it('classifies a user rejection as a quiet revert to the captured pre-cancel status', async () => {
    // Watcher snapshot carries the pre-cancel status: InsufficientFunds must be restored, not Pending
    const order = makeOrder(TransactionStatus.InsufficientFunds)

    await expectSaga(attemptCancelTransaction, order, cancelRequest)
      .provide([
        [matchers.select(selectAccounts), accountsState],
        [matchers.call.fn(executeTransaction), Promise.reject({ code: 4001 })],
      ])
      .put(
        orderCancelFailed({
          address: account.address,
          chainId: order.chainId,
          id: order.id,
          reason: 'rejected',
          revertToStatus: TransactionStatus.InsufficientFunds,
        }),
      )
      .run()
  })

  it('classifies other errors as broadcast failure and never throws into the watcher root', async () => {
    const order = makeOrder(TransactionStatus.Pending)

    // Resolves (never rejects) — a failed cancel must not kill the transaction watcher
    await expectSaga(attemptCancelTransaction, order, cancelRequest)
      .provide([
        [matchers.select(selectAccounts), accountsState],
        [matchers.call.fn(executeTransaction), Promise.reject(new Error('boom'))],
      ])
      .put(
        orderCancelFailed({
          address: account.address,
          chainId: order.chainId,
          id: order.id,
          reason: 'broadcast-failed',
          revertToStatus: TransactionStatus.Pending,
        }),
      )
      .run()
  })

  it('emits the wallet-shared broadcast event when the flag is on, and not when off', async () => {
    const order = makeOrder(TransactionStatus.Cancelling)

    await expectSaga(attemptCancelTransaction, order, cancelRequest)
      .provide([
        [matchers.select(selectAccounts), accountsState],
        [matchers.call.fn(executeTransaction), { transactionHash: CANCEL_TX_HASH }],
      ])
      .run()
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.LimitCancelBroadcast, {
      order_hash: order.orderHash,
      chain_id: order.chainId,
      route: 'wallet-shared',
    })
    ;(sendAnalyticsEvent as Mock).mockClear()
    ;(getFeatureFlag as Mock).mockReturnValue(false)
    await expectSaga(attemptCancelTransaction, order, cancelRequest)
      .provide([
        [matchers.select(selectAccounts), accountsState],
        [matchers.call.fn(executeTransaction), { transactionHash: CANCEL_TX_HASH }],
      ])
      .run()
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('emits the wallet-shared broadcast-failed event with the rejection/failure classification, ungated', async () => {
    ;(getFeatureFlag as Mock).mockReturnValue(false) // ungated on purpose — measures the classification fix
    const order = makeOrder(TransactionStatus.Pending)

    await expectSaga(attemptCancelTransaction, order, cancelRequest)
      .provide([
        [matchers.select(selectAccounts), accountsState],
        [matchers.call.fn(executeTransaction), Promise.reject({ code: 4001 })],
      ])
      .run()
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.LimitCancelBroadcastFailed, {
      order_hash: order.orderHash,
      chain_id: order.chainId,
      reason: 'rejection',
      route: 'wallet-shared',
    })

    await expectSaga(attemptCancelTransaction, order, cancelRequest)
      .provide([
        [matchers.select(selectAccounts), accountsState],
        [matchers.call.fn(executeTransaction), Promise.reject(new Error('boom'))],
      ])
      .run()
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.LimitCancelBroadcastFailed, {
      order_hash: order.orderHash,
      chain_id: order.chainId,
      reason: 'failure',
      route: 'wallet-shared',
    })
  })

  it('does not strand the order without durable handling when the account is missing', async () => {
    const order = makeOrder(TransactionStatus.Pending)

    await expectSaga(attemptCancelTransaction, order, cancelRequest)
      .provide([[matchers.select(selectAccounts), {}]])
      .put(
        orderCancelFailed({
          address: account.address,
          chainId: order.chainId,
          id: order.id,
          reason: 'broadcast-failed',
          revertToStatus: TransactionStatus.Pending,
        }),
      )
      .run()
  })
})
