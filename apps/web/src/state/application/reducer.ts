import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { ModalName, ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { PopupType } from '~/state/popups/types'
import type { AuthenticatorProvider } from '~/types/authenticatorProvider'
import { ReceiveCryptoModalInitialState } from '~/types/receiveCryptoModal'

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

type DeletePasskeyModalInitialState = {
  authenticatorId: string
  authenticatorLabel: string
  authenticatorProvider: AuthenticatorProvider
  isLastAuthenticator: boolean
  // Unix ms of the most recent successful seed phrase export, or undefined if never exported.
  lastExportedMs?: number
}

export type DeletePasskeyModalParams = {
  name: typeof ModalName.DeletePasskey
  initialState: DeletePasskeyModalInitialState
}

type RemoveBackupLoginModalInitialState = {
  recoveryMethodType: string
  recoveryMethodIdentifier?: string
  // Explicit wallet id for contexts without an active session (e.g. recover-with-email rotation).
  // Falls back to the embedded-wallet store when omitted.
  walletId?: string
}

export type RemoveBackupLoginModalParams = {
  name: typeof ModalName.RemoveBackupLogin
  initialState: RemoveBackupLoginModalInitialState
}

type DataApiOutageModalInitialState = {
  dataUpdatedAt?: number
}

export type DataApiOutageModalParams = {
  name: typeof ModalName.DataApiOutage
  initialState: DataApiOutageModalInitialState
}

type RecoverWalletModalInitialState = {
  initialMethod?: 'email'
}

export type RecoverWalletModalParams = {
  name: typeof ModalName.RecoverWallet
  initialState: RecoverWalletModalInitialState
}

type GetTheAppModalInitialState = {
  initialInnerPage?: 'mobile'
}

export type GetTheAppModalParams = {
  name: typeof ModalName.GetTheApp
  initialState: GetTheAppModalInitialState
}

type UnitagRateLimitSpeedbumpModalInitialState = {
  walletAddress: string
  walletId: string
  exported?: boolean
}

export type UnitagRateLimitSpeedbumpModalParams = {
  name: typeof ModalName.UnitagRateLimitSpeedbump
  initialState: UnitagRateLimitSpeedbumpModalInitialState
}

export type OpenModalParams =
  | { name: ModalNameType; initialState?: undefined }
  | AddLiquidityModalParams
  | RemoveLiquidityModalParams
  | ClaimFeeModalParams
  | BlockedAccountModalParams
  | ReceiveCryptoModalParams
  | DeletePasskeyModalParams
  | RemoveBackupLoginModalParams
  | DataApiOutageModalParams
  | RecoverWalletModalParams
  | GetTheAppModalParams
  | UnitagRateLimitSpeedbumpModalParams

type CloseModalParams = ModalNameType

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
    resetApplication: () => initialState,
  },
})

export const {
  updateChainId,
  setOpenModal,
  setCloseModal,
  addSuppressedPopups,
  removeSuppressedPopups,
  resetApplication,
} = applicationSlice.actions
export default applicationSlice.reducer
