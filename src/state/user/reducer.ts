import { createReducer } from '@reduxjs/toolkit'
import { ChainId, WETH } from '@uniswap/sdk'
import {
  addSerializedPair,
  addSerializedToken,
  dismissTokenWarning,
  removeSerializedPair,
  removeSerializedToken,
  SerializedPair,
  SerializedToken,
  updateMatchesDarkMode,
  updateUserDarkMode,
  updateVersion
} from './actions'

const currentTimestamp = () => new Date().getTime()

interface UserState {
  lastVersion: string

  userDarkMode: boolean | null // the user's choice for dark mode or light mode
  matchesDarkMode: boolean // whether the dark mode media query matches

  tokens: {
    [chainId: number]: {
      [address: string]: SerializedToken
    }
  }

  // the token warnings that the user has dismissed
  dismissedTokenWarnings?: {
    [chainId: number]: {
      [tokenAddress: string]: true
    }
  }

  pairs: {
    [chainId: number]: {
      // keyed by token0Address:token1Address
      [key: string]: SerializedPair
    }
  }

  timestamp: number
}

function pairKey(token0Address: string, token1Address: string) {
  return `${token0Address};${token1Address}`
}

const initialState: UserState = {
  lastVersion: '',

  userDarkMode: null,
  matchesDarkMode: false,

  tokens: {},
  pairs: {},

  timestamp: currentTimestamp()
}

const GIT_COMMIT_HASH: string | undefined = process.env.REACT_APP_GIT_COMMIT_HASH

export default createReducer(initialState, builder =>
  builder
    .addCase(updateVersion, state => {
      if (GIT_COMMIT_HASH && state.lastVersion !== GIT_COMMIT_HASH) {
        state.lastVersion = GIT_COMMIT_HASH

        // Wed May 20, 2020 @ ~9pm central
        if (state.timestamp < 1590027589111) {
          // this should remove the user added token from 'eth' for mainnet
          if (state.tokens[ChainId.MAINNET]) {
            delete state.tokens[ChainId.MAINNET][WETH[ChainId.MAINNET].address]
          }
        }
      }
      state.timestamp = currentTimestamp()
    })
    .addCase(updateUserDarkMode, (state, action) => {
      state.userDarkMode = action.payload.userDarkMode
      state.timestamp = currentTimestamp()
    })
    .addCase(updateMatchesDarkMode, (state, action) => {
      state.matchesDarkMode = action.payload.matchesDarkMode
      state.timestamp = currentTimestamp()
    })
    .addCase(addSerializedToken, (state, { payload: { serializedToken } }) => {
      state.tokens[serializedToken.chainId] = state.tokens[serializedToken.chainId] || {}
      state.tokens[serializedToken.chainId][serializedToken.address] = serializedToken
      state.timestamp = currentTimestamp()
    })
    .addCase(removeSerializedToken, (state, { payload: { address, chainId } }) => {
      state.tokens[chainId] = state.tokens[chainId] || {}
      delete state.tokens[chainId][address]
      state.timestamp = currentTimestamp()
    })
    .addCase(dismissTokenWarning, (state, { payload: { chainId, tokenAddress } }) => {
      state.dismissedTokenWarnings = state.dismissedTokenWarnings ?? {}
      state.dismissedTokenWarnings[chainId] = state.dismissedTokenWarnings[chainId] ?? {}
      state.dismissedTokenWarnings[chainId][tokenAddress] = true
    })
    .addCase(addSerializedPair, (state, { payload: { serializedPair } }) => {
      if (
        serializedPair.token0.chainId === serializedPair.token1.chainId &&
        serializedPair.token0.address !== serializedPair.token1.address
      ) {
        const chainId = serializedPair.token0.chainId
        state.pairs[chainId] = state.pairs[chainId] || {}
        state.pairs[chainId][pairKey(serializedPair.token0.address, serializedPair.token1.address)] = serializedPair
      }
      state.timestamp = currentTimestamp()
    })
    .addCase(removeSerializedPair, (state, { payload: { chainId, tokenAAddress, tokenBAddress } }) => {
      if (state.pairs[chainId]) {
        // just delete both keys if either exists
        delete state.pairs[chainId][pairKey(tokenAAddress, tokenBAddress)]
        delete state.pairs[chainId][pairKey(tokenBAddress, tokenAAddress)]
      }
      state.timestamp = currentTimestamp()
    })
)
