import { PayloadAction } from '@reduxjs/toolkit'
import BootSplash from 'react-native-bootsplash'
import { SagaIterator } from 'redux-saga'
import { BiometricAuthenticationStatus } from 'src/features/biometrics/biometrics-utils'
import {
  selectAuthenticationStatusIsAuthenticated,
  setAuthenticationStatus,
  triggerAuthentication,
} from 'src/features/biometrics/biometricsSlice'
import { selectRequiredForAppAccess } from 'src/features/biometricsSettings/slice'
import {
  hideSplashScreen as hideSplashScreenAction,
  selectSplashScreenIsHidden,
} from 'src/features/splashScreen/splashScreenSlice'
import { call, put, select, take, takeEvery } from 'typed-redux-saga'

//------------------------------
// SplashScreen saga
//------------------------------

export function* splashScreenSaga(): SagaIterator {
  if (yield* select(selectSplashScreenIsHidden)) {
    return
  }
  // Take the first hide request only (deduplicates multiple requests)
  yield* take(hideSplashScreenAction.type)

  // has the user enabled biometrics for app access?
  const requiredForAppAccess = yield* select(selectRequiredForAppAccess)
  // is the authentication status authenticated?
  const authenticationStatusIsAuthenticated = yield* select(selectAuthenticationStatusIsAuthenticated)
  // if biometrics are not required for app access or the authentication status is authenticated, hide the splash screen
  if (!requiredForAppAccess || authenticationStatusIsAuthenticated) {
    yield* call(hideSplashScreen)
  } else {
    // if biometrics are required for app access and the authentication status is not authenticated, trigger authentication
    yield* put(triggerAuthentication({ showAlert: true }))
    // unlock when we find a valid authentication status
    yield* takeEvery(setAuthenticationStatus.type, onAuthenticationStatusChange)
  }
}

function* hideSplashScreen(): SagaIterator {
  // ensures smooth fade out
  yield* call(async () => new Promise(requestAnimationFrame))
  yield* call(BootSplash.hide, { fade: true })
}

function* onAuthenticationStatusChange(action: PayloadAction<BiometricAuthenticationStatus>): SagaIterator {
  if (action.payload === BiometricAuthenticationStatus.Authenticated) {
    yield* call(hideSplashScreen)
  }
}
