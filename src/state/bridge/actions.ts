import { createAction } from '@reduxjs/toolkit'
import { BridgeNetworkInput, BridgeState, BridgeTxsFilter } from './reducer'

export const typeInput = createAction<{ typedValue: string }>('bridge/typeInput')
export const selectCurrency = createAction<{ currencyId: string }>('bridge/selectCurrency')
export const swapBridgeNetworks = createAction('bridge/swapNetworks')
export const setToBridgeNetwork = createAction<Partial<BridgeNetworkInput>>('bridge/setToNetwork')
export const setFromBridgeNetwork = createAction<Partial<BridgeNetworkInput>>('bridge/setFromNetwork')
export const setBridgeModalState = createAction<Pick<BridgeState, 'modalState' | 'modalError'>>(
  'bridge/setBridgeModalState'
)
export const setBridgeTxsFilter = createAction<BridgeTxsFilter>('bridge/setBridgeTxsFilter')
export const setBridgeLoadingWithdrawals = createAction<boolean>('bridge/setBridgeLoadingWithdrawals')
