import { PersistState } from 'redux-persist'
import { ListsState } from 'state/lists/reducer'

export type PersistAppStateV3 = {
  _persist: PersistState
} & { lists?: ListsState }

/**
 * Migration to clear users' cached redux lists state, after
 * breaking changes to token lists for multichain native USDC.
 */
export const migration3 = (state: PersistAppStateV3 | undefined) => {
  if (state?.lists) {
    return {
      ...state,
      lists: undefined,
      _persist: {
        ...state._persist,
        version: 3,
      },
    }
  }
  return state
}
