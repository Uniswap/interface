import { waitFor } from '@testing-library/react-native'
import { GraphQLApi } from '@universe/api'
import { act } from 'react-test-renderer'
import { useTokenPriceHistory } from 'src/components/PriceExplorer/usePriceHistory'
import { renderHookWithProviders } from 'src/test/render'
import { USDC, USDC_ARBITRUM, USDC_BASE, USDC_OPTIMISM, USDC_POLYGON } from 'uniswap/src/constants/tokens'
import {
  getLatestPrice,
  priceHistory,
  SAMPLE_CURRENCY_ID_1,
  timestampedAmount,
  token,
  tokenMarket,
  tokenProject,
  tokenProjectMarket,
  usdcTokenProject,
} from 'uniswap/src/test/fixtures'
import { queryResolvers } from 'uniswap/src/test/utils'

const mockTokenProjectsQuery = (historyPrices: number[]) => (): GraphQLApi.TokenProject[] => {
  const history = historyPrices.map((value) => timestampedAmount({ value }))

  return [
    tokenProject({
      markets: [
        tokenProjectMarket({
          priceHistory: history,
          price: getLatestPrice(history),
        }),
      ],
    }),
  ]
}

const formatPriceHistory = (history: GraphQLApi.TimestampedAmount[]): Omit<GraphQLApi.TimestampedAmount, 'id'>[] =>
  history.map(({ timestamp, value }) => ({ value, timestamp: timestamp * 1000 }))

/**
 * Creates a USDC token project with matching priceHistory for both the aggregated market
 * and the Ethereum token's market. This ensures the hook returns the expected data since
 * it prefers per-chain price history over aggregated price history.
 */
const createUsdcTokenProjectWithMatchingPriceHistory = (
  history: (GraphQLApi.TimestampedAmount | undefined)[],
): GraphQLApi.TokenProject => ({
  ...usdcTokenProject({ priceHistory: history }),
  tokens: [
    token({ sdkToken: USDC, market: tokenMarket({ priceHistory: history }) }),
    token({ sdkToken: USDC_POLYGON }),
    token({ sdkToken: USDC_ARBITRUM }),
    token({ sdkToken: USDC_BASE, market: tokenMarket() }),
    token({ sdkToken: USDC_OPTIMISM }),
  ],
})

describe(useTokenPriceHistory, () => {
  it('returns correct initial values', async () => {
    const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }))

    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe(false)
    expect(result.current.data).toEqual({
      priceHistory: undefined,
      spot: undefined,
    })
    expect(result.current.selectedDuration).toBe(GraphQLApi.HistoryDuration.Day) // default initial duration
    expect(result.current.numberOfDigits).toEqual({
      left: 0,
      right: 0,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(false)
    })
  })

  it('returns on-chain spot price if off-chain spot price is not available', async () => {
    const market = tokenMarket()
    const { resolvers } = queryResolvers({
      tokenProjects: () => [
        usdcTokenProject({
          markets: undefined,
          // Ensure token has the correct chain to match SAMPLE_CURRENCY_ID_1 (Ethereum)
          tokens: [token({ market, chain: GraphQLApi.Chain.Ethereum })],
        }),
      ],
    })
    const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }), {
      resolvers,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(false)
    })

    await waitFor(() => {
      expect(result.current.data?.spot).toEqual({
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        value: expect.objectContaining({ value: market.price?.value }),
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        relativeChange: expect.objectContaining({ value: market.pricePercentChange?.value }),
      })
    })
  })

  it('handles gracefully when no token matches the currencyId chain', async () => {
    const aggregatedMarket = tokenProjectMarket()
    const { resolvers } = queryResolvers({
      tokenProjects: () => [
        usdcTokenProject({
          markets: [aggregatedMarket],
          // Provide tokens for different chains, but none matching SAMPLE_CURRENCY_ID_1 (Ethereum)
          tokens: [token({ chain: GraphQLApi.Chain.Polygon }), token({ chain: GraphQLApi.Chain.Arbitrum })],
        }),
      ],
    })
    const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }), {
      resolvers,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(false)
    })

    // Should fall back to aggregated market data when no chain-specific token is found
    await waitFor(() => {
      expect(result.current.data?.spot).toEqual({
        value: expect.objectContaining({ value: aggregatedMarket.price.value }),
        relativeChange: expect.objectContaining({ value: aggregatedMarket.pricePercentChange24h.value }),
      })
    })
  })

  describe('correct number of digits', () => {
    it('for max price greater than 1', async () => {
      const { resolvers } = queryResolvers({
        tokenProjects: mockTokenProjectsQuery([0.00001, 1, 111_111_111.1111]),
      })
      const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }), {
        resolvers,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe(false)
      })

      expect(result.current.numberOfDigits).toEqual({
        left: 9,
        right: 2,
      })
    })

    it('for max price less than 1', async () => {
      const { resolvers } = queryResolvers({
        tokenProjects: mockTokenProjectsQuery([0.001, 0.002]),
      })
      const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }), {
        resolvers,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe(false)
      })

      expect(result.current.numberOfDigits).toEqual({
        left: 1,
        right: 16,
      })
    })

    it('for max price equal to 1', async () => {
      const { resolvers } = queryResolvers({ tokenProjects: mockTokenProjectsQuery([0.1, 1]) })
      const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }), {
        resolvers,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe(false)
      })

      expect(result.current.numberOfDigits).toEqual({
        left: 1,
        right: 2,
      })
    })
  })

  describe('correct price history', () => {
    it('properly formats price history entries', async () => {
      const history = priceHistory()
      const { resolvers } = queryResolvers({
        tokenProjects: () => [createUsdcTokenProjectWithMatchingPriceHistory(history)],
      })
      const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }), {
        resolvers,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe(false)
      })

      expect(result.current.data?.priceHistory).toEqual(formatPriceHistory(history))
    })

    it('filters out invalid price history entries', async () => {
      const invalidHistory = [undefined, timestampedAmount({ value: 1 }), undefined, timestampedAmount({ value: 2 })]
      const { resolvers } = queryResolvers({
        tokenProjects: () => [createUsdcTokenProjectWithMatchingPriceHistory(invalidHistory)],
      })
      const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }), {
        resolvers,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe(false)
      })

      expect(result.current.data?.priceHistory).toEqual([
        {
          timestamp: expect.any(Number),
          value: 1,
        },
        {
          timestamp: expect.any(Number),
          value: 2,
        },
      ])
    })
  })

  describe('different durations', () => {
    const dayPriceHistory = priceHistory({ duration: GraphQLApi.HistoryDuration.Day })
    const weekPriceHistory = priceHistory({ duration: GraphQLApi.HistoryDuration.Week })
    const monthPriceHistory = priceHistory({ duration: GraphQLApi.HistoryDuration.Month })
    const yearPriceHistory = priceHistory({ duration: GraphQLApi.HistoryDuration.Year })

    const dayTokenProject = createUsdcTokenProjectWithMatchingPriceHistory(dayPriceHistory)
    const weekTokenProject = createUsdcTokenProjectWithMatchingPriceHistory(weekPriceHistory)
    const monthTokenProject = createUsdcTokenProjectWithMatchingPriceHistory(monthPriceHistory)
    const yearTokenProject = createUsdcTokenProjectWithMatchingPriceHistory(yearPriceHistory)

    const { resolvers } = queryResolvers({
      // eslint-disable-next-line max-params
      tokenProjects: (parent, args, context, info) => {
        switch (info.variableValues.duration) {
          case GraphQLApi.HistoryDuration.Day:
            return [dayTokenProject]
          case GraphQLApi.HistoryDuration.Week:
            return [weekTokenProject]
          case GraphQLApi.HistoryDuration.Month:
            return [monthTokenProject]
          case GraphQLApi.HistoryDuration.Year:
            return [yearTokenProject]
          default:
            return [dayTokenProject]
        }
      },
    })

    describe('when duration is set to default value (day)', () => {
      it('returns correct price history', async () => {
        const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }), {
          resolvers,
        })

        await waitFor(() => {
          expect(result.current).toEqual(
            expect.objectContaining({
              data: {
                priceHistory: formatPriceHistory(dayPriceHistory),
                spot: expect.anything(),
              },
              selectedDuration: GraphQLApi.HistoryDuration.Day,
            }),
          )
        })
      })

      it('returns correct spot price', async () => {
        const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }), {
          resolvers,
        })

        await waitFor(() => {
          const ethereumToken = dayTokenProject.tokens.find((t) => t.chain === GraphQLApi.Chain.Ethereum)
          expect(result.current.data?.spot).toEqual({
            value: expect.objectContaining({ value: ethereumToken?.market?.price?.value }),
            relativeChange: expect.objectContaining({
              value: dayTokenProject.markets?.[0]?.pricePercentChange24h?.value,
            }),
          })
        })
      })
    })

    describe('when duration is set to non-default value (year)', () => {
      it('returns correct price history', async () => {
        const { result } = renderHookWithProviders(
          () =>
            useTokenPriceHistory({
              currencyId: SAMPLE_CURRENCY_ID_1,
              initialDuration: GraphQLApi.HistoryDuration.Year,
            }),
          { resolvers },
        )

        await waitFor(() => {
          expect(result.current).toEqual(
            expect.objectContaining({
              data: {
                priceHistory: formatPriceHistory(yearPriceHistory),
                spot: expect.anything(),
              },
              selectedDuration: GraphQLApi.HistoryDuration.Year,
            }),
          )
        })
      })

      it('returns correct spot price with calculated percentage change', async () => {
        const { result } = renderHookWithProviders(
          () =>
            useTokenPriceHistory({
              currencyId: SAMPLE_CURRENCY_ID_1,
              initialDuration: GraphQLApi.HistoryDuration.Year,
            }),
          { resolvers },
        )
        await waitFor(() => {
          const ethereumToken = yearTokenProject.tokens.find((t) => t.chain === GraphQLApi.Chain.Ethereum)
          // For non-Day durations, relativeChange is calculated from price history
          const openPrice = yearPriceHistory[0]?.value ?? 0
          const closePrice = yearPriceHistory[yearPriceHistory.length - 1]?.value ?? 0
          const calculatedChange = openPrice > 0 ? ((closePrice - openPrice) / openPrice) * 100 : 0

          expect(result.current.data?.spot).toEqual({
            value: expect.objectContaining({ value: ethereumToken?.market?.price?.value }),
            relativeChange: expect.objectContaining({
              value: calculatedChange,
            }),
          })
        })
      })
    })

    describe('when duration is changed', () => {
      it('returns new price history and spot price with correct percentage change calculation', async () => {
        const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }), {
          resolvers,
        })

        await waitFor(() => {
          const ethereumToken = dayTokenProject.tokens.find((t) => t.chain === GraphQLApi.Chain.Ethereum)
          // For Day duration, should use API's 24hr value
          expect(result.current.data).toEqual({
            priceHistory: formatPriceHistory(dayPriceHistory),
            spot: {
              value: expect.objectContaining({ value: ethereumToken?.market?.price?.value }),
              relativeChange: expect.objectContaining({
                value: dayTokenProject.markets?.[0]?.pricePercentChange24h?.value,
              }),
            },
          })
        })

        // Change duration
        await act(() => {
          result.current.setDuration(GraphQLApi.HistoryDuration.Week)
        })

        await waitFor(() => {
          const ethereumToken = weekTokenProject.tokens.find((t) => t.chain === GraphQLApi.Chain.Ethereum)
          // For Week duration, should calculate from price history
          const openPrice = weekPriceHistory[0]?.value ?? 0
          const closePrice = weekPriceHistory[weekPriceHistory.length - 1]?.value ?? 0
          const calculatedChange = openPrice > 0 ? ((closePrice - openPrice) / openPrice) * 100 : 0

          expect(result.current.data).toEqual({
            priceHistory: formatPriceHistory(weekPriceHistory),
            spot: {
              value: expect.objectContaining({ value: ethereumToken?.market?.price?.value }),
              relativeChange: expect.objectContaining({
                value: calculatedChange,
              }),
            },
          })
        })
      })
    })

    describe('error handling', () => {
      it('returns error if query has no data and there is no loading state', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined)
        const { resolvers: errorResolvers } = queryResolvers({
          tokenProjects: () => {
            throw new Error('error')
          },
        })
        const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }), {
          resolvers: errorResolvers,
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
          expect(result.current.error).toBe(true)
        })
      })
    })
  })
})
