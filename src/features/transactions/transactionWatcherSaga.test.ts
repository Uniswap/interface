import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { getProvider, getProviderManager } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { waitForProvidersInitialized } from 'src/features/providers/providerSaga'
import { attemptCancelTransaction } from 'src/features/transactions/cancelTransaction'
import {
  addTransaction,
  cancelTransaction,
  finalizeTransaction,
  updateTransaction,
} from 'src/features/transactions/slice'
import {
  getFlashbotsTxConfirmation,
  transactionWatcher,
  waitForReceipt,
  watchFlashbotsTransaction,
  watchTransaction,
} from 'src/features/transactions/transactionWatcherSaga'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'
import {
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
  let dateNowSpy: any
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
  let dateNowSpy: any
  beforeAll(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1400000000000)
  })
  afterAll(() => {
    dateNowSpy?.mockRestore()
  })

  const { chainId, id, hash, from } = txDetailsPending
  const oldTx: TransactionDetails = {
    ...txDetailsPending,
    addedTime: 1300000000000,
  }

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
    return expectSaga(watchTransaction, txDetailsPending)
      .provide([
        [call(getProvider, chainId), receiptProvider],
        [call(attemptCancelTransaction, txDetailsPending), true],
      ])
      .dispatch(cancelTransaction({ chainId, id, address: from }))
      .call(attemptCancelTransaction, txDetailsPending)
      .silentRun()
  })

  it('Cancels timed out transaction', () => {
    return expectSaga(watchTransaction, oldTx)
      .provide([
        [call(getProvider, chainId), provider],
        [call([provider, provider.getTransactionReceipt], hash), null],
        [call([provider, provider.getTransactionCount], from, 'pending'), 0],
      ])
      .put(
        finalizeTransaction({
          ...finalizedTxAction.payload,
          status: TransactionStatus.Failed,
          receipt: undefined,
          addedTime: oldTx.addedTime,
        })
      )
      .silentRun()
  })

  it('Finalizes successful timed out transaction', () => {
    return expectSaga(watchTransaction, oldTx)
      .provide([[call(getProvider, chainId), mockProvider]])
      .put(finalizeTransaction({ ...finalizedTxAction.payload, addedTime: oldTx.addedTime }))
      .silentRun()
  })
})
