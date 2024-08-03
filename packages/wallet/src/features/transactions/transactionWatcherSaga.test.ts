import { faker } from '@faker-js/faker'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call, delay } from 'redux-saga/effects'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { sleep } from 'utilities/src/time/timing'
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
  approveTransactionInfo,
  fiatPurchaseTransactionInfo,
  getTxFixtures,
  transactionDetails,
} from 'wallet/src/test/fixtures'
import { getTxProvidersMocks, mockApolloClient } from 'wallet/src/test/mocks'

const {
  ethersTxReceipt,
  txReceipt,
  finalizedTxAction,
  txDetailsPending: txDetailsPending,
} = getTxFixtures(transactionDetails({ typeInfo: fiatPurchaseTransactionInfo() }))

const { mockProvider, mockProviderManager } = getTxProvidersMocks(ethersTxReceipt)

const ACTIVE_ACCOUNT_ADDRESS = '0x000000000000000000000000000000000000000001'

describe(transactionWatcher, () => {
  it('Triggers watchers successfully', () => {
    const approveTxDetailsPending = transactionDetails({
      typeInfo: approveTransactionInfo(),
      status: TransactionStatus.Pending,
      hash: faker.datatype.uuid(),
      from: ACTIVE_ACCOUNT_ADDRESS,
    })

    return expectSaga(transactionWatcher, { apolloClient: mockApolloClient })
      .withState({
        behaviorHistory: {
          extensionBetaFeedbackState: undefined,
        },
        transactions: {
          byChainId: {
            [UniverseChainId.Mainnet]: {
              '0': approveTxDetailsPending,
            },
          },
        },
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
      })
      .provide([
        [call(getProvider, UniverseChainId.Mainnet), mockProvider],
        [call(getProviderManager), mockProviderManager],
      ])
      .fork(watchTransaction, {
        transaction: approveTxDetailsPending,
        apolloClient: mockApolloClient,
      })
      .dispatch(addTransaction(approveTxDetailsPending))
      .fork(watchTransaction, {
        transaction: approveTxDetailsPending,
        apolloClient: mockApolloClient,
      })
      .dispatch(updateTransaction(approveTxDetailsPending))
      .fork(watchTransaction, {
        transaction: approveTxDetailsPending,
        apolloClient: mockApolloClient,
      })
      .silentRun()
  })
})

describe(watchTransaction, () => {
  let dateNowSpy: jest.SpyInstance
  beforeAll(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => txReceipt.confirmedTime)
  })
  afterAll(() => {
    dateNowSpy?.mockRestore()
  })

  const { chainId, id, from, options } = txDetailsPending

  it('Finalizes successful transaction', () => {
    const receiptProvider = {
      waitForTransaction: jest.fn(() => ethersTxReceipt),
    }
    return expectSaga(watchTransaction, {
      transaction: txDetailsPending,
      apolloClient: mockApolloClient,
    })
      .withState({
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
      })
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
    return expectSaga(watchTransaction, {
      transaction: txDetailsPending,
      apolloClient: mockApolloClient,
    })
      .withState({
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
      })
      .provide([
        [call(getProvider, chainId), receiptProvider],
        [call(attemptCancelTransaction, txDetailsPending, cancelRequest), true],
      ])
      .dispatch(cancelTransaction({ chainId, id, address: from, cancelRequest }))
      .call(attemptCancelTransaction, txDetailsPending, cancelRequest)
      .silentRun()
  })

  it('Invalidates stale transaction', () => {
    const receiptProvider = {
      waitForTransaction: jest.fn(async () => {
        await sleep(1000)
        return null
      }),
    }

    return expectSaga(watchTransaction, {
      transaction: txDetailsPending,
      apolloClient: mockApolloClient,
    })
      .withState({
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
      })
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
    const staleTx = { ...txDetailsPending, status: TransactionStatus.Unknown }
    return (
      expectSaga(watchFiatOnRampTransaction, txDetailsPending)
        .provide([
          [call(fetchFiatOnRampTransaction, txDetailsPending, false), staleTx],
          [matchers.call.fn(sendAnalyticsEvent), undefined],
        ])
        .put(
          transactionActions.deleteTransaction({
            address: staleTx.from,
            id: staleTx.id,
            chainId: staleTx.chainId,
          }),
        )
        // watcher should stop tracking
        .not.call.fn(sleep)
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
          [delay(PollingInterval.Fast), Promise.resolve(() => undefined)],
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
    const confirmedTx = { ...txDetailsPending, status: TransactionStatus.Success }
    return expectSaga(watchFiatOnRampTransaction, txDetailsPending)
      .provide([
        [call(fetchFiatOnRampTransaction, txDetailsPending, false), confirmedTx],
        [matchers.call.fn(sendAnalyticsEvent), undefined],
      ])
      .put(transactionActions.upsertFiatOnRampTransaction(confirmedTx))
      .not.call.fn(sleep)
      .run()
  })
})
