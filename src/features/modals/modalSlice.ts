import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { ModalName } from 'src/features/telemetry/constants'
import { TransactionState } from 'src/features/transactions/transactionState/transactionState'

export interface AppModalState<T> {
  isOpen: boolean
  initialState?: T
}

type ExperimentsModalParams = { name: ModalName.Experiments; initialState?: undefined }

type FiatOnRampModalParams = { name: ModalName.FiatOnRamp; initialState?: undefined }

type WalletConnectModalParams = {
  name: ModalName.WalletConnectScan
  initialState: ScannerModalState
}
type SwapModalParams = { name: ModalName.Swap; initialState?: TransactionState }

type SendModalParams = { name: ModalName.Send; initialState?: TransactionState }

type OpenModalParams =
  | ExperimentsModalParams
  | FiatOnRampModalParams
  | SendModalParams
  | SwapModalParams
  | WalletConnectModalParams

export interface ModalsState {
  [ModalName.Experiments]: AppModalState<undefined>
  [ModalName.FiatOnRamp]: AppModalState<undefined>
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
  },
})

export function selectModalState<T extends keyof ModalsState>(
  name: T
): (state: RootState) => ModalsState[T] {
  return (state) => state.modals[name]
}

export function selectSomeModalOpen(state: RootState) {
  return Object.values(state).some((modalState) => modalState.isOpen)
}

export const { openModal, closeModal } = slice.actions
export const { reducer: modalsReducer } = slice
