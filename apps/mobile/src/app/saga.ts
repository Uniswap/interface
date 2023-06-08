import { cloudBackupsManagerSaga } from 'src/features/CloudBackup/saga'
import { deepLinkWatcher } from 'src/features/deepLinking/handleDeepLinkSaga'
import { firebaseDataWatcher } from 'src/features/firebase/firebaseDataSaga'
import { initFirebase } from 'src/features/firebase/initFirebaseSaga'
import {
  importAccountActions,
  importAccountReducer,
  importAccountSaga,
  importAccountSagaName,
} from 'src/features/import/importAccountSaga'
import { notificationWatcher } from 'src/features/notifications/notificationWatcherSaga'
import { telemetrySaga } from 'src/features/telemetry/saga'
import {
  swapActions,
  swapReducer,
  swapSaga,
  swapSagaName,
} from 'src/features/transactions/swap/swapSaga'
import {
  tokenWrapActions,
  tokenWrapReducer,
  tokenWrapSaga,
  tokenWrapSagaName,
} from 'src/features/transactions/swap/wrapSaga'
import { transactionWatcher } from 'src/features/transactions/transactionWatcherSaga'
import {
  transferTokenActions,
  transferTokenReducer,
  transferTokenSaga,
  transferTokenSagaName,
} from 'src/features/transactions/transfer/transferTokenSaga'
import {
  createAccountActions,
  createAccountReducer,
  createAccountSaga,
  createAccountSagaName,
} from 'src/features/wallet/createAccountSaga'
import {
  editAccountActions,
  editAccountReducer,
  editAccountSaga,
  editAccountSagaName,
} from 'src/features/wallet/editAccountSaga'
import {
  pendingAccountActions,
  pendingAccountReducer,
  pendingAccountSaga,
  pendingAccountSagaName,
} from 'src/features/wallet/pendingAccountsSaga'
import { signWcRequestSaga, walletConnectSaga } from 'src/features/walletConnect/saga'
import { walletConnectV2Saga } from 'src/features/walletConnectV2/saga'
import { spawn } from 'typed-redux-saga'
import { getMonitoredSagaReducers, MonitoredSaga } from 'wallet/src/state/saga'

// All regular sagas must be included here
const sagas = [
  telemetrySaga,
  initFirebase,
  deepLinkWatcher,
  transactionWatcher,
  firebaseDataWatcher,
  notificationWatcher,
  walletConnectSaga,
  walletConnectV2Saga,
  signWcRequestSaga,
  cloudBackupsManagerSaga,
]

// All monitored sagas must be included here
export const monitoredSagas: Record<string, MonitoredSaga> = {
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
  [pendingAccountSagaName]: {
    name: pendingAccountSagaName,
    wrappedSaga: pendingAccountSaga,
    reducer: pendingAccountReducer,
    actions: pendingAccountActions,
  },
  [transferTokenSagaName]: {
    name: transferTokenSagaName,
    wrappedSaga: transferTokenSaga,
    reducer: transferTokenReducer,
    actions: transferTokenActions,
  },
  [swapSagaName]: {
    name: swapSagaName,
    wrappedSaga: swapSaga,
    reducer: swapReducer,
    actions: swapActions,
  },
  [tokenWrapSagaName]: {
    name: tokenWrapSagaName,
    wrappedSaga: tokenWrapSaga,
    reducer: tokenWrapReducer,
    actions: tokenWrapActions,
  },
}

export const monitoredSagaReducers = getMonitoredSagaReducers(monitoredSagas)

export function* mobileSaga() {
  for (const s of sagas) {
    yield* spawn(s)
  }
  for (const m of Object.values(monitoredSagas)) {
    yield* spawn(m.wrappedSaga)
  }
}
