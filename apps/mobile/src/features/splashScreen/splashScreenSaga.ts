import BootSplash from 'react-native-bootsplash'
import { SagaIterator } from 'redux-saga'
import {
  dismissSplashScreen,
  onSplashScreenHidden,
  selectSplashScreenDismissRequested,
  selectSplashScreenIsHidden,
} from 'src/features/splashScreen/splashScreenSlice'
import { call, put, select, takeLatest } from 'typed-redux-saga'

//------------------------------
// SplashScreen saga
//------------------------------

export function* splashScreenSaga(): SagaIterator {
  if (yield* select(selectSplashScreenIsHidden)) {
    return
  }
  // if the splash screen was dismissed before the
  // saga was started, we need to hide it immediately
  if (yield* select(selectSplashScreenDismissRequested)) {
    yield* call(hideSplashScreen)
  }
  // otherwise, we need to wait for the splash screen to be dismissed
  // via a dispatch of the dismissSplashScreen action
  yield* takeLatest(dismissSplashScreen.type, hideSplashScreen)
}

function* hideSplashScreen(): SagaIterator {
  // ensures smooth fade out
  yield* call(async () => new Promise(requestAnimationFrame))
  yield* call(BootSplash.hide, { fade: true })
  // on hide, we need to set the visibility to hidden
  yield* put(onSplashScreenHidden())
}
