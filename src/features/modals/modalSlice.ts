import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { ModalName } from 'src/features/telemetry/constants'
import { TransactionState } from 'src/features/transactions/transactionState/transactionState'

export interface AppModalState<T> {
  isOpen: boolean
  initialState?: T
}

type WalletConnectModalParams = {
  name: ModalName.WalletConnectScan
  initialState: ScannerModalState
}
type SwapModalParams = { name: ModalName.Swap; initialState?: TransactionState }

type SendModalParams = { name: ModalName.Send; initialState?: TransactionState }

type ExperimentsModalParams = { name: ModalName.Experiments; initialState?: undefined }

type OpenModalParams =
  | WalletConnectModalParams
  | SwapModalParams
  | SendModalParams
  | ExperimentsModalParams

export interface ModalsState {
  [ModalName.WalletConnectScan]: AppModalState<ScannerModalState>
  [ModalName.Swap]: AppModalState<TransactionState>
  [ModalName.Send]: AppModalState<TransactionState>
  [ModalName.Experiments]: AppModalState<TransactionState>
}

export const initialModalState: ModalsState = {
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

// TODO: combine both of these using a selector factory while preserving return types
export const selectSwapModalState = (state: RootState): AppModalState<TransactionState> => {
  return state.modals[ModalName.Swap]
}
export const selectSendModalState = (state: RootState): AppModalState<TransactionState> => {
  return state.modals[ModalName.Send]
}
export const selectWCModalState = (state: RootState): AppModalState<ScannerModalState> => {
  return state.modals[ModalName.WalletConnectScan]
}
export const selectExperimentsState = (state: RootState): AppModalState<any> => {
  return state.modals[ModalName.Experiments]
}
export const selectModalsState = (state: RootState): ModalsState => {
  return state.modals
}

export const { openModal, closeModal } = slice.actions
export const { reducer: modalsReducer, actions: modalsActions } = slice
