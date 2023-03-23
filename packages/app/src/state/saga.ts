import { combineReducers, Reducer } from '@reduxjs/toolkit'
import { spawn } from 'typed-redux-saga'
import { initProviders } from '../features/providers'
import {
  importAccountActions,
  importAccountReducer,
  importAccountSaga,
  importAccountSagaName,
} from '../features/wallet/import/importAccountSaga'
import {
  authActions,
  authReducer,
  authSaga,
  authSagaName,
} from '../features/auth/saga'
import { SagaState } from '../utils/saga'

const sagas = [initProviders] as const

export const monitoredSagas = {
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
