import { ChainId } from '@kyberswap/ks-sdk-core'
import { createAction } from '@reduxjs/toolkit'

import { SupportedLocale } from 'constants/locales'

import { VIEW_MODE } from './reducer'

export interface SerializedToken {
  chainId: number
  address: string
  decimals: number
  symbol?: string
  name?: string
  logoURI?: string
}

export interface SerializedPair {
  token0: SerializedToken
  token1: SerializedToken
}

export const updateMatchesDarkMode = createAction<{ matchesDarkMode: boolean }>('user/updateMatchesDarkMode')
export const updateUserDarkMode = createAction<{ userDarkMode: boolean }>('user/updateUserDarkMode')
export const updateUserExpertMode = createAction<{ userExpertMode: boolean }>('user/updateUserExpertMode')
export const updateUserLocale = createAction<{ userLocale: SupportedLocale }>('user/updateUserLocale')
export const updateUserSlippageTolerance = createAction<{ userSlippageTolerance: number }>(
  'user/updateUserSlippageTolerance',
)
export const updateUserDeadline = createAction<{ userDeadline: number }>('user/updateUserDeadline')
export const addSerializedToken = createAction<{ serializedToken: SerializedToken }>('user/addSerializedToken')
export const removeSerializedToken = createAction<{ chainId: number; address: string }>('user/removeSerializedToken')
export const addSerializedPair = createAction<{ serializedPair: SerializedPair }>('user/addSerializedPair')
export const removeSerializedPair = createAction<{ chainId: number; tokenAAddress: string; tokenBAddress: string }>(
  'user/removeSerializedPair',
)
export const toggleLiveChart = createAction<{ chainId: number }>('user/toggleLiveChart')

export const toggleTradeRoutes = createAction<void>('user/toggleTradeRoutes')
export const toggleTokenInfo = createAction<void>('user/toggleTokenInfo')

export const toggleTopTrendingTokens = createAction<void>('user/toggleTopTrendingTokens')

export type ToggleFavoriteTokenPayload = {
  chainId: ChainId
} & ({ isNative?: false; address: string } | { isNative: true; address?: never })
export const toggleFavoriteToken = createAction<ToggleFavoriteTokenPayload>('user/toggleFavoriteToken')
export const updateChainId = createAction<ChainId>('user/updateChainId')
export const updateIsUserManuallyDisconnect = createAction<boolean>('user/updateIsUserManuallyDisconnect')
export const updateAcceptedTermVersion = createAction<number | null>('user/updateAcceptedTermVersion')
export const changeViewMode = createAction<VIEW_MODE>('user/changeViewMode')
export const toggleHolidayMode = createAction<void>('user/toggleHolidayMode')
