import { PersistState } from 'redux-persist'
import { CurrencyIdToVisibility, PositionKeyToVisibility } from 'uniswap/src/features/visibility/slice'

type PersistAppStateV23 = {
  _persist: PersistState
  visibility?: {
    tokens?: CurrencyIdToVisibility
    positions?: PositionKeyToVisibility
  }
}

/**
 * Migration 23: Ensure visibility.tokens exists in state persistence
 */
export const migration23 = (state: PersistAppStateV23 | undefined) => {
  if (!state) {
    return undefined
  }

  return {
    ...state,
    visibility: {
      ...state.visibility,
      tokens: state.visibility?.tokens ?? {}, // Ensure tokens property exists
      positions: state.visibility?.positions ?? {}, // Ensure positions property exists
    },
    _persist: { ...state._persist, version: 23 },
  }
}
