import { createSlice } from '@reduxjs/toolkit'
import { ConnectionType } from 'connection/types'
import { SupportedLocale } from 'constants/locales'
import { RouterPreference } from 'state/routing/slice'

import { DEFAULT_DEADLINE_FROM_NOW } from '../../constants/misc'
import { updateVersion } from '../global/actions'
import { SerializedPair, SerializedToken, SlippageTolerance } from './types'

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
  URLWarningVisible: boolean
  hideUniswapWalletBanner: boolean
  disabledUniswapX?: boolean
  // undefined means has not gone through A/B split yet
  showSurveyPopup?: boolean
}

function pairKey(token0Address: string, token1Address: string) {
  return `${token0Address};${token1Address}`
}

export const initialState: UserState = {
  selectedWallet: undefined,
  userLocale: null,
  userRouterPreference: RouterPreference.API,
  userHideClosedPositions: false,
  userSlippageTolerance: SlippageTolerance.Auto,
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
    updateSelectedWallet(state, { payload: { wallet } }) {
      state.selectedWallet = wallet
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
    updateUserRouterPreference(state, action) {
      state.userRouterPreference = action.payload.userRouterPreference
    },
    updateHideClosedPositions(state, action) {
      state.userHideClosedPositions = action.payload.userHideClosedPositions
    },
    updateHideUniswapWalletBanner(state, action) {
      state.hideUniswapWalletBanner = action.payload.hideUniswapWalletBanner
    },
    updateDisabledUniswapX(state, action) {
      state.disabledUniswapX = action.payload.disabledUniswapX
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
    // After adding a new property to the state, its value will be `undefined` (instead of the default)
    // for all existing users with a previous version of the state in their localStorage.
    // In order to avoid this, we need to set a default value for each new property manually during hydration.
    builder.addCase(updateVersion, (state) => {
      // If `selectedWallet` is a WalletConnect v1 wallet, reset to default.
      if (state.selectedWallet) {
        const selectedWallet = state.selectedWallet as string
        if (
          selectedWallet === 'UNIWALLET' ||
          selectedWallet === 'UNISWAP_WALLET' ||
          selectedWallet === 'WALLET_CONNECT'
        ) {
          delete state.selectedWallet
        }
      }

      // If `userSlippageTolerance` is not present or its value is invalid, reset to default
      if (
        typeof state.userSlippageTolerance !== 'number' ||
        !Number.isInteger(state.userSlippageTolerance) ||
        state.userSlippageTolerance < 0 ||
        state.userSlippageTolerance > 5000
      ) {
        state.userSlippageTolerance = SlippageTolerance.Auto
      } else {
        if (
          !state.userSlippageToleranceHasBeenMigratedToAuto &&
          [10, 50, 100].indexOf(state.userSlippageTolerance) !== -1
        ) {
          state.userSlippageTolerance = SlippageTolerance.Auto
          state.userSlippageToleranceHasBeenMigratedToAuto = true
        }
      }

      // If `userDeadline` is not present or its value is invalid, reset to default
      if (
        typeof state.userDeadline !== 'number' ||
        !Number.isInteger(state.userDeadline) ||
        state.userDeadline < 60 ||
        state.userDeadline > 180 * 60
      ) {
        state.userDeadline = DEFAULT_DEADLINE_FROM_NOW
      }

      // If `userRouterPreference` is not present, reset to default
      if (typeof state.userRouterPreference !== 'string') {
        state.userRouterPreference = RouterPreference.API
      }

      // If `userRouterPreference` is `AUTO`, migrate to `API`
      if ((state.userRouterPreference as string) === 'auto') {
        state.userRouterPreference = RouterPreference.API
      }

      //If `buyFiatFlowCompleted` is present, delete it using filtering
      if ('buyFiatFlowCompleted' in state) {
        //ignoring due to type errors occuring since we now remove this state
        //@ts-ignore
        delete state.buyFiatFlowCompleted
      }

      // If `buyFiatFlowCompleted` is present, delete it using filtering
      if ('buyFiatFlowCompleted' in state) {
        //ignoring due to type errors occuring since we now remove this state
        //@ts-ignore
        delete state.buyFiatFlowCompleted
      }

      //If `buyFiatFlowCompleted` is present, delete it using filtering
      if ('buyFiatFlowCompleted' in state) {
        //ignoring due to type errors occuring since we now remove this state
        //@ts-ignore
        delete state.buyFiatFlowCompleted
      }

      state.lastUpdateVersionTimestamp = currentTimestamp()
    })
  },
})

export const {
  addSerializedPair,
  addSerializedToken,
  updateSelectedWallet,
  updateHideClosedPositions,
  updateUserRouterPreference,
  updateUserDeadline,
  updateUserLocale,
  updateUserSlippageTolerance,
  updateHideUniswapWalletBanner,
  updateDisabledUniswapX,
} = userSlice.actions
export default userSlice.reducer
