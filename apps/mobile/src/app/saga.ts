import { PersistState } from 'redux-persist'
import { cloudBackupsManagerSaga } from 'src/features/CloudBackup/saga'
import { appRatingWatcherSaga } from 'src/features/appRating/saga'
import { deepLinkWatcher } from 'src/features/deepLinking/handleDeepLinkSaga'
import { firebaseDataWatcher } from 'src/features/firebase/firebaseDataSaga'
import { modalWatcher } from 'src/features/modals/saga'
import { telemetrySaga } from 'src/features/telemetry/saga'
import { restoreMnemonicCompleteWatcher } from 'src/features/wallet/saga'
import { walletConnectSaga } from 'src/features/walletConnect/saga'
import { signWcRequestSaga } from 'src/features/walletConnect/signWcRequestSaga'
import { call, delay, select, spawn } from 'typed-redux-saga'
import { apolloClientRef } from 'wallet/src/data/apollo/usePersistedApolloClient'
import { appLanguageWatcherSaga } from 'wallet/src/features/language/saga'
import { swapActions, swapReducer, swapSaga, swapSagaName } from 'wallet/src/features/transactions/swap/swapSaga'
import {
  tokenWrapActions,
  tokenWrapReducer,
  tokenWrapSaga,
  tokenWrapSagaName,
} from 'wallet/src/features/transactions/swap/wrapSaga'
import { transactionWatcher } from 'wallet/src/features/transactions/transactionWatcherSaga'
import {
  editAccountActions,
  editAccountReducer,
  editAccountSaga,
  editAccountSagaName,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import {
  createAccountsActions,
  createAccountsReducer,
  createAccountsSaga,
  createAccountsSagaName,
} from 'wallet/src/features/wallet/create/createAccountsSaga'
import { MonitoredSaga, getMonitoredSagaReducers } from 'wallet/src/state/saga'

const REHYDRATION_STATUS_POLLING_INTERVAL = 50

// All regular sagas must be included here
const sagas = [
  appLanguageWatcherSaga,
  appRatingWatcherSaga,
  cloudBackupsManagerSaga,
  deepLinkWatcher,
  firebaseDataWatcher,
  modalWatcher,
  restoreMnemonicCompleteWatcher,
  signWcRequestSaga,
  telemetrySaga,
  walletConnectSaga,
]

// All monitored sagas must be included here
export const monitoredSagas: Record<string, MonitoredSaga> = {
  [createAccountsSagaName]: {
    name: createAccountsSagaName,
    wrappedSaga: createAccountsSaga,
    reducer: createAccountsReducer,
    actions: createAccountsActions,
  },
  [editAccountSagaName]: {
    name: editAccountSagaName,
    wrappedSaga: editAccountSaga,
    reducer: editAccountReducer,
    actions: editAccountActions,
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
  // wait until redux-persist has finished rehydration
  while (true) {
    if (yield* select((state: { _persist?: PersistState }): boolean | undefined => state._persist?.rehydrated)) {
      break
    }
    yield* delay(REHYDRATION_STATUS_POLLING_INTERVAL)
  }

  for (const s of sagas) {
    yield* spawn(s)
  }

  const apolloClient = yield* call(apolloClientRef.onReady)

  yield* spawn(transactionWatcher, { apolloClient })

  for (const m of Object.values(monitoredSagas)) {
    yield* spawn(m.wrappedSaga)
  }
}
