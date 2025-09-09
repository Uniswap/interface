import { BigNumber, providers } from 'ethers'
import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call } from 'redux-saga/effects'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Experiments } from 'uniswap/src/features/gating/experiments'
import { addTransaction, finalizeTransaction, updateTransaction } from 'uniswap/src/features/transactions/slice'
import {
  TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getTxFixtures } from 'uniswap/src/test/fixtures'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import { executeTransactionLegacy } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSagaLegacy'
import { signAndSubmitTransaction } from 'wallet/src/features/transactions/executeTransaction/signAndSubmitTransaction'
import { getPendingPrivateTxCount, tryGetNonce } from 'wallet/src/features/transactions/executeTransaction/tryGetNonce'
import {
  getPrivateProvider,
  getProvider,
  getProviderManager,
  getSignerManager,
  getViemClient,
} from 'wallet/src/features/wallet/context'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'
import { provider, providerManager, signerManager, viemClient } from 'wallet/src/test/mocks'

let mockGates: Record<string, boolean> = {}
let mockExperiments: Record<string, Record<string, unknown>> = {}
jest.mock('uniswap/src/features/gating/sdk/statsig', () => ({
  getStatsigClient: jest.fn(() => ({
    checkGate: jest.fn((gate: string) => mockGates[gate] ?? false),
    getLayer: jest.fn(() => ({
      get: jest.fn(() => false),
    })),
  })),
}))

jest.mock('uniswap/src/features/gating/hooks', () => {
  return {
    ...jest.requireActual('uniswap/src/features/gating/hooks'),
    getExperimentValue: jest
      .fn()
      .mockImplementation(({ defaultValue }: { config: Experiments; key: string; defaultValue: unknown }) => {
        return mockExperiments.private_rpc?.flashbots_enabled ?? defaultValue
      }),
  }
})

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

const mockProvider = {
  ...provider,
  _getInternalBlockNumber: jest.fn(),
  getNetwork: jest.fn(),
  getBlockNumber: jest.fn(),
  getGasPrice: jest.fn(),
  getFeeData: jest.fn(),
} as unknown as providers.Provider

const mockViemClient = {
  ...viemClient,
  sendTransaction: jest.fn(),
}

describe(executeTransactionLegacy, () => {
  let dateNowSpy: jest.SpyInstance

  beforeEach(() => {
    mockGates = {
      'mev-blocker': true,
    }
    mockExperiments = {
      private_rpc: {
        flashbots_enabled: true,
      },
    }
  })

  beforeAll(() => {
    // Lock Time
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1487076708000)
  })

  afterAll(() => {
    // Unlock Time
    dateNowSpy.mockRestore()
  })

  it('Sends valid transactions successfully', () => {
    return expectSaga(executeTransactionLegacy, sendParams)
      .withState({ transactions: {}, wallet: {} })
      .provide([
        [call(getProvider, sendParams.chainId), mockProvider],
        [call(getViemClient, sendParams.chainId), mockViemClient],
        [call(getProviderManager), providerManager],
        [call(getSignerManager), signerManager],
        [
          call(signAndSubmitTransaction, {
            request: txRequest,
            account,
            provider: mockProvider,
            signerManager,
            viemClient: mockViemClient,
            isRemoveDelegation: false,
          }),
          {
            transactionResponse: txResponse,
            populatedRequest: txRequest,
            timestampBeforeSign: Date.now() - 1000,
            timestampBeforeSend: Date.now() - 500,
          },
        ],
      ])
      .put(
        addTransaction({
          routing: Routing.CLASSIC,
          chainId: sendParams.chainId,
          id: '0',
          typeInfo: txTypeInfo,
          from: sendParams.account.address,
          status: TransactionStatus.Pending,
          addedTime: Date.now(),
          transactionOriginType: TransactionOriginType.Internal,
          options: {
            request: txRequest,
          },
        }),
      )
      .put(
        updateTransaction({
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
            rpcSubmissionTimestampMs: Date.now(),
            rpcSubmissionDelayMs: 500,
            signTransactionDelayMs: 500,
            currentBlockFetchDelayMs: 0,
            timeoutTimestampMs: Date.now() + 10 * ONE_MINUTE_MS,
            privateRpcProvider: undefined,
            blockSubmitted: undefined,
          },
        }),
      )
      .silentRun()
  })

  it('Stores and finalizes failed transactions', () => {
    const transaction: TransactionDetails = {
      routing: Routing.CLASSIC,
      chainId: sendParams.chainId,
      id: '0',
      typeInfo: txTypeInfo,
      from: sendParams.account.address,
      status: TransactionStatus.Pending,
      addedTime: Date.now(),
      transactionOriginType: TransactionOriginType.Internal,
      options: {
        request: txRequest,
      },
    }

    return expectSaga(executeTransactionLegacy, sendParams)
      .withState({ transactions: {}, wallet: {} })
      .provide([
        [call(getProvider, sendParams.chainId), provider],
        [call(getViemClient, sendParams.chainId), viemClient],
        [call(getProviderManager), providerManager],
        [call(getSignerManager), signerManager],
        [
          call(signAndSubmitTransaction, {
            request: txRequest,
            account,
            provider: provider as providers.Provider,
            signerManager,
            viemClient,
            isRemoveDelegation: false,
          }),
          throwError(new Error('Something went wrong with nonce')),
        ],
      ])
      .put(addTransaction(transaction))
      .put(finalizeTransaction({ ...transaction, status: TransactionStatus.Failed }))
      .throws(new Error('Failed to send transaction: nonce_error'))
      .run()
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

    return expectSaga(executeTransactionLegacy, sendParamsWithoutNonce)
      .provide([
        [call(tryGetNonce, account, sendParams.chainId), { nonce: mockNonce }],
        [call(getProvider, sendParams.chainId), mockProvider],
        [call(getViemClient, sendParams.chainId), viemClient],
        [call(getSignerManager), signerManager],
        [
          call(signAndSubmitTransaction, {
            request: { ...request, nonce: mockNonce },
            account,
            provider: mockProvider,
            signerManager,
            viemClient,
            isRemoveDelegation: false,
          }),
          { transactionResponse: txResponse, populatedRequest: { ...request, nonce: mockNonce } },
        ],
      ])
      .call(tryGetNonce, account, sendParams.chainId)
      .call(signAndSubmitTransaction, {
        request: { ...request, nonce: mockNonce },
        account,
        provider: mockProvider,
        signerManager,
        viemClient,
        isRemoveDelegation: false,
      })
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
        .returns({ nonce: mockNonce })
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
        .returns({ nonce: mockNonce })
        .silentRun()
    })

    it('Includes local pending private transactions when using MEVBlocker as private RPC', async () => {
      mockExperiments = {
        private_rpc: {
          flashbots_enabled: false,
        },
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
        .returns({ nonce: mockNonce + 3, pendingPrivateTxCount: 3 })
        .silentRun()
    })

    it('Does not include local pending private transactions when using Flashbots as private RPC', async () => {
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
        .returns({ nonce: mockNonce })
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
