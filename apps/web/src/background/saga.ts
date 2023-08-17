import { dappRequestApprovalWatcher } from 'src/background/features/dappRequests/dappRequestApprovalWatcherSaga'
import {
  dappRequestWatcher,
  extensionRequestWatcher,
} from 'src/background/features/dappRequests/saga'
import { navigationSaga } from 'src/background/utils/navigationSaga'
import { spawn } from 'typed-redux-saga'
import { authActions, authReducer, authSaga, authSagaName } from 'wallet/src/features/auth/saga'
import { initProviders } from 'wallet/src/features/providers'
import {
  editAccountActions,
  editAccountReducer,
  editAccountSaga,
  editAccountSagaName,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import {
  createAccountActions,
  createAccountReducer,
  createAccountSaga,
  createAccountSagaName,
} from 'wallet/src/features/wallet/create/createAccountSaga'
import { pendingAccountSaga } from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import {
  importAccountActions,
  importAccountReducer,
  importAccountSaga,
  importAccountSagaName,
} from 'wallet/src/features/wallet/import/importAccountSaga'
import { getMonitoredSagaReducers, MonitoredSaga } from 'wallet/src/state/saga'
import { keepAliveSaga } from './utils/keepaliveSaga'

// Stateful sagas that are registered with the store on startup
export const monitoredSagas: Record<string, MonitoredSaga> = {
  [authSagaName]: {
    name: authSagaName,
    wrappedSaga: authSaga,
    reducer: authReducer,
    actions: authActions,
  },
  [createAccountSagaName]: {
    name: createAccountSagaName,
    wrappedSaga: createAccountSaga,
    reducer: createAccountReducer,
    actions: createAccountActions,
  },
  [editAccountSagaName]: {
    name: editAccountSagaName,
    wrappedSaga: editAccountSaga,
    reducer: editAccountReducer,
    actions: editAccountActions,
  },
  [importAccountSagaName]: {
    name: importAccountSagaName,
    wrappedSaga: importAccountSaga,
    reducer: importAccountReducer,
    actions: importAccountActions,
  },
} as const

const sagasInitializedOnStartup = [
  dappRequestApprovalWatcher,
  dappRequestWatcher,
  extensionRequestWatcher,
  initProviders,
  keepAliveSaga, // TODO(EXT:285): remove this and replace with session storage
  navigationSaga,
  pendingAccountSaga,
] as const

export const monitoredSagaReducers = getMonitoredSagaReducers(monitoredSagas)

export function* webRootSaga() {
  for (const s of sagasInitializedOnStartup) {
    yield* spawn(s)
  }

  for (const m of Object.values(monitoredSagas)) {
    yield* spawn(m.wrappedSaga)
  }
}
