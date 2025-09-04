import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import { BigNumber, providers } from 'ethers'
import MockDate from 'mockdate'
import { call } from 'redux-saga/effects'
import { expectSaga } from 'redux-saga-test-plan'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import {
  ClassicTransactionDetails,
  TransactionOriginType,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ethersTransactionRequest, getTxFixtures, transactionDetails } from 'uniswap/src/test/fixtures'
import * as CreateTransactionId from 'uniswap/src/utils/createTransactionId'
import { executeTransaction } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { signAndSubmitTransaction } from 'wallet/src/features/transactions/executeTransaction/signAndSubmitTransaction'
import { attemptReplaceTransaction } from 'wallet/src/features/transactions/replaceTransactionSaga'
import { getProvider, getProviderManager, getSignerManager } from 'wallet/src/features/wallet/context'
import { selectAccounts } from 'wallet/src/features/wallet/selectors'
import { ACCOUNT } from 'wallet/src/test/fixtures'
import { provider, providerManager, signerManager } from 'wallet/src/test/mocks'

const NEW_UNIQUE_ID = faker.datatype.uuid()

// Structure with valid request address (to avoid address validation within saga)
const transaction: ClassicTransactionDetails = transactionDetails({
  options: {
    request: ethersTransactionRequest({ from: ACCOUNT.address }),
  },
})

const { txRequest, txResponse, txTypeInfo } = getTxFixtures(transaction)

const present = dayjs('2022-02-01')

describe(executeTransaction, () => {
  let txnUtilSpy: jest.SpyInstance

  beforeAll(() => {
    // Mock uuid for new txns
    txnUtilSpy = jest.spyOn(CreateTransactionId, 'createTransactionId').mockReturnValue(NEW_UNIQUE_ID)
    MockDate.reset()
  })

  afterAll(() => {
    // Restore ID generation
    txnUtilSpy.mockRestore()
  })

  it('Replaces valid transaction successfully', () => {
    MockDate.set(present.valueOf())

    return expectSaga(attemptReplaceTransaction, {
      transaction,
      newTxRequest: transaction.options.request,
      isCancellation: false,
    })
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
          call(signAndSubmitTransaction, {
            request: transaction.options.request,
            account: ACCOUNT,
            provider: provider as providers.Provider,
            signerManager,
            isCancellation: false,
          }),
          { transactionResponse: txResponse, populatedRequest: txRequest },
        ],
        [
          call(sendAnalyticsEvent, WalletEventName.CancelSubmitted, {
            original_transaction_hash: transaction.hash,
            replacement_transaction_hash: txResponse.hash,
            chain_id: transaction.chainId,
            nonce: txResponse.nonce,
          }),
          undefined,
        ],
      ])
      .put(
        addTransaction({
          routing: Routing.CLASSIC,
          chainId: transaction.chainId,
          id: NEW_UNIQUE_ID,
          hash: txResponse.hash,
          typeInfo: txTypeInfo,
          receipt: undefined,
          from: transaction.from,
          status: TransactionStatus.Pending,
          addedTime: Date.now(),
          transactionOriginType: TransactionOriginType.Internal,
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
            replacedTransactionHash: transaction.hash,
          },
        }),
      )
      .silentRun()
  })

  it('Correctly logs CancelSubmitted event and sets status to Cancelling when isCancellation is true', () => {
    MockDate.set(present.valueOf())

    const transactionToCancel: ClassicTransactionDetails = transactionDetails({
      hash: faker.datatype.hexadecimal({ length: 64 }),
      from: ACCOUNT.address,
      chainId: 1,
      options: {
        request: ethersTransactionRequest({
          from: ACCOUNT.address,
          nonce: 1,
          chainId: 1,
        }),
      },
    })

    const mockPopulatedRequest = transactionToCancel.options.request

    const mockTxResponse: providers.TransactionResponse = {
      hash: faker.datatype.hexadecimal({ length: 64 }),
      confirmations: 0,
      from: transactionToCancel.from,
      nonce: BigNumber.from(mockPopulatedRequest.nonce).toNumber(),
      gasLimit: BigNumber.from(mockPopulatedRequest.gasLimit || 0),
      gasPrice: BigNumber.from(mockPopulatedRequest.gasPrice),
      data: '0x0',
      value: mockPopulatedRequest.value ? BigNumber.from(mockPopulatedRequest.value) : BigNumber.from(0),
      chainId: transactionToCancel.chainId,
      wait: jest.fn().mockResolvedValue({} as providers.TransactionReceipt),
    }

    // Construct the expected serializable request based on mockPopulatedRequest
    const expectedSerializableRequest = {
      chainId: transactionToCancel.chainId,
      to: mockPopulatedRequest.to,
      from: mockPopulatedRequest.from,
      data: mockPopulatedRequest.data,
      value: mockPopulatedRequest.value,
      nonce: BigNumber.from(mockPopulatedRequest.nonce).toString(),
      type: mockPopulatedRequest.type,
      gasLimit: mockPopulatedRequest.gasLimit,
      gasPrice: mockPopulatedRequest.gasPrice?.toString(),
      maxPriorityFeePerGas: mockPopulatedRequest.maxPriorityFeePerGas?.toString(),
      maxFeePerGas: mockPopulatedRequest.maxFeePerGas?.toString(),
    }

    return expectSaga(attemptReplaceTransaction, {
      transaction: transactionToCancel,
      newTxRequest: transactionToCancel.options.request,
      isCancellation: true,
    })
      .withState({
        transactions: {
          [ACCOUNT.address]: {
            [transactionToCancel.chainId]: {
              [transactionToCancel.id]: transactionToCancel,
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
        [selectAccounts, { [transactionToCancel.from]: ACCOUNT }],
        [call(getProvider, transactionToCancel.chainId), provider],
        [call(getProviderManager), providerManager],
        [call(getSignerManager), signerManager],
        [
          call(signAndSubmitTransaction, {
            request: mockPopulatedRequest,
            account: ACCOUNT,
            provider: provider as providers.Provider,
            signerManager,
            isCancellation: true,
          }),
          { transactionResponse: mockTxResponse, populatedRequest: mockPopulatedRequest },
        ],
        [
          call(sendAnalyticsEvent, WalletEventName.CancelSubmitted, {
            original_transaction_hash: transactionToCancel.hash,
            replacement_transaction_hash: mockTxResponse.hash,
            chain_id: transactionToCancel.chainId,
            nonce: mockTxResponse.nonce,
          }),
          undefined,
        ],
      ])
      .put(
        addTransaction({
          ...transactionToCancel,
          id: NEW_UNIQUE_ID,
          hash: mockTxResponse.hash,
          status: TransactionStatus.Cancelling,
          receipt: undefined,
          addedTime: present.valueOf(),
          options: {
            ...transactionToCancel.options,
            request: expectedSerializableRequest,
            replacedTransactionHash: transactionToCancel.hash,
          },
        }),
      )
      .silentRun()
  })
})
