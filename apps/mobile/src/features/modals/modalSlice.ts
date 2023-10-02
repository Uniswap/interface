import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ExploreModalState } from 'src/app/modals/ExploreModalState'
import { MobileState } from 'src/app/reducer'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { RemoveWalletModalState } from 'src/components/RemoveWallet/RemoveWalletModalState'
import { ModalName } from 'src/features/telemetry/constants'
import { getKeys } from 'utilities/src/primitives/objects'
import { TransactionState } from 'wallet/src/features/transactions/transactionState/types'

export interface AppModalState<T> {
  isOpen: boolean
  initialState?: T
}

type AccountSwitcherModalParams = { name: ModalName.AccountSwitcher; initialState?: undefined }

type ExperimentsModalParams = { name: ModalName.Experiments; initialState?: undefined }

type ExploreModalParams = {
  name: ModalName.Explore
  initialState?: ExploreModalState
}

type FiatOnRampModalParams = { name: ModalName.FiatOnRamp; initialState?: undefined }

type RemoveWalletModalParams = {
  name: ModalName.RemoveWallet
  initialState?: RemoveWalletModalState
}

type RestoreWalletModalParams = { name: ModalName.RestoreWallet; initialState?: undefined }

type WalletConnectModalParams = {
  name: ModalName.WalletConnectScan
  initialState: ScannerModalState
}

type SwapModalParams = { name: ModalName.Swap; initialState?: TransactionState }

type SendModalParams = { name: ModalName.Send; initialState?: TransactionState }

export type OpenModalParams =
  | AccountSwitcherModalParams
  | ExperimentsModalParams
  | ExploreModalParams
  | FiatOnRampModalParams
  | RemoveWalletModalParams
  | SendModalParams
  | SwapModalParams
  | WalletConnectModalParams
  | RestoreWalletModalParams

export interface ModalsState {
  [ModalName.AccountSwitcher]: AppModalState<undefined>
  [ModalName.Experiments]: AppModalState<undefined>
  [ModalName.Explore]: AppModalState<ExploreModalState>
  [ModalName.FiatOnRamp]: AppModalState<undefined>
  [ModalName.RemoveWallet]: AppModalState<RemoveWalletModalState>
  [ModalName.RestoreWallet]: AppModalState<undefined>
  [ModalName.Send]: AppModalState<TransactionState>
  [ModalName.Swap]: AppModalState<TransactionState>
  [ModalName.WalletConnectScan]: AppModalState<ScannerModalState>
}

export const initialModalState: ModalsState = {
  [ModalName.FiatOnRamp]: {
    isOpen: false,
    initialState: undefined,
  },
  [ModalName.WalletConnectScan]: {
    isOpen: false,
    initialState: ScannerModalState.ScanQr,
  },
  [ModalName.Swap]: {
    isOpen: false,
    initialState: undefined,
  },
  [ModalName.Send]: {
    isOpen: false,
    initialState: undefined,
  },
  [ModalName.Experiments]: {
    isOpen: false,
    initialState: undefined,
  },
  [ModalName.Explore]: {
    isOpen: false,
    initialState: undefined,
  },
  [ModalName.AccountSwitcher]: {
    isOpen: false,
    initialState: undefined,
  },
  [ModalName.RemoveWallet]: {
    isOpen: false,
    initialState: undefined,
  },
  [ModalName.RestoreWallet]: {
    isOpen: false,
    initialState: undefined,
  },
}

const slice = createSlice({
  name: 'modals',
  initialState: initialModalState,
  reducers: {
    openModal: (state, action: PayloadAction<OpenModalParams>) => {
      const { name, initialState } = action.payload
      state[name].isOpen = true
      state[name].initialState = initialState
    },
    closeModal: (state, action: PayloadAction<{ name: keyof ModalsState }>) => {
      const { name } = action.payload
      state[name].isOpen = false
      state[name].initialState = undefined
    },
    closeAllModals: (state) => {
      getKeys(state).forEach((modalName) => {
        state[modalName].isOpen = false
        state[modalName].initialState = undefined
      })
    },
  },
})

export function selectModalState<T extends keyof ModalsState>(
  name: T
): (state: MobileState) => ModalsState[T] {
  return (state) => state.modals[name]
}

export function selectSomeModalOpen(state: MobileState): boolean {
  return Object.values(state.modals).some((modalState) => modalState.isOpen)
}

export const { openModal, closeModal, closeAllModals } = slice.actions
export const { reducer: modalsReducer } = slice
