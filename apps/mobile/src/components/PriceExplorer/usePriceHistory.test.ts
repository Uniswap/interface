import { waitFor } from '@testing-library/react-native'
import { act } from 'react-test-renderer'
import { useTokenPriceHistory } from 'src/components/PriceExplorer/usePriceHistory'
import { renderHookWithProviders } from 'src/test/render'
import {
  HistoryDuration,
  TimestampedAmount,
  TokenProject as TokenProjectType,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  SAMPLE_CURRENCY_ID_1,
  getLatestPrice,
  priceHistory,
  timestampedAmount,
  token,
  tokenMarket,
  tokenProject,
  tokenProjectMarket,
  usdcTokenProject,
} from 'wallet/src/test/fixtures'
import { queryResolvers } from 'wallet/src/test/utils'

const mockTokenProjectsQuery = (historyPrices: number[]) => (): TokenProjectType[] => {
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

const formatPriceHistory = (history: TimestampedAmount[]): Omit<TimestampedAmount, 'id'>[] =>
  history.map(({ timestamp, value }) => ({ value, timestamp: timestamp * 1000 }))

describe(useTokenPriceHistory, () => {
  it('returns correct initial values', async () => {
    const { result } = renderHookWithProviders(() => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1))

    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe(false)
    expect(result.current.data).toEqual({
      priceHistory: undefined,
      spot: undefined,
    })
    expect(result.current.selectedDuration).toBe(HistoryDuration.Day) // default initial duration
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
      tokenProjects: () => [usdcTokenProject({ markets: null, tokens: [token({ market })] })],
    })
    const { result } = renderHookWithProviders(() => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1), {
      resolvers,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(false)
    })

    expect(result.current.data?.spot).toEqual({
      value: { value: market.price?.value },
      relativeChange: { value: market.pricePercentChange?.value },
    })
  })

  describe('correct number of digits', () => {
    it('for max price greater than 1', async () => {
      const { resolvers } = queryResolvers({
        tokenProjects: mockTokenProjectsQuery([0.00001, 1, 111_111_111.1111]),
      })
      const { result } = renderHookWithProviders(() => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1), {
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
      const { result } = renderHookWithProviders(() => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1), {
        resolvers,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe(false)
      })

      expect(result.current.numberOfDigits).toEqual({
        left: 1,
        right: 10,
      })
    })

    it('for max price equal to 1', async () => {
      const { resolvers } = queryResolvers({ tokenProjects: mockTokenProjectsQuery([0.1, 1]) })
      const { result } = renderHookWithProviders(() => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1), {
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
        tokenProjects: () => [usdcTokenProject({ priceHistory: history })],
      })
      const { result } = renderHookWithProviders(() => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1), {
        resolvers,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe(false)
      })

      expect(result.current.data?.priceHistory).toEqual(formatPriceHistory(history))
    })

    it('filters out invalid price history entries', async () => {
      const { resolvers } = queryResolvers({
        tokenProjects: () => [
          usdcTokenProject({
            priceHistory: [
              null,
              timestampedAmount({ value: 1 }),
              null,
              timestampedAmount({ value: 2 }),
            ],
          }),
        ],
      })
      const { result } = renderHookWithProviders(() => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1), {
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
    const dayPriceHistory = priceHistory({ duration: HistoryDuration.Day })
    const weekPriceHistory = priceHistory({ duration: HistoryDuration.Week })
    const monthPriceHistory = priceHistory({ duration: HistoryDuration.Month })
    const yearPriceHistory = priceHistory({ duration: HistoryDuration.Year })

    const dayTokenProject = usdcTokenProject({ priceHistory: dayPriceHistory })
    const weekTokenProject = usdcTokenProject({ priceHistory: weekPriceHistory })
    const monthTokenProject = usdcTokenProject({ priceHistory: monthPriceHistory })
    const yearTokenProject = usdcTokenProject({ priceHistory: yearPriceHistory })

    const { resolvers } = queryResolvers({
      tokenProjects: (parent, args, context, info) => {
        switch (info.variableValues.duration) {
          case HistoryDuration.Day:
            return [dayTokenProject]
          case HistoryDuration.Week:
            return [weekTokenProject]
          case HistoryDuration.Month:
            return [monthTokenProject]
          case HistoryDuration.Year:
            return [yearTokenProject]
          default:
            return [dayTokenProject]
        }
      },
    })

    describe('when duration is set to default value (day)', () => {
      it('returns correct price history', async () => {
        const { result } = renderHookWithProviders(
          () => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1),
          { resolvers }
        )

        await waitFor(() => {
          expect(result.current).toEqual(
            expect.objectContaining({
              data: {
                priceHistory: formatPriceHistory(dayPriceHistory),
                spot: expect.anything(),
              },
              selectedDuration: HistoryDuration.Day,
            })
          )
        })
      })

      it('returns correct spot price', async () => {
        const { result } = renderHookWithProviders(
          () => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1),
          { resolvers }
        )

        await waitFor(() => {
          expect(result.current.data?.spot).toEqual({
            value: { value: dayTokenProject.markets[0]?.price.value },
            relativeChange: { value: dayTokenProject.markets[0]?.pricePercentChange24h.value },
          })
        })
      })
    })

    describe('when duration is set to non-default value (year)', () => {
      it('returns correct price history', async () => {
        const { result } = renderHookWithProviders(
          () => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1, jest.fn(), HistoryDuration.Year),
          { resolvers }
        )

        await waitFor(() => {
          expect(result.current).toEqual(
            expect.objectContaining({
              data: {
                priceHistory: formatPriceHistory(yearPriceHistory),
                spot: expect.anything(),
              },
              selectedDuration: HistoryDuration.Year,
            })
          )
        })
      })

      it('returns correct spot price', async () => {
        const { result } = renderHookWithProviders(
          () => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1, jest.fn(), HistoryDuration.Year),
          { resolvers }
        )
        await waitFor(() => {
          expect(result.current.data?.spot).toEqual({
            value: { value: yearTokenProject.markets[0]?.price?.value },
            relativeChange: { value: yearTokenProject.markets[0]?.pricePercentChange24h?.value },
          })
        })
      })
    })

    describe('when duration is changed', () => {
      it('re-fetches data', async () => {
        const onCompleted = jest.fn()
        const { result } = renderHookWithProviders(
          () => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1, onCompleted),
          { resolvers }
        )

        await waitFor(() => {
          expect(result.current).toEqual(
            expect.objectContaining({
              loading: false,
              error: false,
              selectedDuration: HistoryDuration.Day,
            })
          )
        })

        expect(onCompleted).toHaveBeenCalledTimes(1)

        // Change duration
        await act(() => {
          result.current.setDuration(HistoryDuration.Week)
        })

        await waitFor(() => {
          expect(result.current).toEqual(
            expect.objectContaining({
              loading: false,
              error: false,
              selectedDuration: HistoryDuration.Week,
            })
          )
        })

        expect(onCompleted).toHaveBeenCalledTimes(2)
      })

      it('returns new price history and spot price', async () => {
        const { result } = renderHookWithProviders(
          () => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1),
          { resolvers }
        )

        await waitFor(() => {
          expect(result.current.data).toEqual({
            priceHistory: formatPriceHistory(dayPriceHistory),
            spot: {
              value: { value: dayTokenProject.markets[0]?.price.value },
              relativeChange: { value: dayTokenProject.markets[0]?.pricePercentChange24h.value },
            },
          })
        })

        // Change duration
        await act(() => {
          result.current.setDuration(HistoryDuration.Week)
        })

        await waitFor(() => {
          expect(result.current.data).toEqual({
            priceHistory: formatPriceHistory(weekPriceHistory),
            spot: {
              value: { value: weekTokenProject.markets[0]?.price?.value },
              relativeChange: {
                value: weekTokenProject.markets[0]?.pricePercentChange24h?.value,
              },
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
        const { result } = renderHookWithProviders(
          () => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1),
          { resolvers: errorResolvers }
        )

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
          expect(result.current.error).toBe(true)
        })
      })
    })
  })
})
