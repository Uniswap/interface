import { ExploreModalState } from 'src/app/modals/ExploreModalState'
import { RemoveWalletModalState } from 'src/components/RemoveWallet/RemoveWalletModalState'
import { ScantasticModalState } from 'src/features/scantastic/ScantasticModalState'
import { ReceiveCryptoModalState } from 'src/screens/ReceiveCryptoModalState'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'
import { TransactionState } from 'wallet/src/features/transactions/transactionState/types'

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
  [ModalName.QueuedOrderModal]: AppModalState<undefined>
  [ModalName.RemoveWallet]: AppModalState<RemoveWalletModalState>
  [ModalName.RestoreWallet]: AppModalState<undefined>
  [ModalName.Scantastic]: AppModalState<ScantasticModalState>
  [ModalName.Send]: AppModalState<TransactionState>
  [ModalName.Swap]: AppModalState<TransactionState>
  [ModalName.UnitagsIntro]: AppModalState<{
    address: Address
    entryPoint: MobileScreens.Home | MobileScreens.Settings
  }>
  [ModalName.ViewOnlyExplainer]: AppModalState<undefined>
  [ModalName.WalletConnectScan]: AppModalState<ScannerModalState>
}
