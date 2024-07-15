import dayjs from 'dayjs'
import { BigNumber, providers } from 'ethers'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { Routing } from 'wallet/src/data/tradingApi/__generated__/index'
import { sendTransaction, signAndSendTransaction } from 'wallet/src/features/transactions/sendTransactionSaga'
import { addTransaction } from 'wallet/src/features/transactions/slice'
import { TransactionStatus } from 'wallet/src/features/transactions/types'
import { AccountType, ReadOnlyAccount } from 'wallet/src/features/wallet/accounts/types'
import { getProvider, getProviderManager, getSignerManager } from 'wallet/src/features/wallet/context'
import { getTxFixtures, signerMnemonicAccount } from 'wallet/src/test/fixtures'
import { noOpFunction, provider, providerManager, signerManager } from 'wallet/src/test/mocks'

const account = signerMnemonicAccount()

const { txRequest, txResponse, txTypeInfo } = getTxFixtures()

const sendParams = {
  txId: '0',
  chainId: UniverseChainId.Mainnet as WalletChainId,
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
          call(signAndSendTransaction, txRequest, account, provider as providers.Provider, signerManager),
          { transactionResponse: txResponse, populatedRequest: txRequest },
        ],
      ])
      .put(
        addTransaction({
          routing: Routing.CLASSIC,
          chainId: sendParams.chainId,
          id: '0',
          hash: txResponse.hash,
          typeInfo: txTypeInfo,
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
        }),
      )
      .silentRun()
  })

  it('Fails for readonly accounts', () => {
    jest.spyOn(console, 'error').mockImplementation(noOpFunction)
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
    return expectSaga(sendTransaction, params).throws(new Error('Account must support signing')).silentRun()
  })
})
