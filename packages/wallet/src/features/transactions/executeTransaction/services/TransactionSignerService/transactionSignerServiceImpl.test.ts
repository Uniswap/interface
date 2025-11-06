import { providers, Signer } from 'ethers'
import { AccountType, SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { Provider } from 'wallet/src/features/transactions/executeTransaction/services/providerService'
import { TransactionSigner } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'
import { createTransactionSignerService } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerServiceImpl'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'

describe('TransactionSignerService', () => {
  // Mock dependencies
  const mockSignerConnect = jest.fn()

  // Properly define mock functions
  const mockPopulateTransaction = jest.fn()
  const mockSignTransaction = jest.fn()
  const mockEstimateGas = jest.fn()
  const mockSignTypedData = jest.fn()

  const mockSigner = {
    populateTransaction: mockPopulateTransaction,
    signTransaction: mockSignTransaction,
    connect: mockSignerConnect,
    estimateGas: mockEstimateGas,
    _signTypedData: mockSignTypedData,
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
  } as SignerMnemonicAccountMeta

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

      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

      mockSendTransaction.mockResolvedValue({ hash: txHash })

      // Act
      const result = await service.sendTransaction({ signedTx })

      // Assert
      expect(mockSendTransaction).toHaveBeenCalledWith(signedTx)
      expect(result).toEqual(txHash)
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

  describe('signTypedData', () => {
    it('should sign typed data successfully', async () => {
      // Arrange
      const service = createTestService()
      const domain = {
        name: 'Test App',
        version: '1',
        chainId: 1,
        verifyingContract: '0x1234567890123456789012345678901234567890',
      }
      const types = {
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
      }
      const value = {
        name: 'John Doe',
        wallet: '0xabcdef1234567890123456789012345678901234',
      }

      const expectedSignature =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12341b'
      mockSignTypedData.mockResolvedValue(expectedSignature)

      // Act
      const result = await service.signTypedData({ domain, types, value })

      // Assert
      expect(mockGetSignerForAccount).toHaveBeenCalledWith(mockAccount)
      expect(mockSignerConnect).toHaveBeenCalled()
      expect(mockSignTypedData).toHaveBeenCalledWith(domain, types, value)
      expect(result).toEqual(expectedSignature)
    })

    it('should handle EIP-712 permit signing', async () => {
      // Arrange
      const service = createTestService()
      const domain = {
        name: 'USD Coin',
        version: '2',
        chainId: 1,
        verifyingContract: '0xa0b86a33e6776e5aa7ff53a3b40e2b0e21afad7c',
      }
      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      }
      const value = {
        owner: '0x1234567890123456789012345678901234567890',
        spender: '0xabcdef1234567890123456789012345678901234',
        value: '1000000',
        nonce: 0,
        deadline: 1234567890,
      }

      const expectedSignature =
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b'
      mockSignTypedData.mockResolvedValue(expectedSignature)

      // Act
      const result = await service.signTypedData({ domain, types, value })

      // Assert
      expect(mockSignTypedData).toHaveBeenCalledWith(domain, types, value)
      expect(result).toEqual(expectedSignature)
    })

    it('should handle invalid typed data structure', async () => {
      // Arrange
      const service = createTestService()
      const domain = {
        name: 'Test App',
        version: '1',
        chainId: 1,
        verifyingContract: '0x1234567890123456789012345678901234567890',
      }
      const types = {
        InvalidType: [{ name: 'field', type: 'invalidType' }],
      }
      const value = {
        field: 'some value',
      }

      const error = new Error('Invalid type definition')
      mockSignTypedData.mockRejectedValue(error)

      // Act & Assert
      await expect(service.signTypedData({ domain, types, value })).rejects.toThrow('Invalid type definition')
    })

    it('should handle signer connection failure for typed data', async () => {
      // Arrange
      mockGetSignerForAccount.mockRejectedValue(new Error('Unable to connect signer'))
      const service = createTestService()
      const domain = {
        name: 'Test App',
        version: '1',
        chainId: 1,
        verifyingContract: '0x1234567890123456789012345678901234567890',
      }
      const types = {
        Message: [{ name: 'content', type: 'string' }],
      }
      const value = {
        content: 'Hello World',
      }

      // Act & Assert
      await expect(service.signTypedData({ domain, types, value })).rejects.toThrow('Unable to connect signer')
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
