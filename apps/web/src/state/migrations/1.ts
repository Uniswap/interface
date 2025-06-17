import { DEFAULT_DEADLINE_FROM_NOW } from 'constants/misc'
import { PersistState } from 'redux-persist'
import { PreV16UserState } from 'state/migrations/oldTypes'

export type PersistAppStateV1 = {
  _persist: PersistState
} & { user?: PreV16UserState }

/**
 * Migration to change the default user deadline from 30 minutes to 10 minutes.
 * We only migrate if the saved deadline is the old default.
 */
export const migration1 = (state: PersistAppStateV1 | undefined) => {
  if (state?.user && state.user.userDeadline === 1800) {
    return {
      ...state,
      user: {
        ...state.user,
        userDeadline: DEFAULT_DEADLINE_FROM_NOW,
      },
      _persist: {
        ...state._persist,
        version: 1,
      },
    }
  }
  return state
}
