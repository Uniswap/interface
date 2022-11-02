import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TokensOrderBy } from 'src/features/explore/types'
import { Account } from 'src/features/wallet/accounts/types'
import { NFTViewType, TokensMetadataDisplayType } from 'src/features/wallet/types'
import { areAddressesEqual, getChecksumAddress } from 'src/utils/addresses'
import { next } from 'src/utils/array'

export const HIDE_SMALL_USD_BALANCES_THRESHOLD = 1

// Used to cycle through metadata to display on Explore token list
const TOKENS_METADATA_DISPLAY_TYPES = [
  TokensMetadataDisplayType.MarketCap,
  TokensMetadataDisplayType.PriceChangePercentage24h,
]

interface Wallet {
  accounts: Record<Address, Account>
  activeAccountAddress: Address | null
  finishedOnboarding?: boolean
  flashbotsEnabled: boolean
  isUnlocked: boolean
  // Persisted UI configs set by the user through interaction with filters and settings
  settings: {
    nftViewType?: NFTViewType

    // Settings used in the top tokens list
    tokensOrderBy?: TokensOrderBy
    tokensMetadataDisplayType?: TokensMetadataDisplayType
  }
}

export const initialWalletState: Wallet = {
  accounts: {},
  activeAccountAddress: null,
  flashbotsEnabled: false,
  isUnlocked: false,
  settings: {},
}

const slice = createSlice({
  name: 'wallet',
  initialState: initialWalletState,
  reducers: {
    addAccount: (state, action: PayloadAction<Account>) => {
      const { address } = action.payload
      const id = getChecksumAddress(address)
      state.accounts[id] = action.payload
    },
    removeAccount: (state, action: PayloadAction<Address>) => {
      const address = action.payload
      const id = getChecksumAddress(address)
      if (!state.accounts[id]) throw new Error(`Cannot remove missing account ${id}`)
      delete state.accounts[id]
      // If removed account was active, activate first one
      if (state.activeAccountAddress && areAddressesEqual(state.activeAccountAddress, address)) {
        const firstAccountId = Object.keys(state.accounts)[0]
        state.activeAccountAddress = firstAccountId
      }
    },
    markAsNonPending: (state, action: PayloadAction<Address>) => {
      const address = action.payload
      const id = getChecksumAddress(address)
      if (!state.accounts[id]) throw new Error(`Cannot enable missing account ${id}`)
      state.accounts[id].pending = false
    },
    editAccount: (state, action: PayloadAction<{ address: Address; updatedAccount: Account }>) => {
      const { address, updatedAccount } = action.payload
      const id = getChecksumAddress(address)
      if (!state.accounts[id]) throw new Error(`Cannot edit missing account ${id}`)
      state.accounts[id] = updatedAccount
    },
    activateAccount: (state, action: PayloadAction<Address>) => {
      const address = action.payload
      const id = getChecksumAddress(address)
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
    setNFTViewType: (state, action: PayloadAction<NFTViewType>) => {
      state.settings.nftViewType = action.payload
    },
    setTokensOrderBy: (
      state,
      { payload: { newTokensOrderBy } }: PayloadAction<{ newTokensOrderBy: TokensOrderBy }>
    ) => {
      state.settings.tokensOrderBy = newTokensOrderBy

      // Unset metadata display type to fallback to order by value
      state.settings.tokensMetadataDisplayType = undefined
    },
    cycleTokensMetadataDisplayType: (state) => {
      state.settings.tokensMetadataDisplayType =
        next(TOKENS_METADATA_DISPLAY_TYPES, state.settings.tokensMetadataDisplayType) ??
        TOKENS_METADATA_DISPLAY_TYPES[0]
    },
    resetWallet: () => initialWalletState,
  },
})

export const {
  addAccount,
  removeAccount,
  markAsNonPending,
  editAccount,
  activateAccount,
  unlockWallet,
  resetWallet,
  setFinishedOnboarding,
  toggleFlashbots,
  setNFTViewType,
  setTokensOrderBy,
  cycleTokensMetadataDisplayType,
} = slice.actions

export const walletReducer = slice.reducer
