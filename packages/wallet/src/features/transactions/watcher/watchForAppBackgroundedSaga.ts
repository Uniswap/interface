import { AppState, AppStateStatus } from 'react-native'
import { EventChannel, eventChannel } from 'redux-saga'
import { call, SagaGenerator, take } from 'typed-redux-saga'

function createAppStateChannel(): EventChannel<AppStateStatus> {
  return eventChannel<AppStateStatus>((emit) => {
    const appStateListener = (state: AppStateStatus): void => {
      emit(state)
    }

    const subscription = AppState.addEventListener('change', appStateListener)

    return () => {
      subscription.remove()
    }
  })
}

/**
 * Watches for app state changes and emits true when the app is moved to the background.
 */
export function* watchForAppBackgrounded(): SagaGenerator<boolean> {
  const channel = yield* call(createAppStateChannel)
  let previousState: AppStateStatus = AppState.currentState

  try {
    while (true) {
      const nextState: AppStateStatus = yield* take(channel)
      // Check if moving to background
      if (previousState === 'active' && nextState.match(/inactive|background/)) {
        return true
      }
      previousState = nextState // Update previous state for the next check
    }
  } finally {
    channel.close()
  }
}
