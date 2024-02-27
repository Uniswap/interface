import { ExploreModalState } from 'src/app/modals/ExploreModalState'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { RemoveWalletModalState } from 'src/components/RemoveWallet/RemoveWalletModalState'
import { ScantasticModalState } from 'src/features/scantastic/ScantasticModalState'
import { Screens } from 'src/screens/Screens'
import { FORTransferInstitution } from 'wallet/src/features/fiatOnRamp/types'
import { TransactionState } from 'wallet/src/features/transactions/transactionState/types'
import { ModalName } from 'wallet/src/telemetry/constants'

export interface AppModalState<T> {
  isOpen: boolean
  initialState?: T
}

export interface ModalsState {
  [ModalName.AccountSwitcher]: AppModalState<undefined>
  [ModalName.ExchangeTransferModal]: AppModalState<{
    serviceProvider: FORTransferInstitution
  }>
  [ModalName.Experiments]: AppModalState<undefined>
  [ModalName.Explore]: AppModalState<ExploreModalState>
  [ModalName.FiatCurrencySelector]: AppModalState<undefined>
  [ModalName.FiatOnRamp]: AppModalState<undefined>
  [ModalName.FiatOnRampAggregator]: AppModalState<undefined>
  [ModalName.ReceiveCryptoModal]: AppModalState<undefined>
  [ModalName.LanguageSelector]: AppModalState<undefined>
  [ModalName.RemoveWallet]: AppModalState<RemoveWalletModalState>
  [ModalName.RestoreWallet]: AppModalState<undefined>
  [ModalName.Scantastic]: AppModalState<ScantasticModalState>
  [ModalName.Send]: AppModalState<TransactionState>
  [ModalName.Swap]: AppModalState<TransactionState>
  [ModalName.UnitagsIntro]: AppModalState<{
    address: Address
    entryPoint: Screens.Home | Screens.Settings
  }>
  [ModalName.ViewOnlyExplainer]: AppModalState<undefined>
  [ModalName.WalletConnectScan]: AppModalState<ScannerModalState>
}
