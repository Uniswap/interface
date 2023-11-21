import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ExploreModalState } from 'src/app/modals/ExploreModalState'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { RemoveWalletModalState } from 'src/components/RemoveWallet/RemoveWalletModalState'
import { ModalName } from 'src/features/telemetry/constants'
import { getKeys } from 'utilities/src/primitives/objects'
import { TransactionState } from 'wallet/src/features/transactions/transactionState/types'
import { ModalsState } from './ModalsState'

type AccountSwitcherModalParams = { name: ModalName.AccountSwitcher; initialState?: undefined }

type ExperimentsModalParams = { name: ModalName.Experiments; initialState?: undefined }

type ExploreModalParams = {
  name: ModalName.Explore
  initialState?: ExploreModalState
}

type FiatCurrencySelectorParams = { name: ModalName.FiatCurrencySelector; initialState?: undefined }

type FiatOnRampModalParams = { name: ModalName.FiatOnRamp; initialState?: undefined }

type FiatOnRampAggregatorModalParams = {
  name: ModalName.FiatOnRampAggregator
  initialState?: undefined
}
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

type UnitagsIntroParams = { name: ModalName.UnitagsIntro; initialState?: undefined }

export type OpenModalParams =
  | AccountSwitcherModalParams
  | ExperimentsModalParams
  | ExploreModalParams
  | FiatCurrencySelectorParams
  | FiatOnRampModalParams
  | FiatOnRampAggregatorModalParams
  | RemoveWalletModalParams
  | SendModalParams
  | SwapModalParams
  | WalletConnectModalParams
  | RestoreWalletModalParams
  | UnitagsIntroParams

export type CloseModalParams = { name: keyof ModalsState }

export const initialModalState: ModalsState = {
  [ModalName.FiatOnRamp]: {
    isOpen: false,
    initialState: undefined,
  },
  [ModalName.FiatOnRampAggregator]: {
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
  [ModalName.FiatCurrencySelector]: {
    isOpen: false,
    initialState: undefined,
  },
  [ModalName.UnitagsIntro]: {
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
    closeModal: (state, action: PayloadAction<CloseModalParams>) => {
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

export const { openModal, closeModal, closeAllModals } = slice.actions
export const { reducer: modalsReducer } = slice
