import { createReducer } from '@reduxjs/toolkit'
import { ChainId } from '@swapr/sdk'
import {
  PopupContent,
  updateBlockNumber,
  ApplicationModal,
  setOpenModal,
  updateMainnetGasPrices,
  MainnetGasPrice,
  setConnectorInfo
} from './actions'

type PopupList = Array<{ key: string; show: boolean; content: PopupContent; removeAfterMs: number | null }>

export interface ApplicationState {
  readonly blockNumber: { readonly [chainId: number]: number }
  readonly mainnetGasPrices: { readonly [variant in MainnetGasPrice]: string } | null
  readonly popupList: PopupList
  readonly openModal: ApplicationModal | null
  readonly chainId: ChainId | undefined
  readonly account: string | null | undefined
}

const initialState: ApplicationState = {
  blockNumber: {},
  mainnetGasPrices: null,
  popupList: [],
  openModal: null,
  chainId: undefined,
  account: null
}

export default createReducer(initialState, builder =>
  builder
    .addCase(updateBlockNumber, (state, action) => {
      const { chainId, blockNumber } = action.payload
      if (typeof state.blockNumber[chainId] !== 'number') {
        state.blockNumber[chainId] = blockNumber
      } else {
        state.blockNumber[chainId] = Math.max(blockNumber, state.blockNumber[chainId])
      }
    })
    .addCase(updateMainnetGasPrices, (state, action) => {
      state.mainnetGasPrices = action.payload
    })
    .addCase(setOpenModal, (state, action) => {
      state.openModal = action.payload
    })
    .addCase(setConnectorInfo, (state, action) => {
      const { account, chainId } = action.payload
      state.account = account
      state.chainId = chainId
    })
)
