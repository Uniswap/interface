import { call } from 'typed-redux-saga'
import { logger } from 'wallet/src/features/logger/logger'
import { createAccount } from 'wallet/src/features/wallet/create/createAccountSaga'
import {
  managePendingAccounts,
  PendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

/**
 * Create, activate, and mark an account as active in a single step
 */
function* createAndSelectActivatedAccount(validatedPassword: string) {
  yield* call(createAccount, { validatedPassword })
  yield* call(managePendingAccounts, PendingAccountActions.ActivateAndSelect)
  logger.debug(
    'createAndSelectActivatedAccountSaga',
    'createAndSelectActivatedAccount',
    'Created a new wallet from an existing seed phrase'
  )
}

export const {
  name: createAndSelectActivatedAccountName,
  wrappedSaga: createAndSelectActivatedAccountSaga,
  reducer: createAndSelectActivatedAccountReducer,
  actions: createAndSelectActivatedAccountActions,
} = createMonitoredSaga(createAndSelectActivatedAccount, 'createAndSelectActivatedAccount')
