import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from 'src/app/rootReducer'
import { Account } from 'src/features/wallet/accounts/types'
import { areAddressesEqual, normalizeAddress } from 'src/utils/addresses'

interface Wallet {
  isUnlocked: boolean
  accounts: Record<Address, Account>
  activeAccount: Account | null
}

const initialState: Wallet = {
  isUnlocked: false,
  accounts: {},
  activeAccount: null,
}

const slice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    addAccount: (state, action: PayloadAction<Account>) => {
      const { address } = action.payload
      const id = normalizeAddress(address)
      state.accounts[id] = action.payload
    },
    removeAccount: (state, action: PayloadAction<Address>) => {
      const address = action.payload
      const id = normalizeAddress(address)
      if (!state.accounts[id]) throw new Error(`Cannot remove missing account ${id}`)
      delete state.accounts[id]
      // If removed account was active, activate first one
      if (state.activeAccount && areAddressesEqual(state.activeAccount.address, address)) {
        const firstAccountId = Object.keys(state.accounts)[0]
        state.activeAccount = state.accounts[firstAccountId]
      }
    },
    editAccount: (state, action: PayloadAction<{ address: Address; updatedAccount: Account }>) => {
      const { address, updatedAccount } = action.payload
      const id = normalizeAddress(address)
      if (!state.accounts[id]) throw new Error(`Cannot edit missing account ${id}`)
      state.accounts[id] = updatedAccount
    },
    activateAccount: (state, action: PayloadAction<Address>) => {
      const address = action.payload
      const id = normalizeAddress(address)
      if (!state.accounts[id]) throw new Error(`Cannot activate missing account ${id}`)
      state.activeAccount = state.accounts[id]
    },
    unlockWallet: (state) => {
      state.isUnlocked = true
    },
    resetWallet: () => initialState,
  },
})

export const accountsSelector = (state: RootState) => state.wallet.accounts
export const activeAccountSelector = (state: RootState) => state.wallet.activeAccount

export const {
  addAccount,
  removeAccount,
  editAccount,
  activateAccount,
  unlockWallet,
  resetWallet,
} = slice.actions

export const walletReducer = slice.reducer
