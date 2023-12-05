import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const balanceReportFrequency = ONE_MINUTE_MS * 5

export interface TelemetryState {
  // epoch time in milliseconds
  lastBalancesReport: number
  // the USD balance last reported
  lastBalancesReportValue?: number
  walletIsFunded: boolean
}

export const initialTelemetryState: TelemetryState = {
  lastBalancesReport: 0,
  lastBalancesReportValue: 0,
  walletIsFunded: false,
}

export const slice = createSlice({
  name: 'telemetry',
  initialState: initialTelemetryState,
  reducers: {
    recordBalancesReport: (
      state,
      { payload: { totalBalance } }: PayloadAction<{ totalBalance: number }>
    ) => {
      state.lastBalancesReport = Date.now()
      state.lastBalancesReportValue = totalBalance
    },
    recordWalletFunded: (state) => {
      state.walletIsFunded = true
    },
  },
})

export function shouldReportBalances(
  lastBalancesReport: number | undefined,
  lastBalancesReportValue: number | undefined,
  signerAccountAddresses: string[],
  signerAccountValues: number[]
): boolean {
  const currentBalance = signerAccountValues.reduce((a, b) => a + b, 0)

  const didWalletGetFunded = currentBalance > 0 && lastBalancesReportValue === 0
  const balanceReportDue = (lastBalancesReport ?? 0) + balanceReportFrequency < Date.now()
  const validAccountInfo = signerAccountAddresses.length === signerAccountValues.length

  return validAccountInfo && (didWalletGetFunded || balanceReportDue)
}

export const { recordBalancesReport, recordWalletFunded } = slice.actions
export const { reducer: telemetryReducer } = slice
