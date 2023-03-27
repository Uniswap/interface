import { createMonitoredSaga } from 'app/src/utils/saga'
import { AuthParams } from './types'
import { call } from 'typed-redux-saga'
import { logger } from '../logger/logger'

// TODO(xtine): implement this
function* auth({ password }: AuthParams) {
  logger.debug('authSaga', 'auth', `Logging in with password}`)

  yield* call(decryptPassword, password)
}

function decryptPassword(password: string) {
  logger.debug('saga', 'decryptingPassword', password)
}

export const {
  name: authSagaName,
  wrappedSaga: authSaga,
  reducer: authReducer,
  actions: authActions,
} = createMonitoredSaga<AuthParams>(auth, 'auth')
