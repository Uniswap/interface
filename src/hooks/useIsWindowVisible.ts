import { useCallback, useEffect, useState } from 'react'

/**
 * Returns whether the window is currently visible to the user.
 */
export default function useIsWindowVisible(): boolean {
  const [focused, setFocused] = useState<boolean>(true)
  const listener = useCallback(() => {
    setFocused(document.visibilityState !== 'hidden')
  }, [setFocused])

  useEffect(() => {
    document.addEventListener('visibilitychange', listener)
    return () => {
      document.removeEventListener('visibilitychange', listener)
    }
  }, [listener])

  return focused
}
