import { createAction } from '@reduxjs/toolkit'
import { MainnetGasPrice } from '../application/actions'

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
export const updateUserMultihop = createAction<{ userMultihop: boolean }>('user/updateUserMultihop')
export const updateUserExpertMode = createAction<{ userExpertMode: boolean }>('user/updateUserExpertMode')
export const updateUserPreferredGasPrice = createAction<MainnetGasPrice | string | null>(
  'user/updateUserPreferredGasPrice'
)
export const updateUserSlippageTolerance = createAction<{ userSlippageTolerance: number }>(
  'user/updateUserSlippageTolerance'
)
export const updateUserDeadline = createAction<{ userDeadline: number }>('user/updateUserDeadline')
export const addSerializedToken = createAction<{ serializedToken: SerializedToken }>('user/addSerializedToken')
export const removeSerializedToken = createAction<{ chainId: number; address: string }>('user/removeSerializedToken')
export const addSerializedPair = createAction<{ serializedPair: SerializedPair }>('user/addSerializedPair')
export const removeSerializedPair = createAction<{ serializedPair: SerializedPair }>('user/removeSerializedPair')
export const toggleURLWarning = createAction<void>('app/toggleURLWarning')
