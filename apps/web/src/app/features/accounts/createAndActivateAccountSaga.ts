import { call } from 'typed-redux-saga'
import { logger } from 'wallet/src/features/logger/logger'
import { createAccount } from 'wallet/src/features/wallet/create/createAccountSaga'
import {
  managePendingAccounts,
  PendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

/**
 * Create and active an account in a single step
 */
function* createAndActivateAccount() {
  yield* call(createAccount)
  yield* call(managePendingAccounts, PendingAccountActions.ACTIVATE)
  logger.debug(
    'createAndActivateAccountSaga',
    'createAndActivateAccount',
    'Created a new wallet from an existing seed phrase'
  )
}

export const {
  name: createAndActivateAccountSagaName,
  wrappedSaga: createAndActivateAccountSaga,
  reducer: createAndActivateAccountReducer,
  actions: createAndActivateAccountActions,
} = createMonitoredSaga(createAndActivateAccount, 'createAndActivateAccount')
