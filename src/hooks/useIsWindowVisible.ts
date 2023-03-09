import { useCallback, useEffect, useState } from 'react'

function isVisibilityStateSupported() {
  return 'visibilityState' in document
}

function isWindowVisible() {
  return !isVisibilityStateSupported() || document.visibilityState !== 'hidden'
}

/**
 * Returns whether the window is currently visible to the user.
 */
export default function useIsWindowVisible(): boolean {
  const [focused, setFocused] = useState<boolean>(false)
  const listener = useCallback(() => {
    setFocused(isWindowVisible())
  }, [setFocused])

  useEffect(() => {
    if (!isVisibilityStateSupported()) return undefined
    setFocused(() => isWindowVisible())

    document.addEventListener('visibilitychange', listener)
    return () => {
      document.removeEventListener('visibilitychange', listener)
    }
  }, [listener])

  return focused
}
