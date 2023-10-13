import { PersistState } from 'redux-persist'
import { RouterPreference } from 'state/routing/types'
import { UserState } from 'state/user/reducer'

export type PersistAppStateV2 = {
  _persist: PersistState
} & { user?: UserState }

/**
 * Migration to change the default user deadline from 30 minutes to 10 minutes.
 * We only migrate if the saved deadline is the old default.
 */
export const migration2 = (state: PersistAppStateV2 | undefined) => {
  // @ts-ignore this is intentionally a string and not the `RouterPreference` enum because `client` is a deprecated option
  if (state?.user && state.user?.userRouterPreference === 'client') {
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
