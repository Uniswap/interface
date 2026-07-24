import { useSyncExternalStore } from 'react'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

let now = Date.now()
const listeners = new Set<() => void>()
let intervalId: ReturnType<typeof setInterval> | undefined

function ensureInterval(): void {
  if (intervalId !== undefined) {
    return
  }
  intervalId = setInterval(() => {
    now = Date.now()
    listeners.forEach((listener) => listener())
  }, ONE_SECOND_MS)
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  ensureInterval()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && intervalId !== undefined) {
      clearInterval(intervalId)
      intervalId = undefined
    }
  }
}

function getSnapshot(): number {
  return now
}

/**
 * One shared 1s clock backing every subscriber, so all timestamp cells tick on the exact
 * same interval callback instead of drifting apart from independent per-row timers.
 */
export function useSyncedNowMs(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
