import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PositionInfo } from 'components/Liquidity/types'
import { PopupType } from 'components/Popups/types'
import { ModalName, ModalNameType } from 'uniswap/src/features/telemetry/constants'

// TODO(WEB-4888): remove this type
/** @deprecated add new Modals to the ModalName object in uniswap/src/features/telemetry/constants */
export enum ApplicationModal {
  ADDRESS_CLAIM = 0,
  BLOCKED_ACCOUNT = 1,
  CLAIM_POPUP = 2,
  DELEGATE = 3,
  EXECUTE = 4,
  FEATURE_FLAGS = 5,
  FIAT_ONRAMP = 6,
  RECEIVE_CRYPTO = 7,
  RECEIVE_CRYPTO_QR = 8,
  RECOVERY_PHRASE = 9,
  PRIVACY_POLICY = 10,
  QUEUE = 11,
  SETTINGS = 12,
  VOTE = 13,
  UK_DISCLAIMER = 14,
  GET_THE_APP = 15,
}

export type LiquidityModalInitialState = PositionInfo

type AddLiquidityModalParams = {
  name: typeof ModalName.AddLiquidity
  initialState: LiquidityModalInitialState
}

type RemoveLiquidityModalParams = {
  name: typeof ModalName.RemoveLiquidity
  initialState: LiquidityModalInitialState
}

type ClaimFeeModalParams = {
  name: typeof ModalName.ClaimFee
  initialState: LiquidityModalInitialState
}

export type OpenModalParams =
  | { name: ModalNameType | ApplicationModal; initialState?: undefined }
  | AddLiquidityModalParams
  | RemoveLiquidityModalParams
  | ClaimFeeModalParams

export type CloseModalParams = ModalNameType | ApplicationModal

export interface ApplicationState {
  readonly chainId: number | null
  readonly openModal: OpenModalParams | null
  readonly suppressedPopups: PopupType[]
}

const initialState: ApplicationState = {
  chainId: null,
  openModal: null,
  suppressedPopups: [],
}

const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
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
    addSuppressedPopups(state, { payload: { popupTypes } }) {
      state.suppressedPopups = Array.from(new Set([...state.suppressedPopups, ...popupTypes]))
    },
    removeSuppressedPopups(state, { payload: { popupTypes } }) {
      state.suppressedPopups = state.suppressedPopups.filter((type) => !popupTypes.includes(type))
    },
  },
})

export const { updateChainId, setOpenModal, setCloseModal, addSuppressedPopups, removeSuppressedPopups } =
  applicationSlice.actions
export default applicationSlice.reducer
