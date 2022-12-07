import dayjs from 'dayjs'
import { BigNumber, providers } from 'ethers'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { getProvider, getProviderManager, getSignerManager } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { sendTransaction, signAndSendTransaction } from 'src/features/transactions/sendTransaction'
import { addTransaction } from 'src/features/transactions/slice'
import { TransactionStatus } from 'src/features/transactions/types'
import { AccountType, ReadOnlyAccount } from 'src/features/wallet/accounts/types'
import {
  account,
  provider,
  providerManager,
  signerManager,
  txRequest,
  txResponse,
  txTypeInfo,
} from 'src/test/fixtures'

const sendParams = {
  txId: '0',
  chainId: ChainId.Mainnet,
  account,
  options: { request: txRequest },
  typeInfo: txTypeInfo,
}

describe(sendTransaction, () => {
  let dateNowSpy: jest.SpyInstance

  beforeAll(() => {
    // Lock Time
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1487076708000)
  })

  afterAll(() => {
    // Unlock Time
    dateNowSpy?.mockRestore()
  })

  it('Sends valid transactions successfully', () => {
    return expectSaga(sendTransaction, sendParams)
      .withState({ transactions: {}, wallet: {} })
      .provide([
        [call(getProvider, sendParams.chainId), provider],
        [call(getProviderManager), providerManager],
        [call(getSignerManager), signerManager],
        [
          call(
            signAndSendTransaction,
            txRequest,
            account,
            provider as providers.Provider,
            signerManager
          ),
          { transactionResponse: txResponse, populatedRequest: txRequest },
        ],
      ])
      .put(
        addTransaction({
          chainId: sendParams.chainId,
          id: '0',
          hash: txResponse.hash,
          typeInfo: txTypeInfo,
          isFlashbots: undefined,
          from: sendParams.account.address,
          status: TransactionStatus.Pending,
          addedTime: Date.now(),
          options: {
            request: {
              chainId: sendParams.chainId,
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

  it('Fails for readonly accounts', () => {
    const readOnlyAccount: ReadOnlyAccount = {
      type: AccountType.Readonly,
      address: '0xabc',
      name: 'readonly',
      timeImportedMs: dayjs().valueOf(),
    }
    const params = {
      ...sendParams,
      account: readOnlyAccount,
    }
    return expectSaga(sendTransaction, params)
      .throws(new Error('Account must support signing'))
      .silentRun()
  })
})
