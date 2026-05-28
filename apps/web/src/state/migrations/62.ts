import { PersistState } from 'redux-persist'
import { addEnableCustomGasFeeEntry } from 'uniswap/src/state/uniswapMigrations'

type PersistAppState = {
  _persist: PersistState
}

export const migration62 = (state: PersistAppState | undefined) => {
  if (!state) {
    return undefined
  }

  const newState = addEnableCustomGasFeeEntry(state)

  return {
    ...newState,
    _persist: { ...state._persist, version: 62 },
  }
}
