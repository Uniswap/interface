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
  FIAT_ONRAMP,
  MENU,
  METAMASK_CONNECTION_ERROR,
  NETWORK_SELECTOR,
  POOL_OVERVIEW_OPTIONS,
  POOL_VERSION,
  PRIVACY_POLICY,
  QUEUE,
  SELF_CLAIM,
  SETTINGS,
  SHARE,
  TAX_SERVICE,
  VOTE,
  UK_DISCLAIMER,
  GET_THE_APP,
}

export type PopupList = Array<{ key: string; show: boolean; content: PopupContent; removeAfterMs: number | null }>

export interface ApplicationState {
  readonly chainId: number | null
  readonly fiatOnramp: { available: boolean; availabilityChecked: boolean }
  readonly openModal: ApplicationModal | null
  readonly popupList: PopupList
  readonly suppressedPopups: PopupType[]
}

const initialState: ApplicationState = {
  fiatOnramp: { available: false, availabilityChecked: false },
  chainId: null,
  openModal: null,
  popupList: [],
  suppressedPopups: [],
}

const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    setFiatOnrampAvailability(state, { payload: available }) {
      state.fiatOnramp = { available, availabilityChecked: true }
    },
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
          show: !state.suppressedPopups.includes(content.type),
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
    addSuppressedPopups(state, { payload: { popupTypes } }) {
      state.suppressedPopups = Array.from(new Set([...state.suppressedPopups, ...popupTypes]))
    },
    removeSuppressedPopups(state, { payload: { popupTypes } }) {
      state.suppressedPopups = state.suppressedPopups.filter((type) => !popupTypes.includes(type))
    },
  },
})

export const {
  updateChainId,
  setFiatOnrampAvailability,
  setOpenModal,
  addPopup,
  removePopup,
  addSuppressedPopups,
  removeSuppressedPopups,
} = applicationSlice.actions
export default applicationSlice.reducer
