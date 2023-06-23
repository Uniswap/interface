import { call } from 'typed-redux-saga'
import { logger } from 'wallet/src/features/logger/logger'
import { createAccount } from 'wallet/src/features/wallet/create/createAccountSaga'
import {
  managePendingAccounts,
  PendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

/**
 * Create and activate an account in a single step
 */
function* createAndActivateAccount(validatedPassword: string) {
  yield* call(createAccount, { validatedPassword })
  yield* call(managePendingAccounts, PendingAccountActions.ActivateAndSelect)
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
