import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { NFTViewType, TokensOrderBy } from 'wallet/src/features/wallet/types'
import { areAddressesEqual, getValidAddress } from 'wallet/src/utils/addresses'

export const HIDE_SMALL_USD_BALANCES_THRESHOLD = 1

export enum SwapProtectionSetting {
  On = 'on',
  Off = 'off',
}

export interface WalletState {
  accounts: Record<Address, Account>
  activeAccountAddress: Address | null
  finishedOnboarding?: boolean
  isUnlocked: boolean
  // Persisted UI configs set by the user through interaction with filters and settings
  settings: {
    nftViewType?: NFTViewType

    // Settings used in the top tokens list
    hideSmallBalances: boolean
    hideSpamTokens: boolean
    tokensOrderBy?: TokensOrderBy

    swapProtection: SwapProtectionSetting
  }

  // Tracks app rating
  appRatingPromptedMs?: number // last time user as prompted to provide rating/feedback
  appRatingProvidedMs?: number // last time user provided rating (through native modal)
  appRatingFeedbackProvidedMs?: number // last time user provided feedback (form)
}

export const initialWalletState: WalletState = {
  accounts: {},
  activeAccountAddress: null,
  isUnlocked: false,
  settings: {
    swapProtection: SwapProtectionSetting.On,
    hideSmallBalances: true,
    hideSpamTokens: true,
  },
}

const slice = createSlice({
  name: 'wallet',
  initialState: initialWalletState,
  reducers: {
    addAccount: (state, action: PayloadAction<Account>) => {
      const { address } = action.payload
      const id = getValidAddress(address, true)
      if (!id) {
        throw new Error(`Cannot add an account with an invalid address ${address}`)
      }
      state.accounts[id] = action.payload
    },
    addAccounts: (state, action: PayloadAction<Account[]>) => {
      const accounts = action.payload
      accounts.forEach((account) => {
        const id = getValidAddress(account.address, true)
        if (!id) {
          throw new Error(`Cannot add an account with an invalid address ${account.address}`)
        }
        state.accounts[id] = account
      })
    },
    removeAccount: (state, action: PayloadAction<Address>) => {
      const address = action.payload
      const id = getValidAddress(address, true)
      if (!id) {
        throw new Error('Cannot remove an account with an invalid address')
      }
      if (!state.accounts[id]) {
        throw new Error(`Cannot remove missing account ${id}`)
      }
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
        if (!id) {
          throw new Error('Cannot remove an account with an invalid address')
        }
        if (!state.accounts[id]) {
          throw new Error(`Cannot remove missing account ${id}`)
        }
        delete state.accounts[id]
      })
      // Reset active account to first account if it exists
      const firstAccountId = Object.keys(state.accounts)[0]
      state.activeAccountAddress = firstAccountId ?? null
    },
    setAccountsNonPending: (state, action: PayloadAction<Address[]>) => {
      const addresses = action.payload
      addresses.forEach((address) => {
        const id = getValidAddress(address, true)
        if (!id) {
          throw new Error('Cannot operate on an invalid address')
        }
        const account = state.accounts[id]
        if (!account) {
          throw new Error(`Cannot enable missing account ${id}`)
        }
        account.pending = false
      })
    },
    editAccount: (state, action: PayloadAction<{ address: Address; updatedAccount: Account }>) => {
      const { address, updatedAccount } = action.payload
      const id = getValidAddress(address, true)
      if (!id) {
        throw new Error('Cannot edit an account with an invalid address')
      }
      if (!state.accounts[id]) {
        throw new Error(`Cannot edit missing account ${id}`)
      }
      state.accounts[id] = updatedAccount
    },
    setAccountAsActive: (state, action: PayloadAction<Address>) => {
      const address = action.payload
      const id = getValidAddress(address, true)
      if (!id) {
        throw new Error('Cannot activate an account with an invalid address')
      }
      if (!state.accounts[id]) {
        throw new Error(`Cannot activate missing account ${id}`)
      }
      state.activeAccountAddress = id
    },
    unlockWallet: (state) => {
      state.isUnlocked = true
    },
    lockWallet: (state) => {
      state.isUnlocked = false
    },
    setFinishedOnboarding: (
      state,
      { payload: { finishedOnboarding } }: PayloadAction<{ finishedOnboarding: boolean }>
    ) => {
      state.finishedOnboarding = finishedOnboarding
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
    setSwapProtectionSetting: (
      state,
      {
        payload: { newSwapProtectionSetting },
      }: PayloadAction<{ newSwapProtectionSetting: SwapProtectionSetting }>
    ) => {
      state.settings.swapProtection = newSwapProtectionSetting
    },
    setHideSmallBalances: (state, { payload }: PayloadAction<boolean>) => {
      state.settings.hideSmallBalances = payload
    },
    setHideSpamTokens: (state, { payload }: PayloadAction<boolean>) => {
      state.settings.hideSpamTokens = payload
    },
    setAppRating: (
      state,
      {
        payload: { ratingProvided, feedbackProvided },
      }: PayloadAction<{ ratingProvided?: boolean; feedbackProvided?: boolean }>
    ) => {
      state.appRatingPromptedMs = Date.now()

      if (ratingProvided) {
        state.appRatingProvidedMs = Date.now()
      }
      if (feedbackProvided) {
        state.appRatingFeedbackProvidedMs = Date.now()
      }
    },
    resetWallet: () => initialWalletState,
    restoreMnemonicComplete: (state) => state,
  },
})

export const {
  addAccount,
  addAccounts,
  removeAccount,
  removeAccounts,
  setAccountsNonPending,
  editAccount,
  setAccountAsActive,
  unlockWallet,
  lockWallet,
  resetWallet,
  setFinishedOnboarding,
  setNFTViewType,
  setTokensOrderBy,
  restoreMnemonicComplete,
  setSwapProtectionSetting,
  setHideSmallBalances,
  setHideSpamTokens,
  setAppRating,
} = slice.actions

export const walletReducer = slice.reducer
