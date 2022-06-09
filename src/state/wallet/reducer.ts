import { createSlice } from '@reduxjs/toolkit'
import { Wallet } from 'connectors'

export interface WalletState {
  errorByWallet: Record<Wallet, string | undefined>
}

export const initialState: WalletState = {
  errorByWallet: {
    [Wallet.INJECTED]: undefined,
    [Wallet.FORTMATIC]: undefined,
    [Wallet.WALLET_CONNECT]: undefined,
    [Wallet.COINBASE_WALLET]: undefined,
    [Wallet.NETWORK]: undefined,
    [Wallet.GNOSIS_SAFE]: undefined,
  },
}

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    updateWalletError(
      state,
      { payload: { wallet, error } }: { payload: { wallet: Wallet; error: string | undefined } }
    ) {
      state.errorByWallet[wallet] = error
    },
  },
})

export const { updateWalletError } = walletSlice.actions
export default walletSlice.reducer
