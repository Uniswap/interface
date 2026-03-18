import { arrayify, isHexString } from 'ethers/lib/utils'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { SignMessageInfo } from 'wallet/src/features/wallet/signing/signing'
import { signMessage } from 'wallet/src/features/wallet/signing/signing.web'

// Mock dependencies
jest.mock('uniswap/src/features/transactions/signing')
jest.mock('uniswap/src/utils/addresses', () => ({
  ensureLeading0x: (sig: string): string => (sig.startsWith('0x') ? sig : `0x${sig}`),
}))

describe('signMessage (web)', () => {
  const mockSignature =
    'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
  const mockSignedSignature = `0x${mockSignature}`

  const mockSigner = {
    signMessage: jest.fn().mockResolvedValue(mockSignature),
  }

  const mockUnconnectedSigner = {
    signMessage: jest.fn().mockResolvedValue(mockSignature),
    connect: jest.fn().mockReturnValue(mockSigner),
  }

  const mockSignerManager = {
    getSignerForAccount: jest.fn().mockResolvedValue(mockUnconnectedSigner),
  }

  const mockProvider = {
    _isProvider: true,
  }

  const mockAccount = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    name: 'Test Account',
  } as Account

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signAsString flag', () => {
    it('should keep message as string when signAsString=true (personal_sign)', async () => {
      const ethereumAddress = '0xF570F45f598fD48AF83FABD692629a2caFe899ec'

      const signInfo: SignMessageInfo = {
        message: ethereumAddress,
        account: mockAccount,
        signerManager: mockSignerManager as any,
        provider: mockProvider as any,
        signAsString: true, // ✅ personal_sign should use signAsString=true
      }

      const result = await signMessage(signInfo)

      // Verify the signer was connected to provider
      expect(mockUnconnectedSigner.connect).toHaveBeenCalledWith(mockProvider)

      // Verify signMessage was called with the original string, not bytes
      expect(mockSigner.signMessage).toHaveBeenCalledWith(ethereumAddress)
      expect(mockSigner.signMessage).toHaveBeenCalledTimes(1)
      expect(result).toBe(mockSignedSignature)
    })

    it('should convert hex string to bytes when signAsString=false', async () => {
      const hexMessage = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

      const signInfo: SignMessageInfo = {
        message: hexMessage,
        account: mockAccount,
        signerManager: mockSignerManager as any,
        provider: mockProvider as any,
        signAsString: false,
      }

      const result = await signMessage(signInfo)

      // Verify signMessage was called with bytes, not the original string
      const expectedBytes = arrayify(hexMessage)
      expect(mockSigner.signMessage).toHaveBeenCalledWith(expectedBytes)
      expect(mockSigner.signMessage).toHaveBeenCalledTimes(1)
      expect(result).toBe(mockSignedSignature)
    })

    it('should convert hex string to bytes when signAsString is undefined (default/backward compatibility)', async () => {
      const hexMessage = '0x48656c6c6f20576f726c64' // "Hello World" in hex

      const signInfo: SignMessageInfo = {
        message: hexMessage,
        account: mockAccount,
        signerManager: mockSignerManager as any,
        provider: mockProvider as any,
        // signAsString not provided - should default to converting hex to bytes
      }

      const result = await signMessage(signInfo)

      // Verify default behavior: hex strings are converted to bytes
      expect(isHexString(hexMessage)).toBe(true)
      const expectedBytes = arrayify(hexMessage)
      expect(mockSigner.signMessage).toHaveBeenCalledWith(expectedBytes)
      expect(mockSigner.signMessage).toHaveBeenCalledTimes(1)
      expect(result).toBe(mockSignedSignature)
    })
  })

  describe('message format handling', () => {
    it('should handle plain text messages with signAsString=true', async () => {
      const plainTextMessage = 'Sign this message to authenticate'

      const signInfo: SignMessageInfo = {
        message: plainTextMessage,
        account: mockAccount,
        signerManager: mockSignerManager as any,
        provider: mockProvider as any,
        signAsString: true,
      }

      const result = await signMessage(signInfo)

      // Plain text should be passed as-is
      expect(mockSigner.signMessage).toHaveBeenCalledWith(plainTextMessage)
      expect(result).toBe(mockSignedSignature)
    })

    it('should handle plain text messages without signAsString (kept as string since not hex)', async () => {
      const plainTextMessage = 'Sign this message to authenticate'

      const signInfo: SignMessageInfo = {
        message: plainTextMessage,
        account: mockAccount,
        signerManager: mockSignerManager as any,
        provider: mockProvider as any,
        // No signAsString flag
      }

      const result = await signMessage(signInfo)

      // Plain text (not a hex string) should be passed as-is
      expect(isHexString(plainTextMessage)).toBe(false)
      expect(mockSigner.signMessage).toHaveBeenCalledWith(plainTextMessage)
      expect(result).toBe(mockSignedSignature)
    })

    it('should handle hex-encoded text message as string when signAsString=true', async () => {
      const hexEncodedText = '0x48656c6c6f20576f726c64' // "Hello World" encoded as hex

      const signInfo: SignMessageInfo = {
        message: hexEncodedText,
        account: mockAccount,
        signerManager: mockSignerManager as any,
        provider: mockProvider as any,
        signAsString: true,
      }

      const result = await signMessage(signInfo)

      // With signAsString=true, hex string stays as string (not converted to bytes)
      expect(mockSigner.signMessage).toHaveBeenCalledWith(hexEncodedText)
      expect(result).toBe(mockSignedSignature)
    })

    it('should handle Ethereum address as message with signAsString=true', async () => {
      // This is the specific case that was causing the crash
      const ethereumAddress = '0xF570F45f598fD48AF83FABD692629a2caFe899ec'

      const signInfo: SignMessageInfo = {
        message: ethereumAddress,
        account: mockAccount,
        signerManager: mockSignerManager as any,
        provider: mockProvider as any,
        signAsString: true,
      }

      const result = await signMessage(signInfo)

      // Verify message is kept as string (not converted to bytes)
      expect(mockSigner.signMessage).toHaveBeenCalledWith(ethereumAddress)
      expect(result).toBe(mockSignedSignature)
      expect(mockSigner.signMessage).toHaveBeenCalledTimes(1)
    })

    it('should arrayify hex messages without signAsString flag', async () => {
      const hexMessage = '0x5468697320697320612074657374206d657373616765'

      const signInfo: SignMessageInfo = {
        message: hexMessage,
        account: mockAccount,
        signerManager: mockSignerManager as any,
        provider: mockProvider as any,
        // No signAsString - should convert to bytes for backward compatibility
      }

      const result = await signMessage(signInfo)

      // Without signAsString, hex strings are converted to bytes
      expect(isHexString(hexMessage)).toBe(true)
      const expectedBytes = arrayify(hexMessage)
      expect(mockSigner.signMessage).toHaveBeenCalledWith(expectedBytes)
      expect(result).toBe(mockSignedSignature)
    })

    it('should arrayify long hex strings (>32 bytes) without signAsString', async () => {
      const longHexMessage = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

      const signInfo: SignMessageInfo = {
        message: longHexMessage,
        account: mockAccount,
        signerManager: mockSignerManager as any,
        provider: mockProvider as any,
      }

      const result = await signMessage(signInfo)

      // Should convert to bytes
      const expectedBytes = arrayify(longHexMessage)
      expect(mockSigner.signMessage).toHaveBeenCalledWith(expectedBytes)
      expect(result).toBe(mockSignedSignature)
    })

    it('should arrayify 32-byte hash without signAsString', async () => {
      const hash32Bytes = '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba'

      const signInfo: SignMessageInfo = {
        message: hash32Bytes,
        account: mockAccount,
        signerManager: mockSignerManager as any,
        provider: mockProvider as any,
      }

      const result = await signMessage(signInfo)

      // Should convert to bytes (backward compatibility for eth_sign)
      const expectedBytes = arrayify(hash32Bytes)
      expect(mockSigner.signMessage).toHaveBeenCalledWith(expectedBytes)
      expect(result).toBe(mockSignedSignature)
    })
  })

  describe('provider handling', () => {
    it('should connect signer to provider when provider is provided', async () => {
      const message = 'Test message'

      const signInfo: SignMessageInfo = {
        message,
        account: mockAccount,
        signerManager: mockSignerManager as any,
        provider: mockProvider as any,
      }

      await signMessage(signInfo)

      expect(mockUnconnectedSigner.connect).toHaveBeenCalledWith(mockProvider)
      expect(mockSigner.signMessage).toHaveBeenCalledWith(message)
    })

    it('should use unconnected signer when provider is not provided', async () => {
      const message = 'Test message'

      const signInfo: SignMessageInfo = {
        message,
        account: mockAccount,
        signerManager: mockSignerManager as any,
        // No provider
      }

      await signMessage(signInfo)

      expect(mockUnconnectedSigner.connect).not.toHaveBeenCalled()
      expect(mockUnconnectedSigner.signMessage).toHaveBeenCalledWith(message)
    })
  })

  describe('signature formatting', () => {
    it('should ensure signature has 0x prefix', async () => {
      const message = 'Test message'
      // Mock signer returning signature without 0x prefix
      mockUnconnectedSigner.signMessage.mockResolvedValueOnce('abcdef123456')

      const signInfo: SignMessageInfo = {
        message,
        account: mockAccount,
        signerManager: mockSignerManager as any,
        // No provider - use unconnected signer
      }

      const result = await signMessage(signInfo)

      expect(result).toBe('0xabcdef123456')
    })
  })
})
