import { PersistState } from 'redux-persist'
import { UserState } from 'state/user/reducer'

type PersistAppStateV11 = {
  _persist: PersistState
} & { user?: UserState & { recentConnectionMeta?: undefined } }

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
