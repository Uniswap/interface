import dayjs from 'dayjs'
import { BigNumber, providers } from 'ethers'
import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call } from 'redux-saga/effects'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import { TransactionOriginType, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getTxFixtures } from 'uniswap/src/test/fixtures'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { noOpFunction } from 'utilities/src/test/utils'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import {
  getPendingPrivateTxCount,
  sendTransaction,
  signAndSendTransaction,
  tryGetNonce,
} from 'wallet/src/features/transactions/sendTransactionSaga'
import { ReadOnlyAccount } from 'wallet/src/features/wallet/accounts/types'
import {
  getPrivateProvider,
  getProvider,
  getProviderManager,
  getSignerManager,
} from 'wallet/src/features/wallet/context'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'
import { provider, providerManager, signerManager } from 'wallet/src/test/mocks'

let mockGates: Record<string, boolean> = {}
jest.mock('uniswap/src/features/gating/sdk/statsig', () => ({
  Statsig: {
    checkGate: jest.fn().mockImplementation((gate) => {
      return mockGates[gate] ?? false
    }),
  },
}))

const account = signerMnemonicAccount()

const { txRequest, txResponse, txTypeInfo } = getTxFixtures()

const sendParams = {
  txId: '0',
  chainId: UniverseChainId.Mainnet as UniverseChainId,
  account,
  options: { request: txRequest },
  typeInfo: txTypeInfo,
  transactionOriginType: TransactionOriginType.Internal,
}

describe(sendTransaction, () => {
  let dateNowSpy: jest.SpyInstance

  beforeEach(() => {
    mockGates = {
      'mev-blocker': true,
      'flashbots-private-rpc': true,
    }
  })

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
          transactionOriginType: TransactionOriginType.Internal,
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
            timeoutTimestampMs: undefined,
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

  it('Adds nonce to transaction request when not provided', async () => {
    const mockNonce = 5
    const request = {
      to: '0x1234567890123456789012345678901234567890',
      value: '0x0',
      data: '0x',
    }
    const sendParamsWithoutNonce = {
      ...sendParams,
      options: {
        request,
      },
    }

    return expectSaga(sendTransaction, sendParamsWithoutNonce)
      .provide([
        [call(tryGetNonce, account, sendParams.chainId), mockNonce],
        [call(getProvider, sendParams.chainId), provider],
        [call(getSignerManager), signerManager],
        [
          call(
            signAndSendTransaction,
            { ...request, nonce: mockNonce },
            account,
            provider as providers.Provider,
            signerManager,
          ),
          { transactionResponse: txResponse, populatedRequest: { ...request, nonce: mockNonce } },
        ],
      ])
      .call(tryGetNonce, account, sendParams.chainId)
      .call(
        signAndSendTransaction,
        {
          ...request,
          nonce: mockNonce,
        },
        account,
        provider as providers.Provider,
        signerManager,
      )
      .silentRun()
  })

  describe(tryGetNonce, () => {
    it('Uses private RPC provider when feature flag is enabled and chain is supported', async () => {
      const mockNonce = 10
      const privateProvider = {
        getTransactionCount: jest.fn(),
      } as unknown as providers.Provider

      return expectSaga(tryGetNonce, account, UniverseChainId.Mainnet)
        .provide([
          [call(isPrivateRpcSupportedOnChain, UniverseChainId.Mainnet), true],
          [call(getPrivateProvider, UniverseChainId.Mainnet, account), privateProvider],
          [call([privateProvider, privateProvider.getTransactionCount], account.address, 'pending'), mockNonce],
        ])
        .call(getPrivateProvider, UniverseChainId.Mainnet, account)
        .call([privateProvider, privateProvider.getTransactionCount], account.address, 'pending')
        .returns(mockNonce)
        .silentRun()
    })

    it('Uses public provider when private RPC is not supported for the chain', async () => {
      const mockNonce = 15
      const publicProvider = {
        getTransactionCount: jest.fn(),
      } as unknown as providers.Provider

      return expectSaga(tryGetNonce, account, UniverseChainId.Optimism)
        .provide([
          [call(isPrivateRpcSupportedOnChain, UniverseChainId.Optimism), false],
          [call(getProvider, UniverseChainId.Optimism), publicProvider],
          [call([publicProvider, publicProvider.getTransactionCount], account.address, 'pending'), mockNonce],
        ])
        .call(getProvider, UniverseChainId.Optimism)
        .call([publicProvider, publicProvider.getTransactionCount], account.address, 'pending')
        .returns(mockNonce)
        .silentRun()
    })

    it('Includes local pending private transactions when using MEVBlocker as private RPC', async () => {
      mockGates = {
        'mev-blocker': true,
        'flashbots-private-rpc': false,
      }
      const mockNonce = 15
      const publicProvider = {
        getTransactionCount: jest.fn(),
      } as unknown as providers.Provider

      return expectSaga(tryGetNonce, account, UniverseChainId.Mainnet)
        .provide([
          [call(isPrivateRpcSupportedOnChain, UniverseChainId.Mainnet), false],
          [call(getProvider, UniverseChainId.Mainnet), publicProvider],
          [call([publicProvider, publicProvider.getTransactionCount], account.address, 'pending'), mockNonce],
          [call(getPendingPrivateTxCount, account.address, UniverseChainId.Mainnet), 3],
        ])
        .call(getProvider, UniverseChainId.Mainnet)
        .call([publicProvider, publicProvider.getTransactionCount], account.address, 'pending')
        .returns(mockNonce + 3)
        .silentRun()
    })

    it('Does not include local pending private transactions when using Flashbots as private RPC', async () => {
      mockGates = {
        'mev-blocker': true,
        'flashbots-private-rpc': true,
      }
      const mockNonce = 15
      const privateProvider = {
        getTransactionCount: jest.fn(),
      } as unknown as providers.Provider

      return expectSaga(tryGetNonce, account, UniverseChainId.Mainnet)
        .provide([
          [call(isPrivateRpcSupportedOnChain, UniverseChainId.Mainnet), false],
          [call(getPrivateProvider, UniverseChainId.Mainnet, account), privateProvider],
          [call([privateProvider, privateProvider.getTransactionCount], account.address, 'pending'), mockNonce],
          [call(getPendingPrivateTxCount, account.address, UniverseChainId.Mainnet), 3],
        ])
        .call(getPrivateProvider, UniverseChainId.Mainnet, account)
        .call([privateProvider, privateProvider.getTransactionCount], account.address, 'pending')
        .returns(mockNonce)
        .silentRun()
    })

    it('Returns undefined when nonce fetching fails', async () => {
      const error = new Error('Failed to fetch nonce')

      return expectSaga(tryGetNonce, account, UniverseChainId.Mainnet)
        .provide([
          [call(getPrivateProvider, UniverseChainId.Mainnet, account), provider],
          [call([provider, provider.getTransactionCount], account.address, 'pending'), throwError(error)],
        ])
        .call(getPrivateProvider, UniverseChainId.Mainnet, account)
        .call([provider, provider.getTransactionCount], account.address, 'pending')
        .returns(undefined)
        .silentRun()
    })
  })
})
