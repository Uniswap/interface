import { FiatOnRampModalState } from 'src/screens/FiatOnRampModalState'
import { ScannerModalState } from 'uniswap/src/components/ReceiveQRCode/constants'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionScreen } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'

export interface AppModalState<T> {
  isOpen: boolean
  initialState?: T
}

export interface ModalsState {
  [ModalName.Experiments]: AppModalState<undefined>
  [ModalName.FiatOnRampAggregator]: AppModalState<FiatOnRampModalState>
  [ModalName.QueuedOrderModal]: AppModalState<undefined>
  [ModalName.Send]: AppModalState<TransactionState & { sendScreen?: TransactionScreen }>
  [ModalName.WalletConnectScan]: AppModalState<ScannerModalState>
}
