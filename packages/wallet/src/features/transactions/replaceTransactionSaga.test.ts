import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import { BigNumber, providers } from 'ethers'
import MockDate from 'mockdate'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { attemptReplaceTransaction } from 'wallet/src/features/transactions/replaceTransactionSaga'
import {
  sendTransaction,
  signAndSendTransaction,
} from 'wallet/src/features/transactions/sendTransactionSaga'
import { addTransaction } from 'wallet/src/features/transactions/slice'
import { TransactionStatus } from 'wallet/src/features/transactions/types'
import * as TxnUtils from 'wallet/src/features/transactions/utils'
import {
  getProvider,
  getProviderManager,
  getSignerManager,
} from 'wallet/src/features/wallet/context'
import { selectAccounts } from 'wallet/src/features/wallet/selectors'
import {
  ACCOUNT,
  ethersTransactionRequest,
  getTxFixtures,
  transactionDetails,
} from 'wallet/src/test/fixtures'
import { provider, providerManager, signerManager } from 'wallet/src/test/mocks'

const NEW_UNIQUE_ID = faker.datatype.uuid()

// Structure with valid request address (to avoid address validation within saga)
const transaction = transactionDetails({
  options: {
    request: ethersTransactionRequest({ from: ACCOUNT.address }),
  },
})

const { txRequest, txResponse, txTypeInfo } = getTxFixtures(transaction)

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
          [ACCOUNT.address]: {
            [transaction.chainId]: {
              [transaction.id]: transaction,
            },
          },
        },
        wallet: {
          accounts: {
            [ACCOUNT.address]: ACCOUNT,
          },
        },
      })
      .provide([
        [selectAccounts, { [transaction.from]: ACCOUNT }],
        [call(getProvider, transaction.chainId), provider],
        [call(getProviderManager), providerManager],
        [call(getSignerManager), signerManager],
        [
          call(
            signAndSendTransaction,
            transaction.options.request,
            ACCOUNT,
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
