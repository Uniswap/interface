import { PersistState } from 'redux-persist'
import { UserState } from 'state/user/reducer'

export type PersistAppStateV10 = {
  _persist: PersistState
} & { user?: UserState & { recentConnectionMeta?: any } }

/**
 * Migration to remove recentConnectionMeta from state after wagmi migration made it redundant.
 *
 * Note: an edgecase was missed in this migration, which is fixed in migration11.
 */
export const migration10 = (state: PersistAppStateV10 | undefined) => {
  if (!state?.user?.recentConnectionMeta) {
    return state
  }
  // Remove a previously-persisted variable
  delete state.user.recentConnectionMeta

  return { ...state, _persist: { ...state._persist, version: 10 } }
}
