import type { BarPrice, DeepPartial, IChartApi, ISeriesApi, TimeChartOptions } from 'lightweight-charts'
import { ChartModel, ChartModelParams } from '~/components/Charts/ChartModelCore'
import { SeriesDataItemType } from '~/components/Charts/types'

const { mockApplyOptions } = vi.hoisted(() => ({ mockApplyOptions: vi.fn() }))

vi.mock('lightweight-charts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('lightweight-charts')>()),
  createChart: () =>
    ({
      applyOptions: mockApplyOptions,
      subscribeCrosshairMove: vi.fn(),
    }) as unknown as IChartApi,
}))

class TestChartModel extends ChartModel<SeriesDataItemType> {
  protected series = {} as ISeriesApi<'Area'>
}

const params = {
  locale: 'es-ES',
  colors: { neutral2: { val: '#000000' }, surface3: { val: '#000000' } },
  format: {},
  isLargeScreen: true,
  data: [],
} as unknown as ChartModelParams<SeriesDataItemType>

describe('ChartModel.updateOptions', () => {
  beforeEach(() => {
    mockApplyOptions.mockClear()
  })

  it('applies the app locale by default', () => {
    new TestChartModel(document.createElement('div'), params).updateOptions(params)

    expect(mockApplyOptions).toHaveBeenCalledTimes(1)
    expect(mockApplyOptions.mock.lastCall?.[0].localization.locale).toBe('es-ES')
  })

  it('keeps the app locale when a subclass overrides other localization options (LP-266)', () => {
    const priceFormatter = (price: BarPrice): string => String(price)
    const nonDefaultOptions: DeepPartial<TimeChartOptions> = { localization: { priceFormatter } }

    new TestChartModel(document.createElement('div'), params).updateOptions(params, nonDefaultOptions)

    const applied = mockApplyOptions.mock.lastCall?.[0]
    expect(applied.localization.locale).toBe('es-ES')
    expect(applied.localization.priceFormatter).toBe(priceFormatter)
  })
})
