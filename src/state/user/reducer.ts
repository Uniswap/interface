import { ChainId } from '@kyberswap/ks-sdk-core'
import { createReducer } from '@reduxjs/toolkit'
import { isMobile } from 'react-device-detect'

import { DEFAULT_DEADLINE_FROM_NOW, INITIAL_ALLOWED_SLIPPAGE } from 'constants/index'
import { SupportedLocale } from 'constants/locales'

import { updateVersion } from '../global/actions'
import {
  SerializedPair,
  SerializedToken,
  addSerializedPair,
  addSerializedToken,
  removeSerializedPair,
  removeSerializedToken,
  toggleFavoriteToken,
  toggleLiveChart,
  toggleProLiveChart,
  toggleTokenInfo,
  toggleTopTrendingTokens,
  toggleTradeRoutes,
  updateMatchesDarkMode,
  updateUserDarkMode,
  updateUserDeadline,
  updateUserExpertMode,
  updateUserLocale,
  updateUserSlippageTolerance,
} from './actions'

const currentTimestamp = () => new Date().getTime()

export interface UserState {
  // the timestamp of the last updateVersion action
  lastUpdateVersionTimestamp?: number

  userDarkMode: boolean | null // the user's choice for dark mode or light mode
  matchesDarkMode: boolean // whether the dark mode media query matches

  userLocale: SupportedLocale | null

  userExpertMode: boolean

  // user defined slippage tolerance in bips, used in all txns
  userSlippageTolerance: number

  // deadline set by user in minutes, used in all txns
  userDeadline: number

  tokens: {
    [chainId: number]: {
      [address: string]: SerializedToken
    }
  }

  pairs: {
    [chainId: number]: {
      // keyed by token0Address:token1Address
      [key: string]: SerializedPair
    }
  }

  timestamp: number
  showLiveCharts: {
    [chainId: number]: boolean
  }
  showProLiveChart: boolean
  showTradeRoutes: boolean
  showTokenInfo: boolean
  showTopTrendingSoonTokens: boolean

  favoriteTokensByChainId: Partial<
    Record<
      ChainId,
      {
        includeNativeToken: boolean
        addresses: string[]
      }
    >
  >
}

function pairKey(token0Address: string, token1Address: string) {
  return `${token0Address};${token1Address}`
}

export const defaultShowLiveCharts: { [chainId in ChainId]: boolean } = {
  [ChainId.MAINNET]: true,
  [ChainId.MATIC]: true,
  [ChainId.BSCMAINNET]: true,
  [ChainId.CRONOS]: true,
  [ChainId.AVAXMAINNET]: true,
  [ChainId.FANTOM]: true,
  [ChainId.ARBITRUM]: true,
  [ChainId.AURORA]: true,
  [ChainId.BTTC]: false,
  [ChainId.VELAS]: true,
  [ChainId.OASIS]: true,
  [ChainId.OPTIMISM]: true,

  [ChainId.ROPSTEN]: false,
  [ChainId.RINKEBY]: false,
  [ChainId.GÖRLI]: false,
  [ChainId.KOVAN]: false,
  [ChainId.MUMBAI]: false,
  [ChainId.BSCTESTNET]: false,
  [ChainId.CRONOSTESTNET]: false,
  [ChainId.AVAXTESTNET]: false,
  [ChainId.ARBITRUM_TESTNET]: false,
  [ChainId.ETHW]: false,
}

export const initialState: UserState = {
  userDarkMode: null, // default to system preference
  matchesDarkMode: false,
  userExpertMode: false,
  userLocale: null,
  userSlippageTolerance: INITIAL_ALLOWED_SLIPPAGE,
  userDeadline: DEFAULT_DEADLINE_FROM_NOW,
  tokens: {},
  pairs: {},
  timestamp: currentTimestamp(),
  showLiveCharts: { ...defaultShowLiveCharts },
  showProLiveChart: !isMobile,
  showTradeRoutes: true,
  showTokenInfo: true,
  showTopTrendingSoonTokens: true,
  favoriteTokensByChainId: {},
}

export default createReducer(initialState, builder =>
  builder
    .addCase(updateVersion, state => {
      // slippage isnt being tracked in local storage, reset to default
      // noinspection SuspiciousTypeOfGuard
      if (typeof state.userSlippageTolerance !== 'number') {
        state.userSlippageTolerance = INITIAL_ALLOWED_SLIPPAGE
      }

      // deadline isnt being tracked in local storage, reset to default
      // noinspection SuspiciousTypeOfGuard
      if (typeof state.userDeadline !== 'number') {
        state.userDeadline = DEFAULT_DEADLINE_FROM_NOW
      }

      state.lastUpdateVersionTimestamp = currentTimestamp()
    })
    .addCase(updateUserDarkMode, (state, action) => {
      state.userDarkMode = action.payload.userDarkMode
      state.timestamp = currentTimestamp()
    })
    .addCase(updateMatchesDarkMode, (state, action) => {
      state.matchesDarkMode = action.payload.matchesDarkMode
      state.timestamp = currentTimestamp()
    })
    .addCase(updateUserExpertMode, (state, action) => {
      state.userExpertMode = action.payload.userExpertMode
      state.timestamp = currentTimestamp()
    })
    .addCase(updateUserLocale, (state, action) => {
      state.userLocale = action.payload.userLocale
      state.timestamp = currentTimestamp()
    })
    .addCase(updateUserSlippageTolerance, (state, action) => {
      state.userSlippageTolerance = action.payload.userSlippageTolerance
      state.timestamp = currentTimestamp()
    })
    .addCase(updateUserDeadline, (state, action) => {
      state.userDeadline = action.payload.userDeadline
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
    .addCase(toggleLiveChart, (state, { payload: { chainId } }) => {
      if (typeof state.showLiveCharts?.[chainId] !== 'boolean') {
        state.showLiveCharts = { ...defaultShowLiveCharts }
      }
      state.showLiveCharts[chainId] = !state.showLiveCharts[chainId]
    })
    .addCase(toggleProLiveChart, state => {
      state.showProLiveChart = !state.showProLiveChart
    })
    .addCase(toggleTradeRoutes, state => {
      state.showTradeRoutes = !state.showTradeRoutes
    })
    .addCase(toggleTokenInfo, state => {
      state.showTokenInfo = !state.showTokenInfo
    })
    .addCase(toggleTopTrendingTokens, state => {
      state.showTopTrendingSoonTokens = !state.showTopTrendingSoonTokens
    })
    .addCase(toggleFavoriteToken, (state, { payload: { chainId, isNative, address } }) => {
      if (!state.favoriteTokensByChainId) {
        state.favoriteTokensByChainId = {}
      }

      let favoriteTokens = state.favoriteTokensByChainId[chainId]
      if (!favoriteTokens) {
        favoriteTokens = {
          includeNativeToken: false,
          addresses: [],
        }
        state.favoriteTokensByChainId[chainId] = favoriteTokens
      }

      if (isNative) {
        const previousValue = favoriteTokens.includeNativeToken
        favoriteTokens.includeNativeToken = !previousValue
        return
      }

      if (address) {
        // this is intentionally added, to remove compiler error
        const index = favoriteTokens.addresses.findIndex(addr => addr === address)
        if (index === -1) {
          favoriteTokens.addresses.push(address)
          return
        }
        favoriteTokens.addresses.splice(index, 1)
      }
    }),
)
