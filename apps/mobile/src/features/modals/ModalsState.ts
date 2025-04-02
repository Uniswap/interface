import { ExploreModalState } from 'src/app/modals/ExploreModalState'
import { ConnectionsDappsListModalState } from 'src/components/Settings/ConnectionsDappModal/ConnectionsDappsListModalState'
import { EditWalletSettingsModalState } from 'src/components/Settings/EditWalletModal/EditWalletSettingsModalState'
import { ManageWalletsModalState } from 'src/components/Settings/ManageWalletsModalState'
import { FiatOnRampModalState } from 'src/screens/FiatOnRampModalState'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionScreen } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'

export interface AppModalState<T> {
  isOpen: boolean
  initialState?: T
}

export interface ModalsState {
  [ModalName.BiometricsModal]: AppModalState<undefined>
  [ModalName.ConnectionsDappListModal]: AppModalState<ConnectionsDappsListModalState>
  [ModalName.EditLabelSettingsModal]: AppModalState<EditWalletSettingsModalState>
  [ModalName.EditProfileSettingsModal]: AppModalState<EditWalletSettingsModalState>
  [ModalName.Experiments]: AppModalState<undefined>
  [ModalName.Explore]: AppModalState<ExploreModalState>
  [ModalName.FiatCurrencySelector]: AppModalState<undefined>
  [ModalName.FiatOnRampAggregator]: AppModalState<FiatOnRampModalState>
  [ModalName.ConnectionsDappListModal]: AppModalState<ConnectionsDappsListModalState>
  [ModalName.LanguageSelector]: AppModalState<undefined>
  [ModalName.PortfolioBalanceModal]: AppModalState<undefined>
  [ModalName.PermissionsModal]: AppModalState<undefined>
  [ModalName.ManageWalletsModal]: AppModalState<ManageWalletsModalState>
  [ModalName.QueuedOrderModal]: AppModalState<undefined>
  [ModalName.Send]: AppModalState<TransactionState & { sendScreen: TransactionScreen }>
  [ModalName.Swap]: AppModalState<TransactionState>
  [ModalName.SettingsAppearance]: AppModalState<undefined>
  [ModalName.WalletConnectScan]: AppModalState<ScannerModalState>
}
