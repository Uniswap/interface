import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import { BigNumber, providers } from 'ethers'
import MockDate from 'mockdate'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { getProvider, getProviderManager, getSignerManager } from 'src/app/walletContext'
import { attemptReplaceTransaction } from 'src/features/transactions/replaceTransaction'
import { sendTransaction, signAndSendTransaction } from 'src/features/transactions/sendTransaction'
import { addTransaction } from 'src/features/transactions/slice'
import { TransactionStatus } from 'src/features/transactions/types'
import * as TxnUtils from 'src/features/transactions/utils'
import { selectAccounts } from 'src/features/wallet/selectors'
import {
  account,
  provider,
  providerManager,
  signerManager,
  txDetailsPending,
  txRequest,
  txResponse,
  txTypeInfo,
} from 'src/test/fixtures'

const NEW_UNIQUE_ID = faker.datatype.uuid()

// Structure with valid request address (to avoid address validation within saga)
const transaction = {
  ...txDetailsPending,
  options: {
    ...txDetailsPending.options,
    request: {
      ...txDetailsPending.options.request,
      from: account.address,
    },
  },
}

const present = dayjs('2022-02-01')

describe(sendTransaction, () => {
  let txnUtilSpy: jest.SpyInstance

  beforeAll(() => {
    // Mock uuid for new txns
    txnUtilSpy = jest.spyOn(TxnUtils, 'createTransactionId').mockReturnValue(NEW_UNIQUE_ID)
    MockDate.reset()
  })

  afterAll(() => {
    // Restore ID generation
    txnUtilSpy.mockRestore()
  })

  it('Replaces valid transaction successfully', () => {
    MockDate.set(present.valueOf())

    return expectSaga(attemptReplaceTransaction, transaction, transaction.options.request, false)
      .withState({
        transactions: {
          [account.address]: {
            [transaction.chainId]: {
              [transaction.id]: transaction,
            },
          },
        },
        wallet: {
          accounts: {
            [account.address]: account,
          },
        },
      })
      .provide([
        [selectAccounts, { [transaction.from]: account }],
        [call(getProvider, transaction.chainId), provider],
        [call(getProviderManager), providerManager],
        [call(getSignerManager), signerManager],
        [
          call(
            signAndSendTransaction,
            transaction.options.request,
            account,
            provider as providers.Provider,
            signerManager
          ),
          { transactionResponse: txResponse, populatedRequest: txRequest },
        ],
      ])
      .put(
        addTransaction({
          chainId: transaction.chainId,
          id: NEW_UNIQUE_ID,
          hash: txResponse.hash,
          typeInfo: txTypeInfo,
          receipt: undefined,
          from: transaction.from,
          status: TransactionStatus.Pending,
          addedTime: Date.now(),
          options: {
            request: {
              chainId: transaction.chainId,
              to: txRequest.to,
              from: txRequest.from,
              data: txRequest.data,
              value: txRequest.value,
              nonce: BigNumber.from(txRequest.nonce).toString(),
              type: undefined,
              gasLimit: undefined,
              gasPrice: txRequest.gasPrice?.toString(),
              maxPriorityFeePerGas: undefined,
              maxFeePerGas: undefined,
            },
          },
        })
      )
      .silentRun()
  })
})
