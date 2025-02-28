import { useDispatch } from 'react-redux'
import { setPreventLock } from 'src/features/lockScreen/lockScreenSlice'
import { waitFrame } from 'utilities/src/react/delayUtils'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Custom hook to prevent the app from entering a background state when calling a function.
 *
 * There are times when we call a function and sometimes the app will enter a background state, or on
 * android the app will enter an "inactive" state. This `preventLock` function will temporarily
 * prevent the app from locking if enabled (biometric auth app access)
 */
export function usePreventLock(): {
  preventLock: <T>(operation: () => Promise<T>) => Promise<T>
} {
  const dispatch = useDispatch()

  const preventLock = useEvent(async <T>(operation: () => Promise<T>): Promise<T> => {
    dispatch(setPreventLock(true))
    try {
      await waitFrame()
      return await operation()
    } finally {
      await waitFrame()
      // always reset preventLock to false
      dispatch(setPreventLock(false))
    }
  })

  return { preventLock }
}
