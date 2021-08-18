import { createAction } from '@reduxjs/toolkit'

export interface WhitelistItem {
  account: string
  amount: string
}

export const updateClaimWhitelist = createAction<{ whitelist: WhitelistItem[] }>('claim/updateClaimWhitelist')
export const updateClaimTxConfirmed = createAction<boolean>('claim/updateClaimTxConfirmed')
