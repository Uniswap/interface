import { PersistState } from 'redux-persist'
import { VisibilityState } from 'uniswap/src/features/visibility/slice'
import { addActivityVisibility } from 'uniswap/src/state/uniswapMigrations'

type PersistAppState = {
  _persist: PersistState
  visibility?: Omit<VisibilityState, 'activity'>
}
export const migration59 = (state: PersistAppState | undefined) => {
  if (!state) {
    return undefined
  }

  const newState = addActivityVisibility(state)

  return {
    ...newState,
    _persist: { ...state._persist, version: 59 },
  }
}
