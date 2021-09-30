import { combineReducers, Reducer } from '@reduxjs/toolkit'
import { call, spawn } from 'redux-saga/effects'
import {
  transferTokenActions,
  transferTokenReducer,
  transferTokenSaga,
  transferTokenSagaName,
} from 'src/features/transfer/transferToken'
import { createAccount } from 'src/features/wallet/createAccount'
import { SagaActions, SagaState } from 'src/utils/saga'

// Things that should happen before other sagas start go here
function* init() {
  // TODO remove
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
  [transferTokenSagaName]: {
    name: transferTokenSagaName,
    wrappedSaga: transferTokenSaga,
    reducer: transferTokenReducer,
    actions: transferTokenActions,
  },
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
