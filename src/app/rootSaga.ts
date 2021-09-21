import { combineReducers, Reducer } from '@reduxjs/toolkit'
import { call, spawn } from 'redux-saga/effects'
import { createAccount } from 'src/features/wallet/createAccount'
import { createMonitoredSaga, SagaActions, SagaState } from 'src/utils/saga'

// Things that should happen before other sagas start go here
function* init() {
  yield call(createAccount)
}

// All regular sagas must be included here
const sagas: any[] = []

interface MonitoredSaga {
  name: string
  wrappedSaga: any
  reducer: Reducer<SagaState>
  actions: SagaActions
}

// All monitored sagas must be included here
export const monitoredSagas: {
  [name: string]: MonitoredSaga
} = {
  createAccount: createMonitoredSaga(createAccount, 'createAccount'),
}

type MonitoredSagaReducer = Reducer<Record<string, SagaState>>
export const monitoredSagaReducers: MonitoredSagaReducer = combineReducers(
  Object.keys(monitoredSagas).reduce(
    (acc: { [name: string]: Reducer<SagaState> }, sagaName: string) => {
      acc[sagaName] = monitoredSagas[sagaName].reducer
      return acc
    },
    {}
  )
)

export function* rootSaga() {
  yield spawn(init)
  for (const m of Object.values(monitoredSagas)) {
    yield spawn(m.wrappedSaga)
  }
  for (const s of sagas) {
    yield spawn(s)
  }
}
