import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { getProvider } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { waitForProvidersInitialized } from 'src/features/providers/providerSaga'
import { attemptCancelTransaction } from 'src/features/transactions/cancelTransaction'
import {
  addTransaction,
  cancelTransaction,
  failTransaction,
  finalizeTransaction,
  updateTransaction,
} from 'src/features/transactions/slice'
import {
  transactionWatcher,
  watchTransaction,
} from 'src/features/transactions/transactionWatcherSaga'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'
import { provider, txDetailsPending, txReceipt } from 'src/test/fixtures'
import { sleep } from 'src/utils/timing'

describe(transactionWatcher, () => {
  it('Triggers watchers successfully', () => {
    return expectSaga(transactionWatcher)
      .withState({
        transactions: {
          byChainId: {
            [ChainId.MAINNET]: {
              '0': txDetailsPending,
            },
          },
        },
      })
      .provide([[call(waitForProvidersInitialized), true]])
      .fork(watchTransaction, txDetailsPending)
      .dispatch(addTransaction(txDetailsPending))
      .fork(watchTransaction, txDetailsPending)
      .dispatch(updateTransaction(txDetailsPending))
      .fork(watchTransaction, txDetailsPending)
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
      .put(
        finalizeTransaction({
          chainId,
          id,
          status: TransactionStatus.Success,
          receipt: {
            blockHash: txReceipt.blockHash,
            blockNumber: txReceipt.blockNumber,
            transactionIndex: txReceipt.transactionIndex,
            confirmations: txReceipt.confirmations,
            confirmedTime: 1400000000000,
          },
        })
      )
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
      .dispatch(cancelTransaction({ chainId, id }))
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
      .put(failTransaction({ chainId, id }))
      .silentRun()
  })

  it('Finalizes successful timed out transaction', () => {
    return expectSaga(watchTransaction, oldTx)
      .provide([
        [call(getProvider, chainId), provider],
        [call([provider, provider.getTransactionReceipt], hash), txReceipt],
      ])
      .put(
        finalizeTransaction({
          chainId,
          id,
          status: TransactionStatus.Success,
          receipt: {
            blockHash: txReceipt.blockHash,
            blockNumber: txReceipt.blockNumber,
            transactionIndex: txReceipt.transactionIndex,
            confirmations: txReceipt.confirmations,
            confirmedTime: 1400000000000,
          },
        })
      )
      .silentRun()
  })
})
