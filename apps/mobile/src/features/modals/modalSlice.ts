import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ExploreModalState } from 'src/app/modals/ExploreModalState'
import { TokenWarningModalState } from 'src/app/modals/TokenWarningModalState'
import { RemoveWalletModalState } from 'src/components/RemoveWallet/RemoveWalletModalState'
import { ExchangeTransferModalState } from 'src/features/fiatOnRamp/ExchangeTransferModalState'
import { ModalsState } from 'src/features/modals/ModalsState'
import { ScantasticModalState } from 'src/features/scantastic/ScantasticModalState'
import { TestnetSwitchModalState } from 'src/features/testnetMode/TestnetSwitchModalState'
import { FiatOnRampModalState } from 'src/screens/FiatOnRampModalState'
import { ReceiveCryptoModalState } from 'src/screens/ReceiveCryptoModalState'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionScreen } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { getKeys } from 'utilities/src/primitives/objects'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'

type AccountSwitcherModalParams = {
  name: typeof ModalName.AccountSwitcher
  initialState?: undefined
}

type KoreaCexTransferInfoModalParams = {
  name: typeof ModalName.KoreaCexTransferInfoModal
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
  initialState?: FiatOnRampModalState
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

type TestnetSwitchModalParams = {
  name: typeof ModalName.TestnetSwitchModal
  initialState?: TestnetSwitchModalState
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

type SendModalParams = {
  name: typeof ModalName.Send
  initialState?: TransactionState & {
    sendScreen?: TransactionScreen
  }
}

type UnitagsIntroParams = {
  name: typeof ModalName.UnitagsIntro
  initialState?: { address: Address; entryPoint: MobileScreens.Home | MobileScreens.Settings }
}

type ViewOnlyExplainerParams = {
  name: typeof ModalName.ViewOnlyExplainer
  initialState?: undefined
}

type BackupReminderParams = {
  name: typeof ModalName.BackupReminder
  initialState?: undefined
}

type BackupWarningParams = {
  name: typeof ModalName.BackupReminderWarning
  initialState?: undefined
}

type TokenWarningParams = {
  name: typeof ModalName.TokenWarning
  initialState?: TokenWarningModalState
}

export type OpenModalParams =
  | AccountSwitcherModalParams
  | BackupReminderParams
  | BackupWarningParams
  | KoreaCexTransferInfoModalParams
  | ExchangeTransferModalParams
  | ExperimentsModalParams
  | ExploreModalParams
  | FiatCurrencySelectorParams
  | FiatOnRampAggregatorModalParams
  | ReceiveCryptoModalParams
  | LanguageSelectorModalParams
  | ScantasticModalParams
  | TestnetSwitchModalParams
  | RemoveWalletModalParams
  | SendModalParams
  | SwapModalParams
  | WalletConnectModalParams
  | RestoreWalletModalParams
  | UnitagsIntroParams
  | ViewOnlyExplainerParams
  | TokenWarningParams

export type CloseModalParams = { name: keyof ModalsState }

const createInitialModalState = (overrides?: Partial<ModalsState>): ModalsState => {
  const defaultState = Object.values(ModalName).reduce((state, key) => {
    return {
      ...state,
      [key]: {
        isOpen: false,
        initialState: undefined,
      },
    }
  }, {} as ModalsState)

  return {
    ...defaultState,
    ...overrides,
  }
}

export const initialModalsState: ModalsState = createInitialModalState({
  [ModalName.ReceiveCryptoModal]: {
    isOpen: false,
    initialState: [],
  },
  [ModalName.WalletConnectScan]: {
    isOpen: false,
    initialState: ScannerModalState.ScanQr,
  },
})

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
