import { SearchPreferenceState, TokenFavorite } from './reducer'

import { SupportedLocale } from 'constants/locales'
import { createAction } from '@reduxjs/toolkit'
export interface SerializedToken {
  chainId: number
  address: string
  decimals: number
  symbol?: string
  name?: string
}

export interface SerializedPair {
  token0: SerializedToken
  token1: SerializedToken
}

export const updateMatchesDarkMode = createAction<{ matchesDarkMode: boolean }>('user/updateMatchesDarkMode')
export const updateArbitrumAlphaAcknowledged = createAction<{ arbitrumAlphaAcknowledged: boolean }>(
  'user/updateArbitrumAlphaAcknowledged'
)

export const updateFavoritedTokens = createAction<{newFavorites: TokenFavorite[]}>('user/updateFavorites')
export const updateUserChartHistory = createAction<{ chartHistory:any[] }>('user/addHistory')

export const updateUserFrontRunProtection = createAction<{ useFrontrunProtection: boolean }>('user/updateUserFrontrunProtection')
export const updateUserGasPreferences = createAction<{high?: boolean; low?:boolean; medium?:boolean; custom?: number;}>('user/updateCustomGasSettings')
export const updateUserDarkMode = createAction<{ userDarkMode: boolean }>('user/updateUserDarkMode')
export const updateUserExpertMode = createAction<{ userExpertMode: boolean }>('user/updateUserExpertMode')
export const updateUserSearchPreferences = createAction<{newPreferences: SearchPreferenceState}>('user/updateSearchPreferences')
export const updateUserLocale = createAction<{ userLocale: SupportedLocale }>('user/updateUserLocale')
export const updateUserDetectRenouncedOwnership = createAction<{ detectRenouncedOwnership: boolean }>('user/updatedDetectRenouncedOwnership')
export const updateUserSingleHopOnly = createAction<{ userSingleHopOnly: boolean }>('user/updateUserSingleHopOnly')
export const updateHideClosedPositions = createAction<{ userHideClosedPositions: boolean }>('user/hideClosedPositions')
export const updateUserSlippageTolerance = createAction<{ userSlippageTolerance: number | 'auto' }>(
  'user/updateUserSlippageTolerance'
)
export const updateUseAutoSlippage = createAction<{ useAutoSlippage: boolean }>('user/updateUseAutoSlippage')
export const updateUserDeadline = createAction<{ userDeadline: number }>('user/updateUserDeadline')
export const addSerializedToken = createAction<{ serializedToken: SerializedToken }>('user/addSerializedToken')
export const removeSerializedToken = createAction<{ chainId: number; address: string }>('user/removeSerializedToken')
export const addSerializedPair = createAction<{ serializedPair: SerializedPair }>('user/addSerializedPair')
export const removeSerializedPair =
  createAction<{ chainId: number; tokenAAddress: string; tokenBAddress: string }>('user/removeSerializedPair')
