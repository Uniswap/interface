import { createSelector } from '@reduxjs/toolkit'

import { AppState } from '..'
import { NETWORK_DETAIL } from '../../constants'

export const bridgeStateSelector = (state: AppState) => state.bridge
export const bridgeModalStateSelector = (state: AppState) => state.bridge.modal

export const bridgeTxsFilterSelector = createSelector(bridgeStateSelector, bridge => bridge.txsFilter)
export const bridgeTxsLoadingSelector = createSelector(bridgeStateSelector, bridge => bridge.isCheckingWithdrawals)

export const bridgeModalDataSelector = createSelector(bridgeModalStateSelector, modal => {
  const { status, currencyId, typedValue, fromNetwork, toNetwork, error } = modal

  return {
    status,
    currencyId,
    typedValue,
    // toNetworkName: NETWORK_DETAIL[toNetwork.chainId].chainName,
    // fromNetworkName: NETWORK_DETAIL[fromNetwork.chainId].chainName,
    toNetwork,
    fromNetwork,
    error
  }
})
