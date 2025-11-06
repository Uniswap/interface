import { Currency } from '@uniswap/sdk-core'
import { DAI, nativeOnChain, USDC, WBTC } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { doesTokenMatchSearchTerm } from 'uniswap/src/utils/search/doesTokenMatchSearchTerm'

// Test data factory functions using real tokens
const createMockCurrencyInfo = (
  overrides: Partial<{ currencyId: string; currency: Currency }> = {},
): { currencyId: string; currency: Currency } => ({
  currencyId: 'TEST',
  currency: USDC, // Default to USDC
  ...overrides,
})

const createMockTokenWithInfo = (
  overrides: Partial<{ currencyInfo: { currencyId: string; currency: Currency } | null }> = {},
): { currencyInfo: { currencyId: string; currency: Currency } | null } => ({
  currencyInfo: createMockCurrencyInfo(),
  ...overrides,
})

describe('doesTokenMatchSearchTerm', () => {
  describe('when searchTerm is empty or undefined', () => {
    it('should return true when searchTerm is undefined', () => {
      const token = createMockTokenWithInfo()

      const result = doesTokenMatchSearchTerm(token, undefined as any)

      expect(result).toBe(true)
    })

    it('should return true when searchTerm is null', () => {
      const token = createMockTokenWithInfo()

      const result = doesTokenMatchSearchTerm(token, null as any)

      expect(result).toBe(true)
    })

    it('should return true when searchTerm is empty string', () => {
      const token = createMockTokenWithInfo()

      const result = doesTokenMatchSearchTerm(token, '')

      expect(result).toBe(true)
    })

    it('should return true when searchTerm is only whitespace', () => {
      const token = createMockTokenWithInfo()

      const result = doesTokenMatchSearchTerm(token, '   ')

      expect(result).toBe(true)
    })

    it('should return true when searchTerm is only tabs and newlines', () => {
      const token = createMockTokenWithInfo()

      const result = doesTokenMatchSearchTerm(token, '\t\n\r ')

      expect(result).toBe(true)
    })
  })

  describe('when currencyInfo is null', () => {
    it('should return false when currencyInfo is null', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: null,
      })

      const result = doesTokenMatchSearchTerm(token, 'test')

      expect(result).toBe(false)
    })
  })

  describe('when searching by token name', () => {
    it('should match when search term is in token name (case insensitive)', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: DAI, // DAI has name "Dai Stablecoin"
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'dai')

      expect(result).toBe(true)
    })

    it('should match when search term is in token name with different case', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: DAI, // DAI has name "Dai Stablecoin"
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'STABLECOIN')

      expect(result).toBe(true)
    })

    it('should not match when search term is not in token name', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: USDC, // USDC has name "USD Coin"
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'bitcoin')

      expect(result).toBe(false)
    })

    it('should handle undefined token name', () => {
      // Create a token with undefined name by modifying WBTC
      const tokenWithUndefinedName = {
        ...WBTC,
        name: undefined,
      } as any

      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: tokenWithUndefinedName,
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'test')

      expect(result).toBe(false)
    })
  })

  describe('when searching by token symbol', () => {
    it('should match when search term is in token symbol (case insensitive)', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: USDC, // USDC has symbol "USDC"
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'usd')

      expect(result).toBe(true)
    })

    it('should match when search term is in token symbol with different case', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: USDC, // USDC has symbol "USDC"
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'USDC')

      expect(result).toBe(true)
    })

    it('should not match when search term is not in token symbol', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: USDC, // USDC has symbol "USDC"
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'bitcoin')

      expect(result).toBe(false)
    })

    it('should handle undefined token symbol', () => {
      // Create a token with undefined symbol by modifying WBTC
      const tokenWithUndefinedSymbol = {
        ...WBTC,
        symbol: undefined,
      } as any

      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: tokenWithUndefinedSymbol,
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'test')

      expect(result).toBe(false)
    })
  })

  describe('when searching by token address', () => {
    it('should match when search term is in token address (case insensitive)', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: USDC, // USDC has address starting with 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'a0b8')

      expect(result).toBe(true)
    })

    it('should match when search term is in token address with different case', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: USDC, // USDC has address starting with 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'A0B8')

      expect(result).toBe(true)
    })

    it('should not match when search term is not in token address', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: USDC,
        }),
      })

      const result = doesTokenMatchSearchTerm(token, '9999')

      expect(result).toBe(false)
    })

    it('should not search by address for native currencies', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: nativeOnChain(UniverseChainId.Mainnet), // Native ETH
        }),
      })

      const result = doesTokenMatchSearchTerm(token, '0x')

      expect(result).toBe(false)
    })
  })

  describe('when multiple fields match', () => {
    it('should return true if name matches even if symbol and address do not', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: DAI, // DAI has name "Dai Stablecoin" and symbol "DAI"
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'dai')

      expect(result).toBe(true)
    })

    it('should return true if symbol matches even if name and address do not', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: USDC, // USDC has symbol "USDC" and name "USD Coin"
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'usd')

      expect(result).toBe(true)
    })

    it('should return true if address matches even if name and symbol do not', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: USDC, // USDC has address starting with 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'a0b8')

      expect(result).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle partial matches at the beginning of strings', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: DAI, // DAI has symbol "DAI"
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'dai')

      expect(result).toBe(true)
    })

    it('should handle partial matches at the end of strings', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: DAI, // DAI has name "Dai Stablecoin"
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'coin')

      expect(result).toBe(true)
    })

    it('should handle partial matches in the middle of strings', () => {
      // Fix the imported WBTC token properties
      const wbtcToken = {
        ...WBTC,
        name: 'Wrapped BTC',
        symbol: 'WBTC',
      } as any

      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: wbtcToken,
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'wrapped')

      expect(result).toBe(true)
    })

    it('should handle special characters in search term', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: USDC, // USDC has name "USD Coin"
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'usd')

      expect(result).toBe(true)
    })

    it('should handle very long search terms', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: USDC,
        }),
      })

      const longSearchTerm = 'a'.repeat(1000)
      const result = doesTokenMatchSearchTerm(token, longSearchTerm)

      expect(result).toBe(false)
    })

    it('should handle empty token name and symbol', () => {
      // Create a token with empty name and symbol by modifying WBTC
      const tokenWithEmptyFields = {
        ...WBTC,
        name: '',
        symbol: '',
      } as any

      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: tokenWithEmptyFields,
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'test')

      expect(result).toBe(false)
    })
  })

  describe('with different currency types', () => {
    it('should work with Token instances', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: USDC, // USDC is a Token instance
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'usd')

      expect(result).toBe(true)
    })

    it('should work with NativeCurrency instances', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: nativeOnChain(UniverseChainId.Mainnet), // Native ETH
        }),
      })

      const result = doesTokenMatchSearchTerm(token, 'ethereum')

      expect(result).toBe(true)
    })

    it('should not search by address for NativeCurrency', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: nativeOnChain(UniverseChainId.Mainnet), // Native ETH
        }),
      })

      // NativeCurrency doesn't have an address, so this should not match
      const result = doesTokenMatchSearchTerm(token, '0x')

      expect(result).toBe(false)
    })
  })

  describe('case sensitivity', () => {
    it('should be case insensitive for all fields', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currency: USDC, // USDC has name "USD Coin" and symbol "USDC"
        }),
      })

      expect(doesTokenMatchSearchTerm(token, 'usd')).toBe(true)
      expect(doesTokenMatchSearchTerm(token, 'USD')).toBe(true)
      expect(doesTokenMatchSearchTerm(token, 'Usd')).toBe(true)
      expect(doesTokenMatchSearchTerm(token, 'UsD')).toBe(true)
    })
  })
})
