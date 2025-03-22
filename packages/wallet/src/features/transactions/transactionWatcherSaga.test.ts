import { faker } from '@faker-js/faker'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call, delay } from 'redux-saga/effects'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  addTransaction,
  cancelTransaction,
  finalizeTransaction,
  forceFetchFiatOnRampTransactions,
  transactionActions,
  updateTransaction,
} from 'uniswap/src/features/transactions/slice'
import { TransactionDetails, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  approveTransactionInfo,
  fiatPurchaseTransactionInfo,
  getTxFixtures,
  transactionDetails,
} from 'uniswap/src/test/fixtures'
import { mockApolloClient } from 'uniswap/src/test/mocks'
import { sleep } from 'utilities/src/time/timing'
import { fetchFORTransaction } from 'wallet/src/features/fiatOnRamp/api'
import { attemptCancelTransaction } from 'wallet/src/features/transactions/cancelTransactionSaga'
import {
  deleteTransaction,
  logTransactionTimeout,
  transactionWatcher,
  waitForBridgeSendCompleted,
  waitForSameNonceFinalized,
  watchFiatOnRampTransaction,
  watchTransaction,
} from 'wallet/src/features/transactions/transactionWatcherSaga'
import { getProvider, getProviderManager } from 'wallet/src/features/wallet/context'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'
import { getTxProvidersMocks } from 'wallet/src/test/mocks'

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

    const hash1 = faker.datatype.uuid()
    const hash2 = faker.datatype.uuid()

    return expectSaga(transactionWatcher, { apolloClient: mockApolloClient })
      .withState({
        transactions: {
          byChainId: {
            [UniverseChainId.Mainnet]: {
              '0': approveTxDetailsPending,
            },
          },
        },
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
        userSettings: { isTestnetModeEnabled: false },
      })
      .provide([
        [call(getProvider, UniverseChainId.Mainnet), mockProvider],
        [call(getProviderManager), mockProviderManager],
      ])
      .fork(watchTransaction, {
        transaction: approveTxDetailsPending,
        apolloClient: mockApolloClient,
      })
      .dispatch(addTransaction({ ...approveTxDetailsPending, hash: hash1 }))
      .fork(watchTransaction, {
        transaction: { ...approveTxDetailsPending, hash: hash1 },
        apolloClient: mockApolloClient,
      })
      .dispatch(updateTransaction({ ...approveTxDetailsPending, hash: hash2 }))
      .fork(watchTransaction, {
        transaction: { ...approveTxDetailsPending, hash: hash2 },
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
        userSettings: { isTestnetModeEnabled: false },
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
        userSettings: { isTestnetModeEnabled: false },
      })
      .provide([
        [call(getProvider, chainId), receiptProvider],
        [call(attemptCancelTransaction, txDetailsPending, cancelRequest), true],
      ])
      .dispatch(cancelTransaction({ chainId, id, address: from, cancelRequest }))
      .call(attemptCancelTransaction, txDetailsPending, cancelRequest)
      .silentRun()
  })

  it('Invalidates stale transaction when another transaction with same nonce is finalized', () => {
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
        userSettings: { isTestnetModeEnabled: false },
      })
      .provide([
        [call(getProvider, chainId), receiptProvider],
        [call(waitForSameNonceFinalized, chainId, id, options.request.nonce), true],
      ])
      .call(deleteTransaction, txDetailsPending)
      .dispatch(transactionActions.deleteTransaction({ address: from, id, chainId }))
      .silentRun()
  })

  it('Invalidates stale transaction when bridge send is confirmed with same nonce', () => {
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
        userSettings: { isTestnetModeEnabled: false },
      })
      .provide([
        [call(getProvider, chainId), receiptProvider],
        [call(waitForBridgeSendCompleted, chainId, id, options.request.nonce), true],
      ])
      .call(deleteTransaction, txDetailsPending)
      .dispatch(transactionActions.deleteTransaction({ address: from, id, chainId }))
      .silentRun()
  })

  it('Logs timeout event without when transaction is pending for too long', () => {
    const receiptProvider = {
      waitForTransaction: jest.fn(async () => {
        await sleep(1000)
        return null
      }),
    }

    const transaction = {
      ...txDetailsPending,
      options: { ...txDetailsPending.options, timeoutTimestampMs: Date.now() },
    }

    return expectSaga(watchTransaction, {
      transaction,
      apolloClient: mockApolloClient,
    })
      .withState({
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
        userSettings: { isTestnetModeEnabled: false },
      })
      .provide([
        [call(getProvider, chainId), receiptProvider],
        [call(logTransactionTimeout, transaction), undefined],
      ])
      .call(logTransactionTimeout, transaction)
      .silentRun()
  })
})

describe(watchFiatOnRampTransaction, () => {
  it('removes transactions on 404 when stale', () => {
    const staleTx = { ...txDetailsPending, status: TransactionStatus.Unknown }
    return (
      expectSaga(watchFiatOnRampTransaction, txDetailsPending)
        .provide([
          [call(fetchFORTransaction, txDetailsPending, false, null), staleTx],
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
        [call(fetchFORTransaction, txDetailsPending, false, null), confirmedTx],
        [matchers.call.fn(sendAnalyticsEvent), undefined],
        [matchers.select(selectActiveAccountAddress), null],
      ])
      .put(transactionActions.upsertFiatOnRampTransaction(confirmedTx))
      .not.call.fn(sleep)
      .run()
  })
})
