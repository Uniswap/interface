import { useEffect, useMemo } from 'react'
import type { AppStateStatus } from 'react-native'
import { useSelector } from 'react-redux'
import type { AppStateState } from 'src/features/appState/appStateSlice'
import { selectCurrentAppState, selectPreviousAppState } from 'src/features/appState/appStateSlice'
import { useEvent } from 'utilities/src/react/hooks'

type AppStateTransition = { from: AppStateStatus; to: AppStateStatus }

/** Invokes `callback` when app state goes from `from` to `to`. */
export function useAppStateTrigger({
  from,
  to,
  callback,
}: {
  from: AppStateStatus
  to: AppStateStatus
  callback: () => void
}): void {
  const transitions = useMemo(() => [{ from, to }], [from, to])

  useAppStateTransitionTrigger(transitions, callback)
}

/**
 * Hook that triggers a callback when app state transitions between specified states
 * @param transitions - Array of state transitions to watch for
 * @param callback - Function to execute when any of the transitions occur
 * @example
 * ```ts
 * useAppStateTransitionTrigger([
 *   { from: 'background', to: 'active' },
 *   { from: 'inactive', to: 'active' }
 * ], () => {
 *   // Called when app becomes active from either background or inactive
 *   refreshData()
 * })
 * ```
 */
function useAppStateTransitionTrigger(transitions: AppStateTransition[], callback: () => void): void {
  const onTransition = useEvent(callback)
  const shouldTrigger = useSelector(makeTransitionsSelector(transitions))

  useEffect(() => {
    if (shouldTrigger) {
      onTransition()
    }
  }, [shouldTrigger, onTransition])
}

function makeTransitionsSelector(transitions: AppStateTransition[]): (state: { appState: AppStateState }) => boolean {
  return (state: { appState: AppStateState }) => {
    const current = selectCurrentAppState(state)
    const previous = selectPreviousAppState(state)
    return transitions.some(({ from, to }) => current === to && previous === from)
  }
}
