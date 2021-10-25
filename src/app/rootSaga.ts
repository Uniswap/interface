import { combineReducers, Reducer } from '@reduxjs/toolkit'
import { call, spawn } from 'redux-saga/effects'
import {
  fetchBalancesActions,
  fetchBalancesReducer,
  fetchBalancesSaga,
  fetchBalancesSagaName,
} from 'src/features/balances/fetchBalances'
import {
  importAccountActions,
  importAccountReducer,
  importAccountSaga,
  importAccountSagaName,
} from 'src/features/import/importAccount'
import { initProviders } from 'src/features/providers/initProviders'
import {
  transferTokenActions,
  transferTokenReducer,
  transferTokenSaga,
  transferTokenSagaName,
} from 'src/features/transfer/transferToken'
import {
  createAccountActions,
  createAccountReducer,
  createAccountSaga,
  createAccountSagaName,
} from 'src/features/wallet/createAccount'
import { SagaActions, SagaState } from 'src/utils/saga'

// Things that should happen before other sagas start go here
function* init() {
  yield call(initProviders)
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
  [createAccountSagaName]: {
    name: createAccountSagaName,
    wrappedSaga: createAccountSaga,
    reducer: createAccountReducer,
    actions: createAccountActions,
  },
  [fetchBalancesSagaName]: {
    name: fetchBalancesSagaName,
    wrappedSaga: fetchBalancesSaga,
    reducer: fetchBalancesReducer,
    actions: fetchBalancesActions,
  },
  [importAccountSagaName]: {
    name: importAccountSagaName,
    wrappedSaga: importAccountSaga,
    reducer: importAccountReducer,
    actions: importAccountActions,
  },
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
