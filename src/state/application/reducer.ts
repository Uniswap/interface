import { createSlice, nanoid } from '@reduxjs/toolkit'
import { ChainId } from '@thinkincoin-libs/sdk-core'
import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'

export type PopupContent =
  | {
      txn: {
        hash: string
      }
    }
  | {
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
  WALLET,
  UNISWAP_NFT_AIRDROP_CLAIM,
}

type PopupList = Array<{ key: string; show: boolean; content: PopupContent; removeAfterMs: number | null }>

export interface ApplicationState {
  readonly chainId: number | null
  readonly fiatOnramp: { available: boolean; availabilityChecked: boolean }
  readonly openModal: ApplicationModal | null
  readonly popupList: PopupList
}

const initialState: ApplicationState = {
  fiatOnramp: { available: false, availabilityChecked: false },
  chainId: null,
  openModal: null,
  popupList: [],
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

export const { updateChainId, setFiatOnrampAvailability, setOpenModal, addPopup, removePopup } =
  applicationSlice.actions
export default applicationSlice.reducer
