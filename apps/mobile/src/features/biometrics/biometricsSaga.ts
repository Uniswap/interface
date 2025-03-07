import { PayloadAction } from '@reduxjs/toolkit'
import {
  AuthenticationType,
  hasHardwareAsync,
  isEnrolledAsync,
  supportedAuthenticationTypesAsync,
} from 'expo-local-authentication'
import { Alert } from 'react-native'
import { SagaIterator, Task } from 'redux-saga'
import { BiometricAuthenticationStatus, tryLocalAuthenticate } from 'src/features/biometrics/biometrics-utils'
import {
  TriggerAuthenticationPayload,
  setAuthenticationStatus,
  setDeviceSupportsBiometrics,
  setIsEnrolled,
  setSupportedAuthenticationTypes,
  triggerAuthentication,
} from 'src/features/biometrics/biometricsSlice'
import { all, call, cancel, fork, put, take } from 'typed-redux-saga'
import i18n from 'uniswap/src/i18n'

//------------------------------------------------------------------------------------------------
// biometricsSaga
//------------------------------------------------------------------------------------------------

export function* biometricsSaga(): SagaIterator {
  // check for biometrics support (todo: persist this as this never changes per device)
  const { deviceSupportsBiometrics, isEnrolled, supportedAuthenticationTypes } = yield* call(checkBiometricsSupport)
  // @ts-expect-error -- `all` doesn't accept the type of `put`
  yield* all([
    put(setDeviceSupportsBiometrics(deviceSupportsBiometrics)),
    put(setIsEnrolled(isEnrolled)),
    put(setSupportedAuthenticationTypes(supportedAuthenticationTypes)),
  ])
  // --------------------------------------------------------------------------------------------
  // Watch for authentication triggers
  // --------------------------------------------------------------------------------------------
  const authTask: Task = yield* fork(function* watchAuthenticationTriggers(): SagaIterator {
    while (true) {
      const action = yield* take(triggerAuthentication.type)
      yield* call(handleAuthentication, action)
    }
  })
  return () => {
    cancel(authTask)
  }
}

async function getAllBiometricsSupport(): Promise<{
  deviceSupportsBiometrics: boolean
  isEnrolled: boolean
  supportedAuthenticationTypes: AuthenticationType[]
}> {
  const [deviceSupportsBiometrics, isEnrolled, supportedAuthenticationTypes] = await Promise.all([
    hasHardwareAsync(),
    isEnrolledAsync(),
    supportedAuthenticationTypesAsync(),
  ])
  return { deviceSupportsBiometrics, isEnrolled, supportedAuthenticationTypes }
}

function* checkBiometricsSupport(): SagaIterator<{
  deviceSupportsBiometrics: boolean
  isEnrolled: boolean
  supportedAuthenticationTypes: AuthenticationType[]
}> {
  return yield* call(getAllBiometricsSupport)
}

function* handleAuthentication(action: PayloadAction<TriggerAuthenticationPayload>): SagaIterator {
  const { onSuccess, onFailure, params, showAlert } = action.payload
  let shouldContinue = true

  while (shouldContinue) {
    yield* put(setAuthenticationStatus(BiometricAuthenticationStatus.Authenticating))

    const isSuccessful = yield* call(withRetries, function* () {
      const result = yield* call(tryLocalAuthenticate)
      return biometricAuthenticationSuccessful(result) || biometricAuthenticationDisabledByOS(result)
    })

    if (isSuccessful) {
      yield* put(setAuthenticationStatus(BiometricAuthenticationStatus.Authenticated))
      if (onSuccess) {
        yield* call(onSuccess, params)
      }
      return
    } else {
      yield* put(setAuthenticationStatus(BiometricAuthenticationStatus.Rejected))

      if (showAlert) {
        shouldContinue = yield* call(showAuthenticationAlert)
      } else {
        shouldContinue = false
      }

      if (!shouldContinue && onFailure) {
        yield* call(onFailure)
      }
    }
  }
}

function showAuthenticationAlert(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    Alert.alert(i18n.t('biometrics.authentication.failed.title'), i18n.t('biometrics.authentication.failed.message'), [
      { text: i18n.t('common.button.tryAgain'), onPress: () => resolve(true) },
    ])
  })
}

export function biometricAuthenticationSuccessful(status: BiometricAuthenticationStatus): boolean {
  return status === BiometricAuthenticationStatus.Authenticated
}

function biometricAuthenticationDisabledByOS(status: BiometricAuthenticationStatus): boolean {
  return (
    status === BiometricAuthenticationStatus.Unsupported || status === BiometricAuthenticationStatus.MissingEnrollment
  )
}

function* withRetries<T>(operation: () => SagaIterator<T>, maxRetries: number = 2): SagaIterator<T | undefined> {
  let currentAttempt = 0
  while (currentAttempt < maxRetries) {
    currentAttempt++
    const result = yield* call(operation)
    if (result) {
      return result
    }
    if (currentAttempt === maxRetries) {
      return undefined
    }
  }
  return undefined
}
