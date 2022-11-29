import { ChainId } from '@kyberswap/ks-sdk-core'
import { createReducer } from '@reduxjs/toolkit'

import { SUPPORTED_NETWORKS } from 'constants/networks'
import { TokenMap } from 'hooks/Tokens'

import { setTokenList } from './actions'
import { WrappedTokenInfo } from './wrappedTokenInfo'

export type TokenAddressMap = {
  [chainId in ChainId | number]: { [tokenAddress: string]: WrappedTokenInfo }
}
interface ListsState {
  readonly mapWhitelistTokens: TokenAddressMap
}

const initialState: ListsState = {
  mapWhitelistTokens: {
    ...SUPPORTED_NETWORKS.reduce((memo: ListsState['mapWhitelistTokens'], chainId: ChainId | number) => {
      if (chainId) memo[chainId] = {} as TokenMap
      return memo
    }, {}),
  },
}

export default createReducer(initialState, builder =>
  builder.addCase(setTokenList, (state, { payload: { tokenList, chainId } }) => {
    if (!state.mapWhitelistTokens) state.mapWhitelistTokens = {}
    state.mapWhitelistTokens[chainId] = tokenList || {}
  }),
)
