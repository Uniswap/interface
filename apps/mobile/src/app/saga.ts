import type { SagaIterator } from 'redux-saga'
import { monitoredSagas } from 'src/app/monitoredSagas'
import { appRatingWatcherSaga } from 'src/features/appRating/saga'
import { appStateSaga } from 'src/features/appState/appStateSaga'
import { biometricsSaga } from 'src/features/biometrics/biometricsSaga'
import { deepLinkWatcher } from 'src/features/deepLinking/handleDeepLinkSaga'
import { firebaseDataWatcher } from 'src/features/firebase/firebaseDataSaga'
import { lockScreenSaga } from 'src/features/lockScreen/lockScreenSaga'
import { pushNotificationsWatcherSaga } from 'src/features/notifications/saga'
import { splashScreenSaga } from 'src/features/splashScreen/splashScreenSaga'
import { telemetrySaga } from 'src/features/telemetry/saga'
import { restoreMnemonicCompleteWatcher } from 'src/features/wallet/saga'
import { walletConnectSaga } from 'src/features/walletConnect/saga'
import { signWcRequestSaga } from 'src/features/walletConnect/signWcRequestSaga'
import { call, fork, join, spawn } from 'typed-redux-saga'
import { waitForRehydration } from 'uniswap/src/utils/saga'
import { apolloClientRef } from 'wallet/src/data/apollo/usePersistedApolloClient'
import { deviceLocaleWatcher } from 'wallet/src/features/i18n/deviceLocaleWatcherSaga'
import { transactionWatcher } from 'wallet/src/features/transactions/watcher/transactionWatcherSaga'

// These sagas are not persisted, so we can run them before rehydration
const nonPersistedSagas = [appStateSaga, splashScreenSaga, biometricsSaga]

// All regular sagas must be included here
const sagas = [
  lockScreenSaga,
  appRatingWatcherSaga,
  deepLinkWatcher,
  firebaseDataWatcher,
  pushNotificationsWatcherSaga,
  restoreMnemonicCompleteWatcher,
  signWcRequestSaga,
  telemetrySaga,
  walletConnectSaga,
  deviceLocaleWatcher,
]

export function* rootMobileSaga(): SagaIterator {
  // Start non-persisted sagas
  for (const s of nonPersistedSagas) {
    yield* spawn(s)
  }

  // Fork the rehydration process to run in parallel
  const rehydrationTask = yield* fork(waitForRehydration)

  // Initialize Apollo client in parallel
  const apolloClient = yield* call(apolloClientRef.onReady)

  // Wait for rehydration to complete
  yield* join(rehydrationTask)

  // Start regular sagas after rehydration is complete
  for (const s of sagas) {
    yield* spawn(s)
  }

  // Start transaction watcher with Apollo client
  yield* spawn(transactionWatcher, { apolloClient })

  // Start monitored sagas
  for (const m of Object.values(monitoredSagas)) {
    yield* spawn(m.wrappedSaga)
  }
}
