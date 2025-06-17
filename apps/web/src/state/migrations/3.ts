/* eslint-disable @typescript-eslint/no-unnecessary-condition */
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
    const USDCe_ADDRESSES: { [key in UniverseChainId]?: string } = {
      [UniverseChainId.Optimism]: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
      [UniverseChainId.ArbitrumOne]: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      [UniverseChainId.Avalanche]: '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664',
      [UniverseChainId.Polygon]: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    }
    for (const [chainId, address] of Object.entries(USDCe_ADDRESSES)) {
      const chainIdKey = Number(chainId) as UniverseChainId
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (state.user.tokens?.[chainIdKey]?.[address]) {
        state.user.tokens[chainIdKey][address] = serializeToken(
          new Token(chainIdKey, address, 6, 'USDC.e', 'Bridged USDC'),
        )
      }
    }
    // Update USDbC token to use the new USDbC symbol (from USDC)
    const USDbC_BASE = new Token(
      UniverseChainId.Base,
      '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
      6,
      'USDbC',
      'USD Base Coin',
    )
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (state.user.tokens?.[UniverseChainId.Base]?.[USDbC_BASE.address]) {
      state.user.tokens[UniverseChainId.Base][USDbC_BASE.address] = serializeToken(USDbC_BASE)
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
