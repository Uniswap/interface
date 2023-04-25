import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { getAddress } from 'ethers/lib/utils'

import { Account } from 'wallet/src/features/wallet/types'
import { getValidAddress } from 'wallet/src/utils/addresses'

export interface WalletState {
  accounts: Record<string, Account>
  activeAccountAddress: Address | null
}

export const initialWalletState: WalletState = {
  accounts: {},
  activeAccountAddress: null,
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
    activateAccount: (state, action: PayloadAction<Address>) => {
      const address = action.payload
      const id = getValidAddress(address, true)
      if (!id)
        throw new Error('Cannot activate an account with an invalid address')
      if (!state.accounts[id])
        throw new Error(`Cannot activate missing account ${id}`)
      state.activeAccountAddress = id
    },

    resetWallet: () => initialWalletState,
  },
})

export const { addAccounts, resetWallet, activateAccount } = slice.actions

export const walletReducer = slice.reducer
