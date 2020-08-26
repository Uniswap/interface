import { createAction } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists'

export type PopupContent =
  | {
      txn: {
        hash: string
        success: boolean
        summary?: string
      }
    }
  | {
      listUpdate: {
        listUrl: string
        oldList: TokenList
        newList: TokenList
        auto: boolean
      }
    }

export const updateBlockNumber = createAction<{ chainId: number; blockNumber: number }>('updateBlockNumber')
export const toggleWalletModal = createAction<void>('toggleWalletModal')
export const toggleSettingsMenu = createAction<void>('toggleSettingsMenu')
export const addPopup = createAction<{ key?: string; removeAfterMs?: number | null; content: PopupContent }>('addPopup')
export const removePopup = createAction<{ key: string }>('removePopup')
