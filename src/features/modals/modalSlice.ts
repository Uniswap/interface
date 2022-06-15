import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'
import { WalletConnectModalState } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import { ModalName } from 'src/features/telemetry/constants'
import { TransactionState } from 'src/features/transactions/transactionState/transactionState'

export interface AppModalState<T> {
  isOpen: boolean
  initialState?: T
}

type WalletConnectModalParams = {
  name: ModalName.WalletConnectScan
  initialState: WalletConnectModalState
}
type SwapModalParams = { name: ModalName.Swap; initialState?: TransactionState }

type OpenModalParams = WalletConnectModalParams | SwapModalParams

export interface ModalsState {
  [ModalName.WalletConnectScan]: AppModalState<WalletConnectModalState>
  [ModalName.Swap]: AppModalState<TransactionState>
}

export const initialModalState: ModalsState = {
  [ModalName.WalletConnectScan]: {
    isOpen: false,
    initialState: WalletConnectModalState.ScanQr,
  },
  [ModalName.Swap]: {
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
export const selectWCModalState = (state: RootState): AppModalState<WalletConnectModalState> => {
  return state.modals[ModalName.WalletConnectScan]
}

export const { openModal, closeModal } = slice.actions
export const { reducer: modalsReducer, actions: modalsActions } = slice
