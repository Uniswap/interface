import { put } from 'typed-redux-saga'
import { logger } from 'wallet/src/features/logger/logger'
import { selectPendingAccounts } from 'wallet/src/features/wallet/selectors'
import { markAsNonPending, removeAccounts } from 'wallet/src/features/wallet/slice'
import { appSelect } from 'wallet/src/state'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

export enum PendingAccountActions {
  ACTIVATE = 'ACTIVATE',
  DELETE = 'DELETE',
}

/**
 * Manage all pending accounts. Useful within onboarding enable or delete in bulk.
 */
export function* managePendingAccounts(pendingAccountAction: PendingAccountActions) {
  const pendingAccounts = yield* appSelect(selectPendingAccounts)
  const pendingAddresses = Object.keys(pendingAccounts)
  if (!pendingAddresses.length) {
    // It does not make sense to make updates, when there is nothing to update
    // Also `removeAccounts` called with empty array will change the current active account
    logger.debug('pendingAccountsSaga', 'managePendingAccounts', 'No pending accounts found.')
    return
  }
  if (pendingAccountAction === PendingAccountActions.ACTIVATE) {
    yield* put(markAsNonPending(pendingAddresses))
  } else if (pendingAccountAction === PendingAccountActions.DELETE) {
    // TODO: [MOB-244] cleanup low level RS key storage.
    yield* put(removeAccounts(pendingAddresses))
  }

  logger.debug('pendingAccountsSaga', 'managePendingAccounts', 'Updated pending accounts.')
}

export const {
  name: pendingAccountSagaName,
  wrappedSaga: pendingAccountSaga,
  reducer: pendingAccountReducer,
  actions: pendingAccountActions,
} = createMonitoredSaga(managePendingAccounts, 'managePendingAccounts')
