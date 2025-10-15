import { atom } from 'jotai'

export enum ReceiveModalState {
  DEFAULT = 0,
  CEX_TRANSFER = 1,
  QR_CODE = 2,
}

export const receiveCryptoModalStateAtom = atom<ReceiveModalState | undefined>(undefined)
