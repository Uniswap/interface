import { type LaunchProvenance, LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { ChartType, PriceChartType } from '~/components/Charts/utils'
import { TimePeriod } from '~/data/util'
import { UNISWAP_CCA_LAUNCHPAD_ID } from '~/pages/Launches/launchesModel'
import type { TDPChartState } from '~/pages/TokenDetails/components/chart/TDPChartState'

/** GetToken's attribution for a Custom CCA launch, named by mechanism as the registry serves it. */
export const SERVED_CUSTOM_CCA_PROVENANCE: LaunchProvenance = {
  launchpad: { id: UNISWAP_CCA_LAUNCHPAD_ID, name: 'Uniswap CCA Custom Launch' },
  method: LaunchProvenanceMethod.CustomAuction,
}

/** GetToken's attribution for a Crowd Launch, under the same registry row. */
export const SERVED_CROWD_CCA_PROVENANCE: LaunchProvenance = {
  launchpad: { id: UNISWAP_CCA_LAUNCHPAD_ID, name: 'Uniswap CCA Crowd Launch' },
  method: LaunchProvenanceMethod.CrowdLaunch,
}

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
