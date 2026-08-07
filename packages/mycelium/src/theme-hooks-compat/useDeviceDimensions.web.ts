/**
 * Web leg of the `useDeviceDimensions` compat
 * (`ui/src/hooks/useDeviceDimensions`): the window's inner dimensions, live
 * across resizes. Web app only — the reference's extension branch (sizing via
 * react-native `useWindowDimensions`) is out of scope for INFRA-2952, so
 * extension contexts fail loudly like the native stubs.
 */
import { useSyncExternalStore } from 'react'
import type { DeviceDimensions } from './useDeviceDimensions'

function assertNotExtensionRuntime(): void {
  // chrome-extension:, moz-extension:, safari-web-extension:
  if (typeof window !== 'undefined' && window.location.protocol.endsWith('extension:')) {
    throw new Error('useDeviceDimensions (theme-hooks compat): extension leg is out of scope, see INFRA-2952')
  }
}

const SERVER_DIMENSIONS: DeviceDimensions = { fullHeight: 0, fullWidth: 0 }

const subscribers = new Set<() => void>()
let listening = false
let snapshot: DeviceDimensions | undefined

function invalidate(): void {
  const next: DeviceDimensions = { fullHeight: window.innerHeight, fullWidth: window.innerWidth }
  if (snapshot === undefined || snapshot.fullHeight !== next.fullHeight || snapshot.fullWidth !== next.fullWidth) {
    snapshot = next
  }
  for (const notify of subscribers) {
    notify()
  }
}

function subscribeToDimensions(onChange: () => void): () => void {
  if (!listening) {
    listening = true
    window.addEventListener('resize', invalidate)
  }
  subscribers.add(onChange)
  return () => {
    subscribers.delete(onChange)
  }
}

function getDimensionsSnapshot(): DeviceDimensions {
  snapshot ??= { fullHeight: window.innerHeight, fullWidth: window.innerWidth }
  return snapshot
}

function getServerDimensionsSnapshot(): DeviceDimensions {
  return SERVER_DIMENSIONS
}

export function useDeviceDimensions(): DeviceDimensions {
  assertNotExtensionRuntime()
  return useSyncExternalStore(subscribeToDimensions, getDimensionsSnapshot, getServerDimensionsSnapshot)
}
