import {
  SerializedPair,
  SerializedToken,
  addSerializedPair,
  addSerializedToken,
  removeSerializedPair,
  removeSerializedToken,
  updateArbitrumAlphaAcknowledged,
  updateFavoritedTokens,
  updateHideClosedPositions,
  updateMatchesDarkMode,
  updateUseAutoSlippage,
  updateUserChartHistory,
  updateUserDarkMode,
  updateUserDeadline,
  updateUserDetectRenouncedOwnership,
  updateUserExpertMode,
  updateUserFrontRunProtection,
  updateUserGasPreferences,
  updateUserLocale,
  updateUserSearchPreferences,
  updateUserSingleHopOnly,
  updateUserSlippageTolerance,
} from './actions'

import { DEFAULT_DEADLINE_FROM_NOW } from '../../constants/misc'
import { SupportedLocale } from 'constants/locales'
import _ from 'lodash'
import { createReducer } from '@reduxjs/toolkit'
import { updateVersion } from '../global/actions'

const currentTimestamp = () => new Date().getTime()

export type TokenFavorite = {
  pairAddress: string;
  network: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
}

export interface UserState {
  arbitrumAlphaAcknowledged: boolean

  // the timestamp of the last updateVersion action
  lastUpdateVersionTimestamp?: number

  userDarkMode: boolean | null // the user's choice for dark mode or light mode
  matchesDarkMode: boolean // whether the dark mode media query matches

  userLocale: SupportedLocale | null

  userExpertMode: boolean
  useFrontrunProtection: boolean
  userSingleHopOnly: boolean // only allow swaps on direct pairs
  detectRenouncedOwnership: boolean

  // hides closed (inactive) positions across the app
  userHideClosedPositions: boolean

  // user defined slippage tolerance in bips, used in all txns
  userSlippageTolerance: number | 'auto'
  userSlippageToleranceHasBeenMigratedToAuto: boolean // temporary flag for migration status
  useAutoSlippage: boolean;
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
  preferredGas: {
    low?: boolean,
    medium?: boolean,
    high?: boolean,
    ultra?: boolean,
    useOnce?: boolean,    
    custom?: any
  }
  chartHistory?: any[] 
  searchPreferences: SearchPreferenceState
  favorites: TokenFavorite[]
}

function pairKey(token0Address: string, token1Address: string) {
  return `${token0Address};${token1Address}`
}

export type SearchPreferenceState = {
  networks: Array<{
    chainId: number;
    network:string;
    includeInResults: boolean
  }>;
}

export const initialState: UserState = {
  arbitrumAlphaAcknowledged: false,
  userDarkMode: null,
  matchesDarkMode: false,
  userExpertMode: false,
  userLocale: null,
  userSingleHopOnly: false,
  userHideClosedPositions: false,
  userSlippageTolerance: 'auto',
  userSlippageToleranceHasBeenMigratedToAuto: true,
  userDeadline: DEFAULT_DEADLINE_FROM_NOW,
  tokens: {},
  pairs: {},
  timestamp: currentTimestamp(),
  URLWarningVisible: true,
  useAutoSlippage: false,
  useFrontrunProtection: false,
  detectRenouncedOwnership:false,
  preferredGas: {
    low: false,
    medium: false,
    high: false,
    ultra:false,
    useOnce:false,
    custom: 0
  },
  chartHistory: [],
  favorites: [],
  searchPreferences: {
    networks: [
      {chainId: 1, network: 'ethereum', includeInResults: true}, 
      {chainId: 56, network :'bsc', includeInResults: true}
    ]
  }
}

export default createReducer(initialState, (builder) =>
  builder
    .addCase(updateUserSearchPreferences, (state, action) => {
      state.searchPreferences = action.payload.newPreferences;
    })
    .addCase(updateFavoritedTokens, (state, action) => {
      state.favorites = _.uniqBy(action.payload.newFavorites, a => a.tokenAddress)
      state.timestamp = currentTimestamp()
    })
    .addCase(updateUserChartHistory, (state, action) => {
      state.chartHistory = _.orderBy(
          _.uniqBy(
            [
              ...action.payload.chartHistory,
              ...(state.chartHistory ?? [])
            ], 
            item => item?.token?.address?.toLowerCase()
          ), 
          item => item.time,
          'asc'
        ).reverse().slice(0, 20)
        state.timestamp = currentTimestamp()
    })
    .addCase(updateUserFrontRunProtection, (state, action) => {
        state.useFrontrunProtection = action.payload.useFrontrunProtection
        state.timestamp = currentTimestamp()
      })
    .addCase(updateVersion, (state) => {
      // slippage isnt being tracked in local storage, reset to default
      // noinspection SuspiciousTypeOfGuard
      if (
        typeof state.userSlippageTolerance !== 'number' ||
        !Number.isInteger(state.userSlippageTolerance) ||
        state.userSlippageTolerance < 0 ||
        state.userSlippageTolerance > 5000
      ) {
        state.userSlippageTolerance = 'auto'
      } else {
        if (
          !state.userSlippageToleranceHasBeenMigratedToAuto &&
          [10, 50, 100].indexOf(state.userSlippageTolerance) !== -1
        ) {
          state.userSlippageTolerance = 'auto'
          state.userSlippageToleranceHasBeenMigratedToAuto = true
        }
      }

      // deadline isnt being tracked in local storage, reset to default
      // noinspection SuspiciousTypeOfGuard
      if (
        typeof state.userDeadline !== 'number' ||
        !Number.isInteger(state.userDeadline) ||
        state.userDeadline < 60 ||
        state.userDeadline > 180 * 60
      ) {
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
    .addCase(updateArbitrumAlphaAcknowledged, (state, action) => {
      state.arbitrumAlphaAcknowledged = action.payload.arbitrumAlphaAcknowledged
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
    .addCase(updateUserSingleHopOnly, (state, action) => {
      state.userSingleHopOnly = action.payload.userSingleHopOnly
    })
    .addCase(updateUserDetectRenouncedOwnership, (state, action) => {
      state.detectRenouncedOwnership = action.payload.detectRenouncedOwnership
      state.timestamp = currentTimestamp()
    })
    .addCase(updateUserGasPreferences, (state,action) => {
        state.preferredGas = action.payload
        state.timestamp = currentTimestamp()
    })
    .addCase(updateHideClosedPositions, (state, action) => {
      state.userHideClosedPositions = action.payload.userHideClosedPositions
      state.timestamp = currentTimestamp()
    })
    .addCase(addSerializedToken, (state, { payload: { serializedToken } }) => {
      if (!state.tokens) {
        state.tokens = {}
      }
      state.tokens[serializedToken.chainId] = state.tokens[serializedToken.chainId] || {}
      state.tokens[serializedToken.chainId][serializedToken.address] = serializedToken
      state.timestamp = currentTimestamp()
    })
    .addCase(updateUseAutoSlippage, (state, action ) => {
      state.useAutoSlippage = action.payload.useAutoSlippage;
      state.timestamp = currentTimestamp()
    })
    .addCase(removeSerializedToken, (state, { payload: { address, chainId } }) => {
      if (!state.tokens) {
        state.tokens = {}
      }
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
)
