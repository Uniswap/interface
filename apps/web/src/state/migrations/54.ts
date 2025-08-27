import { PersistState } from 'redux-persist'
import { CurrencyIdToVisibility, PositionKeyToVisibility } from 'uniswap/src/features/visibility/slice'

type PersistAppStateV54 = {
  _persist: PersistState
  visibility?: {
    positions: PositionKeyToVisibility
    tokens: CurrencyIdToVisibility
  }
}

export const migration54 = (state: PersistAppStateV54 | undefined) => {
  if (!state) {
    return undefined
  }

  return {
    ...state,
    visibility: {
      tokens: state.visibility?.tokens ?? {},
      positions: state.visibility?.positions ?? {},
      nfts: {},
    },
    _persist: { ...state._persist, version: 54 },
  }
}
