import { call, put } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { lockWallet, unlockWallet } from 'wallet/src/features/wallet/slice'
import { createMonitoredSaga } from 'wallet/src/utils/saga'
import { AuthActionType, AuthBaseParams, AuthSagaError, UnlockParams } from './types'

function* auth(params: AuthBaseParams) {
  logger.debug('authSaga', 'auth', `Using monitored auth saga`)

  if (params.type === AuthActionType.Unlock) {
    return yield* call(unlock, params as UnlockParams)
  } else if (params.type === AuthActionType.Lock) {
    return yield* call(lock)
  }
}

function* unlock({ password }: UnlockParams) {
  logger.debug('authSaga', 'unlock', `Unlocking wallet`)
  const success = yield* call(Keyring.unlock, password)
  if (success) {
    yield* put(unlockWallet())
  } else {
    throw new Error(AuthSagaError.InvalidPassword)
  }
}

function* lock() {
  logger.debug('authSaga', 'lock', `Locking wallet`)
  yield* call(Keyring.lock)
  yield* put(lockWallet())
}

export const {
  name: authSagaName,
  wrappedSaga: authSaga,
  reducer: authReducer,
  actions: authActions,
} = createMonitoredSaga<AuthBaseParams>(auth, 'auth', { showErrorNotification: false })
