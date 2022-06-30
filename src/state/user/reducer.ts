import { INITIAL_ALLOWED_SLIPPAGE, DEFAULT_DEADLINE_FROM_NOW } from 'constants/index'
import { createReducer } from '@reduxjs/toolkit'
import { updateVersion } from '../global/actions'
import {
  addSerializedPair,
  addSerializedToken,
  removeSerializedPair,
  removeSerializedToken,
  SerializedPair,
  SerializedToken,
  updateMatchesDarkMode,
  updateUserDarkMode,
  updateUserExpertMode,
  updateUserLocale,
  updateUserSlippageTolerance,
  updateUserDeadline,
  toggleURLWarning,
  toggleRebrandingAnnouncement,
  toggleLiveChart,
  toggleTradeRoutes,
  toggleTokenInfo,
  toggleProLiveChart,
  toggleTopTrendingTokens,
} from './actions'
import { SupportedLocale } from 'constants/locales'
import { isMobile } from 'react-device-detect'
import { ChainId } from '@kyberswap/ks-sdk-core'
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
  URLWarningVisible: boolean
  rebrandingAnnouncement: boolean
  showLiveCharts: {
    [chainId: number]: boolean
  }
  showProLiveChart: boolean
  showTradeRoutes: boolean
  showTokenInfo: boolean
  showTopTrendingSoonTokens: boolean
}

function pairKey(token0Address: string, token1Address: string) {
  return `${token0Address};${token1Address}`
}

export const defaultShowLiveCharts: { [chainId in ChainId]: boolean } = {
  [ChainId.MAINNET]: isMobile ? false : true,
  [ChainId.MATIC]: isMobile ? false : true,
  [ChainId.BSCMAINNET]: isMobile ? false : true,
  [ChainId.CRONOS]: isMobile ? false : true,
  [ChainId.AVAXMAINNET]: isMobile ? false : true,
  [ChainId.FANTOM]: isMobile ? false : true,
  [ChainId.ARBITRUM]: isMobile ? false : true,
  [ChainId.AURORA]: isMobile ? false : true,
  [ChainId.BTTC]: false,
  [ChainId.VELAS]: isMobile ? false : true,
  [ChainId.OASIS]: isMobile ? false : true,
  [ChainId.OPTIMISM]: isMobile ? false : true,

  [ChainId.ROPSTEN]: false,
  [ChainId.RINKEBY]: false,
  [ChainId.GÖRLI]: false,
  [ChainId.KOVAN]: false,
  [ChainId.MUMBAI]: false,
  [ChainId.BSCTESTNET]: false,
  [ChainId.CRONOSTESTNET]: false,
  [ChainId.AVAXTESTNET]: false,
  [ChainId.ARBITRUM_TESTNET]: false,
}

export const initialState: UserState = {
  userDarkMode: true,
  matchesDarkMode: false,
  userExpertMode: false,
  userLocale: null,
  userSlippageTolerance: INITIAL_ALLOWED_SLIPPAGE,
  userDeadline: DEFAULT_DEADLINE_FROM_NOW,
  tokens: {},
  pairs: {},
  timestamp: currentTimestamp(),
  URLWarningVisible: true,
  rebrandingAnnouncement: true,
  showLiveCharts: defaultShowLiveCharts,
  showProLiveChart: true,
  showTradeRoutes: !isMobile,
  showTokenInfo: !isMobile,
  showTopTrendingSoonTokens: true,
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
    .addCase(toggleURLWarning, state => {
      state.URLWarningVisible = !state.URLWarningVisible
    })
    .addCase(toggleRebrandingAnnouncement, state => {
      state.rebrandingAnnouncement = !state.rebrandingAnnouncement
    })
    .addCase(toggleLiveChart, (state, { payload: { chainId } }) => {
      if (typeof state.showLiveCharts?.[chainId] !== 'boolean') {
        state.showLiveCharts = defaultShowLiveCharts
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
    }),
)
