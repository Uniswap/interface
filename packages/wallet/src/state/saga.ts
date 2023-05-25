import { combineReducers, Reducer } from '@reduxjs/toolkit'
import { spawn } from 'typed-redux-saga'
import { authActions, authReducer, authSaga, authSagaName } from 'wallet/src/features/auth/saga'
import { initProviders } from 'wallet/src/features/providers'
import {
  importAccountActions,
  importAccountReducer,
  importAccountSaga,
  importAccountSagaName,
} from 'wallet/src/features/wallet/import/importAccountSaga'
import { SagaState } from 'wallet/src/utils/saga'

// Sagas that are spawned at startup
const sagas = [initProviders] as const

interface MonitoredSaga {
  // TODO(MOB-645): Add more specific types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

// Stateful sagas that are registered with teh store on startup
export const monitoredSagas: Record<string, MonitoredSaga> = {
  [importAccountSagaName]: {
    name: importAccountSagaName,
    wrappedSaga: importAccountSaga,
    reducer: importAccountReducer,
    actions: importAccountActions,
  },
  [authSagaName]: {
    name: authSagaName,
    wrappedSaga: authSaga,
    reducer: authReducer,
    actions: authActions,
  },
} as const

type MonitoredSagaReducer = Reducer<Record<string, SagaState>>
export const monitoredSagaReducers: MonitoredSagaReducer = combineReducers(
  Object.values(monitoredSagas).reduce(
    (acc: { [name: string]: Reducer<SagaState> }, { name, reducer }) => {
      acc[name] = reducer
      return acc
    },
    {}
  )
)

export function* rootSaga() {
  for (const s of sagas) {
    yield* spawn(s)
  }
  for (const m of Object.values(monitoredSagas)) {
    yield* spawn(m.wrappedSaga)
  }
}
