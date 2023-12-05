import { MobileState } from 'src/app/reducer'

export const selectLastBalancesReport = (state: MobileState): number | undefined =>
  state.telemetry.lastBalancesReport

export const selectLastBalancesReportValue = (state: MobileState): number | undefined =>
  state.telemetry.lastBalancesReportValue

export const selectWalletIsFunded = (state: MobileState): boolean => state.telemetry.walletIsFunded
