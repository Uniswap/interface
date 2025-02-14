import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { hideSplashScreen } from 'src/features/splashScreen/splashScreenSlice'

/**
 * Custom wrapped function to hide the splash screen.
 * We need this so that we can hide any errors that may occur (e.g. unhandled promise rejection when FaceID is unlocking)
 */
export function useHideSplashScreen(): () => void {
  const dispatch = useDispatch()

  return useCallback(() => {
    dispatch(hideSplashScreen())
  }, [dispatch])
}
