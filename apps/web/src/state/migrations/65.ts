import { PersistState } from 'redux-persist'
import { removeBlastChainData } from 'uniswap/src/state/uniswapMigrations'

type PersistAppState = {
  _persist: PersistState
}

export const migration65 = (state: PersistAppState | undefined) => {
  if (!state) {
    return undefined
  }

  const newState = removeBlastChainData(state)

  return {
    ...newState,
    _persist: { ...state._persist, version: 65 },
  }
}
