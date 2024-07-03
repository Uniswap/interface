import { SharedState } from 'wallet/src/state/reducer'

export const selectLastBalancesReport = (state: SharedState): number => state.telemetry.lastBalancesReport

export const selectLastBalancesReportValue = (state: SharedState): number | undefined =>
  state.telemetry.lastBalancesReportValue

export const selectLastHeartbeat = (state: SharedState): number => state.telemetry.lastHeartbeat

export const selectWalletIsFunded = (state: SharedState): boolean => state.telemetry.walletIsFunded

export const selectAllowAnalytics = (state: SharedState): boolean => state.telemetry.allowAnalytics
