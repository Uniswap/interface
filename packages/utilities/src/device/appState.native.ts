import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'

export function useOnMobileAppState(expectedAppState: AppStateStatus, callback: () => void): void {
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (expectedAppState === nextAppState) {
        callback()
      }

      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [callback, expectedAppState])
}
