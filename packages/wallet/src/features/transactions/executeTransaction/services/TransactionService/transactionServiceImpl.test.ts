/* eslint-disable max-lines */
import { BaseProvider, Provider } from '@ethersproject/providers'
import { AssetType } from 'uniswap/src/entities/assets'
import { AccountMeta, AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import { ExecuteTransactionParams } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { TransactionRepository } from 'wallet/src/features/transactions/executeTransaction/services/TransactionRepository/transactionRepository'
import { TransactionService } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionService'
import { createTransactionService } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionServiceImpl'
import {
  TransactionResponse,
  TransactionSigner,
} from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'
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
    sendTransaction: jest.fn(),
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

  describe('executeTransaction', () => {
    it('should successfully execute a transaction', async () => {
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
        nonce: 5, // Explicitly provide a nonce
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
          tokenAddress: '0x0000000000000000000000000000000000000000', // ETH
          currencyAmountRaw: '0x1234',
        },
        transactionOriginType: TransactionOriginType.Internal,
      }

      // Mock transaction response
      const txResponse: TransactionResponse = {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        confirmations: 0,
        from: mockAccount.address,
        wait: jest.fn().mockResolvedValue({
          status: 1, // success
          gasUsed: { toString: (): string => '21000' },
        }),
      } as unknown as TransactionResponse

      // Setup mock responses
      mockTransactionSigner.signAndSendTransaction.mockResolvedValue({
        transactionResponse: txResponse,
        populatedRequest: { ...txRequest },
        timestampBeforeSend: 1234567890,
      })

      // Act
      const result = await service.executeTransaction(executeParams)

      // Assert
      // 1. Verify transaction was added to repository before sending
      expect(mockTransactionRepository.addTransaction).toHaveBeenCalledWith({
        transaction: expect.objectContaining({
          status: TransactionStatus.Pending,
        }),
      })

      // 2. Verify transaction was signed and sent with the original request including nonce
      expect(mockTransactionSigner.signAndSendTransaction).toHaveBeenCalledWith({
        request: txRequest,
      })

      // 3. Verify transaction was updated in repository after sending
      expect(mockTransactionRepository.updateTransaction).toHaveBeenCalled()

      // 4. Verify transaction hash was returned
      expect(result.transactionResponse.hash).toBe(txResponse.hash)

      // 5. Verify logging happened
      expect(mockLogger.debug).toHaveBeenCalled()
    })

    it('should reject transactions from readonly accounts', async () => {
      // Arrange
      const service = createTestService()

      const mockReadonlyAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.Readonly,
      }

      const txRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234',
        data: '0x123abc',
      }

      const executeParams: ExecuteTransactionParams = {
        chainId: UniverseChainId.Mainnet,
        account: mockReadonlyAccount,
        options: {
          request: txRequest,
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

      // Act & Assert
      await expect(service.executeTransaction(executeParams)).rejects.toThrow('Account must support signing')

      // Verify that no transaction was added to repository
      expect(mockTransactionRepository.addTransaction).not.toHaveBeenCalled()

      // Verify that signing was never attempted
      expect(mockTransactionSigner.signAndSendTransaction).not.toHaveBeenCalled()
    })

    it('should calculate nonce automatically when not provided', async () => {
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
        // Note: No nonce provided here
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
          tokenAddress: '0x0000000000000000000000000000000000000000', // ETH
          currencyAmountRaw: '0x1234',
        },
        transactionOriginType: TransactionOriginType.Internal,
      }

      // Setup mock responses - Important: Use a number not a Promise
      mockGetTransactionCount.mockReturnValue(42)

      // Mock transaction response
      const txResponse = {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        confirmations: 0,
        from: mockAccount.address,
        wait: jest.fn().mockResolvedValue({
          status: 1,
          gasUsed: { toString: (): string => '21000' },
        }),
      } as unknown as TransactionResponse

      // Mock the signAndSendTransaction to capture the request object with nonce
      const requestWithNonce = { ...txRequest, nonce: 42 }
      mockTransactionSigner.signAndSendTransaction.mockImplementation(async () => {
        // Return the transaction response
        return {
          transactionResponse: txResponse,
          populatedRequest: requestWithNonce,
          timestampBeforeSend: 1234567890,
        }
      })

      // Act
      const result = await service.executeTransaction(executeParams)

      // Assert
      // 1. Verify transaction was added to repository
      expect(mockTransactionRepository.addTransaction).toHaveBeenCalled()

      // 2. Verify the provider's getTransactionCount was called to calculate the nonce
      expect(mockGetTransactionCount).toHaveBeenCalledWith(mockAccount.address, 'pending')

      // 3. Verify that signAndSendTransaction was called with a request that includes the nonce
      // Since the service modifies the input object, we can't check by direct matching
      expect(mockTransactionSigner.signAndSendTransaction).toHaveBeenCalled()

      // 4. Verify transaction was updated with the hash
      expect(mockTransactionRepository.updateTransaction).toHaveBeenCalled()

      // 5. Verify the response contains the hash
      expect(result.transactionResponse.hash).toBe(txResponse.hash)
    })

    it('should properly handle and categorize transaction errors', async () => {
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
          tokenAddress: '0x0000000000000000000000000000000000000000', // ETH
          currencyAmountRaw: '0x1234',
        },
        transactionOriginType: TransactionOriginType.Internal,
      }

      // Create a realistic RPC error
      const rpcError = new Error('transaction underpriced')
      rpcError.message = 'transaction underpriced'

      // Mock transaction signer to throw the error
      mockTransactionSigner.signAndSendTransaction.mockRejectedValue(rpcError)

      // Act and Assert
      await expect(service.executeTransaction(executeParams)).rejects.toThrow('Failed to send transaction:')

      // Verify that transaction was added as pending first
      expect(mockTransactionRepository.addTransaction).toHaveBeenCalledWith({
        transaction: expect.objectContaining({
          status: TransactionStatus.Pending,
        }),
      })

      // Verify that transaction was properly finalized as failed
      expect(mockTransactionRepository.finalizeTransaction).toHaveBeenCalledWith({
        transaction: expect.anything(),
        status: TransactionStatus.Failed,
      })

      // Verify that errors were properly logged
      expect(mockLogger.warn).toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should handle user rejected signing', async () => {
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
          tokenAddress: '0x0000000000000000000000000000000000000000', // ETH
          currencyAmountRaw: '0x1234',
        },
        transactionOriginType: TransactionOriginType.Internal,
      }

      // Create a user rejected signing error
      const userRejectedError = new Error('User rejected request')
      userRejectedError.message = 'User rejected request'

      // Mock transaction signer to throw the error
      mockTransactionSigner.signAndSendTransaction.mockRejectedValue(userRejectedError)

      // Act and Assert
      await expect(service.executeTransaction(executeParams)).rejects.toThrow('Failed to send transaction:')

      // Verify that transaction was added as pending first
      expect(mockTransactionRepository.addTransaction).toHaveBeenCalledWith({
        transaction: expect.objectContaining({
          status: TransactionStatus.Pending,
        }),
      })

      // Verify that transaction was properly finalized as failed
      expect(mockTransactionRepository.finalizeTransaction).toHaveBeenCalledWith({
        transaction: expect.anything(),
        status: TransactionStatus.Failed,
      })
    })

    it('should track analytics for swap transactions', async () => {
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

      // Mock analytics data
      const mockAnalyticsData = {
        token_in_symbol: 'ETH',
        token_out_symbol: 'USDC',
        token_in_amount: '1.0',
        token_out_amount: '1700.0',
        routing: 'classic' as const, // Cast to the correct type
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
          tradeType: 0, // EXACT_INPUT
          inputCurrencyId: 'eth',
          outputCurrencyId: 'usdc',
          inputCurrencyAmountRaw: '1000000000000000000',
          expectedOutputCurrencyAmountRaw: '1700000000',
          minimumOutputCurrencyAmountRaw: '1683000000',
        },
        transactionOriginType: TransactionOriginType.Internal,
        // Include analytics data
        analytics: mockAnalyticsData,
      }

      // Mock transaction response
      const txResponse: TransactionResponse = {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        confirmations: 0,
        from: mockAccount.address,
        wait: jest.fn().mockResolvedValue({
          status: 1,
          gasUsed: { toString: (): string => '21000' },
        }),
      } as unknown as TransactionResponse

      // Setup mock responses
      mockTransactionSigner.signAndSendTransaction.mockResolvedValue({
        transactionResponse: txResponse,
        populatedRequest: { ...txRequest },
        timestampBeforeSend: 1234567890,
      })

      // Act
      await service.executeTransaction(executeParams)

      // Assert
      // Verify analytics was called with the right data
      expect(mockAnalyticsService.trackSwapSubmitted).toHaveBeenCalledTimes(1)
      expect(mockAnalyticsService.trackSwapSubmitted).toHaveBeenCalledWith(
        expect.objectContaining({
          typeInfo: expect.objectContaining({
            type: TransactionType.Swap,
          }),
          hash: txResponse.hash,
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

      const txRequest = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x0',
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
          type: TransactionType.Swap,
          tradeType: 0, // EXACT_INPUT
          inputCurrencyId: 'eth',
          outputCurrencyId: 'usdc',
          inputCurrencyAmountRaw: '1000000000000000000',
          expectedOutputCurrencyAmountRaw: '1700000000',
          minimumOutputCurrencyAmountRaw: '1683000000',
        },
        transactionOriginType: TransactionOriginType.Internal,
        // Note: No analytics provided here, which should trigger an error log
      }

      // Mock transaction response
      const txResponse: TransactionResponse = {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        confirmations: 0,
        from: mockAccount.address,
        wait: jest.fn().mockResolvedValue({
          status: 1,
          gasUsed: { toString: (): string => '21000' },
        }),
      } as unknown as TransactionResponse

      // Setup mock responses
      mockTransactionSigner.signAndSendTransaction.mockResolvedValue({
        transactionResponse: txResponse,
        populatedRequest: { ...txRequest },
        timestampBeforeSend: 1234567890,
      })

      // Act
      await service.executeTransaction(executeParams)

      // Assert
      // Verify that analytics was NOT called
      expect(mockAnalyticsService.trackSwapSubmitted).not.toHaveBeenCalled()

      // Verify that error was logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: { file: 'TransactionService', function: 'sendTransaction' },
          extra: expect.anything(),
        }),
      )
    })

    it('should use configured private RPC when submitViaPrivateRpc is true', async () => {
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
          submitViaPrivateRpc: true, // Request to use private RPC
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

      // Mock config service to indicate private RPC should be used
      mockConfigService.shouldUsePrivateRpc.mockReturnValue(true)
      // Indicate private RPC is enabled for this chain
      mockConfigService.isPrivateRpcEnabled.mockReturnValue(true)

      // Mock the private RPC configuration
      mockConfigService.getPrivateRpcConfig.mockReturnValue({
        flashbotsEnabled: true,
      })

      // Mock that private nonce is different to verify it's used
      mockGetTransactionCount.mockReturnValue(10) // Regular provider nonce

      // Mock transaction response
      const txResponse: TransactionResponse = {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        confirmations: 0,
        from: mockAccount.address,
        wait: jest.fn().mockResolvedValue({
          status: 1,
          gasUsed: { toString: (): string => '21000' },
        }),
      } as unknown as TransactionResponse

      // Setup mock responses
      mockTransactionSigner.signAndSendTransaction.mockResolvedValue({
        transactionResponse: txResponse,
        populatedRequest: { ...txRequest, nonce: 10 },
        timestampBeforeSend: 1234567890,
      })

      // Act
      await service.executeTransaction(executeParams)

      // Assert
      // Verify that the config service was called to check if private RPC should be used
      expect(mockConfigService.shouldUsePrivateRpc).toHaveBeenCalledWith({
        chainId: UniverseChainId.Mainnet,
        submitViaPrivateRpc: true,
      })

      // Verify transaction was successfully processed
      expect(mockTransactionRepository.addTransaction).toHaveBeenCalled()
      expect(mockTransactionSigner.signAndSendTransaction).toHaveBeenCalled()
      expect(mockTransactionRepository.updateTransaction).toHaveBeenCalled()
    })

    it('should correctly update transaction status after successful submission', async () => {
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
          tokenAddress: '0x0000000000000000000000000000000000000000', // ETH
          currencyAmountRaw: '0x1234',
        },
        transactionOriginType: TransactionOriginType.Internal,
      }

      // Mock transaction response
      const txResponse: TransactionResponse = {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        confirmations: 0,
        from: mockAccount.address,
        wait: jest.fn().mockResolvedValue({
          status: 1, // success
          gasUsed: { toString: (): string => '21000' },
        }),
      } as unknown as TransactionResponse

      // Create a spy on the transaction state transitions
      const addTxCaptor = jest.fn()
      const updateTxCaptor = jest.fn()

      // Override the mock implementation to capture transaction state
      mockTransactionRepository.addTransaction.mockImplementation((input) => {
        addTxCaptor(input.transaction)
        return Promise.resolve()
      })

      mockTransactionRepository.updateTransaction.mockImplementation((input) => {
        updateTxCaptor(input.transaction)
        return Promise.resolve()
      })

      // Setup mock responses
      mockTransactionSigner.signAndSendTransaction.mockResolvedValue({
        transactionResponse: txResponse,
        populatedRequest: { ...txRequest },
        timestampBeforeSend: 1234567890,
      })

      // Act
      await service.executeTransaction(executeParams)

      // Assert
      // Verify transaction was initially added with pending status and no hash
      expect(addTxCaptor).toHaveBeenCalled()
      const initialTx = addTxCaptor.mock.calls[0][0]
      expect(initialTx.status).toBe(TransactionStatus.Pending)
      expect(initialTx.hash).toBeUndefined()

      // Verify transaction was updated with the hash and still in pending status
      expect(updateTxCaptor).toHaveBeenCalled()
      const updatedTx = updateTxCaptor.mock.calls[0][0]
      expect(updatedTx.hash).toBe(txResponse.hash)
      expect(updatedTx.status).toBe(TransactionStatus.Pending)
    })

    it('should retrieve current block number during transaction processing', async () => {
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
          tokenAddress: '0x0000000000000000000000000000000000000000', // ETH
          currencyAmountRaw: '0x1234',
        },
        transactionOriginType: TransactionOriginType.Internal,
      }

      // Mock transaction response
      const txResponse: TransactionResponse = {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        confirmations: 0,
        from: mockAccount.address,
        wait: jest.fn().mockResolvedValue({
          status: 1, // success
          gasUsed: { toString: (): string => '21000' },
        }),
      } as unknown as TransactionResponse

      // Block number being fetched should be the mocked value (123456)
      mockGetInternalBlockNumber.mockReturnValue(123456)

      // Setup mock responses
      mockTransactionSigner.signAndSendTransaction.mockResolvedValue({
        transactionResponse: txResponse,
        populatedRequest: { ...txRequest },
        timestampBeforeSend: 1234567890,
      })

      // Act
      await service.executeTransaction(executeParams)

      // Assert
      // Verify block number was retrieved
      expect(mockGetInternalBlockNumber).toHaveBeenCalled()
      expect(mockTransactionRepository.updateTransaction).toHaveBeenCalledWith({
        transaction: expect.objectContaining({
          hash: txResponse.hash,
          status: TransactionStatus.Pending,
        }),
      })
    })

    it('should process a bridge transaction with analytics', async () => {
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

      // Mock bridge analytics data
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

      const executeParams: ExecuteTransactionParams = {
        chainId: UniverseChainId.Mainnet,
        account: mockAccount,
        options: {
          request: txRequest,
        },
        typeInfo: {
          type: TransactionType.Bridge,
          inputCurrencyId: 'eth',
          inputCurrencyAmountRaw: '1000000000000000000',
          outputCurrencyId: 'matic',
          outputCurrencyAmountRaw: '1700000000000000000',
        },
        transactionOriginType: TransactionOriginType.Internal,
        analytics: mockBridgeAnalyticsData,
      }

      // Mock transaction response
      const txResponse: TransactionResponse = {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        confirmations: 0,
        from: mockAccount.address,
        wait: jest.fn().mockResolvedValue({
          status: 1, // success
          gasUsed: { toString: (): string => '21000' },
        }),
      } as unknown as TransactionResponse

      // Setup mock responses
      mockTransactionSigner.signAndSendTransaction.mockResolvedValue({
        transactionResponse: txResponse,
        populatedRequest: { ...txRequest },
        timestampBeforeSend: 1234567890,
      })

      // Act
      await service.executeTransaction(executeParams)

      // Assert
      // Verify transaction was added to repository
      expect(mockTransactionRepository.addTransaction).toHaveBeenCalled()

      // Verify transaction was signed and sent
      expect(mockTransactionSigner.signAndSendTransaction).toHaveBeenCalled()

      // Verify transaction was updated in repository
      expect(mockTransactionRepository.updateTransaction).toHaveBeenCalled()

      // Verify analytics for bridge was called
      expect(mockAnalyticsService.trackSwapSubmitted).toHaveBeenCalledWith(
        expect.objectContaining({
          typeInfo: expect.objectContaining({
            type: TransactionType.Bridge,
          }),
          hash: txResponse.hash,
        }),
        mockBridgeAnalyticsData,
      )
    })

    it('should properly handle transactions with initial hash value', async () => {
      // Arrange
      const service = createTestService()

      const mockAccount: AccountMeta = {
        address: '0x1234567890123456789012345678901234567890',
        type: AccountType.SignerMnemonic,
      }

      const initialHash = '0x9876543210987654321098765432109876543210987654321098765432109876'

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
          tokenAddress: '0x0000000000000000000000000000000000000000', // ETH
          currencyAmountRaw: '0x1234',
        },
        transactionOriginType: TransactionOriginType.Internal,
      }

      // Mock transaction response with hash that's different from initial hash
      const txResponse: TransactionResponse = {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        confirmations: 0,
        from: mockAccount.address,
        wait: jest.fn().mockResolvedValue({
          status: 1, // success
          gasUsed: { toString: (): string => '21000' },
        }),
      } as unknown as TransactionResponse

      // Create a spy on the transaction state to capture the transaction details
      const addTxCaptor = jest.fn()

      // Override the mock implementation to capture transaction state and add a hash
      mockTransactionRepository.addTransaction.mockImplementation((input) => {
        // Capture the transaction and add a hash to simulate a transaction already having a hash
        const tx = {
          ...input.transaction,
          hash: initialHash,
        }
        addTxCaptor(tx)
        return Promise.resolve()
      })

      // Setup mock responses
      mockTransactionSigner.signAndSendTransaction.mockResolvedValue({
        transactionResponse: txResponse,
        populatedRequest: { ...txRequest },
        timestampBeforeSend: 1234567890,
      })

      // Act
      await service.executeTransaction(executeParams)

      // Assert
      // Verify transaction was added to repository
      expect(mockTransactionRepository.addTransaction).toHaveBeenCalled()

      // Verify transaction was signed and sent
      expect(mockTransactionSigner.signAndSendTransaction).toHaveBeenCalled()

      // Verify transaction was updated with new hash
      expect(mockTransactionRepository.updateTransaction).toHaveBeenCalledWith({
        transaction: expect.objectContaining({
          hash: txResponse.hash, // Should be updated to the new hash
        }),
      })
    })
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
