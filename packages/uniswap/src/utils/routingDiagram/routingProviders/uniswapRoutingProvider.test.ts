import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { DYNAMIC_FEE_AMOUNT, V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import {
  summarizeSwapSteps,
  uniswapRoutingProvider,
} from 'uniswap/src/utils/routingDiagram/routingProviders/uniswapRoutingProvider'

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

// V3 packed paths: 20-byte token + 3-byte fee, repeating, ending with 20-byte token.
// Token addresses below are stripped of '0x'; fees are 6 hex chars (3 bytes).
const TOKEN_A_HEX = TOKEN_A_ADDRESS.slice(2)
const TOKEN_B_HEX = TOKEN_B_ADDRESS.slice(2)
const TOKEN_C_HEX = TOKEN_C_ADDRESS.slice(2)
const FEE_LOW = '0001f4' // 500
const FEE_MED = '000bb8' // 3000
const FEE_HIGH = '002710' // 10000

function v3Path(...parts: string[]): string {
  return '0x' + parts.join('')
}

const V3_PATH_1_POOL = v3Path(TOKEN_A_HEX, FEE_MED, TOKEN_B_HEX) // 43 bytes
const V3_PATH_2_POOLS = v3Path(TOKEN_A_HEX, FEE_MED, TOKEN_B_HEX, FEE_LOW, TOKEN_C_HEX) // 66 bytes
const V3_PATH_3_POOLS = v3Path(TOKEN_A_HEX, FEE_MED, TOKEN_B_HEX, FEE_LOW, TOKEN_C_HEX, FEE_HIGH, TOKEN_A_HEX) // 89 bytes

function v2Step(path: string[], exactOut = false): TradingApi.SwapStep {
  return {
    type: (exactOut ? 'V2_SWAP_EXACT_OUT' : 'V2_SWAP_EXACT_IN') as TradingApi.V2SwapExactInStep['type'],
    recipient: '0x0000000000000000000000000000000000000000',
    amountIn: '0',
    amountOutMin: '0',
    path,
  } as TradingApi.SwapStep
}

function v3Step(path: string, exactOut = false): TradingApi.SwapStep {
  return {
    type: (exactOut ? 'V3_SWAP_EXACT_OUT' : 'V3_SWAP_EXACT_IN') as TradingApi.V3SwapExactInStep['type'],
    recipient: '0x0000000000000000000000000000000000000000',
    amountIn: '0',
    amountOutMin: '0',
    path,
  } as TradingApi.SwapStep
}

function v4Step(actions: TradingApi.V4Action[]): TradingApi.SwapStep {
  return {
    type: 'V4_SWAP' as TradingApi.V4SwapStep['type'],
    v4Actions: actions,
  } as TradingApi.SwapStep
}

function v4SwapMulti(pathLen: number, exactOut = false): TradingApi.V4Action {
  return {
    action: (exactOut ? 'SWAP_EXACT_OUT' : 'SWAP_EXACT_IN') as TradingApi.V4SwapExactIn['action'],
    currencyIn: '0x0000000000000000000000000000000000000000',
    path: Array.from({ length: pathLen }, () => ({
      intermediateCurrency: '0x0000000000000000000000000000000000000000',
      fee: 3000,
      tickSpacing: 60,
      hooks: '0x0000000000000000000000000000000000000000',
      hookData: '0x',
    })) as TradingApi.SwapPathKey[],
    amountIn: '0',
    amountOutMinimum: '0',
  } as TradingApi.V4Action
}

function v4SwapSingle(exactOut = false): TradingApi.V4Action {
  return {
    action: (exactOut ? 'SWAP_EXACT_OUT_SINGLE' : 'SWAP_EXACT_IN_SINGLE') as TradingApi.V4SwapExactInSingle['action'],
    poolKey: {} as TradingApi.SwapPoolKey,
    zeroForOne: true,
    amountIn: '0',
    amountOutMinimum: '0',
    hookData: '0x',
  } as TradingApi.V4Action
}

const V4_SETTLE: TradingApi.V4Action = {
  action: 'SETTLE' as TradingApi.V4Settle['action'],
  currency: '0x0000000000000000000000000000000000000000',
  amount: '0',
} as TradingApi.V4Action

const V4_TAKE_ALL: TradingApi.V4Action = {
  action: 'TAKE_ALL' as TradingApi.V4TakeAll['action'],
  currency: '0x0000000000000000000000000000000000000000',
  minAmount: '0',
} as TradingApi.V4Action

const WRAP_ETH_STEP: TradingApi.SwapStep = {
  type: 'WRAP_ETH' as TradingApi.WrapEthStep['type'],
  recipient: '0x0000000000000000000000000000000000000000',
  amount: '0',
} as TradingApi.SwapStep

const UNWRAP_WETH_STEP: TradingApi.SwapStep = {
  type: 'UNWRAP_WETH' as TradingApi.UnwrapWethStep['type'],
  recipient: '0x0000000000000000000000000000000000000000',
  amountMin: '0',
} as TradingApi.SwapStep

describe('summarizeSwapSteps', () => {
  it('returns zero pools and empty versions for empty steps', () => {
    expect(summarizeSwapSteps([])).toEqual({ pools: 0, versions: [] })
  })

  describe('V2', () => {
    it('counts pools as path.length - 1', () => {
      expect(summarizeSwapSteps([v2Step([TOKEN_A_ADDRESS, TOKEN_B_ADDRESS])])).toEqual({
        pools: 1,
        versions: ['V2'],
      })
      expect(summarizeSwapSteps([v2Step([TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, TOKEN_C_ADDRESS])])).toEqual({
        pools: 2,
        versions: ['V2'],
      })
    })

    it('treats EXACT_OUT identically to EXACT_IN', () => {
      expect(summarizeSwapSteps([v2Step([TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, TOKEN_C_ADDRESS], true)])).toEqual({
        pools: 2,
        versions: ['V2'],
      })
    })

    it('does not produce a negative count for a degenerate single-token path', () => {
      expect(summarizeSwapSteps([v2Step([TOKEN_A_ADDRESS])])).toEqual({ pools: 0, versions: ['V2'] })
    })
  })

  describe('V3', () => {
    it('decodes 1, 2, and 3 pool paths from packed hex', () => {
      expect(summarizeSwapSteps([v3Step(V3_PATH_1_POOL)])).toEqual({ pools: 1, versions: ['V3'] })
      expect(summarizeSwapSteps([v3Step(V3_PATH_2_POOLS)])).toEqual({ pools: 2, versions: ['V3'] })
      expect(summarizeSwapSteps([v3Step(V3_PATH_3_POOLS)])).toEqual({ pools: 3, versions: ['V3'] })
    })

    it('accepts a path without the 0x prefix', () => {
      expect(summarizeSwapSteps([v3Step(V3_PATH_2_POOLS.slice(2))])).toEqual({ pools: 2, versions: ['V3'] })
    })

    it('treats EXACT_OUT identically to EXACT_IN', () => {
      expect(summarizeSwapSteps([v3Step(V3_PATH_2_POOLS, true)])).toEqual({ pools: 2, versions: ['V3'] })
    })

    it('skips malformed paths instead of producing fractional pool counts', () => {
      // 40-byte placeholder used by backend test fixtures — not a valid V3 path.
      const placeholder = '0x' + 'aa'.repeat(40)
      expect(summarizeSwapSteps([v3Step(placeholder)])).toEqual({ pools: 0, versions: ['V3'] })
    })

    it('skips paths shorter than the minimum (43 bytes)', () => {
      const tooShort = '0x' + TOKEN_A_HEX // only 20 bytes
      expect(summarizeSwapSteps([v3Step(tooShort)])).toEqual({ pools: 0, versions: ['V3'] })
    })
  })

  describe('V4', () => {
    it('counts SWAP_EXACT_IN as path.length', () => {
      expect(summarizeSwapSteps([v4Step([v4SwapMulti(3)])])).toEqual({ pools: 3, versions: ['V4'] })
    })

    it('counts SWAP_EXACT_IN_SINGLE as 1', () => {
      expect(summarizeSwapSteps([v4Step([v4SwapSingle()])])).toEqual({ pools: 1, versions: ['V4'] })
    })

    it('counts SWAP_EXACT_OUT and SWAP_EXACT_OUT_SINGLE the same as IN variants', () => {
      expect(summarizeSwapSteps([v4Step([v4SwapMulti(2, true)])])).toEqual({ pools: 2, versions: ['V4'] })
      expect(summarizeSwapSteps([v4Step([v4SwapSingle(true)])])).toEqual({ pools: 1, versions: ['V4'] })
    })

    it('does not count SETTLE / TAKE_ALL actions toward pools', () => {
      expect(summarizeSwapSteps([v4Step([V4_SETTLE, v4SwapSingle(), V4_TAKE_ALL])])).toEqual({
        pools: 1,
        versions: ['V4'],
      })
    })

    it('returns empty versions when a V4 step has only non-swap actions', () => {
      // No swap actions means no pools and no V4 version tag.
      expect(summarizeSwapSteps([v4Step([V4_SETTLE, V4_TAKE_ALL])])).toEqual({ pools: 0, versions: [] })
    })

    it('sums multiple swap actions within a single V4_SWAP step', () => {
      expect(summarizeSwapSteps([v4Step([v4SwapSingle(), v4SwapMulti(2)])])).toEqual({
        pools: 3,
        versions: ['V4'],
      })
    })
  })

  describe('wrap/unwrap', () => {
    it('contributes zero pools and no version tag', () => {
      expect(summarizeSwapSteps([WRAP_ETH_STEP])).toEqual({ pools: 0, versions: [] })
      expect(summarizeSwapSteps([UNWRAP_WETH_STEP])).toEqual({ pools: 0, versions: [] })
    })

    it('is transparent when wrapping a swap', () => {
      expect(summarizeSwapSteps([WRAP_ETH_STEP, v2Step([TOKEN_A_ADDRESS, TOKEN_B_ADDRESS]), UNWRAP_WETH_STEP])).toEqual(
        { pools: 1, versions: ['V2'] },
      )
    })
  })

  describe('mixed protocols', () => {
    it('sums pools across V2 + V3 + V4 and sorts versions', () => {
      expect(
        summarizeSwapSteps([
          v2Step([TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, TOKEN_C_ADDRESS]),
          v3Step(V3_PATH_2_POOLS),
          v4Step([v4SwapMulti(2), v4SwapSingle()]),
        ]),
      ).toEqual({ pools: 7, versions: ['V2', 'V3', 'V4'] })
    })

    it('orders versions deterministically regardless of step order', () => {
      const a = summarizeSwapSteps([v4Step([v4SwapSingle()]), v2Step([TOKEN_A_ADDRESS, TOKEN_B_ADDRESS])])
      const b = summarizeSwapSteps([v2Step([TOKEN_A_ADDRESS, TOKEN_B_ADDRESS]), v4Step([v4SwapSingle()])])
      expect(a).toEqual(b)
      expect(a.versions).toEqual(['V2', 'V4'])
    })
  })
})
