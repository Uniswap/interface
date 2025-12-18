import { PersistState } from 'redux-persist'
import { TokensState } from 'uniswap/src/features/tokens/warnings/slice/slice'

type PersistAppState = {
  _persist: PersistState
  tokens?: TokensState
}
export const migration57 = (state: PersistAppState | undefined) => {
  if (!state) {
    return undefined
  }
  return {
    ...state,
    tokens: {
      ...state.tokens,
      dismissedBridgedAssetWarnings: state.tokens?.dismissedBridgedAssetWarnings ?? {},
      dismissedCompatibleAddressWarnings: state.tokens?.dismissedCompatibleAddressWarnings ?? {},
    },
    _persist: { ...state._persist, version: 57 },
  }
}
