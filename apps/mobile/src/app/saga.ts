import { PersistState } from 'redux-persist'
import { monitoredSagas } from 'src/app/monitoredSagas'
import { cloudBackupsManagerSaga } from 'src/features/CloudBackup/saga'
import { appRatingWatcherSaga } from 'src/features/appRating/saga'
import { appStateSaga } from 'src/features/appState/appStateSaga'
import { biometricsSaga } from 'src/features/biometrics/biometricsSaga'
import { deepLinkWatcher } from 'src/features/deepLinking/handleDeepLinkSaga'
import { firebaseDataWatcher } from 'src/features/firebase/firebaseDataSaga'
import { lockScreenSaga } from 'src/features/lockScreen/lockScreenSaga'
import { modalWatcher } from 'src/features/modals/saga'
import { pushNotificationsWatcherSaga } from 'src/features/notifications/saga'
import { splashScreenSaga } from 'src/features/splashScreen/splashScreenSaga'
import { telemetrySaga } from 'src/features/telemetry/saga'
import { restoreMnemonicCompleteWatcher } from 'src/features/wallet/saga'
import { walletConnectSaga } from 'src/features/walletConnect/saga'
import { signWcRequestSaga } from 'src/features/walletConnect/signWcRequestSaga'
import { call, delay, select, spawn } from 'typed-redux-saga'
import { appLanguageWatcherSaga } from 'uniswap/src/features/language/saga'
import { apolloClientRef } from 'wallet/src/data/apollo/usePersistedApolloClient'
import { transactionWatcher } from 'wallet/src/features/transactions/transactionWatcherSaga'

const REHYDRATION_STATUS_POLLING_INTERVAL = 50

// All regular sagas must be included here
const sagas = [
  appLanguageWatcherSaga,
  appRatingWatcherSaga,
  cloudBackupsManagerSaga,
  deepLinkWatcher,
  firebaseDataWatcher,
  modalWatcher,
  pushNotificationsWatcherSaga,
  restoreMnemonicCompleteWatcher,
  signWcRequestSaga,
  telemetrySaga,
  walletConnectSaga,
  appStateSaga,
  splashScreenSaga,
  biometricsSaga,
  lockScreenSaga,
]

export function* rootMobileSaga() {
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
