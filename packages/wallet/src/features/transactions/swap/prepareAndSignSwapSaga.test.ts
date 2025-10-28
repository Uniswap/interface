/* eslint-disable max-lines */
import { call, select } from '@redux-saga/core/effects'
import { MaxUint256, TradeType } from '@uniswap/sdk-core'
import { TradingApi, type UnwrapQuoteResponse, type WrapQuoteResponse } from '@universe/api'
import JSBI from 'jsbi'
import { expectSaga } from 'redux-saga-test-plan'
import type { EffectProviders, StaticProvider } from 'redux-saga-test-plan/providers'
import { USDC } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { type UniswapXTrade, UnwrapTrade, WrapTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { ETH, WETH } from 'uniswap/src/test/fixtures'
import { mockPermit } from 'uniswap/src/test/fixtures/permit'
import { ensure0xHex } from 'utilities/src/addresses/hex'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import { createTransactionServices } from 'wallet/src/features/transactions/factories/createTransactionServices'
import {
  createPrepareAndSignSwapSaga,
  shouldSubmitViaPrivateRpc,
} from 'wallet/src/features/transactions/swap/prepareAndSignSwapSaga'
import {
  mockSignerAccount as account,
  mockTransactionSagaDependencies,
  mockTransactionService,
  mockTransactionSigner,
  prepareAndSignSwapSagaParams,
  prepareSwapTxContext,
} from 'wallet/src/features/transactions/swap/types/fixtures'
import { DelegationType } from 'wallet/src/features/transactions/types/transactionSagaDependencies'
import { selectWalletSwapProtectionSetting } from 'wallet/src/features/wallet/selectors'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'

// Mock dependencies
jest.mock('wallet/src/features/transactions/factories/createTransactionServices')

const mockPrivateRpcFlag = jest.fn().mockReturnValue(true)

jest.mock('@universe/gating', () => ({
  ...jest.requireActual('@universe/gating'),
  getStatsigClient: jest.fn(() => ({
    checkGate: jest.fn().mockImplementation((flagName: string) => {
      if (flagName === 'mev-blocker') {
        return mockPrivateRpcFlag()
      }
      return false // Default for other flags
    }),
    getLayer: jest.fn(() => ({
      get: jest.fn(() => false),
    })),
  })),
}))

const MOCK_TIMESTAMP = 1487076708000
const CHAIN_ID = UniverseChainId.Mainnet

// Mock transaction requests
const mockSwapTxRequest = {
  chainId: CHAIN_ID,
  to: '0xSwapAddress',
  data: '0x0',
  value: '1000000000000000000',
  gasLimit: '200000',
  gasPrice: '20000000000',
}
const mockPermitTxRequest = {
  chainId: CHAIN_ID,
  to: '0xPermitAddress',
  data: '0x123456',
  value: '0',
  gasLimit: '100000',
  gasPrice: '20000000000',
}
const mockSignedTransactionRequest = {
  request: { ...mockSwapTxRequest, nonce: 1 },
  signedRequest: ensure0xHex('0xsignedTxData'),
  timestampBeforeSign: MOCK_TIMESTAMP,
}

const mockSignedApprovalRequest = {
  request: { ...mockSwapTxRequest, nonce: 1 },
  signedRequest: ensure0xHex('0xsignedApprovalData'),
  timestampBeforeSign: MOCK_TIMESTAMP,
}
const mockSignedPermitRequest = {
  request: { ...mockPermitTxRequest, nonce: 1 },
  signedRequest: ensure0xHex('0xsignedPermitData'),
  timestampBeforeSign: MOCK_TIMESTAMP,
}

describe('prepareAndSignSwapSaga', () => {
  let dateNowSpy: jest.SpyInstance
  let prepareAndSignSwapSaga: ReturnType<typeof createPrepareAndSignSwapSaga>

  const sharedProviders: (EffectProviders | StaticProvider)[] = [
    [select(selectWalletSwapProtectionSetting), SwapProtectionSetting.Off],
    [
      call(createTransactionServices, mockTransactionSagaDependencies, {
        account,
        chainId: CHAIN_ID,
        submitViaPrivateRpc: false,
        delegationType: DelegationType.Auto,
        request: mockSwapTxRequest,
      }),
      {
        transactionSigner: mockTransactionSigner,
        transactionService: mockTransactionService,
      },
    ],
  ]

  beforeAll(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => MOCK_TIMESTAMP)
    prepareAndSignSwapSaga = createPrepareAndSignSwapSaga(mockTransactionSagaDependencies)
  })

  afterAll(() => {
    dateNowSpy.mockRestore()
  })

  beforeEach(() => {
    jest.clearAllMocks()

    mockTransactionService.getNextNonce.mockResolvedValue({ nonce: 1 })
    mockTransactionService.prepareAndSignTransaction.mockResolvedValue(mockSignedTransactionRequest)
    mockTransactionSigner.signTypedData.mockResolvedValue('0xsignedTypedData')
    mockPrivateRpcFlag.mockReturnValue(true)
  })

  describe('Classic routing', () => {
    it('should prepare and sign a classic swap without approval', async () => {
      const params = prepareAndSignSwapSagaParams()

      const result = await expectSaga(prepareAndSignSwapSaga, params)
        .provide([
          ...sharedProviders,
          [call(shouldSubmitViaPrivateRpc, CHAIN_ID), false],
          [
            call(mockTransactionService.getNextNonce, {
              account,
              chainId: CHAIN_ID,
              submitViaPrivateRpc: false,
            }),
            { nonce: 1 },
          ],
          [
            call(mockTransactionService.prepareAndSignTransaction, {
              chainId: CHAIN_ID,
              account,
              request: { ...mockSwapTxRequest, nonce: 1 },
              submitViaPrivateRpc: false,
            }),
            mockSignedTransactionRequest,
          ],
        ])
        .run()

      expect(result.returnValue.signedApproveTx).toBeUndefined()
      expect(result.returnValue.signedPermitTx).toBeUndefined()
      expect(result.returnValue.signedSwapTx).toEqual(mockSignedTransactionRequest)
      expect(result.returnValue.metadata.submitViaPrivateRpc).toBe(false)
      expect(result.returnValue.chainId).toEqual(CHAIN_ID)
      expect(result.returnValue.account).toEqual(account)
    })

    it('should prepare and sign a classic swap with approval', async () => {
      const params = prepareAndSignSwapSagaParams({
        swapTxContext: prepareSwapTxContext({
          approveTxRequest: mockSwapTxRequest,
        }),
      })

      mockTransactionService.prepareAndSignTransaction
        .mockResolvedValueOnce(mockSignedApprovalRequest)
        .mockResolvedValueOnce({
          ...mockSignedTransactionRequest,
          request: { ...mockSignedTransactionRequest.request, nonce: 2 },
        })

      const result = await expectSaga(prepareAndSignSwapSaga, params)
        .provide([
          ...sharedProviders,
          [call(shouldSubmitViaPrivateRpc, CHAIN_ID), false],
          [
            call(mockTransactionService.getNextNonce, {
              account,
              chainId: CHAIN_ID,
              submitViaPrivateRpc: false,
            }),
            { nonce: 1 },
          ],
        ])
        .run()

      expect(result.returnValue.signedApproveTx).toEqual(mockSignedApprovalRequest)
      expect(result.returnValue.signedSwapTx).toEqual({
        ...mockSignedTransactionRequest,
        request: { ...mockSignedTransactionRequest.request, nonce: 2 },
      })
    })

    it('should prepare and sign a classic swap with permit transaction', async () => {
      const mockPermitTransaction = {
        method: PermitMethod.Transaction as const,
        txRequest: mockPermitTxRequest,
      }

      const params = prepareAndSignSwapSagaParams({
        swapTxContext: prepareSwapTxContext({
          permit: mockPermitTransaction,
        }),
      })

      mockTransactionService.prepareAndSignTransaction
        .mockResolvedValueOnce(mockSignedPermitRequest)
        .mockResolvedValueOnce({
          ...mockSignedTransactionRequest,
          request: { ...mockSignedTransactionRequest.request, nonce: 2 },
        })

      const result = await expectSaga(prepareAndSignSwapSaga, params)
        .provide([
          ...sharedProviders,
          [call(shouldSubmitViaPrivateRpc, CHAIN_ID), false],
          [
            call(mockTransactionService.getNextNonce, {
              account,
              chainId: CHAIN_ID,
              submitViaPrivateRpc: false,
            }),
            { nonce: 1 },
          ],
        ])
        .run()

      expect(result.returnValue.signedApproveTx).toBeUndefined()
      expect(result.returnValue.signedPermitTx).toEqual(mockSignedPermitRequest)
      expect(result.returnValue.signedSwapTx).toEqual({
        ...mockSignedTransactionRequest,
        request: { ...mockSignedTransactionRequest.request, nonce: 2 },
      })
      expect(result.returnValue.metadata.submitViaPrivateRpc).toBe(false)
      expect(result.returnValue.chainId).toEqual(CHAIN_ID)
      expect(result.returnValue.account).toEqual(account)
    })
  })

  describe('Wrap and Unwrap routing', () => {
    const mockWrapTrade = new WrapTrade({
      quote: {
        quote: {
          input: {
            amount: '1000000000000000000',
          },
          output: {
            amount: '1000000000000000000',
          },
        },
      } as WrapQuoteResponse,
      currencyIn: ETH,
      currencyOut: WETH,
      tradeType: TradeType.EXACT_INPUT,
    })

    const mockUnwrapTrade = new UnwrapTrade({
      quote: {
        quote: {
          input: {
            amount: '1000000000000000000',
          },
          output: {
            amount: '1000000000000000000',
          },
        },
      } as UnwrapQuoteResponse,
      currencyIn: WETH,
      currencyOut: ETH,
      tradeType: TradeType.EXACT_INPUT,
    })

    it('should prepare and sign a wrap transaction', async () => {
      const params = prepareAndSignSwapSagaParams({
        swapTxContext: prepareSwapTxContext({
          routing: TradingApi.Routing.WRAP,
          trade: mockWrapTrade,
        }),
      })

      const result = await expectSaga(prepareAndSignSwapSaga, params)
        .provide([
          ...sharedProviders,
          [call(shouldSubmitViaPrivateRpc, CHAIN_ID), false],
          [
            call(mockTransactionService.getNextNonce, {
              account,
              chainId: CHAIN_ID,
              submitViaPrivateRpc: false,
            }),
            { nonce: 1 },
          ],
          [
            call(mockTransactionService.prepareAndSignTransaction, {
              chainId: CHAIN_ID,
              account,
              request: { ...mockSwapTxRequest, nonce: 1 },
              submitViaPrivateRpc: false,
            }),
            mockSignedTransactionRequest,
          ],
        ])
        .run()

      expect(result.returnValue.signedApproveTx).toBeUndefined()
      expect(result.returnValue.signedPermitTx).toBeUndefined()
      expect(result.returnValue.signedSwapTx).toEqual(mockSignedTransactionRequest)
      expect(result.returnValue.metadata.submitViaPrivateRpc).toBe(false)
      expect(result.returnValue.chainId).toEqual(CHAIN_ID)
      expect(result.returnValue.account).toEqual(account)
    })

    it('should prepare and sign an unwrap transaction', async () => {
      const params = prepareAndSignSwapSagaParams({
        swapTxContext: prepareSwapTxContext({
          routing: TradingApi.Routing.UNWRAP,
          trade: mockUnwrapTrade,
        }),
      })

      const result = await expectSaga(prepareAndSignSwapSaga, params)
        .provide([
          ...sharedProviders,
          [call(shouldSubmitViaPrivateRpc, CHAIN_ID), false],
          [
            call(mockTransactionService.getNextNonce, {
              account,
              chainId: CHAIN_ID,
              submitViaPrivateRpc: false,
            }),
            { nonce: 1 },
          ],
          [
            call(mockTransactionService.prepareAndSignTransaction, {
              chainId: CHAIN_ID,
              account,
              request: { ...mockSwapTxRequest, nonce: 1 },
              submitViaPrivateRpc: false,
            }),
            mockSignedTransactionRequest,
          ],
        ])
        .run()

      expect(result.returnValue.signedApproveTx).toBeUndefined()
      expect(result.returnValue.signedPermitTx).toBeUndefined()
      expect(result.returnValue.signedSwapTx).toEqual(mockSignedTransactionRequest)
      expect(result.returnValue.metadata.submitViaPrivateRpc).toBe(false)
      expect(result.returnValue.chainId).toEqual(CHAIN_ID)
      expect(result.returnValue.account).toEqual(account)
    })
  })

  describe('UniswapX routing', () => {
    const mockUniswapXTrade = {
      routing: TradingApi.Routing.DUTCH_V2,
      inputAmount: { currency: ETH, quotient: JSBI.BigInt(1000) },
      outputAmount: { currency: USDC },
      quote: { amount: MaxUint256, routing: TradingApi.Routing.DUTCH_V2 },
      slippageTolerance: 0.5,
    } as unknown as UniswapXTrade

    it('should prepare and sign a UniswapX order', async () => {
      const params = prepareAndSignSwapSagaParams({
        swapTxContext: prepareSwapTxContext({
          routing: TradingApi.Routing.DUTCH_V2,
          trade: mockUniswapXTrade,
          permit: mockPermit,
          gasFeeBreakdown: {
            classicGasUseEstimateUSD: '5',
            approvalCost: '5',
            inputTokenSymbol: 'ETH',
          },
          txRequests: undefined,
        }),
      })

      const result = await expectSaga(prepareAndSignSwapSaga, params)
        .provide([
          ...sharedProviders,
          [
            call(createTransactionServices, mockTransactionSagaDependencies, {
              account,
              chainId: CHAIN_ID,
              submitViaPrivateRpc: false,
              delegationType: DelegationType.Auto,
              request: undefined,
            }),
            {
              transactionSigner: mockTransactionSigner,
              transactionService: mockTransactionService,
            },
          ],
          [call(shouldSubmitViaPrivateRpc, CHAIN_ID), false],
          [
            call(mockTransactionService.getNextNonce, {
              account,
              chainId: CHAIN_ID,
              submitViaPrivateRpc: false,
            }),
            { nonce: 1 },
          ],
        ])
        .run()

      expect(result.returnValue.signedSwapPermit).toEqual({
        permit: mockPermit.typedData,
        signedData: '0xsignedTypedData',
      })
    })

    it('should handle UniswapX signing failure and call onFailure', async () => {
      const onFailure = jest.fn()
      const params = prepareAndSignSwapSagaParams({
        onFailure,
        swapTxContext: prepareSwapTxContext({
          routing: TradingApi.Routing.DUTCH_V2,
          trade: mockUniswapXTrade,
          permit: mockPermit,
          gasFeeBreakdown: {
            classicGasUseEstimateUSD: '5',
            approvalCost: '5',
            inputTokenSymbol: 'ETH',
          },
          txRequests: undefined,
        }),
      })

      const error = new Error('Failed to sign typed data')
      mockTransactionSigner.signTypedData.mockRejectedValue(error)

      await expect(
        expectSaga(prepareAndSignSwapSaga, params)
          .provide([
            ...sharedProviders,
            [
              call(createTransactionServices, mockTransactionSagaDependencies, {
                account,
                chainId: CHAIN_ID,
                submitViaPrivateRpc: false,
                delegationType: DelegationType.Auto,
                request: undefined,
              }),
              {
                transactionSigner: mockTransactionSigner,
                transactionService: mockTransactionService,
              },
            ],
            [call(shouldSubmitViaPrivateRpc, CHAIN_ID), false],
            [
              call(mockTransactionService.getNextNonce, {
                account,
                chainId: CHAIN_ID,
                submitViaPrivateRpc: false,
              }),
              { nonce: 1 },
            ],
          ])
          .run(),
      ).rejects.toThrow('Failed to prepare and sign transaction: Failed to sign typed data')

      expect(onFailure).toHaveBeenCalledWith(expect.any(Error))
      expect(mockTransactionSagaDependencies.logger.error).toHaveBeenCalledWith(error, {
        tags: {
          file: 'prepareAndSignSwapSaga',
          function: 'prepareAndSignSwapTransaction',
        },
        extra: { chainId: CHAIN_ID },
      })
    })
  })

  describe('Error handling', () => {
    it('should handle nonce calculation errors gracefully and continue execution', async () => {
      const onSuccess = jest.fn()
      const params = prepareAndSignSwapSagaParams({
        onSuccess,
      })

      const nonceError = new Error('Transaction service failed')

      const result = await expectSaga(prepareAndSignSwapSaga, params)
        .provide([
          ...sharedProviders,
          [call(shouldSubmitViaPrivateRpc, CHAIN_ID), false],
          [
            call(mockTransactionService.getNextNonce, {
              account,
              chainId: CHAIN_ID,
              submitViaPrivateRpc: false,
            }),
            Promise.reject(nonceError),
          ],
        ])
        .run()

      // Saga should complete successfully despite nonce error
      expect(result.returnValue).toBeDefined()
      expect(onSuccess).toHaveBeenCalled()

      // Nonce error should be logged by prepareTransactionServices
      expect(mockTransactionSagaDependencies.logger.error).toHaveBeenCalledWith(nonceError, {
        tags: {
          file: 'baseTransactionPreparationSaga',
          function: 'prepareTransactionServices',
        },
        extra: { account, chainId: CHAIN_ID },
      })
    })

    it('should call onSuccess callback with result', async () => {
      const onSuccess = jest.fn()
      const params = prepareAndSignSwapSagaParams({
        onSuccess,
      })

      const result = await expectSaga(prepareAndSignSwapSaga, params)
        .provide([
          ...sharedProviders,
          [call(shouldSubmitViaPrivateRpc, CHAIN_ID), false],
          [
            call(mockTransactionService.getNextNonce, {
              account,
              chainId: CHAIN_ID,
              submitViaPrivateRpc: false,
            }),
            { nonce: 1 },
          ],
          [
            call(mockTransactionService.prepareAndSignTransaction, {
              chainId: CHAIN_ID,
              account,
              request: { ...mockSwapTxRequest, nonce: 1 },
              submitViaPrivateRpc: false,
            }),
            mockSignedTransactionRequest,
          ],
        ])
        .run()

      expect(onSuccess).toHaveBeenCalledWith(result.returnValue)
    })
  })

  describe('Private RPC logic', () => {
    it('should use private RPC when enabled', async () => {
      const params = prepareAndSignSwapSagaParams()

      const result = await expectSaga(prepareAndSignSwapSaga, params)
        .provide([
          [select(selectWalletSwapProtectionSetting), SwapProtectionSetting.On],
          [call(shouldSubmitViaPrivateRpc, CHAIN_ID), true],
          [
            call(createTransactionServices, mockTransactionSagaDependencies, {
              account,
              chainId: CHAIN_ID,
              submitViaPrivateRpc: true,
              delegationType: DelegationType.Auto,
              request: mockSwapTxRequest,
            }),
            {
              transactionSigner: mockTransactionSigner,
              transactionService: mockTransactionService,
            },
          ],
          [
            call(mockTransactionService.getNextNonce, {
              account,
              chainId: CHAIN_ID,
              submitViaPrivateRpc: true,
            }),
            { nonce: 1 },
          ],
          [
            call(mockTransactionService.prepareAndSignTransaction, {
              chainId: CHAIN_ID,
              account,
              request: { ...mockSwapTxRequest, nonce: 1 },
              submitViaPrivateRpc: true,
            }),
            mockSignedTransactionRequest,
          ],
        ])
        .run()

      expect(result.returnValue.metadata.submitViaPrivateRpc).toBe(true)
    })
  })
})

describe('shouldSubmitViaPrivateRpc', () => {
  const chainId = UniverseChainId.Mainnet

  it('should return true when all conditions are met', async () => {
    const result = await expectSaga(shouldSubmitViaPrivateRpc, chainId)
      .provide([
        [select(selectWalletSwapProtectionSetting), SwapProtectionSetting.On],
        [call(isPrivateRpcSupportedOnChain, chainId), true],
      ])
      .run()
    expect(result.returnValue).toBe(true)
  })

  it('should return false when swap protection is off', async () => {
    const result = await expectSaga(shouldSubmitViaPrivateRpc, chainId)
      .provide([
        [select(selectWalletSwapProtectionSetting), SwapProtectionSetting.Off],
        [call(isPrivateRpcSupportedOnChain, chainId), true],
      ])
      .run()
    expect(result.returnValue).toBe(false)
  })

  it('should return false when privateRpcFeatureEnabled is false', async () => {
    mockPrivateRpcFlag.mockReturnValue(false)

    const result = await expectSaga(shouldSubmitViaPrivateRpc, chainId)
      .provide([
        [select(selectWalletSwapProtectionSetting), SwapProtectionSetting.On],
        [call(isPrivateRpcSupportedOnChain, chainId), true],
      ])
      .run()
    expect(result.returnValue).toBe(false)
  })

  it('should return false when privateRpcSupportedOnChain is false', async () => {
    const result = await expectSaga(shouldSubmitViaPrivateRpc, chainId)
      .provide([
        [select(selectWalletSwapProtectionSetting), SwapProtectionSetting.On],
        [call(isPrivateRpcSupportedOnChain, chainId), false],
      ])
      .run()
    expect(result.returnValue).toBe(false)
  })
})
