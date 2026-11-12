import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void): () => void {
  if (typeof document === 'undefined') {
    return () => {}
  }
  document.addEventListener('visibilitychange', onChange)
  return () => document.removeEventListener('visibilitychange', onChange)
}

function getSnapshot(): boolean {
  return typeof document === 'undefined' || document.visibilityState !== 'hidden'
}

// A server render has no tab to hide, so it assumes visible.
function getServerSnapshot(): boolean {
  return true
}

/**
 * Returns whether the window/document is currently visible to the user.
 * Useful for pausing expensive operations (like animations) when the tab is in the background.
 */
export function useIsWindowVisible(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
