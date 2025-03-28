import { Token } from '@uniswap/sdk-core'
import { PersistState } from 'redux-persist'
import { PreV16UserState } from 'state/migrations/oldTypes'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { serializeToken } from 'uniswap/src/utils/currency'

export type PersistAppStateV3 = {
  _persist: PersistState
} & { user?: PreV16UserState }

/**
 * Migration to clear users' imported token lists, after
 * breaking changes to token info for multichain native USDC.
 */
export const migration3 = (state: PersistAppStateV3 | undefined) => {
  if (state?.user) {
    // Update USDC.e tokens to use the the new USDC.e symbol (from USDC)
    const USDCe_ADDRESSES: { [key in UniverseChainId]?: string } = {}
    for (const [chainId, address] of Object.entries(USDCe_ADDRESSES)) {
      const chainIdKey = Number(chainId) as UniverseChainId
      if (state.user.tokens?.[chainIdKey]?.[address]) {
        state.user.tokens[chainIdKey][address] = serializeToken(
          new Token(chainIdKey, address, 6, 'USDC.e', 'Bridged USDC'),
        )
      }
    }
    return {
      ...state,
      _persist: {
        ...state._persist,
        version: 3,
      },
    }
  }
  return state
}
