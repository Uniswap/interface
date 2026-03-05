import { spawn } from 'typed-redux-saga'
import { type MonitoredSaga } from 'uniswap/src/utils/saga'
import { notificationWatcher } from 'wallet/src/features/notifications/notificationWatcherSaga'
import { initProviders } from 'wallet/src/features/providers/saga'
import {
  sendTokenActions,
  sendTokenReducer,
  sendTokenSaga,
  sendTokenSagaName,
} from 'wallet/src/features/transactions/send/sendTokenSaga'

// Sagas that are spawned at startup
const walletSagas = [initProviders, notificationWatcher] as const

export const walletMonitoredSagas: Record<string, MonitoredSaga> = {
  [sendTokenSagaName]: {
    name: sendTokenSagaName,
    wrappedSaga: sendTokenSaga,
    reducer: sendTokenReducer,
    actions: sendTokenActions,
  },
}

export function* rootWalletSaga() {
  for (const s of walletSagas) {
    yield* spawn(s)
  }

  for (const m of Object.values(walletMonitoredSagas)) {
    yield* spawn(m['wrappedSaga'])
  }
}
