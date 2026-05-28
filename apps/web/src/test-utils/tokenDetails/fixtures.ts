import { TimePeriod } from '~/appGraphql/data/util'
import { ChartType, PriceChartType } from '~/components/Charts/utils'
import type { TDPChartState } from '~/pages/TokenDetails/components/chart/TDPChartState'

/** Default `chartState` for TDP store tests; pass overrides for one-off cases. */
export function createMockTDPChartState(overrides: Partial<TDPChartState> = {}): TDPChartState {
  return {
    chartType: ChartType.PRICE,
    setChartType: vi.fn(),
    timePeriod: TimePeriod.DAY,
    setTimePeriod: vi.fn(),
    priceChartType: PriceChartType.LINE,
    setPriceChartType: vi.fn(),
    disableCandlestickUI: false,
    setDisableCandlestickUI: vi.fn(),
    ...overrides,
  }
}
