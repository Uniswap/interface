import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { DYNAMIC_FEE_AMOUNT, V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import { uniswapRoutingProvider } from 'uniswap/src/utils/routingDiagram/routingProviders/uniswapRoutingProvider'

const CHAIN_ID = 1
const TOKEN_A_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const TOKEN_B_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const TOKEN_C_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

function mockToken(address: string): TradingApi.TokenInRoute {
  return { address, chainId: CHAIN_ID, decimals: '18', symbol: 'TKN' }
}

function createV2Hop(
  tokenIn: string,
  tokenOut: string,
  overrides?: Partial<TradingApi.V2PoolInRoute>,
): TradingApi.V2PoolInRoute {
  return {
    type: 'v2-pool',
    address: '0x0000000000000000000000000000000000000001',
    tokenIn: mockToken(tokenIn),
    tokenOut: mockToken(tokenOut),
    amountIn: '1000000000',
    amountOut: '1000000000000000000',
    ...overrides,
  }
}

function createV3Hop(
  tokenIn: string,
  tokenOut: string,
  fee: string,
  overrides?: Partial<TradingApi.V3PoolInRoute>,
): TradingApi.V3PoolInRoute {
  return {
    type: 'v3-pool',
    address: '0x0000000000000000000000000000000000000002',
    tokenIn: mockToken(tokenIn),
    tokenOut: mockToken(tokenOut),
    fee,
    amountIn: '1000000000',
    amountOut: '1000000000000000000',
    ...overrides,
  }
}

function createV4Hop(
  tokenIn: string,
  tokenOut: string,
  fee: string,
  overrides?: Partial<TradingApi.V4PoolInRoute>,
): TradingApi.V4PoolInRoute {
  return {
    type: 'v4-pool',
    address: '0x0000000000000000000000000000000000000003',
    tokenIn: mockToken(tokenIn),
    tokenOut: mockToken(tokenOut),
    fee,
    sqrtRatioX96: '0',
    liquidity: '0',
    tickCurrent: '0',
    tickSpacing: 0,
    hooks: '0x0000000000000000000000000000000000000000',
    amountIn: '1000000000',
    amountOut: '1000000000000000000',
    ...overrides,
  }
}

function createMockTrade(overrides: any): any {
  return {
    routing: TradingApi.Routing.CLASSIC,
    tradeType: TradeType.EXACT_INPUT,
    quote: { quote: { route: [] } },
    ...overrides,
  }
}

describe('uniswapProvider', () => {
  describe('getPoolType', () => {
    it('identifies V2 pools correctly', () => {
      const trade = createMockTrade({
        quote: { quote: { route: [[createV2Hop(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS)]] } },
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path[0]).toHaveProperty('poolType', 'V2')
    })

    it('identifies V3 pools correctly', () => {
      const trade = createMockTrade({
        quote: { quote: { route: [[createV3Hop(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, '3000')]] } },
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path[0]).toHaveProperty('poolType', 'V3')
    })

    it('identifies V4 pools correctly', () => {
      const trade = createMockTrade({
        quote: { quote: { route: [[createV4Hop(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, '3000')]] } },
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path[0]).toHaveProperty('poolType', 'V4')
    })

    it('throws for unknown pool type', () => {
      const trade = createMockTrade({
        quote: {
          quote: {
            route: [
              [
                {
                  type: 'unknown-pool',
                  tokenIn: mockToken(TOKEN_A_ADDRESS),
                  tokenOut: mockToken(TOKEN_B_ADDRESS),
                  amountIn: '1000000000',
                  amountOut: '1000000000000000000',
                },
              ],
            ],
          },
        },
      })

      expect(() => uniswapRoutingProvider.getRoutingEntries(trade)).toThrow('Unknown pool type')
    })
  })

  describe('percentage calculation', () => {
    it('calculates percentage correctly for EXACT_INPUT', () => {
      const trade = createMockTrade({
        tradeType: TradeType.EXACT_INPUT,
        quote: {
          quote: {
            route: [
              [createV3Hop(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, '3000', { amountIn: '600000000' })],
              [createV3Hop(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, '500', { amountIn: '400000000' })],
            ],
          },
        },
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.percent.toFixed(0)).toBe('60')
      expect(result[1]!.percent.toFixed(0)).toBe('40')
    })

    it('calculates percentage correctly for EXACT_OUTPUT', () => {
      const trade = createMockTrade({
        tradeType: TradeType.EXACT_OUTPUT,
        quote: {
          quote: {
            route: [
              [createV3Hop(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, '3000', { amountOut: '700000000000000000' })],
              [createV3Hop(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, '500', { amountOut: '300000000000000000' })],
            ],
          },
        },
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.percent.toFixed(0)).toBe('70')
      expect(result[1]!.percent.toFixed(0)).toBe('30')
    })
  })

  describe('fee handling', () => {
    it('uses default fee for V2 pools', () => {
      const trade = createMockTrade({
        quote: { quote: { route: [[createV2Hop(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS)]] } },
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path[0]).toHaveProperty('fee', V2_DEFAULT_FEE_TIER)
    })

    it('uses pool fee for V3 pools', () => {
      const customFee = 10000
      const trade = createMockTrade({
        quote: {
          quote: { route: [[createV3Hop(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, customFee.toString())]] },
        },
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path[0]).toHaveProperty('fee', customFee)
    })

    it('identifies dynamic fees for V4 pools', () => {
      const trade = createMockTrade({
        quote: {
          quote: {
            route: [[createV4Hop(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, DYNAMIC_FEE_AMOUNT.toString())]],
          },
        },
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path[0]).toHaveProperty('fee', DYNAMIC_FEE_AMOUNT)
      expect(result[0]!.path[0]).toHaveProperty('isDynamic', true)
    })

    it('identifies static fees for V4 pools', () => {
      const staticFee = 3000
      const trade = createMockTrade({
        quote: {
          quote: { route: [[createV4Hop(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, staticFee.toString())]] },
        },
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path[0]).toHaveProperty('fee', staticFee)
      expect(result[0]!.path[0]).toHaveProperty('isDynamic', false)
    })
  })

  describe('path construction', () => {
    it('handles single hop correctly', () => {
      const trade = createMockTrade({
        quote: { quote: { route: [[createV3Hop(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, '3000')]] } },
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path).toHaveLength(1)
      expect(result[0]!.path[0]!.inputCurrencyId).toContain(TOKEN_A_ADDRESS)
      expect(result[0]!.path[0]!.outputCurrencyId).toContain(TOKEN_B_ADDRESS)
    })

    it('handles multi-hop route (A → B → C)', () => {
      const trade = createMockTrade({
        quote: {
          quote: {
            route: [
              [
                createV3Hop(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, '3000', { amountIn: '1000000000' }),
                createV3Hop(TOKEN_B_ADDRESS, TOKEN_C_ADDRESS, '500', { amountOut: '1000000000000000000' }),
              ],
            ],
          },
        },
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path).toHaveLength(2)
      expect(result[0]!.path[0]!.inputCurrencyId).toContain(TOKEN_A_ADDRESS)
      expect(result[0]!.path[0]!.outputCurrencyId).toContain(TOKEN_B_ADDRESS)
      expect(result[0]!.path[1]!.inputCurrencyId).toContain(TOKEN_B_ADDRESS)
      expect(result[0]!.path[1]!.outputCurrencyId).toContain(TOKEN_C_ADDRESS)
    })

    it('handles mixed protocol route', () => {
      const trade = createMockTrade({
        quote: {
          quote: {
            route: [
              [
                createV2Hop(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, { amountIn: '1000000000' }),
                createV3Hop(TOKEN_B_ADDRESS, TOKEN_C_ADDRESS, '3000'),
                createV4Hop(TOKEN_C_ADDRESS, TOKEN_A_ADDRESS, '500', { amountOut: '999000000' }),
              ],
            ],
          },
        },
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.path).toHaveLength(3)
      expect(result[0]!.path[0]).toHaveProperty('poolType', 'V2')
      expect(result[0]!.path[1]).toHaveProperty('poolType', 'V3')
      expect(result[0]!.path[2]).toHaveProperty('poolType', 'V4')
      expect(result[0]!.protocolLabel).toBe('V2 + V3 + V4')
    })

    it('throws for missing token data', () => {
      const trade = createMockTrade({
        quote: {
          quote: {
            route: [
              [
                {
                  type: 'v3-pool',
                  tokenIn: { address: undefined, chainId: undefined },
                  tokenOut: mockToken(TOKEN_B_ADDRESS),
                  fee: '3000',
                  amountIn: '1000000000',
                  amountOut: '1000000000000000000',
                },
              ],
            ],
          },
        },
      })

      expect(() => uniswapRoutingProvider.getRoutingEntries(trade)).toThrow('Missing token data')
    })
  })

  describe('edge cases', () => {
    it('handles empty route array', () => {
      const trade = createMockTrade({
        quote: { quote: { route: [] } },
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result).toHaveLength(0)
    })

    it('handles undefined route', () => {
      const trade = createMockTrade({
        quote: { quote: {} },
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result).toHaveLength(0)
    })

    it('handles multiple routes with different protocols', () => {
      const trade = createMockTrade({
        tradeType: TradeType.EXACT_INPUT,
        quote: {
          quote: {
            route: [
              [createV2Hop(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, { amountIn: '500000000' })],
              [createV3Hop(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, '3000', { amountIn: '300000000' })],
              [createV4Hop(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, '500', { amountIn: '200000000' })],
            ],
          },
        },
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result).toHaveLength(3)
      expect(result[0]!.protocolLabel).toBe('V2')
      expect(result[1]!.protocolLabel).toBe('V3')
      expect(result[2]!.protocolLabel).toBe('V4')
    })

    it('preserves protocol label casing', () => {
      const trade = createMockTrade({
        quote: { quote: { route: [[createV3Hop(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, '3000')]] } },
      })

      const result = uniswapRoutingProvider.getRoutingEntries(trade)
      expect(result[0]!.protocolLabel).toBe('V3')
    })
  })
})
