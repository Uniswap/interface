import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit'
import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'
import { ModalName, ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { InterfaceChainId } from 'uniswap/src/types/chains'
import { SwapTab } from 'uniswap/src/types/screens/interface'
/* eslint-disable-next-line no-restricted-imports */
import { Position } from '@uniswap/client-pools/dist/pools/v1/types_pb'

export enum PopupType {
  Transaction = 'transaction',
  Order = 'order',
  FailedSwitchNetwork = 'failedSwitchNetwork',
  SwitchNetwork = 'switchNetwork',
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
      failedSwitchNetwork: InterfaceChainId
    }
  | {
      type: PopupType.SwitchNetwork
      chainId: InterfaceChainId
      action: SwapTab
    }

// TODO(WEB-4888): remove this type
/** @deprecated add new Modals to the ModalName object in uniswap/src/features/telemetry/constants */
export enum ApplicationModal {
  ADDRESS_CLAIM,
  BLOCKED_ACCOUNT,
  CLAIM_POPUP,
  DELEGATE,
  EXECUTE,
  FEATURE_FLAGS,
  FIAT_ONRAMP,
  RECEIVE_CRYPTO,
  RECEIVE_CRYPTO_QR,
  PRIVACY_POLICY,
  QUEUE,
  SELF_CLAIM,
  SETTINGS,
  VOTE,
  UK_DISCLAIMER,
  GET_THE_APP,
}

type AddLiquidityModalParams = {
  name: typeof ModalName.AddLiquidity
  initialState: Position
}

type RemoveLiquidityModalParams = {
  name: typeof ModalName.RemoveLiquidity
  initialState?: Position
}

export type OpenModalParams =
  | { name: ApplicationModal; initialState?: undefined }
  | AddLiquidityModalParams
  | RemoveLiquidityModalParams

export type CloseModalParams = ModalNameType | ApplicationModal

export type PopupList = Array<{ key: string; show: boolean; content: PopupContent; removeAfterMs: number | null }>

export interface ApplicationState {
  readonly chainId: number | null
  readonly fiatOnramp: { available: boolean; availabilityChecked: boolean }
  readonly openModal: OpenModalParams | null
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
    setOpenModal(state, action: PayloadAction<OpenModalParams>) {
      state.openModal = action.payload
    },
    setCloseModal(state, action: PayloadAction<CloseModalParams | undefined>) {
      const { payload } = action
      if (!payload || (state.openModal?.name as any) === payload) {
        state.openModal = null
      }
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
  setCloseModal,
  addPopup,
  removePopup,
  addSuppressedPopups,
  removeSuppressedPopups,
} = applicationSlice.actions
export default applicationSlice.reducer
