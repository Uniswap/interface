import { PersistState } from 'redux-persist'
import { TokensState } from 'uniswap/src/features/tokens/warnings/slice/slice'
import { SerializedTokenMap, TokenDismissInfo } from 'uniswap/src/features/tokens/warnings/slice/types'

export type PersistAppStateV16 = {
  _persist: PersistState
  user?: {
    tokens: SerializedTokenMap<TokenDismissInfo>
  }
  tokens?: TokensState
}

/**
 * Move web dismissed token state to shared slice
 */
export const migration16 = (state: PersistAppStateV16 | undefined) => {
  if (!state) {
    return undefined
  }

  const newState: any = { ...state }

  // move existing tokens slice to shared slice value
  newState.tokens = {
    dismissedTokenWarnings: state.user?.tokens ?? {},
  }

  // remove old tokens slice
  delete newState.user.tokens

  return { ...newState, _persist: { ...state._persist, version: 16 } }
}
