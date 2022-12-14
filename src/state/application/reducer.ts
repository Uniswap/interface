import { createSlice, nanoid } from '@reduxjs/toolkit'
import { Currency } from '@uniswap/sdk-core'
import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'
import { USDC_MAINNET } from 'constants/tokens'

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
  UNISWAP_NFT_AIRDROP_CLAIM,
  BLOCKED_ACCOUNT,
  DELEGATE,
  CLAIM_POPUP,
  MENU,
  NETWORK_SELECTOR,
  POOL_OVERVIEW_OPTIONS,
  PRIVACY_POLICY,
  SELF_CLAIM,
  SETTINGS,
  VOTE,
  WALLET,
  WALLET_DROPDOWN,
  QUEUE,
  EXECUTE,
  TIME_SELECTOR,
  SHARE,
  NETWORK_FILTER,
  FEATURE_FLAGS,
}

type PopupList = Array<{ key: string; show: boolean; content: PopupContent; removeAfterMs: number | null }>

export interface ApplicationState {
  readonly chainId: number | null
  readonly openModal: ApplicationModal | null
  readonly popupList: PopupList
  readonly quoteCurrency: Currency
}

const initialState: ApplicationState = {
  chainId: null,
  openModal: null,
  popupList: [],
  quoteCurrency: USDC_MAINNET,
}

const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    setQuoteCurrency(state, action) {
      state.quoteCurrency = action.payload
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

export const { updateChainId, setOpenModal, addPopup, removePopup, setQuoteCurrency } = applicationSlice.actions
export default applicationSlice.reducer
