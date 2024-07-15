import { combineReducers, Reducer } from '@reduxjs/toolkit'
import { spawn } from 'typed-redux-saga'
import { notificationWatcher } from 'wallet/src/features/notifications/notificationWatcherSaga'
import { initProviders } from 'wallet/src/features/providers'
import {
  transferTokenActions,
  transferTokenReducer,
  transferTokenSaga,
  transferTokenSagaName,
} from 'wallet/src/features/transactions/transfer/transferTokenSaga'
import { SagaState } from 'wallet/src/utils/saga'

// Sagas that are spawned at startup
const sharedSagas = [initProviders, notificationWatcher] as const

export interface MonitoredSaga {
  // TODO(MOB-645): Add more specific types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export type MonitoredSagaReducer = Reducer<Record<string, SagaState>>

export function getMonitoredSagaReducers(
  monitoredSagas: Record<string, MonitoredSaga>
): MonitoredSagaReducer {
  return combineReducers(
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
}

export const sharedMonitoredSagas: Record<string, MonitoredSaga> = {
  [transferTokenSagaName]: {
    name: transferTokenSagaName,
    wrappedSaga: transferTokenSaga,
    reducer: transferTokenReducer,
    actions: transferTokenActions,
  },
}

export function* rootSaga() {
  for (const s of sharedSagas) {
    yield* spawn(s)
  }

  for (const m of Object.values(sharedMonitoredSagas)) {
    yield* spawn(m.wrappedSaga)
  }
}
