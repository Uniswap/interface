import { call } from 'typed-redux-saga'
import { logger } from 'wallet/src/features/logger/logger'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { createMonitoredSaga } from 'wallet/src/utils/saga'
import { AuthParams } from './types'

function* auth({ password }: AuthParams) {
  logger.debug('authSaga', 'auth', `Logging in with password`)

  return yield* call(Keyring.unlock, password)
}

export const {
  name: authSagaName,
  wrappedSaga: authSaga,
  reducer: authReducer,
  actions: authActions,
} = createMonitoredSaga<AuthParams>(auth, 'auth', { showErrorNotification: false })
