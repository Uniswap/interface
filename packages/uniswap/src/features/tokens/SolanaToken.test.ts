import { SolanaToken } from 'uniswap/src/features/tokens/SolanaToken'

describe('SolanaToken', () => {
  const validSolanaAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC on Solana
  const invalidAddress = 'invalid-address'
  const chainId = 101 // Solana mainnet

  describe('constructor', () => {
    it('should create a SolanaToken with valid address', () => {
      const token = new SolanaToken(chainId, validSolanaAddress, 6, 'USDC', 'USD Coin')

      expect(token.chainId).toBe(chainId)
      expect(token.address).toBe(validSolanaAddress)
      expect(token.decimals).toBe(6)
      expect(token.symbol).toBe('USDC')
      expect(token.name).toBe('USD Coin')
      expect(token.isNative).toBe(false)
      expect(token.isToken).toBe(true)
    })

    it('should throw error when address is invalid', () => {
      expect(() => {
        // eslint-disable-next-line no-new
        new SolanaToken(chainId, invalidAddress, 6, 'USDC', 'USD Coin')
      }).toThrow('Invalid SPL token address')
    })

    it('should throw error when address is empty string', () => {
      expect(() => {
        // eslint-disable-next-line no-new
        new SolanaToken(chainId, '', 6, 'USDC', 'USD Coin')
      }).toThrow('Invalid SPL token address')
    })

    it('should create token with optional symbol and name', () => {
      const token = new SolanaToken(chainId, validSolanaAddress, 9)

      expect(token.symbol).toBeUndefined()
      expect(token.name).toBeUndefined()
    })
  })

  describe('equals', () => {
    it('should return true for identical tokens', () => {
      const token1 = new SolanaToken(chainId, validSolanaAddress, 6, 'USDC', 'USD Coin')
      const token2 = new SolanaToken(chainId, validSolanaAddress, 6, 'USDC', 'USD Coin')

      expect(token1.equals(token2)).toBe(true)
    })

    it('should return false for tokens with different addresses', () => {
      const token1 = new SolanaToken(chainId, validSolanaAddress, 6, 'USDC', 'USD Coin')
      const token2 = new SolanaToken(chainId, 'So11111111111111111111111111111111111111112', 9, 'SOL', 'Solana')

      expect(token1.equals(token2)).toBe(false)
    })
  })

  describe('sortsBefore', () => {
    it('should sort tokens by address', () => {
      const token1 = new SolanaToken(chainId, 'A111111111111111111111111111111111111111111', 6)
      const token2 = new SolanaToken(chainId, 'B111111111111111111111111111111111111111111', 6)

      expect(token1.sortsBefore(token2)).toBe(true)
      expect(token2.sortsBefore(token1)).toBe(false)
    })
  })

  describe('wrapped', () => {
    it('should return the same token instance', () => {
      const token = new SolanaToken(chainId, validSolanaAddress, 6, 'USDC', 'USD Coin')

      expect(token.wrapped).toBe(token)
    })
  })
})
