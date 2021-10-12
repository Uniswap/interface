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
export const updateUserDarkMode = createAction<{ userDarkMode: boolean }>('user/updateUserDarkMode')
export const updateUserExpertMode = createAction<{ userExpertMode: boolean }>('user/updateUserExpertMode')
export const updateUserSingleHopOnly = createAction<{ userSingleHopOnly: boolean }>('user/updateUserSingleHopOnly')
export const updateUserMinApprove = createAction<{ userMinApprove: boolean }>('user/updateUserMinApprove')
export const updateUserAllowMoolaWithdrawal = createAction<{ userAllowMoolaWithdrawal: boolean }>(
  'user/updateUserAllowMoolaWithdrawal'
)
export const updateUserDisableSmartRouting = createAction<{ userDisableSmartRouting: boolean }>(
  'user/updateUserDisableSmartRouting'
)
export const updateUserSlippageTolerance = createAction<{ userSlippageTolerance: number }>(
  'user/updateUserSlippageTolerance'
)
export const updateUserDeadline = createAction<{ userDeadline: number }>('user/updateUserDeadline')
export const addSerializedToken = createAction<{ serializedToken: SerializedToken }>('user/addSerializedToken')
export const removeSerializedToken = createAction<{ chainId: number; address: string }>('user/removeSerializedToken')
export const addSerializedPair = createAction<{ serializedPair: SerializedPair }>('user/addSerializedPair')
export const removeSerializedPair =
  createAction<{ chainId: number; tokenAAddress: string; tokenBAddress: string }>('user/removeSerializedPair')
export const toggleURLWarning = createAction<void>('app/toggleURLWarning')

export const setValoraAccount = createAction<{ address: string; phoneNumber: string }>('user/setValoraAccount')
export const clearValoraAccount = createAction<void>('user/clearValoraAccount')

export const updateUserAprMode = createAction<{ userAprMode: boolean }>('user/updateUserAprMode')
