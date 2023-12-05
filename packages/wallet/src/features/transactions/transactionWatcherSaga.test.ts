import { expectSaga } from 'redux-saga-test-plan'
import { call, delay } from 'redux-saga/effects'
import { sleep } from 'utilities/src/time/timing'
import { ChainId } from 'wallet/src/constants/chains'
import { PollingInterval } from 'wallet/src/constants/misc'
import { fetchFiatOnRampTransaction } from 'wallet/src/features/fiatOnRamp/api'
import { attemptCancelTransaction } from 'wallet/src/features/transactions/cancelTransactionSaga'
import {
  addTransaction,
  cancelTransaction,
  finalizeTransaction,
  forceFetchFiatOnRampTransactions,
  transactionActions,
  updateTransaction,
} from 'wallet/src/features/transactions/slice'
import {
  deleteTransaction,
  transactionWatcher,
  waitForTxnInvalidated,
  watchFiatOnRampTransaction,
  watchTransaction,
} from 'wallet/src/features/transactions/transactionWatcherSaga'
import { TransactionDetails, TransactionStatus } from 'wallet/src/features/transactions/types'
import { getProvider, getProviderManager } from 'wallet/src/features/wallet/context'
import {
  fiatOnRampTxDetailsPending,
  finalizedTxAction,
  mockProvider,
  mockProviderManager,
  txDetailsPending,
  txReceipt,
} from 'wallet/src/test/fixtures'

describe(transactionWatcher, () => {
  it('Triggers watchers successfully', () => {
    return expectSaga(transactionWatcher, { apolloClient: null })
      .withState({
        transactions: {
          byChainId: {
            [ChainId.Mainnet]: {
              '0': txDetailsPending,
            },
          },
        },
      })
      .provide([
        [call(getProvider, ChainId.Mainnet), mockProvider],
        [call(getProviderManager), mockProviderManager],
      ])
      .fork(watchTransaction, { transaction: txDetailsPending, apolloClient: null })
      .dispatch(addTransaction(txDetailsPending))
      .fork(watchTransaction, { transaction: txDetailsPending, apolloClient: null })
      .dispatch(updateTransaction(txDetailsPending))
      .fork(watchTransaction, { transaction: txDetailsPending, apolloClient: null })
      .silentRun()
  })
})

describe(watchTransaction, () => {
  let dateNowSpy: jest.SpyInstance
  beforeAll(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1400000000000)
  })
  afterAll(() => {
    dateNowSpy?.mockRestore()
  })

  const { chainId, id, from, options } = txDetailsPending

  it('Finalizes successful transaction', () => {
    const receiptProvider = {
      waitForTransaction: jest.fn(() => txReceipt),
    }
    return expectSaga(watchTransaction, { transaction: txDetailsPending, apolloClient: null })
      .provide([[call(getProvider, chainId), receiptProvider]])
      .put(finalizeTransaction(finalizedTxAction.payload))
      .silentRun()
  })

  it('Cancels transaction', () => {
    const receiptProvider = {
      waitForTransaction: jest.fn(async () => {
        await sleep(1000)
        return null
      }),
    }
    const cancelRequest = { to: from, from, value: '0x0' }
    return expectSaga(watchTransaction, { transaction: txDetailsPending, apolloClient: null })
      .provide([
        [call(getProvider, chainId), receiptProvider],
        [call(attemptCancelTransaction, txDetailsPending), true],
      ])
      .dispatch(cancelTransaction({ chainId, id, address: from, cancelRequest }))
      .call(attemptCancelTransaction, txDetailsPending)
      .silentRun()
  })

  it('Invalidates stale transaction', () => {
    const receiptProvider = {
      waitForTransaction: jest.fn(async () => {
        await sleep(1000)
        return null
      }),
    }
    return expectSaga(watchTransaction, { transaction: txDetailsPending, apolloClient: null })
      .provide([
        [call(getProvider, chainId), receiptProvider],
        [call(waitForTxnInvalidated, chainId, id, options.request.nonce), true],
      ])
      .call(deleteTransaction, txDetailsPending)
      .dispatch(transactionActions.deleteTransaction({ address: from, id, chainId }))
      .silentRun()
  })
})

describe(watchFiatOnRampTransaction, () => {
  it('removes transactions on 404 when stale', () => {
    const staleTx = { ...fiatOnRampTxDetailsPending, status: TransactionStatus.Unknown }
    return (
      expectSaga(watchFiatOnRampTransaction, fiatOnRampTxDetailsPending)
        .provide([[call(fetchFiatOnRampTransaction, fiatOnRampTxDetailsPending), staleTx]])
        .put(transactionActions.upsertFiatOnRampTransaction(staleTx))
        // watcher should stop tracking
        .not.call.fn(sleep)
        .silentRun()
    )
  })

  it('keeps a transaction on 404 when not yet stale', () => {
    const tx = { ...fiatOnRampTxDetailsPending, addedTime: Date.now() }
    const confirmedTx = { ...tx, status: TransactionStatus.Success }

    let fetchCalledCount = 0

    return (
      expectSaga(watchFiatOnRampTransaction, tx)
        .provide([
          {
            call(effect): TransactionDetails | undefined {
              if (effect.fn === fetchFiatOnRampTransaction) {
                switch (fetchCalledCount++) {
                  case 0:
                  case 1:
                    // return same tx twice, but upsert should only be called once
                    return tx
                  case 2:
                    return confirmedTx
                }
              }
            },
          },
          [delay(PollingInterval.Normal), Promise.resolve(() => undefined)],
        ])
        .delay(PollingInterval.Normal)
        // only called once
        .put(transactionActions.upsertFiatOnRampTransaction(confirmedTx))
        .silentRun()
    )
  })

  it('keeps a transaction on 404 when not yet stale, when fetch is forced', () => {
    const tx = { ...fiatOnRampTxDetailsPending, addedTime: Date.now() }
    const confirmedTx = { ...tx, status: TransactionStatus.Success }

    let fetchCalledCount = 0

    return (
      expectSaga(watchFiatOnRampTransaction, tx)
        .provide([
          {
            call(effect): TransactionDetails | undefined {
              if (effect.fn === fetchFiatOnRampTransaction) {
                switch (fetchCalledCount++) {
                  case 0:
                  case 1:
                    // return same tx twice, but upsert should only be called once
                    return tx
                  case 2:
                    return confirmedTx
                }
              }
            },
          },
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
    const confirmedTx = { ...fiatOnRampTxDetailsPending, status: TransactionStatus.Success }
    return expectSaga(watchFiatOnRampTransaction, fiatOnRampTxDetailsPending)
      .provide([[call(fetchFiatOnRampTransaction, fiatOnRampTxDetailsPending), confirmedTx]])
      .put(transactionActions.upsertFiatOnRampTransaction(confirmedTx))
      .not.call.fn(sleep)
      .run()
  })
})
