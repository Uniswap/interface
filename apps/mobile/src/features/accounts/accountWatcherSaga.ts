import { disconnectWCForAccount } from 'src/features/walletConnect/WalletConnect'
import { call, takeEvery } from 'typed-redux-saga'
import { logger } from 'wallet/src/features/logger/logger'
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
  const id = yield* call(getValidAddress, address, true)
  if (!id) throw new Error('Cannot disconnect WC for an account with an invalid address')

  try {
    yield* call(disconnectWCForAccount, address)
  } catch {
    // no-op in case the account is not connected, since this watcher is not caller-specific
  }
}
