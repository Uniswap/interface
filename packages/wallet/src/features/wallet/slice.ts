import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RankingType } from '@universe/api'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { areAddressesEqual, getValidAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { ExploreOrderBy } from 'wallet/src/features/wallet/types'

export enum SwapProtectionSetting {
  On = 'on',
  Off = 'off',
}

export interface WalletSliceState {
  accounts: Record<Address, Account>
  activeAccountAddress: Address | null
  finishedOnboarding?: boolean
  androidCloudBackupEmail: string | null
  // Persisted UI configs set by the user through interaction with filters and settings
  settings: {
    swapProtection: SwapProtectionSetting
    tokensOrderBy?: ExploreOrderBy
  }

  // Tracks app rating
  appRatingPromptedMs?: number // last time user as prompted to provide rating/feedback
  appRatingProvidedMs?: number // last time user provided rating (through native modal)
  appRatingFeedbackProvidedMs?: number // last time user provided feedback (form)
}

export const initialWalletState: WalletSliceState = {
  accounts: {},
  activeAccountAddress: null,
  settings: {
    swapProtection: SwapProtectionSetting.On,
    tokensOrderBy: RankingType.Volume,
  },
  androidCloudBackupEmail: null,
}

// TODO(WALL-7065): Update to support Solana
const slice = createSlice({
  name: 'wallet',
  initialState: initialWalletState,
  reducers: {
    addAccount: (state, action: PayloadAction<Account>) => {
      const { address } = action.payload
      const id = getValidAddress({ address, platform: Platform.EVM, withEVMChecksum: true })
      if (!id) {
        throw new Error(`Cannot add an account with an invalid address ${address}`)
      }
      state.accounts[id] = action.payload
    },
    addAccounts: (state, action: PayloadAction<Account[]>) => {
      const accounts = action.payload
      accounts.forEach((account) => {
        const id = getValidAddress({
          address: account.address,
          platform: Platform.EVM,
          withEVMChecksum: true,
        })
        if (!id) {
          throw new Error(`Cannot add an account with an invalid address ${account.address}`)
        }
        state.accounts[id] = account
      })
    },
    removeAccounts: (state, action: PayloadAction<Address[]>) => {
      const addressesToRemove = action.payload
      addressesToRemove.forEach((address) => {
        const id = getValidAddress({ address, platform: Platform.EVM, withEVMChecksum: true })
        if (!id) {
          throw new Error('Cannot remove an account with an invalid address')
        }
        if (!state.accounts[id]) {
          throw new Error(`Cannot remove missing account ${id}`)
        }
        delete state.accounts[id]
      })

      // Reset active account to first account if currently active account is deleted
      if (
        state.activeAccountAddress &&
        addressesToRemove.some((addressToRemove) =>
          // TODO(WALL-7065): Update to support solana
          areAddressesEqual({
            addressInput1: { address: addressToRemove, platform: Platform.EVM },
            addressInput2: { address: state.activeAccountAddress, platform: Platform.EVM },
          }),
        )
      ) {
        const firstAccountId = Object.keys(state.accounts)[0]
        state.activeAccountAddress = firstAccountId ?? null
      }
    },
    editAccount: (state, action: PayloadAction<{ address: Address; updatedAccount: Account }>) => {
      const { address, updatedAccount } = action.payload
      const id = getValidAddress({ address, platform: Platform.EVM, withEVMChecksum: true })
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
      const id = getValidAddress({ address, platform: Platform.EVM, withEVMChecksum: true })
      if (!id) {
        throw new Error('Cannot activate an account with an invalid address')
      }
      if (!state.accounts[id]) {
        throw new Error(`Cannot activate missing account ${id}`)
      }
      state.activeAccountAddress = id
    },
    setFinishedOnboarding: (
      state,
      { payload: { finishedOnboarding } }: PayloadAction<{ finishedOnboarding: boolean }>,
    ) => {
      state.finishedOnboarding = finishedOnboarding
    },
    setTokensOrderBy: (
      state,
      { payload: { newTokensOrderBy } }: PayloadAction<{ newTokensOrderBy: ExploreOrderBy }>,
    ) => {
      state.settings.tokensOrderBy = newTokensOrderBy
    },
    setSwapProtectionSetting: (
      state,
      { payload: { newSwapProtectionSetting } }: PayloadAction<{ newSwapProtectionSetting: SwapProtectionSetting }>,
    ) => {
      state.settings.swapProtection = newSwapProtectionSetting
    },
    setAppRating: (
      state,
      {
        payload: { ratingProvided, feedbackProvided },
      }: PayloadAction<{ ratingProvided?: boolean; feedbackProvided?: boolean }>,
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
    setHasBalanceOrActivity: (state, action: PayloadAction<{ address: Address; hasBalanceOrActivity?: boolean }>) => {
      const { address, hasBalanceOrActivity } = action.payload
      const id = getValidAddress({ address, platform: Platform.EVM, withEVMChecksum: true })
      if (!id) {
        logger.error('Unexpected call to `setHasBalanceOrActivity` with invalid `address`', {
          extra: { payload: action.payload },
          tags: { file: 'wallet/slice.ts', function: 'setHasBalanceOrActivity' },
        })
        return
      }
      const account = state.accounts[id]
      if (account) {
        account.hasBalanceOrActivity = hasBalanceOrActivity
      }
    },
    setSmartWalletConsent: (state, action: PayloadAction<{ address: Address; smartWalletConsent: boolean }>) => {
      const { address, smartWalletConsent } = action.payload
      const id = getValidAddress({ address, platform: Platform.EVM, withEVMChecksum: true })
      if (!id) {
        logger.error(new Error('Unexpected call to `setSmartWalletConsent` with invalid `address`'), {
          extra: { payload: action.payload },
          tags: { file: 'wallet/slice.ts', function: 'setSmartWalletConsent' },
        })
        return
      }
      const account = state.accounts[id]
      if (account && account.type === AccountType.SignerMnemonic) {
        account.smartWalletConsent = smartWalletConsent
      }
    },
    setAndroidCloudBackupEmail: (state, action: PayloadAction<{ email: string }>) => {
      state.androidCloudBackupEmail = action.payload.email
    },
  },
})

export const {
  addAccount,
  addAccounts,
  removeAccounts,
  editAccount,
  setAccountAsActive,
  resetWallet,
  setFinishedOnboarding,
  setTokensOrderBy,
  restoreMnemonicComplete,
  setSwapProtectionSetting,
  setAppRating,
  setHasBalanceOrActivity,
  setSmartWalletConsent,
  setAndroidCloudBackupEmail,
} = slice.actions

export const walletReducer = slice.reducer
