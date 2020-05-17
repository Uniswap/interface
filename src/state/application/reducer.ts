import { createReducer, nanoid } from '@reduxjs/toolkit'
import { addPopup, PopupContent, removePopup, toggleWalletModal, updateBlockNumber } from './actions'

type PopupList = Array<{ key: string; show: boolean; content: PopupContent }>

interface ApplicationState {
  blockNumber: { [chainId: number]: number }
  popupList: PopupList
  walletModalOpen: boolean
}

const initialState: ApplicationState = {
  blockNumber: {},
  popupList: [],
  walletModalOpen: false
}

export default createReducer(initialState, builder =>
  builder
    .addCase(updateBlockNumber, (state, action) => {
      const { networkId, blockNumber } = action.payload
      state.blockNumber[networkId] = blockNumber
    })
    .addCase(toggleWalletModal, state => {
      state.walletModalOpen = !state.walletModalOpen
    })
    .addCase(addPopup, (state, { payload: { content } }) => {
      state.popupList.push({
        key: nanoid(),
        show: true,
        content
      })
    })
    .addCase(removePopup, (state, { payload: { key } }) => {
      state.popupList.forEach(p => {
        if (p.key === key) {
          p.show = false
        }
      })
    })
)
