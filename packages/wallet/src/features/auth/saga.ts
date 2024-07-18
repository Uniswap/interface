import { call } from 'typed-redux-saga'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { AuthActionType, AuthBaseParams, AuthSagaError, UnlockParams } from 'wallet/src/features/auth/types'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

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
  if (!success) {
    throw new Error(AuthSagaError.InvalidPassword)
  }
  yield* call(sendAnalyticsEvent, ExtensionEventName.ChangeLockedState, {
    locked: false,
    location: 'sidebar',
  })
}

function* lock() {
  logger.debug('authSaga', 'lock', `Locking wallet`)
  yield* call(Keyring.lock)
  yield* call(sendAnalyticsEvent, ExtensionEventName.ChangeLockedState, {
    locked: true,
    location: 'sidebar',
  })
}

export const {
  name: authSagaName,
  wrappedSaga: authSaga,
  reducer: authReducer,
  actions: authActions,
} = createMonitoredSaga<AuthBaseParams>(auth, 'auth', { showErrorNotification: false })
