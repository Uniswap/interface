import { useCallback, useEffect, useState } from 'react'

function isVisibilityStateSupported(): boolean {
  return typeof document !== 'undefined' && 'visibilityState' in document
}

function isWindowVisible(): boolean {
  return !isVisibilityStateSupported() || document.visibilityState !== 'hidden'
}

/**
 * Returns whether the window/document is currently visible to the user.
 * Useful for pausing expensive operations (like animations) when the tab is in the background.
 */
export function useIsWindowVisible(): boolean {
  const [visible, setVisible] = useState(isWindowVisible)

  const listener = useCallback(() => {
    setVisible(isWindowVisible())
  }, [])

  useEffect(() => {
    if (!isVisibilityStateSupported()) {
      return undefined
    }

    document.addEventListener('visibilitychange', listener)
    return () => {
      document.removeEventListener('visibilitychange', listener)
    }
  }, [listener])

  return visible
}
