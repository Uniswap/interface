import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Account } from 'src/features/wallet/accounts/types'
import { areAddressesEqual, normalizeAddress } from 'src/utils/addresses'

export enum HardwareDeviceType {
  LEDGER = 'LEDGER',
}

interface HardwareDevice {
  type: HardwareDeviceType
  id: string
}

interface Wallet {
  accounts: Record<Address, Account>
  activeAccountAddress: Address | null
  bluetooth: boolean
  finishedOnboarding?: boolean
  flashbotsEnabled: boolean
  hardwareDevices: HardwareDevice[]
  isUnlocked: boolean
}

const initialState: Wallet = {
  accounts: {},
  activeAccountAddress: null,
  bluetooth: false,
  flashbotsEnabled: false,
  hardwareDevices: [],
  isUnlocked: false,
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
      if (state.activeAccountAddress && areAddressesEqual(state.activeAccountAddress, address)) {
        const firstAccountId = Object.keys(state.accounts)[0]
        state.activeAccountAddress = firstAccountId
      }
    },
    markAsNonPending: (state, action: PayloadAction<Address>) => {
      const address = action.payload
      const id = normalizeAddress(address)
      if (!state.accounts[id]) throw new Error(`Cannot enable missing account ${id}`)
      state.accounts[id].pending = false
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
      state.activeAccountAddress = id
    },
    unlockWallet: (state) => {
      state.isUnlocked = true
    },
    toggleFlashbots: (state, action: PayloadAction<boolean>) => {
      state.flashbotsEnabled = action.payload
    },
    addHardwareDevice: (state, action: PayloadAction<HardwareDevice>) => {
      state.hardwareDevices ??= []
      state.hardwareDevices.push(action.payload)
    },
    toggleBluetooth: (state, action: PayloadAction<boolean>) => {
      state.bluetooth = action.payload
    },
    setFinishedOnboarding: (
      state,
      { payload: { finishedOnboarding } }: PayloadAction<{ finishedOnboarding: boolean }>
    ) => {
      state.finishedOnboarding = finishedOnboarding
    },
    resetWallet: () => initialState,
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
  addHardwareDevice,
  toggleBluetooth,
  setFinishedOnboarding,
  toggleFlashbots,
} = slice.actions

export const walletReducer = slice.reducer
