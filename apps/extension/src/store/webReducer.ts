import { combineReducers } from 'redux'
import { dappRequestReducer } from 'src/app/features/dappRequests/slice'
import { alertsReducer } from 'src/app/features/onboarding/alerts/slice'
import { popupsReducer } from 'src/app/features/popups/slice'
import { monitoredSagaReducers } from 'src/app/saga'
import { RootState } from 'wallet/src/state'
import { sharedReducers } from 'wallet/src/state/reducer'

export const webReducers = {
  ...sharedReducers,
  saga: monitoredSagaReducers,
  dappRequests: dappRequestReducer,
  popups: popupsReducer,
  alerts: alertsReducer,
} as const

export const webReducer = combineReducers(webReducers)

export type WebState = ReturnType<typeof webReducer> & RootState
export type ReducerNames = keyof typeof webReducers
