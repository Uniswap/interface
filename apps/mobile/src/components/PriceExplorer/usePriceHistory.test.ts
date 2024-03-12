import { waitFor } from '@testing-library/react-native'
import { act } from 'react-test-renderer'
import { useTokenPriceHistory } from 'src/components/PriceExplorer/usePriceHistory'
import { renderHookWithProviders } from 'src/test/render'
import {
  HistoryDuration,
  TimestampedAmount,
  TokenMarket as TokenMarketType,
  TokenProject as TokenProjectType,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { SAMPLE_CURRENCY_ID_1, faker } from 'wallet/src/test/fixtures'
import {
  EthToken,
  TokenDayPriceHistory,
  TokenMarket,
  TokenProjectDay,
  TokenProjectWeek,
  TokenProjectYear,
  TokenProjects,
  TokenWeekPriceHistory,
  TokenYearPriceHistory,
} from 'wallet/src/test/gqlFixtures'

const mockHistoryPrice = (price: number): TimestampedAmount => ({
  id: faker.datatype.uuid(),
  timestamp: faker.date.past(/*year=*/ 2).getMilliseconds(),
  value: price,
})

const mockTokenProject = (priceHistory: TokenMarketType['priceHistory']): TokenProjectType => ({
  ...TokenProjectDay,
  markets: [
    {
      ...TokenProjectDay.markets![0]!,
      priceHistory,
      price: {
        ...TokenProjectDay.markets![0]!.price!,
        value: (priceHistory && priceHistory[priceHistory.length - 1]?.value) ?? 0,
      },
    },
  ],
})

const mockTokenProjectsQuery = (historyPrices: number[]) => (): TokenProjectType[] =>
  [mockTokenProject(historyPrices.map(mockHistoryPrice))]

const formatPriceHistory = (priceHistory: TimestampedAmount[]): Omit<TimestampedAmount, 'id'>[] =>
  priceHistory.map(({ timestamp, value }) => ({ value, timestamp: timestamp * 1000 }))

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
    const { result } = renderHookWithProviders(() => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1), {
      resolvers: {
        Query: {
          tokenProjects: () =>
            TokenProjects.map((project) => ({
              ...project,
              markets: null,
              tokens: [{ ...EthToken, market: TokenMarket }],
            })),
        },
      },
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(false)
    })

    expect(result.current.data?.spot).toEqual({
      value: { value: TokenMarket.price?.value },
      relativeChange: { value: TokenMarket.pricePercentChange?.value },
    })
  })

  describe('correct number of digits', () => {
    it('for max price greater than 1', async () => {
      const { result } = renderHookWithProviders(() => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1), {
        resolvers: {
          Query: {
            tokenProjects: mockTokenProjectsQuery([0.00001, 1, 111_111_111.1111]),
          },
        },
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
      const { result } = renderHookWithProviders(() => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1), {
        resolvers: {
          Query: {
            tokenProjects: mockTokenProjectsQuery([0.001, 0.002]),
          },
        },
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
      const { result } = renderHookWithProviders(() => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1), {
        resolvers: {
          Query: {
            tokenProjects: mockTokenProjectsQuery([0.1, 1]),
          },
        },
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
      const { result } = renderHookWithProviders(() => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe(false)
      })

      expect(result.current.data?.priceHistory).toEqual(formatPriceHistory(TokenDayPriceHistory))
    })

    it('filters out invalid price history entries', async () => {
      const { result } = renderHookWithProviders(() => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1), {
        resolvers: {
          Query: {
            tokenProjects: () => [
              mockTokenProject([null, mockHistoryPrice(1), null, mockHistoryPrice(2)]),
            ],
          },
        },
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

  describe('when duration is set to default value (day)', () => {
    it('returns correct price history', async () => {
      const { result } = renderHookWithProviders(() => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1))

      await waitFor(() => {
        expect(result.current).toEqual(
          expect.objectContaining({
            data: {
              priceHistory: formatPriceHistory(TokenDayPriceHistory),
              spot: expect.anything(),
            },
            selectedDuration: HistoryDuration.Day,
          })
        )
      })
    })

    it('returns correct spot price', async () => {
      const { result } = renderHookWithProviders(() => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1))

      await waitFor(() => {
        expect(result.current.data?.spot).toEqual({
          value: { value: TokenProjectDay.markets?.[0]?.price?.value },
          relativeChange: { value: TokenProjectDay.markets?.[0]?.pricePercentChange24h?.value },
        })
      })
    })
  })

  describe('when duration is set to non-default value (year)', () => {
    it('returns correct price history', async () => {
      const { result } = renderHookWithProviders(() =>
        useTokenPriceHistory(SAMPLE_CURRENCY_ID_1, jest.fn(), HistoryDuration.Year)
      )

      await waitFor(() => {
        expect(result.current).toEqual(
          expect.objectContaining({
            data: {
              priceHistory: formatPriceHistory(TokenYearPriceHistory),
              spot: expect.anything(),
            },
            selectedDuration: HistoryDuration.Year,
          })
        )
      })
    })

    it('returns correct spot price', async () => {
      const { result } = renderHookWithProviders(() =>
        useTokenPriceHistory(SAMPLE_CURRENCY_ID_1, jest.fn(), HistoryDuration.Year)
      )

      await waitFor(() => {
        expect(result.current.data?.spot).toEqual({
          value: { value: TokenProjectYear.markets?.[0]?.price?.value },
          relativeChange: { value: TokenProjectYear.markets?.[0]?.pricePercentChange24h?.value },
        })
      })
    })
  })

  describe('when duration is changed', () => {
    it('re-fetches data', async () => {
      const onCompleted = jest.fn()
      const { result } = renderHookWithProviders(() =>
        useTokenPriceHistory(SAMPLE_CURRENCY_ID_1, onCompleted)
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
      const { result } = renderHookWithProviders(() => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1))

      await waitFor(() => {
        expect(result.current.data).toEqual({
          priceHistory: formatPriceHistory(TokenDayPriceHistory),
          spot: {
            value: { value: TokenProjectDay.markets?.[0]?.price?.value },
            relativeChange: { value: TokenProjectDay.markets?.[0]?.pricePercentChange24h?.value },
          },
        })
      })

      // Change duration
      await act(() => {
        result.current.setDuration(HistoryDuration.Week)
      })

      await waitFor(() => {
        expect(result.current.data).toEqual({
          priceHistory: formatPriceHistory(TokenWeekPriceHistory),
          spot: {
            value: { value: TokenProjectWeek.markets?.[0]?.price?.value },
            relativeChange: { value: TokenProjectWeek.markets?.[0]?.pricePercentChange24h?.value },
          },
        })
      })
    })
  })

  describe('error handling', () => {
    it('returns error if query has no data and there is no loading state', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const { result } = renderHookWithProviders(() => useTokenPriceHistory(SAMPLE_CURRENCY_ID_1), {
        resolvers: {
          Query: {
            tokenProjects: () => {
              throw new Error('error')
            },
          },
        },
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe(true)
      })
    })
  })
})
