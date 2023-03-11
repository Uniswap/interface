import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TokensOrderBy } from 'src/features/explore/types'
import { Account } from 'src/features/wallet/accounts/types'
import { NFTViewType } from 'src/features/wallet/types'
import { areAddressesEqual, getValidAddress } from 'src/utils/addresses'

export const HIDE_SMALL_USD_BALANCES_THRESHOLD = 1

export interface WalletState {
  accounts: Record<Address, Account>
  activeAccountAddress: Address | null
  finishedOnboarding?: boolean
  replaceAccountOptions: {
    isReplacingAccount: boolean
    skipToSeedPhrase: boolean
  }
  flashbotsEnabled: boolean
  isUnlocked: boolean
  // Persisted UI configs set by the user through interaction with filters and settings
  settings: {
    nftViewType?: NFTViewType
    // Settings used in the top tokens list
    tokensOrderBy?: TokensOrderBy
  }
}

export const initialWalletState: WalletState = {
  accounts: {},
  activeAccountAddress: null,
  flashbotsEnabled: false,
  isUnlocked: false,
  settings: {},
  replaceAccountOptions: {
    isReplacingAccount: false,
    skipToSeedPhrase: false,
  },
}

const slice = createSlice({
  name: 'wallet',
  initialState: initialWalletState,
  reducers: {
    addAccount: (state, action: PayloadAction<Account>) => {
      const { address } = action.payload
      const id = getValidAddress(address, true)
      if (!id) throw new Error('Cannot add an account with an invalid address')
      state.accounts[id] = action.payload
    },
    addAccounts: (state, action: PayloadAction<Account[]>) => {
      const accounts = action.payload
      accounts.forEach((account) => {
        const id = getValidAddress(account.address, true)
        if (!id) throw new Error('Cannot add an account with an invalid address')
        state.accounts[id] = account
      })
    },
    removeAccount: (state, action: PayloadAction<Address>) => {
      const address = action.payload
      const id = getValidAddress(address, true)
      if (!id) throw new Error('Cannot remove an account with an invalid address')
      if (!state.accounts[id]) throw new Error(`Cannot remove missing account ${id}`)
      delete state.accounts[id]
      // If removed account was active, reset active account to first account if it exists
      if (state.activeAccountAddress && areAddressesEqual(state.activeAccountAddress, address)) {
        const firstAccountId = Object.keys(state.accounts)[0]
        state.activeAccountAddress = firstAccountId ?? null
      }
    },
    removeAccounts: (state, action: PayloadAction<Address[]>) => {
      const addresses = action.payload
      addresses.forEach((address) => {
        const id = getValidAddress(address, true)
        if (!id) throw new Error('Cannot add an account with an invalid address')
        if (!state.accounts[id]) throw new Error(`Cannot remove missing account ${id}`)
        delete state.accounts[id]
      })
      // Reset active account to first account if it exists
      const firstAccountId = Object.keys(state.accounts)[0]
      state.activeAccountAddress = firstAccountId ?? null
    },
    markAsNonPending: (state, action: PayloadAction<Address[]>) => {
      const addresses = action.payload
      addresses.forEach((address) => {
        const id = getValidAddress(address, true)
        if (!id) throw new Error('Cannot operate on an invalid address')
        const account = state.accounts[id]
        if (!account) throw new Error(`Cannot enable missing account ${id}`)
        account.pending = false
      })
    },
    editAccount: (state, action: PayloadAction<{ address: Address; updatedAccount: Account }>) => {
      const { address, updatedAccount } = action.payload
      const id = getValidAddress(address, true)
      if (!id) throw new Error('Cannot edit an account with an invalid address')
      if (!state.accounts[id]) throw new Error(`Cannot edit missing account ${id}`)
      state.accounts[id] = updatedAccount
    },
    activateAccount: (state, action: PayloadAction<Address>) => {
      const address = action.payload
      const id = getValidAddress(address, true)
      if (!id) throw new Error('Cannot activate an account with an invalid address')
      if (!state.accounts[id]) throw new Error(`Cannot activate missing account ${id}`)
      state.activeAccountAddress = id
    },
    unlockWallet: (state) => {
      state.isUnlocked = true
    },
    toggleFlashbots: (state, action: PayloadAction<boolean>) => {
      state.flashbotsEnabled = action.payload
    },
    setFinishedOnboarding: (
      state,
      { payload: { finishedOnboarding } }: PayloadAction<{ finishedOnboarding: boolean }>
    ) => {
      state.finishedOnboarding = finishedOnboarding
    },
    setReplaceAccountOptions: (
      state,
      {
        payload: { isReplacingAccount, skipToSeedPhrase },
      }: PayloadAction<{ isReplacingAccount: boolean; skipToSeedPhrase: boolean }>
    ) => {
      state.replaceAccountOptions = { isReplacingAccount, skipToSeedPhrase }
    },
    setNFTViewType: (state, action: PayloadAction<NFTViewType>) => {
      state.settings.nftViewType = action.payload
    },
    setTokensOrderBy: (
      state,
      { payload: { newTokensOrderBy } }: PayloadAction<{ newTokensOrderBy: TokensOrderBy }>
    ) => {
      state.settings.tokensOrderBy = newTokensOrderBy
    },

    resetWallet: () => initialWalletState,
  },
})

export const {
  addAccount,
  addAccounts,
  removeAccount,
  removeAccounts,
  markAsNonPending,
  editAccount,
  activateAccount,
  unlockWallet,
  resetWallet,
  setFinishedOnboarding,
  setReplaceAccountOptions,
  toggleFlashbots,
  setNFTViewType,
  setTokensOrderBy,
} = slice.actions

export const walletReducer = slice.reducer
