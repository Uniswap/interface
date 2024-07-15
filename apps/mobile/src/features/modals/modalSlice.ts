import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ExploreModalState } from 'src/app/modals/ExploreModalState'
import { RemoveWalletModalState } from 'src/components/RemoveWallet/RemoveWalletModalState'
import { ExchangeTransferModalState } from 'src/features/fiatOnRamp/ExchangeTransferModalState'
import { ModalsState } from 'src/features/modals/ModalsState'
import { ScantasticModalState } from 'src/features/scantastic/ScantasticModalState'
import { ReceiveCryptoModalState } from 'src/screens/ReceiveCryptoModalState'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionState } from 'uniswap/src/features/transactions/transactionState/types'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { getKeys } from 'utilities/src/primitives/objects'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'

type AccountSwitcherModalParams = {
  name: typeof ModalName.AccountSwitcher
  initialState?: undefined
}

type ExchangeTransferModalParams = {
  name: typeof ModalName.ExchangeTransferModal
  initialState?: ExchangeTransferModalState
}

type ExperimentsModalParams = { name: typeof ModalName.Experiments; initialState?: undefined }

type ExploreModalParams = {
  name: typeof ModalName.Explore
  initialState?: ExploreModalState
}

type FiatCurrencySelectorParams = {
  name: typeof ModalName.FiatCurrencySelector
  initialState?: undefined
}

type FiatOnRampAggregatorModalParams = {
  name: typeof ModalName.FiatOnRampAggregator
  initialState?: undefined
}

type ReceiveCryptoModalParams = {
  name: typeof ModalName.ReceiveCryptoModal
  initialState: ReceiveCryptoModalState
}

type LanguageSelectorModalParams = {
  name: typeof ModalName.LanguageSelector
  initialState?: undefined
}

type ScantasticModalParams = {
  name: typeof ModalName.Scantastic
  initialState: ScantasticModalState
}

type RemoveWalletModalParams = {
  name: typeof ModalName.RemoveWallet
  initialState?: RemoveWalletModalState
}

type RestoreWalletModalParams = { name: typeof ModalName.RestoreWallet; initialState?: undefined }

type WalletConnectModalParams = {
  name: typeof ModalName.WalletConnectScan
  initialState: ScannerModalState
}

type SwapModalParams = { name: typeof ModalName.Swap; initialState?: TransactionState }

type SendModalParams = { name: typeof ModalName.Send; initialState?: TransactionState }

type UnitagsIntroParams = {
  name: typeof ModalName.UnitagsIntro
  initialState?: { address: Address; entryPoint: MobileScreens.Home | MobileScreens.Settings }
}

type ViewOnlyExplainerParams = {
  name: typeof ModalName.ViewOnlyExplainer
  initialState?: undefined
}

export type OpenModalParams =
  | AccountSwitcherModalParams
  | ExchangeTransferModalParams
  | ExperimentsModalParams
  | ExploreModalParams
  | FiatCurrencySelectorParams
  | FiatOnRampAggregatorModalParams
  | ReceiveCryptoModalParams
  | LanguageSelectorModalParams
  | ScantasticModalParams
  | RemoveWalletModalParams
  | SendModalParams
  | SwapModalParams
  | WalletConnectModalParams
  | RestoreWalletModalParams
  | UnitagsIntroParams
  | ViewOnlyExplainerParams

export type CloseModalParams = { name: keyof ModalsState }

export const initialModalsState: ModalsState = {
  [ModalName.ExchangeTransferModal]: {
    isOpen: false,
    initialState: undefined,
  },
  [ModalName.FiatOnRampAggregator]: {
    isOpen: false,
    initialState: undefined,
  },
  [ModalName.ReceiveCryptoModal]: {
    isOpen: false,
    initialState: [],
  },
  [ModalName.WalletConnectScan]: {
    isOpen: false,
    initialState: ScannerModalState.ScanQr,
  },
  [ModalName.Scantastic]: {
    isOpen: false,
    initialState: undefined,
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
  [ModalName.LanguageSelector]: {
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
  [ModalName.ViewOnlyExplainer]: {
    isOpen: false,
    initialState: undefined,
  },
  [ModalName.QueuedOrderModal]: {
    isOpen: false,
    initialState: undefined,
  },
}

const slice = createSlice({
  name: 'modals',
  initialState: initialModalsState,
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
