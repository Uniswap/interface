import { createSlice } from '@reduxjs/toolkit'
import { ConnectionType } from 'connection'
import { SupportedLocale } from 'constants/locales'

import { DEFAULT_DEADLINE_FROM_NOW } from '../../constants/misc'
import { updateVersion } from '../global/actions'
import { SerializedPair, SerializedToken } from './types'

const currentTimestamp = () => new Date().getTime()

export interface UserState {
  taxServiceDismissals: number | undefined

  selectedWallet?: ConnectionType

  // the timestamp of the last updateVersion action
  lastUpdateVersionTimestamp?: number

  userLocale: SupportedLocale | null

  userExpertMode: boolean

  userClientSideRouter: boolean // whether routes should be calculated with the client side router only

  // hides closed (inactive) positions across the app
  userHideClosedPositions: boolean

  // user defined slippage tolerance in bips, used in all txns
  userSlippageTolerance: number | 'auto'
  userSlippageToleranceHasBeenMigratedToAuto: boolean // temporary flag for migration status

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
  hideUniswapWalletBanner: boolean
  // undefined means has not gone through A/B split yet
  showSurveyPopup: boolean | undefined
}

function pairKey(token0Address: string, token1Address: string) {
  return `${token0Address};${token1Address}`
}

export const initialState: UserState = {
  taxServiceDismissals: 0,
  selectedWallet: undefined,
  userExpertMode: false,
  userLocale: null,
  userClientSideRouter: false,
  userHideClosedPositions: false,
  userSlippageTolerance: 'auto',
  userSlippageToleranceHasBeenMigratedToAuto: true,
  userDeadline: DEFAULT_DEADLINE_FROM_NOW,
  tokens: {},
  pairs: {},
  timestamp: currentTimestamp(),
  URLWarningVisible: true,
  hideUniswapWalletBanner: false,
  showSurveyPopup: undefined,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateTaxServiceAcknowledgments(state, action) {
      state.taxServiceDismissals = action.payload.taxServiceDismissals
    },
    updateSelectedWallet(state, { payload: { wallet } }) {
      state.selectedWallet = wallet
    },
    updateUserExpertMode(state, action) {
      state.userExpertMode = action.payload.userExpertMode
      state.timestamp = currentTimestamp()
    },
    updateUserLocale(state, action) {
      state.userLocale = action.payload.userLocale
      state.timestamp = currentTimestamp()
    },
    updateUserSlippageTolerance(state, action) {
      state.userSlippageTolerance = action.payload.userSlippageTolerance
      state.timestamp = currentTimestamp()
    },
    updateUserDeadline(state, action) {
      state.userDeadline = action.payload.userDeadline
      state.timestamp = currentTimestamp()
    },
    updateUserClientSideRouter(state, action) {
      state.userClientSideRouter = action.payload.userClientSideRouter
    },
    updateHideClosedPositions(state, action) {
      state.userHideClosedPositions = action.payload.userHideClosedPositions
    },
    updateHideUniswapWalletBanner(state, action) {
      state.hideUniswapWalletBanner = action.payload.hideUniswapWalletBanner
    },
    addSerializedToken(state, { payload: { serializedToken } }) {
      if (!state.tokens) {
        state.tokens = {}
      }
      state.tokens[serializedToken.chainId] = state.tokens[serializedToken.chainId] || {}
      state.tokens[serializedToken.chainId][serializedToken.address] = serializedToken
      state.timestamp = currentTimestamp()
    },
    addSerializedPair(state, { payload: { serializedPair } }) {
      if (
        serializedPair.token0.chainId === serializedPair.token1.chainId &&
        serializedPair.token0.address !== serializedPair.token1.address
      ) {
        const chainId = serializedPair.token0.chainId
        state.pairs[chainId] = state.pairs[chainId] || {}
        state.pairs[chainId][pairKey(serializedPair.token0.address, serializedPair.token1.address)] = serializedPair
      }
      state.timestamp = currentTimestamp()
    },
  },
  extraReducers: (builder) => {
    builder.addCase(updateVersion, (state) => {
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
  },
})

export const {
  addSerializedPair,
  addSerializedToken,
  updateTaxServiceAcknowledgments,
  updateSelectedWallet,
  updateHideClosedPositions,
  updateUserClientSideRouter,
  updateUserDeadline,
  updateUserExpertMode,
  updateUserLocale,
  updateUserSlippageTolerance,
  updateHideUniswapWalletBanner,
} = userSlice.actions
export default userSlice.reducer
