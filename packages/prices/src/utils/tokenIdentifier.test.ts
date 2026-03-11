import { Ether, Token } from '@uniswap/sdk-core'
import type { TokenIdentifier } from '@universe/prices'
import {
  createPriceKey,
  createPriceKeyFromToken,
  filterValidTokens,
  isCurrency,
  isTokenIdentifier,
  normalizeToken,
  parsePriceKey,
  toSubscriptionParams,
} from '@universe/prices'
import { describe, expect, it } from 'vitest'

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

describe('tokenIdentifier utilities', () => {
  describe('isCurrency', () => {
    it('returns true for Token instances', () => {
      const token = new Token(1, WETH_ADDRESS, 18, 'WETH', 'Wrapped Ether')
      expect(isCurrency(token)).toBe(true)
    })

    it('returns false for TokenIdentifier', () => {
      const identifier: TokenIdentifier = { chainId: 1, address: WETH_ADDRESS }
      expect(isCurrency(identifier)).toBe(false)
    })
  })

  describe('isTokenIdentifier', () => {
    it('returns true for TokenIdentifier objects', () => {
      const identifier: TokenIdentifier = { chainId: 1, address: WETH_ADDRESS }
      expect(isTokenIdentifier(identifier)).toBe(true)
    })

    it('returns false for Token instances', () => {
      const token = new Token(1, WETH_ADDRESS, 18, 'WETH', 'Wrapped Ether')
      expect(isTokenIdentifier(token)).toBe(false)
    })
  })

  describe('normalizeToken', () => {
    it('normalizes TokenIdentifier with lowercase address', () => {
      const identifier: TokenIdentifier = { chainId: 1, address: WETH_ADDRESS }
      const result = normalizeToken(identifier)
      expect(result).toEqual({
        chainId: 1,
        address: WETH_ADDRESS.toLowerCase(),
      })
    })

    it('normalizes native currency to zero address', () => {
      const eth = Ether.onChain(1)
      const result = normalizeToken(eth)
      expect(result).toEqual({
        chainId: 1,
        address: '0x0000000000000000000000000000000000000000',
      })
    })

    it('normalizes Token instance', () => {
      const token = new Token(1, WETH_ADDRESS, 18, 'WETH', 'Wrapped Ether')
      const result = normalizeToken(token)
      expect(result).toEqual({
        chainId: 1,
        address: WETH_ADDRESS.toLowerCase(),
      })
    })
  })

  describe('createPriceKey', () => {
    it('creates key with format chainId-address', () => {
      const key = createPriceKey(1, WETH_ADDRESS)
      expect(key).toBe(`1-${WETH_ADDRESS.toLowerCase()}`)
    })

    it('lowercases address', () => {
      const key = createPriceKey(1, '0xABC')
      expect(key).toBe('1-0xabc')
    })
  })

  describe('createPriceKeyFromToken', () => {
    it('creates key from TokenIdentifier', () => {
      const identifier: TokenIdentifier = { chainId: 1, address: WETH_ADDRESS }
      const key = createPriceKeyFromToken(identifier)
      expect(key).toBe(`1-${WETH_ADDRESS.toLowerCase()}`)
    })

    it('creates key from Token', () => {
      const token = new Token(1, WETH_ADDRESS, 18, 'WETH', 'Wrapped Ether')
      const key = createPriceKeyFromToken(token)
      expect(key).toBe(`1-${WETH_ADDRESS.toLowerCase()}`)
    })
  })

  describe('parsePriceKey', () => {
    it('parses key back to TokenIdentifier', () => {
      const key = `1-${WETH_ADDRESS.toLowerCase()}`
      const result = parsePriceKey(key)
      expect(result).toEqual({
        chainId: 1,
        address: WETH_ADDRESS.toLowerCase(),
      })
    })

    it('returns null for missing address', () => {
      expect(parsePriceKey('1')).toBeNull()
    })

    it('returns null for invalid chainId', () => {
      expect(parsePriceKey('abc-0x123')).toBeNull()
    })

    it('returns null for empty key', () => {
      expect(parsePriceKey('')).toBeNull()
    })
  })

  describe('toSubscriptionParams', () => {
    it('converts to subscription params format', () => {
      const identifier: TokenIdentifier = { chainId: 1, address: WETH_ADDRESS }
      const params = toSubscriptionParams(identifier)
      expect(params).toEqual({
        chainId: 1,
        tokenAddress: WETH_ADDRESS.toLowerCase(),
      })
    })
  })

  describe('filterValidTokens', () => {
    it('filters out invalid addresses', () => {
      const tokens: TokenIdentifier[] = [
        { chainId: 1, address: WETH_ADDRESS },
        { chainId: 1, address: 'invalid' },
        { chainId: 1, address: USDC_ADDRESS },
      ]
      const result = filterValidTokens(tokens)
      expect(result).toHaveLength(2)
      expect(result[0]?.address).toBe(WETH_ADDRESS.toLowerCase())
      expect(result[1]?.address).toBe(USDC_ADDRESS.toLowerCase())
    })
  })
})
