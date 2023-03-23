import { expectSaga } from 'redux-saga-test-plan'
import { call, delay } from 'redux-saga/effects'
import { getProvider, getProviderManager } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { PollingInterval } from 'src/constants/misc'
import { fetchFiatOnRampTransaction } from 'src/features/fiatOnRamp/api'
import { waitForProvidersInitialized } from 'src/features/providers/providerSaga'
import { attemptCancelTransaction } from 'src/features/transactions/cancelTransaction'
import {
  addTransaction,
  cancelTransaction,
  finalizeTransaction,
  forceFetchFiatOnRampTransactions,
  transactionActions,
  updateTransaction,
} from 'src/features/transactions/slice'
import {
  deleteTransaction,
  getFlashbotsTxConfirmation,
  transactionWatcher,
  waitForReceipt,
  waitForTxnInvalidated,
  watchFiatOnRampTransaction,
  watchFlashbotsTransaction,
  watchTransaction,
} from 'src/features/transactions/transactionWatcherSaga'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'
import {
  fiatOnRampTxDetailsPending,
  finalizedTxAction,
  mockProvider,
  mockProviderManager,
  provider,
  txDetailsPending,
  txReceipt,
} from 'src/test/fixtures'
import { sleep } from 'src/utils/timing'

describe(transactionWatcher, () => {
  it('Triggers watchers successfully', () => {
    return expectSaga(transactionWatcher)
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
        [call(waitForProvidersInitialized), true],
        [call(getProvider, ChainId.Mainnet), mockProvider],
        [call(getProviderManager), mockProviderManager],
      ])
      .fork(watchTransaction, txDetailsPending)
      .dispatch(addTransaction(txDetailsPending))
      .fork(watchTransaction, txDetailsPending)
      .dispatch(updateTransaction(txDetailsPending))
      .fork(watchTransaction, txDetailsPending)
      .silentRun()
  })
})

describe(watchFlashbotsTransaction, () => {
  let dateNowSpy: jest.SpyInstance
  beforeAll(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1400000000000)
  })
  afterAll(() => {
    dateNowSpy?.mockRestore()
  })

  const { chainId, hash } = txDetailsPending

  it('Finalizes successful transactions', () => {
    return expectSaga(watchFlashbotsTransaction, txDetailsPending)
      .withState({ wallet: { flashbotsEnabled: true } })
      .provide([
        [call(getProvider, chainId), provider],
        [call(waitForReceipt, hash, provider), txReceipt],
        [call(getFlashbotsTxConfirmation, hash, chainId), TransactionStatus.Success],
      ])
      .put(finalizeTransaction(finalizedTxAction.payload))
      .silentRun()
  })

  it('Handles failed transactions', () => {
    return expectSaga(watchFlashbotsTransaction, txDetailsPending)
      .withState({ wallet: { flashbotsEnabled: true } })
      .provide([
        [call(getProvider, chainId, true), provider],
        [call(waitForReceipt, hash, provider), txReceipt],
        [call(getFlashbotsTxConfirmation, hash, chainId), TransactionStatus.Failed],
      ])
      .put(
        finalizeTransaction({
          ...finalizedTxAction.payload,
          status: TransactionStatus.Failed,
          receipt: undefined,
        })
      )
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
    return expectSaga(watchTransaction, txDetailsPending)
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
    return expectSaga(watchTransaction, txDetailsPending)
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
    return expectSaga(watchTransaction, txDetailsPending)
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
