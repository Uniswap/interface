import { createAction } from '@reduxjs/toolkit'
import { ChainId } from 'dxswap-sdk'

export type PopupContent = {
  txn?: {
    hash: string
    success: boolean
    summary?: string
  }
  newNetworkChainId?: ChainId
}

export enum ApplicationModal {
  WALLET,
  SETTINGS,
  SELF_CLAIM,
  ADDRESS_CLAIM,
  CLAIM_POPUP,
  MENU,
  MOBILE,
  NETWORK_SWITCHER
}

export const updateBlockNumber = createAction<{ chainId: number; blockNumber: number }>('application/updateBlockNumber')
export const updateBlockGasLimit = createAction<{ chainId: number; blockGasLimit: string }>(
  'application/updateBlockGasLimit'
)
export const setOpenModal = createAction<ApplicationModal | null>('application/setOpenModal')
export const addPopup = createAction<{ key?: string; removeAfterMs?: number | null; content: PopupContent }>(
  'application/addPopup'
)
export const removePopup = createAction<{ key: string }>('application/removePopup')
