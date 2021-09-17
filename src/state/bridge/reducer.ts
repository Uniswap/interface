import { createReducer } from '@reduxjs/toolkit'
import { ChainId } from '@swapr/sdk'
import {
  replaceBridgeState,
  selectCurrency,
  typeInput,
  setFromBridgeNetwork,
  setToBridgeNetwork,
  swapBridgeNetworks,
  showListFromNetwork
} from './actions'

export interface BridgeNetworkInput {
  readonly chainId: ChainId
  readonly showList: boolean
}
export interface BridgeState {
  readonly typedValue: string
  readonly currencyId: string | undefined
  readonly fromNetwork: BridgeNetworkInput
  readonly toNetwork: BridgeNetworkInput
}

const initialState: BridgeState = {
  typedValue: '',
  currencyId: '',
  fromNetwork: {
    chainId: 1,
    showList: false
  },
  toNetwork: {
    chainId: 42161,
    showList: false
  }
}

export default createReducer<BridgeState>(initialState, builder =>
  builder
    .addCase(
      replaceBridgeState,
      (state, { payload: { typedValue, currencyId } }) => {
        return {
          ...state,
          currencyId: currencyId,
          typedValue: typedValue,
        }
      }
    )
    .addCase(selectCurrency, (state, { payload: { currencyId } }) => {
      return {
        ...state,
        currencyId: currencyId
      }
    })
    .addCase(typeInput, (state, { payload: { typedValue } }) => {
      return {
        ...state,
        typedValue
      }
    })
    .addCase(setFromBridgeNetwork, (state, { payload: { chainId, showList } }) => {
      return {
        ...state,
        fromNetwork: {
          ...state.fromNetwork,
          chainId: chainId ? chainId : state.fromNetwork.chainId,
          showList: showList ? showList : state.fromNetwork.showList
        }
      }
    })
    .addCase(setToBridgeNetwork, (state, { payload: { chainId, showList } }) => {
      return {
        ...state,
        toNetwork: {
          ...state.fromNetwork,
          chainId: chainId ? chainId : state.toNetwork.chainId,
          showList: showList ? showList : state.toNetwork.showList
        }
      }
    })
    .addCase(swapBridgeNetworks, (state) => {
      const { fromNetwork: { chainId: fromChainId }, toNetwork: { chainId: toChainId } } = state

      return {
        ...state,
        fromNetwork: {
          ...state.fromNetwork,
          chainId: toChainId
        },
        toNetwork: {
          ...state.toNetwork,
          chainId: fromChainId
        }
      }
    })
    .addCase(showListFromNetwork, (state, { payload: { showList } }) => {
      return {
        ...state,
        fromNetwork: {
          ...state.fromNetwork,
          showList: showList
        }
      }
    })
)