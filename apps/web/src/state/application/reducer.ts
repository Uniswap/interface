import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PositionInfo } from 'components/Liquidity/types'
import { PopupType } from 'components/Popups/types'
import { ReceiveCryptoModalInitialState } from 'components/ReceiveCryptoModal/types'
import { ModalName, ModalNameType } from 'uniswap/src/features/telemetry/constants'

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

type BlockedAccountModalParams = {
  name: typeof ModalName.BlockedAccount
  initialState: { blockedAddress?: string }
}

type ReceiveCryptoModalParams = {
  name: typeof ModalName.ReceiveCryptoModal
  initialState: ReceiveCryptoModalInitialState
}

export type OpenModalParams =
  | { name: ModalNameType; initialState?: undefined }
  | AddLiquidityModalParams
  | RemoveLiquidityModalParams
  | ClaimFeeModalParams
  | BlockedAccountModalParams
  | ReceiveCryptoModalParams

type CloseModalParams = ModalNameType

export interface ApplicationState {
  readonly chainId: number | null
  readonly openModal: OpenModalParams | null
  readonly suppressedPopups: PopupType[]
  /** List of addresses where the graduated wallet card has been dismissed for this session. The same property in the user reducer is if the card has been dismissed for 30 days. */
  readonly downloadGraduatedWalletCardsDismissed: string[]
}

const initialState: ApplicationState = {
  chainId: null,
  openModal: null,
  suppressedPopups: [],
  downloadGraduatedWalletCardsDismissed: [],
}

const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    updateDownloadGraduatedWalletCardsDismissed(
      state,
      { payload: { walletAddress } }: PayloadAction<{ walletAddress: string }>,
    ) {
      state.downloadGraduatedWalletCardsDismissed = Array.from(
        new Set([...state.downloadGraduatedWalletCardsDismissed, walletAddress]),
      )
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
  setOpenModal,
  setCloseModal,
  addSuppressedPopups,
  removeSuppressedPopups,
  updateDownloadGraduatedWalletCardsDismissed,
} = applicationSlice.actions
export default applicationSlice.reducer
