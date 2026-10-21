import type { AnyAction, Middleware } from 'redux'
import { assertNoSecretsInPersistedSink } from 'utilities/src/security/persistedSinkTripwire'

/**
 * Sits first in the redux middleware chain so every dispatched action, including ones sagas emit, is
 * checked before it reaches a reducer or a telemetry enhancer. Redux state is covered transitively: a
 * value can only enter state through an action.
 */
export const persistedSinkTripwireMiddleware: Middleware = () => (next) => (action: unknown) => {
  const label =
    typeof action === 'object' && action !== null && 'type' in action ? String(action.type) : 'non-object action'
  assertNoSecretsInPersistedSink({ sink: 'redux action', value: action, label })
  // redux types `next` as Dispatch<AnyAction> although middleware sees every dispatched value, thunks included
  return next(action as AnyAction)
}
