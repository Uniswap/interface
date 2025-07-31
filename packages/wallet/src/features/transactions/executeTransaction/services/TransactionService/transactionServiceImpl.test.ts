/* eslint-disable max-lines */
import { BaseProvider, JsonRpcProvider, Provider, TransactionReceipt } from '@ethersproject/providers'
import { BigNumber } from 'ethers'
import { AssetType } from 'uniswap/src/entities/assets'
import { AccountMeta, AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ensure0xHex } from 'uniswap/src/utils/hex'
import { logger } from 'utilities/src/logger/logger'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import { ExecuteTransactionParams } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { TransactionRepository } from 'wallet/src/features/transactions/executeTransaction/services/TransactionRepository/transactionRepository'
import {
  SubmitTransactionParams,
  TransactionService,
} from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionService'
import { createTransactionService } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionServiceImpl'
import { TransactionSigner } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'
import { AnalyticsService } from 'wallet/src/features/transactions/executeTransaction/services/analyticsService'
import { TransactionConfigService } from 'wallet/src/features/transactions/executeTransaction/services/transactionConfigService'

// Mock external utilities
jest.mock('wallet/src/features/providers/utils', () => ({
  isPrivateRpcSupportedOnChain: jest.fn(),
}))

describe('TransactionService', () => {
  // Mock dependencies
  const mockTransactionRepository: jest.Mocked<TransactionRepository> = {
    addTransaction: jest.fn(),
    updateTransaction: jest.fn(),
    finalizeTransaction: jest.fn(),
    getPendingPrivateTransactionCount: jest.fn(),
    getTransactionsByAddress: jest.fn(),
  }

  const mockTransactionSigner: jest.Mocked<TransactionSigner> = {
    prepareTransaction: jest.fn(),
    signTransaction: jest.fn(),
    signTypedData: jest.fn(),
    sendTransaction: jest.fn(),
    sendTransactionSync: jest.fn(),
    signAndSendTransaction: jest.fn(),
  }

  // Create a proper mock for AnalyticsService without relying on jest.Mocked
  const mockAnalyticsService = {
    trackSwapSubmitted: jest.fn(),
    trackTransactionEvent: jest.fn(),
  } as unknown as AnalyticsService

  const mockConfigService: jest.Mocked<TransactionConfigService> = {
    shouldUsePrivateRpc: jest.fn(),
    isPrivateRpcEnabled: jest.fn(),
    getPrivateRpcConfig: jest.fn(),
    getTransactionTimeoutMs: jest.fn(),
  }

  // Create a properly mocked provider with proper jest function mocks
  const mockGetTransactionCount = jest.fn().mockImplementation(() => Promise.resolve(42))
  const mockGetInternalBlockNumber = jest.fn().mockImplementation(() => Promise.resolve(123456))

  const mockBaseProvider = {
    _getInternalBlockNumber: mockGetInternalBlockNumber,
    getTransactionCount: mockGetTransactionCount,
  } as unknown as BaseProvider & Provider

  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as typeof logger

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset the mocks with their default implementations
    mockGetTransactionCount.mockImplementation(() => Promise.resolve(42))

    // Setup default mock for private RPC support check
    const mockIsPrivateRpcSupportedOnChain = isPrivateRpcSupportedOnChain as jest.Mock
    mockIsPrivateRpcSupportedOnChain.mockReturnValue(false)
  })

  // Create the service with mocked dependencies
  const createTestService = (): TransactionService => {
    return createTransactionService({
      transactionRepository: mockTransactionRepository,
      transactionSigner: mockTransactionSigner,
      analyticsService: mockAnalyticsService,
      configService: mockConfigService,
      logger: mockLogger,
      getProvider: jest.fn().mockResolvedValue(mockBaseProvider),
    })
  }

  describe('prepareAndSignTransaction', () => {
    it('should successfully prepare and sign a transaction with provided nonce', async () => {
      // Arrange
      const service = createTestService()

      const mockAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.SignerMnemonic,
      }

      const txRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
        chainId: UniverseChainId.Mainnet,
        nonce: 5, // Provided nonce
      }

      const params = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        request: txRequest,
        submitViaPrivateRpc: false,
      }

      const preparedTransaction = {
        ...txRequest,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
      }

      const signedTransaction = '0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a'

      // Setup mocks
      mockTransactionSigner.prepareTransaction.mockResolvedValue(preparedTransaction)
      mockTransactionSigner.signTransaction.mockResolvedValue(signedTransaction)

      // Act
      const result = await service.prepareAndSignTransaction(params)

      // Assert
      expect(mockTransactionSigner.prepareTransaction).toHaveBeenCalledWith({
        request: txRequest,
      })
      expect(mockTransactionSigner.signTransaction).toHaveBeenCalledWith(preparedTransaction)
      expect(result).toEqual({
        request: preparedTransaction,
        signedRequest: signedTransaction,
      })
    })

    it('should calculate nonce when not provided', async () => {
      // Arrange
      const service = createTestService()

      const mockAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.SignerMnemonic,
      }

      const txRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
        chainId: UniverseChainId.Mainnet,
        // No nonce provided
      }

      const params = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        request: txRequest,
        submitViaPrivateRpc: false,
      }

      const calculatedNonce = 42
      const requestWithNonce = { ...txRequest, nonce: calculatedNonce }
      const preparedTransaction = {
        ...requestWithNonce,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
      }

      const signedTransaction = '0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a'

      // Setup mocks
      mockGetTransactionCount.mockReturnValue(calculatedNonce)
      mockConfigService.shouldUsePrivateRpc.mockReturnValue(false)
      mockTransactionSigner.prepareTransaction.mockResolvedValue(preparedTransaction)
      mockTransactionSigner.signTransaction.mockResolvedValue(signedTransaction)

      // Act
      const result = await service.prepareAndSignTransaction(params)

      // Assert
      expect(mockGetTransactionCount).toHaveBeenCalledWith(mockAccount.address, 'pending')
      expect(mockTransactionSigner.prepareTransaction).toHaveBeenCalledWith({
        request: requestWithNonce,
      })
      expect(mockTransactionSigner.signTransaction).toHaveBeenCalledWith(preparedTransaction)
      expect(result).toEqual({
        request: preparedTransaction,
        signedRequest: signedTransaction,
      })
    })

    it('should throw error when transaction validation fails', async () => {
      // Arrange
      const service = createTestService()

      const mockAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.SignerMnemonic,
      }

      const txRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
        chainId: UniverseChainId.Mainnet,
        nonce: 5,
      }

      const params = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        request: txRequest,
        submitViaPrivateRpc: false,
      }

      // Setup mocks to throw error during preparation
      mockTransactionSigner.prepareTransaction.mockRejectedValue(new Error('Preparation failed'))

      // Act and Assert
      await expect(service.prepareAndSignTransaction(params)).rejects.toThrow('Preparation failed')

      expect(mockTransactionSigner.prepareTransaction).toHaveBeenCalledWith({
        request: txRequest,
      })
      expect(mockTransactionSigner.signTransaction).not.toHaveBeenCalled()
    })

    it('should handle private RPC scenario when calculating nonce', async () => {
      // Arrange
      const service = createTestService()

      const mockAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.SignerMnemonic,
      }

      const txRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
        chainId: UniverseChainId.Mainnet,
      }

      const params = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        request: txRequest,
        submitViaPrivateRpc: true,
      }

      const calculatedNonce = 42
      const requestWithNonce = { ...txRequest, nonce: calculatedNonce }
      const preparedTransaction = {
        ...requestWithNonce,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
      }

      const signedTransaction = '0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a'

      // Setup mocks
      mockGetTransactionCount.mockReturnValue(calculatedNonce)
      mockConfigService.shouldUsePrivateRpc.mockReturnValue(true)
      mockTransactionSigner.prepareTransaction.mockResolvedValue(preparedTransaction)
      mockTransactionSigner.signTransaction.mockResolvedValue(signedTransaction)

      // Act
      const result = await service.prepareAndSignTransaction(params)

      // Assert
      expect(mockConfigService.shouldUsePrivateRpc).toHaveBeenCalledWith({
        chainId: UniverseChainId.Mainnet,
        submitViaPrivateRpc: true,
      })
      expect(result).toEqual({
        request: preparedTransaction,
        signedRequest: signedTransaction,
      })
    })
  })

  describe('submitTransaction', () => {
    it('should successfully submit a signed transaction', async () => {
      // Arrange
      const service = createTestService()

      const mockAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.SignerMnemonic,
      }

      const signedRequest = ensure0xHex(
        '0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a',
      )
      const validatedRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
        nonce: 5,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const typeInfo: TransactionTypeInfo = {
        type: TransactionType.Send,
        assetType: AssetType.Currency,
        recipient: '0xabcdef1234567890123456789012345678901234',
        tokenAddress: '0x0000000000000000000000000000000000000000',
        currencyAmountRaw: '0x1234',
      }

      const params = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        request: {
          request: validatedRequest,
          signedRequest,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo,
        transactionOriginType: TransactionOriginType.Internal,
        timestampBeforeSign: 1234567890,
      }

      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

      // Setup mocks
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      const result = await service.submitTransaction(params)

      // Assert
      expect(mockTransactionRepository.addTransaction).toHaveBeenCalledWith({
        transaction: expect.objectContaining({
          status: TransactionStatus.Pending,
        }),
      })
      expect(mockTransactionSigner.sendTransaction).toHaveBeenCalledWith({
        signedTx: signedRequest,
      })
      expect(mockTransactionRepository.updateTransaction).toHaveBeenCalledWith({
        transaction: expect.objectContaining({
          hash: txHash,
          status: TransactionStatus.Pending,
        }),
        skipProcessing: false,
      })
      expect(result.transactionHash).toBe(txHash)
    })

    it('should track analytics for swap transactions', async () => {
      // Arrange
      const service = createTestService()

      const mockAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.SignerMnemonic,
      }

      const signedRequest = ensure0xHex(
        '0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a',
      )
      const validatedRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x0',
        data: '0x123abc',
        nonce: 5,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const mockAnalyticsData = {
        token_in_symbol: 'ETH',
        token_out_symbol: 'USDC',
        token_in_amount: '1.0',
        token_out_amount: '1700.0',
        routing: 'classic' as const,
        transactionOriginType: 'internal',
      }

      const typeInfo: TransactionTypeInfo = {
        type: TransactionType.Swap,
        tradeType: 0,
        inputCurrencyId: 'eth',
        outputCurrencyId: 'usdc',
        inputCurrencyAmountRaw: '1000000000000000000',
        expectedOutputCurrencyAmountRaw: '1700000000',
        minimumOutputCurrencyAmountRaw: '1683000000',
      }

      const params = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        request: {
          request: validatedRequest,
          signedRequest,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo,
        transactionOriginType: TransactionOriginType.Internal,
        analytics: mockAnalyticsData,
        timestampBeforeSign: 1234567890,
      }

      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

      // Setup mocks
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      await service.submitTransaction(params)

      // Assert
      expect(mockAnalyticsService.trackSwapSubmitted).toHaveBeenCalledWith(
        expect.objectContaining({
          typeInfo: expect.objectContaining({
            type: TransactionType.Swap,
          }),
          hash: txHash,
        }),
        mockAnalyticsData,
      )
    })

    it('should log error when analytics is missing for internal swaps', async () => {
      // Arrange
      const service = createTestService()

      const mockAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.SignerMnemonic,
      }

      const signedRequest = ensure0xHex(
        '0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a',
      )
      const validatedRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x0',
        data: '0x123abc',
        nonce: 5,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const typeInfo: TransactionTypeInfo = {
        type: TransactionType.Swap,
        tradeType: 0,
        inputCurrencyId: 'eth',
        outputCurrencyId: 'usdc',
        inputCurrencyAmountRaw: '1000000000000000000',
        expectedOutputCurrencyAmountRaw: '1700000000',
        minimumOutputCurrencyAmountRaw: '1683000000',
      }

      const params = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        request: {
          request: validatedRequest,
          signedRequest,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo,
        transactionOriginType: TransactionOriginType.Internal,
        timestampBeforeSign: 1234567890,
        // Note: No analytics provided
      }

      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

      // Setup mocks
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      await service.submitTransaction(params)

      // Assert
      expect(mockAnalyticsService.trackSwapSubmitted).not.toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: { file: 'TransactionService', function: 'sendTransaction' },
          extra: expect.anything(),
        }),
      )
    })

    it('should handle transaction submission errors', async () => {
      // Arrange
      const service = createTestService()

      const mockAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.SignerMnemonic,
      }

      const signedRequest = ensure0xHex(
        '0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a',
      )
      const validatedRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
        nonce: 5,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const typeInfo: TransactionTypeInfo = {
        type: TransactionType.Send,
        assetType: AssetType.Currency,
        recipient: '0xabcdef1234567890123456789012345678901234',
        tokenAddress: '0x0000000000000000000000000000000000000000',
        currencyAmountRaw: '0x1234',
      }

      const params = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        request: {
          request: validatedRequest,
          signedRequest,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo,
        transactionOriginType: TransactionOriginType.Internal,
        timestampBeforeSign: 1234567890,
      }

      const rpcError = new Error('transaction underpriced')

      // Setup mocks
      mockTransactionSigner.sendTransaction.mockRejectedValue(rpcError)

      // Act and Assert
      await expect(service.submitTransaction(params)).rejects.toThrow('Failed to send transaction:')

      expect(mockTransactionRepository.addTransaction).toHaveBeenCalledWith({
        transaction: expect.objectContaining({
          status: TransactionStatus.Pending,
        }),
      })
      expect(mockTransactionRepository.finalizeTransaction).toHaveBeenCalledWith({
        transaction: expect.anything(),
        status: TransactionStatus.Failed,
      })
      expect(mockLogger.warn).toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should handle bridge transactions with analytics', async () => {
      // Arrange
      const service = createTestService()

      const mockAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.SignerMnemonic,
      }

      const signedRequest = ensure0xHex(
        '0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a',
      )
      const validatedRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
        nonce: 5,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const mockBridgeAnalyticsData = {
        token_in_symbol: 'ETH',
        token_out_symbol: 'MATIC',
        token_in_amount: '1.0',
        token_out_amount: '1700.0',
        routing: 'bridge' as const,
        transactionOriginType: 'internal',
        chain_id_in: UniverseChainId.Mainnet,
        chain_id_out: UniverseChainId.Polygon,
      }

      const typeInfo: TransactionTypeInfo = {
        type: TransactionType.Bridge,
        inputCurrencyId: 'eth',
        inputCurrencyAmountRaw: '1000000000000000000',
        outputCurrencyId: 'matic',
        outputCurrencyAmountRaw: '1700000000000000000',
      }

      const params = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        request: {
          request: validatedRequest,
          signedRequest,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo,
        transactionOriginType: TransactionOriginType.Internal,
        analytics: mockBridgeAnalyticsData,
        timestampBeforeSign: 1234567890,
      }

      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

      // Setup mocks
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      await service.submitTransaction(params)

      // Assert
      expect(mockAnalyticsService.trackSwapSubmitted).toHaveBeenCalledWith(
        expect.objectContaining({
          typeInfo: expect.objectContaining({
            type: TransactionType.Bridge,
          }),
          hash: txHash,
        }),
        mockBridgeAnalyticsData,
      )
    })

    it('should not track analytics for external transactions', async () => {
      // Arrange
      const service = createTestService()

      const mockAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.SignerMnemonic,
      }

      const signedRequest = ensure0xHex(
        '0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a',
      )
      const validatedRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x0',
        data: '0x123abc',
        nonce: 5,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const typeInfo: TransactionTypeInfo = {
        type: TransactionType.Swap,
        tradeType: 0,
        inputCurrencyId: 'eth',
        outputCurrencyId: 'usdc',
        inputCurrencyAmountRaw: '1000000000000000000',
        expectedOutputCurrencyAmountRaw: '1700000000',
        minimumOutputCurrencyAmountRaw: '1683000000',
      }

      const params = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        request: {
          request: validatedRequest,
          signedRequest,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo,
        transactionOriginType: TransactionOriginType.External, // External origin
        timestampBeforeSign: 1234567890,
        // Note: No analytics provided for external transaction
      }

      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

      // Setup mocks
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      await service.submitTransaction(params)

      // Assert
      expect(mockAnalyticsService.trackSwapSubmitted).not.toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  describe('submitTransactionSync', () => {
    // Common setup for all submitTransactionSync tests
    const mockAccount: AccountMeta = {
      address: '0x1234567890123456789012345678901234567890',
      type: AccountType.SignerMnemonic,
    }

    const signedRequest = ensure0xHex('0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a')

    const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

    // Create common mock objects
    const createMockFormattedReceipt = (overrides: Partial<TransactionReceipt> = {}): TransactionReceipt => {
      return {
        transactionHash: txHash,
        blockNumber: 0x123456,
        gasUsed: BigNumber.from('0x5208'),
        status: 1,
        blockHash: '0xblock123',
        transactionIndex: 0,
        confirmations: 1,
        from: mockAccount.address,
        to: '0xabcdef1234567890123456789012345678901234',
        logs: [],
        cumulativeGasUsed: BigNumber.from('0x5208'),
        effectiveGasPrice: BigNumber.from('0x9184e72a000'),
        contractAddress: null,
        logsBloom: '0x0',
        root: '0x0',
        type: 2,
        byzantium: true,
        ...overrides,
      } as TransactionReceipt
    }

    // Create a proper mock for JsonRpcProvider
    const createMockJsonRpcProvider = (mockReceipt: Record<string, unknown> | null = null): JsonRpcProvider => {
      const receipt = mockReceipt || createMockFormattedReceipt()

      // Create the mocks explicitly
      const mockSend = jest.fn().mockResolvedValue({})
      const mockFormatterReceipt = jest.fn().mockImplementation(() => receipt)

      const mockProvider = {
        ...mockBaseProvider,
        send: mockSend,
        formatter: {
          receipt: mockFormatterReceipt,
        },
      } as unknown as JsonRpcProvider

      return mockProvider
    }

    // Helper function to create service with JsonRpc provider
    const createTestServiceWithJsonRpc = (mockProvider: JsonRpcProvider | null = null): TransactionService => {
      const provider = mockProvider || createMockJsonRpcProvider()
      return createTransactionService({
        transactionRepository: mockTransactionRepository,
        transactionSigner: mockTransactionSigner,
        analyticsService: mockAnalyticsService,
        configService: mockConfigService,
        logger: mockLogger,
        getProvider: jest.fn().mockResolvedValue(provider),
      })
    }

    // Helper function to create common test parameters
    const createTestParams = (
      overrides: {
        validatedRequest?: Record<string, unknown>
        typeInfo?: TransactionTypeInfo
        analytics?: Record<string, unknown>
        transactionOriginType?: TransactionOriginType
      } = {},
    ): SubmitTransactionParams => {
      const defaultValidatedRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
        nonce: 5,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const validatedRequest = { ...defaultValidatedRequest, ...overrides.validatedRequest }

      const defaultTypeInfo: TransactionTypeInfo = {
        type: TransactionType.Send,
        assetType: AssetType.Currency,
        recipient: '0xabcdef1234567890123456789012345678901234',
        tokenAddress: '0x0000000000000000000000000000000000000000',
        currencyAmountRaw: '0x1234',
      }

      return {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        request: {
          request: validatedRequest,
          signedRequest,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo: overrides.typeInfo || defaultTypeInfo,
        transactionOriginType: overrides.transactionOriginType || TransactionOriginType.Internal,
        timestampBeforeSign: 1234567890,
        ...(overrides.analytics && { analytics: overrides.analytics }),
      } as SubmitTransactionParams
    }

    it('should successfully submit a transaction using sync method and return transaction details', async () => {
      // Arrange
      const params = createTestParams()
      const mockProvider = createMockJsonRpcProvider()
      const syncService = createTestServiceWithJsonRpc(mockProvider)

      // Mock the transaction signer to return a proper receipt
      const mockReceipt = createMockFormattedReceipt()
      mockTransactionSigner.sendTransactionSync.mockResolvedValue(mockReceipt)

      // Act
      const result = await syncService.submitTransactionSync(params)

      // Assert
      expect(mockTransactionSigner.sendTransactionSync).toHaveBeenCalledWith({
        signedTx: signedRequest,
      })

      expect(mockTransactionRepository.addTransaction).toHaveBeenCalledWith({
        transaction: expect.objectContaining({
          status: TransactionStatus.Pending,
        }),
      })

      expect(mockTransactionRepository.updateTransaction).toHaveBeenCalledWith({
        transaction: expect.objectContaining({
          hash: txHash,
        }),
        skipProcessing: true,
      })

      expect(result).toEqual(
        expect.objectContaining({
          hash: txHash,
        }),
      )

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'TransactionService',
        'submitTransactionSync',
        'Calling sendTransactionSync...',
      )
    })

    it('should track analytics for swap transactions', async () => {
      // Arrange
      const mockAnalyticsData = {
        token_in_symbol: 'ETH',
        token_out_symbol: 'USDC',
        token_in_amount: '1.0',
        token_out_amount: '1700.0',
        routing: 'classic' as const,
        transactionOriginType: 'internal',
      }

      const swapTypeInfo: TransactionTypeInfo = {
        type: TransactionType.Swap,
        tradeType: 0,
        inputCurrencyId: 'eth',
        outputCurrencyId: 'usdc',
        inputCurrencyAmountRaw: '1000000000000000000',
        expectedOutputCurrencyAmountRaw: '1700000000',
        minimumOutputCurrencyAmountRaw: '1683000000',
      }

      const params = createTestParams({
        validatedRequest: { value: '0x0' },
        typeInfo: swapTypeInfo,
        analytics: mockAnalyticsData,
      })

      const syncService = createTestServiceWithJsonRpc()

      // Mock the transaction signer to return a proper receipt
      const mockReceipt = createMockFormattedReceipt()
      mockTransactionSigner.sendTransactionSync.mockResolvedValue(mockReceipt)

      // Act
      await syncService.submitTransactionSync(params)

      // Assert
      expect(mockAnalyticsService.trackSwapSubmitted).toHaveBeenCalledWith(
        expect.objectContaining({
          typeInfo: expect.objectContaining({
            type: TransactionType.Swap,
          }),
          hash: txHash,
        }),
        mockAnalyticsData,
      )
    })

    it('should log error when analytics is missing for internal swaps', async () => {
      // Arrange
      const validatedRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x0',
        data: '0x123abc',
        nonce: 5,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const typeInfo: TransactionTypeInfo = {
        type: TransactionType.Swap,
        tradeType: 0,
        inputCurrencyId: 'eth',
        outputCurrencyId: 'usdc',
        inputCurrencyAmountRaw: '1000000000000000000',
        expectedOutputCurrencyAmountRaw: '1700000000',
        minimumOutputCurrencyAmountRaw: '1683000000',
      }

      const params = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        request: {
          request: validatedRequest,
          signedRequest,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo,
        transactionOriginType: TransactionOriginType.Internal,
        timestampBeforeSign: 1234567890,
        // Note: No analytics provided
      }

      const syncService = createTestServiceWithJsonRpc()

      // Mock the transaction signer to return a proper receipt
      const mockReceipt = createMockFormattedReceipt()
      mockTransactionSigner.sendTransactionSync.mockResolvedValue(mockReceipt)

      // Act
      await syncService.submitTransactionSync(params)

      // Assert
      expect(mockAnalyticsService.trackSwapSubmitted).not.toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: { file: 'TransactionService', function: 'submitTransactionSync' },
          extra: expect.anything(),
        }),
      )
    })

    it('should handle sync transaction submission errors', async () => {
      // Arrange

      const validatedRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
        nonce: 5,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const typeInfo: TransactionTypeInfo = {
        type: TransactionType.Send,
        assetType: AssetType.Currency,
        recipient: '0xabcdef1234567890123456789012345678901234',
        tokenAddress: '0x0000000000000000000000000000000000000000',
        currencyAmountRaw: '0x1234',
      }

      const params = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        request: {
          request: validatedRequest,
          signedRequest,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo,
        transactionOriginType: TransactionOriginType.Internal,
        timestampBeforeSign: 1234567890,
      }

      const rpcError = new Error('sync transaction failed')

      const syncService = createTestServiceWithJsonRpc()

      // Mock the transaction signer to throw an error
      mockTransactionSigner.sendTransactionSync.mockRejectedValue(rpcError)

      // Act and Assert
      await expect(syncService.submitTransactionSync(params)).rejects.toThrow('Failed to send transaction:')

      expect(mockTransactionRepository.addTransaction).toHaveBeenCalledWith({
        transaction: expect.objectContaining({
          status: TransactionStatus.Pending,
        }),
      })
      expect(mockTransactionRepository.finalizeTransaction).toHaveBeenCalledWith({
        transaction: expect.anything(),
        status: TransactionStatus.Failed,
      })
      expect(mockLogger.warn).toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should handle bridge transactions with analytics', async () => {
      const validatedRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
        nonce: 5,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const mockBridgeAnalyticsData = {
        token_in_symbol: 'ETH',
        token_out_symbol: 'MATIC',
        token_in_amount: '1.0',
        token_out_amount: '1700.0',
        routing: 'bridge' as const,
        transactionOriginType: 'internal',
        chain_id_in: UniverseChainId.Mainnet,
        chain_id_out: UniverseChainId.Polygon,
      }

      const typeInfo: TransactionTypeInfo = {
        type: TransactionType.Bridge,
        inputCurrencyId: 'eth',
        inputCurrencyAmountRaw: '1000000000000000000',
        outputCurrencyId: 'matic',
        outputCurrencyAmountRaw: '1700000000000000000',
      }

      const params = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        request: {
          request: validatedRequest,
          signedRequest,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo,
        transactionOriginType: TransactionOriginType.Internal,
        analytics: mockBridgeAnalyticsData,
        timestampBeforeSign: 1234567890,
      }

      const syncService = createTestServiceWithJsonRpc()

      // Mock the transaction signer to return a proper receipt
      const mockReceipt = createMockFormattedReceipt()
      mockTransactionSigner.sendTransactionSync.mockResolvedValue(mockReceipt)

      // Act
      await syncService.submitTransactionSync(params)

      // Assert
      expect(mockAnalyticsService.trackSwapSubmitted).toHaveBeenCalledWith(
        expect.objectContaining({
          typeInfo: expect.objectContaining({
            type: TransactionType.Bridge,
          }),
          hash: txHash,
        }),
        mockBridgeAnalyticsData,
      )
    })

    it('should not track analytics for external transactions', async () => {
      // Arrange

      const validatedRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x0',
        data: '0x123abc',
        nonce: 5,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const typeInfo: TransactionTypeInfo = {
        type: TransactionType.Swap,
        tradeType: 0,
        inputCurrencyId: 'eth',
        outputCurrencyId: 'usdc',
        inputCurrencyAmountRaw: '1000000000000000000',
        expectedOutputCurrencyAmountRaw: '1700000000',
        minimumOutputCurrencyAmountRaw: '1683000000',
      }

      const params = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        request: {
          request: validatedRequest,
          signedRequest,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo,
        transactionOriginType: TransactionOriginType.External, // External origin
        timestampBeforeSign: 1234567890,
        // Note: No analytics provided for external transaction
      }

      const syncService = createTestServiceWithJsonRpc()

      // Mock the transaction signer to return a proper receipt
      const mockReceipt = createMockFormattedReceipt()
      mockTransactionSigner.sendTransactionSync.mockResolvedValue(mockReceipt)

      // Act
      await syncService.submitTransactionSync(params)

      // Assert
      expect(mockAnalyticsService.trackSwapSubmitted).not.toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  describe('executeTransaction', () => {
    it('should successfully execute a transaction end-to-end', async () => {
      // Arrange
      const service = createTestService()

      const mockAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.SignerMnemonic,
      }

      const txRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
        nonce: 5,
      }

      const executeParams: ExecuteTransactionParams = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        options: {
          request: txRequest,
          submitViaPrivateRpc: true,
        },
        typeInfo: {
          type: TransactionType.Send,
          assetType: AssetType.Currency,
          recipient: '0xabcdef1234567890123456789012345678901234',
          tokenAddress: '0x0000000000000000000000000000000000000000', // ETH
          currencyAmountRaw: '0x1234',
        },
        transactionOriginType: TransactionOriginType.Internal,
      }

      const preparedTransaction = {
        ...txRequest,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const signedTransaction = '0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a'
      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

      // Setup mocks for the underlying dependencies
      mockTransactionSigner.prepareTransaction.mockResolvedValue(preparedTransaction)
      mockTransactionSigner.signTransaction.mockResolvedValue(signedTransaction)
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      const result = await service.executeTransaction(executeParams)

      // Assert - Verify the behavior, not the implementation
      // 1. Verify transaction was prepared correctly
      expect(mockTransactionSigner.prepareTransaction).toHaveBeenCalledWith({
        request: txRequest,
      })

      // 2. Verify transaction was signed
      expect(mockTransactionSigner.signTransaction).toHaveBeenCalledWith(preparedTransaction)

      // 3. Verify transaction was submitted
      expect(mockTransactionSigner.sendTransaction).toHaveBeenCalledWith({
        signedTx: signedTransaction,
      })

      // 4. Verify transaction was stored in repository
      expect(mockTransactionRepository.addTransaction).toHaveBeenCalled()
      expect(mockTransactionRepository.updateTransaction).toHaveBeenCalled()

      // 5. Verify transaction hash was returned
      expect(result.transactionHash).toBe(txHash)

      // 6. Verify logging happened
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'TransactionService',
        'executeTransaction',
        `Executing tx on ${getChainLabel(UniverseChainId.Mainnet)} to ${txRequest.to}`,
      )
    })

    it('should handle nonce calculation when not provided', async () => {
      // Arrange
      const service = createTestService()

      const mockAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.SignerMnemonic,
      }

      const txRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
        // Note: no nonce provided, should be calculated
      }

      const executeParams: ExecuteTransactionParams = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        options: {
          request: txRequest,
        },
        typeInfo: {
          type: TransactionType.Send,
          assetType: AssetType.Currency,
          recipient: '0xabcdef1234567890123456789012345678901234',
          tokenAddress: '0x0000000000000000000000000000000000000000',
          currencyAmountRaw: '0x1234',
        },
        transactionOriginType: TransactionOriginType.Internal,
      }

      const calculatedNonce = 42
      const requestWithNonce = { ...txRequest, nonce: calculatedNonce }
      const preparedTransaction = {
        ...requestWithNonce,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const signedTransaction = '0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a'
      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

      // Setup mocks
      mockGetTransactionCount.mockReturnValue(calculatedNonce)
      mockConfigService.shouldUsePrivateRpc.mockReturnValue(false)
      mockTransactionSigner.prepareTransaction.mockResolvedValue(preparedTransaction)
      mockTransactionSigner.signTransaction.mockResolvedValue(signedTransaction)
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      const result = await service.executeTransaction(executeParams)

      // Assert
      // 1. Verify nonce was calculated
      expect(mockGetTransactionCount).toHaveBeenCalledWith(mockAccount.address, 'pending')

      // 2. Verify transaction was prepared with calculated nonce
      expect(mockTransactionSigner.prepareTransaction).toHaveBeenCalledWith({
        request: requestWithNonce,
      })

      // 3. Verify result
      expect(result.transactionHash).toBe(txHash)
    })

    it('should propagate errors from transaction preparation', async () => {
      // Arrange
      const service = createTestService()

      const mockAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.SignerMnemonic,
      }

      const txRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
      }

      const executeParams: ExecuteTransactionParams = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        options: {
          request: txRequest,
        },
        typeInfo: {
          type: TransactionType.Send,
          assetType: AssetType.Currency,
          recipient: '0xabcdef1234567890123456789012345678901234',
          tokenAddress: '0x0000000000000000000000000000000000000000',
          currencyAmountRaw: '0x1234',
        },
        transactionOriginType: TransactionOriginType.Internal,
      }

      // Mock preparation to throw an error
      const testError = new Error('Failed to prepare transaction')
      mockTransactionSigner.prepareTransaction.mockRejectedValue(testError)

      // Act and Assert
      await expect(service.executeTransaction(executeParams)).rejects.toThrow('Failed to prepare transaction')

      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalledWith(testError, {
        tags: { file: 'TransactionService', function: 'executeTransaction' },
        extra: { chainId: UniverseChainId.Mainnet, transactionType: TransactionType.Send, request: txRequest },
      })
    })

    it('should propagate errors from transaction submission', async () => {
      // Arrange
      const service = createTestService()

      const mockAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.SignerMnemonic,
      }

      const txRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
        nonce: 5,
      }

      const executeParams: ExecuteTransactionParams = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        options: {
          request: txRequest,
        },
        typeInfo: {
          type: TransactionType.Send,
          assetType: AssetType.Currency,
          recipient: '0xabcdef1234567890123456789012345678901234',
          tokenAddress: '0x0000000000000000000000000000000000000000',
          currencyAmountRaw: '0x1234',
        },
        transactionOriginType: TransactionOriginType.Internal,
      }

      const preparedTransaction = {
        ...txRequest,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const signedTransaction = '0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a'

      // Mock successful preparation and signing but failed submission
      mockTransactionSigner.prepareTransaction.mockResolvedValue(preparedTransaction)
      mockTransactionSigner.signTransaction.mockResolvedValue(signedTransaction)
      const submitError = new Error('Transaction underpriced')
      mockTransactionSigner.sendTransaction.mockRejectedValue(submitError)

      // Act and Assert
      await expect(service.executeTransaction(executeParams)).rejects.toThrow('Failed to send transaction:')

      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Error), {
        tags: { file: 'TransactionService', function: 'executeTransaction' },
        extra: { chainId: UniverseChainId.Mainnet, transactionType: TransactionType.Send, request: txRequest },
      })
    })

    it('should handle analytics data for swap transactions', async () => {
      // Arrange
      const service = createTestService()

      const mockAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.SignerMnemonic,
      }

      const txRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x0',
        data: '0x123abc',
        nonce: 5,
      }

      const mockAnalyticsData = {
        token_in_symbol: 'ETH',
        token_out_symbol: 'USDC',
        token_in_amount: '1.0',
        token_out_amount: '1700.0',
        routing: 'classic' as const,
        transactionOriginType: 'internal',
      }

      const executeParams: ExecuteTransactionParams = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        options: {
          request: txRequest,
        },
        typeInfo: {
          type: TransactionType.Swap,
          tradeType: 0,
          inputCurrencyId: 'eth',
          outputCurrencyId: 'usdc',
          inputCurrencyAmountRaw: '1000000000000000000',
          expectedOutputCurrencyAmountRaw: '1700000000',
          minimumOutputCurrencyAmountRaw: '1683000000',
        },
        transactionOriginType: TransactionOriginType.Internal,
        analytics: mockAnalyticsData,
      }

      const preparedTransaction = {
        ...txRequest,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const signedTransaction = '0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a'
      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

      // Setup mocks
      mockTransactionSigner.prepareTransaction.mockResolvedValue(preparedTransaction)
      mockTransactionSigner.signTransaction.mockResolvedValue(signedTransaction)
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      const result = await service.executeTransaction(executeParams)

      // Assert
      // 1. Verify transaction completed successfully
      expect(result.transactionHash).toBe(txHash)

      // 2. Verify analytics were tracked for the swap
      expect(mockAnalyticsService.trackSwapSubmitted).toHaveBeenCalledWith(
        expect.objectContaining({
          typeInfo: expect.objectContaining({
            type: TransactionType.Swap,
          }),
          hash: txHash,
        }),
        mockAnalyticsData,
      )
    })

    // Additional tests would be in the individual method test suites for prepareAndSignTransaction and submitTransaction
  })

  describe('getNextNonce', () => {
    it('should calculate nonce based on provider transaction count', async () => {
      // Arrange
      const service = createTestService()
      const mockAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.SignerMnemonic,
      }

      // Mock the transaction count to return a number, not a Promise
      mockGetTransactionCount.mockReturnValue(5)
      mockConfigService.shouldUsePrivateRpc.mockReturnValue(false)

      // Act
      const result = await service.getNextNonce({
        account: mockAccount,
        chainId: UniverseChainId.Mainnet,
      })

      // Assert
      expect(mockGetTransactionCount).toHaveBeenCalledWith(mockAccount.address, 'pending')
      expect(result).toEqual({ nonce: 5 })
    })

    it('should include pending private transactions in nonce calculation', async () => {
      // Arrange
      const service = createTestService()
      const mockAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.SignerMnemonic,
      }

      // Mock the transaction count to return a number, not a Promise
      mockGetTransactionCount.mockReturnValue(5)
      mockConfigService.shouldUsePrivateRpc.mockReturnValue(false)
      mockTransactionRepository.getPendingPrivateTransactionCount.mockResolvedValue(3)

      // Mock that private RPC is supported on the chain
      const mockIsPrivateRpcSupportedOnChain = isPrivateRpcSupportedOnChain as jest.Mock
      mockIsPrivateRpcSupportedOnChain.mockReturnValue(true)

      // Act
      const result = await service.getNextNonce({
        account: mockAccount,
        chainId: UniverseChainId.Mainnet,
      })

      // Assert
      expect(mockGetTransactionCount).toHaveBeenCalledWith(mockAccount.address, 'pending')
      expect(mockTransactionRepository.getPendingPrivateTransactionCount).toHaveBeenCalledWith({
        address: mockAccount.address,
        chainId: UniverseChainId.Mainnet,
      })
      expect(result).toEqual({ nonce: 8, pendingPrivateTxCount: 3 }) // 5 + 3 = 8
    })
  })
})
