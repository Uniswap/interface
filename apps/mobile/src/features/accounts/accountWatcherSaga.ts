import { call, takeEvery } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'
import { removeAccount } from 'wallet/src/features/wallet/slice'
import { getValidAddress } from 'wallet/src/utils/addresses'

/**
 * Watch account actions in order to do any necessary cleanup
 */
export function* accountCleanupWatcher() {
  logger.debug(
    'accountWatcherSaga',
    'accountCleanupWatcher',
    'Initializing account cleanup watcher'
  )
  yield* takeEvery(removeAccount, removeAccountCleanup)
}

function* removeAccountCleanup(action: ReturnType<typeof removeAccount>) {
  const address = action.payload
  yield* call(getValidAddress, address, true)
}
