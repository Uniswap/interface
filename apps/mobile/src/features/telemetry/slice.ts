import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SharedEventName } from '@uniswap/analytics-events'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'

const balanceReportFrequency = ONE_MINUTE_MS * 5

export interface TelemetryState {
  // if the user has opted in/out of analytics
  allowAnalytics: boolean
  // anonymous user heartbeat, epoch time in milliseconds
  lastHeartbeat: number
  // epoch time in milliseconds
  lastBalancesReport: number
  // the USD balance last reported
  lastBalancesReportValue?: number
  walletIsFunded: boolean
}

export const initialTelemetryState: TelemetryState = {
  allowAnalytics: true,
  lastHeartbeat: 0,
  lastBalancesReport: 0,
  lastBalancesReportValue: 0,
  walletIsFunded: false,
}

export const slice = createSlice({
  name: 'telemetry',
  initialState: initialTelemetryState,
  reducers: {
    recordHeartbeat: (state) => {
      sendWalletAnalyticsEvent(SharedEventName.HEARTBEAT)
      state.lastHeartbeat = Date.now()
    },
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
    setAllowAnalytics: (state, { payload: { enabled } }: PayloadAction<{ enabled: boolean }>) => {
      const logToggleEvent = (): void => {
        sendWalletAnalyticsEvent(SharedEventName.ANALYTICS_SWITCH_TOGGLED, { enabled })
        analytics.flushEvents()
      }

      // If turning off, log toggle event before turning off analytics
      if (!enabled) {
        logToggleEvent()
      }

      analytics
        .setAllowAnalytics(enabled)
        .then(() => {
          // If turned on, log toggle event after turning on analytics
          if (enabled) {
            logToggleEvent()
          }
        })
        .catch(() => undefined)

      // Set enabled in user state
      state.allowAnalytics = enabled
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

export const { recordHeartbeat, recordBalancesReport, recordWalletFunded, setAllowAnalytics } =
  slice.actions
export const { reducer: telemetryReducer } = slice
