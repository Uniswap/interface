import { createReducer, nanoid } from '@reduxjs/toolkit'
import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'
import {
  addPopup,
  ApplicationModal,
  PopupContent,
  removePopup,
  setChainConnectivityWarning,
  setImplements3085,
  setOpenModal,
  updateBlockNumber,
  updateChainId,
} from './actions'

type PopupList = Array<{ key: string; show: boolean; content: PopupContent; removeAfterMs: number | null }>

export interface ApplicationState {
  readonly blockNumber: { readonly [chainId: number]: number }
  readonly chainConnectivityWarning: boolean
  readonly chainId: number | null
  readonly implements3085: boolean
  readonly openModal: ApplicationModal | null
  readonly popupList: PopupList
}

const initialState: ApplicationState = {
  blockNumber: {},
  chainConnectivityWarning: false,
  chainId: null,
  implements3085: false,
  openModal: null,
  popupList: [],
}

export default createReducer(initialState, (builder) =>
  builder
    .addCase(updateChainId, (state, action) => {
      const { chainId } = action.payload
      state.chainId = chainId
    })
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
    .addCase(addPopup, (state, { payload: { content, key, removeAfterMs = DEFAULT_TXN_DISMISS_MS } }) => {
      state.popupList = (key ? state.popupList.filter((popup) => popup.key !== key) : state.popupList).concat([
        {
          key: key || nanoid(),
          show: true,
          content,
          removeAfterMs,
        },
      ])
    })
    .addCase(removePopup, (state, { payload: { key } }) => {
      state.popupList.forEach((p) => {
        if (p.key === key) {
          p.show = false
        }
      })
    })
    .addCase(setImplements3085, (state, { payload: { implements3085 } }) => {
      state.implements3085 = implements3085
    })
    .addCase(setChainConnectivityWarning, (state, { payload: { warn } }) => {
      state.chainConnectivityWarning = warn
    })
)
