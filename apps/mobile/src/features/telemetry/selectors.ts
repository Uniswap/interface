import { MobileState } from 'src/app/reducer'

export const selectLastBalancesReport = (state: MobileState): number | undefined =>
  state.telemetry.lastBalancesReport

export const selectLastBalancesReportValue = (state: MobileState): number | undefined =>
  state.telemetry.lastBalancesReportValue
