import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { areAddressesEqual, isValidAddress } from 'src/utils/addresses'
import { isValidDerivationPath } from 'src/utils/mnemonics'
import { assert } from 'src/utils/validation'

interface Wallet {
  isUnlocked: boolean
  currentAccount: {
    address: string
    derivationPath: string | null
    chainId: number
  } | null
}

interface SetAccountAction {
  address: string
  derivationPath: string
  chainId: number
}

const initialState: Wallet = {
  isUnlocked: false,
  currentAccount: null,
}

const slice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setAccount: (state, action: PayloadAction<SetAccountAction>) => {
      const { address, derivationPath, chainId } = action.payload
      state.isUnlocked = true
      assert(address && isValidAddress(address), `Invalid address ${address}`)
      assert(isValidDerivationPath(derivationPath), `Invalid derivationPath ${derivationPath}`)
      assert(chainId && chainId > 0, `Invalid chainId ${chainId}`)
      if (state.currentAccount?.address && areAddressesEqual(state.currentAccount.address, address))
        return
      state.currentAccount = { address, derivationPath, chainId }
    },
    resetWallet: () => initialState,
  },
})

export const { setAccount, resetWallet } = slice.actions

export const walletReducer = slice.reducer
