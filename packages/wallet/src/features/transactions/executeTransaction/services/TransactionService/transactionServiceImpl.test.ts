import { BaseProvider, JsonRpcProvider, Provider, TransactionReceipt } from '@ethersproject/providers'
import { BigNumber, utils } from 'ethers'
import { AssetType } from 'uniswap/src/entities/assets'
import { AccountMeta, AccountType, SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ensure0xHex } from 'utilities/src/addresses/hex'
import { logger } from 'utilities/src/logger/logger'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import { ExecuteTransactionParams } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { AnalyticsService } from 'wallet/src/features/transactions/executeTransaction/services/analyticsService'
import { TransactionRepository } from 'wallet/src/features/transactions/executeTransaction/services/TransactionRepository/transactionRepository'
import {
  PrepareTransactionParams,
  SubmitTransactionParams,
  SubmitTransactionParamsWithTypeInfo,
  TransactionService,
} from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionService'
import { createTransactionService } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionServiceImpl'
import { TransactionSigner } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'
import { TransactionConfigService } from 'wallet/src/features/transactions/executeTransaction/services/transactionConfigService'

// Mock external utilities
jest.mock('wallet/src/features/providers/utils', () => ({
  isPrivateRpcSupportedOnChain: jest.fn(),
}))

// Mock ethers utils
jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  utils: {
    ...jest.requireActual('ethers').utils,
    keccak256: jest.fn(),
  },
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

  // Mock Date.now to return a consistent timestamp
  let dateNowSpy: jest.SpyInstance

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Date.now to return consistent timestamp
    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1234567890)

    // Reset the mocks with their default implementations
    mockGetTransactionCount.mockImplementation(() => Promise.resolve(42))

    // Setup default mock for private RPC support check
    const mockIsPrivateRpcSupportedOnChain = isPrivateRpcSupportedOnChain as jest.Mock
    mockIsPrivateRpcSupportedOnChain.mockReturnValue(false)

    // Setup keccak256 mock to return a predictable hash
    const mockKeccak256 = utils.keccak256 as jest.Mock
    mockKeccak256.mockReturnValue('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
  })

  // Restore Date.now after each test
  afterEach(() => {
    dateNowSpy.mockRestore()
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

  // Helper functions to consolidate params creation
  const createMockAccount = (): SignerMnemonicAccountMeta => ({
    address: '0x1234567890123456789012345678901234567890',
    type: AccountType.SignerMnemonic,
  })

  const createPrepareTransactionParams = (
    overrides: Partial<PrepareTransactionParams> = {},
  ): PrepareTransactionParams => ({
    chainId: UniverseChainId.Mainnet,
    account: createMockAccount(),
    request: {
      to: '0xabcdef1234567890123456789012345678901234',
      value: '0x1234',
      data: '0x123abc',
      chainId: UniverseChainId.Mainnet,
      nonce: 5,
    },
    submitViaPrivateRpc: false,
    ...overrides,
  })

  const createSubmitTransactionParams = (
    overrides: Partial<SubmitTransactionParams> = {},
  ): SubmitTransactionParamsWithTypeInfo => {
    const defaultValidatedRequest = {
      to: '0xabcdef1234567890123456789012345678901234',
      value: '0x1234',
      data: '0x123abc',
      nonce: 5,
      gasLimit: '0x5208',
      gasPrice: '0x9184e72a000',
      chainId: UniverseChainId.Mainnet,
    }

    const defaultSignedRequest = ensure0xHex(
      '0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a',
    )

    const defaultTypeInfo: TransactionTypeInfo = {
      type: TransactionType.Send,
      assetType: AssetType.Currency,
      recipient: '0xabcdef1234567890123456789012345678901234',
      tokenAddress: '0x0000000000000000000000000000000000000000',
      currencyAmountRaw: '0x1234',
    }

    return {
      chainId: UniverseChainId.Mainnet,
      account: createMockAccount(),
      request: {
        request: defaultValidatedRequest,
        signedRequest: defaultSignedRequest,
        timestampBeforeSign: 1234567890,
      },
      options: {
        request: defaultValidatedRequest,
        submitViaPrivateRpc: false,
      },
      typeInfo: defaultTypeInfo,
      transactionOriginType: TransactionOriginType.Internal,
      ...overrides,
    }
  }

  describe('prepareAndSignTransaction', () => {
    it('should successfully prepare and sign a transaction with provided nonce', async () => {
      // Arrange
      const service = createTestService()

      const txRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
        chainId: UniverseChainId.Mainnet,
        nonce: 5, // Provided nonce
      }

      const params = createPrepareTransactionParams({
        request: txRequest,
      })

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
        timestampBeforeSign: 1234567890,
      })
    })

    it('should calculate nonce when not provided', async () => {
      // Arrange
      const service = createTestService()

      const txRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
        chainId: UniverseChainId.Mainnet,
        // No nonce provided
      }

      const params = createPrepareTransactionParams({
        request: txRequest,
      })

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
      expect(mockGetTransactionCount).toHaveBeenCalledWith(params.account.address, 'pending')
      expect(mockTransactionSigner.prepareTransaction).toHaveBeenCalledWith({
        request: requestWithNonce,
      })
      expect(mockTransactionSigner.signTransaction).toHaveBeenCalledWith(preparedTransaction)
      expect(result).toEqual({
        request: preparedTransaction,
        signedRequest: signedTransaction,
        timestampBeforeSign: 1234567890,
      })
    })

    it('should throw error when transaction validation fails', async () => {
      // Arrange
      const service = createTestService()

      const txRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
        chainId: UniverseChainId.Mainnet,
        nonce: 5,
      }

      const params = createPrepareTransactionParams({
        request: txRequest,
      })

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

      const txRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
        chainId: UniverseChainId.Mainnet,
      }

      const params = createPrepareTransactionParams({
        request: txRequest,
        submitViaPrivateRpc: true,
      })

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
        timestampBeforeSign: 1234567890,
      })
    })
  })

  describe('submitTransaction', () => {
    it('should successfully submit a signed transaction', async () => {
      // Arrange
      const service = createTestService()

      const params = createSubmitTransactionParams()

      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

      // Setup mocks
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      const result = await service.submitTransaction(params)

      // Assert immediate response
      // Hash should be calculated from the signed request, not the actual submission response
      expect(result.transactionHash).toBeDefined()
      expect(typeof result.transactionHash).toBe('string')
      expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/)

      // Wait for background operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Assert background operations
      expect(mockTransactionRepository.addTransaction).toHaveBeenCalledWith({
        transaction: expect.objectContaining({
          status: TransactionStatus.Pending,
        }),
      })
      expect(mockTransactionSigner.sendTransaction).toHaveBeenCalledWith({
        signedTx: params.request.signedRequest,
      })
      expect(mockTransactionRepository.updateTransaction).toHaveBeenCalledWith({
        transaction: expect.objectContaining({
          hash: txHash,
          status: TransactionStatus.Pending,
        }),
        skipProcessing: false,
      })
    })

    it('should track analytics for swap transactions', async () => {
      // Arrange
      const service = createTestService()

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

      const validatedRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x0',
        data: '0x123abc',
        nonce: 5,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const params = createSubmitTransactionParams({
        request: {
          request: validatedRequest,
          signedRequest: ensure0xHex('0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a'),
          timestampBeforeSign: 1234567890,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo,
        analytics: mockAnalyticsData,
      })

      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

      // Setup mocks
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      await service.submitTransaction(params)

      // Wait for background operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

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

      const typeInfo: TransactionTypeInfo = {
        type: TransactionType.Swap,
        tradeType: 0,
        inputCurrencyId: 'eth',
        outputCurrencyId: 'usdc',
        inputCurrencyAmountRaw: '1000000000000000000',
        expectedOutputCurrencyAmountRaw: '1700000000',
        minimumOutputCurrencyAmountRaw: '1683000000',
      }

      const validatedRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x0',
        data: '0x123abc',
        nonce: 5,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const params = createSubmitTransactionParams({
        request: {
          request: validatedRequest,
          signedRequest: ensure0xHex('0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a'),
          timestampBeforeSign: 1234567890,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo,
        // Note: No analytics provided
      })

      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

      // Setup mocks
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      await service.submitTransaction(params)

      // Wait for background operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

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

      const params = createSubmitTransactionParams()

      const rpcError = new Error('transaction underpriced')

      // Setup mocks
      mockTransactionSigner.sendTransaction.mockRejectedValue(rpcError)

      // Act
      const result = await service.submitTransaction(params)

      // Assert immediate response - should return hash despite background error
      expect(result.transactionHash).toBeDefined()
      expect(typeof result.transactionHash).toBe('string')
      expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/)

      // Wait for background operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Assert background error handling
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

      const params = createSubmitTransactionParams({
        typeInfo,
        analytics: mockBridgeAnalyticsData,
      })

      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

      // Setup mocks
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      await service.submitTransaction(params)

      // Wait for background operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

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

      const typeInfo: TransactionTypeInfo = {
        type: TransactionType.Swap,
        tradeType: 0,
        inputCurrencyId: 'eth',
        outputCurrencyId: 'usdc',
        inputCurrencyAmountRaw: '1000000000000000000',
        expectedOutputCurrencyAmountRaw: '1700000000',
        minimumOutputCurrencyAmountRaw: '1683000000',
      }

      const validatedRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x0',
        data: '0x123abc',
        nonce: 5,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const params = createSubmitTransactionParams({
        request: {
          request: validatedRequest,
          signedRequest: ensure0xHex('0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a'),
          timestampBeforeSign: 1234567890,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo,
        transactionOriginType: TransactionOriginType.External, // External origin
        // Note: No analytics provided for external transaction
      })

      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

      // Setup mocks
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      await service.submitTransaction(params)

      // Wait for background operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

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
    ): SubmitTransactionParamsWithTypeInfo => {
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
          timestampBeforeSign: 1234567890,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo: overrides.typeInfo || defaultTypeInfo,
        transactionOriginType: overrides.transactionOriginType || TransactionOriginType.Internal,
        ...(overrides.analytics && { analytics: overrides.analytics }),
      } as SubmitTransactionParamsWithTypeInfo
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
      const typeInfo: TransactionTypeInfo = {
        type: TransactionType.Swap,
        tradeType: 0,
        inputCurrencyId: 'eth',
        outputCurrencyId: 'usdc',
        inputCurrencyAmountRaw: '1000000000000000000',
        expectedOutputCurrencyAmountRaw: '1700000000',
        minimumOutputCurrencyAmountRaw: '1683000000',
      }

      const validatedRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x0',
        data: '0x123abc',
        nonce: 5,
        gasLimit: '0x5208',
        gasPrice: '0x9184e72a000',
        chainId: UniverseChainId.Mainnet,
      }

      const params = createSubmitTransactionParams({
        request: {
          request: validatedRequest,
          signedRequest: ensure0xHex('0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a'),
          timestampBeforeSign: 1234567890,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo,
        // Note: No analytics provided
      })

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

      const params = createSubmitTransactionParams({
        request: {
          request: validatedRequest,
          signedRequest: ensure0xHex('0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a'),
          timestampBeforeSign: 1234567890,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo,
      })

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

      const params = createSubmitTransactionParams({
        request: {
          request: validatedRequest,
          signedRequest: ensure0xHex('0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a'),
          timestampBeforeSign: 1234567890,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo,
        analytics: mockBridgeAnalyticsData,
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

      const params = createSubmitTransactionParams({
        request: {
          request: validatedRequest,
          signedRequest: ensure0xHex('0xf86c808509184e72a0008252089412345678901234567890123456789012345678908201234a'),
          timestampBeforeSign: 1234567890,
        },
        options: {
          request: validatedRequest,
          submitViaPrivateRpc: false,
        },
        typeInfo,
        transactionOriginType: TransactionOriginType.External, // External origin
        // Note: No analytics provided for external transaction
      })

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
      // Note: updateTransaction now happens asynchronously in the background

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

      // Act
      const result = await service.executeTransaction(executeParams)

      // Assert immediate response - should return hash immediately despite background submission error
      expect(result.transactionHash).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')

      // Wait for background operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verify error was logged for background submission failure
      expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Error), {
        tags: { file: 'TransactionService', function: 'submitTransaction' },
        extra: expect.objectContaining({
          context: 'Background submission failed',
        }),
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

      // Wait for background operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

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

  describe('trackTransactionAnalytics', () => {
    // Test the trackTransactionAnalytics function behavior through service methods

    const mockAnalyticsData = {
      token_in_symbol: 'ETH',
      token_out_symbol: 'USDC',
      token_in_amount: '1.0',
      token_out_amount: '1700.0',
      routing: 'classic' as const,
      transactionOriginType: 'internal',
    }

    it('should track analytics for swap transactions with analytics data', async () => {
      // Arrange
      const service = createTestService()

      const swapTypeInfo: TransactionTypeInfo = {
        type: TransactionType.Swap,
        tradeType: 0,
        inputCurrencyId: 'eth',
        outputCurrencyId: 'usdc',
        inputCurrencyAmountRaw: '1000000000000000000',
        expectedOutputCurrencyAmountRaw: '1700000000',
        minimumOutputCurrencyAmountRaw: '1683000000',
      }

      const params = createSubmitTransactionParams({
        typeInfo: swapTypeInfo,
        analytics: mockAnalyticsData,
        transactionOriginType: TransactionOriginType.Internal,
      })

      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      await service.submitTransaction(params)
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Assert
      expect(mockAnalyticsService.trackSwapSubmitted).toHaveBeenCalledWith(
        expect.objectContaining({
          typeInfo: swapTypeInfo,
          hash: txHash,
        }),
        mockAnalyticsData,
      )
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it('should log error for internal swap transactions without analytics data', async () => {
      // Arrange
      const service = createTestService()

      const swapTypeInfo: TransactionTypeInfo = {
        type: TransactionType.Swap,
        tradeType: 0,
        inputCurrencyId: 'eth',
        outputCurrencyId: 'usdc',
        inputCurrencyAmountRaw: '1000000000000000000',
        expectedOutputCurrencyAmountRaw: '1700000000',
        minimumOutputCurrencyAmountRaw: '1683000000',
      }

      const params = createSubmitTransactionParams({
        typeInfo: swapTypeInfo,
        transactionOriginType: TransactionOriginType.Internal,
        // Note: No analytics provided
      })

      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      await service.submitTransaction(params)
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Assert
      expect(mockAnalyticsService.trackSwapSubmitted).not.toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing `analytics` for swap when calling `sendTransaction`',
        }),
        expect.objectContaining({
          tags: { file: 'TransactionService', function: 'sendTransaction' },
          extra: expect.objectContaining({
            transaction: expect.objectContaining({
              typeInfo: swapTypeInfo,
            }),
          }),
        }),
      )
    })

    it('should track analytics for bridge transactions with analytics data', async () => {
      // Arrange
      const service = createTestService()

      const bridgeTypeInfo: TransactionTypeInfo = {
        type: TransactionType.Bridge,
        inputCurrencyId: 'eth',
        inputCurrencyAmountRaw: '1000000000000000000',
        outputCurrencyId: 'matic',
        outputCurrencyAmountRaw: '1700000000000000000',
      }

      const bridgeAnalyticsData = {
        token_in_symbol: 'ETH',
        token_out_symbol: 'MATIC',
        token_in_amount: '1.0',
        token_out_amount: '1700.0',
        routing: 'bridge' as const,
        transactionOriginType: 'internal',
        chain_id_in: UniverseChainId.Mainnet,
        chain_id_out: UniverseChainId.Polygon,
      }

      const params = createSubmitTransactionParams({
        typeInfo: bridgeTypeInfo,
        analytics: bridgeAnalyticsData,
        transactionOriginType: TransactionOriginType.Internal,
      })

      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      await service.submitTransaction(params)
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Assert
      expect(mockAnalyticsService.trackSwapSubmitted).toHaveBeenCalledWith(
        expect.objectContaining({
          typeInfo: bridgeTypeInfo,
          hash: txHash,
        }),
        bridgeAnalyticsData,
      )
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it('should log error for internal bridge transactions without analytics data', async () => {
      // Arrange
      const service = createTestService()

      const bridgeTypeInfo: TransactionTypeInfo = {
        type: TransactionType.Bridge,
        inputCurrencyId: 'eth',
        inputCurrencyAmountRaw: '1000000000000000000',
        outputCurrencyId: 'matic',
        outputCurrencyAmountRaw: '1700000000000000000',
      }

      const params = createSubmitTransactionParams({
        typeInfo: bridgeTypeInfo,
        transactionOriginType: TransactionOriginType.Internal,
        // Note: No analytics provided
      })

      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      await service.submitTransaction(params)
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Assert
      expect(mockAnalyticsService.trackSwapSubmitted).not.toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing `analytics` for swap when calling `sendTransaction`',
        }),
        expect.objectContaining({
          tags: { file: 'TransactionService', function: 'sendTransaction' },
          extra: expect.objectContaining({
            transaction: expect.objectContaining({
              typeInfo: bridgeTypeInfo,
            }),
          }),
        }),
      )
    })

    it('should NOT log error for non-swap/bridge transactions without analytics data', async () => {
      // Arrange
      const service = createTestService()

      const sendTypeInfo: TransactionTypeInfo = {
        type: TransactionType.Send,
        assetType: AssetType.Currency,
        recipient: '0xabcdef1234567890123456789012345678901234',
        tokenAddress: '0x0000000000000000000000000000000000000000',
        currencyAmountRaw: '0x1234',
      }

      const params = createSubmitTransactionParams({
        typeInfo: sendTypeInfo,
        transactionOriginType: TransactionOriginType.Internal,
        // Note: No analytics provided
      })

      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      await service.submitTransaction(params)
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Assert
      expect(mockAnalyticsService.trackSwapSubmitted).not.toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Missing `analytics`'),
        }),
        expect.anything(),
      )
    })

    it('should NOT log error for external swap transactions without analytics data', async () => {
      // Arrange
      const service = createTestService()

      const swapTypeInfo: TransactionTypeInfo = {
        type: TransactionType.Swap,
        tradeType: 0,
        inputCurrencyId: 'eth',
        outputCurrencyId: 'usdc',
        inputCurrencyAmountRaw: '1000000000000000000',
        expectedOutputCurrencyAmountRaw: '1700000000',
        minimumOutputCurrencyAmountRaw: '1683000000',
      }

      const params = createSubmitTransactionParams({
        typeInfo: swapTypeInfo,
        transactionOriginType: TransactionOriginType.External, // External transaction
        // Note: No analytics provided
      })

      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      await service.submitTransaction(params)
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Assert
      expect(mockAnalyticsService.trackSwapSubmitted).not.toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Missing `analytics`'),
        }),
        expect.anything(),
      )
    })

    it('should NOT log error for external bridge transactions without analytics data', async () => {
      // Arrange
      const service = createTestService()

      const bridgeTypeInfo: TransactionTypeInfo = {
        type: TransactionType.Bridge,
        inputCurrencyId: 'eth',
        inputCurrencyAmountRaw: '1000000000000000000',
        outputCurrencyId: 'matic',
        outputCurrencyAmountRaw: '1700000000000000000',
      }

      const params = createSubmitTransactionParams({
        typeInfo: bridgeTypeInfo,
        transactionOriginType: TransactionOriginType.External, // External transaction
        // Note: No analytics provided
      })

      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      mockTransactionSigner.sendTransaction.mockResolvedValue(txHash)

      // Act
      await service.submitTransaction(params)
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Assert
      expect(mockAnalyticsService.trackSwapSubmitted).not.toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Missing `analytics`'),
        }),
        expect.anything(),
      )
    })

    it('should work correctly in submitTransactionSync for swap transactions', async () => {
      // Arrange
      const swapTypeInfo: TransactionTypeInfo = {
        type: TransactionType.Swap,
        tradeType: 0,
        inputCurrencyId: 'eth',
        outputCurrencyId: 'usdc',
        inputCurrencyAmountRaw: '1000000000000000000',
        expectedOutputCurrencyAmountRaw: '1700000000',
        minimumOutputCurrencyAmountRaw: '1683000000',
      }

      const params = createSubmitTransactionParams({
        typeInfo: swapTypeInfo,
        transactionOriginType: TransactionOriginType.Internal,
        // Note: No analytics provided
      })

      const syncService = createTestServiceWithJsonRpc()
      const mockReceipt = createMockFormattedReceipt()
      mockTransactionSigner.sendTransactionSync.mockResolvedValue(mockReceipt)

      // Act
      await syncService.submitTransactionSync(params)

      // Assert
      expect(mockAnalyticsService.trackSwapSubmitted).not.toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing `analytics` for swap when calling `submitTransactionSync`',
        }),
        expect.objectContaining({
          tags: { file: 'TransactionService', function: 'submitTransactionSync' },
          extra: expect.objectContaining({
            transaction: expect.objectContaining({
              typeInfo: swapTypeInfo,
            }),
          }),
        }),
      )
    })

    // Helper function for sync tests - reuse from existing code
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

    const createMockJsonRpcProvider = (): JsonRpcProvider => {
      const mockSend = jest.fn().mockResolvedValue({})
      const mockFormatterReceipt = jest.fn().mockImplementation(() => createMockFormattedReceipt())

      return {
        ...mockBaseProvider,
        send: mockSend,
        formatter: {
          receipt: mockFormatterReceipt,
        },
      } as unknown as JsonRpcProvider
    }

    const createMockFormattedReceipt = (): TransactionReceipt =>
      ({
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: 0x123456,
        gasUsed: BigNumber.from('0x5208'),
        status: 1,
        blockHash: '0xblock123',
        transactionIndex: 0,
        from: '0x1234567890123456789012345678901234567890',
        to: '0xabcdef1234567890123456789012345678901234',
        logs: [],
        cumulativeGasUsed: BigNumber.from('0x5208'),
        effectiveGasPrice: BigNumber.from('0x9184e72a000'),
        contractAddress: null,
        logsBloom: '0x0',
        root: '0x0',
        type: 2,
        byzantium: true,
        confirmations: 1,
      }) as unknown as TransactionReceipt
  })
})
