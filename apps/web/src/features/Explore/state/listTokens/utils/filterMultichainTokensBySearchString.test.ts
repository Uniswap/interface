import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'
import { describe, expect, it, vi } from 'vitest'
import { filterMultichainTokensBySearchString } from '~/features/Explore/state/listTokens/utils/filterMultichainTokensBySearchString'

vi.mock('uniswap/src/data/cache', () => ({
  normalizeTokenAddressForCache: vi.fn((addr: string | null) => (addr === null ? null : addr.toLowerCase())),
}))

const mockNormalize = vi.mocked(normalizeTokenAddressForCache)

describe('filterMultichainTokensBySearchString', () => {
  beforeEach(() => {
    mockNormalize.mockImplementation((addr: string | null) => (addr === null ? null : addr.toLowerCase()))
  })

  it('should return tokens unchanged when filterString is empty', () => {
    const tokens = [createRankedMultichainToken({ symbol: 'USDC' }), createRankedMultichainToken({ symbol: 'WETH' })]
    expect(filterMultichainTokensBySearchString(tokens, '')).toEqual(tokens)
    expect(filterMultichainTokensBySearchString(tokens, '')).toHaveLength(2)
  })

  it('should return tokens unchanged when filterString is empty string', () => {
    const tokens = [createRankedMultichainToken()]
    expect(filterMultichainTokensBySearchString(tokens, '')).toBe(tokens)
  })

  it('should filter by name (case-insensitive)', () => {
    const tokens = [
      createRankedMultichainToken({ name: 'USD Coin', symbol: 'USDC' }),
      createRankedMultichainToken({ name: 'Wrapped Ether', symbol: 'WETH' }),
    ]
    const result = filterMultichainTokensBySearchString(tokens, 'usd coin')
    expect(result).toHaveLength(1)
    expect(result[0]?.multichainToken?.symbol).toBe('USDC')
  })

  it('should filter by symbol (case-insensitive)', () => {
    const tokens = [createRankedMultichainToken({ symbol: 'USDC' }), createRankedMultichainToken({ symbol: 'WETH' })]
    const result = filterMultichainTokensBySearchString(tokens, 'weth')
    expect(result).toHaveLength(1)
    expect(result[0]?.multichainToken?.symbol).toBe('WETH')
  })

  it('should filter by multichainId (case-insensitive)', () => {
    const tokens = [
      createRankedMultichainToken({ multichainId: 'mc:1_0xABC', symbol: 'A' }),
      createRankedMultichainToken({ multichainId: 'mc:8453_0xDEF', symbol: 'B' }),
    ]
    const result = filterMultichainTokensBySearchString(tokens, '0xdef')
    expect(result).toHaveLength(1)
    expect(result[0]?.multichainToken?.symbol).toBe('B')
  })

  it('should filter by chain deployment address using normalizeTokenAddressForCache', () => {
    mockNormalize.mockImplementation((addr: string | null) => {
      if (addr === null) {
        return null
      }
      return addr.toLowerCase()
    })
    const tokens = [
      createRankedMultichainToken({
        multichainId: 'mc:1_0xUSDC',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
      }),
      createRankedMultichainToken({
        multichainId: 'mc:1_0xDef',
        address: '0xDef',
        symbol: 'OTHER',
      }),
    ]
    const result = filterMultichainTokensBySearchString(tokens, '0xa0b869')
    expect(result).toHaveLength(1)
    expect(result[0]?.multichainToken?.symbol).toBe('USDC')
    expect(mockNormalize).toHaveBeenCalledWith('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
  })

  it('should exclude token when no field matches', () => {
    const tokens = [createRankedMultichainToken({ name: 'USD Coin', symbol: 'USDC' })]
    const result = filterMultichainTokensBySearchString(tokens, 'xyz')
    expect(result).toHaveLength(0)
  })

  it('should include token when any field matches', () => {
    const token = createRankedMultichainToken({
      name: 'Unique Name',
      symbol: 'SYM',
      multichainId: 'mc:1_0xAddr',
      address: '0xAddr',
    })
    expect(filterMultichainTokensBySearchString([token], 'unique')).toHaveLength(1)
    expect(filterMultichainTokensBySearchString([token], 'sym')).toHaveLength(1)
    expect(filterMultichainTokensBySearchString([token], '0xaddr')).toHaveLength(1)
  })

  it('should return empty array when no tokens match', () => {
    const tokens = [createRankedMultichainToken({ symbol: 'A' }), createRankedMultichainToken({ symbol: 'B' })]
    expect(filterMultichainTokensBySearchString(tokens, 'nonexistent')).toEqual([])
  })
})
