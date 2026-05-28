import { PersistState } from 'redux-persist'
import { TokensState } from 'uniswap/src/features/tokens/slice/slice'
import { unchecksumDismissedTokenWarningKeys } from 'uniswap/src/state/uniswapMigrations'

export type PersistAppStateV21 = {
  _persist: PersistState
  tokens?: TokensState
}

export const migration21 = (state: PersistAppStateV21 | undefined) => {
  if (!state) {
    return undefined
  }
  return {
    ...unchecksumDismissedTokenWarningKeys(state),
    _persist: { ...state._persist, version: 21 },
  }
}
