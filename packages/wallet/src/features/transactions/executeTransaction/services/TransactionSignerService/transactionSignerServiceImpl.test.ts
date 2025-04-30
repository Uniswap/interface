import { Signer, providers } from 'ethers'
import { AccountMeta, AccountType } from 'uniswap/src/features/accounts/types'
import { TransactionSigner } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'
import { createTransactionSignerService } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerServiceImpl'
import { Provider } from 'wallet/src/features/transactions/executeTransaction/services/providerService'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'

describe('TransactionSignerService', () => {
  // Mock dependencies
  const mockSignerConnect = jest.fn()

  // Properly define mock functions
  const mockPopulateTransaction = jest.fn()
  const mockSignTransaction = jest.fn()
  const mockEstimateGas = jest.fn()

  const mockSigner = {
    populateTransaction: mockPopulateTransaction,
    signTransaction: mockSignTransaction,
    connect: mockSignerConnect,
    estimateGas: mockEstimateGas,
  } as unknown as Signer

  const mockSendTransaction = jest.fn()
  const mockProvider = {
    sendTransaction: mockSendTransaction,
  } as unknown as Provider

  const mockGetSignerForAccount = jest.fn()
  const mockSignerManager = {
    getSignerForAccount: mockGetSignerForAccount,
  } as unknown as SignerManager

  const mockAccount = {
    address: '0x1234567890123456789012345678901234567890',
    type: AccountType.SignerMnemonic,
  } as AccountMeta

  const mockGetProvider = jest.fn()

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks()
    mockSignerConnect.mockReturnValue(mockSigner)
    mockGetSignerForAccount.mockResolvedValue(mockSigner)
    mockGetProvider.mockResolvedValue(mockProvider)
  })

  // Create the service with mocked dependencies
  const createTestService = (): TransactionSigner => {
    return createTransactionSignerService({
      getAccount: () => mockAccount,
      getProvider: mockGetProvider,
      getSignerManager: () => mockSignerManager,
    })
  }

  describe('prepareTransaction', () => {
    it('should populate a transaction request with gas estimation', async () => {
      // Arrange
      const service = createTestService()
      const request = {
        to: '0xabcd',
        value: '0x123',
        data: '0x123abc',
      } as providers.TransactionRequest

      const estimatedGas = { toString: (): string => '0x7530' } // 30000 in hex
      mockEstimateGas.mockResolvedValue(estimatedGas)

      const populatedRequest = {
        ...request,
        gasLimit: '0x9c40', // 40000 in hex (30000 * 1.33 safety buffer)
        chainId: 1,
      }
      mockPopulateTransaction.mockResolvedValue(populatedRequest)

      // Act
      const result = await service.prepareTransaction({ request })

      // Assert
      expect(mockGetSignerForAccount).toHaveBeenCalledWith(mockAccount)
      expect(mockSignerConnect).toHaveBeenCalled()
      expect(mockPopulateTransaction).toHaveBeenCalledWith(request)
      expect(result).toEqual(populatedRequest)
    })

    it('should handle errors during transaction preparation', async () => {
      // Arrange
      const service = createTestService()
      const request = { to: '0xabcd', value: '0x123' } as providers.TransactionRequest
      const error = new Error('Insufficient funds')
      mockPopulateTransaction.mockRejectedValue(error)

      // Act & Assert
      await expect(service.prepareTransaction({ request })).rejects.toThrow('Insufficient funds')
    })
  })

  describe('signTransaction', () => {
    it('should sign a transaction request', async () => {
      // Arrange
      const service = createTestService()
      const request = {
        to: '0xabcd',
        value: '0x123',
        gasLimit: '0x5000',
        nonce: 5,
        chainId: 1,
      } as providers.TransactionRequest

      // Realistic signed transaction hex
      const signedTx =
        '0x02f86c0105849502f90082500094abcd80823039a08cb1593ca382884e2d2248a81942c93afa94e7190146dbdf7aa93ced3c6ba4ea11fa01bb62ef729131b4f3fab2977c9b9e83cd4b3781fab393db1a1dec3fbad97982'
      mockSignTransaction.mockResolvedValue(signedTx)

      // Act
      const result = await service.signTransaction(request)

      // Assert
      expect(mockGetSignerForAccount).toHaveBeenCalledWith(mockAccount)
      expect(mockSignerConnect).toHaveBeenCalled()
      expect(mockSignTransaction).toHaveBeenCalledWith(request)
      expect(result).toEqual(signedTx)
    })

    it('should handle signing errors', async () => {
      // Arrange
      const service = createTestService()
      const request = { to: '0xabcd', value: '0x123', gasLimit: '0x5000' } as providers.TransactionRequest
      const error = new Error('User rejected signing')
      mockSignTransaction.mockRejectedValue(error)

      // Act & Assert
      await expect(service.signTransaction(request)).rejects.toThrow('User rejected signing')
    })
  })

  describe('sendTransaction', () => {
    it('should send a signed transaction and return response with hash', async () => {
      // Arrange
      const service = createTestService()
      const signedTx =
        '0x02f86c0105849502f90082500094abcd80823039a08cb1593ca382884e2d2248a81942c93afa94e7190146dbdf7aa93ced3c6ba4ea11fa01bb62ef729131b4f3fab2977c9b9e83cd4b3781fab393db1a1dec3fbad97982'

      const txResponse = {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        confirmations: 0,
        from: '0x1234567890123456789012345678901234567890',
        wait: jest.fn().mockResolvedValue({
          status: 1, // success
          gasUsed: { toString: (): string => '21000' },
        }),
        nonce: 5,
        gasLimit: { toString: (): string => '21000' },
        value: { toString: (): string => '100000000000000000' }, // 0.1 ETH
      } as unknown as providers.TransactionResponse

      mockSendTransaction.mockResolvedValue(txResponse)

      // Act
      const result = await service.sendTransaction({ signedTx })

      // Assert
      expect(mockSendTransaction).toHaveBeenCalledWith(signedTx)
      expect(result).toEqual(txResponse)
      expect(result.hash).toBeDefined()
    })

    it('should handle network errors during transaction sending', async () => {
      // Arrange
      const service = createTestService()
      const signedTx =
        '0x02f86c0105849502f90082500094abcd80823039a08cb1593ca382884e2d2248a81942c93afa94e7190146dbdf7aa93ced3c6ba4ea11fa01bb62ef729131b4f3fab2977c9b9e83cd4b3781fab393db1a1dec3fbad97982'
      const error = new Error('Network error')
      mockSendTransaction.mockRejectedValue(error)

      // Act & Assert
      await expect(service.sendTransaction({ signedTx })).rejects.toThrow('Network error')
    })

    it('should handle transaction already known errors', async () => {
      // Arrange
      const service = createTestService()
      const signedTx =
        '0x02f86c0105849502f90082500094abcd80823039a08cb1593ca382884e2d2248a81942c93afa94e7190146dbdf7aa93ced3c6ba4ea11fa01bb62ef729131b4f3fab2977c9b9e83cd4b3781fab393db1a1dec3fbad97982'
      const error = new Error('already known')
      mockSendTransaction.mockRejectedValue(error)

      // Act & Assert
      await expect(service.sendTransaction({ signedTx })).rejects.toThrow('already known')
    })
  })

  describe('signAndSendTransaction', () => {
    it('should prepare, sign and send a transaction', async () => {
      // Arrange
      const service = createTestService()
      const request = {
        to: '0xabcdef1234567890123456789012345678901234',
        value: '0x1234', // Wei amount
        data: '0x123abc', // Call data
      } as providers.TransactionRequest

      const populatedRequest = {
        ...request,
        gasLimit: '0x5000',
        chainId: 1,
        nonce: 42,
      } as providers.TransactionRequest

      const signedTx =
        '0x02f86c0105849502f90082500094abcd80823039a08cb1593ca382884e2d2248a81942c93afa94e7190146dbdf7aa93ced3c6ba4ea11fa01bb62ef729131b4f3fab2977c9b9e83cd4b3781fab393db1a1dec3fbad97982'

      const txResponse = {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        confirmations: 0,
        from: '0x1234567890123456789012345678901234567890',
        wait: jest.fn().mockResolvedValue({
          status: 1,
          gasUsed: { toString: (): string => '21000' },
        }),
      } as unknown as providers.TransactionResponse

      // Mock the individual steps
      mockPopulateTransaction.mockResolvedValue(populatedRequest)
      mockSignTransaction.mockResolvedValue(signedTx)
      mockSendTransaction.mockResolvedValue(txResponse)

      // Use Date.now mock to make the test deterministic
      const mockTimestamp = 1234567890
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp)

      // Act
      const result = await service.signAndSendTransaction({ request })

      // Assert
      expect(mockPopulateTransaction).toHaveBeenCalledWith(request)
      expect(mockSignTransaction).toHaveBeenCalledWith(populatedRequest)
      expect(mockSendTransaction).toHaveBeenCalledWith(signedTx)
      expect(result).toEqual({
        transactionResponse: txResponse,
        populatedRequest,
        timestampBeforeSend: mockTimestamp,
      })
    })

    it('should handle errors during transaction flow', async () => {
      // Arrange
      const service = createTestService()
      const request = { to: '0xabcd', value: '0x123' } as providers.TransactionRequest

      // Simulate an error at the populate step
      const error = new Error('Transaction underpriced')
      mockPopulateTransaction.mockRejectedValue(error)

      // Act & Assert
      await expect(service.signAndSendTransaction({ request })).rejects.toThrow('Transaction underpriced')
    })

    it('should handle canceled signing by user', async () => {
      // Arrange
      const service = createTestService()
      const request = { to: '0xabcd', value: '0x123' } as providers.TransactionRequest
      const populatedRequest = { ...request, gasLimit: '0x5000' }

      mockPopulateTransaction.mockResolvedValue(populatedRequest)
      mockSignTransaction.mockRejectedValue(new Error('User denied transaction signature'))

      // Act & Assert
      await expect(service.signAndSendTransaction({ request })).rejects.toThrow('User denied transaction signature')
    })
  })

  describe('edge cases', () => {
    it('should handle provider not available', async () => {
      // Arrange
      mockGetProvider.mockRejectedValue(new Error('Provider not available'))
      const service = createTestService()
      const request = { to: '0xabcd', value: '0x123' } as providers.TransactionRequest

      // Act & Assert
      await expect(service.prepareTransaction({ request })).rejects.toThrow('Provider not available')
    })

    it('should handle signer not available for account', async () => {
      // Arrange
      mockGetSignerForAccount.mockRejectedValue(new Error('No signer available for this account'))
      const service = createTestService()
      const request = { to: '0xabcd', value: '0x123' } as providers.TransactionRequest

      // Act & Assert
      await expect(service.prepareTransaction({ request })).rejects.toThrow('No signer available for this account')
    })
  })
})
