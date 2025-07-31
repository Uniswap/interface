import { initDappStore } from 'src/app/features/dapp/saga'
import { dappRequestApprovalWatcher } from 'src/app/features/dappRequests/dappRequestApprovalWatcherSaga'
import { dappRequestWatcher } from 'src/app/features/dappRequests/saga'
import { call, spawn } from 'typed-redux-saga'
import { apolloClientRef } from 'wallet/src/data/apollo/usePersistedApolloClient'
import { authActions, authReducer, authSaga, authSagaName } from 'wallet/src/features/auth/saga'
import { deviceLocaleWatcher } from 'wallet/src/features/i18n/deviceLocaleWatcherSaga'
import { initProviders } from 'wallet/src/features/providers/saga'
import {
  removeDelegationActions,
  removeDelegationReducer,
  removeDelegationSaga,
  removeDelegationSagaName,
} from 'wallet/src/features/smartWallet/sagas/removeDelegationSaga'
import {
  executeSwapActions,
  executeSwapReducer,
  executeSwapSaga,
  executeSwapSagaName,
  prepareAndSignSwapActions,
  prepareAndSignSwapReducer,
  prepareAndSignSwapSaga,
  prepareAndSignSwapSagaName,
} from 'wallet/src/features/transactions/swap/configuredSagas'
import { swapActions, swapReducer, swapSaga, swapSagaName } from 'wallet/src/features/transactions/swap/swapSaga'
import {
  tokenWrapActions,
  tokenWrapReducer,
  tokenWrapSaga,
  tokenWrapSagaName,
} from 'wallet/src/features/transactions/swap/wrapSaga'
import { watchTransactionEvents } from 'wallet/src/features/transactions/watcher/transactionFinalizationSaga'
import { transactionWatcher } from 'wallet/src/features/transactions/watcher/transactionWatcherSaga'
import {
  editAccountActions,
  editAccountReducer,
  editAccountSaga,
  editAccountSagaName,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import {
  createAccountsActions,
  createAccountsReducer,
  createAccountsSaga,
  createAccountsSagaName,
} from 'wallet/src/features/wallet/create/createAccountsSaga'
import { MonitoredSaga, getMonitoredSagaReducers } from 'wallet/src/state/saga'

// Stateful sagas that are registered with the store on startup
export const monitoredSagas: Record<string, MonitoredSaga> = {
  [authSagaName]: {
    name: authSagaName,
    wrappedSaga: authSaga,
    reducer: authReducer,
    actions: authActions,
  },
  [createAccountsSagaName]: {
    name: createAccountsSagaName,
    wrappedSaga: createAccountsSaga,
    reducer: createAccountsReducer,
    actions: createAccountsActions,
  },
  [editAccountSagaName]: {
    name: editAccountSagaName,
    wrappedSaga: editAccountSaga,
    reducer: editAccountReducer,
    actions: editAccountActions,
  },
  [prepareAndSignSwapSagaName]: {
    name: prepareAndSignSwapSagaName,
    wrappedSaga: prepareAndSignSwapSaga,
    reducer: prepareAndSignSwapReducer,
    actions: prepareAndSignSwapActions,
  },
  [executeSwapSagaName]: {
    name: executeSwapSagaName,
    wrappedSaga: executeSwapSaga,
    reducer: executeSwapReducer,
    actions: executeSwapActions,
  },
  [swapSagaName]: {
    name: swapSagaName,
    wrappedSaga: swapSaga,
    reducer: swapReducer,
    actions: swapActions,
  },
  [tokenWrapSagaName]: {
    name: tokenWrapSagaName,
    wrappedSaga: tokenWrapSaga,
    reducer: tokenWrapReducer,
    actions: tokenWrapActions,
  },
  [removeDelegationSagaName]: {
    name: removeDelegationSagaName,
    wrappedSaga: removeDelegationSaga,
    reducer: removeDelegationReducer,
    actions: removeDelegationActions,
  },
} as const

const sagasInitializedOnStartup = [
  initDappStore,
  dappRequestApprovalWatcher,
  dappRequestWatcher,
  initProviders,
  watchTransactionEvents,
  deviceLocaleWatcher,
] as const

export const monitoredSagaReducers = getMonitoredSagaReducers(monitoredSagas)

export function* rootExtensionSaga() {
  for (const s of sagasInitializedOnStartup) {
    yield* spawn(s)
  }

  const apolloClient = yield* call(apolloClientRef.onReady)
  yield* spawn(transactionWatcher, { apolloClient })

  for (const m of Object.values(monitoredSagas)) {
    yield* spawn(m.wrappedSaga)
  }
}
