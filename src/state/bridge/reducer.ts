import { createReducer } from '@reduxjs/toolkit'
import { ChainId } from '@swapr/sdk'
import {
  selectCurrency,
  typeInput,
  setFromBridgeNetwork,
  setToBridgeNetwork,
  swapBridgeNetworks,
} from './actions'

export interface BridgeNetworkInput {
  readonly chainId: ChainId
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
    chainId: 1
  },
  toNetwork: {
    chainId: 42161
  }
}

export default createReducer<BridgeState>(initialState, builder =>
  builder
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
    .addCase(setFromBridgeNetwork, (state, { payload: { chainId } }) => {
      return {
        ...state,
        fromNetwork: {
          ...state.fromNetwork,
          chainId: chainId ? chainId : state.fromNetwork.chainId,
        }
      }
    })
    .addCase(setToBridgeNetwork, (state, { payload: { chainId } }) => {
      return {
        ...state,
        toNetwork: {
          ...state.fromNetwork,
          chainId: chainId ? chainId : state.toNetwork.chainId,
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
)