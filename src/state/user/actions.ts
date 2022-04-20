import { createAction } from '@reduxjs/toolkit'
import { SupportedLocale } from 'constants/locales'

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
export const updateUserDarkMode = createAction<{ userDarkMode: boolean }>('user/updateUserDarkMode')
export const updateUserExpertMode = createAction<{ userExpertMode: boolean }>('user/updateUserExpertMode')
export const updateUserLocale = createAction<{ userLocale: SupportedLocale }>('user/updateUserLocale')
export const updateShowSurveyPopup = createAction<{ showSurveyPopup: boolean }>('user/updateShowSurveyPopup')
export const updateShowDonationLink = createAction<{ showDonationLink: boolean }>('user/updateShowDonationLink')
export const updateUserClientSideRouter = createAction<{ userClientSideRouter: boolean }>(
  'user/updateUserClientSideRouter'
)
export const updateHideClosedPositions = createAction<{ userHideClosedPositions: boolean }>('user/hideClosedPositions')
export const updateUserSlippageTolerance = createAction<{ userSlippageTolerance: number | 'auto' }>(
  'user/updateUserSlippageTolerance'
)
export const updateUserDeadline = createAction<{ userDeadline: number }>('user/updateUserDeadline')
export const addSerializedToken = createAction<{ serializedToken: SerializedToken }>('user/addSerializedToken')
export const removeSerializedToken = createAction<{ chainId: number; address: string }>('user/removeSerializedToken')
export const addSerializedPair = createAction<{ serializedPair: SerializedPair }>('user/addSerializedPair')
export const removeSerializedPair =
  createAction<{ chainId: number; tokenAAddress: string; tokenBAddress: string }>('user/removeSerializedPair')
