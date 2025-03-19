import { ExploreModalState } from 'src/app/modals/ExploreModalState'
import { TokenWarningModalState } from 'src/app/modals/TokenWarningModalState'
import { RemoveWalletModalState } from 'src/components/RemoveWallet/RemoveWalletModalState'
import { ConnectionsDappsListModalState } from 'src/components/Settings/ConnectionsDappModal/ConnectionsDappsListModalState'
import { EditWalletSettingsModalState } from 'src/components/Settings/EditWalletModal/EditWalletSettingsModalState'
import { ManageWalletsModalState } from 'src/components/Settings/ManageWalletsModalState'
import { ScantasticModalState } from 'src/features/scantastic/ScantasticModalState'
import { TestnetSwitchModalState } from 'src/features/testnetMode/TestnetSwitchModalState'
import { FiatOnRampModalState } from 'src/screens/FiatOnRampModalState'
import { ReceiveCryptoModalState } from 'src/screens/ReceiveCryptoModalState'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionScreen } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'

export interface AppModalState<T> {
  isOpen: boolean
  initialState?: T
}

export interface ModalsState {
  [ModalName.AccountSwitcher]: AppModalState<undefined>
  [ModalName.BackupReminder]: AppModalState<undefined>
  [ModalName.BackupReminderWarning]: AppModalState<undefined>
  [ModalName.BiometricsModal]: AppModalState<undefined>
  [ModalName.ConnectionsDappListModal]: AppModalState<ConnectionsDappsListModalState>
  [ModalName.EditLabelSettingsModal]: AppModalState<EditWalletSettingsModalState>
  [ModalName.EditProfileSettingsModal]: AppModalState<EditWalletSettingsModalState>
  [ModalName.Experiments]: AppModalState<undefined>
  [ModalName.Explore]: AppModalState<ExploreModalState>
  [ModalName.FiatCurrencySelector]: AppModalState<undefined>
  [ModalName.FiatOnRampAggregator]: AppModalState<FiatOnRampModalState>
  [ModalName.ConnectionsDappListModal]: AppModalState<ConnectionsDappsListModalState>
  [ModalName.ReceiveCryptoModal]: AppModalState<ReceiveCryptoModalState>
  [ModalName.LanguageSelector]: AppModalState<undefined>
  [ModalName.PortfolioBalanceModal]: AppModalState<undefined>
  [ModalName.PermissionsModal]: AppModalState<undefined>
  [ModalName.ManageWalletsModal]: AppModalState<ManageWalletsModalState>
  [ModalName.QueuedOrderModal]: AppModalState<undefined>
  [ModalName.RemoveWallet]: AppModalState<RemoveWalletModalState>
  [ModalName.RestoreWallet]: AppModalState<undefined>
  [ModalName.Scantastic]: AppModalState<ScantasticModalState>
  [ModalName.Send]: AppModalState<TransactionState & { sendScreen: TransactionScreen }>
  [ModalName.Swap]: AppModalState<TransactionState>
  [ModalName.TestnetSwitchModal]: AppModalState<TestnetSwitchModalState>
  [ModalName.SettingsAppearance]: AppModalState<undefined>
  [ModalName.UnitagsIntro]: AppModalState<{
    address: Address
    entryPoint: MobileScreens.Home | MobileScreens.Settings
  }>
  [ModalName.ViewOnlyExplainer]: AppModalState<undefined>
  [ModalName.WalletConnectScan]: AppModalState<ScannerModalState>
  [ModalName.TokenWarning]: AppModalState<TokenWarningModalState>
}
