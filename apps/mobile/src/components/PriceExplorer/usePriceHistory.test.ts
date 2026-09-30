import { waitFor } from '@testing-library/react-native'
import { act } from 'react-test-renderer'
import { useTokenPriceHistory } from 'src/components/PriceExplorer/usePriceHistory'
import { renderHookWithProviders } from 'src/test/render'
import { useTokenPriceChange, useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { useTokenPriceHistoryRest } from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { SAMPLE_CURRENCY_ID_1 } from 'uniswap/src/test/fixtures'

vi.mock('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData')>()),
  useTokenSpotPrice: vi.fn(),
  useTokenPriceChange: vi.fn(),
}))

vi.mock('uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest')>()),
  useTokenPriceHistoryRest: vi.fn(),
}))

const mockUseTokenSpotPrice = vi.mocked(useTokenSpotPrice)
const mockUseTokenPriceChange = vi.mocked(useTokenPriceChange)
const mockUseTokenPriceHistoryRest = vi.mocked(useTokenPriceHistoryRest)

type PricePoint = { timestamp: number; value: number }

type RestPriceHistoryResult = ReturnType<typeof useTokenPriceHistoryRest>

const mockRestPriceHistory = ({ entries, isLoading }: { entries: PricePoint[]; isLoading: boolean }): void => {
  const result: RestPriceHistoryResult = { entries, isLoading, error: null }
  mockUseTokenPriceHistoryRest.mockReturnValue(result)
}

/** REST entries are unix seconds; the hook converts them to the chart's milliseconds. */
const restEntries = (values: number[]): PricePoint[] =>
  values.map((value, index) => ({ timestamp: (index + 1) * 1_000, value }))

const toMilliseconds = (entries: PricePoint[]): PricePoint[] =>
  entries.map(({ timestamp, value }) => ({ timestamp: timestamp * 1_000, value }))

/**
 * The hook extends the chart line to the live spot price between backend refetches
 * (`appendLiveSpotPriceEntry`), so the returned history ends in a point holding the spot price at
 * "now".
 *
 * That helper has two branches, and which one runs depends on the fixture's timestamps: if the gap
 * between "now" and the last backend point is smaller than the series' own granularity it replaces
 * that trailing point, otherwise it appends a new one. Both are correct, so this asserts what holds
 * either way — the newest point carries the spot price, and every earlier backend point survives in
 * order, with at most the last one coalesced into the live point.
 */
const expectHistoryWithLiveSpotEntry = ({
  actual,
  backendHistory,
  spotPrice,
}: {
  actual: PricePoint[] | undefined
  backendHistory: PricePoint[]
  spotPrice: number | undefined
}): void => {
  expect(actual?.length).toBeGreaterThanOrEqual(backendHistory.length)
  expect(actual?.length).toBeLessThanOrEqual(backendHistory.length + 1)

  const retained = actual?.slice(0, -1) ?? []
  expect(retained).toEqual(backendHistory.slice(0, retained.length))
  expect(backendHistory.length - retained.length).toBeLessThanOrEqual(1)

  const liveEntry = actual?.[actual.length - 1]
  expect(liveEntry?.value).toBe(spotPrice)
  expect(liveEntry?.timestamp).toBeGreaterThan(retained[retained.length - 1]?.timestamp ?? 0)
  expect(liveEntry?.timestamp).toBeLessThanOrEqual(Date.now())
}

describe(useTokenPriceHistory, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTokenSpotPrice.mockReturnValue(undefined)
    mockUseTokenPriceChange.mockReturnValue(undefined)
    mockUseTokenPriceHistoryRest.mockReturnValue({ entries: [], isLoading: false, error: null })
  })

  it('returns correct initial values while the REST price history is still loading', () => {
    mockUseTokenPriceHistoryRest.mockReturnValue({ entries: [], isLoading: true, error: null })

    const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toEqual({ priceHistory: [], spot: undefined })
    expect(result.current.selectedDuration).toBe(HistoryDuration.Day) // default initial duration
    expect(result.current.numberOfDigits).toEqual({ left: 0, right: 0 })
  })

  it('stops loading once the REST price history resolves', async () => {
    mockUseTokenSpotPrice.mockReturnValue(1)
    mockUseTokenPriceHistoryRest.mockReturnValue({ entries: restEntries([1, 2]), isLoading: false, error: null })

    const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('reports loading while skipped, even with data already available', () => {
    mockUseTokenSpotPrice.mockReturnValue(1)
    mockUseTokenPriceHistoryRest.mockReturnValue({ entries: restEntries([1, 2]), isLoading: false, error: null })

    const { result } = renderHookWithProviders(() =>
      useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1, skip: true }),
    )

    expect(result.current.isLoading).toBe(true)
  })

  it('returns to loading while a newly selected duration loads', async () => {
    mockUseTokenSpotPrice.mockReturnValue(1)
    mockUseTokenPriceHistoryRest.mockReturnValue({ entries: restEntries([1, 2]), isLoading: false, error: null })

    const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // A refetch flips the REST hook back to loading, but the chart already has a price to show, so
    // the hook must not fall back into the loading state and blank the chart out.
    mockUseTokenPriceHistoryRest.mockReturnValue({ entries: restEntries([]), isLoading: true, error: null })
    await act(() => {
      result.current.setDuration(HistoryDuration.Week)
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data?.priceHistory).toEqual([])
  })

  it('uses the REST spot price and 24h change for Day duration', async () => {
    mockUseTokenSpotPrice.mockReturnValue(99.9)
    mockUseTokenPriceChange.mockReturnValue(12.3)

    const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }))

    await waitFor(() => {
      expect(result.current.data?.spot).toEqual({
        value: expect.objectContaining({ value: 99.9 }),
        relativeChange: expect.objectContaining({ value: 12.3 }),
        relativeChangeIdle: 12.3,
      })
    })
  })

  it('falls back to a zero 24h change when REST has none yet', async () => {
    mockUseTokenSpotPrice.mockReturnValue(99.9)
    mockUseTokenPriceChange.mockReturnValue(undefined)

    const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }))

    await waitFor(() => {
      expect(result.current.data?.spot?.relativeChangeIdle).toBe(0)
    })
  })

  it('leaves spot undefined until the REST spot price arrives', () => {
    mockUseTokenPriceHistoryRest.mockReturnValue({ entries: restEntries([10, 20]), isLoading: false, error: null })

    const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }))

    expect(result.current.data?.spot).toBeUndefined()
    // Without a spot price there is no live point to append — the chart is the backend series alone.
    expect(result.current.data?.priceHistory).toEqual(toMilliseconds(restEntries([10, 20])))
  })

  it('uses the REST price history entries for the chart line', async () => {
    const entries = restEntries([10, 20])
    mockUseTokenSpotPrice.mockReturnValue(99.9)
    mockUseTokenPriceChange.mockReturnValue(12.3)
    mockUseTokenPriceHistoryRest.mockReturnValue({ entries, isLoading: false, error: null })

    const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }))

    await waitFor(() => {
      expectHistoryWithLiveSpotEntry({
        actual: result.current.data?.priceHistory,
        backendHistory: toMilliseconds(entries),
        spotPrice: 99.9,
      })
    })
  })

  it('orders REST history before calculating change and appending the live price without losing duplicates', () => {
    const entries = [
      { timestamp: 3000, value: 30 },
      { timestamp: 1000, value: 10 },
      { timestamp: 2000, value: 20 },
      { timestamp: 2000, value: 21 },
    ]
    const originalEntries = structuredClone(entries)
    mockUseTokenSpotPrice.mockReturnValue(40)
    mockUseTokenPriceHistoryRest.mockReturnValue({ entries, isLoading: false, error: null })

    const { result } = renderHookWithProviders(() =>
      useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1, initialDuration: HistoryDuration.Year }),
    )

    expect(result.current.data?.priceHistory?.slice(0, -1)).toEqual(
      toMilliseconds([entries[1]!, entries[2]!, entries[3]!, entries[0]!]),
    )
    expect(result.current.data?.priceHistory?.at(-1)?.value).toBe(40)
    expect(result.current.data?.spot?.relativeChangeIdle).toBe(200)
    expect(entries).toEqual(originalEntries)
  })

  it('orders REST history before checking whether the live price would move the newest bucket backwards', () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_500_000)
    const entries = [
      { timestamp: 1000, value: 10 },
      { timestamp: 2000, value: 20 },
      { timestamp: 1200, value: 12 },
    ]
    mockUseTokenSpotPrice.mockReturnValue(40)
    mockUseTokenPriceHistoryRest.mockReturnValue({ entries, isLoading: false, error: null })

    try {
      const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }))

      expect(result.current.data?.priceHistory).toEqual(toMilliseconds([entries[0]!, entries[2]!, entries[1]!]))
    } finally {
      now.mockRestore()
    }
  })

  it('calculates non-Day-duration change from the REST price history entries', async () => {
    mockUseTokenSpotPrice.mockReturnValue(99.9)
    mockUseTokenPriceChange.mockReturnValue(12.3)
    mockUseTokenPriceHistoryRest.mockReturnValue({ entries: restEntries([10, 15]), isLoading: false, error: null })

    const { result } = renderHookWithProviders(() =>
      useTokenPriceHistory({
        currencyId: SAMPLE_CURRENCY_ID_1,
        initialDuration: HistoryDuration.Year,
      }),
    )

    await waitFor(() => {
      expect(result.current.data?.spot).toEqual({
        value: expect.objectContaining({ value: 99.9 }),
        relativeChange: expect.objectContaining({ value: 50 }), // (15 - 10) / 10 * 100
        relativeChangeIdle: 50,
      })
    })
  })

  it('leaves the non-Day-duration change undefined when there are no entries to derive it from', async () => {
    mockUseTokenSpotPrice.mockReturnValue(99.9)
    mockUseTokenPriceChange.mockReturnValue(12.3)

    const { result } = renderHookWithProviders(() =>
      useTokenPriceHistory({
        currencyId: SAMPLE_CURRENCY_ID_1,
        initialDuration: HistoryDuration.Year,
      }),
    )

    await waitFor(() => {
      expect(result.current.data?.spot?.relativeChangeIdle).toBeUndefined()
    })
  })

  it('passes the duration and single-chain view through to the REST hooks', () => {
    renderHookWithProviders(() =>
      useTokenPriceHistory({
        currencyId: SAMPLE_CURRENCY_ID_1,
        initialDuration: HistoryDuration.Week,
      }),
    )

    expect(mockUseTokenSpotPrice).toHaveBeenCalledWith(SAMPLE_CURRENCY_ID_1, {
      isMultichainAggregateView: false,
    })
    expect(mockUseTokenPriceChange).toHaveBeenCalledWith(SAMPLE_CURRENCY_ID_1, {
      isMultichainAggregateView: false,
    })
    expect(mockUseTokenPriceHistoryRest).toHaveBeenCalledWith(SAMPLE_CURRENCY_ID_1, {
      isMultichainAggregateView: false,
      duration: HistoryDuration.Week,
    })
  })

  it('passes the multichain aggregate view through to the REST hooks', () => {
    renderHookWithProviders(() =>
      useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1, isMultichainAggregateView: true }),
    )

    expect(mockUseTokenSpotPrice).toHaveBeenCalledWith(SAMPLE_CURRENCY_ID_1, {
      isMultichainAggregateView: true,
    })
    expect(mockUseTokenPriceChange).toHaveBeenCalledWith(SAMPLE_CURRENCY_ID_1, {
      isMultichainAggregateView: true,
    })
    expect(mockUseTokenPriceHistoryRest).toHaveBeenCalledWith(SAMPLE_CURRENCY_ID_1, {
      isMultichainAggregateView: true,
      duration: HistoryDuration.Day,
    })
  })

  it('refetches the REST price history at the new duration when the duration changes', async () => {
    mockUseTokenSpotPrice.mockReturnValue(99.9)
    mockUseTokenPriceChange.mockReturnValue(12.3)
    mockUseTokenPriceHistoryRest.mockReturnValue({ entries: restEntries([10, 15]), isLoading: false, error: null })

    const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }))

    await waitFor(() => {
      expect(result.current.selectedDuration).toBe(HistoryDuration.Day)
      // Day duration reads the REST 24h change rather than deriving it from the entries.
      expect(result.current.data?.spot?.relativeChangeIdle).toBe(12.3)
    })
    expect(mockUseTokenPriceHistoryRest).toHaveBeenLastCalledWith(
      SAMPLE_CURRENCY_ID_1,
      expect.objectContaining({ duration: HistoryDuration.Day }),
    )

    await act(() => {
      result.current.setDuration(HistoryDuration.Week)
    })

    await waitFor(() => {
      expect(result.current.selectedDuration).toBe(HistoryDuration.Week)
      // Week duration derives the change from the entries instead: (15 - 10) / 10 * 100
      expect(result.current.data?.spot?.relativeChangeIdle).toBe(50)
    })
    expect(mockUseTokenPriceHistoryRest).toHaveBeenLastCalledWith(
      SAMPLE_CURRENCY_ID_1,
      expect.objectContaining({ duration: HistoryDuration.Week }),
    )
  })

  describe('correct number of digits', () => {
    it('for max price greater than 1', async () => {
      mockRestPriceHistory({
        entries: restEntries([0.00001, 1, 111_111_111.1111]),
        isLoading: false,
      })

      const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }))

      await waitFor(() => {
        expect(result.current.numberOfDigits).toEqual({ left: 9, right: 2 })
      })
    })

    it('for max price less than 1', async () => {
      mockUseTokenPriceHistoryRest.mockReturnValue({
        entries: restEntries([0.001, 0.002]),
        isLoading: false,
        error: null,
      })

      const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }))

      await waitFor(() => {
        expect(result.current.numberOfDigits).toEqual({ left: 1, right: 16 })
      })
    })

    it('for max price equal to 1', async () => {
      mockUseTokenPriceHistoryRest.mockReturnValue({ entries: restEntries([0.1, 1]), isLoading: false, error: null })

      const { result } = renderHookWithProviders(() => useTokenPriceHistory({ currencyId: SAMPLE_CURRENCY_ID_1 }))

      await waitFor(() => {
        expect(result.current.numberOfDigits).toEqual({ left: 1, right: 2 })
      })
    })
  })
})
