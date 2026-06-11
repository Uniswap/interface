import { provideSession } from '@universe/api/src/session/provideSession'
import type { Session } from '@universe/sessions'
import { useSyncExternalStore } from 'react'

export const useSession = (): Session => provideSession()

// Module-level so `useSyncExternalStore` sees stable refs and doesn't resubscribe
// on every render. `provideSession()` is a singleton accessor, so these are safe
// to hoist out of the hook body.
const subscribeReady = (onStoreChange: () => void): (() => void) => provideSession().subscribe(onStoreChange)
const getReadySnapshot = (): boolean => provideSession().getState() === 'ready'

/** Subscribes to readiness. Use as `enabled` for session-dependent React Query calls. */
export const useSessionReady = (): boolean => useSyncExternalStore(subscribeReady, getReadySnapshot, getReadySnapshot)
