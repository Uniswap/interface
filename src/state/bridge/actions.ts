import { createAction } from '@reduxjs/toolkit'
import { BridgeNetworkInput } from './reducer'

export const selectCurrency = createAction<{ currencyId: string }>('bridge/selectCurrency')
export const typeInput = createAction<{ typedValue: string }>('bridge/typeInput')
export const replaceBridgeState = createAction<{
  typedValue: string
  currencyId?: string
}>('bridge/replaceBridgeState')
export const setFromBridgeNetwork = createAction<Partial<BridgeNetworkInput>>('bridge/setFromNetwork')
export const setToBridgeNetwork = createAction<Partial<BridgeNetworkInput>>('bridge/setToNetwork')
export const swapBridgeNetworks = createAction('bridge/swapNetworks')
export const showListFromNetwork = createAction<{ showList: boolean }>('bridge/showListFromNetwork')