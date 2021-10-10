import { createSelector } from '@reduxjs/toolkit'

import { AppState } from '..'
import { NETWORK_DETAIL } from '../../constants'

export const bridgeStateSelector = (state: AppState) => state.bridge

export const bridgeModalDataSelector = createSelector(bridgeStateSelector, bridge => {
  const { modalState, currencyId, fromNetwork, toNetwork, typedValue, modalError } = bridge

  return {
    modalState,
    typedValue,
    currencyId,
    modalError,
    toNetworkName: NETWORK_DETAIL[toNetwork.chainId].chainName,
    fromNetworkName: NETWORK_DETAIL[fromNetwork.chainId].chainName
  }
})

export const bridgeTxsFilterSelector = createSelector(bridgeStateSelector, bridge => bridge.txsFilter)
