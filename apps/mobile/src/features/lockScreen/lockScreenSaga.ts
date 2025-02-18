import { PayloadAction } from '@reduxjs/toolkit'
import { AppStateStatus } from 'react-native'
import { SagaIterator } from 'redux-saga'
import { transitionAppState } from 'src/features/appState/appStateSlice'
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
  setLockScreenVisibility,
} from 'src/features/lockScreen/lockScreenSlice'
import { call, put, select, takeEvery, takeLatest } from 'typed-redux-saga'

//------------------------------
// LockScreen saga
//------------------------------

export function* lockScreenSaga(): SagaIterator {
  yield* takeLatest(transitionAppState.type, handleLockScreenTransition)
  // handle authentication status change in dedicated saga
  yield* takeEvery(setAuthenticationStatus.type, handleAuthenticationStatusChange)
}

function* handleAuthenticationStatusChange(action: PayloadAction<BiometricAuthenticationStatus>): SagaIterator {
  const isVisible = yield* select(selectIsLockScreenVisible)
  if (action.payload === BiometricAuthenticationStatus.Authenticated && isVisible) {
    yield* put(setLockScreenVisibility(LockScreenVisibility.Hidden))
  }
}

function* handleLockScreenTransition(action: PayloadAction<AppStateStatus>): SagaIterator {
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
    yield* call(invalidateAuthentication)
  }
}

function* invalidateAuthentication(): SagaIterator {
  if (yield* select(selectRequiredForAppAccess)) {
    yield* put(setAuthenticationStatus(BiometricAuthenticationStatus.Invalid))
  }
}

// handle -> active
function* toActiveTransition(): SagaIterator {
  if (yield* call(shouldDismissLockScreen)) {
    yield* put(setLockScreenVisibility(LockScreenVisibility.Hidden))
  } else {
    yield* put(triggerAuthentication({ showAlert: true }))
    // the lock screen will be dismissed when the authentication status changes to authenticated
  }
}

function* shouldDismissLockScreen(): SagaIterator<boolean> {
  if (!(yield* select(selectRequiredForAppAccess))) {
    // always dismiss lock screen if biometrics are not required for app access
    return true
  }
  return yield* select(selectAuthenticationStatusIsAuthenticated)
}

function* shouldPresentLockScreen(): SagaIterator<boolean> {
  const requiredForAppAccess = yield* select(selectRequiredForAppAccess)
  const lockScreenOnBlur = yield* select(selectLockScreenOnBlur)
  return requiredForAppAccess || lockScreenOnBlur
}
