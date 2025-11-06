import { Currency } from '@uniswap/sdk-core'
import { filterTokensBySearch } from 'pages/Portfolio/Tokens/utils/filterTokensBySearch'
import { TEST_TOKEN_1 } from 'test-utils/constants'

// Mock the doesTokenMatchSearchTerm function to have full control over test scenarios
vi.mock('uniswap/src/utils/search/doesTokenMatchSearchTerm', () => ({
  doesTokenMatchSearchTerm: vi.fn(),
}))

import { doesTokenMatchSearchTerm } from 'uniswap/src/utils/search/doesTokenMatchSearchTerm'

const mockDoesTokenMatchSearchTerm = vi.mocked(doesTokenMatchSearchTerm)

// Test data factory functions using test tokens
const createMockCurrencyInfo = (
  overrides: Partial<{ currencyId: string; currency: Currency }> = {},
): { currencyId: string; currency: Currency } => ({
  currencyId: 'TEST',
  currency: TEST_TOKEN_1, // Default to TEST_TOKEN_1
  ...overrides,
})

const createMockTokenWithInfo = (
  overrides: Partial<{ currencyInfo: { currencyId: string; currency: Currency } | null }> = {},
): { currencyInfo: { currencyId: string; currency: Currency } | null } => ({
  currencyInfo: createMockCurrencyInfo(),
  ...overrides,
})

describe('filterTokensBySearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when searchTerm is empty or undefined', () => {
    it('should return all tokens when searchTerm is undefined', () => {
      const tokens = [createMockTokenWithInfo(), createMockTokenWithInfo()]

      const result = filterTokensBySearch({
        tokens,
        searchTerm: undefined,
      })

      expect(result).toBe(tokens)
      expect(mockDoesTokenMatchSearchTerm).not.toHaveBeenCalled()
    })

    it('should return all tokens when searchTerm is null', () => {
      const tokens = [createMockTokenWithInfo(), createMockTokenWithInfo()]

      const result = filterTokensBySearch({
        tokens,
        searchTerm: null,
      })

      expect(result).toBe(tokens)
      expect(mockDoesTokenMatchSearchTerm).not.toHaveBeenCalled()
    })

    it('should return all tokens when searchTerm is empty string', () => {
      const tokens = [createMockTokenWithInfo(), createMockTokenWithInfo()]

      const result = filterTokensBySearch({
        tokens,
        searchTerm: '',
      })

      expect(result).toBe(tokens)
      expect(mockDoesTokenMatchSearchTerm).not.toHaveBeenCalled()
    })

    it('should return all tokens when searchTerm is only whitespace', () => {
      const tokens = [createMockTokenWithInfo(), createMockTokenWithInfo()]

      const result = filterTokensBySearch({
        tokens,
        searchTerm: '   ',
      })

      expect(result).toBe(tokens)
      expect(mockDoesTokenMatchSearchTerm).not.toHaveBeenCalled()
    })
  })

  describe('when tokens array is undefined', () => {
    it('should return undefined when tokens is undefined', () => {
      const result = filterTokensBySearch({
        tokens: undefined,
        searchTerm: 'test',
      })

      expect(result).toBeUndefined()
      expect(mockDoesTokenMatchSearchTerm).not.toHaveBeenCalled()
    })
  })

  describe('when tokens array is empty', () => {
    it('should return empty array when tokens is empty', () => {
      const result = filterTokensBySearch({
        tokens: [],
        searchTerm: 'test',
      })

      expect(result).toEqual([])
      expect(mockDoesTokenMatchSearchTerm).not.toHaveBeenCalled()
    })
  })

  describe('when filtering with valid search term', () => {
    it('should filter tokens based on doesTokenMatchSearchTerm results', () => {
      const token1 = createMockTokenWithInfo()
      const token2 = createMockTokenWithInfo()
      const token3 = createMockTokenWithInfo()
      const tokens = [token1, token2, token3]

      // Mock the search function to return different results for each token
      mockDoesTokenMatchSearchTerm
        .mockReturnValueOnce(true) // token1 matches
        .mockReturnValueOnce(false) // token2 doesn't match
        .mockReturnValueOnce(true) // token3 matches

      const result = filterTokensBySearch({
        tokens,
        searchTerm: 'test',
      })

      expect(result).toEqual([token1, token3])
      expect(mockDoesTokenMatchSearchTerm).toHaveBeenCalledTimes(3)
      expect(mockDoesTokenMatchSearchTerm).toHaveBeenCalledWith(token1, 'test')
      expect(mockDoesTokenMatchSearchTerm).toHaveBeenCalledWith(token2, 'test')
      expect(mockDoesTokenMatchSearchTerm).toHaveBeenCalledWith(token3, 'test')
    })

    it('should return empty array when no tokens match', () => {
      const token1 = createMockTokenWithInfo()
      const token2 = createMockTokenWithInfo()
      const tokens = [token1, token2]

      mockDoesTokenMatchSearchTerm.mockReturnValueOnce(false).mockReturnValueOnce(false)

      const result = filterTokensBySearch({
        tokens,
        searchTerm: 'nonexistent',
      })

      expect(result).toEqual([])
      expect(mockDoesTokenMatchSearchTerm).toHaveBeenCalledTimes(2)
    })

    it('should return all tokens when all tokens match', () => {
      const token1 = createMockTokenWithInfo()
      const token2 = createMockTokenWithInfo()
      const tokens = [token1, token2]

      mockDoesTokenMatchSearchTerm.mockReturnValueOnce(true).mockReturnValueOnce(true)

      const result = filterTokensBySearch({
        tokens,
        searchTerm: 'common',
      })

      expect(result).toEqual(tokens)
      expect(mockDoesTokenMatchSearchTerm).toHaveBeenCalledTimes(2)
    })
  })

  describe('with different token types', () => {
    it('should work with tokens that have currencyInfo', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: createMockCurrencyInfo({
          currencyId: 'ABC',
          currency: TEST_TOKEN_1, // Use TEST_TOKEN_1 (symbol: 'ABC', name: 'Abc')
        }),
      })

      mockDoesTokenMatchSearchTerm.mockReturnValue(true)

      const result = filterTokensBySearch({
        tokens: [token],
        searchTerm: 'abc',
      })

      expect(result).toEqual([token])
      expect(mockDoesTokenMatchSearchTerm).toHaveBeenCalledWith(token, 'abc')
    })

    it('should work with tokens that have null currencyInfo', () => {
      const token = createMockTokenWithInfo({
        currencyInfo: null,
      })

      mockDoesTokenMatchSearchTerm.mockReturnValue(false)

      const result = filterTokensBySearch({
        tokens: [token],
        searchTerm: 'test',
      })

      expect(result).toEqual([])
      expect(mockDoesTokenMatchSearchTerm).toHaveBeenCalledWith(token, 'test')
    })
  })

  describe('edge cases', () => {
    it('should handle single token array', () => {
      const token = createMockTokenWithInfo()
      mockDoesTokenMatchSearchTerm.mockReturnValue(true)

      const result = filterTokensBySearch({
        tokens: [token],
        searchTerm: 'test',
      })

      expect(result).toEqual([token])
      expect(mockDoesTokenMatchSearchTerm).toHaveBeenCalledTimes(1)
    })

    it('should preserve original array reference when no filtering occurs', () => {
      const tokens = [createMockTokenWithInfo()]

      const result = filterTokensBySearch({
        tokens,
        searchTerm: undefined,
      })

      expect(result).toBe(tokens)
    })

    it('should handle search term with special characters', () => {
      const token = createMockTokenWithInfo()
      mockDoesTokenMatchSearchTerm.mockReturnValue(true)

      const result = filterTokensBySearch({
        tokens: [token],
        searchTerm: 'test@#$%^&*()',
      })

      expect(result).toEqual([token])
      expect(mockDoesTokenMatchSearchTerm).toHaveBeenCalledWith(token, 'test@#$%^&*()')
    })

    it('should handle very long search terms', () => {
      const token = createMockTokenWithInfo()
      const longSearchTerm = 'a'.repeat(1000)
      mockDoesTokenMatchSearchTerm.mockReturnValue(false)

      const result = filterTokensBySearch({
        tokens: [token],
        searchTerm: longSearchTerm,
      })

      expect(result).toEqual([])
      expect(mockDoesTokenMatchSearchTerm).toHaveBeenCalledWith(token, longSearchTerm)
    })
  })

  describe('type safety', () => {
    it('should work with generic token types', () => {
      interface ExtendedToken {
        currencyInfo: { currencyId: string; currency: Currency } | null
        customProperty: string
      }

      const extendedToken: ExtendedToken = {
        currencyInfo: createMockCurrencyInfo(),
        customProperty: 'test',
      }

      mockDoesTokenMatchSearchTerm.mockReturnValue(true)

      const result = filterTokensBySearch({
        tokens: [extendedToken],
        searchTerm: 'test',
      })

      expect(result).toEqual([extendedToken])
      expect(mockDoesTokenMatchSearchTerm).toHaveBeenCalledWith(extendedToken, 'test')
    })
  })
})
