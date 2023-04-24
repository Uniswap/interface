import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { getAddress } from 'ethers/lib/utils'

import { Account } from 'wallet/src/features/wallet/types'

export interface WalletState {
  accounts: Record<string, Account>
}

export const initialWalletState: WalletState = {
  accounts: {},
}

const slice = createSlice({
  name: 'wallet',
  initialState: initialWalletState,
  reducers: {
    addAccounts: (state, action: PayloadAction<Account[]>) => {
      const accounts = action.payload
      accounts.forEach((account) => {
        const id = getAddress(account.address)
        state.accounts[id] = account
      })
    },

    resetWallet: () => initialWalletState,
  },
})

export const { addAccounts, resetWallet } = slice.actions

export const walletReducer = slice.reducer
