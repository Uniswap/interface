import { PersistState } from 'redux-persist'
import { migrateDismissedTokenWarnings } from 'uniswap/src/state/uniswapMigrations'

type PersistAppState = {
  _persist: PersistState
}

export const migration60 = (state: PersistAppState | undefined) => {
  if (!state) {
    return undefined
  }

  const newState = migrateDismissedTokenWarnings(state)

  return {
    ...newState,
    _persist: { ...state._persist, version: 60 },
  }
}
