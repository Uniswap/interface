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

// All monitored sagas must be included here
export const monitoredSagas: Record<string, MonitoredSaga> = {
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
}

export const monitoredSagaReducers = getMonitoredSagaReducers(monitoredSagas)
