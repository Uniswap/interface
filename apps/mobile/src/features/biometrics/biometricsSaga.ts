import { PayloadAction } from '@reduxjs/toolkit'
import {
  AuthenticationType,
  hasHardwareAsync,
  isEnrolledAsync,
  supportedAuthenticationTypesAsync,
} from 'expo-local-authentication'
import { SagaIterator, Task } from 'redux-saga'
import { BiometricAuthenticationStatus, tryLocalAuthenticate } from 'src/features/biometrics/biometrics-utils'
import {
  setAuthenticationStatus,
  setDeviceSupportsBiometrics,
  setIsEnrolled,
  setSupportedAuthenticationTypes,
  TriggerAuthenticationPayload,
  triggerAuthentication,
} from 'src/features/biometrics/biometricsSlice'
import { all, call, cancel, fork, put, take } from 'typed-redux-saga'

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
      const action = yield* take(triggerAuthentication)
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
  const { onSuccess, onFailure, params } = action.payload

  yield* put(setAuthenticationStatus(BiometricAuthenticationStatus.Authenticating))

  const result = yield* call(tryLocalAuthenticate)
  const isSuccessful = biometricAuthenticationSuccessful(result) || biometricAuthenticationDisabledByOS(result)

  if (isSuccessful) {
    yield* put(setAuthenticationStatus(BiometricAuthenticationStatus.Authenticated))
    if (onSuccess) {
      yield* call(onSuccess, params)
    }
    return
  } else {
    yield* put(setAuthenticationStatus(BiometricAuthenticationStatus.Rejected))

    if (onFailure) {
      yield* call(onFailure)
    }
  }
}

export function biometricAuthenticationSuccessful(status: BiometricAuthenticationStatus): boolean {
  return status === BiometricAuthenticationStatus.Authenticated
}

function biometricAuthenticationDisabledByOS(status: BiometricAuthenticationStatus): boolean {
  return (
    status === BiometricAuthenticationStatus.Unsupported || status === BiometricAuthenticationStatus.MissingEnrollment
  )
}
