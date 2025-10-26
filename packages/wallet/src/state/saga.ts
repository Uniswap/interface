import { combineReducers, Reducer } from '@reduxjs/toolkit'
import { spawn } from 'typed-redux-saga'
import { notificationWatcher } from 'wallet/src/features/notifications/notificationWatcherSaga'
import { initProviders } from 'wallet/src/features/providers/saga'
import {
  sendTokenActions,
  sendTokenReducer,
  sendTokenSaga,
  sendTokenSagaName,
} from 'wallet/src/features/transactions/send/sendTokenSaga'
import { SagaState } from 'wallet/src/utils/saga'

// Sagas that are spawned at startup
const walletSagas = [initProviders, notificationWatcher] as const

export interface MonitoredSaga {
  // TODO(MOB-645): Add more specific types
  // biome-ignore lint/suspicious/noExplicitAny: Generic saga state interface needs flexible typing
  [key: string]: any
}

export type MonitoredSagaReducer = Reducer<Record<string, SagaState>>

export function getMonitoredSagaReducers(monitoredSagas: Record<string, MonitoredSaga>): MonitoredSagaReducer {
  return combineReducers(
    Object.keys(monitoredSagas).reduce((acc: { [name: string]: Reducer<SagaState> }, sagaName: string) => {
      // Safe non-null assertion because key `sagaName` comes from `Object.keys(monitoredSagas)`
      // biome-ignore lint/style/noNonNullAssertion: Safe assertion in test or migration context
      acc[sagaName] = monitoredSagas[sagaName]!.reducer
      return acc
    }, {}),
  )
}

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
    yield* spawn(m.wrappedSaga)
  }
}
