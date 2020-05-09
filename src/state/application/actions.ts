import { createAction } from '@reduxjs/toolkit'

export type PopupContent =
  | {
      txn: {
        hash: string
        success?: boolean
        summary?: string
      }
    }
  | {
      poolAdded: {
        token0?: {
          address?: string
          symbol?: string
        }
        token1: {
          address?: string
          symbol?: string
        }
      }
    }

export const updateBlockNumber = createAction<{ networkId: number; blockNumber: number | null }>('updateBlockNumber')
export const toggleWalletModal = createAction<void>('toggleWalletModal')
export const toggleUserAdvanced = createAction<void>('toggleUserAdvanced')
export const addPopup = createAction<{ content: PopupContent }>('addPopup')
export const removePopup = createAction<{ key: string }>('removePopup')
