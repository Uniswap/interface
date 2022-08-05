import { ChainId } from '@kyberswap/ks-sdk-core'
import { createReducer, nanoid } from '@reduxjs/toolkit'

import {
  ApplicationModal,
  PopupContent,
  PopupType,
  addPopup,
  removePopup,
  setGasPrice,
  setOpenModal,
  updateBlockNumber,
  updateChainIdWhenNotConnected,
  updateETHPrice,
  updateKNCPrice,
  updatePrommETHPrice,
} from './actions'

type PopupList = Array<{
  key: string
  show: boolean
  content: PopupContent
  removeAfterMs: number | null
  popupType: PopupType
}>

type ETHPrice = {
  currentPrice?: string
  oneDayBackPrice?: string
  pricePercentChange?: number
}

export type GasPrice = {
  fast?: string
  standard: string
  low?: string
  default?: string
}

export interface ApplicationState {
  readonly blockNumber: { readonly [chainId: number]: number }
  readonly popupList: PopupList
  readonly openModal: ApplicationModal | null
  readonly ethPrice: ETHPrice
  readonly prommEthPrice: ETHPrice
  readonly kncPrice?: string
  readonly chainIdWhenNotConnected: ChainId
  readonly gasPrice?: GasPrice
}

const initialState: ApplicationState = {
  blockNumber: {},
  popupList: [],
  openModal: null,
  ethPrice: {},
  prommEthPrice: {},
  kncPrice: '',
  chainIdWhenNotConnected: ChainId.MAINNET,
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
    .addCase(setOpenModal, (state, action) => {
      state.openModal = action.payload
    })
    .addCase(addPopup, (state, { payload: { content, key, removeAfterMs = 15000, popupType } }) => {
      state.popupList = (key ? state.popupList.filter(popup => popup.key !== key) : state.popupList).concat([
        {
          key: key || nanoid(),
          show: true,
          content,
          removeAfterMs,
          popupType,
        },
      ])
    })
    .addCase(removePopup, (state, { payload: { key } }) => {
      state.popupList.forEach(p => {
        if (p.key === key) {
          p.show = false
        }
      })
    })
    .addCase(updatePrommETHPrice, (state, { payload: { currentPrice, oneDayBackPrice, pricePercentChange } }) => {
      state.prommEthPrice.currentPrice = currentPrice
      state.prommEthPrice.oneDayBackPrice = oneDayBackPrice
      state.prommEthPrice.pricePercentChange = pricePercentChange
    })

    .addCase(updateETHPrice, (state, { payload: { currentPrice, oneDayBackPrice, pricePercentChange } }) => {
      state.ethPrice.currentPrice = currentPrice
      state.ethPrice.oneDayBackPrice = oneDayBackPrice
      state.ethPrice.pricePercentChange = pricePercentChange
    })
    .addCase(updateKNCPrice, (state, { payload: kncPrice }) => {
      state.kncPrice = kncPrice
    })
    .addCase(updateChainIdWhenNotConnected, (state, { payload: chainId }) => {
      state.chainIdWhenNotConnected = chainId
    })
    .addCase(setGasPrice, (state, { payload: gasPrice }) => {
      if (
        state.gasPrice?.default !== gasPrice?.default ||
        state.gasPrice?.fast !== gasPrice?.fast ||
        state.gasPrice?.low !== gasPrice?.low ||
        state.gasPrice?.standard !== gasPrice?.standard
      ) {
        state.gasPrice = gasPrice as GasPrice
      }
    }),
)
