import { Protocol } from '@uniswap/router-sdk'
import { CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { TradingApi } from '@universe/api'
import { DYNAMIC_FEE_AMOUNT, V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import { uniswapRoutingProvider } from 'uniswap/src/utils/routingDiagram/routingProviders/uniswapRoutingProvider'

// Mock currency objects
const mockTokenA = new Token(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin')
const mockTokenB = new Token(1, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18, 'WETH', 'Wrapped Ether')
const mockTokenC = new Token(1, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'Dai Stablecoin')

// Helper to create mock pools
function createMockV2Pool(): Pair {
  const pool = Object.create(Pair.prototype)
  return pool
}

function createMockV3Pool(fee: number): V3Pool {
  const pool = Object.create(V3Pool.prototype)
  Object.defineProperty(pool, 'fee', {
    value: fee,
    writable: false,
    enumerable: true,
  })
  return pool
}

function createMockV4Pool(fee: number): V4Pool {
  const pool = Object.create(V4Pool.prototype)
  Object.defineProperty(pool, 'fee', {
    value: fee,
    writable: false,
    enumerable: true,
  })
  return pool
}

// Mock ClassicTrade helper - using weak typing for easier testing with less boilerplate
function createMockTrade(overrides: any): any {
  const defaultInputAmount = CurrencyAmount.fromRawAmount(mockTokenA, '1000000000')
  const defaultOutputAmount = CurrencyAmount.fromRawAmount(mockTokenB, '1000000000000000000')

  return {
    routing: TradingApi.Routing.CLASSIC,
    inputAmount: defaultInputAmount,
    outputAmount: defaultOutputAmount,
    tradeType: TradeType.EXACT_INPUT,
    swaps: [],
    ...overrides,
  }
}

describe('uniswapProvider', () => {
  describe('getPoolType', () => {
    it('identifies V2 pools correctly', () => {
      const mockV2Pool = createMockV2Pool()
      const trade = createMockTrade({
        swaps: [
          {
            route: {
              pools: [mockV2Pool],
              path: [mockTokenA, mockTokenB],
              protocol: Protocol.V2,
            },
            inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '1000000000'),
            outputAmount: CurrencyAmount.fromRawAmount(mockTokenB, '1000000000000000000'),
          },
        ],
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path[0]).toHaveProperty('poolType', 'V2')
    })

    it('identifies V3 pools correctly', () => {
      const mockV3Pool = createMockV3Pool(3000)
      const trade = createMockTrade({
        swaps: [
          {
            route: {
              pools: [mockV3Pool],
              path: [mockTokenA, mockTokenB],
              protocol: Protocol.V3,
            },
            inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '1000000000'),
            outputAmount: CurrencyAmount.fromRawAmount(mockTokenB, '1000000000000000000'),
          },
        ],
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path[0]).toHaveProperty('poolType', 'V3')
    })

    it('identifies V4 pools correctly', () => {
      const mockV4Pool = createMockV4Pool(3000)
      const trade = createMockTrade({
        swaps: [
          {
            route: {
              pools: [mockV4Pool],
              path: [mockTokenA, mockTokenB],
              protocol: Protocol.V4,
            },
            inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '1000000000'),
            outputAmount: CurrencyAmount.fromRawAmount(mockTokenB, '1000000000000000000'),
          },
        ],
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path[0]).toHaveProperty('poolType', 'V4')
    })

    it('throws error for unknown pool type', () => {
      const unknownPool = {}
      const trade = createMockTrade({
        swaps: [
          {
            route: {
              pools: [unknownPool],
              path: [mockTokenA, mockTokenB],
              protocol: Protocol.V3,
            },
            inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '1000000000'),
            outputAmount: CurrencyAmount.fromRawAmount(mockTokenB, '1000000000000000000'),
          },
        ],
      })

      expect(() => uniswapRoutingProvider.getRoutingEntries(trade as any)).toThrow('Unknown pool type')
    })
  })

  describe('percentage calculation', () => {
    it('calculates percentage correctly for EXACT_INPUT', () => {
      const totalInput = CurrencyAmount.fromRawAmount(mockTokenA, '1000000000')
      const swap1Input = CurrencyAmount.fromRawAmount(mockTokenA, '600000000')
      const swap2Input = CurrencyAmount.fromRawAmount(mockTokenA, '400000000')

      const trade = createMockTrade({
        inputAmount: totalInput,
        outputAmount: CurrencyAmount.fromRawAmount(mockTokenB, '2000000000000000000'),
        tradeType: TradeType.EXACT_INPUT,
        swaps: [
          {
            route: {
              pools: [createMockV3Pool(3000)],
              path: [mockTokenA, mockTokenB],
              protocol: Protocol.V3,
            },
            inputAmount: swap1Input,
            outputAmount: CurrencyAmount.fromRawAmount(mockTokenB, '1200000000000000000'),
          },
          {
            route: {
              pools: [createMockV3Pool(500)],
              path: [mockTokenA, mockTokenB],
              protocol: Protocol.V3,
            },
            inputAmount: swap2Input,
            outputAmount: CurrencyAmount.fromRawAmount(mockTokenB, '800000000000000000'),
          },
        ],
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.percent.toFixed(0)).toBe('60')
      expect(result[1]!.percent.toFixed(0)).toBe('40')
    })

    it('calculates percentage correctly for EXACT_OUTPUT', () => {
      const totalOutput = CurrencyAmount.fromRawAmount(mockTokenB, '1000000000000000000')
      const swap1Output = CurrencyAmount.fromRawAmount(mockTokenB, '700000000000000000')
      const swap2Output = CurrencyAmount.fromRawAmount(mockTokenB, '300000000000000000')

      const trade = createMockTrade({
        inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '1000000000'),
        outputAmount: totalOutput,
        tradeType: TradeType.EXACT_OUTPUT,
        swaps: [
          {
            route: {
              pools: [createMockV3Pool(3000)],
              path: [mockTokenA, mockTokenB],
              protocol: Protocol.V3,
            },
            inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '700000000'),
            outputAmount: swap1Output,
          },
          {
            route: {
              pools: [createMockV3Pool(500)],
              path: [mockTokenA, mockTokenB],
              protocol: Protocol.V3,
            },
            inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '300000000'),
            outputAmount: swap2Output,
          },
        ],
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.percent.toFixed(0)).toBe('70')
      expect(result[1]!.percent.toFixed(0)).toBe('30')
    })
  })

  describe('fee handling', () => {
    it('uses default fee for V2 pools', () => {
      const trade = createMockTrade({
        swaps: [
          {
            route: {
              pools: [createMockV2Pool()],
              path: [mockTokenA, mockTokenB],
              protocol: Protocol.V2,
            },
            inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '1000000000'),
            outputAmount: CurrencyAmount.fromRawAmount(mockTokenB, '1000000000000000000'),
          },
        ],
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path[0]).toHaveProperty('fee', V2_DEFAULT_FEE_TIER)
    })

    it('uses pool fee for V3 pools', () => {
      const customFee = 10000
      const trade = createMockTrade({
        swaps: [
          {
            route: {
              pools: [createMockV3Pool(customFee)],
              path: [mockTokenA, mockTokenB],
              protocol: Protocol.V3,
            },
            inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '1000000000'),
            outputAmount: CurrencyAmount.fromRawAmount(mockTokenB, '1000000000000000000'),
          },
        ],
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path[0]).toHaveProperty('fee', customFee)
    })

    it('identifies dynamic fees for V4 pools', () => {
      const trade = createMockTrade({
        swaps: [
          {
            route: {
              pools: [createMockV4Pool(DYNAMIC_FEE_AMOUNT)],
              path: [mockTokenA, mockTokenB],
              protocol: Protocol.V4,
            },
            inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '1000000000'),
            outputAmount: CurrencyAmount.fromRawAmount(mockTokenB, '1000000000000000000'),
          },
        ],
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path[0]).toHaveProperty('fee', DYNAMIC_FEE_AMOUNT)
      expect(result[0]!.path[0]).toHaveProperty('isDynamic', true)
    })

    it('identifies static fees for V4 pools', () => {
      const staticFee = 3000
      const trade = createMockTrade({
        swaps: [
          {
            route: {
              pools: [createMockV4Pool(staticFee)],
              path: [mockTokenA, mockTokenB],
              protocol: Protocol.V4,
            },
            inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '1000000000'),
            outputAmount: CurrencyAmount.fromRawAmount(mockTokenB, '1000000000000000000'),
          },
        ],
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path[0]).toHaveProperty('fee', staticFee)
      expect(result[0]!.path[0]).toHaveProperty('isDynamic', false)
    })
  })

  describe('path construction', () => {
    it('handles single hop correctly', () => {
      const trade = createMockTrade({
        swaps: [
          {
            route: {
              pools: [createMockV3Pool(3000)],
              path: [mockTokenA, mockTokenB],
              protocol: Protocol.V3,
            },
            inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '1000000000'),
            outputAmount: CurrencyAmount.fromRawAmount(mockTokenB, '1000000000000000000'),
          },
        ],
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path).toHaveLength(1)
      expect(result[0]!.path[0]!.inputCurrencyId).toContain(mockTokenA.address)
      expect(result[0]!.path[0]!.outputCurrencyId).toContain(mockTokenB.address)
    })

    it('handles multi-hop route (A → B → C)', () => {
      const trade = createMockTrade({
        swaps: [
          {
            route: {
              pools: [createMockV3Pool(3000), createMockV3Pool(500)],
              path: [mockTokenA, mockTokenB, mockTokenC],
              protocol: Protocol.V3,
            },
            inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '1000000000'),
            outputAmount: CurrencyAmount.fromRawAmount(mockTokenC, '1000000000000000000'),
          },
        ],
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path).toHaveLength(2)
      expect(result[0]!.path[0]!.inputCurrencyId).toContain(mockTokenA.address)
      expect(result[0]!.path[0]!.outputCurrencyId).toContain(mockTokenB.address)
      expect(result[0]!.path[1]!.inputCurrencyId).toContain(mockTokenB.address)
      expect(result[0]!.path[1]!.outputCurrencyId).toContain(mockTokenC.address)
    })

    it('handles mixed protocol route', () => {
      const trade = createMockTrade({
        swaps: [
          {
            route: {
              pools: [createMockV2Pool(), createMockV3Pool(3000), createMockV4Pool(500)],
              path: [mockTokenA, mockTokenB, mockTokenC, mockTokenA],
              protocol: Protocol.MIXED,
            },
            inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '1000000000'),
            outputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '999000000'),
          },
        ],
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path).toHaveLength(3)
      expect(result[0]!.path[0]).toHaveProperty('poolType', 'V2')
      expect(result[0]!.path[1]).toHaveProperty('poolType', 'V3')
      expect(result[0]!.path[2]).toHaveProperty('poolType', 'V4')
      expect(result[0]!.protocolLabel).toBe('V2 + V3 + V4')
    })

    it('throws error for invalid route path', () => {
      const trade = createMockTrade({
        swaps: [
          {
            route: {
              pools: [createMockV3Pool(3000)],
              path: [mockTokenA], // Invalid: only one token
              protocol: Protocol.V3,
            },
            inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '1000000000'),
            outputAmount: CurrencyAmount.fromRawAmount(mockTokenB, '1000000000000000000'),
          },
        ],
      })

      expect(() => uniswapRoutingProvider.getRoutingEntries(trade as any)).toThrow('Invalid route path')
    })
  })

  describe('edge cases', () => {
    it('handles empty swaps array', () => {
      const trade = createMockTrade({
        swaps: [],
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result).toHaveLength(0)
    })

    it('handles multiple swaps with different protocols', () => {
      const trade = createMockTrade({
        swaps: [
          {
            route: {
              pools: [createMockV2Pool()],
              path: [mockTokenA, mockTokenB],
              protocol: Protocol.V2,
            },
            inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '500000000'),
            outputAmount: CurrencyAmount.fromRawAmount(mockTokenB, '500000000000000000'),
          },
          {
            route: {
              pools: [createMockV3Pool(3000)],
              path: [mockTokenA, mockTokenB],
              protocol: Protocol.V3,
            },
            inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '300000000'),
            outputAmount: CurrencyAmount.fromRawAmount(mockTokenB, '300000000000000000'),
          },
          {
            route: {
              pools: [createMockV4Pool(500)],
              path: [mockTokenA, mockTokenB],
              protocol: Protocol.V4,
            },
            inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '200000000'),
            outputAmount: CurrencyAmount.fromRawAmount(mockTokenB, '200000000000000000'),
          },
        ],
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result).toHaveLength(3)
      expect(result[0]!.protocolLabel).toBe('V2')
      expect(result[1]!.protocolLabel).toBe('V3')
      expect(result[2]!.protocolLabel).toBe('V4')
    })

    it('preserves protocol label casing', () => {
      const trade = createMockTrade({
        swaps: [
          {
            route: {
              pools: [createMockV3Pool(3000)],
              path: [mockTokenA, mockTokenB],
              protocol: Protocol.V3,
            },
            inputAmount: CurrencyAmount.fromRawAmount(mockTokenA, '1000000000'),
            outputAmount: CurrencyAmount.fromRawAmount(mockTokenB, '1000000000000000000'),
          },
        ],
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.protocolLabel).toBe('V3')
    })
  })
})
