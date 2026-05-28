import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { validateOrdersForCancellation } from 'uniswap/src/features/transactions/cancel/validation'
import { UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { uniswapXOrderDetails } from 'uniswap/src/test/fixtures'

describe('validateOrdersForCancellation', () => {
  const createMockOrder = (overrides?: Partial<UniswapXOrderDetails>): UniswapXOrderDetails =>
    uniswapXOrderDetails(overrides ?? {}) as UniswapXOrderDetails

  describe('empty orders', () => {
    it('should return error for empty array', () => {
      const result = validateOrdersForCancellation([])
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid orders array')
    })
  })

  describe('chain validation', () => {
    it('should return valid for single order', () => {
      const orders = [createMockOrder()]
      const result = validateOrdersForCancellation(orders)
      expect(result.valid).toBe(true)
      expect(result.chainId).toBe(UniverseChainId.Mainnet)
    })

    it('should return valid for multiple orders on same chain', () => {
      const orders = [
        createMockOrder({ id: 'order1' }),
        createMockOrder({ id: 'order2' }),
        createMockOrder({ id: 'order3' }),
      ]
      const result = validateOrdersForCancellation(orders)
      expect(result.valid).toBe(true)
      expect(result.chainId).toBe(UniverseChainId.Mainnet)
    })

    it('should return error for orders on different chains', () => {
      const orders = [
        createMockOrder({ chainId: UniverseChainId.Mainnet }),
        createMockOrder({ chainId: UniverseChainId.ArbitrumOne }),
        createMockOrder({ chainId: UniverseChainId.Optimism }),
      ]
      const result = validateOrdersForCancellation(orders)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Cannot cancel orders from different chains')
      expect(result.error).toContain('1, 42161, 10')
    })

    it('should return error for mixed chains even with mostly same chain', () => {
      const orders = [
        createMockOrder({ chainId: UniverseChainId.Mainnet }),
        createMockOrder({ chainId: UniverseChainId.Mainnet }),
        createMockOrder({ chainId: UniverseChainId.ArbitrumOne }),
      ]
      const result = validateOrdersForCancellation(orders)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Cannot cancel orders from different chains')
    })
  })

  describe('encoded data validation', () => {
    it('should return valid when all orders have encoded data', () => {
      const orders = [createMockOrder({ encodedOrder: '0xencoded1' }), createMockOrder({ encodedOrder: '0xencoded2' })]
      const result = validateOrdersForCancellation(orders)
      expect(result.valid).toBe(true)
    })

    it('should return valid when some orders have encoded data', () => {
      const orders = [createMockOrder({ encodedOrder: '0xencoded1' }), createMockOrder({ encodedOrder: undefined })]
      const result = validateOrdersForCancellation(orders)
      expect(result.valid).toBe(true)
    })
  })

  describe('complex scenarios', () => {
    it('should validate successfully for valid batch', () => {
      const orders = [
        createMockOrder({
          id: 'order1',
          chainId: UniverseChainId.Polygon,
          encodedOrder: '0xencoded1',
        }),
        createMockOrder({
          id: 'order2',
          chainId: UniverseChainId.Polygon,
          encodedOrder: '0xencoded2',
        }),
        createMockOrder({
          id: 'order3',
          chainId: UniverseChainId.Polygon,
          encodedOrder: undefined, // Some orders without encoded data is ok
        }),
      ]
      const result = validateOrdersForCancellation(orders)
      expect(result.valid).toBe(true)
      expect(result.chainId).toBe(UniverseChainId.Polygon)
    })
  })
})
