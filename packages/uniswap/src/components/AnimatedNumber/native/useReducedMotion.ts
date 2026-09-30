import { useSyncExternalStore } from 'react'
import { AccessibilityInfo } from 'react-native'

type Listener = () => void

let reduceMotionEnabled = false
let nativeSubscription: ReturnType<typeof AccessibilityInfo.addEventListener> | undefined
const listeners = new Set<Listener>()

function updateReduceMotion(enabled: boolean): void {
  if (enabled === reduceMotionEnabled) {
    return
  }

  reduceMotionEnabled = enabled
  listeners.forEach((listener) => listener())
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)

  if (listeners.size === 1) {
    nativeSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', updateReduceMotion)
    void AccessibilityInfo.isReduceMotionEnabled().then(updateReduceMotion)
  }

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      nativeSubscription?.remove()
      nativeSubscription = undefined
    }
  }
}

function getSnapshot(): boolean {
  return reduceMotionEnabled
}

/**
 * One shared AccessibilityInfo subscription: a listener and async state per instance, times dozens
 * of list rows, is wasteful for a setting that effectively never changes.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
