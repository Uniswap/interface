export enum ReceiveModalState {
  DEFAULT = 0,
  CEX_TRANSFER = 1,
  QR_CODE = 2,
}

export type ReceiveCryptoModalInitialState =
  | { modalState: Exclude<ReceiveModalState, ReceiveModalState.QR_CODE> | undefined; qrCodeAddress?: undefined }
  | { modalState: ReceiveModalState.QR_CODE; qrCodeAddress: string }
