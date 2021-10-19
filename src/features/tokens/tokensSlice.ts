// Shares similarities with https://github.com/Uniswap/interface/blob/main/src/state/user/reducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SerializedPair, SerializedToken } from 'src/features/tokenLists/types'

interface Tokens {
  tokens: {
    [chainId: number]: {
      [address: Address]: SerializedToken
    }
  }
  tokenPairs: {
    [chainId: number]: {
      // keyed by token0Address:token1Address
      [key: string]: SerializedPair
    }
  }
}

const initialState: Tokens = {
  tokens: {},
  tokenPairs: {},
}

const slice = createSlice({
  name: 'tokens',
  initialState,
  reducers: {
    addToken: (state, action: PayloadAction<SerializedToken>) => {
      const newToken = action.payload
      state.tokens[newToken.chainId] ||= {}
      state.tokens[newToken.chainId][newToken.address] = newToken
    },
    removeToken: (state, action: PayloadAction<{ address: Address; chainId: number }>) => {
      const { address, chainId } = action.payload
      if (!state.tokens[chainId] || !!state.tokens[chainId][address]) return
      delete state.tokens[chainId][address]
    },
    addTokenPair: (state, action: PayloadAction<SerializedPair>) => {
      const newPair = action.payload
      if (
        newPair.token0.chainId !== newPair.token1.chainId ||
        newPair.token0.address === newPair.token1.address
      )
        return
      const chainId = newPair.token0.chainId
      state.tokenPairs[chainId] ||= {}
      state.tokenPairs[chainId][pairKey(newPair.token0.address, newPair.token1.address)] = newPair
    },
    removeTokenPair: (
      state,
      action: PayloadAction<{ chainId: number; token1Address: Address; token2Address: Address }>
    ) => {
      const { chainId, token1Address, token2Address } = action.payload
      if (!state.tokens[chainId]) return
      delete state.tokens[chainId][pairKey(token1Address, token2Address)]
      delete state.tokens[chainId][pairKey(token2Address, token1Address)]
    },
    resetTokens: () => initialState,
  },
})

export const { addToken, removeToken, addTokenPair, removeTokenPair, resetTokens } = slice.actions

export const tokensReducer = slice.reducer

function pairKey(token0Address: Address, token1Address: Address) {
  return `${token0Address};${token1Address}`
}
