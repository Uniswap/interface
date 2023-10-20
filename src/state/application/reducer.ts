import { createSlice, nanoid } from '@reduxjs/toolkit'
import { ChainId } from '@uniswap/sdk-core'
import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'

export enum PopupType {
  Transaction = 'transaction',
  Order = 'order',
  FailedSwitchNetwork = 'failedSwitchNetwork',
}

export type PopupContent =
  | {
      type: PopupType.Transaction
      hash: string
    }
  | {
      type: PopupType.Order
      orderHash: string
    }
  | {
      type: PopupType.FailedSwitchNetwork
      failedSwitchNetwork: ChainId
    }

export enum ApplicationModal {
  ADDRESS_CLAIM,
  BLOCKED_ACCOUNT,
  CLAIM_POPUP,
  DELEGATE,
  EXECUTE,
  FEATURE_FLAGS,
  MENU,
  METAMASK_CONNECTION_ERROR,
  NETWORK_FILTER,
  NETWORK_SELECTOR,
  POOL_OVERVIEW_OPTIONS,
  PRIVACY_POLICY,
  QUEUE,
  SELF_CLAIM,
  SETTINGS,
  SHARE,
  TAX_SERVICE,
  TIME_SELECTOR,
  VOTE,
  UK_DISCLAIMER,
  UNISWAP_NFT_AIRDROP_CLAIM,
}

export type PopupList = Array<{ key: string; show: boolean; content: PopupContent; removeAfterMs: number | null }>

export interface ApplicationState {
  readonly chainId: number | null
  readonly openModal: ApplicationModal | null
  readonly popupList: PopupList
}

const initialState: ApplicationState = {
  chainId: null,
  openModal: null,
  popupList: [],
}

const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    updateChainId(state, action) {
      const { chainId } = action.payload
      state.chainId = chainId
    },
    setOpenModal(state, action) {
      state.openModal = action.payload
    },
    addPopup(state, { payload: { content, key, removeAfterMs = DEFAULT_TXN_DISMISS_MS } }) {
      key = key || nanoid()
      state.popupList = [
        ...state.popupList.filter((popup) => popup.key !== key),
        {
          key,
          show: true,
          content,
          removeAfterMs,
        },
      ]
    },
    removePopup(state, { payload: { key } }) {
      state.popupList = state.popupList.map((popup) => {
        if (popup.key === key) {
          popup.show = false
        }
        return popup
      })
    },
  },
})

export const { updateChainId, setOpenModal, addPopup, removePopup } = applicationSlice.actions
export default applicationSlice.reducer
