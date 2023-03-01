import { appSelect } from 'src/app/hooks'
import { selectPendingAccounts } from 'src/features/wallet/selectors'
import { markAsNonPending, removeAccounts } from 'src/features/wallet/walletSlice'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { put } from 'typed-redux-saga'

export enum PendingAccountActions {
  ACTIVATE = 'ACTIVATE',
  DELETE = 'DELETE',
}

/**
 * Manage all pending accounts. Useful within onboarding enable or delete in bulk.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
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
    // TODO: [MOB-3914] cleanup low level RS key storage.
    yield* put(removeAccounts(pendingAddresses))
  }

  logger.debug('pendingAccountsSaga', 'managePendingAccounts', 'Updated pending accounts.')
}

export const {
  name: pendingAccountSagaName,
  wrappedSaga: pendingAccountSaga,
  reducer: pendingAccountReducer,
  actions: pendingAccountActions,
} = createMonitoredSaga<PendingAccountActions>(managePendingAccounts, 'managePendingAccounts')
