import { createSlice } from '@reduxjs/toolkit'
import { DEFAULT_DEADLINE_FROM_NOW } from '~/constants/misc'
import { SlippageTolerance } from '~/state/user/types'
import { RouterPreference } from '~/types/routing'

const currentTimestamp = () => new Date().getTime()

// `user.pairs` (the retired V2 saved-pairs import) is deliberately NOT declared here and NOT
// cleared by a migration: autoMergeLevel1 rehydrates the persisted slice as-is, so the key keeps
// round-tripping through storage and the flow can be restored if the v2 wallet-positions endpoint
// turns out not to cover those positions. Drop it with a migration once that is confirmed.
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

  timestamp: number

  // undefined means has not gone through A/B split yet
  showSurveyPopup?: boolean

  originCountry?: string

  isEmbeddedWalletBackedUp?: boolean
}

export const initialState: UserState = {
  userRouterPreference: RouterPreference.X,
  userHideClosedPositions: false,
  userSlippageTolerance: SlippageTolerance.Auto,
  userSlippageToleranceHasBeenMigratedToAuto: true,
  userDeadline: DEFAULT_DEADLINE_FROM_NOW,
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
    setOriginCountry(state, { payload: country }) {
      state.originCountry = country
    },
    resetUser: () => initialState,
  },
})

export const {
  setOriginCountry,
  updateHideClosedPositions,
  updateUserRouterPreference,
  updateUserDeadline,
  updateUserSlippageTolerance,
  updateIsEmbeddedWalletBackedUp,
  resetUser,
} = userSlice.actions
export default userSlice.reducer
