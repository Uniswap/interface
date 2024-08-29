import { WalletState } from 'wallet/src/state/walletReducer'

export const selectLastBalancesReport = (state: WalletState): number => state.telemetry.lastBalancesReport

export const selectLastBalancesReportValue = (state: WalletState): number | undefined =>
  state.telemetry.lastBalancesReportValue

export const selectLastHeartbeat = (state: WalletState): number => state.telemetry.lastHeartbeat

export const selectWalletIsFunded = (state: WalletState): boolean => state.telemetry.walletIsFunded

export const selectAllowAnalytics = (state: WalletState): boolean => state.telemetry.allowAnalytics
