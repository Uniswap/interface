import { useSyncExternalStore } from 'react'

function subscribe(cb: () => void): () => void {
  document.addEventListener('visibilitychange', cb)
  return () => document.removeEventListener('visibilitychange', cb)
}

function getSnapshot(): boolean {
  return document.visibilityState === 'visible'
}

function getServerSnapshot(): boolean {
  return true
}

export function usePageVisibility(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
