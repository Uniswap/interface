import BootSplash from 'react-native-bootsplash'
import { SagaIterator } from 'redux-saga'
import {
  hideSplashScreen as hideSplashScreenAction,
  selectSplashScreenIsHidden,
} from 'src/features/splashScreen/splashScreenSlice'
import { call, select, takeLatest } from 'typed-redux-saga'

//------------------------------
// SplashScreen saga
//------------------------------

export function* splashScreenSaga(): SagaIterator {
  if (yield* select(selectSplashScreenIsHidden)) {
    return
  }
  yield* takeLatest(hideSplashScreenAction.type, hideSplashScreen)
}

function* hideSplashScreen(): SagaIterator {
  // ensures smooth fade out
  yield* call(async () => new Promise(requestAnimationFrame))
  yield* call(BootSplash.hide, { fade: true })
}
