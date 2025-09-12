import { call, delay } from 'redux-saga/effects'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { forceFetchFiatOnRampTransactions, transactionActions } from 'uniswap/src/features/transactions/slice'
import { TransactionDetails, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  fiatPurchaseTransactionInfo,
  getTxFixtures,
  transactionDetails as txDetailsFixture,
} from 'uniswap/src/test/fixtures'
import { fetchFORTransaction } from 'wallet/src/features/fiatOnRamp/api'
import { watchFiatOnRampTransaction } from 'wallet/src/features/transactions/watcher/watchFiatOnRampSaga'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'

const { txDetailsPending: originalTxDetailsPending } = getTxFixtures(
  txDetailsFixture({ typeInfo: fiatPurchaseTransactionInfo() }),
)

const ACTIVE_ACCOUNT_ADDRESS = '0x000000000000000000000000000000000000000001'
const txDetailsPending = { ...originalTxDetailsPending, from: ACTIVE_ACCOUNT_ADDRESS }

describe(watchFiatOnRampTransaction, () => {
  it('removes transactions on 404 when stale', () => {
    const staleTx = { ...txDetailsPending, status: TransactionStatus.Unknown }
    return (
      expectSaga(watchFiatOnRampTransaction, txDetailsPending)
        .provide([
          [
            call(fetchFORTransaction, {
              previousTransactionDetails: txDetailsPending,
              forceFetch: false,
              activeAccountAddress: null,
            }),
            staleTx,
          ],
          [matchers.call.fn(sendAnalyticsEvent), undefined],
          [matchers.select(selectActiveAccountAddress), null],
        ])
        .put(
          transactionActions.deleteTransaction({
            address: staleTx.from,
            id: staleTx.id,
            chainId: staleTx.chainId,
          }),
        )
        // watcher should stop tracking
        .not.call.fn(delay) // Changed from sleep to delay, as sleep is not used directly here
        .silentRun()
    )
  })

  it('keeps a transaction on 404 when not yet stale', () => {
    const tx = { ...txDetailsPending, addedTime: Date.now() }
    const confirmedTx = { ...tx, status: TransactionStatus.Success }

    let fetchCalledCount = 0

    return (
      expectSaga(watchFiatOnRampTransaction, tx)
        .provide([
          {
            call(effect): TransactionDetails | undefined {
              if (effect.fn === fetchFORTransaction) {
                switch (fetchCalledCount++) {
                  case 0:
                  case 1:
                    // return same tx twice, but upsert should only be called once
                    return tx
                  case 2:
                    return confirmedTx
                }
              }
              return undefined
            },
          },
          [delay(PollingInterval.Fast), Promise.resolve(() => undefined)],
          [matchers.select(selectActiveAccountAddress), null],
        ])
        .delay(PollingInterval.Fast)
        // only called once
        .put(transactionActions.upsertFiatOnRampTransaction(confirmedTx))
        .silentRun()
    )
  })

  it('keeps a transaction on 404 when not yet stale, when fetch is forced', () => {
    const tx = { ...txDetailsPending, addedTime: Date.now() }
    const confirmedTx = { ...tx, status: TransactionStatus.Success }

    let fetchCalledCount = 0

    return (
      expectSaga(watchFiatOnRampTransaction, tx)
        .provide([
          {
            call(effect): TransactionDetails | undefined {
              if (effect.fn === fetchFORTransaction) {
                switch (fetchCalledCount++) {
                  case 0:
                  case 1:
                    // return same tx twice, but upsert should only be called once
                    return tx
                  case 2:
                    return confirmedTx
                }
              }
              return undefined
            },
          },
          [matchers.select(selectActiveAccountAddress), null],
        ])
        .dispatch(forceFetchFiatOnRampTransactions())
        .dispatch(forceFetchFiatOnRampTransactions())
        .dispatch(forceFetchFiatOnRampTransactions())
        // only called once
        .put(transactionActions.upsertFiatOnRampTransaction(confirmedTx))
        .silentRun()
    )
  })

  it('updates a transactions on success network request', () => {
    const confirmedTx = { ...txDetailsPending, status: TransactionStatus.Success }
    return expectSaga(watchFiatOnRampTransaction, txDetailsPending)
      .provide([
        [
          call(fetchFORTransaction, {
            previousTransactionDetails: txDetailsPending,
            forceFetch: false,
            activeAccountAddress: null,
          }),
          confirmedTx,
        ],
        [matchers.call.fn(sendAnalyticsEvent), undefined],
        [matchers.select(selectActiveAccountAddress), null],
      ])
      .put(transactionActions.upsertFiatOnRampTransaction(confirmedTx))
      .not.call.fn(delay) // Changed from sleep to delay
      .run()
  })
})
