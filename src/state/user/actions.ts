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

export const updateVersion = createAction<void>('updateVersion')
export const updateMatchesDarkMode = createAction<{ matchesDarkMode: boolean }>('updateMatchesDarkMode')
export const updateUserDarkMode = createAction<{ userDarkMode: boolean }>('updateUserDarkMode')
export const addSerializedToken = createAction<{ serializedToken: SerializedToken }>('addSerializedToken')
export const removeSerializedToken = createAction<{ chainId: number; address: string }>('removeSerializedToken')
export const addSerializedPair = createAction<{ serializedPair: SerializedPair }>('addSerializedPair')
export const removeSerializedPair = createAction<{ chainId: number; tokenAAddress: string; tokenBAddress: string }>(
  'removeSerializedPair'
)
export const dismissTokenWarning = createAction<{ chainId: number; tokenAddress: string }>('dismissTokenWarning')
