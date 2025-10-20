import { PersistState } from 'redux-persist'
import { PreV16UserState } from 'state/migrations/oldTypes'

export type PersistAppStateV8 = {
  _persist: PersistState
} & { user?: PreV16UserState & { hideAppPromoBanner?: boolean } }

/**
 * Migration to delete unused hideAppPromoBanner redux state variable.
 */
export const migration8 = (state: PersistAppStateV8 | undefined) => {
  if (!state) {
    return state
  }

  if (state.user && 'hideAppPromoBanner' in state.user) {
    delete state.user.hideAppPromoBanner
  }

  return {
    ...state,
    _persist: {
      ...state._persist,
      version: 8,
    },
  }
}
