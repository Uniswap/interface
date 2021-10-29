import { createAction } from '@reduxjs/toolkit'
import { ChainId } from '@swapr/sdk'
import { BridgeModalState, BridgeNetworkInput, BridgeTxsFilter } from './reducer'

export const typeInput = createAction<{ typedValue: string }>('bridge/typeInput')
export const selectCurrency = createAction<{ currencyId: string }>('bridge/selectCurrency')
export const swapBridgeNetworks = createAction('bridge/swapNetworks')
export const setToBridgeNetwork = createAction<Partial<BridgeNetworkInput>>('bridge/setToNetwork')
export const setFromBridgeNetwork = createAction<Partial<BridgeNetworkInput>>('bridge/setFromNetwork')
export const setBridgeTxsFilter = createAction<BridgeTxsFilter>('bridge/setBridgeTxsFilter')
export const setBridgeLoadingWithdrawals = createAction<boolean>('bridge/setBridgeLoadingWithdrawals')
export const setBridgeModalStatus = createAction<Pick<BridgeModalState, 'status' | 'error'>>(
  'bridge/setBridgeModalStatus'
)
export const setBridgeModalData = createAction<
  Pick<BridgeModalState, 'currencyId' | 'typedValue'> & { fromChainId: ChainId; toChainId: ChainId }
>('bridge/setBridgeModalData')
