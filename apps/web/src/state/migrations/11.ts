import { PersistState } from 'redux-persist'
import { PreV16UserState } from 'state/migrations/oldTypes'

type PersistAppStateV11 = {
  _persist: PersistState
} & { user?: PreV16UserState & { recentConnectionMeta?: undefined } }

/**
 * Migration fixing an edgecase missed in migration10: delete recentConnectionMeta key even when undefined recentConnectionMeta = undefined.
 */
export const migration11 = (state: PersistAppStateV11 | undefined) => {
  if (!state?.user) {
    return state
  }
  // Remove a previously-persisted variable
  delete state.user.recentConnectionMeta

  return { ...state, _persist: { ...state._persist, version: 11 } }
}
