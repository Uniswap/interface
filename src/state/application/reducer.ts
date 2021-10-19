import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { createReducer, nanoid } from '@reduxjs/toolkit'
import { ChainId } from '@dynamic-amm/sdk'
import {
  addPopup,
  PopupContent,
  removePopup,
  updateBlockNumber,
  ApplicationModal,
  setOpenModal,
  updateETHPrice,
  updateKNCPrice,
  updateChainIdWhenNotConnected,
  setExchangeSubgraphClient
} from './actions'
import { exchangeClients } from 'apollo/client'

type PopupList = Array<{ key: string; show: boolean; content: PopupContent; removeAfterMs: number | null }>

type ETHPrice = {
  currentPrice?: string
  oneDayBackPrice?: string
  pricePercentChange?: number
}

export interface ApplicationState {
  readonly blockNumber: { readonly [chainId: number]: number }
  readonly popupList: PopupList
  readonly openModal: ApplicationModal | null
  readonly ethPrice: ETHPrice
  readonly kncPrice?: string
  readonly chainIdWhenNotConnected: ChainId
  exchangeSubgraphClients: { [key: string]: ApolloClient<NormalizedCacheObject> }
}

const initialState: ApplicationState = {
  blockNumber: {},
  popupList: [],
  openModal: null,
  ethPrice: {},
  kncPrice: '',
  chainIdWhenNotConnected: ChainId.MAINNET,
  exchangeSubgraphClients: exchangeClients
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
    .addCase(addPopup, (state, { payload: { content, key, removeAfterMs = 15000 } }) => {
      state.popupList = (key ? state.popupList.filter(popup => popup.key !== key) : state.popupList).concat([
        {
          key: key || nanoid(),
          show: true,
          content,
          removeAfterMs
        }
      ])
    })
    .addCase(removePopup, (state, { payload: { key } }) => {
      state.popupList.forEach(p => {
        if (p.key === key) {
          p.show = false
        }
      })
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
    .addCase(setExchangeSubgraphClient, (state, { payload: exchangeSubgraphClients }) => {
      state.exchangeSubgraphClients = exchangeSubgraphClients as any
    })
)
