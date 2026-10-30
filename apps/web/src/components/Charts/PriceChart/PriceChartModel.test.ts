import type { IChartApi, UTCTimestamp } from 'lightweight-charts'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { getLowPriceRangeScaleFactor, PriceChartModel } from '~/components/Charts/PriceChart/PriceChartModel'
import { PriceChartType } from '~/components/Charts/utils'

const { mockApplyOptions } = vi.hoisted(() => ({ mockApplyOptions: vi.fn() }))

vi.mock('lightweight-charts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('lightweight-charts')>()),
  createChart: () =>
    ({
      applyOptions: mockApplyOptions,
      subscribeCrosshairMove: vi.fn(),
      addSeries: () => ({
        setData: vi.fn(),
        applyOptions: vi.fn(),
        createPriceLine: vi.fn(),
        removePriceLine: vi.fn(),
      }),
      timeScale: () => ({ fitContent: vi.fn() }),
    }) as unknown as IChartApi,
}))

const SCALED = 1_000_000_000
const UNSCALED = 1

describe(getLowPriceRangeScaleFactor, () => {
  it('scales up a low-value token so its price axis earns more points', () => {
    expect(getLowPriceRangeScaleFactor({ min: 0.000001, max: 0.000004 })).toBe(SCALED)
    expect(getLowPriceRangeScaleFactor({ min: 0.98, max: 1.02 })).toBe(SCALED)
  })

  it('leaves a wide-ranging series alone', () => {
    expect(getLowPriceRangeScaleFactor({ min: 1000, max: 1400 })).toBe(UNSCALED)
    expect(getLowPriceRangeScaleFactor({ min: 0, max: 0.5 })).toBe(UNSCALED)
  })

  // A flat series of large values passes the narrow-range test but must not be scaled: the product
  // exceeds what lightweight-charts will plot, and its assertion throws out of the chart's mount
  // effect, blanking the whole app. A steady auction FDV is exactly this shape.
  it('leaves a flat series of large values unscaled rather than overflowing the chart', () => {
    expect(getLowPriceRangeScaleFactor({ min: 1_200_000, max: 1_200_000 })).toBe(UNSCALED)
    expect(getLowPriceRangeScaleFactor({ min: 404_142_487, max: 404_142_487 })).toBe(UNSCALED)
    expect(getLowPriceRangeScaleFactor({ min: -404_142_487, max: -404_142_487 })).toBe(UNSCALED)
  })

  it('scales right up to the point the product would stop fitting', () => {
    const maxScalable = Number.MAX_SAFE_INTEGER / 100 / SCALED
    expect(getLowPriceRangeScaleFactor({ min: maxScalable, max: maxScalable })).toBe(SCALED)
    expect(getLowPriceRangeScaleFactor({ min: maxScalable * 1.01, max: maxScalable * 1.01 })).toBe(UNSCALED)
  })
})

describe('PriceChartModel.updateOptions', () => {
  const colors = new Proxy({}, { get: () => ({ val: '#000000' }) })
  const params = {
    locale: 'en-US',
    colors,
    format: { convertFiatAmountFormatted: vi.fn() },
    isLargeScreen: true,
    type: PriceChartType.LINE,
    timePeriod: HistoryDuration.Day,
    data: [1, 2].map((close) => ({
      time: close as UTCTimestamp,
      value: close,
      open: close,
      high: close,
      low: close,
      close,
    })),
  } as unknown as ConstructorParameters<typeof PriceChartModel>[1]

  const lastRightPriceScale = (): { visible?: boolean } => mockApplyOptions.mock.lastCall?.[0].rightPriceScale

  beforeEach(() => {
    mockApplyOptions.mockClear()
  })

  it('shows the y-axis again after it was hidden', () => {
    const model = new PriceChartModel(document.createElement('div'), { ...params, hideYAxis: true })
    expect(lastRightPriceScale().visible).toBe(false)

    model.updateOptions({ ...params, hideYAxis: false })
    expect(lastRightPriceScale().visible).toBe(true)
  })
})
