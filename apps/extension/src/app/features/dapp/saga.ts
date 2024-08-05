import { dappStore } from 'src/app/features/dapp/store'
import { call } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'

// Initialize Dapp Store
export function* initDappStore() {
  logger.debug('dappStoreSaga', 'initDappStore', 'Initializing Dapp Store')
  yield* call(dappStore.init)
}
