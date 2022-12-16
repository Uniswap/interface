import { createSlice, nanoid } from '@reduxjs/toolkit'
import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'

import { SupportedChainId } from '../../constants/chains'

export type PopupContent =
  | {
      txn: {
        hash: string
      }
    }
  | {
      failedSwitchNetwork: SupportedChainId
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
  NETWORK_FILTER,
  NETWORK_SELECTOR,
  POOL_OVERVIEW_OPTIONS,
  PRIVACY_POLICY,
  QUEUE,
  SELF_CLAIM,
  SETTINGS,
  SHARE,
  TIME_SELECTOR,
  VOTE,
  WALLET,
  WALLET_DROPDOWN,
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
      state.popupList = (key ? state.popupList.filter((popup) => popup.key !== key) : state.popupList).concat([
        {
          key: key || nanoid(),
          show: true,
          content,
          removeAfterMs,
        },
      ])
    },
    removePopup(state, { payload: { key } }) {
      state.popupList.forEach((p) => {
        if (p.key === key) {
          p.show = false
        }
      })
    },
  },
})

export const { updateChainId, setFiatOnrampAvailability, setOpenModal, addPopup, removePopup } =
  applicationSlice.actions
export default applicationSlice.reducer
