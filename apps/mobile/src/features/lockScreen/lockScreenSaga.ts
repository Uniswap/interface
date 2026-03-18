import { PayloadAction } from '@reduxjs/toolkit'
import { AppStateStatus } from 'react-native'
import { SagaIterator } from 'redux-saga'
import { selectIsFromBackground, transitionAppState } from 'src/features/appState/appStateSlice'
import { BiometricAuthenticationStatus } from 'src/features/biometrics/biometrics-utils'
import {
  selectAuthenticationStatusIsAuthenticated,
  setAuthenticationStatus,
  triggerAuthentication,
} from 'src/features/biometrics/biometricsSlice'
import { selectRequiredForAppAccess } from 'src/features/biometricsSettings/slice'
import {
  LockScreenVisibility,
  selectIsLockScreenVisible,
  selectLockScreenOnBlur,
  selectPreventLock,
  setLockScreenVisibility,
  setManualRetryRequired,
} from 'src/features/lockScreen/lockScreenSlice'
import { onSplashScreenHidden } from 'src/features/splashScreen/splashScreenSlice'
import { call, put, select, takeEvery, takeLatest } from 'typed-redux-saga'

//------------------------------
// LockScreen saga
//------------------------------

export function* lockScreenSaga(): SagaIterator {
  // setup initial lock screen state on app load if required
  yield* call(setupInitialLockScreenState)
  // handle when splash screen is hidden
  yield* takeLatest(onSplashScreenHidden.type, onSplashScreenHide)
  // handle when app state changes
  yield* takeLatest(transitionAppState.type, onAppStateTransition)
  // handle authentication status change in dedicated saga
  yield* takeEvery(setAuthenticationStatus.type, onAuthenticationStatusChange)
}

function* setupInitialLockScreenState(): SagaIterator {
  if (yield* call(shouldPresentLockScreen)) {
    yield* put(setLockScreenVisibility(LockScreenVisibility.Visible))
  }
}

function* onSplashScreenHide(): SagaIterator {
  const isRequiredForAppAccess = yield* select(selectRequiredForAppAccess)
  // if biometrics are required for app access, trigger authentication
  if (isRequiredForAppAccess) {
    yield* call(handleTriggerAuthentication)
  }
}

function* onAuthenticationStatusChange(action: PayloadAction<BiometricAuthenticationStatus>): SagaIterator {
  const isVisible = yield* select(selectIsLockScreenVisible)
  if (isVisible) {
    // on success, dismiss the lock screen
    if (action.payload === BiometricAuthenticationStatus.Authenticated) {
      yield* put(setLockScreenVisibility(LockScreenVisibility.Hidden))
      yield* put(setManualRetryRequired(false))
    }
    // on failure, show the manual retry button
    // authenticated and authenticating are not failures,
    // everything else is a failure
    if (
      action.payload !== BiometricAuthenticationStatus.Authenticated &&
      action.payload !== BiometricAuthenticationStatus.Authenticating
    ) {
      yield* put(setManualRetryRequired(true))
    }
  }
}

function* onAppStateTransition(action: PayloadAction<AppStateStatus>): SagaIterator {
  switch (action.payload) {
    case 'inactive':
      yield* call(toInactiveTransition)
      break
    case 'background':
      yield* call(toBackgroundTransition)
      break
    case 'active':
      yield* call(toActiveTransition)
      break
  }
}

// handle -> inactive
function* toInactiveTransition(): SagaIterator {
  if (yield* call(shouldPresentLockScreen)) {
    yield* put(setLockScreenVisibility(LockScreenVisibility.Visible))
  }
}

// handle -> background
function* toBackgroundTransition(): SagaIterator {
  if (yield* call(shouldPresentLockScreen)) {
    yield* put(setLockScreenVisibility(LockScreenVisibility.Visible))
    // invalidate authentication on backgrounding if
    // biometrics are required for app access
    yield* call(handleInvalidateAuthentication)
  }
}

// handle -> active
function* toActiveTransition(): SagaIterator {
  if (yield* call(shouldDismissLockScreen)) {
    yield* put(setLockScreenVisibility(LockScreenVisibility.Hidden))
  } else {
    // only trigger authentication if the app was in the background
    if (yield* select(selectIsFromBackground)) {
      yield* call(handleTriggerAuthentication)
    }
    // the lock screen will be dismissed when the authentication status changes to authenticated
  }
}

function* handleInvalidateAuthentication(): SagaIterator {
  const preventLock = yield* select(selectPreventLock)
  if (preventLock) {
    return
  }
  if (yield* select(selectRequiredForAppAccess)) {
    yield* put(setAuthenticationStatus(BiometricAuthenticationStatus.Invalid))
  }
  yield* put(setManualRetryRequired(false))
}

function* handleTriggerAuthentication(): SagaIterator {
  yield* put(triggerAuthentication({}))
}

function* shouldDismissLockScreen(): SagaIterator<boolean> {
  if (!(yield* select(selectRequiredForAppAccess))) {
    // always dismiss lock screen if biometrics are not required for app access
    return true
  }
  return yield* select(selectAuthenticationStatusIsAuthenticated)
}

function* shouldPresentLockScreen(): SagaIterator<boolean> {
  const preventLock = yield* select(selectPreventLock)
  if (preventLock) {
    return false
  }
  const requiredForAppAccess = yield* select(selectRequiredForAppAccess)
  const lockScreenOnBlur = yield* select(selectLockScreenOnBlur)
  return requiredForAppAccess || lockScreenOnBlur
}
