import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SupportedChainId } from 'src/constants/chains'
import { AccountStub } from 'src/features/wallet/accounts/types'
import { getCaip10Id } from 'src/features/wallet/accounts/utils'

interface Wallet {
  isUnlocked: boolean
  accounts: Record<string, AccountStub> // CAIP-10 id to stub
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
      const { address, chainId } = action.payload
      const id = getCaip10Id(address, chainId)
      state.accounts[id] = action.payload
    },
    removeAccount: (
      state,
      action: PayloadAction<{ address: string; chainId: SupportedChainId }>
    ) => {
      const { address, chainId } = action.payload
      const id = getCaip10Id(address, chainId)
      delete state.accounts[id]
    },
    activateAccount: (
      state,
      action: PayloadAction<{ address: string; chainId: SupportedChainId }>
    ) => {
      const { address, chainId } = action.payload
      const id = getCaip10Id(address, chainId)
      if (!state.accounts[id]) throw new Error(`Cannot activate missing account ${address}`)
      state.activeAccount = state.accounts[id]
    },
    resetWallet: () => initialState,
  },
})

export const { addAccount, removeAccount, activateAccount, resetWallet } = slice.actions

export const walletReducer = slice.reducer
