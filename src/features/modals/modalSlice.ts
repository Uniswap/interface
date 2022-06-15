import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { WalletConnectModalState } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import { ModalName } from 'src/features/telemetry/constants'
import { TransactionState } from 'src/features/transactions/slice'

export interface AppModalState<T> {
  isOpen: boolean
  initialState?: T
}

type OpenModalParams = {
  name: ModalName.WalletConnectScan
  initialState: WalletConnectModalState
} // TODO: union with other param types here

export interface ModalsState {
  [ModalName.WalletConnectScan]: AppModalState<WalletConnectModalState>
  [ModalName.Account]: AppModalState<TransactionState>
}

export const initialModalState: ModalsState = {
  [ModalName.WalletConnectScan]: {
    isOpen: false,
    initialState: WalletConnectModalState.ScanQr,
  },
  [ModalName.Account]: {
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

export const { openModal, closeModal } = slice.actions
export const { reducer: modalsReducer, actions: modalsActions } = slice
