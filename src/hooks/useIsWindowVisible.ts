import { useCallback, useEffect, useState } from 'react'

const VISIBILITY_STATE_SUPPORTED = 'visibilityState' in document

function isWindowVisible() {
  return !VISIBILITY_STATE_SUPPORTED || document.visibilityState !== 'hidden'
}

/**
 * Returns whether the window is currently visible to the user.
 */
export default function useIsWindowVisible(): boolean {
  const [focused, setFocused] = useState<boolean>(isWindowVisible())
  const listener = useCallback(() => {
    setFocused(isWindowVisible())
  }, [setFocused])

  useEffect(() => {
    if (!VISIBILITY_STATE_SUPPORTED) return

    document.addEventListener('visibilitychange', listener)
    return () => {
      document.removeEventListener('visibilitychange', listener)
    }
  }, [listener])

  return focused
}
