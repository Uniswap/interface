import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'

export enum ReceiveModalState {
  DEFAULT = 0,
  CEX_TRANSFER = 1,
  QR_CODE = 2,
  CEX_TRANSFER_CHOOSE_PLATFORM = 3,
}

export type ReceiveCryptoModalInitialState =
  | {
      modalState: Exclude<ReceiveModalState, ReceiveModalState.QR_CODE | ReceiveModalState.CEX_TRANSFER_CHOOSE_PLATFORM>
    }
  | { modalState: ReceiveModalState.QR_CODE; qrCodeAddress: string }
  | { modalState: ReceiveModalState.CEX_TRANSFER_CHOOSE_PLATFORM; serviceProvider: FORServiceProvider }
