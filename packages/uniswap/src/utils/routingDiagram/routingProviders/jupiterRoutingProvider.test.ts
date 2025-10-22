import { Percent } from '@uniswap/sdk-core'
import { type JupiterOrderResponse, TradingApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SolanaTrade } from 'uniswap/src/features/transactions/swap/types/solana'
import { jupiterRoutingProvider } from 'uniswap/src/utils/routingDiagram/routingProviders/jupiterRoutingProvider'

function createMockSwapInfo(params: { inputMint: string; outputMint: string; label: string }): {
  inputMint: string
  outputMint: string
  label: string
  ammKey: string
  inAmount: string
  outAmount: string
  feeAmount: string
  feeMint: string
} {
  return {
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    label: params.label,
    ammKey: 'mockAmmKey',
    inAmount: '1000000',
    outAmount: '1000000',
    feeAmount: '1000',
    feeMint: params.inputMint,
  }
}

function createMockJupiterTrade(
  routePlan: Array<{ swapInfo: ReturnType<typeof createMockSwapInfo>; percent: number }>,
): SolanaTrade {
  return {
    routing: TradingApi.Routing.JUPITER,
    quote: {
      quote: {
        routePlan,
      } as unknown as JupiterOrderResponse,
    } as SolanaTrade['quote'],
  } as unknown as SolanaTrade
}

describe('jupiterProvider', () => {
  describe('getRoutingEntries', () => {
    it('handles sequential multi-hop route (A → B → C)', () => {
      const mockTrade = createMockJupiterTrade([
        {
          swapInfo: createMockSwapInfo({ inputMint: 'tokenA', outputMint: 'tokenB', label: 'Raydium' }),
          percent: 100,
        },
        {
          swapInfo: createMockSwapInfo({ inputMint: 'tokenB', outputMint: 'tokenC', label: 'Orca' }),
          percent: 100,
        },
      ])

      const result = jupiterRoutingProvider.getRoutingEntries(mockTrade)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        percent: new Percent(100, 100),
        protocolLabel: 'Jupiter',
        path: [
          {
            type: 'genericHop',
            inputCurrencyId: `${UniverseChainId.Solana}-tokenA`,
            outputCurrencyId: `${UniverseChainId.Solana}-tokenB`,
            name: 'Raydium',
          },
          {
            type: 'genericHop',
            inputCurrencyId: `${UniverseChainId.Solana}-tokenB`,
            outputCurrencyId: `${UniverseChainId.Solana}-tokenC`,
            name: 'Orca',
          },
        ],
      })
    })

    it('handles sequential 3-hop route (A → B → C → D)', () => {
      const mockTrade = createMockJupiterTrade([
        {
          swapInfo: createMockSwapInfo({ inputMint: 'tokenA', outputMint: 'tokenB', label: 'Raydium' }),
          percent: 100,
        },
        {
          swapInfo: createMockSwapInfo({ inputMint: 'tokenB', outputMint: 'tokenC', label: 'Orca' }),
          percent: 100,
        },
        {
          swapInfo: createMockSwapInfo({ inputMint: 'tokenC', outputMint: 'tokenD', label: 'Phoenix' }),
          percent: 100,
        },
      ])

      const result = jupiterRoutingProvider.getRoutingEntries(mockTrade)

      expect(result).toHaveLength(1)
      expect(result[0]!.path).toHaveLength(3)
      expect(result[0]!.percent).toEqual(new Percent(100, 100))
      expect(result[0]!.path[2]).toEqual({
        type: 'genericHop',
        inputCurrencyId: `${UniverseChainId.Solana}-tokenC`,
        outputCurrencyId: `${UniverseChainId.Solana}-tokenD`,
        name: 'Phoenix',
      })
    })

    it('handles split routes with different percentages', () => {
      const mockTrade = createMockJupiterTrade([
        {
          swapInfo: createMockSwapInfo({ inputMint: 'tokenA', outputMint: 'tokenB', label: 'Raydium' }),
          percent: 60,
        },
        {
          swapInfo: createMockSwapInfo({ inputMint: 'tokenA', outputMint: 'tokenB', label: 'Orca' }),
          percent: 40,
        },
      ])

      const result = jupiterRoutingProvider.getRoutingEntries(mockTrade)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        percent: new Percent(60, 100),
        protocolLabel: 'Jupiter',
        path: [
          {
            type: 'genericHop',
            inputCurrencyId: `${UniverseChainId.Solana}-tokenA`,
            outputCurrencyId: `${UniverseChainId.Solana}-tokenB`,
            name: 'Raydium',
          },
        ],
      })
      expect(result[1]).toEqual({
        percent: new Percent(40, 100),
        protocolLabel: 'Jupiter',
        path: [
          {
            type: 'genericHop',
            inputCurrencyId: `${UniverseChainId.Solana}-tokenA`,
            outputCurrencyId: `${UniverseChainId.Solana}-tokenB`,
            name: 'Orca',
          },
        ],
      })
    })

    it('handles split routes with 3 parallel paths', () => {
      const mockTrade = createMockJupiterTrade([
        {
          swapInfo: createMockSwapInfo({ inputMint: 'USDC', outputMint: 'SOL', label: 'Raydium' }),
          percent: 50,
        },
        {
          swapInfo: createMockSwapInfo({ inputMint: 'USDC', outputMint: 'SOL', label: 'Orca' }),
          percent: 30,
        },
        {
          swapInfo: createMockSwapInfo({ inputMint: 'USDC', outputMint: 'SOL', label: 'Phoenix' }),
          percent: 20,
        },
      ])

      const result = jupiterRoutingProvider.getRoutingEntries(mockTrade)

      expect(result).toHaveLength(3)
      expect(result.map((r) => r.percent.toFixed(0))).toEqual(['50', '30', '20'])
      expect(result.map((r) => (r.path[0] as Extract<(typeof r.path)[0], { type: 'genericHop' }>).name)).toEqual([
        'Raydium',
        'Orca',
        'Phoenix',
      ])
    })

    it('handles single hop route', () => {
      const mockTrade = createMockJupiterTrade([
        {
          swapInfo: createMockSwapInfo({ inputMint: 'tokenA', outputMint: 'tokenB', label: 'Raydium' }),
          percent: 100,
        },
      ])

      const result = jupiterRoutingProvider.getRoutingEntries(mockTrade)

      expect(result).toHaveLength(1)
      expect(result[0]!.path).toHaveLength(1)
      expect(result[0]!.percent).toEqual(new Percent(100, 100))
    })

    it('handles empty route plan', () => {
      const mockTrade = createMockJupiterTrade([])

      const result = jupiterRoutingProvider.getRoutingEntries(mockTrade)

      expect(result).toHaveLength(0)
    })

    it('correctly identifies non-sequential routes when outputs do not match next inputs', () => {
      const mockTrade = createMockJupiterTrade([
        {
          swapInfo: createMockSwapInfo({ inputMint: 'tokenA', outputMint: 'tokenB', label: 'Raydium' }),
          percent: 100,
        },
        {
          swapInfo: createMockSwapInfo({ inputMint: 'tokenA', outputMint: 'tokenC', label: 'Orca' }), // Not matching previous output (tokenB)
          percent: 100,
        },
      ])

      const result = jupiterRoutingProvider.getRoutingEntries(mockTrade)

      // Should be treated as split routes, not sequential
      expect(result).toHaveLength(2)
      expect(result[0]!.path).toHaveLength(1)
      expect(result[1]!.path).toHaveLength(1)
    })

    it('builds correct currency IDs for Solana chain', () => {
      const mockTrade = createMockJupiterTrade([
        {
          swapInfo: createMockSwapInfo({
            inputMint: 'So11111111111111111111111111111111111111112',
            outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            label: 'Orca',
          }),
          percent: 100,
        },
      ])

      const result = jupiterRoutingProvider.getRoutingEntries(mockTrade)

      expect(result[0]!.path[0]!.inputCurrencyId).toBe(
        `${UniverseChainId.Solana}-So11111111111111111111111111111111111111112`,
      )
      expect(result[0]!.path[0]!.outputCurrencyId).toBe(
        `${UniverseChainId.Solana}-EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
      )
    })
  })
})
