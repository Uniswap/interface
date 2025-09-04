import { AppState, AppStateStatus } from 'react-native'
import { EventChannel, eventChannel, SagaIterator } from 'redux-saga'
import { transitionAppState } from 'src/features/appState/appStateSlice'
import { cancelled, put, take } from 'typed-redux-saga'
import { isAndroid } from 'utilities/src/platform'

//------------------------------
// appStateSaga
//------------------------------

export function* appStateSaga(): SagaIterator {
  const appStateChannel: EventChannel<AppStateStatus> = eventChannel((emit) => {
    return appStateSubscription(emit)
  })

  try {
    while (true) {
      const nextAppState: AppStateStatus = yield* take(appStateChannel)
      yield* put(transitionAppState(nextAppState))
    }
  } finally {
    if (yield* cancelled()) {
      appStateChannel.close()
    }
  }
}

//------------------------------
// AppState subscription
//------------------------------

// TODO: disable until we can wrap anything that causes blur, eg: context menu, alert, etc.
const IS_ANDROID_SUBSCRIPTION_ENABLED = false

/**
 * Subscribes to app state changes and returns a function to unsubscribe
 * NB: We use blur and focus to replicate 'inactive' state on Android
 * @param onChange - Callback function to handle app state changes
 * @returns - Function to unsubscribe from the app state change listener
 */
function appStateSubscription(onChange: (value: AppStateStatus) => void): () => void {
  const subscription = AppState.addEventListener('change', (value: AppStateStatus) => {
    onChange(value)
  })

  // on Android we use blur and focus to replicate 'inactive' state which is only available on iOS
  // Inactive is when the user switches to another app, looks at notifications, etc.
  let blurSubscription: ReturnType<typeof AppState.addEventListener> | undefined
  let focusSubscription: ReturnType<typeof AppState.addEventListener> | undefined

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (isAndroid && IS_ANDROID_SUBSCRIPTION_ENABLED) {
    blurSubscription = AppState.addEventListener('blur', () => {
      onChange('inactive' as AppStateStatus)
    })

    focusSubscription = AppState.addEventListener('focus', () => {
      onChange(AppState.currentState)
    })
  }

  // cleanup
  return () => {
    subscription.remove()
    blurSubscription?.remove()
    focusSubscription?.remove()
  }
}
