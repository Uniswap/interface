// Shares similarities with https://github.com/Uniswap/interface/blob/main/src/state/user/reducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DEFAULT_WATCHED_TOKENS } from 'src/constants/watchedTokens'
import { SerializedPair, SerializedToken } from 'src/features/tokenLists/types'

interface Tokens {
  watchedTokens: {
    [chainId: number]: {
      [address: Address]: boolean
    }
  }
  customTokens: {
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
  watchedTokens: DEFAULT_WATCHED_TOKENS,
  customTokens: {},
  tokenPairs: {},
}

const slice = createSlice({
  name: 'tokens',
  initialState,
  reducers: {
    addWatchedToken: (state, action: PayloadAction<{ address: Address; chainId: number }>) => {
      const { chainId, address } = action.payload
      state.watchedTokens[chainId] ||= {}
      state.watchedTokens[chainId][address] = true
    },
    removeWatchedToken: (state, action: PayloadAction<{ address: Address; chainId: number }>) => {
      const { address, chainId } = action.payload
      if (!state.watchedTokens[chainId] || !!state.watchedTokens[chainId][address]) return
      delete state.watchedTokens[chainId][address]
    },
    addCustomToken: (state, action: PayloadAction<SerializedToken>) => {
      const newToken = action.payload
      state.customTokens[newToken.chainId] ||= {}
      state.customTokens[newToken.chainId][newToken.address] = newToken
    },
    removeCustomToken: (state, action: PayloadAction<{ address: Address; chainId: number }>) => {
      const { address, chainId } = action.payload
      if (!state.customTokens[chainId] || !!state.customTokens[chainId][address]) return
      delete state.customTokens[chainId][address]
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
      if (!state.customTokens[chainId]) return
      delete state.customTokens[chainId][pairKey(token1Address, token2Address)]
      delete state.customTokens[chainId][pairKey(token2Address, token1Address)]
    },
    resetTokens: () => initialState,
  },
})

export const {
  addWatchedToken,
  removeWatchedToken,
  addCustomToken,
  removeCustomToken,
  addTokenPair,
  removeTokenPair,
  resetTokens,
} = slice.actions

export const tokensReducer = slice.reducer

function pairKey(token0Address: Address, token1Address: Address) {
  return `${token0Address};${token1Address}`
}
