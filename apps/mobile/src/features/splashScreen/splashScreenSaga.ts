import BootSplash from 'react-native-bootsplash'
import { SagaIterator } from 'redux-saga'
import {
  hideSplashScreen as hideSplashScreenAction,
  selectSplashScreenIsHidden,
} from 'src/features/splashScreen/splashScreenSlice'
import { call, select, take } from 'typed-redux-saga'

//------------------------------
// SplashScreen saga
//------------------------------

export function* splashScreenSaga(): SagaIterator {
  if (yield* select(selectSplashScreenIsHidden)) {
    return
  }
  // Take the first hide request only (deduplicates multiple requests)
  yield* take(hideSplashScreenAction.type)
  yield* call(hideSplashScreen)
}

function* hideSplashScreen(): SagaIterator {
  // ensures smooth fade out
  yield* call(async () => new Promise(requestAnimationFrame))
  yield* call(BootSplash.hide, { fade: true })
}
