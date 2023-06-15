import {
  createAndActivateAccountActions,
  createAndActivateAccountReducer,
  createAndActivateAccountSaga,
  createAndActivateAccountSagaName,
} from 'src/app/features/accounts/createAndActivateAccountSaga'
import { dappRequestApprovalWatcher } from 'src/background/features/dappRequests/dappRequestApprovalWatcherSaga'
import {
  dappRequestWatcher,
  extensionRequestWatcher,
} from 'src/background/features/dappRequests/saga'
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
import {
  pendingAccountActions,
  pendingAccountReducer,
  pendingAccountSaga,
  pendingAccountSagaName,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
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
  [createAndActivateAccountSagaName]: {
    name: createAndActivateAccountSagaName,
    wrappedSaga: createAndActivateAccountSaga,
    reducer: createAndActivateAccountReducer,
    actions: createAndActivateAccountActions,
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
  [pendingAccountSagaName]: {
    name: pendingAccountSagaName,
    wrappedSaga: pendingAccountSaga,
    reducer: pendingAccountReducer,
    actions: pendingAccountActions,
  },
} as const

const sagasInitializedOnStartup = [
  dappRequestWatcher,
  dappRequestApprovalWatcher,
  extensionRequestWatcher,
  keepAliveSaga,
  initProviders,
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
