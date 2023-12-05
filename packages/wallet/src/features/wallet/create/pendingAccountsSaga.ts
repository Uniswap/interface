import { put } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'
import { selectPendingAccounts } from 'wallet/src/features/wallet/selectors'
import {
  removeAccounts,
  setAccountAsActive,
  setAccountsNonPending,
} from 'wallet/src/features/wallet/slice'
import { appSelect } from 'wallet/src/state'
import { createSaga } from 'wallet/src/utils/saga'

export enum PendingAccountActions {
  Activate = 'Activate',
  ActivateAndSelect = 'ActivateAndSelect',
  Delete = 'Delete',
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
  if (pendingAccountAction === PendingAccountActions.Activate) {
    yield* put(setAccountsNonPending(pendingAddresses))
  } else if (pendingAccountAction === PendingAccountActions.ActivateAndSelect) {
    yield* put(setAccountsNonPending(pendingAddresses))
    if (pendingAddresses[0]) {
      yield* put(setAccountAsActive(pendingAddresses[0]))
    }
  } else if (pendingAccountAction === PendingAccountActions.Delete) {
    // TODO: [MOB-244] cleanup low level RS key storage.
    yield* put(removeAccounts(pendingAddresses))
  }

  logger.debug('pendingAccountsSaga', 'managePendingAccounts', 'Updated pending accounts.')
}

export const { wrappedSaga: pendingAccountSaga, actions: pendingAccountActions } = createSaga(
  managePendingAccounts,
  'managePendingAccounts'
)
