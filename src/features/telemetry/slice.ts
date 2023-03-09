import { createSlice } from '@reduxjs/toolkit'
import { ONE_DAY_MS } from 'src/utils/time'

export interface TelemetryState {
  lastBalancesReport: number // epoch time in milliseconds
}

export const initialTelemetryState: TelemetryState = {
  lastBalancesReport: 0,
}

export const slice = createSlice({
  name: 'telemetry',
  initialState: initialTelemetryState,
  reducers: {
    recordBalancesReport: (state) => {
      state.lastBalancesReport = Date.now()
    },
  },
})

export function shouldReportBalances(
  lastBalancesReport: number | undefined,
  signerAccountAddresses: string[],
  signerAccountValues: number[]
): boolean {
  return (
    lastBalancesReport === undefined ||
    (lastBalancesReport + ONE_DAY_MS < Date.now() &&
      signerAccountAddresses.length === signerAccountValues.length) // ensures data has been fully loaded
  )
}

export const { recordBalancesReport } = slice.actions
export const { reducer: telemetryReducer } = slice
