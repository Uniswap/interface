import { waitFor } from '@testing-library/react-native'
import { makeMutable } from 'react-native-reanimated'
import { act } from 'react-test-renderer'
import { usePriceChart } from 'src/components/charts/PriceChartContext'
import { useLineChartPrice, useLineChartRelativeChange } from 'src/components/PriceExplorer/usePrice'
import { renderHookWithProviders } from 'src/test/render'
import type { ChartPoint } from 'uniswap/src/components/charts/computeChartPaths'

vi.mock('src/components/charts/PriceChartContext')

const currentIndex = makeMutable(-1)
const isActive = makeMutable(false)

const mockData = (args: { data?: ChartPoint[]; currentIndex?: number; isActive?: boolean } = {}): void => {
  currentIndex.value = args.currentIndex ?? -1
  isActive.value = args.isActive ?? false
  // PriceChartContext is mocked so we can mock the return of usePriceChart
  const mockedFunction = usePriceChart as ReturnType<typeof vi.fn>
  mockedFunction.mockReturnValue({
    data: args.data ?? [],
    currentIndex,
    isActive,
  })
}

describe(useLineChartPrice, () => {
  beforeEach(() => {
    mockData()
  })

  afterAll(() => {
    vi.clearAllMocks()
  })

  it('returns correct initial values', () => {
    const { result } = renderHookWithProviders(useLineChartPrice)

    expect(result.current).toEqual({
      value: expect.objectContaining({ value: 0 }),
      formatted: expect.objectContaining({ value: '-' }),
      shouldAnimate: expect.objectContaining({ value: true }),
    })
  })

  describe('when not scrubbing', () => {
    beforeEach(() => {
      // Mock data before all test to show that the currentSpot has higher
      // priority than the last value from data
      mockData({
        data: [
          { value: 1, timestamp: 1 },
          { value: 2, timestamp: 2 },
        ],
      })
    })

    it('returns last value from data if currentSpot is not provided', async () => {
      const { result, rerender } = renderHookWithProviders(useLineChartPrice)

      expect(result.current).toEqual({
        value: expect.objectContaining({ value: 2 }),
        formatted: expect.objectContaining({ value: '$2.00' }),
        shouldAnimate: expect.objectContaining({ value: true }),
      })

      // Update data
      mockData({
        data: [
          { value: 1, timestamp: 1 },
          { value: 2, timestamp: 2 },
          { value: 3, timestamp: 3 },
        ],
      })
      // Re-render to trigger the update (normally the usePriceChart hook
      // would trigger re-render)
      await act(() => rerender())

      await waitFor(() => {
        expect(result.current).toEqual({
          value: expect.objectContaining({ value: 3 }),
          formatted: expect.objectContaining({ value: '$3.00' }),
          shouldAnimate: expect.objectContaining({ value: true }),
        })
      })
    })

    it('returns currentSpot if it is provided', async () => {
      const spotPrice = makeMutable(1)
      const { result } = renderHookWithProviders(() => useLineChartPrice(spotPrice), {
        initialProps: spotPrice,
      })

      expect(result.current).toEqual({
        value: expect.objectContaining({ value: 1 }),
        formatted: expect.objectContaining({ value: '$1.00' }),
        shouldAnimate: expect.objectContaining({ value: true }),
      })

      spotPrice.value = 2

      await waitFor(() => {
        expect(result.current).toEqual({
          value: expect.objectContaining({ value: 2 }),
          formatted: expect.objectContaining({ value: '$2.00' }),
          shouldAnimate: expect.objectContaining({ value: true }),
        })
      })
    })
  })

  describe('when scrubbing', () => {
    const chartData = [
      { value: 1, timestamp: 1 },
      { value: 2, timestamp: 2 },
      { value: 3, timestamp: 3 },
    ]

    it('returns active cursor price even if currentSpot and data are provided', async () => {
      mockData({ data: chartData, currentIndex: 2, isActive: true })
      const { result } = renderHookWithProviders(useLineChartPrice, {
        initialProps: makeMutable(4),
      })

      expect(result.current).toEqual({
        value: expect.objectContaining({ value: 3 }),
        formatted: expect.objectContaining({ value: '$3.00' }),
        shouldAnimate: expect.objectContaining({ value: true }),
      })
    })

    it('updates returned active cursor price when it changes', async () => {
      mockData({ data: chartData, currentIndex: 0, isActive: true })
      const { result } = renderHookWithProviders(useLineChartPrice, {
        initialProps: makeMutable(4),
      })

      expect(result.current).toEqual(
        expect.objectContaining({
          value: expect.objectContaining({ value: 1 }),
          formatted: expect.objectContaining({ value: '$1.00' }),
        }),
      )

      currentIndex.value = 1

      await waitFor(() => {
        expect(result.current).toEqual(
          expect.objectContaining({
            value: expect.objectContaining({ value: 2 }),
            formatted: expect.objectContaining({ value: '$2.00' }),
          }),
        )
      })
    })

    it('sets shouldAnimate to false when cursor price changes', async () => {
      mockData({ data: chartData })
      const { result } = renderHookWithProviders(useLineChartPrice)

      // first update (previous value will be undefined as it's the first update after initial render)
      isActive.value = true
      currentIndex.value = 0

      await waitFor(() => {
        expect(result.current).toEqual(
          expect.objectContaining({
            value: expect.objectContaining({ value: 1 }),
            shouldAnimate: expect.objectContaining({ value: true }),
          }),
        )
      })

      // second update (shouldAnimate should be false when the chart is
      // scrubbed and the cursor price changes)
      currentIndex.value = 1

      await waitFor(() => {
        expect(result.current).toEqual(
          expect.objectContaining({
            value: expect.objectContaining({ value: 2 }),
            shouldAnimate: expect.objectContaining({ value: false }),
          }),
        )
      })
    })
  })
})

describe(useLineChartRelativeChange, () => {
  const chartData1 = [
    { timestamp: 1, value: 1 },
    { timestamp: 2, value: 0.1 },
    { timestamp: 3, value: 10 },
    { timestamp: 4, value: 5 },
  ]
  const chartData2 = [
    { timestamp: 1, value: 1 },
    { timestamp: 2, value: 0.1 },
    { timestamp: 3, value: 10 },
    { timestamp: 4, value: 20 },
  ]

  beforeAll(() => {
    mockData()
  })

  it('returns correct initial values', () => {
    const { result } = renderHookWithProviders(() => useLineChartRelativeChange())

    expect(result.current).toEqual({
      value: expect.objectContaining({ value: 0 }),
      formatted: expect.objectContaining({ value: '0.00%' }),
    })
  })

  describe('when spotRelativeChange is not provided', () => {
    it('calculates relative change based on the open and close price values', () => {
      mockData({ data: chartData1 })
      const { result } = renderHookWithProviders(() => useLineChartRelativeChange())

      // 1 -> 5 (+400%)
      expect(result.current).toEqual({
        value: expect.objectContaining({ value: 400 }),
        formatted: expect.objectContaining({ value: '400.00%' }),
      })
    })

    it('updates the relative change when the currentIndex changes when active', async () => {
      mockData({ data: chartData1 })
      const { result } = renderHookWithProviders(() => useLineChartRelativeChange())

      // 1 -> 5 (+400%)
      expect(result.current).toEqual(
        expect.objectContaining({
          value: expect.objectContaining({ value: 400 }),
          formatted: expect.objectContaining({ value: '400.00%' }),
        }),
      )

      currentIndex.value = 2
      isActive.value = true

      // 1 -> 10 (+900%)
      await waitFor(() => {
        expect(result.current).toEqual(
          expect.objectContaining({
            value: expect.objectContaining({ value: 900 }),
            formatted: expect.objectContaining({ value: '900.00%' }),
          }),
        )
      })
    })

    it('updates the relative change when the data changes', async () => {
      mockData({ data: chartData1 })
      const { result, rerender } = renderHookWithProviders(() => useLineChartRelativeChange())

      // 1 -> 5 (+400%)
      expect(result.current).toEqual({
        value: expect.objectContaining({ value: 400 }),
        formatted: expect.objectContaining({ value: '400.00%' }),
      })

      await act(() => {
        mockData({ data: chartData2 })
        // Trigger rerender (it will be normally triggered when the data
        // returned from the usePriceChart hook changes)
        rerender()
      })

      // 1 -> 20 (+1900%)
      await waitFor(() => {
        expect(result.current).toEqual({
          value: expect.objectContaining({ value: 1900 }),
          formatted: expect.objectContaining({ value: '1900.00%' }),
        })
      })
    })
  })
})
