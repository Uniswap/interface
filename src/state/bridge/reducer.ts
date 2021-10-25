import { createReducer } from '@reduxjs/toolkit'
import { ChainId } from '@swapr/sdk'

import {
  typeInput,
  selectCurrency,
  setFromBridgeNetwork,
  setToBridgeNetwork,
  swapBridgeNetworks,
  setBridgeModalStatus,
  setBridgeTxsFilter,
  setBridgeLoadingWithdrawals,
  setBridgeModalData
} from './actions'

export interface BridgeNetworkInput {
  readonly chainId: ChainId
}
export interface BridgeModalState {
  readonly status: BridgeModalStatus
  readonly currencyId: string | undefined
  readonly typedValue: string
  readonly fromNetwork: BridgeNetworkInput
  readonly toNetwork: BridgeNetworkInput
  readonly error?: string
}
export enum BridgeModalStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  CLOSED = 'CLOSED',
  INITIATED = 'INITIATED',
  ERROR = 'ERROR',
  COLLECTING = 'COLLECTING',
  DISCLAIMER = 'DISCLAIMER'
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
  readonly modalError?: string
  readonly modal: BridgeModalState
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
  modalError: undefined,
  isCheckingWithdrawals: true,
  modal: {
    status: BridgeModalStatus.CLOSED,
    currencyId: '',
    typedValue: 'ETH',
    fromNetwork: {
      chainId: 1
    },
    toNetwork: {
      chainId: 42161
    }
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
    .addCase(setBridgeTxsFilter, (state, { payload }) => {
      state.txsFilter = payload
    })
    .addCase(setBridgeLoadingWithdrawals, (state, { payload }) => {
      state.isCheckingWithdrawals = payload
    })
    .addCase(setBridgeModalStatus, (state, { payload: { status, error } }) => {
      return {
        ...state,
        modal: {
          ...state.modal,
          status,
          error
        }
      }
    })
    .addCase(setBridgeModalData, (state, { payload: { currencyId, typedValue, fromChainId, toChainId } }) => {
      return {
        ...state,
        currencyId,
        typedValue,
        fromNetwork: {
          ...state.fromNetwork,
          chainId: fromChainId
        },
        toNetwork: {
          ...state.toNetwork,
          chainId: toChainId
        },
        modal: {
          ...state.modal,
          currencyId,
          typedValue,
          fromNetwork: {
            ...state.fromNetwork,
            chainId: fromChainId
          },
          toNetwork: {
            ...state.toNetwork,
            chainId: toChainId
          }
        }
      }
    })
)
