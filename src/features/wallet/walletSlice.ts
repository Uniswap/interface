import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AccountStub } from 'src/features/wallet/accounts/types'
import { normalizeAddress } from 'src/utils/addresses'

interface Wallet {
  isUnlocked: boolean
  accounts: Record<Address, AccountStub>
  activeAccount: AccountStub | null
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
    addAccount: (state, action: PayloadAction<AccountStub>) => {
      const { address } = action.payload
      const id = normalizeAddress(address)
      state.accounts[id] = action.payload
    },
    removeAccount: (state, action: PayloadAction<{ address: Address }>) => {
      const { address } = action.payload
      const id = normalizeAddress(address)
      delete state.accounts[id]
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

export const { addAccount, removeAccount, activateAccount, unlockWallet, resetWallet } =
  slice.actions

export const walletReducer = slice.reducer
