import { createSlice } from '@reduxjs/toolkit'
import { DEFAULT_DEADLINE_FROM_NOW } from 'constants/misc'
import { RouterPreference } from 'state/routing/types'
import { SerializedPair, SlippageTolerance } from 'state/user/types'

const currentTimestamp = () => new Date().getTime()

export interface UserState {
  // the timestamp of the last updateVersion action
  lastUpdateVersionTimestamp?: number

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

  pairs: {
    [chainId: number]: {
      // keyed by token0Address:token1Address
      [key: string]: SerializedPair
    }
  }

  timestamp: number

  // undefined means has not gone through A/B split yet
  showSurveyPopup?: boolean

  originCountry?: string

  isEmbeddedWalletBackedUp?: boolean
}

function pairKey(token0Address: string, token1Address: string) {
  return `${token0Address};${token1Address}`
}

export const initialState: UserState = {
  userRouterPreference: RouterPreference.X,
  userHideClosedPositions: false,
  userSlippageTolerance: SlippageTolerance.Auto,
  userSlippageToleranceHasBeenMigratedToAuto: true,
  userDeadline: DEFAULT_DEADLINE_FROM_NOW,
  pairs: {},
  timestamp: currentTimestamp(),
  showSurveyPopup: undefined,
  originCountry: undefined,
  isEmbeddedWalletBackedUp: false,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateIsEmbeddedWalletBackedUp(state, { payload: { isEmbeddedWalletBackedUp } }) {
      state.isEmbeddedWalletBackedUp = isEmbeddedWalletBackedUp
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
    addSerializedPair(state, { payload: { serializedPair } }) {
      if (
        serializedPair.token0.chainId === serializedPair.token1.chainId &&
        serializedPair.token0.address !== serializedPair.token1.address
      ) {
        const chainId = serializedPair.token0.chainId
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
  setOriginCountry,
  updateHideClosedPositions,
  updateUserRouterPreference,
  updateUserDeadline,
  updateUserSlippageTolerance,
  updateIsEmbeddedWalletBackedUp,
} = userSlice.actions
export default userSlice.reducer
