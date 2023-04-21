import { createMonitoredSaga } from 'wallet/src/utils/saga'
import { AuthParams } from './types'
import { call } from 'typed-redux-saga'
import { logger } from '../logger/logger'
import { Keyring } from '../wallet/Keyring/Keyring'

function* auth({ password }: AuthParams) {
  logger.debug('authSaga', 'auth', `Logging in with password`)

  return yield* call(Keyring.unlock, password)
}

export const {
  name: authSagaName,
  wrappedSaga: authSaga,
  reducer: authReducer,
  actions: authActions,
} = createMonitoredSaga<AuthParams>(auth, 'auth')
