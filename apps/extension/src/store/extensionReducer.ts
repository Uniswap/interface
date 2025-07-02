import { combineReducers } from 'redux'
import { PersistState } from 'redux-persist'
import { dappRequestReducer } from 'src/app/features/dappRequests/slice'
import { alertsReducer } from 'src/app/features/onboarding/alerts/slice'
import { popupsReducer } from 'src/app/features/popups/slice'
import { monitoredSagaReducers } from 'src/app/saga'
import { walletPersistedStateList, walletReducers } from 'wallet/src/state/walletReducer'

const extensionReducers = {
  ...walletReducers,
  saga: monitoredSagaReducers,
  dappRequests: dappRequestReducer,
  popups: popupsReducer,
  alerts: alertsReducer,
} as const

export const extensionReducer = combineReducers(extensionReducers)

// Only include here things that need to be persisted and shared between different instances of the sidebar.
// Only one sidebar can write to the storage at a time, so we need to be careful about what we persist.
// Things that only belong to a single instance of the sidebar (for example, dapp requests) should not be whitelisted.
export const extensionPersistedStateList: Array<keyof typeof extensionReducers> = [
  ...walletPersistedStateList,
  'dappRequests',
  'alerts',
]

export type ExtensionState = ReturnType<typeof extensionReducer> & { _persist?: PersistState }
