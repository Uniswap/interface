import { apolloClient } from 'src/data/usePersistedApolloClient'
import { appRatingWatcherSaga } from 'src/features/appRating/saga'
import { cloudBackupsManagerSaga } from 'src/features/CloudBackup/saga'
import { deepLinkWatcher } from 'src/features/deepLinking/handleDeepLinkSaga'
import { firebaseDataWatcher } from 'src/features/firebase/firebaseDataSaga'
import { modalWatcher } from 'src/features/modals/saga'
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
import { restoreMnemonicCompleteWatcher } from 'src/features/wallet/saga'
import { walletConnectSaga } from 'src/features/walletConnect/saga'
import { signWcRequestSaga } from 'src/features/walletConnect/signWcRequestSaga'
import { spawn } from 'typed-redux-saga'
import { appLanguageWatcherSaga } from 'wallet/src/features/language/saga'
import { transactionWatcher } from 'wallet/src/features/transactions/transactionWatcherSaga'
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

// All regular sagas must be included here
const sagas = [
  appLanguageWatcherSaga,
  appRatingWatcherSaga,
  cloudBackupsManagerSaga,
  deepLinkWatcher,
  firebaseDataWatcher,
  modalWatcher,
  notificationWatcher,
  pendingAccountSaga,
  restoreMnemonicCompleteWatcher,
  signWcRequestSaga,
  telemetrySaga,
  walletConnectSaga,
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

  yield* spawn(transactionWatcher, { apolloClient })

  for (const m of Object.values(monitoredSagas)) {
    yield* spawn(m.wrappedSaga)
  }
}
