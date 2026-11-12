import { PersistState } from 'redux-persist'
import { addNewUserOnboardingHistory } from 'uniswap/src/state/uniswapMigrations'

type PersistAppState = {
  _persist: PersistState
}

export const migration66 = (state: PersistAppState | undefined) => {
  if (!state) {
    return undefined
  }

  const newState = addNewUserOnboardingHistory(state)

  return {
    ...newState,
    _persist: { ...state._persist, version: 66 },
  }
}
