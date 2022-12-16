import { appSelect } from 'src/app/hooks'
import { selectPendingAccounts } from 'src/features/wallet/selectors'
import { markAsNonPending, removeAccount } from 'src/features/wallet/walletSlice'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { all, put } from 'typed-redux-saga'

export enum PendingAccountActions {
  ACTIVATE = 'ACTIVATE',
  DELETE = 'DELETE',
}

/**
 * Manage all pending accounts. Useful within onboarding enable or delete in bulk.
 */
export function* managePendingAccounts(pendingAccountAction: PendingAccountActions) {
  const pendingAccounts = yield* appSelect(selectPendingAccounts)
  yield* all(
    Object.keys(pendingAccounts).map((address: Address) => {
      if (pendingAccountAction === PendingAccountActions.ACTIVATE) {
        return put(markAsNonPending(address))
      } else if (pendingAccountAction === PendingAccountActions.DELETE) {
        // TODO: [MOB-3914] cleanup low level RS key storage.
        return put(removeAccount(address))
      }
    })
  )
  logger.debug('pendingAccountsSaga', 'managePendingAccounts', 'Updated pending accounts.')
}

export const {
  name: pendingAccountSagaName,
  wrappedSaga: pendingAccountSaga,
  reducer: pendingAccountReducer,
  actions: pendingAccountActions,
} = createMonitoredSaga<PendingAccountActions>(managePendingAccounts, 'managePendingAccounts')
