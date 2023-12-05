import { ExploreModalState } from 'src/app/modals/ExploreModalState'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { RemoveWalletModalState } from 'src/components/RemoveWallet/RemoveWalletModalState'
import { ModalName } from 'src/features/telemetry/constants'
import { TransactionState } from 'wallet/src/features/transactions/transactionState/types'

export interface AppModalState<T> {
  isOpen: boolean
  initialState?: T
}

export interface ModalsState {
  [ModalName.AccountSwitcher]: AppModalState<undefined>
  [ModalName.Experiments]: AppModalState<undefined>
  [ModalName.Explore]: AppModalState<ExploreModalState>
  [ModalName.FiatCurrencySelector]: AppModalState<undefined>
  [ModalName.FiatOnRamp]: AppModalState<undefined>
  [ModalName.FiatOnRampAggregator]: AppModalState<undefined>
  [ModalName.RemoveWallet]: AppModalState<RemoveWalletModalState>
  [ModalName.RestoreWallet]: AppModalState<undefined>
  [ModalName.Send]: AppModalState<TransactionState>
  [ModalName.Swap]: AppModalState<TransactionState>
  [ModalName.WalletConnectScan]: AppModalState<ScannerModalState>
  [ModalName.UnitagsIntro]: AppModalState<undefined>
}
