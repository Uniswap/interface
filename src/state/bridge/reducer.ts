import { createReducer } from '@reduxjs/toolkit'
import { ChainId } from '@swapr/sdk'
import {
  selectCurrency,
  typeInput,
  setFromBridgeNetwork,
  setToBridgeNetwork,
  swapBridgeNetworks,
  setBridgeModalState,
  setBridgeTxsFilter,
  setBridgeLoadingWithdrawals
} from './actions'

export interface BridgeNetworkInput {
  readonly chainId: ChainId
}

export enum BridgeModalState {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  CLOSED = 'CLOSED',
  INITIATED = 'INITIATED',
  ERROR = 'ERROR'
}

export enum BridgeTxsFilter {
  NONE = 'NONE',
  COLLECTABLE = 'COLLECTABLE',
  RECENT = 'RECENT'
}
export interface BridgeState {
  readonly typedValue: string
  readonly currencyId: string | undefined
  readonly fromNetwork: BridgeNetworkInput
  readonly toNetwork: BridgeNetworkInput
  readonly isCheckingWithdrawals: boolean
  readonly txsFilter: BridgeTxsFilter
  readonly modalState: BridgeModalState
  readonly modalError?: string
}

const initialState: BridgeState = {
  typedValue: '',
  currencyId: 'ETH',
  fromNetwork: {
    chainId: 1
  },
  toNetwork: {
    chainId: 42161
  },
  txsFilter: BridgeTxsFilter.RECENT,
  modalState: BridgeModalState.CLOSED,
  modalError: undefined,
  isCheckingWithdrawals: true
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
          chainId: chainId ? chainId : state.fromNetwork.chainId
        }
      }
    })
    .addCase(setToBridgeNetwork, (state, { payload: { chainId } }) => {
      return {
        ...state,
        toNetwork: {
          ...state.fromNetwork,
          chainId: chainId ? chainId : state.toNetwork.chainId
        }
      }
    })
    .addCase(swapBridgeNetworks, state => {
      const {
        fromNetwork: { chainId: fromChainId },
        toNetwork: { chainId: toChainId }
      } = state
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
    .addCase(setBridgeModalState, (state, { payload: { modalState, modalError } }) => {
      state.modalState = modalState
      state.modalError = modalError
    })
    .addCase(setBridgeTxsFilter, (state, { payload }) => {
      state.txsFilter = payload
    })
    .addCase(setBridgeLoadingWithdrawals, (state, { payload }) => {
      state.isCheckingWithdrawals = payload
    })
)
