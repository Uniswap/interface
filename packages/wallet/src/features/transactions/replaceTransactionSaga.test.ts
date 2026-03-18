import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import { BigNumber } from 'ethers'
import MockDate from 'mockdate'
import { call } from 'redux-saga/effects'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { addTransaction, deleteTransaction } from 'uniswap/src/features/transactions/slice'
import {
  ClassicTransactionDetails,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { ethersTransactionRequest, getTxFixtures, transactionDetails } from 'uniswap/src/test/fixtures'
import * as CreateTransactionId from 'uniswap/src/utils/createTransactionId'
import { executeTransaction } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { attemptReplaceTransaction } from 'wallet/src/features/transactions/replaceTransactionSaga'

import { selectAccounts } from 'wallet/src/features/wallet/selectors'
import { ACCOUNT } from 'wallet/src/test/fixtures'

const NEW_UNIQUE_ID = faker.datatype.uuid()

// Structure with valid request address (to avoid address validation within saga)
const baseTransaction: ClassicTransactionDetails = transactionDetails({
  chainId: 42220, // Use consistent chainId for tests
  options: {
    request: ethersTransactionRequest({
      from: ACCOUNT.address,
      nonce: 5,
      gasPrice: BigNumber.from('20000000000'),
      gasLimit: BigNumber.from('21000'),
    }),
  },
})

const present = dayjs('2022-02-01')

describe('attemptReplaceTransaction', () => {
  let txnUtilSpy: jest.SpyInstance

  beforeAll(() => {
    // Mock uuid for new txns
    txnUtilSpy = jest.spyOn(CreateTransactionId, 'createTransactionId').mockReturnValue(NEW_UNIQUE_ID)
    MockDate.reset()
  })

  beforeEach(() => {
    // Clear mocks between tests
    jest.clearAllMocks()
  })

  afterAll(() => {
    // Restore ID generation
    txnUtilSpy.mockRestore()
  })

  describe('successful replacement scenarios', () => {
    it('should successfully replace a transaction with Pending status', () => {
      MockDate.set(present.valueOf())

      const newTxRequest = ethersTransactionRequest({
        to: '0x1234567890123456789012345678901234567890',
        value: BigNumber.from('1000000000000000000'),
        gasPrice: BigNumber.from('25000000000'),
      })

      const { txResponse } = getTxFixtures(baseTransaction)

      return expectSaga(attemptReplaceTransaction, {
        transaction: baseTransaction,
        newTxRequest,
        isCancellation: false,
      })
        .withState({
          transactions: {
            [ACCOUNT.address]: {
              [baseTransaction.chainId]: {
                [baseTransaction.id]: baseTransaction,
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
          [selectAccounts, { [baseTransaction.from]: ACCOUNT }],
          [matchers.call.fn(executeTransaction), { transactionHash: txResponse.hash }],
        ])
        .put.like({
          action: {
            type: addTransaction.type,
            payload: {
              id: NEW_UNIQUE_ID,
              chainId: baseTransaction.chainId,
              hash: txResponse.hash,
              status: TransactionStatus.Pending,
              receipt: undefined,
            },
          },
        })
        .not.call(sendAnalyticsEvent, WalletEventName.CancelSubmitted, {
          original_transaction_hash: baseTransaction.hash,
          replacement_transaction_hash: txResponse.hash,
          chain_id: baseTransaction.chainId,
          nonce: baseTransaction.options.request.nonce,
        })
        .silentRun()
    })

    it('should successfully cancel a transaction with Cancelling status and send analytics', () => {
      MockDate.set(present.valueOf())

      const transactionToCancel = transactionDetails({
        hash: faker.datatype.hexadecimal({ length: 64 }),
        from: ACCOUNT.address,
        chainId: 1,
        options: {
          request: ethersTransactionRequest({
            from: ACCOUNT.address,
            nonce: 3,
            chainId: 1,
            gasPrice: BigNumber.from('20000000000'),
          }),
        },
      })

      const cancellationRequest = ethersTransactionRequest({
        to: ACCOUNT.address, // Send to self for cancellation
        value: BigNumber.from('0'),
        gasPrice: BigNumber.from('30000000000'), // Higher gas price
      })

      const mockTxHash = faker.datatype.hexadecimal({ length: 64 })

      return expectSaga(attemptReplaceTransaction, {
        transaction: transactionToCancel,
        newTxRequest: cancellationRequest,
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
          [matchers.call.fn(executeTransaction), { transactionHash: mockTxHash }],
          [
            call(sendAnalyticsEvent, WalletEventName.CancelSubmitted, {
              original_transaction_hash: transactionToCancel.hash,
              replacement_transaction_hash: mockTxHash,
              chain_id: transactionToCancel.chainId,
              nonce: transactionToCancel.options.request.nonce,
            }),
            undefined,
          ],
        ])
        .call(sendAnalyticsEvent, WalletEventName.CancelSubmitted, {
          original_transaction_hash: transactionToCancel.hash,
          replacement_transaction_hash: mockTxHash,
          chain_id: transactionToCancel.chainId,
          nonce: transactionToCancel.options.request.nonce,
        })
        .put.like({
          action: {
            type: addTransaction.type,
            payload: {
              id: NEW_UNIQUE_ID,
              chainId: transactionToCancel.chainId,
              hash: mockTxHash,
              status: TransactionStatus.Cancelling,
              receipt: undefined,
            },
          },
        })
        .silentRun()
    })
  })

  describe('error scenarios', () => {
    it('should throw error for transaction with missing nonce or invalid from address', () => {
      const invalidTransaction = transactionDetails({
        options: {
          request: ethersTransactionRequest({
            from: 'invalid-address',
            // Missing nonce
          }),
        },
      })

      const newTxRequest = ethersTransactionRequest({
        to: '0x1234567890123456789012345678901234567890',
        value: BigNumber.from('1000000000000000000'),
      })

      return expectSaga(attemptReplaceTransaction, {
        transaction: invalidTransaction,
        newTxRequest,
        isCancellation: false,
      })
        .withState({
          wallet: {
            accounts: {
              [ACCOUNT.address]: ACCOUNT,
            },
          },
        })
        .provide([[selectAccounts, { [invalidTransaction.from]: ACCOUNT }]])
        .put(
          deleteTransaction({
            address: invalidTransaction.from,
            id: NEW_UNIQUE_ID,
            chainId: invalidTransaction.chainId,
          }),
        )
        .put(
          pushNotification({
            type: AppNotificationType.Error,
            address: invalidTransaction.from,
            errorMessage: i18n.t('transaction.notification.error.replace'),
          }),
        )
        .not.call(executeTransaction)
        .silentRun()
    })

    it('should throw error when account is missing', () => {
      const newTxRequest = ethersTransactionRequest({
        to: '0x1234567890123456789012345678901234567890',
        value: BigNumber.from('1000000000000000000'),
      })

      return expectSaga(attemptReplaceTransaction, {
        transaction: baseTransaction,
        newTxRequest,
        isCancellation: false,
      })
        .withState({
          wallet: {
            accounts: {
              // Missing account
            },
          },
        })
        .provide([
          [selectAccounts, {}], // No accounts
        ])
        .put(
          deleteTransaction({
            address: baseTransaction.from,
            id: NEW_UNIQUE_ID,
            chainId: baseTransaction.chainId,
          }),
        )
        .put(
          pushNotification({
            type: AppNotificationType.Error,
            address: baseTransaction.from,
            errorMessage: i18n.t('transaction.notification.error.replace'),
          }),
        )
        .not.call(executeTransaction)
        .silentRun()
    })

    it('should throw error when account is not a signer account', () => {
      const nonSignerAccount = {
        ...ACCOUNT,
        type: AccountType.Readonly,
      }

      const newTxRequest = ethersTransactionRequest({
        to: '0x1234567890123456789012345678901234567890',
        value: BigNumber.from('1000000000000000000'),
      })

      return expectSaga(attemptReplaceTransaction, {
        transaction: baseTransaction,
        newTxRequest,
        isCancellation: false,
      })
        .withState({
          wallet: {
            accounts: {
              [ACCOUNT.address]: nonSignerAccount,
            },
          },
        })
        .provide([[selectAccounts, { [baseTransaction.from]: nonSignerAccount }]])
        .put(
          deleteTransaction({
            address: baseTransaction.from,
            id: NEW_UNIQUE_ID,
            chainId: baseTransaction.chainId,
          }),
        )
        .put(
          pushNotification({
            type: AppNotificationType.Error,
            address: baseTransaction.from,
            errorMessage: i18n.t('transaction.notification.error.replace'),
          }),
        )
        .not.call(executeTransaction)
        .silentRun()
    })

    it('should handle executeTransaction failure and show cancellation error message', () => {
      const transactionToCancel = transactionDetails({
        hash: faker.datatype.hexadecimal({ length: 64 }),
        from: ACCOUNT.address,
        chainId: 1,
        options: {
          request: ethersTransactionRequest({
            from: ACCOUNT.address,
            nonce: 3,
            chainId: 1,
          }),
        },
      })

      const cancellationRequest = ethersTransactionRequest({
        to: ACCOUNT.address,
        value: BigNumber.from('0'),
        gasPrice: BigNumber.from('30000000000'),
      })

      return expectSaga(attemptReplaceTransaction, {
        transaction: transactionToCancel,
        newTxRequest: cancellationRequest,
        isCancellation: true,
      })
        .withState({
          wallet: {
            accounts: {
              [ACCOUNT.address]: ACCOUNT,
            },
          },
        })
        .provide([
          [selectAccounts, { [transactionToCancel.from]: ACCOUNT }],
          [matchers.call.fn(executeTransaction), throwError(new Error('Execution failed'))],
        ])
        .put(
          deleteTransaction({
            address: transactionToCancel.from,
            id: NEW_UNIQUE_ID,
            chainId: transactionToCancel.chainId,
          }),
        )
        .put(
          pushNotification({
            type: AppNotificationType.Error,
            address: transactionToCancel.from,
            errorMessage: i18n.t('transaction.notification.error.cancel'),
          }),
        )
        .not.put.like({ action: { type: addTransaction.type } })
        .silentRun()
    })

    it('should handle executeTransaction failure and show replace error message', () => {
      const newTxRequest = ethersTransactionRequest({
        to: '0x1234567890123456789012345678901234567890',
        value: BigNumber.from('1000000000000000000'),
      })

      return expectSaga(attemptReplaceTransaction, {
        transaction: baseTransaction,
        newTxRequest,
        isCancellation: false,
      })
        .withState({
          wallet: {
            accounts: {
              [ACCOUNT.address]: ACCOUNT,
            },
          },
        })
        .provide([
          [selectAccounts, { [baseTransaction.from]: ACCOUNT }],
          [matchers.call.fn(executeTransaction), throwError(new Error('Network error'))],
        ])
        .put(
          deleteTransaction({
            address: baseTransaction.from,
            id: NEW_UNIQUE_ID,
            chainId: baseTransaction.chainId,
          }),
        )
        .put(
          pushNotification({
            type: AppNotificationType.Error,
            address: baseTransaction.from,
            errorMessage: i18n.t('transaction.notification.error.replace'),
          }),
        )
        .not.put.like({ action: { type: addTransaction.type } })
        .silentRun()
    })
  })

  describe('edge cases', () => {
    it('should preserve private RPC setting from original transaction', () => {
      MockDate.set(present.valueOf())

      const privateRpcTransaction = transactionDetails({
        options: {
          request: ethersTransactionRequest({
            from: ACCOUNT.address,
            nonce: 5,
          }),
          privateRpcProvider: 'flashbots',
        },
      })

      const newTxRequest = ethersTransactionRequest({
        to: '0x1234567890123456789012345678901234567890',
        value: BigNumber.from('1000000000000000000'),
      })

      const { txResponse } = getTxFixtures(privateRpcTransaction)

      return expectSaga(attemptReplaceTransaction, {
        transaction: privateRpcTransaction,
        newTxRequest,
        isCancellation: false,
      })
        .withState({
          wallet: {
            accounts: {
              [ACCOUNT.address]: ACCOUNT,
            },
          },
        })
        .provide([
          [selectAccounts, { [privateRpcTransaction.from]: ACCOUNT }],
          [matchers.call.fn(executeTransaction), { transactionHash: txResponse.hash }],
        ])
        .put.like({
          action: { type: addTransaction.type },
        })
        .silentRun()
    })
  })
})
