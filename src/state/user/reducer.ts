import { createSlice } from '@reduxjs/toolkit'
import { deletePersistedConnectionMeta, getPersistedConnectionMeta } from 'connection/meta'

import { ConnectionType } from '../../connection/types'
import { SupportedLocale } from '../../constants/locales'
import { DEFAULT_DEADLINE_FROM_NOW } from '../../constants/misc'
import { RouterPreference } from '../../state/routing/types'
import { SerializedPair, SerializedToken, SlippageTolerance } from './types'

const selectedWallet = getPersistedConnectionMeta()?.type
const currentTimestamp = () => new Date().getTime()

export interface UserState {
  selectedWallet?: ConnectionType

  // the timestamp of the last updateVersion action
  lastUpdateVersionTimestamp?: number

  userLocale: SupportedLocale | null

  // which router should be used to calculate trades
  userRouterPreference: RouterPreference

  // hides closed (inactive) positions across the app
  userHideClosedPositions: boolean

  // user defined slippage tolerance in bips, used in all txns
  userSlippageTolerance: number | SlippageTolerance.Auto

  // flag to indicate whether the user has been migrated from the old slippage tolerance values
  userSlippageToleranceHasBeenMigratedToAuto: boolean

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
  hideAndroidAnnouncementBanner: boolean
  // undefined means has not gone through A/B split yet
  showSurveyPopup?: boolean

  originCountry?: string
}

function pairKey(token0Address: string, token1Address: string) {
  return `${token0Address};${token1Address}`
}

export const initialState: UserState = {
  selectedWallet,
  userLocale: null,
  userRouterPreference: RouterPreference.X,
  userHideClosedPositions: false,
  userSlippageTolerance: SlippageTolerance.Auto,
  userSlippageToleranceHasBeenMigratedToAuto: true,
  userDeadline: DEFAULT_DEADLINE_FROM_NOW,
  tokens: {},
  pairs: {},
  timestamp: currentTimestamp(),
  hideAndroidAnnouncementBanner: false,
  showSurveyPopup: undefined,
  originCountry: undefined,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateSelectedWallet(state, { payload: { wallet } }) {
      if (!wallet) {
        deletePersistedConnectionMeta()
      }
      state.selectedWallet = wallet
    },
    updateUserLocale(state, action) {
      if (action.payload.userLocale !== state.userLocale) {
        state.userLocale = action.payload.userLocale
        state.timestamp = currentTimestamp()
      }
    },
    updateUserSlippageTolerance(state, action) {
      state.userSlippageTolerance = action.payload.userSlippageTolerance
      state.timestamp = currentTimestamp()
    },
    updateUserDeadline(state, action) {
      state.userDeadline = action.payload.userDeadline
      state.timestamp = currentTimestamp()
    },
    updateUserRouterPreference(state, action) {
      state.userRouterPreference = action.payload.userRouterPreference
    },
    updateHideClosedPositions(state, action) {
      state.userHideClosedPositions = action.payload.userHideClosedPositions
    },
    updateHideAndroidAnnouncementBanner(state, action) {
      state.hideAndroidAnnouncementBanner = action.payload.hideAndroidAnnouncementBanner
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
    setOriginCountry(state, { payload: country }) {
      state.originCountry = country
    },
  },
})

export const {
  addSerializedPair,
  addSerializedToken,
  setOriginCountry,
  updateSelectedWallet,
  updateHideClosedPositions,
  updateUserRouterPreference,
  updateUserDeadline,
  updateUserLocale,
  updateUserSlippageTolerance,
  updateHideAndroidAnnouncementBanner,
} = userSlice.actions
export default userSlice.reducer
