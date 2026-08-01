import { PersistState } from 'redux-persist'
import { removeUniswapWrapped2025BehaviorHistory } from 'uniswap/src/state/uniswapMigrations'

type PersistAppState = {
  _persist: PersistState
}

export const migration63 = (state: PersistAppState | undefined) => {
  if (!state) {
    return undefined
  }

  const newState = removeUniswapWrapped2025BehaviorHistory(state)

  return {
    ...newState,
    _persist: { ...state._persist, version: 63 },
  }
}
