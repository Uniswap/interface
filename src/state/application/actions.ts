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

export const updateBlockNumber = createAction<{ chainId: number; blockNumber: number }>('updateBlockNumber')
export const toggleWalletModal = createAction<void>('toggleWalletModal')
export const addPopup = createAction<{ content: PopupContent }>('addPopup')
export const removePopup = createAction<{ key: string }>('removePopup')
