import { MobileState } from 'src/app/reducer'

export const selectLastBalancesReport = (state: MobileState): number =>
  state.telemetry.lastBalancesReport

export const selectLastBalancesReportValue = (state: MobileState): number | undefined =>
  state.telemetry.lastBalancesReportValue

export const selectLastHeartbeat = (state: MobileState): number => state.telemetry.lastHeartbeat

export const selectWalletIsFunded = (state: MobileState): boolean => state.telemetry.walletIsFunded

export const selectAllowAnalytics = (state: MobileState): boolean => state.telemetry.allowAnalytics
