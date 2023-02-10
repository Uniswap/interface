import { combineReducers, Reducer } from '@reduxjs/toolkit'
import { spawn } from 'redux-saga/effects'
import { cloudBackupsManagerSaga } from 'src/features/CloudBackup/saga'
import { deepLinkWatcher } from 'src/features/deepLinking/handleDeepLink'
import { amplitudeSaga } from 'src/features/experiments/saga'
import { firebaseDataWatcher } from 'src/features/firebase/firebaseData'
import { initFirebase } from 'src/features/firebase/initFirebaseSaga'
import {
  importAccountActions,
  importAccountReducer,
  importAccountSaga,
  importAccountSagaName,
} from 'src/features/import/importAccountSaga'
import { notificationWatcher } from 'src/features/notifications/notificationWatcher'
import { initProviders } from 'src/features/providers/providerSaga'
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
import { SagaState } from 'src/utils/saga'

// All regular sagas must be included here
const sagas = [
  amplitudeSaga,
  initProviders,
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

interface MonitoredSaga {
  // TODO(MOB-3857): Add more specific types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}
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

type MonitoredSagaReducer = Reducer<Record<string, SagaState>>
export const monitoredSagaReducers: MonitoredSagaReducer = combineReducers(
  Object.keys(monitoredSagas).reduce(
    (acc: { [name: string]: Reducer<SagaState> }, sagaName: string) => {
      // Safe non-null assertion because key `sagaName` comes from `Object.keys(monitoredSagas)`
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      acc[sagaName] = monitoredSagas[sagaName]!.reducer
      return acc
    },
    {}
  )
)

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function* rootSaga() {
  for (const s of sagas) {
    yield spawn(s)
  }
  for (const m of Object.values(monitoredSagas)) {
    yield spawn(m.wrappedSaga)
  }
}
