import { PersistState } from 'redux-persist'
import { RouterPreference } from 'state/routing/types'
import { UserState } from 'state/user/reducer'

export type PersistAppStateV2 = {
  _persist: PersistState
} & { user?: UserState }

/**
 * Migration to move users who have local routing as their router preference to API
 * since forced local routing is now deprecated
 */
export const migration2 = (state: PersistAppStateV2 | undefined) => {
  // @ts-ignore this is intentionally a string and not the `RouterPreference` enum because `client` is a deprecated option
  if (state?.user && state.user.userRouterPreference === 'client') {
    return {
      ...state,
      user: {
        ...state.user,
        userRouterPreference: RouterPreference.API,
      },
      _persist: {
        ...state._persist,
        version: 2,
      },
    }
  }
  return state
}
