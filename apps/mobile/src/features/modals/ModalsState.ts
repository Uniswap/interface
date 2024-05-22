import { ExploreModalState } from 'src/app/modals/ExploreModalState'
import { RemoveWalletModalState } from 'src/components/RemoveWallet/RemoveWalletModalState'
import { ExtensionWaitlistModalState } from 'src/features/scantastic/ExtensionWaitlistModalState'
import { ScantasticModalState } from 'src/features/scantastic/ScantasticModalState'
import { ReceiveCryptoModalState } from 'src/screens/ReceiveCryptoModalState'
import { Screens } from 'src/screens/Screens'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'
import { FORServiceProvider } from 'wallet/src/features/fiatOnRamp/types'
import { TransactionState } from 'wallet/src/features/transactions/transactionState/types'
import { ModalName } from 'wallet/src/telemetry/constants'

export interface AppModalState<T> {
  isOpen: boolean
  initialState?: T
}

export interface ModalsState {
  [ModalName.AccountSwitcher]: AppModalState<undefined>
  [ModalName.ExchangeTransferModal]: AppModalState<{
    serviceProvider: FORServiceProvider
  }>
  [ModalName.Experiments]: AppModalState<undefined>
  [ModalName.Explore]: AppModalState<ExploreModalState>
  [ModalName.FiatCurrencySelector]: AppModalState<undefined>
  [ModalName.FiatOnRamp]: AppModalState<undefined>
  [ModalName.FiatOnRampAggregator]: AppModalState<undefined>
  [ModalName.ReceiveCryptoModal]: AppModalState<ReceiveCryptoModalState>
  [ModalName.LanguageSelector]: AppModalState<undefined>
  [ModalName.RemoveWallet]: AppModalState<RemoveWalletModalState>
  [ModalName.RestoreWallet]: AppModalState<undefined>
  [ModalName.Scantastic]: AppModalState<ScantasticModalState>
  [ModalName.ExtensionWaitlistModal]: AppModalState<ExtensionWaitlistModalState>
  [ModalName.Send]: AppModalState<TransactionState>
  [ModalName.Swap]: AppModalState<TransactionState>
  [ModalName.UnitagsIntro]: AppModalState<{
    address: Address
    entryPoint: Screens.Home | Screens.Settings
  }>
  [ModalName.ViewOnlyExplainer]: AppModalState<undefined>
  [ModalName.WalletConnectScan]: AppModalState<ScannerModalState>
}
