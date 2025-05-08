import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ModalsState } from 'src/features/modals/ModalsState'
import { FiatOnRampModalState } from 'src/screens/FiatOnRampModalState'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionScreen } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { getKeys } from 'utilities/src/primitives/objects'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'

/**
 * *********** DEPRECATION NOTICE ***********
 *
 * This modal system is deprecated in favor of React Navigation.
 * Please do not add any new modals to this redux slice.
 * See apps/mobile/src/app/navigation/navigation.tsx
 *
 * *********** DEPRECATION NOTICE ***********
 */

type FiatOnRampAggregatorModalParams = {
  name: typeof ModalName.FiatOnRampAggregator
  initialState?: FiatOnRampModalState
}

type LanguageSelectorModalParams = {
  name: typeof ModalName.LanguageSelector
  initialState?: undefined
}

type SettingsAppearanceModalParams = {
  name: typeof ModalName.SettingsAppearance
  initialState?: undefined
}

type PortfolioBalanceModalParams = {
  name: typeof ModalName.PortfolioBalanceModal
  initialState?: undefined
}

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

type PermissionsModalParams = {
  name: typeof ModalName.PermissionsModal
  initialState?: undefined
}

export type OpenModalParams =
  | FiatOnRampAggregatorModalParams
  | PortfolioBalanceModalParams
  | PermissionsModalParams
  | LanguageSelectorModalParams
  | SendModalParams
  | SettingsAppearanceModalParams
  | SwapModalParams
  | WalletConnectModalParams

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
